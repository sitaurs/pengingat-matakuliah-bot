import type { CommandContext } from './router.js';
import { gowaClient } from '../gowa/client.js';
import { formatReminder } from '../utils/format.js';
import { currentDayOfWeek, nowWIB } from '../utils/time.js';

export async function handleReminderCmd(ctx: CommandContext): Promise<string> {
  const subCommand = ctx.args[0]?.toLowerCase();

  if (!subCommand) {
    return [
      '⏰ *Command Reminder*',
      '▸ `!reminder on` — Aktifkan reminder',
      '▸ `!reminder off` — Nonaktifkan reminder',
      '▸ `!reminder test` — Kirim contoh reminder',
      '▸ `!reminder offset <menit>` — Ubah offset (default: 15)',
    ].join('\n');
  }

  if (!ctx.chatTarget) {
    return '❌ Grup ini belum terdaftar di bot.';
  }

  if (subCommand === 'on') {
    await ctx.prisma.chatTarget.update({
      where: { id: ctx.chatTarget.id },
      data: { allowReminders: true },
    });
    return '✅ Reminder *diaktifkan* untuk grup ini! 🔔';
  }

  if (subCommand === 'off') {
    await ctx.prisma.chatTarget.update({
      where: { id: ctx.chatTarget.id },
      data: { allowReminders: false },
    });
    return '⏸️ Reminder *dinonaktifkan* untuk grup ini.';
  }

  if (subCommand === 'test') {
    // Find today's first class for preview
    const dow = currentDayOfWeek();
    const entry = await ctx.prisma.scheduleEntry.findFirst({
      where: { dayOfWeek: dow, enabled: true },
      include: { course: true },
      orderBy: { startTime: 'asc' },
    });

    if (!entry) {
      return '📭 Tidak ada kelas hari ini untuk di-test.';
    }

    const note = await ctx.prisma.note.findUnique({
      where: { courseId: entry.courseId },
    });

    const preview = formatReminder('PRE_CLASS', entry, note?.text, ctx.chatTarget.reminderOffset);
    return `📋 *Preview Reminder:*\n\n${preview}\n\n_(Ini hanya preview, bukan reminder asli)_`;
  }

  if (subCommand === 'offset') {
    const minutes = parseInt(ctx.args[1]);
    if (isNaN(minutes) || minutes < 1 || minutes > 60) {
      return '❓ Offset harus angka 1-60 menit.\nContoh: `!reminder offset 10`';
    }

    await ctx.prisma.chatTarget.update({
      where: { id: ctx.chatTarget.id },
      data: { reminderOffset: minutes },
    });
    return `✅ Offset reminder diubah menjadi *${minutes} menit* sebelum kelas ⏰`;
  }

  return '❓ Sub-command tidak dikenal. Gunakan `on`, `off`, `test`, atau `offset`.';
}
