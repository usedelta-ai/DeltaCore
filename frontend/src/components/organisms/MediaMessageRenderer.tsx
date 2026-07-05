import React from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';

interface MediaMessageRendererProps {
  messageId: number;
  messageType: string;
  content: string;
}

export const MediaMessageRenderer: React.FC<MediaMessageRendererProps> = ({ messageId, messageType, content }) => {
  const normalizedType = messageType.replace(/Message$/, '');
  const [mediaData, setMediaData] = React.useState<string | null>(null);
  const [detectedType, setDetectedType] = React.useState<string>(normalizedType);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (normalizedType === 'contact' || normalizedType === 'contactsArray') {
      setLoading(false);
      return;
    }
    let active = true;
    const loadMedia = async () => {
      try {
        const res = await api.getMessageMedia(messageId);
        if (active && res && res.base64) {
          let src = res.base64;
          let resolvedType = normalizedType;

          if (src.startsWith('data:')) {
            const mimeMatch = src.match(/^data:([^;]+);base64,/);
            if (mimeMatch) {
              const mime = mimeMatch[1];
              if (mime.startsWith('image/')) {
                resolvedType = mime === 'image/webp' ? 'sticker' : 'image';
              } else if (mime.startsWith('audio/')) {
                resolvedType = 'audio';
              } else if (mime.startsWith('video/')) {
                resolvedType = 'video';
              } else {
                resolvedType = 'document';
              }
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
              if (normalizedType === 'image') {
                src = `data:image/png;base64,${src}`;
              } else if (normalizedType === 'audio') {
                src = `data:audio/ogg;base64,${src}`;
              } else if (normalizedType === 'video') {
                src = `data:video/mp4;base64,${src}`;
              } else if (normalizedType === 'sticker') {
                src = `data:image/webp;base64,${src}`;
              } else {
                resolvedType = 'document';
                src = `data:application/octet-stream;base64,${src}`;
              }
            }
          }

          setMediaData(src);
          setDetectedType(resolvedType);
        }
      } catch (err) {
        console.warn('Failed to load media:', err);
        setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadMedia();
    return () => { active = false; };
  }, [messageId, messageType]);

  if (loading) {
    return <span style={{ fontSize: '12px', opacity: 0.7 }}>Carregando mídia...</span>;
  }

  if (normalizedType === 'contact' || normalizedType === 'contactsArray') {
    let contactName = 'Contato';
    let contactPhone = '';
    
    const parseVcard = (vcardStr: string) => {
      const cleaned = vcardStr.replace(/\\n/g, '\n');
      const fnMatch = cleaned.match(/FN:([^\r\n]+)/);
      const nMatch = cleaned.match(/N:([^\r\n]+)/);
      const telMatch = cleaned.match(/TEL;[^:]*:([^\r\n]+)/);
      return {
        name: fnMatch ? fnMatch[1].trim() : (nMatch ? nMatch[1].trim() : ''),
        phone: telMatch ? telMatch[1].trim() : ''
      };
    };

    try {
      const parsed = JSON.parse(content);
      if (parsed.displayName) contactName = parsed.displayName;
      if (parsed.vcard) {
        const parsedVc = parseVcard(parsed.vcard);
        if (!contactName) contactName = parsedVc.name;
        contactPhone = parsedVc.phone;
      }
    } catch (_) {
      if (content && content.includes('BEGIN:VCARD')) {
        const parsedVc = parseVcard(content);
        contactName = parsedVc.name;
        contactPhone = parsedVc.phone;
      } else if (content) {
        contactName = content;
      }
    }

    return (
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        border: '1px solid hsl(var(--card-border))',
        borderRadius: '8px',
        padding: '12px',
        maxWidth: '300px',
        marginTop: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'hsl(var(--primary-glow))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--primary))'
          }}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {contactName}
            </span>
            {contactPhone && (
              <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                {contactPhone}
              </span>
            )}
          </div>
        </div>
        {contactPhone && (
          <a
            href={`https://wa.me/${contactPhone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px 12px',
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--card-border))',
              borderRadius: '6px',
              fontSize: '13px',
              color: 'hsl(var(--foreground))',
              textDecoration: 'none',
              fontWeight: 500,
              gap: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--card))'}
          >
            Conversar no WhatsApp
          </a>
        )}
      </div>
    );
  }

  if (error || !mediaData) {
    return (
      <div>
        <span style={{ fontSize: '12px', color: '#ef4444' }}>⚠️ Falha ao carregar mídia</span>
        {content && <p style={{ fontSize: '13px', marginTop: '4px' }}>{content}</p>}
      </div>
    );
  }

  if (detectedType === 'image') {
    return (
      <>
        <img 
          src={mediaData} 
          alt="Mídia" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '250px', 
            borderRadius: '8px', 
            marginTop: '4px', 
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s'
          }} 
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onClick={() => setIsModalOpen(true)} 
        />
        {isModalOpen && createPortal(
          <div 
            onClick={() => setIsModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              cursor: 'zoom-out',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div 
              style={{ 
                position: 'relative', 
                width: '100vw', 
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={mediaData} 
                alt="Visualização completa" 
                style={{ 
                  maxWidth: '95%', 
                  maxHeight: '95%', 
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 24px 50px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }} 
              />
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '20px',
                  lineHeight: '1',
                  transition: 'background 0.2s',
                  zIndex: 100000
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
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
    return <img src={mediaData} alt="Sticker" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />;
  }
  if (detectedType === 'audio') {
    return <audio src={mediaData} controls style={{ width: '100%', marginTop: '4px' }} />;
  }
  if (detectedType === 'video') {
    return <video src={mediaData} controls style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', marginTop: '4px' }} />;
  }
  
  return (
    <div>
      <a href={mediaData} download={`document-${messageId}`} style={{ color: 'hsl(var(--primary))', textDecoration: 'underline', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        📎 Baixar Documento
      </a>
      {content && <p style={{ fontSize: '13px', marginTop: '4px' }}>{content}</p>}
    </div>
  );
};
