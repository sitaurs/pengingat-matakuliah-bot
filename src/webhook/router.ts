import { Router, type Request, type Response } from 'express';
import { verifySignature } from './signature.js';
import { handleCommand } from '../commands/router.js';
import { prisma } from '../index.js';
import logger from '../utils/logger.js';

export const webhookRouter = Router();

webhookRouter.post('/webhook/gowa', async (req: Request, res: Response) => {
  try {
    // Verify signature (rawBody set by express.raw middleware)
    const rawBody = (req as any).rawBody;
    const signature = req.headers['x-hub-signature-256'] as string | undefined;

    if (rawBody && signature) {
      if (!verifySignature(rawBody, signature)) {
        logger.warn('Webhook signature verification failed');
        // Continue anyway — some setups don't send signature
      }
    }

    const body = req.body;

    // Only handle message events
    if (body.event !== 'message') {
      res.status(200).json({ status: 'ignored', reason: 'not a message event' });
      return;
    }

    const payload = body.payload;
    if (!payload) {
      res.status(200).json({ status: 'ignored', reason: 'no payload' });
      return;
    }

    // Ignore messages from self
    if (payload.is_from_me) {
      res.status(200).json({ status: 'ignored', reason: 'self message' });
      return;
    }

    const chatId = payload.chat_id || payload.from;
    const messageBody = payload.body || payload.text || '';

    if (!chatId || !messageBody) {
      res.status(200).json({ status: 'ignored', reason: 'no chat_id or body' });
      return;
    }

    // Check if message starts with !
    if (!messageBody.startsWith('!')) {
      res.status(200).json({ status: 'ignored', reason: 'not a command' });
      return;
    }

    logger.info(`Command received: "${messageBody}" from ${chatId}`);

    // Check if chat is registered
    const chatTarget = await prisma.chatTarget.findUnique({
      where: { chatId },
    });

    // Process command (even if chat not registered, for some global commands)
    await handleCommand(chatId, messageBody, chatTarget, prisma);

    res.status(200).json({ status: 'ok' });
  } catch (err: any) {
    logger.error(`Webhook error: ${err.message}`, { stack: err.stack });
    res.status(500).json({ status: 'error', message: err.message });
  }
});
