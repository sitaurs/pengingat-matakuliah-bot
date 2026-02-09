import type { CommandContext } from './router.js';
import { currentDayOfWeek, nowWIB, fmtTime, formatDuration, diffMinutes } from '../utils/time.js';

export async function handleNow(ctx: CommandContext): Promise<string> {
  const dow = currentDayOfWeek();
  const now = nowWIB();
  const currentTime = now.format('HH:mm');

  const entries = await ctx.prisma.scheduleEntry.findMany({
    where: { dayOfWeek: dow, enabled: true },
    include: { course: true },
    orderBy: { startTime: 'asc' },
  });

  if (entries.length === 0) {
    return '🟢 *Status Sekarang*\n\n🎉 Hari ini kosong! Tidak ada kelas.\n✨ _Nikmati waktu luangmu~_';
  }

  // Check if currently in a class
  const currentClass = entries.find(
    (e: typeof entries[number]) => e.startTime <= currentTime && e.endTime > currentTime
  );

  if (currentClass) {
    const loc = currentClass.locationOverride || currentClass.course.locationDefault || '—';
    const remaining = diffMinutes(currentTime, currentClass.endTime);
    return [
      '🟡 *Status Sekarang: SEDANG KELAS*',
      '',
      `📚 *${currentClass.course.name}*`,
      `📍 *Ruangan:* ${loc}`,
      `🕐 *Waktu:* ${fmtTime(currentClass.startTime)} – ${fmtTime(currentClass.endTime)}`,
      `⏳ *Sisa:* ${formatDuration(remaining)}`,
      '',
      '💪 _Semangat kuliah!_',
    ].join('\n');
  }

  // Check if between classes (break)
  const nextEntry = entries.find((e: typeof entries[number]) => e.startTime > currentTime);
  const prevEntry = [...entries].reverse().find((e: typeof entries[number]) => e.endTime <= currentTime);

  if (nextEntry && prevEntry) {
    const breakDuration = diffMinutes(prevEntry.endTime, nextEntry.startTime);
    const untilNext = diffMinutes(currentTime, nextEntry.startTime);
    return [
      '🟢 *Status Sekarang: JEDA/ISTIRAHAT*',
      '',
      `⏸️ Jeda ${formatDuration(breakDuration)}`,
      `⏭️ Kelas berikutnya: *${nextEntry.course.name}*`,
      `🕐 Mulai ${fmtTime(nextEntry.startTime)} (${formatDuration(untilNext)} lagi)`,
      '',
      '☕ _Istirahat dulu ya~_',
    ].join('\n');
  }

  if (nextEntry) {
    const untilNext = diffMinutes(currentTime, nextEntry.startTime);
    return [
      '🟢 *Status Sekarang: BELUM MULAI*',
      '',
      `⏭️ Kelas pertama: *${nextEntry.course.name}*`,
      `🕐 Mulai ${fmtTime(nextEntry.startTime)} (${formatDuration(untilNext)} lagi)`,
      '',
      '📖 _Persiapkan materinya dari sekarang ya!_',
    ].join('\n');
  }

  return '🟢 *Status Sekarang: SELESAI*\n\n🎉 Semua kelas hari ini sudah selesai!\n🏠 _Waktunya pulang & istirahat~_';
}
