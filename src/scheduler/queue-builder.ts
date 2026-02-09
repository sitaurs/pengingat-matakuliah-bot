import { PrismaClient } from '@prisma/client';
import { dayjs, TZ } from '../utils/time.js';
import logger from '../utils/logger.js';
import { config } from '../config.js';

/**
 * Generate reminder_queue entries for the next N days.
 * Runs on startup + daily at midnight WIB.
 */
export async function buildReminderQueue(prisma: PrismaClient): Promise<number> {
  const days = config.reminder.queueDays;
  let created = 0;

  // Get all active chat targets with reminders enabled
  const chatTargets = await prisma.chatTarget.findMany({
    where: { enabled: true, allowReminders: true },
  });

  if (chatTargets.length === 0) {
    logger.info('No chat targets with reminders enabled');
    return 0;
  }

  // Get all enabled schedule entries
  const scheduleEntries = await prisma.scheduleEntry.findMany({
    where: { enabled: true },
    include: { course: true },
  });

  // Get holidays
  const holidays = await prisma.holiday.findMany({
    where: { enabled: true },
  });
  const holidayDates = new Set(holidays.map((h: typeof holidays[number]) => h.date));

  const now = dayjs().tz(TZ);

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const date = now.add(dayOffset, 'day');
    const dateStr = date.format('YYYY-MM-DD');
    const dow = date.day() === 0 ? 7 : date.day(); // ISO weekday

    // Skip holidays
    if (holidayDates.has(dateStr)) {
      logger.debug(`Skipping holiday: ${dateStr}`);
      continue;
    }

    // Skip weekends (6=Saturday, 7=Sunday)
    if (dow >= 6) continue;

    // Filter entries for this day
    const dayEntries = scheduleEntries.filter((e: typeof scheduleEntries[number]) => e.dayOfWeek === dow);

    for (const chatTarget of chatTargets) {
      const offset = chatTarget.reminderOffset;

      for (const entry of dayEntries) {
        const eventTypes: { type: string; time: string }[] = [];

        // PRE_CLASS: offset minutes before start
        const preClassTime = dayjs.tz(`${dateStr} ${entry.startTime}`, TZ)
          .subtract(offset, 'minute');
        if (preClassTime.isAfter(now)) {
          eventTypes.push({
            type: 'PRE_CLASS',
            time: preClassTime.toISOString(),
          });
        }

        // CLASS_START: at start time
        const classStartTime = dayjs.tz(`${dateStr} ${entry.startTime}`, TZ);
        if (classStartTime.isAfter(now)) {
          eventTypes.push({
            type: 'CLASS_START',
            time: classStartTime.toISOString(),
          });
        }

        for (const evt of eventTypes) {
          try {
            await prisma.reminderQueue.upsert({
              where: {
                chatTargetId_eventType_scheduledAt: {
                  chatTargetId: chatTarget.id,
                  eventType: evt.type,
                  scheduledAt: new Date(evt.time),
                },
              },
              create: {
                chatTargetId: chatTarget.id,
                scheduleEntryId: entry.id,
                eventType: evt.type,
                scheduledAt: new Date(evt.time),
                status: 'PENDING',
              },
              update: {}, // No update if already exists
            });
            created++;
          } catch (err: any) {
            // Unique constraint violation means it already exists — that's OK
            if (!err.message?.includes('Unique constraint')) {
              logger.error(`Failed to create reminder: ${err.message}`);
            }
          }
        }
      }
    }
  }

  logger.info(`Reminder queue built: ${created} entries processed`);
  return created;
}
