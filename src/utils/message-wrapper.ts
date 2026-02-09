/**
 * Message Wrapper — wraps every outgoing bot message with:
 * 1. Salam (greeting based on time of day)
 * 2. Original message content
 * 3. Dashboard info footer
 * 4. Random motivational quote
 *
 * Formatted beautifully for WhatsApp (Android-optimized)
 */

import { getSalam, getRandomQuote } from './quotes.js';
import { config } from '../config.js';

const DASH_URL = process.env.DASHBOARD_URL || 'https://botty.flx.web.id';

/**
 * Wrap a message with salam header + dashboard footer + quote
 * @param content - The main message body
 * @param skipWrapper - If true, return content as-is (for error messages etc.)
 */
export function wrapMessage(content: string, skipWrapper = false): string {
  if (skipWrapper) return content;

  const salam = getSalam();
  const quote = getRandomQuote();

  return [
    `${salam}`,
    ``,
    content,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📊 *Dashboard Botty*`,
    `🔗 ${DASH_URL}`,
    `👤 User: \`${config.admin.username}\``,
    `🔑 Pass: \`${config.admin.password}\``,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `💬 _${quote}_`,
  ].join('\n');
}
