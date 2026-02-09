import type { CommandContext } from './router.js';
import { currentDayOfWeek, dayName } from '../utils/time.js';
import { formatEntryDetail } from '../utils/format.js';

export async function handleDetail(ctx: CommandContext): Promise<string> {
  const num = parseInt(ctx.args[0]);

  if (isNaN(num) || num < 1) {
    return '❓ Penggunaan: `!detail <nomor>`\nContoh: `!detail 2` (detail kelas ke-2 dari `!hari`)';
  }

  const dow = currentDayOfWeek();
  const entries = await ctx.prisma.scheduleEntry.findMany({
    where: { dayOfWeek: dow, enabled: true },
    include: { course: true },
    orderBy: { startTime: 'asc' },
  });

  if (entries.length === 0) {
    return `📅 _Tidak ada kelas hari ini (${dayName(dow)})_`;
  }

  if (num > entries.length) {
    return `❌ Hari ini hanya ada ${entries.length} kelas. Gunakan angka 1-${entries.length}.`;
  }

  const entry = entries[num - 1];

  // Get note
  const note = await ctx.prisma.note.findUnique({
    where: { courseId: entry.courseId },
  });

  return formatEntryDetail(entry, note?.text);
}
