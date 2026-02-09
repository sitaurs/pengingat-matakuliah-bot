import { Router, type Request, type Response } from 'express';
import { prisma } from '../index.js';
import { config } from '../config.js';
import { buildReminderQueue } from '../scheduler/queue-builder.js';
import logger from '../utils/logger.js';

export const adminRouter = Router();

// Simple auth middleware for admin API
adminRouter.use((req: Request, res: Response, next) => {
  // Skip auth for health and login
  if (req.path === '/api/health' || req.path === '/api/login') return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    // Check custom header too
    const user = req.headers['x-admin-user'] as string;
    const pass = req.headers['x-admin-pass'] as string;
    if (user === config.admin.username && pass === config.admin.password) {
      return next();
    }

    // Allow if session/admin token matches (for web admin)
    const sessionToken = (req.headers['x-session-token'] || req.headers['x-admin-token']) as string;
    if (sessionToken === Buffer.from(`${config.admin.username}:${config.admin.password}`).toString('base64')) {
      return next();
    }

    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const base64 = authHeader.split(' ')[1];
  const [user, pass] = Buffer.from(base64, 'base64').toString().split(':');
  if (user !== config.admin.username || pass !== config.admin.password) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  next();
});

// ═══ Login endpoint ═══
adminRouter.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username === config.admin.username && password === config.admin.password) {
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// ═══ Dashboard Stats ═══
adminRouter.get('/api/dashboard', async (_req: Request, res: Response) => {
  try {
    const [courses, scheduleEntries, chatTargets, pendingReminders, sentReminders, failedReminders, holidays] = await Promise.all([
      prisma.course.count(),
      prisma.scheduleEntry.count({ where: { enabled: true } }),
      prisma.chatTarget.count({ where: { enabled: true } }),
      prisma.reminderQueue.count({ where: { status: 'PENDING' } }),
      prisma.reminderQueue.count({ where: { status: 'SENT' } }),
      prisma.reminderQueue.count({ where: { status: 'FAILED' } }),
      prisma.holiday.count({ where: { enabled: true } }),
    ]);

    let gowaConnected = false;
    try {
      const { gowaClient } = await import('../gowa/client.js');
      const result = await gowaClient.healthCheck();
      gowaConnected = result.ok;
    } catch { gowaConnected = false; }

    res.json({
      courses, scheduleEntries, chatTargets, holidays,
      pendingReminders, sentReminders, failedReminders,
      gowaConnected,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ═══ GoWA Groups (fetch from WhatsApp) ═══
adminRouter.get('/api/gowa/groups', async (_req, res) => {
  try {
    const { gowaClient } = await import('../gowa/client.js');
    const groups = await gowaClient.getJoinedGroups();
    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ═══ Chat Targets CRUD ═══
adminRouter.get('/api/chat-targets', async (_req, res) => {
  const targets = await prisma.chatTarget.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(targets);
});

adminRouter.post('/api/chat-targets', async (req, res) => {
  try {
    const target = await prisma.chatTarget.create({ data: req.body });
    res.json(target);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.put('/api/chat-targets/:id', async (req, res) => {
  try {
    const target = await prisma.chatTarget.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(target);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.delete('/api/chat-targets/:id', async (req, res) => {
  try {
    await prisma.chatTarget.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ═══ Courses CRUD ═══
adminRouter.get('/api/courses', async (_req, res) => {
  const courses = await prisma.course.findMany({
    include: { notes: true, scheduleEntries: true },
    orderBy: { name: 'asc' },
  });
  res.json(courses);
});

adminRouter.post('/api/courses', async (req, res) => {
  try {
    const course = await prisma.course.create({ data: req.body });
    res.json(course);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.put('/api/courses/:id', async (req, res) => {
  try {
    const course = await prisma.course.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(course);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.delete('/api/courses/:id', async (req, res) => {
  try {
    await prisma.course.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ═══ Schedule Entries CRUD ═══
adminRouter.get('/api/schedule-entries', async (_req, res) => {
  const entries = await prisma.scheduleEntry.findMany({
    include: { course: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
  res.json(entries);
});

adminRouter.post('/api/schedule-entries', async (req, res) => {
  try {
    const entry = await prisma.scheduleEntry.create({ data: req.body });
    res.json(entry);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.put('/api/schedule-entries/:id', async (req, res) => {
  try {
    const entry = await prisma.scheduleEntry.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(entry);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.delete('/api/schedule-entries/:id', async (req, res) => {
  try {
    await prisma.scheduleEntry.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ═══ Notes CRUD ═══
adminRouter.get('/api/notes', async (_req, res) => {
  const notes = await prisma.note.findMany({ include: { course: true }, orderBy: { createdAt: 'desc' } });
  res.json(notes);
});

adminRouter.post('/api/notes', async (req, res) => {
  try {
    const note = await prisma.note.upsert({
      where: { courseId: req.body.courseId },
      create: req.body,
      update: { text: req.body.text },
    });
    res.json(note);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.put('/api/notes/:id', async (req, res) => {
  try {
    const note = await prisma.note.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(note);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.delete('/api/notes/:id', async (req, res) => {
  try {
    await prisma.note.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ═══ Holidays CRUD ═══
adminRouter.get('/api/holidays', async (_req, res) => {
  const holidays = await prisma.holiday.findMany({ orderBy: { date: 'asc' } });
  res.json(holidays);
});

adminRouter.post('/api/holidays', async (req, res) => {
  try {
    const holiday = await prisma.holiday.create({ data: req.body });
    res.json(holiday);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.put('/api/holidays/:id', async (req, res) => {
  try {
    const holiday = await prisma.holiday.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(holiday);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.delete('/api/holidays/:id', async (req, res) => {
  try {
    await prisma.holiday.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ═══ Reminders (read + management) ═══
adminRouter.get('/api/reminders', async (req, res) => {
  const status = req.query.status as string;
  const where = status ? { status } : {};
  const reminders = await prisma.reminderQueue.findMany({
    where,
    include: { chatTarget: true },
    orderBy: { scheduledAt: 'desc' },
    take: 100,
  });
  res.json(reminders);
});

adminRouter.post('/api/reminders/rebuild', async (_req, res) => {
  try {
    const count = await buildReminderQueue(prisma);
    res.json({ success: true, count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.delete('/api/reminders/clear-old', async (_req, res) => {
  try {
    const result = await prisma.reminderQueue.deleteMany({
      where: {
        OR: [
          { status: 'SENT' },
          { status: 'FAILED' },
        ],
        scheduledAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // older than 7 days
        },
      },
    });
    res.json({ success: true, deleted: result.count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ═══ Health ═══
adminRouter.get('/api/health', async (_req, res) => {
  let gowaConnected = false;
  try {
    const { gowaClient } = await import('../gowa/client.js');
    const result = await gowaClient.healthCheck();
    gowaConnected = result.ok;
  } catch { gowaConnected = false; }
  res.json({ status: 'ok', gowaConnected, timestamp: new Date().toISOString() });
});
