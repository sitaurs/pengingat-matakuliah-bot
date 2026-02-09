import type { CommandContext } from './router.js';
import { currentDayOfWeek, dayName } from '../utils/time.js';
import { formatDaySchedule } from '../utils/format.js';

export async function handleHari(ctx: CommandContext): Promise<string> {
  const dow = currentDayOfWeek();

  const entries = await ctx.prisma.scheduleEntry.findMany({
    where: { dayOfWeek: dow, enabled: true },
    include: { course: true },
    orderBy: { startTime: 'asc' },
  });

  if (entries.length === 0) {
    return `📅 *${dayName(dow)}*\n\n🎉 Tidak ada kelas hari ini!\n✨ _Enjoy your free time~_`;
  }

  return formatDaySchedule(dow, entries);
}
