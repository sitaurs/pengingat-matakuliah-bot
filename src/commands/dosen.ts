import type { CommandContext } from './router.js';

export async function handleDosen(ctx: CommandContext): Promise<string> {
  const query = ctx.args.join(' ').toLowerCase().trim();

  if (!query) {
    return '❓ *Penggunaan:* `!dosen <nama/kode/matkul>`\n📝 Contoh: `!dosen rizky` atau `!dosen antena`';
  }

  const courses = await ctx.prisma.course.findMany();

  const matches = courses.filter(c =>
    c.lecturerName.toLowerCase().includes(query) ||
    (c.lecturerCode && c.lecturerCode.toLowerCase().includes(query)) ||
    c.name.toLowerCase().includes(query)
  );

  if (matches.length === 0) {
    return `🔍 _Tidak ditemukan dosen/matkul dengan kata kunci_ "*${query}*"`;
  }

  // Deduplicate by lecturer name
  const seen = new Set<string>();
  const lines: string[] = [
    '┌─────────────────────────┐',
    '│  👤 *HASIL PENCARIAN DOSEN*',
    '└─────────────────────────┘',
    '',
  ];

  for (const c of matches) {
    const key = c.lecturerName;
    if (seen.has(key)) continue;
    seen.add(key);

    lines.push(`👤 *${c.lecturerName}*`);
    if (c.lecturerCode) lines.push(`🏷️ *Kode:* ${c.lecturerCode}`);
    lines.push(`📚 *Matkul:* ${c.name}`);
    if (c.lecturerWa) lines.push(`📱 *WA:* ${c.lecturerWa}`);
    lines.push('');
  }

  return lines.join('\n').trim();
}
