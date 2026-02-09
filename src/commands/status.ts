import type { CommandContext } from './router.js';
import { nowWIB, todayWIB } from '../utils/time.js';
import { gowaClient } from '../gowa/client.js';

export async function handleStatus(ctx: CommandContext): Promise<string> {
  const { prisma } = ctx;

  // Count pending reminders today
  const today = todayWIB();
  const tomorrow = nowWIB().add(1, 'day').format('YYYY-MM-DD');

  const pendingCount = await prisma.reminderQueue.count({
    where: {
      status: 'PENDING',
      scheduledAt: {
        gte: new Date(`${today}T00:00:00+07:00`),
        lt: new Date(`${tomorrow}T00:00:00+07:00`),
      },
    },
  });

  const sentToday = await prisma.reminderQueue.count({
    where: {
      status: 'SENT',
      scheduledAt: {
        gte: new Date(`${today}T00:00:00+07:00`),
        lt: new Date(`${tomorrow}T00:00:00+07:00`),
      },
    },
  });

  const failedCount = await prisma.reminderQueue.count({
    where: { status: 'FAILED' },
  });

  const groupCount = await prisma.chatTarget.count({
    where: { enabled: true },
  });

  // GoWA health
  const gowaHealth = await gowaClient.healthCheck();

  return [
    '┌─────────────────────────┐',
    '│  📊 *BOTTY STATUS*',
    '└─────────────────────────┘',
    '',
    `🤖 *Botty:* ✅ Online`,
    `📡 *GoWA:* ${gowaHealth.ok ? '✅ Connected' : '❌ ' + gowaHealth.status}`,
    `👥 *Grup aktif:* ${groupCount}`,
    '',
    `📅 *Hari ini (${today})*`,
    `⏳ Pending: *${pendingCount}*`,
    `✅ Terkirim: *${sentToday}*`,
    `❌ Gagal total: *${failedCount}*`,
    '',
    `🕐 ${nowWIB().format('HH:mm:ss')} WIB`,
  ].join('\n');
}
