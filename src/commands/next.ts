import type { CommandContext } from './router.js';
import { currentDayOfWeek, nowWIB, fmtTime, diffMinutes } from '../utils/time.js';
import { formatCountdown, formatEntryDetail } from '../utils/format.js';

export async function handleNext(ctx: CommandContext): Promise<string> {
  const dow = currentDayOfWeek();
  const now = nowWIB();
  const currentTime = now.format('HH:mm');

  // Find today's remaining entries
  let entries = await ctx.prisma.scheduleEntry.findMany({
    where: { dayOfWeek: dow, enabled: true },
    include: { course: true },
    orderBy: { startTime: 'asc' },
  });

  // Filter to upcoming entries
  let nextEntry = entries.find((e: typeof entries[number]) => e.startTime > currentTime);

  // If no more today, check next days
  if (!nextEntry) {
    for (let offset = 1; offset <= 7; offset++) {
      const nextDow = ((dow - 1 + offset) % 7) + 1;
      const nextEntries = await ctx.prisma.scheduleEntry.findMany({
        where: { dayOfWeek: nextDow, enabled: true },
        include: { course: true },
        orderBy: { startTime: 'asc' },
      });
      if (nextEntries.length > 0) {
        nextEntry = nextEntries[0];
        const daysAway = offset;
        const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        return [
          '⏭️ *Kelas Berikutnya*',
          '',
          formatEntryDetail(nextEntry),
          '',
          `📅 *${dayNames[nextDow]}* (${daysAway} hari lagi)`,
        ].join('\n');
      }
    }
    return '📭 _Tidak ada kelas yang dijadwalkan._';
  }

  // Calculate countdown in minutes
  const [nh, nm] = nextEntry.startTime.split(':').map(Number);
  const minutesUntil = (nh * 60 + nm) - (now.hour() * 60 + now.minute());

  // Check for note
  const note = await ctx.prisma.note.findUnique({
    where: { courseId: nextEntry.courseId },
  });

  return [
    '⏭️ *Kelas Berikutnya*',
    '',
    formatEntryDetail(nextEntry, note?.text),
    '',
    `⏳ ${formatCountdown(minutesUntil)}`,
  ].join('\n');
}
