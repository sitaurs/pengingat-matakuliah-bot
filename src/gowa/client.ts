import axios, { type AxiosInstance } from 'axios';
import { config } from '../config.js';
import logger from '../utils/logger.js';

class GowaClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.gowa.baseUrl,
      timeout: 30000,
      auth: {
        username: config.gowa.username,
        password: config.gowa.password,
      },
      headers: {
        'Content-Type': 'application/json',
        ...(config.gowa.deviceId ? { 'X-Device-Id': config.gowa.deviceId } : {}),
      },
    });
  }

  async sendMessage(phone: string, message: string): Promise<boolean> {
    try {
      const res = await this.client.post('/send/message', { phone, message });
      logger.info(`Message sent to ${phone}: ${res.status}`);
      return true;
    } catch (err: any) {
      logger.error(`Failed to send message to ${phone}: ${err.message}`);
      return false;
    }
  }

  async sendMessageWithRetry(phone: string, message: string, maxRetries = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const success = await this.sendMessage(phone, message);
      if (success) return true;

      if (attempt < maxRetries) {
        const delay = attempt * 2000; // backoff: 2s, 4s, 6s
        logger.warn(`Retry ${attempt}/${maxRetries} for ${phone} in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    return false;
  }

  /** Fetch list of joined WhatsApp groups */
  async getJoinedGroups(): Promise<{ jid: string; name: string }[]> {
    try {
      const res = await this.client.get('/user/my/groups');
      const items = res.data?.results?.data || [];
      return items.map((g: any) => ({ jid: g.JID, name: g.Name || 'Unnamed' }));
    } catch (err: any) {
      logger.error(`Failed to fetch groups: ${err.message}`);
      return [];
    }
  }

  /** Check if GoWA server is reachable */
  async healthCheck(): Promise<{ ok: boolean; status?: string }> {
    try {
      const res = await this.client.get('/');
      return { ok: true, status: `HTTP ${res.status}` };
    } catch (err: any) {
      return { ok: false, status: err.message };
    }
  }
}

export const gowaClient = new GowaClient();
