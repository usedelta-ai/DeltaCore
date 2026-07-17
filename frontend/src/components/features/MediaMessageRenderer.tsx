import React from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';

interface MediaMessageRendererProps {
  messageId: number | string;
  messageType: string;
  content: string;
  instanceName?: string;
  whatsAppMessageId?: string;
  localMediaBase64?: string;
}

const getTranscription = (text: string) => {
  if (!text) return '';
  const match = text.match(/<([^>]+)>([\s\S]*?)<\/\1>/);
  if (match && match[2]) return match[2].trim();
  const openMatch = text.match(/<[^>]+>([\s\S]*)/);
  if (openMatch && openMatch[1]) return openMatch[1].trim();
  const lowerText = text.trim().toLowerCase();
  if (
    lowerText.startsWith('data:') ||
    lowerText.startsWith('http://') ||
    lowerText.startsWith('https://') ||
    lowerText.match(/\.(ogg|mp3|wav|m4a|mp4|webm|bin)$/i) ||
    lowerText === 'audio.ogg' ||
    lowerText === 'audio.webm' ||
    lowerText === 'audio.mp4' ||
    lowerText === 'audio.mp3' ||
    lowerText === 'audio'
  ) return '';
  return text.trim();
};

export const mediaCache = new Map<string | number, string>();

