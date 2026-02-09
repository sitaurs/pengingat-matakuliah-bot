# WhatsApp Schedule Bot — Implementation Plan

## Overview

Aplikasi Node.js monolith yang berfungsi sebagai:
1. **Webhook Receiver** — terima pesan dari GoWA, parse command `!...`
2. **Reminder Scheduler** — kirim notifikasi otomatis sebelum/saat kelas & istirahat
3. **Web Admin** — CRUD jadwal, notes, grup, template via AdminJS

**Stack:** Node.js + Express + Prisma (SQLite) + AdminJS + node-cron
**Timezone:** Asia/Jakarta (WIB, UTC+7)
**Port:** 4000 (web admin + webhook)
**GoWA:** configurable via `.env`, default `http://localhost:3000`

---

## Phase 1: Foundation (DB + Config + Project Setup)

### 1.1 Project Init
- `npm init`, install dependencies
- TypeScript setup (tsconfig)
- Folder structure:
  ```
  src/
    index.ts              # entrypoint
    config.ts             # env vars
    db/
      schema.prisma       # Prisma schema
      seed.ts             # seed jadwal awal
    webhook/
      router.ts           # Express router /webhook/gowa
      signature.ts        # HMAC SHA256 verify
      command-router.ts   # dispatch !command
    commands/
      help.ts
      jadwal.ts
      hari.ts
      besok.ts
      next.ts
      now.ts
      where.ts
      dosen.ts
      detail.ts
      note.ts
      reminder-cmd.ts
      libur.ts
      ping.ts
      status.ts
    scheduler/
      queue-builder.ts    # generate reminder_queue 14 hari
      worker.ts           # tiap menit kirim due reminders
    gowa/
      client.ts           # POST /send/message wrapper
    admin/
      setup.ts            # AdminJS config
    utils/
      time.ts             # helper waktu WIB
      format.ts           # format jadwal output
      cooldown.ts         # anti-spam per chat
  ```

### 1.2 Prisma Schema
Tabel sesuai spec:
- `chat_targets` — grup/DM terdaftar
- `courses` — mata kuliah + dosen
- `schedule_entries` — slot jadwal per hari
- `notes` — catatan per matkul/entry/event
- `reminder_queue` — outbox reminder
- `holidays` — tanggal libur
- `settings` — konfigurasi global (offset, dll)

### 1.3 Seed Data
Isi jadwal lengkap Senin–Jumat dari data yang diberikan:
- 10 mata kuliah unik
- 8 dosen
- ~17 schedule entries

---

## Phase 2: GoWA Client + Webhook

### 2.1 GoWA HTTP Client
- `sendMessage(chatId, message, deviceId?)` — POST /send/message
- `sendMessageWithMentions(chatId, message, mentions[], deviceId?)`
- Retry logic (3x dengan backoff)
- Error handling & logging

### 2.2 Webhook Endpoint
- `POST /webhook/gowa`
- Verify `x-hub-signature-256` (HMAC SHA256)
- Parse `{ event, device_id, payload }`
- Filter: hanya event `message`, skip `is_from_me`
- Extract `payload.chat_id`, `payload.body`
- Check: chat_id ada di `chat_targets` dan `enabled` + `allow_commands`

### 2.3 Command Router
- Parse `!command arg1 arg2...`
- Anti-spam: cooldown 3 detik per chat_id
- Dispatch ke handler yang sesuai
- Unknown command → abaikan (atau reply singkat)

---

## Phase 3: Bot Commands

### 3.1 Informasi Jadwal
| Command | Fungsi |
|---------|--------|
| `!help` | Daftar semua command |
| `!jadwal` | Jadwal Senin–Jumat (ringkas) |
| `!hari` | Jadwal hari ini |
| `!besok` | Jadwal besok |
| `!next` | Kelas berikutnya + countdown |
| `!now` | Status sekarang (kelas/istirahat/kosong) |
| `!where` | Lokasi kelas berikutnya |
| `!detail <n>` | Detail slot ke-n dari `!hari` |

