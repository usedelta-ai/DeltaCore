import React from 'react';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseWhatsAppStyle(text: string): React.ReactNode[] {
  const escaped = escapeHtml(text);
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  const regex = /(\*([^*]+)\*)|(_([^_]+)_)|(~([^~]+)~)|(`([^`]+)`)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(escaped)) !== null) {
    if (match.index > lastIndex) {
      parts.push(escaped.slice(lastIndex, match.index));
    }

    if (match[1]) {
      parts.push(<strong key={`b-${match.index}`}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={`i-${match.index}`}>{match[4]}</em>);
    } else if (match[5]) {
      parts.push(<del key={`s-${match.index}`}>{match[6]}</del>);
    } else if (match[7]) {
      parts.push(<code key={`c-${match.index}`} style={{ background: '#f0f0f0', padding: '1px 4px', borderRadius: '3px', fontSize: '13px', fontFamily: 'monospace' }}>{match[8]}</code>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < escaped.length) {
    parts.push(escaped.slice(lastIndex));
  }

  return parts;
}

export function formatWhatsAppText(text: string): React.ReactNode[] {
  if (!text) return [];

  const lines = text.split('\n');
  const result: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('> ')) {
      result.push(
        <div key={`q-${i}`} style={{ borderLeft: '3px solid #25d366', paddingLeft: '10px', margin: '2px 0', color: '#5e5e5e' }}>
          {parseWhatsAppStyle(line.slice(2))}
        </div>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      result.push(
        <div key={`l-${i}`} style={{ display: 'flex', gap: '6px', margin: '1px 0' }}>
          <span>•</span>
          <span>{parseWhatsAppStyle(line.slice(2))}</span>
        </div>
      );
    } else {
      result.push(
        <span key={`t-${i}`}>
          {parseWhatsAppStyle(line)}
          {i < lines.length - 1 && <br />}
        </span>
      );
    }
  }

  return result;
}
