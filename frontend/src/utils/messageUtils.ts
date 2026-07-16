export function tryParseJson(str: string): any {
  if (!str) return null;
  const trimmed = str.trim();
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }
  return null;
}

export function cleanMessageContent(content: string): string {
  if (!content) return '';
  return content
    .replace(/<userMsg>([\s\S]*?)<\/userMsg>/gi, '$1')
    .replace(/<botMsg>([\s\S]*?)<\/botMsg>/gi, '$1')
    .replace(/<aiMsg>([\s\S]*?)<\/aiMsg>/gi, '$1')
    .replace(/<agentMsg>([\s\S]*?)<\/agentMsg>/gi, '$1')
    .replace(/<assistantMsg>([\s\S]*?)<\/assistantMsg>/gi, '$1')
    .replace(/<systemMsg>([\s\S]*?)<\/systemMsg>/gi, '$1')
    .replace(/<transcription>([\s\S]*?)<\/transcription>/gi, '$1')
    .replace(/<transcricao>([\s\S]*?)<\/transcricao>/gi, '$1')
    .trim();
}

export function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function deepJsonFormat(value: any): any {
  if (typeof value === 'string') {
    try { const p = JSON.parse(value); return deepJsonFormat(p); } catch { return value; }
  }
  if (Array.isArray(value)) return value.map(deepJsonFormat);
  if (value && typeof value === 'object') {
    const r: any = {};
    for (const [k, v] of Object.entries(value)) r[k] = deepJsonFormat(v);
    return r;
  }
  return value;
}

export function isAIMessage(msg: { role?: string; source?: string }): boolean {
  const role = (msg.role || '').toLowerCase();
  const source = (msg.source || '').toLowerCase();
  return role === 'assistant' || role === 'bot' || role === 'ai' || source === 'agent' || source === 'ai' || source === 'bot';
}
