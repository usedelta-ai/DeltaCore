"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionAdapter = void 0;
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const avatarCache = new Map();
const AVATAR_CACHE_TTL = 35 * 60 * 1000;
const AVATAR_ERROR_TTL = 5 * 60 * 1000;
async function evolutionRequest(path, options = {}) {
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
class EvolutionAdapter {
    async fetchInstances() {
        if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY)
            return [];
        try {
            const data = (await evolutionRequest('/instance/fetchInstances'));
            if (Array.isArray(data)) {
                return data;
            }
            else if (data && Array.isArray(data.instances)) {
                return data.instances;
            }
            return [];
        }
        catch (err) {
            console.warn('Could not fetch instances from Evolution API:', err);
            return [];
        }
    }
    async connectionState(instanceName) {
        return evolutionRequest(`/instance/connectionState/${instanceName}`);
    }
    async connect(instanceName) {
        return evolutionRequest(`/instance/connect/${instanceName}`);
    }
    async getBase64FromMediaMessage(instanceName, messageId) {
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
    async sendTextMessage(instanceName, number, text, quoted) {
        const body = {
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
    async sendMediaMessage(instanceName, number, mediaType, mediaBase64, options) {
        const body = {
            number,
            mediatype: mediaType,
            media: mediaBase64,
            delay: options?.delay ?? 1200
        };
        if (options?.caption)
            body.caption = options.caption;
        if (options?.fileName)
            body.fileName = options.fileName;
        return evolutionRequest(`/message/sendMedia/${instanceName}`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
    async sendWhatsAppAudio(instanceName, number, audioBase64, options) {
        const body = {
            number,
            audio: audioBase64,
            delay: options?.delay ?? 1200
        };
        return evolutionRequest(`/message/sendWhatsAppAudio/${instanceName}`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
    async sendPresence(instanceName, number, presence) {
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
    async fetchProfilePictureUrl(instanceName, number) {
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
            const url = result?.profilePictureUrl || null;
            avatarCache.set(key, {
                url,
                expiresAt: Date.now() + AVATAR_CACHE_TTL
            });
            return { profilePictureUrl: url };
        }
        catch (err) {
            avatarCache.set(key, {
                url: null,
                expiresAt: Date.now() + AVATAR_ERROR_TTL
            });
            return { profilePictureUrl: null };
        }
    }
}
exports.EvolutionAdapter = EvolutionAdapter;
