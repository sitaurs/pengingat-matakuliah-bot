import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { gowaClient } from '../gowa/client.js';
import { formatReminder } from '../utils/format.js';
import { buildReminderQueue } from './queue-builder.js';
import logger from '../utils/logger.js';
import { config } from '../config.js';

const MAX_RETRIES = 3;

/**
 * Process due reminders: send via GoWA, update status.
 */
async function processDueReminders(prisma: PrismaClient): Promise<void> {
  const now = new Date();

  // Find all pending reminders that are due
  const dueReminders = await prisma.reminderQueue.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now },
    },
    include: {
      chatTarget: true,
    },
    orderBy: { scheduledAt: 'asc' },
    take: 20, // Process max 20 at a time to avoid overload
  });

  if (dueReminders.length === 0) return;

  logger.info(`Processing ${dueReminders.length} due reminders`);

  for (const reminder of dueReminders) {
    try {
      // Get the schedule entry with course info
      let message = reminder.message;

      if (!message && reminder.scheduleEntryId) {
        const entry = await prisma.scheduleEntry.findUnique({
          where: { id: reminder.scheduleEntryId },
          include: { course: true },
        });

        if (entry) {
          const note = await prisma.note.findUnique({
            where: { courseId: entry.courseId },
          });

          message = formatReminder(
            reminder.eventType,
            entry,
            note?.text,
            reminder.chatTarget.reminderOffset
          );
        }
      }

      if (!message) {
        message = `⏰ Reminder: Event ${reminder.eventType}`;
      }

      // Send via GoWA
      const success = await gowaClient.sendMessageWithRetry(
        reminder.chatTarget.chatId,
        message,
        2
      );

      if (success) {
        await prisma.reminderQueue.update({
          where: { id: reminder.id },
          data: { status: 'SENT', sentAt: new Date(), message },
        });
        logger.info(`Reminder ${reminder.id} sent to ${reminder.chatTarget.chatId}`);
      } else {
        const newRetryCount = reminder.retryCount + 1;
        const newStatus = newRetryCount >= MAX_RETRIES ? 'FAILED' : 'PENDING';

        await prisma.reminderQueue.update({
          where: { id: reminder.id },
          data: {
            status: newStatus,
            retryCount: newRetryCount,
            message,
          },
        });
        logger.warn(`Reminder ${reminder.id} failed (retry ${newRetryCount}/${MAX_RETRIES})`);
      }
    } catch (err: any) {
      logger.error(`Error processing reminder ${reminder.id}: ${err.message}`);
      await prisma.reminderQueue.update({
        where: { id: reminder.id },
        data: { status: 'FAILED', retryCount: reminder.retryCount + 1 },
      });
    }

    // Small delay between sends to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
}

/**
 * Start the reminder scheduler with cron jobs.
 */
export function startScheduler(prisma: PrismaClient): void {
  // Process due reminders every minute
  cron.schedule('* * * * *', async () => {
    try {
      await processDueReminders(prisma);
    } catch (err: any) {
      logger.error(`Scheduler error: ${err.message}`);
    }
  }, { timezone: 'Asia/Jakarta' });

  logger.info('⏰ Reminder worker started (every 1 minute)');

  // Rebuild queue daily at 00:05 WIB
  cron.schedule('5 0 * * *', async () => {
    try {
      logger.info('Rebuilding reminder queue (daily)...');
      await buildReminderQueue(prisma);
    } catch (err: any) {
      logger.error(`Queue rebuild error: ${err.message}`);
    }
  }, { timezone: 'Asia/Jakarta' });

  logger.info('📋 Queue builder scheduled (daily 00:05 WIB)');

  // Initial queue build on startup
  setTimeout(async () => {
    try {
      logger.info('Building initial reminder queue...');
      await buildReminderQueue(prisma);
    } catch (err: any) {
      logger.error(`Initial queue build error: ${err.message}`);
    }
  }, 5000); // Wait 5s for app to fully start
}
