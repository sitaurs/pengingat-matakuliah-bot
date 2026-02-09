import type { PrismaClient, ChatTarget } from '@prisma/client';
import { gowaClient } from '../gowa/client.js';
import { isOnCooldown } from '../utils/cooldown.js';
import { config } from '../config.js';
import { wrapMessage } from '../utils/format.js';
import logger from '../utils/logger.js';

// Import all command handlers
import { handleHelp } from './help.js';
import { handlePing } from './ping.js';
import { handleStatus } from './status.js';
import { handleJadwal } from './jadwal.js';
import { handleHari } from './hari.js';
import { handleBesok } from './besok.js';
import { handleNext } from './next.js';
import { handleNow } from './now.js';
import { handleWhere } from './where.js';
import { handleDosen } from './dosen.js';
import { handleDetail } from './detail.js';
import { handleNote } from './note.js';
import { handleReminderCmd } from './reminder-cmd.js';
import { handleLibur } from './libur.js';

export interface CommandContext {
  chatId: string;
  args: string[];
  body: string;
  chatTarget: ChatTarget | null;
  prisma: PrismaClient;
}

type CommandHandler = (ctx: CommandContext) => Promise<string | null>;

const commands: Record<string, CommandHandler> = {
  help: handleHelp,
  ping: handlePing,
  status: handleStatus,
  jadwal: handleJadwal,
  hari: handleHari,
  besok: handleBesok,
  next: handleNext,
  now: handleNow,
  where: handleWhere,
  dosen: handleDosen,
  detail: handleDetail,
  note: handleNote,
  reminder: handleReminderCmd,
  libur: handleLibur,
};

export async function handleCommand(
  chatId: string,
  messageBody: string,
  chatTarget: ChatTarget | null,
  prisma: PrismaClient
): Promise<void> {
  // Parse command
  const parts = messageBody.trim().split(/\s+/);
  const commandName = parts[0].slice(1).toLowerCase(); // remove !
  const args = parts.slice(1);

  // Check cooldown
  if (isOnCooldown(chatId, config.commandCooldownSeconds)) {
    logger.debug(`Cooldown active for ${chatId}`);
    return;
  }

  // Global commands (work without registration)
  const globalCommands = ['ping', 'help'];
  if (!globalCommands.includes(commandName)) {
    // Check if chat is registered and commands allowed
    if (!chatTarget || !chatTarget.enabled || !chatTarget.allowCommands) {
      logger.debug(`Chat ${chatId} not registered or commands disabled`);
      return;
    }
  }

  const handler = commands[commandName];
  if (!handler) {
    logger.debug(`Unknown command: ${commandName}`);
    return; // Silently ignore unknown commands
  }

  try {
    const reply = await handler({
      chatId,
      args,
      body: messageBody,
      chatTarget,
      prisma,
    });

    if (reply) {
      await gowaClient.sendMessage(chatId, wrapMessage(reply));
    }
  } catch (err: any) {
    logger.error(`Command error (${commandName}): ${err.message}`);
    await gowaClient.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
}
