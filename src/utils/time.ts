import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'Asia/Jakarta';

export function nowWIB(): dayjs.Dayjs {
  return dayjs().tz(TZ);
}

export function todayWIB(): string {
  return nowWIB().format('YYYY-MM-DD');
}

/** 1=Monday ... 7=Sunday (ISO weekday) */
export function currentDayOfWeek(): number {
  return nowWIB().day() === 0 ? 7 : nowWIB().day(); // dayjs .day() is 0=Sun
}

export function dayName(dow: number): string {
  const names = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  return names[dow] || '??';
}

/** Parse HH:mm into dayjs for today in WIB */
export function parseTimeToday(hhmm: string): dayjs.Dayjs {
  const [h, m] = hhmm.split(':').map(Number);
  return nowWIB().hour(h).minute(m).second(0).millisecond(0);
}

/** Parse HH:mm into dayjs for a specific date string in WIB */
export function parseTimeForDate(dateStr: string, hhmm: string): dayjs.Dayjs {
  const [h, m] = hhmm.split(':').map(Number);
  return dayjs.tz(`${dateStr} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`, TZ);
}

/** Format minutes into "Xj Ym" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} menit`;
  if (m === 0) return `${h} jam`;
  return `${h}j ${m}m`;
}

/** Difference in minutes between two HH:mm strings */
export function diffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

/** Format HH:mm (ensure 2 digits) */
export function fmtTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return `${String(h).padStart(2, '0')}.${String(m).padStart(2, '0')}`;
}

/** Get tomorrow's date in WIB */
export function tomorrowWIB(): dayjs.Dayjs {
  return nowWIB().add(1, 'day');
}

/** Get day of week for tomorrow */
export function tomorrowDayOfWeek(): number {
  const d = tomorrowWIB().day();
  return d === 0 ? 7 : d;
}

export { dayjs, TZ };
