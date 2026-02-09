/**
 * Motivational & wisdom quotes collection
 * Displayed at the end of every bot message
 */

const quotes: string[] = [
  // ── Motivasi Belajar ──
  '"Pendidikan adalah senjata paling ampuh untuk mengubah dunia." — Nelson Mandela',
  '"Belajar tanpa berpikir itu sia-sia. Berpikir tanpa belajar itu berbahaya." — Konfusius',
  '"Investasi terbaik adalah investasi ilmu pengetahuan." — Benjamin Franklin',
  '"Orang yang berhenti belajar adalah orang tua, meskipun umurnya masih muda." — Henry Ford',
  '"Kesuksesan adalah guru yang buruk. Ia membuat orang pintar berpikir mereka tidak mungkin gagal." — Bill Gates',
  '"Masa depan milik mereka yang percaya pada keindahan mimpi-mimpi mereka." — Eleanor Roosevelt',
  '"Pendidikan bukan persiapan untuk hidup, pendidikan adalah hidup itu sendiri." — John Dewey',
  '"Buku adalah cermin. Kamu hanya melihat apa yang ada di dalam dirimu." — Carlos Ruiz Zafón',
  '"Akar pendidikan memang pahit, tapi buahnya manis." — Aristoteles',
  '"Semakin aku banyak membaca, semakin banyak aku tahu. Semakin banyak aku tahu, semakin banyak tempat yang bisa kukunjungi." — Dr. Seuss',

  // ── Kerja Keras & Disiplin ──
  '"Kesuksesan bukanlah kunci kebahagiaan. Kebahagiaan adalah kunci kesuksesan." — Albert Schweitzer',
  '"Jangan takut jatuh, karena yang tidak pernah memanjatlah yang tidak pernah jatuh." — Bung Karno',
  '"Kerja keras mengalahkan bakat saat bakat tidak bekerja keras." — Tim Notke',
  '"Disiplin adalah jembatan antara tujuan dan pencapaian." — Jim Rohn',
  '"Satu-satunya cara untuk melakukan pekerjaan hebat adalah mencintai apa yang kamu kerjakan." — Steve Jobs',
  '"Mulailah dari tempatmu berdiri. Gunakan apa yang kamu punya. Lakukan apa yang kamu bisa." — Arthur Ashe',
  '"Kamu tidak harus hebat untuk memulai, tapi kamu harus memulai untuk menjadi hebat." — Zig Ziglar',
  '"Jatuh itu biasa. Bangkit itu luar biasa." — Mario Teguh',
  '"Bermimpilah setinggi langit. Jika engkau jatuh, engkau akan jatuh di antara bintang-bintang." — Ir. Soekarno',
  '"Hidup bukan tentang menemukan diri sendiri. Hidup tentang menciptakan diri sendiri." — George Bernard Shaw',

  // ── Islam & Hikmah ──
  '"Barang siapa menempuh jalan untuk mencari ilmu, maka Allah mudahkan baginya jalan menuju surga." — HR. Muslim',
  '"Sesungguhnya sesudah kesulitan itu ada kemudahan." — QS. Al-Insyirah: 6',
  '"Dan janganlah kamu berputus asa dari rahmat Allah." — QS. Yusuf: 87',
  '"Maka nikmat Tuhanmu yang manakah yang kamu dustakan?" — QS. Ar-Rahman: 13',
  '"Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya." — QS. Al-Baqarah: 286',
  '"Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lain." — HR. Ahmad',
  '"Ilmu itu lebih baik dari harta. Ilmu menjagamu, sedangkan harta kamu yang menjaganya." — Ali bin Abi Thalib',
  '"Tuntutlah ilmu dari buaian sampai liang lahat." — Pepatah Arab',
  '"Bersabarlah, sesungguhnya Allah bersama orang-orang yang sabar." — QS. Al-Anfal: 46',
  '"Barang siapa yang menjadikan mudah urusan orang lain, pasti Allah akan memudahkan urusannya." — HR. Muslim',

  // ── Inspirasi Umum ──
  '"Hiduplah seolah-olah kamu akan mati besok. Belajarlah seolah-olah kamu akan hidup selamanya." — Mahatma Gandhi',
  '"Waktu terbaik untuk menanam pohon adalah 20 tahun lalu. Waktu terbaik kedua adalah sekarang." — Pepatah Tiongkok',
  '"Tidak ada yang mustahil bagi mereka yang mau berusaha." — Alexander The Great',
  '"Orang pesimis melihat kesulitan di setiap kesempatan. Orang optimis melihat kesempatan di setiap kesulitan." — Winston Churchill',
  '"Jangan menjelaskan tentang dirimu kepada siapapun. Yang menyukaimu tidak butuh itu, dan yang membencimu tidak percaya itu." — Ali bin Abi Thalib',
  '"Jika kamu tidak bisa terbang, berlarilah. Jika tidak bisa berlari, melangkahlah." — Martin Luther King Jr.',
  '"Kehidupan itu 10% apa yang terjadi padamu dan 90% bagaimana kamu meresponnya." — Charles R. Swindoll',
  '"Kegagalan adalah bumbu kehidupan. Tanpa kegagalan, hidup terasa hambar." — Andrea Hirata',
  '"Jadilah dirimu sendiri. Semua peran lain sudah ada yang mengisi." — Oscar Wilde',
  '"Keberhasilan adalah kemampuan untuk pergi dari satu kegagalan ke kegagalan lain tanpa kehilangan antusiasme." — Winston Churchill',

  // ── Teknologi & Science ──
  '"Teknologi terbaik adalah yang tidak terlihat. Ia meresap ke dalam kehidupan sehari-hari sampai tak bisa dibedakan." — Mark Weiser',
  '"Logika akan membawamu dari A ke B. Imajinasi akan membawamu ke mana-mana." — Albert Einstein',
  '"Komputer itu cepat, akurat, dan bodoh. Manusia itu lambat, ceroboh, dan cerdas." — Albert Einstein',
  '"Cara terbaik memprediksi masa depan adalah dengan menciptakannya." — Alan Kay',
  '"Talk is cheap. Show me the code." — Linus Torvalds',
  '"Simplicity is the ultimate sophistication." — Leonardo da Vinci',
  '"Inovasi membedakan antara pemimpin dan pengikut." — Steve Jobs',
  '"Kecerdasan buatan adalah alat paling kuat yang pernah kita ciptakan." — Demis Hassabis',
  '"Dunia ini adalah buku, dan mereka yang tidak bepergian hanya membaca satu halaman." — Saint Augustine',
  '"First, solve the problem. Then, write the code." — John Johnson',

  // ── Persahabatan & Kerjasama ──
  '"Sendiri kita bisa melakukan sedikit. Bersama kita bisa melakukan banyak." — Helen Keller',
  '"Teman sejati adalah mereka yang datang saat seluruh dunia pergi." — Walter Winchell',
  '"Saling membantu dalam kebaikan dan takwa." — QS. Al-Ma\'idah: 2',
  '"Hebat bukan karena bisa menang sendirian, tapi bisa membuat semua orang menang bersama." — B.J. Habibie',
  '"Kalau mau berjalan cepat, jalan sendiri. Kalau mau berjalan jauh, jalan bersama." — Pepatah Afrika',

  // ── Humor Bijak ──
  '"Aku datang, aku melihat, aku lupa apa yang mau kulihat." — Anonymous Mahasiswa',
  '"Deadline adalah inspirasi terbesar dalam sejarah umat manusia." — Anonymous',
  '"WiFi, makanan, dan tidur. Tiga pilar kehidupan mahasiswa." — Anonymous',
  '"Aku bukan malas, aku hanya dalam mode hemat energi." — Anonymous',
  '"Dosen bilang baca sebelum kelas. Kenyataan: baca saat kelas dimulai." — Anonymous Mahasiswa',
  '"To Do List hari ini: survive." — Every Student Ever',
  '"Kalau belajar itu mudah, namanya bukan belajar tapi bermain." — Anonymous',
  '"SKS: Sistem Kebut Semalam." — Mahasiswa Indonesia',
  '"Tugas dosen datang bagaikan air. Tenang tapi bisa menenggelamkan." — Anonymous',
  '"Satu hari tanpa tawa adalah hari yang terbuang." — Charlie Chaplin',

  // ── Semangat ──
  '"Kegagalan bukanlah akhir. Kegagalan adalah awal dari sesuatu yang lebih baik." — Anonymous',
  '"Perjalanan seribu mil dimulai dari satu langkah." — Lao Tzu',
  '"Saat kamu merasa ingin menyerah, ingatlah mengapa kamu memulai." — Anonymous',
  '"Jangan biarkan apa yang tidak bisa kamu lakukan menghalangi apa yang bisa kamu lakukan." — John Wooden',
  '"Hari ini harus lebih baik dari kemarin." — Pepatah',
  '"Yang penting bukan seberapa lambat kamu melaju, tapi seberapa terus kamu melangkah." — Konfusius',
  '"Beranilah bermimpi, beranilah gagal." — Norman Vaughan',
  '"Ketika badai berlalu, kau tak akan ingat bagaimana cara melewatinya. Tapi yakinlah, badai itu pasti berlalu." — Haruki Murakami',
  '"Sukses tidak diukur dari posisi yang dicapai dalam hidup, tapi dari hambatan yang berhasil diatasi." — Booker T. Washington',
  '"Semua impian bisa terwujud jika kita punya keberanian untuk mengejarnya." — Walt Disney',
];

/** Get a random quote */
export function getRandomQuote(): string {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

/** Get greeting/salam based on current WIB time */
export function getSalam(): string {
  const hour = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false }).padStart(2, '0');
  const h = parseInt(hour);

  if (h >= 3 && h < 10) return 'Assalamu\'alaikum, Selamat Pagi! ☀️';
  if (h >= 10 && h < 15) return 'Assalamu\'alaikum, Selamat Siang! 🌤️';
  if (h >= 15 && h < 18) return 'Assalamu\'alaikum, Selamat Sore! 🌅';
  return 'Assalamu\'alaikum, Selamat Malam! 🌙';
}