### 3.2 Dosen
| Command | Fungsi |
|---------|--------|
| `!dosen <query>` | Cari dosen by nama/kode/matkul |

### 3.3 Notes
| Command | Fungsi |
|---------|--------|
| `!note set <matkul> \| <teks>` | Set note matkul |
| `!note get <matkul>` | Lihat note |
| `!note clear <matkul>` | Hapus note |

### 3.4 Reminder Control (per chat)
| Command | Fungsi |
|---------|--------|
| `!reminder on/off` | Toggle reminder untuk grup |
| `!reminder test` | Kirim contoh reminder |
| `!reminder offset <menit>` | Ubah offset pre-start |

### 3.5 Admin/Utility
| Command | Fungsi |
|---------|--------|
| `!libur add YYYY-MM-DD \| alasan` | Tambah hari libur |
| `!libur list` | Daftar libur |
| `!ping` | Health check |
| `!status` | Device aktif + pending reminders |

---

## Phase 4: Reminder Scheduler

### 4.1 Queue Builder
- Jalankan saat startup + cron tiap jam 00:00 WIB
- Generate `reminder_queue` rolling 14 hari ke depan
- Event types:
  - `PRE_CLASS` — 15 menit sebelum kelas (configurable offset)
  - `CLASS_START` — saat kelas mulai
  - `PRE_BREAK` — 15 menit sebelum istirahat
  - `BREAK_START` — saat istirahat mulai
- Skip tanggal yang ada di `holidays`
- Unique constraint: `chat_target_id + event_type + scheduled_at` → anti duplikat

### 4.2 Worker
- node-cron tiap 1 menit
- Query: `WHERE status = 'PENDING' AND scheduled_at <= NOW()`
- Kirim via GoWA client
- Update status → SENT / FAILED
- Retry FAILED max 3x

### 4.3 Format Reminder

**PRE_CLASS (15 menit sebelum):**
```
⏰ *Reminder Kelas*
📚 Workshop Elektronika Telekomunikasi
🕐 07:00 – 09:30 (2j 30m)
📍 R.AH.3.38
👤 Lis Diana M., S.T., M.T.
📝 Bawa jas lab

⏳ Mulai 15 menit lagi!
```

**CLASS_START:**
```
🔔 *Kelas Dimulai!*
📚 Workshop Elektronika Telekomunikasi
📍 R.AH.3.38
🕐 07:00 – 09:30

Selamat belajar! 💪
```

---

## Phase 5: Web Admin (AdminJS)

### 5.1 Setup
- AdminJS + @adminjs/express + @adminjs/prisma
- Basic auth (username/password dari .env)
- Mount di `/admin`

### 5.2 Resources
- **Chat Targets** — kelola grup terdaftar, toggle enabled/commands/reminders
- **Courses** — CRUD mata kuliah + dosen
- **Schedule Entries** — CRUD jadwal per hari
- **Notes** — kelola catatan per matkul
- **Holidays** — kelola hari libur
- **Reminder Queue** — monitoring (read-only): lihat pending/sent/failed
- **Settings** — offset reminder, toggle global

---

## Phase 6: Hardening & Polish

### 6.1 Security
- HMAC signature verification on webhook
- Basic auth on admin panel
- Rate limiting pada webhook endpoint
- Sanitize input commands

### 6.2 Reliability
- Graceful shutdown (close DB, stop cron)
- PM2/systemd process manager config
- Log rotation (winston/pino)
- Health check endpoint `/health`

### 6.3 Monitoring
- Log setiap command yang masuk
- Log setiap reminder yang terkirim/gagal
- `!status` command untuk monitoring dari WA

---

## Data: Jadwal Kuliah Lengkap

