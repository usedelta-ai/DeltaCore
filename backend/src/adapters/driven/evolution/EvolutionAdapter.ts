import { EvolutionAPIPort } from '../../../ports/driven/EvolutionAPIPort';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

const avatarCache = new Map<string, { url: string | null; expiresAt: number }>();
const AVATAR_CACHE_TTL = 35 * 60 * 1000;
const AVATAR_ERROR_TTL = 5 * 60 * 1000;

async function evolutionRequest(path: string, options: any = {}) {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    throw new Error('Evolution API URL or API Key is not configured in .env');
  }
  const url = `${EVOLUTION_API_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': EVOLUTION_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
  }
  return response.json();
}

export class EvolutionAdapter implements EvolutionAPIPort {
  async fetchInstances(): Promise<any[]> {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return [];
    try {
      const data = (await evolutionRequest('/instance/fetchInstances')) as any;
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.instances)) {
        return data.instances;
      }
      return [];
    } catch (err) {
      console.warn('Could not fetch instances from Evolution API:', err);
      return [];
    }
  }

  async connectionState(instanceName: string): Promise<any> {
    return evolutionRequest(`/instance/connectionState/${instanceName}`);
  }

  async connect(instanceName: string): Promise<any> {
    return evolutionRequest(`/instance/connect/${instanceName}`);
  }

  async getBase64FromMediaMessage(instanceName: string, messageId: string): Promise<any> {
    return evolutionRequest(`/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        message: {
          key: {
            id: messageId
          }
        },
        convertToMp4: true
      })
    });
  }

  async sendTextMessage(instanceName: string, number: string, text: string, quoted?: string): Promise<any> {
    const body: any = {
      number,
      text,
      delay: 1200,
      linkPreview: true
    };
    if (quoted) {
      body.quoted = { text: quoted };
    }
    return evolutionRequest(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async sendMediaMessage(instanceName: string, number: string, mediaType: string, mediaBase64: string, options?: { caption?: string; fileName?: string; delay?: number }): Promise<any> {
    const body: any = {
      number,
      mediatype: mediaType,
      media: mediaBase64,
      delay: options?.delay ?? 1200
    };
    if (options?.caption) body.caption = options.caption;
    if (options?.fileName) body.fileName = options.fileName;
    return evolutionRequest(`/message/sendMedia/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async sendWhatsAppAudio(instanceName: string, number: string, audioBase64: string, options?: { delay?: number }): Promise<any> {
    const body: any = {
      number,
      audio: audioBase64,
      delay: options?.delay ?? 1200
    };
    return evolutionRequest(`/message/sendWhatsAppAudio/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async sendPresence(instanceName: string, number: string, presence: 'composing' | 'recording'): Promise<any> {
    const delay = presence === 'recording' ? 20000 : 10000;
    return evolutionRequest(`/chat/sendPresence/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number,
        delay,
        presence
      })
    });
  }

  async fetchProfilePictureUrl(instanceName: string, number: string): Promise<{ profilePictureUrl: string | null }> {
    const key = `${instanceName}:${number}`;
    const cached = avatarCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return { profilePictureUrl: cached.url };
    }

    try {
      const result = await evolutionRequest(`/chat/fetchProfilePictureUrl/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({ number })
      });
      const url = (result as any)?.profilePictureUrl || null;
      avatarCache.set(key, {
        url,
        expiresAt: Date.now() + AVATAR_CACHE_TTL
      });
      return { profilePictureUrl: url };
    } catch (err) {
      avatarCache.set(key, {
        url: null,
        expiresAt: Date.now() + AVATAR_ERROR_TTL
      });
      return { profilePictureUrl: null };
    }
  }
}
