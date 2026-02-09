import type { CommandContext } from './router.js';
import { currentDayOfWeek, nowWIB, fmtTime } from '../utils/time.js';

export async function handleWhere(ctx: CommandContext): Promise<string> {
  const dow = currentDayOfWeek();
  const currentTime = nowWIB().format('HH:mm');

  const entries = await ctx.prisma.scheduleEntry.findMany({
    where: { dayOfWeek: dow, enabled: true },
    include: { course: true },
    orderBy: { startTime: 'asc' },
  });

  // Currently in class?
  const current = entries.find((e: typeof entries[number]) => e.startTime <= currentTime && e.endTime > currentTime);
  if (current) {
    const loc = current.locationOverride || current.course.locationDefault || '—';
    return [
      `📍 *Sekarang di:* ${loc}`,
      `📚 *${current.course.name}*`,
      `👤 ${current.course.lecturerName}`,
    ].join('\n');
  }

  // Next class today
  const next = entries.find((e: typeof entries[number]) => e.startTime > currentTime);
  if (next) {
    const loc = next.locationOverride || next.course.locationDefault || '—';
    return [
      `📍 *Kelas berikutnya di:* ${loc}`,
      `📚 *${next.course.name}*`,
      `🕐 ${fmtTime(next.startTime)}`,
    ].join('\n');
  }

  // Next day's first class
  for (let offset = 1; offset <= 7; offset++) {
    const nextDow = ((dow - 1 + offset) % 7) + 1;
    const nextEntries = await ctx.prisma.scheduleEntry.findMany({
      where: { dayOfWeek: nextDow, enabled: true },
      include: { course: true },
      orderBy: { startTime: 'asc' },
      take: 1,
    });
    if (nextEntries.length > 0) {
      const e = nextEntries[0];
      const loc = e.locationOverride || e.course.locationDefault || '—';
      const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      return [
        `📍 *Kelas berikutnya di:* ${loc}`,
        `📚 *${e.course.name}*`,
        `📅 ${dayNames[nextDow]} ${fmtTime(e.startTime)}`,
      ].join('\n');
    }
  }

  return '📍 _Tidak ada kelas yang dijadwalkan._';
}
