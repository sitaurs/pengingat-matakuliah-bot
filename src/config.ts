import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // App
  port: parseInt(process.env.PORT || '4000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  timezone: process.env.TZ || 'Asia/Jakarta',

  // GoWA
  gowa: {
    baseUrl: process.env.GOWA_BASE_URL || 'http://localhost:3000',
    username: process.env.GOWA_USERNAME || 'admin',
    password: process.env.GOWA_PASSWORD || '',
    deviceId: process.env.GOWA_DEVICE_ID || '',
    webhookSecret: process.env.GOWA_WEBHOOK_SECRET || 'secret',
  },

  // Admin
  admin: {
    username: process.env.ADMIN_USERNAME || 'aldoganteng',
    password: process.env.ADMIN_PASSWORD || 'zalyanbotty67',
  },

  // Reminder
  reminder: {
    offsetMinutes: parseInt(process.env.REMINDER_OFFSET_MINUTES || '15'),
    checkIntervalSeconds: parseInt(process.env.REMINDER_CHECK_INTERVAL_SECONDS || '60'),
    queueDays: parseInt(process.env.REMINDER_QUEUE_DAYS || '14'),
  },

  // Cooldown
  commandCooldownSeconds: parseInt(process.env.COMMAND_COOLDOWN_SECONDS || '3'),
};
