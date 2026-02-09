import type { Course, ScheduleEntry } from '@prisma/client';
import { fmtTime, diffMinutes, formatDuration, dayName, nowWIB } from './time.js';

type EntryWithCourse = ScheduleEntry & { course: Course };

// ═══════════════════════════════════════
//  QUOTES COLLECTION (random motivational)
// ═══════════════════════════════════════
const QUOTES: string[] = [
  "Pendidikan adalah senjata paling mematikan di dunia. — Nelson Mandela",
  "Belajar tanpa berpikir itu sia-sia, berpikir tanpa belajar itu berbahaya. — Confucius",
  "Investasi terbaik adalah investasi ilmu. — Benjamin Franklin",
  "Masa depan milik mereka yang mempersiapkan hari ini. — Malcolm X",
  "Kesuksesan bukanlah akhir, kegagalan bukanlah fatal. — Winston Churchill",
  "Satu-satunya cara melakukan pekerjaan hebat adalah mencintai apa yang kamu lakukan. — Steve Jobs",
  "Jangan biarkan apa yang tidak bisa kamu lakukan menghalangi apa yang bisa kamu lakukan. — John Wooden",
  "Ilmu itu lebih baik daripada harta. Ilmu menjagamu, kamu menjaga harta. — Ali bin Abi Thalib",
  "Hidup itu seperti naik sepeda, untuk menjaga keseimbangan kamu harus terus bergerak. — Albert Einstein",
  "Pendidikan bukan persiapan untuk hidup, pendidikan adalah hidup itu sendiri. — John Dewey",
  "Aku tidak pernah gagal. Aku hanya menemukan 10.000 cara yang tidak berhasil. — Thomas Edison",
  "Jatuh 7 kali, bangun 8 kali. — Pepatah Jepang",
  "Setiap ahli dulunya seorang pemula. — Helen Hayes",
  "Waktu terbaik menanam pohon adalah 20 tahun lalu. Waktu terbaik kedua adalah sekarang. — Pepatah",
  "Orang yang gila mengira mereka bisa mengubah dunia, adalah yang benar-benar melakukannya. — Steve Jobs",
  "Pendidikan adalah paspor untuk masa depan. — Malcolm X",
  "Bukan gunung yang harus kita taklukkan, tapi diri kita sendiri. — Edmund Hillary",
  "Kegagalan adalah bumbu keberhasilan. — Pepatah",
  "Pesimis melihat kesulitan di setiap kesempatan, optimis melihat kesempatan di setiap kesulitan. — Churchill",
  "Mimpi tidak terwujud sendiri, bangunlah dan wujudkan! — Pepatah",
  "Jadilah perubahan yang ingin kamu lihat di dunia. — Mahatma Gandhi",
  "Belajar dari kemarin, hidup untuk hari ini, berharap untuk esok. — Albert Einstein",
  "Menyerah bukanlah pilihan. — Pepatah",
  "Hal-hal besar dimulai dari langkah kecil. — Pepatah",
  "Kesempatan tidak terjadi begitu saja, kamu yang menciptakannya. — Chris Grosser",
  "Ilmu tanpa amal bagaikan pohon tanpa buah. — Imam Al-Ghazali",
  "Menuntut ilmu dari buaian hingga liang lahat. — Hadits",
  "Berusahalah menjadi manusia yang berguna, bukan hanya yang berhasil. — Albert Einstein",
  "Semakin aku belajar, semakin aku sadar aku tidak tahu apa-apa. — Socrates",
  "Sukses itu kerja keras, ketekunan, belajar, dan cinta pada apa yang kamu lakukan. — Pelé",
  "Manusia yang paling baik adalah yang paling bermanfaat bagi orang lain. — Hadits",
  "Barangsiapa menempuh jalan menuntut ilmu, Allah mudahkan baginya jalan ke surga. — HR. Muslim",
  "Hiduplah seolah kamu mati besok, belajarlah seolah kamu hidup selamanya. — Mahatma Gandhi",
  "Disiplin adalah jembatan antara tujuan dan pencapaian. — Jim Rohn",
  "Kerja keras mengalahkan bakat ketika bakat tidak bekerja keras. — Tim Notke",
  "Percayalah pada proses. — Pepatah",
  "Tidak ada yang namanya belajar terlambat, yang ada adalah tidak mau memulai. — Pepatah",
  "Kemarin aku pintar, aku ingin mengubah dunia. Hari ini aku bijak, aku mengubah diriku. — Rumi",
  "Sedikit pengetahuan yang diterapkan jauh lebih berharga daripada banyak yang tidak. — Kahlil Gibran",
  "Orang yang berhenti belajar adalah orang yang tua, baik di usia 20 atau 80. — Henry Ford",
];

function randomQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

// ═══════════════════════════════════════
//  SALAM (time-based greeting)
// ═══════════════════════════════════════
export function getSalam(): string {
  const hour = nowWIB().hour();
  if (hour >= 3 && hour < 11) return '🌅 *Assalamu\'alaikum, Selamat Pagi!*';
  if (hour >= 11 && hour < 15) return '☀️ *Assalamu\'alaikum, Selamat Siang!*';
  if (hour >= 15 && hour < 18) return '🌇 *Assalamu\'alaikum, Selamat Sore!*';
  return '🌙 *Assalamu\'alaikum, Selamat Malam!*';
}

// ═══════════════════════════════════════
//  FOOTER (dashboard link + quote)
// ═══════════════════════════════════════
const DASHBOARD_URL = 'https://botty.flx.web.id';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

export function buildFooter(): string {
  return [
    '',
    '━━━━━━━━━━━━━━━━━━━━━',
    '🌐 *Dashboard Botty*',
    `🔗 ${DASHBOARD_URL}`,
    `👤 User: \`${ADMIN_USER}\``,
    `🔑 Pass: \`${ADMIN_PASS}\``,
    '',
    `💬 _"${randomQuote()}"_`,
    '',
    '🤖 _Botty v1.0_',
  ].join('\n');
}

// ═══════════════════════════════════════
//  WRAP MESSAGE (salam + content + footer)
// ═══════════════════════════════════════
export function wrapMessage(content: string): string {
  return [getSalam(), '', content, buildFooter()].join('\n');
}

// ═══════════════════════════════════════
//  ENTRY FORMATTING
// ═══════════════════════════════════════

/** Format a single schedule entry as one line */
export function formatEntryLine(entry: EntryWithCourse, index?: number): string {
  const loc = entry.locationOverride || entry.course.locationDefault || '—';
  const dur = formatDuration(diffMinutes(entry.startTime, entry.endTime));
  const num = index !== undefined ? `*${index + 1}.* ` : '▸ ';

  // Special entries (Istirahat / Pulang)
  if (entry.course.name.includes('Istirahat')) {
    return `${num}🍽️ ${fmtTime(entry.startTime)}–${fmtTime(entry.endTime)} _Istirahat (ISHOMA)_`;
  }
  if (entry.course.name.includes('Pulang')) {
    return `${num}🏠 ${fmtTime(entry.startTime)} *Pulang* 🎉`;
  }

  return `${num}📚 ${fmtTime(entry.startTime)}–${fmtTime(entry.endTime)} *${entry.course.name}*\n    📍 ${loc} ⏱️ ${dur}`;
}

