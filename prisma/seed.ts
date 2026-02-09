/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...\n');

  // ═══ Courses ═══
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        name: 'Workshop Elektronika Telekomunikasi',
        locationDefault: 'R.AH.3.38',
        lecturerName: 'Lis Diana M., S.T., M.T.',
        lecturerWa: '+6285102103006',
        lecturerCode: 'LDM',
      },
    }),
    prisma.course.create({
      data: {
        name: 'Praktikum Sistem Komunikasi Seluler',
        locationDefault: 'R.AH.1.6',
        lecturerName: 'Atik Novianti, S.ST., M.T.',
        lecturerWa: '+6281223404701',
        lecturerCode: 'AN',
      },
    }),
    prisma.course.create({
      data: {
        name: 'Workshop Pengolahan Citra',
        locationDefault: 'R.AH.1.12',
        lecturerName: 'Rizky Ardiansyah, S.Kom., M.T.',
        lecturerWa: '+6283834033301',
        lecturerCode: 'RA',
      },
    }),
    prisma.course.create({
      data: {
        name: 'Workshop Sistem Keamanan Jaringan',
        locationDefault: 'LAB.KOM.AL.1',
        lecturerName: 'Adzikirani, S.ST., M.Tr.T.',
        lecturerWa: '+6281282847539',
        lecturerCode: 'ADZ',
      },
    }),
    prisma.course.create({
      data: {
        name: 'Jaringan Telekomunikasi',
        locationDefault: 'R.AH.3.37',
        lecturerName: 'Dianthy Marya, S.T., M.T.',
        lecturerWa: '+6281224237617',
        lecturerCode: 'DM',
      },
    }),
    prisma.course.create({
      data: {
        name: 'Pendidikan Pancasila',
        locationDefault: 'R.AH.1.2',
        lecturerName: 'Dr. Hudriyah Mundzir, S.H., M.H.',
        lecturerWa: '+62816212772',
        lecturerCode: 'HM',
      },
    }),
    prisma.course.create({
      data: {
        name: 'Pemrosesan Sinyal Digital',
        locationDefault: 'R.AH.1.2',
        lecturerName: 'Rieke Adriati W., S.T., M.T.',
        lecturerWa: '+6285815223500',
        lecturerCode: 'RAW',
      },
    }),
    prisma.course.create({
      data: {
        name: 'Praktikum Antena',
        locationDefault: 'LAB.AI.6',
        lecturerName: 'Koesmarijanto, S.T., M.T.',
        lecturerWa: '+628155500931',
        lecturerCode: 'KMR',
      },
    }),
    prisma.course.create({
      data: {
        name: 'IoT dan WSN',
        locationDefault: 'R.AH.3.37',
        lecturerName: 'Nurul Hidayati, S.T., M.T.',
        lecturerWa: '+6285645371071',
        lecturerCode: 'NH',
      },
    }),
    prisma.course.create({
      data: {
        name: 'Praktikum Sistem Komunikasi Fiber Optik',
        locationDefault: 'R.AH.1.10',
        lecturerName: 'Drs. Yoyok Heru P. I., M.T.',
        lecturerWa: '+628123314531',
        lecturerCode: 'YHP',
      },
    }),
    // ── Special entries ──
    prisma.course.create({
      data: {
        name: 'Istirahat (ISHOMA)',
        locationDefault: '-',
        lecturerName: '-',
        lecturerCode: 'ISHOMA',
      },
    }),
    prisma.course.create({
      data: {
        name: 'Pulang',
        locationDefault: '-',
        lecturerName: '-',
        lecturerCode: 'PULANG',
      },
    }),
  ]);

  console.log(`✅ ${courses.length} courses created`);

  // Map for easy lookup by name
  const c = (name: string) => courses.find(x => x.name.includes(name))!.id;

  // ═══ Schedule Entries ═══
  // Day 1 = Monday ... Day 5 = Friday
  const entries = await Promise.all([
    // ── SENIN (1) ──
    prisma.scheduleEntry.create({ data: { courseId: c('Workshop Elektronika'), dayOfWeek: 1, startTime: '07:00', endTime: '09:30', locationOverride: 'R.AH.3.38' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Praktikum Sistem Komunikasi Seluler'), dayOfWeek: 1, startTime: '10:20', endTime: '12:00' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Istirahat'), dayOfWeek: 1, startTime: '12:00', endTime: '12:30' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Praktikum Sistem Komunikasi Seluler'), dayOfWeek: 1, startTime: '12:30', endTime: '14:10' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Pulang'), dayOfWeek: 1, startTime: '14:10', endTime: '14:10' } }),

    // ── SELASA (2) ──
    prisma.scheduleEntry.create({ data: { courseId: c('Workshop Pengolahan'), dayOfWeek: 2, startTime: '07:00', endTime: '08:40', locationOverride: 'R.AH.1.12' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Workshop Sistem Keamanan'), dayOfWeek: 2, startTime: '08:40', endTime: '11:10' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Jaringan Telekomunikasi'), dayOfWeek: 2, startTime: '11:10', endTime: '12:00' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Istirahat'), dayOfWeek: 2, startTime: '12:00', endTime: '12:30' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Jaringan Telekomunikasi'), dayOfWeek: 2, startTime: '12:30', endTime: '14:10' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Pendidikan Pancasila'), dayOfWeek: 2, startTime: '16:20', endTime: '17:10' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Pulang'), dayOfWeek: 2, startTime: '17:10', endTime: '17:10' } }),

    // ── RABU (3) ──
    prisma.scheduleEntry.create({ data: { courseId: c('Pemrosesan Sinyal'), dayOfWeek: 3, startTime: '07:50', endTime: '10:20' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Praktikum Antena'), dayOfWeek: 3, startTime: '10:20', endTime: '12:00' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Istirahat'), dayOfWeek: 3, startTime: '12:00', endTime: '12:30' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Praktikum Antena'), dayOfWeek: 3, startTime: '12:30', endTime: '14:10' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Workshop Pengolahan'), dayOfWeek: 3, startTime: '14:10', endTime: '15:00', locationOverride: 'R.AH.1.9' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Workshop Pengolahan'), dayOfWeek: 3, startTime: '15:30', endTime: '17:10', locationOverride: 'R.AH.1.9' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Pulang'), dayOfWeek: 3, startTime: '17:10', endTime: '17:10' } }),

    // ── KAMIS (4) ──
    prisma.scheduleEntry.create({ data: { courseId: c('Workshop Sistem Keamanan'), dayOfWeek: 4, startTime: '07:00', endTime: '08:40' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('IoT dan WSN'), dayOfWeek: 4, startTime: '09:30', endTime: '12:00' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Pulang'), dayOfWeek: 4, startTime: '12:00', endTime: '12:00' } }),

    // ── JUMAT (5) ──
    prisma.scheduleEntry.create({ data: { courseId: c('Praktikum Sistem Komunikasi Fiber'), dayOfWeek: 5, startTime: '07:50', endTime: '11:10' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Istirahat'), dayOfWeek: 5, startTime: '12:00', endTime: '12:30' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Workshop Elektronika'), dayOfWeek: 5, startTime: '15:30', endTime: '17:10', locationOverride: 'R.AH.3.35' } }),
    prisma.scheduleEntry.create({ data: { courseId: c('Pulang'), dayOfWeek: 5, startTime: '17:10', endTime: '17:10' } }),
  ]);

  console.log(`✅ ${entries.length} schedule entries created`);

  // ═══ Chat Targets (3 placeholder groups) ═══
  const groups = await Promise.all([
    prisma.chatTarget.create({
      data: {
        chatId: 'GRUP_1@g.us',
        label: 'Grup Kelas 1',
        enabled: true,
        allowCommands: true,
        allowReminders: true,
      },
    }),
    prisma.chatTarget.create({
      data: {
        chatId: 'GRUP_2@g.us',
        label: 'Grup Kelas 2',
        enabled: true,
        allowCommands: true,
        allowReminders: true,
      },
    }),
    prisma.chatTarget.create({
      data: {
        chatId: 'GRUP_3@g.us',
        label: 'Grup Kelas 3',
        enabled: true,
        allowCommands: true,
        allowReminders: true,
      },
    }),
  ]);

  console.log(`✅ ${groups.length} chat targets created (update chat_id via admin panel!)`);

  // ═══ Default Settings ═══
  await Promise.all([
    prisma.setting.create({ data: { key: 'reminder_offset_default', value: '15' } }),
    prisma.setting.create({ data: { key: 'bot_name', value: 'Schedule Bot' } }),
  ]);

  console.log('✅ Default settings created');

  // ═══ Holidays ═══
  await prisma.holiday.create({
    data: { date: '2026-02-17', reason: 'Libur (17 Feb 2026)', enabled: true },
  });
  console.log('✅ 1 holiday created');

  console.log('\n🎉 Seed complete!\n');
  console.log('⚠️  PENTING: Update chat_id grup di Admin Panel → Chat Targets');
}

seed()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
