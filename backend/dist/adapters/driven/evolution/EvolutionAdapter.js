"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionAdapter = void 0;
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
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
    async sendTextMessage(instanceName, number, text) {
        return evolutionRequest(`/message/sendText/${instanceName}`, {
            method: 'POST',
            body: JSON.stringify({
                number,
                text,
                delay: 1200,
                linkPreview: true
            })
        });
    }
}
exports.EvolutionAdapter = EvolutionAdapter;
