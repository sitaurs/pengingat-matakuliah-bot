import type { CommandContext } from './router.js';
import { formatWeekSchedule } from '../utils/format.js';

export async function handleJadwal(ctx: CommandContext): Promise<string> {
  const entries = await ctx.prisma.scheduleEntry.findMany({
    where: { enabled: true },
    include: { course: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  if (entries.length === 0) {
    return '📋 Belum ada jadwal yang terdaftar.';
  }

  const byDay = new Map<number, typeof entries>();
  for (const entry of entries) {
    const day = entry.dayOfWeek;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(entry);
  }

  return formatWeekSchedule(byDay);
}