/** Format entries for a single day — beautiful WhatsApp table */
export function formatDaySchedule(dow: number, entries: EntryWithCourse[]): string {
  if (entries.length === 0) return `📅 *${dayName(dow)}*\n\n_🎉 Tidak ada kelas — enjoy!_`;

  const lines: string[] = [
    `┌─────────────────────────┐`,
    `│  📅 *JADWAL ${dayName(dow).toUpperCase()}*`,
    `└─────────────────────────┘`,
    '',
  ];

  let totalMinutes = 0;

  entries.forEach((entry, i) => {
    // Gap detection
    if (i > 0 && !entry.course.name.includes('Istirahat') && !entry.course.name.includes('Pulang')) {
      const prevEnd = entries[i - 1].endTime;
      const gap = diffMinutes(prevEnd, entry.startTime);
      if (gap > 0 && !entries[i - 1].course.name.includes('Istirahat')) {
        lines.push(`    ⏸️ _Jeda ${formatDuration(gap)}_`);
        lines.push('');
      }
    }

    lines.push(formatEntryLine(entry, i));

    if (!entry.course.name.includes('Istirahat') && !entry.course.name.includes('Pulang')) {
      totalMinutes += diffMinutes(entry.startTime, entry.endTime);
    }
    lines.push('');
  });

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📊 *Total Kuliah:* ${formatDuration(totalMinutes)}`);

  return lines.join('\n');
}

/** Format full week schedule */
export function formatWeekSchedule(entriesByDay: Map<number, EntryWithCourse[]>): string {
  const lines: string[] = [
    `╔═══════════════════════════╗`,
    `║  📋 *JADWAL KULIAH MINGGU INI*`,
    `╚═══════════════════════════╝`,
    '',
  ];

  for (let dow = 1; dow <= 7; dow++) {
    const entries = entriesByDay.get(dow) || [];
    if (entries.length === 0 && dow > 5) continue;
    lines.push(formatDaySchedule(dow, entries));
    lines.push('');
  }

  return lines.join('\n').trim();
}

/** Format a detailed entry */
export function formatEntryDetail(entry: EntryWithCourse, note?: string | null): string {
  const loc = entry.locationOverride || entry.course.locationDefault || '—';
  const dur = formatDuration(diffMinutes(entry.startTime, entry.endTime));

  const lines = [
    `┌─────────────────────────┐`,
    `│  📚 *${entry.course.name}*`,
    `└─────────────────────────┘`,
    '',
    `🕐 *Waktu:* ${fmtTime(entry.startTime)} – ${fmtTime(entry.endTime)} (${dur})`,
    `📍 *Ruangan:* ${loc}`,
    `👤 *Dosen:* ${entry.course.lecturerName}`,
  ];

  if (entry.course.lecturerWa) {
    lines.push(`📱 *WA Dosen:* ${entry.course.lecturerWa}`);
  }

  if (note) {
    lines.push(`📝 *Catatan:* ${note}`);
  } else if (entry.course.defaultNote) {
    lines.push(`📝 *Catatan:* ${entry.course.defaultNote}`);
  }

  return lines.join('\n');
}

// ═══════════════════════════════════════
//  REMINDER FORMATTING (includes salam+footer)
// ═══════════════════════════════════════
export function formatReminder(
  eventType: string,
  entry: EntryWithCourse,
  note?: string | null,
  minutesBefore?: number
): string {
  const loc = entry.locationOverride || entry.course.locationDefault || '—';
  const dur = formatDuration(diffMinutes(entry.startTime, entry.endTime));

  if (eventType === 'PRE_CLASS') {
    const lines = [
      getSalam(),
      '',
      `╔═══════════════════════════╗`,
      `║  ⏰ *REMINDER KELAS*`,
      `╚═══════════════════════════╝`,
      '',
      `📚 *${entry.course.name}*`,
      `🕐 *Waktu:* ${fmtTime(entry.startTime)} – ${fmtTime(entry.endTime)} (${dur})`,
      `📍 *Ruangan:* ${loc}`,
      `👤 *Dosen:* ${entry.course.lecturerName}`,
    ];
    if (note || entry.course.defaultNote) {
      lines.push(`📝 *Catatan:* ${note || entry.course.defaultNote}`);
    }
    lines.push('');
    lines.push(`⏳ *Mulai ${minutesBefore || 15} menit lagi!*`);
    lines.push(`💪 Semangat kuliah hari ini!`);
    lines.push(buildFooter());
    return lines.join('\n');
  }

  if (eventType === 'CLASS_START') {
    return [
      getSalam(),
      '',
      `╔═══════════════════════════╗`,
      `║  🔔 *KELAS DIMULAI!*`,
      `╚═══════════════════════════╝`,
      '',
      `📚 *${entry.course.name}*`,
      `📍 ${loc}`,
      `🕐 ${fmtTime(entry.startTime)} – ${fmtTime(entry.endTime)}`,
      '',
      `✨ Selamat belajar! Semoga ilmunya berkah 🤲`,
      buildFooter(),
    ].join('\n');
  }

  if (eventType === 'PRE_BREAK') {
    return [
      `☕ *Istirahat Sebentar Lagi!*`,
      '',
      `🕐 Istirahat mulai ${fmtTime(entry.endTime)}`,
      `⏳ ${minutesBefore || 15} menit lagi!`,
      `🍽️ Jangan lupa makan ya~ 😊`,
      buildFooter(),
    ].join('\n');
  }

  if (eventType === 'BREAK_START') {
    return [
      `☕ *Waktu Istirahat!*`,
      '',
      `🕐 Sekarang istirahat`,
      `🍽️ Makan dulu biar semangat lanjut! 🧃`,
      buildFooter(),
    ].join('\n');
  }

  // Default fallback
  return [
    getSalam(),
    '',
    `📢 *Reminder:* ${entry.course.name}`,
    `📍 ${loc}`,
    `🕐 ${fmtTime(entry.startTime)} – ${fmtTime(entry.endTime)}`,
    buildFooter(),
  ].join('\n');
}

/** Format countdown string */
export function formatCountdown(minutes: number): string {
  if (minutes <= 0) return 'sekarang! 🔥';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} menit lagi ⏳`;
  if (m === 0) return `${h} jam lagi ⏳`;
  return `${h} jam ${m} menit lagi ⏳`;
}
