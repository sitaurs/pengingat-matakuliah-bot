/** Anti-spam cooldown per chat_id */
const cooldowns = new Map<string, number>();

export function isOnCooldown(chatId: string, cooldownSeconds: number): boolean {
  const now = Date.now();
  const lastTime = cooldowns.get(chatId);

  if (lastTime && now - lastTime < cooldownSeconds * 1000) {
    return true;
  }

  cooldowns.set(chatId, now);
  return false;
}

/** Clean up expired cooldowns (call periodically) */
export function cleanupCooldowns(cooldownSeconds: number): void {
  const now = Date.now();
  const threshold = cooldownSeconds * 1000;
  for (const [chatId, time] of cooldowns) {
    if (now - time > threshold * 2) {
      cooldowns.delete(chatId);
    }
  }
}
