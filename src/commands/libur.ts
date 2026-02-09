import type { CommandContext } from './router.js';

export async function handleLibur(ctx: CommandContext): Promise<string> {
  const subCommand = ctx.args[0]?.toLowerCase();

  if (!subCommand || !['add', 'list'].includes(subCommand)) {
    return [
      '📅 *Command Libur*',
      '▸ `!libur add YYYY-MM-DD | alasan` — Tambah hari libur',
      '▸ `!libur list` — Daftar hari libur',
    ].join('\n');
  }

  if (subCommand === 'add') {
    const rest = ctx.args.slice(1).join(' ');
    const pipeIndex = rest.indexOf('|');

    let dateStr: string;
    let reason: string;

    if (pipeIndex !== -1) {
      dateStr = rest.slice(0, pipeIndex).trim();
      reason = rest.slice(pipeIndex + 1).trim();
    } else {
      dateStr = rest.trim();
      reason = 'Libur';
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return '❓ Format tanggal: `YYYY-MM-DD`\nContoh: `!libur add 2026-03-01 | Hari Raya`';
    }

    // Check if already exists
    const existing = await ctx.prisma.holiday.findUnique({
      where: { date: dateStr },
    });

    if (existing) {
      return `📅 Tanggal *${dateStr}* sudah ada di daftar libur: _"${existing.reason}"_`;
    }

    await ctx.prisma.holiday.create({
      data: { date: dateStr, reason },
    });

    return `✅ *Libur ditambahkan!*\n📅 *Tanggal:* ${dateStr}\n📝 *Keterangan:* ${reason}`;
  }

  if (subCommand === 'list') {
    const holidays = await ctx.prisma.holiday.findMany({
      where: { enabled: true },
      orderBy: { date: 'asc' },
    });

    if (holidays.length === 0) {
      return '📅 _Belum ada hari libur yang terdaftar._';
    }

    const lines = [
      '┌─────────────────────────┐',
      '│  📅 *DAFTAR HARI LIBUR*',
      '└─────────────────────────┘',
      '',
    ];
    for (const h of holidays) {
      lines.push(`▸ 📅 *${h.date}* — ${h.reason}`);
    }

    return lines.join('\n');
  }

  return '❓ Sub-command tidak dikenal.';
}
