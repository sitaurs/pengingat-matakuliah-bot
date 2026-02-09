import type { CommandContext } from './router.js';

export async function handleNote(ctx: CommandContext): Promise<string> {
  const subCommand = ctx.args[0]?.toLowerCase();

  if (!subCommand || !['set', 'get', 'clear'].includes(subCommand)) {
    return [
      '📝 *Command Note*',
      '▸ `!note set <matkul> | <teks>` — Set note',
      '▸ `!note get <matkul>` — Lihat note',
      '▸ `!note clear <matkul>` — Hapus note',
    ].join('\n');
  }

  if (subCommand === 'set') {
    const rest = ctx.args.slice(1).join(' ');
    const pipeIndex = rest.indexOf('|');
    if (pipeIndex === -1) {
      return '❓ Format: `!note set <matkul> | <teks>`\nContoh: `!note set antena | Bawa kabel coaxial`';
    }

    const matkulQuery = rest.slice(0, pipeIndex).trim().toLowerCase();
    const noteText = rest.slice(pipeIndex + 1).trim();

    if (!matkulQuery || !noteText) {
      return '❓ Matkul dan teks note tidak boleh kosong.';
    }

    const course = await ctx.prisma.course.findFirst({
      where: { name: { contains: matkulQuery } },
    });

    if (!course) {
      return `🔍 Matkul "${matkulQuery}" tidak ditemukan.`;
    }

    await ctx.prisma.note.upsert({
      where: { courseId: course.id },
      create: { courseId: course.id, text: noteText },
      update: { text: noteText },
    });

    return `✅ *Note berhasil di-set!*\n📚 *${course.name}*\n📝 ${noteText}`;
  }

  if (subCommand === 'get') {
    const matkulQuery = ctx.args.slice(1).join(' ').toLowerCase().trim();
    if (!matkulQuery) {
      // Show all notes
      const notes = await ctx.prisma.note.findMany({ include: { course: true } });
      if (notes.length === 0) return '📝 _Belum ada note yang di-set._';

      const lines = [
        '┌─────────────────────────┐',
        '│  📝 *SEMUA NOTES*',
        '└─────────────────────────┘',
        '',
      ];
      for (const n of notes) {
        lines.push(`📚 *${n.course.name}*`);
        lines.push(`   ${n.text}`);
        lines.push('');
      }
      return lines.join('\n').trim();
    }

    const course = await ctx.prisma.course.findFirst({
      where: { name: { contains: matkulQuery } },
    });

    if (!course) return `🔍 Matkul "${matkulQuery}" tidak ditemukan.`;

    const note = await ctx.prisma.note.findUnique({
      where: { courseId: course.id },
    });

    if (!note) {
      const defaultNote = course.defaultNote || 'Tidak ada note.';
      return `📝 *${course.name}*\n${defaultNote}`;
    }

    return `📝 *${course.name}*\n${note.text}`;
  }

  if (subCommand === 'clear') {
    const matkulQuery = ctx.args.slice(1).join(' ').toLowerCase().trim();
    if (!matkulQuery) return '❓ Format: `!note clear <matkul>`';

    const course = await ctx.prisma.course.findFirst({
      where: { name: { contains: matkulQuery } },
    });

    if (!course) return `🔍 Matkul "${matkulQuery}" tidak ditemukan.`;

    await ctx.prisma.note.deleteMany({ where: { courseId: course.id } });
    return `✅ Note untuk *${course.name}* berhasil dihapus.`;
  }

  return '❓ Sub-command tidak dikenal. Gunakan `set`, `get`, atau `clear`.';
}
