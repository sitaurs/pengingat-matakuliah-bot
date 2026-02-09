import crypto from 'crypto';
import { config } from '../config.js';

/** Verify GoWA webhook HMAC SHA256 signature */
export function verifySignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!signatureHeader) return false;

  const secret = config.gowa.webhookSecret;
  const expectedSig = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}