export const MediaMessageRenderer: React.FC<MediaMessageRendererProps> = ({
  messageId, messageType, content, instanceName, whatsAppMessageId, localMediaBase64,
}) => {
  const normalizedType = messageType.replace(/Message$/, '');
  const [mediaData, setMediaData] = React.useState<string | null>(null);
  const [detectedType, setDetectedType] = React.useState<string>(normalizedType);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    const cacheKey = whatsAppMessageId || messageId;
    if (cacheKey && mediaCache.has(cacheKey)) {
      setMediaData(mediaCache.get(cacheKey)!);
      setDetectedType(normalizedType);
      setLoading(false);
      return;
    }

    if (localMediaBase64) {
      let src = localMediaBase64;
      if (!src.startsWith('data:')) {
        if (normalizedType === 'image') src = `data:image/png;base64,${src}`;
        else if (normalizedType === 'audio') src = `data:audio/ogg;base64,${src}`;
        else if (normalizedType === 'video') src = `data:video/mp4;base64,${src}`;
        else if (normalizedType === 'sticker') src = `data:image/webp;base64,${src}`;
        else src = `data:application/octet-stream;base64,${src}`;
      }
      setMediaData(src);
      setDetectedType(normalizedType);
      setLoading(false);
      if (cacheKey) {
        mediaCache.set(cacheKey, src);
      }
      return;
    }

    if (normalizedType === 'contact' || normalizedType === 'contactsArray') {
      setLoading(false);
      return;
    }
    let active = true;
    const loadMedia = async () => {
      try {
        let res: { base64: string } | null = null;
        if (instanceName && whatsAppMessageId) {
          res = await api.getMediaByWhatsAppId(instanceName, whatsAppMessageId);
        } else {
          res = await api.getMessageMedia(messageId);
        }
        if (!active || !res || !res.base64) return;
        let src = res.base64;
        let resolvedType = normalizedType;
        if (src.startsWith('data:')) {
          const mimeMatch = src.match(/^data:([^;]+);base64,/);
          if (mimeMatch) {
            const mime = mimeMatch[1];
            if (mime.startsWith('image/')) resolvedType = mime === 'image/webp' ? 'sticker' : 'image';
            else if (mime.startsWith('audio/')) resolvedType = 'audio';
            else if (mime.startsWith('video/')) resolvedType = 'video';
            else resolvedType = 'document';
          }
        } else {
          src = src.trim().replace(/\s/g, '');
          if (src.startsWith('/9j/') || src.startsWith('iVBORw0G')) {
            resolvedType = 'image';
            src = `data:image/png;base64,${src}`;
          } else if (src.startsWith('T2dnUw') || src.startsWith('GkXfo')) {
            resolvedType = 'audio';
            src = `data:audio/ogg;base64,${src}`;
          } else if (src.startsWith('UklGR')) {
            resolvedType = 'sticker';
            src = `data:image/webp;base64,${src}`;
          } else if (src.startsWith('AAAAF') || src.startsWith('ftyp') || src.startsWith('MThk')) {
            resolvedType = 'video';
            src = `data:video/mp4;base64,${src}`;
          } else {
            if (normalizedType === 'image') src = `data:image/png;base64,${src}`;
            else if (normalizedType === 'audio') src = `data:audio/ogg;base64,${src}`;
            else if (normalizedType === 'video') src = `data:video/mp4;base64,${src}`;
            else if (normalizedType === 'sticker') src = `data:image/webp;base64,${src}`;
            else { resolvedType = 'document'; src = `data:application/octet-stream;base64,${src}`; }
          }
        }
        if (active) {
          setMediaData(src);
          setDetectedType(resolvedType);
          if (cacheKey) {
            mediaCache.set(cacheKey, src);
          }
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadMedia();
    return () => { active = false; };
  }, [messageId, messageType, instanceName, whatsAppMessageId, localMediaBase64]);

  if (loading) {
    return <span className="text-xs text-on-surface-variant">Carregando mídia...</span>;
  }

  if (normalizedType === 'contact' || normalizedType === 'contactsArray') {
    let contactName = 'Contato';
    let contactPhone = '';
    const parseVcard = (vcardStr: string) => {
      const cleaned = vcardStr.replace(/\\n/g, '\n');
      return {
        name: (cleaned.match(/FN:([^\r\n]+)/) || [])[1]?.trim() || (cleaned.match(/N:([^\r\n]+)/) || [])[1]?.trim() || '',
        phone: (cleaned.match(/TEL;[^:]*:([^\r\n]+)/) || [])[1]?.trim() || '',
      };
    };
    try {
      const parsed = JSON.parse(content);
      if (parsed.displayName) contactName = parsed.displayName;
      if (parsed.vcard) {
        const p = parseVcard(parsed.vcard);
        if (!contactName) contactName = p.name;
        contactPhone = p.phone;
      }
    } catch {
      if (content?.includes('BEGIN:VCARD')) {
        const p = parseVcard(content);
        contactName = p.name;
        contactPhone = p.phone;
      } else if (content) {
        contactName = content;
      }
    }
    return (
      <div className="bg-black/[0.02] border border-border-low-contrast rounded-lg p-3 max-w-[300px] mt-1.5 flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-primary-container/30 flex items-center justify-center text-primary">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-on-surface truncate">{contactName}</span>
            {contactPhone && <span className="text-xs text-on-surface-variant">{contactPhone}</span>}
          </div>
        </div>
        {contactPhone && (
          <a
            href={`https://wa.me/${contactPhone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center py-1.5 px-3 bg-surface-container border border-border-low-contrast rounded-md text-sm text-on-surface font-medium no-underline gap-1.5 hover:bg-surface-container-high transition-colors"
          >
            Conversar no WhatsApp
          </a>
        )}
      </div>
    );
  }

  if (error || !mediaData) {
    if (normalizedType === 'audio') {
      const transcription = getTranscription(content);
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-red-500">Áudio indisponível</span>
          {transcription && (
            <div className="text-sm text-on-surface-variant italic border-l-[3px] border-primary pl-2 mt-0.5 bg-black/[0.03] p-1.5 rounded-r-md break-words">
              "{transcription}"
            </div>
          )}
        </div>
      );
    }
    const clean = content ? content.replace(/<[^>]*>/g, '').trim() : '';
    return (
      <div>
        <span className="text-xs text-red-500">Falha ao carregar mídia</span>
        {clean && <p className="text-sm mt-1">{clean}</p>}
      </div>
    );
  }

  if (detectedType === 'image') {
    return (
      <>
        <img
          src={mediaData}
          alt="Mídia"
          className="w-[240px] h-[180px] object-cover rounded-lg mt-1 cursor-pointer transition-transform duration-200 hover:scale-[1.02] shadow-md bg-surface-container-low"
          onClick={() => setIsModalOpen(true)}
          onLoad={() => {
            window.dispatchEvent(new CustomEvent('chat-media-loaded'));
          }}
        />
        {isModalOpen && createPortal(
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[99999] cursor-zoom-out"
          >
            <div
              className="relative w-screen h-screen flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={mediaData}
                alt="Visualização completa"
                className="max-w-[95%] max-h-[95%] w-auto h-auto object-contain rounded-lg shadow-2xl border border-white/10"
              />
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 bg-white/15 border border-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center cursor-pointer text-xl leading-none transition-colors hover:bg-white/30 z-[100000]"
              >
                ✕
              </button>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  if (detectedType === 'sticker') {
    return (
      <img
        src={mediaData}
        alt="Sticker"
        className="w-[120px] h-[120px] object-contain"
        onLoad={() => {
          window.dispatchEvent(new CustomEvent('chat-media-loaded'));
        }}
      />
    );
  }

  if (detectedType === 'audio') {
    const transcription = getTranscription(content);
    return (
      <>
        <div className="flex items-center gap-3 p-2 bg-surface-container-high rounded-lg mt-1 min-w-[240px]">
          <button
            onClick={e => {
              e.stopPropagation();
              const audio = e.currentTarget.parentElement?.querySelector('audio') as HTMLAudioElement;
              if (!audio) return;
              audio.paused ? audio.play() : audio.pause();
            }}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm cursor-pointer border-none flex-shrink-0 hover:opacity-90 transition-opacity"
          >
            ▶
          </button>
          <div className="flex-1">
            <div className="h-1 bg-border-low-contrast rounded-full relative overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: '0%' }} />
            </div>
          </div>
          <span className="text-xs text-on-surface-variant w-10 text-right tabular-nums">0:00</span>
          <audio
            src={mediaData}
            preload="metadata"
            className="hidden"
            onLoadedMetadata={e => {
              const audio = e.currentTarget;
              const totalSec = Math.floor(audio.duration);
              const timeEl = audio.parentElement?.querySelector('audio + span');
              if (timeEl) timeEl.textContent = `${Math.floor(totalSec / 60)}:${(totalSec % 60).toString().padStart(2, '0')}`;
            }}
            onTimeUpdate={e => {
              const audio = e.currentTarget;
              const pct = (audio.currentTime / audio.duration) * 100;
              const fill = audio.parentElement?.querySelector('.h-full.bg-primary') as HTMLElement;
              if (fill) fill.style.width = `${pct}%`;
              const timeEl = audio.parentElement?.querySelector('span:last-child');
              if (timeEl) {
                const sec = Math.floor(audio.currentTime);
                timeEl.textContent = `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
              }
            }}
            onPlay={e => {
              const btn = e.currentTarget.parentElement?.querySelector('button');
              if (btn) btn.textContent = '⏸';
            }}
            onPause={e => {
              const btn = e.currentTarget.parentElement?.querySelector('button');
              if (btn) btn.textContent = '▶';
            }}
            onEnded={e => {
              const btn = e.currentTarget.parentElement?.querySelector('button');
              if (btn) btn.textContent = '▶';
              const fill = e.currentTarget.parentElement?.querySelector('.h-full.bg-primary') as HTMLElement;
              if (fill) fill.style.width = '0%';
            }}
          />
        </div>
        {transcription && (
          <div className="text-sm text-on-surface-variant italic border-l-[3px] border-primary pl-2 mt-1.5 bg-black/[0.03] p-1.5 rounded-r-md break-words">
            "{transcription}"
          </div>
        )}
      </>
    );
  }

  if (detectedType === 'video') {
    return (
      <video
        src={mediaData}
        controls
        className="max-w-full max-h-[250px] rounded-lg mt-1"
      />
    );
  }

  return (
    <div>
      <a
        href={mediaData}
        download={`document-${messageId}`}
        className="text-primary underline text-sm inline-flex items-center gap-1.5"
      >
        📎 Baixar Documento
      </a>
      {content && <p className="text-sm mt-1">{content}</p>}
    </div>
  );
};
