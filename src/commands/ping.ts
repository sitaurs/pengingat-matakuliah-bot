import type { CommandContext } from './router.js';
import { nowWIB } from '../utils/time.js';

export async function handlePing(_ctx: CommandContext): Promise<string> {
  const now = nowWIB().format('DD/MM/YYYY HH:mm:ss');
  return `🏓 *Pong!* Bot aktif dan siap melayani! ✅\n🕐 ${now} WIB`;
}
