import type { CommandContext } from './router.js';
import { tomorrowDayOfWeek, dayName } from '../utils/time.js';
import { formatDaySchedule } from '../utils/format.js';

export async function handleBesok(ctx: CommandContext): Promise<string> {
  const dow = tomorrowDayOfWeek();

  const entries = await ctx.prisma.scheduleEntry.findMany({
    where: { dayOfWeek: dow, enabled: true },
    include: { course: true },
    orderBy: { startTime: 'asc' },
  });

  if (entries.length === 0) {
    return `📅 *Besok (${dayName(dow)})*\n\n🎉 Tidak ada kelas besok!\n✨ _Yeay, bisa istirahat~_`;
  }

  return `📅 *Besok (${dayName(dow)})*\n\n` + formatDaySchedule(dow, entries);
}
