import express from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { webhookRouter } from './webhook/router.js';
import { adminRouter } from './admin/router.js';
import { startScheduler } from './scheduler/worker.js';
import logger from './utils/logger.js';
import { cleanupCooldowns } from './utils/cooldown.js';
import { gowaClient } from './gowa/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Export prisma for use in other modules
export const prisma = new PrismaClient();

async function main() {
  // Connect to database
  await prisma.$connect();
  logger.info('✅ Database connected');

  const app = express();

  // Raw body for webhook signature verification + JSON parsing
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }));

  // Serve static files
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Mount routers
  app.use(webhookRouter);
  app.use(adminRouter);

  // SPA fallback — serve index.html for non-API routes
  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  // Start reminder scheduler
  startScheduler(prisma);

  // Cleanup cooldowns periodically
  setInterval(() => cleanupCooldowns(config.commandCooldownSeconds), 60000);

  // Check GoWA connectivity
  const gowaHealth = await gowaClient.healthCheck();
  if (gowaHealth.ok) {
    logger.info(`✅ GoWA server reachable: ${config.gowa.baseUrl}`);
  } else {
    logger.warn(`⚠️  GoWA server unreachable: ${gowaHealth.status}`);
  }

  // Start server
  app.listen(config.port, () => {
    logger.info(`🚀 Bot server running on http://localhost:${config.port}`);
    logger.info(`📡 Webhook: http://localhost:${config.port}/webhook/gowa`);
    logger.info(`🌐 Admin: http://localhost:${config.port}`);
    logger.info(`❤️  Health: http://localhost:${config.port}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`\n${signal} received. Shutting down gracefully...`);
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch(err => {
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