### Senin
| Jam | Mata Kuliah | Tempat | Dosen | WA |
|-----|-------------|--------|-------|----|
| 07:00–09:30 | Workshop Elektronika Telekomunikasi | R.AH.3.38 | Lis Diana M., S.T., M.T. | +6285102103006 |
| 10:20–12:00 | Praktikum Sistem Komunikasi Seluler | R.AH.1.6 | Atik Novianti, S.ST., M.T. | +6281223404701 |
| 12:30–14:10 | Praktikum Sistem Komunikasi Seluler | R.AH.1.6 | Atik Novianti, S.ST., M.T. | +6281223404701 |
| 15:30–17:10 | Workshop Elektronika Telekomunikasi | R.AH.3.35 | Lis Diana M., S.T., M.T. | +6285102103006 |

### Selasa
| Jam | Mata Kuliah | Tempat | Dosen | WA |
|-----|-------------|--------|-------|----|
| 07:00–08:40 | Workshop Pengolahan Citra | R.AH.1.12 | Rizky Ardiansyah, S.Kom., M.T. | +6283834033301 |
| 08:40–11:10 | Workshop Sistem Keamanan Jaringan | LAB.KOM.AL.1 | Adzikirani, S.ST., M.Tr.T. | +6281282847539 |
| 11:10–12:00 | Jaringan Telekomunikasi | R.AH.3.37 | Dianthy Marya, S.T., M.T. | +6281224237617 |
| 12:30–14:10 | Jaringan Telekomunikasi | R.AH.3.37 | Dianthy Marya, S.T., M.T. | +6281224237617 |
| 16:20–17:10 | Pendidikan Pancasila | R.AH.1.2 | Dr. Hudriyah Mundzir, S.H., M.H. | +62816212772 |

### Rabu
| Jam | Mata Kuliah | Tempat | Dosen | WA |
|-----|-------------|--------|-------|----|
| 07:50–10:20 | Pemrosesan Sinyal Digital | R.AH.1.2 | Rieke Adriati W., S.T., M.T. | +6285815223500 |
| 10:20–12:00 | Praktikum Antena | LAB.AI.6 | Koesmarijanto, S.T., M.T. | +628155500931 |
| 12:30–14:10 | Praktikum Antena | LAB.AI.6 | Koesmarijanto, S.T., M.T. | +628155500931 |
| 14:10–15:00 | Workshop Pengolahan Citra | R.AH.1.9 | Rizky Ardiansyah, S.Kom., M.T. | +6283834033301 |
| 15:30–17:10 | Workshop Pengolahan Citra | R.AH.1.9 | Rizky Ardiansyah, S.Kom., M.T. | +6283834033301 |

### Kamis
| Jam | Mata Kuliah | Tempat | Dosen | WA |
|-----|-------------|--------|-------|----|
| 07:00–08:40 | Workshop Sistem Keamanan Jaringan | LAB.KOM.AL.1 | Adzikirani, S.ST., M.Tr.T. | +6281282847539 |
| 09:30–12:00 | IoT dan WSN | R.AH.3.37 | Nurul Hidayati, S.T., M.T. | +6285645371071 |

### Jumat
| Jam | Mata Kuliah | Tempat | Dosen | WA |
|-----|-------------|--------|-------|----|
| 07:50–11:10 | Praktikum Sistem Komunikasi Fiber Optik | R.AH.1.10 | Drs. Yoyok Heru P. I., M.T. | +628123314531 |
| 15:30–17:10 | Workshop Elektronika Telekomunikasi | R.AH.3.35 | Lis Diana M., S.T., M.T. | +6285102103006 |

---

## Environment Variables (.env)

```env
# App
PORT=4000
NODE_ENV=development
TZ=Asia/Jakarta

# Database
DATABASE_URL="file:./dev.db"

# GoWA
GOWA_BASE_URL=http://localhost:3000
GOWA_DEVICE_ID=
GOWA_WEBHOOK_SECRET=secret

# Admin
ADMIN_EMAIL=admin
ADMIN_PASSWORD=admin123

# Reminder
REMINDER_OFFSET_MINUTES=15
REMINDER_CHECK_INTERVAL_SECONDS=60
REMINDER_QUEUE_DAYS=14

# Cooldown
COMMAND_COOLDOWN_SECONDS=3
```
