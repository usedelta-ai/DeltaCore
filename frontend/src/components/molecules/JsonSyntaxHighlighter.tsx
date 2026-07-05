import React from 'react';

interface JsonSyntaxHighlighterProps {
  jsonStr: string;
}

export const JsonSyntaxHighlighter: React.FC<JsonSyntaxHighlighterProps> = ({ jsonStr }) => {
  if (!jsonStr) return null;

  let formatted = jsonStr;
  try {
    const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
    formatted = JSON.stringify(obj, null, 2);
  } catch (_) {
    // Already pretty printed or simple string
  }

  const safeStr = formatted
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

  const highlighted = safeStr.replace(regex, (match) => {
    let style = 'color: #d97706; font-weight: 500;';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        style = 'color: #6366f1; font-weight: 600;';
      } else {
        style = 'color: #059669;';
      }
    } else if (/true|false/.test(match)) {
      style = 'color: #2563eb; font-weight: 500;';
    } else if (/null/.test(match)) {
      style = 'color: #9ca3af; font-style: italic;';
    }
    return `<span style="${style}">${match}</span>`;
  });

  return (
    <pre style={{
      margin: 0,
      fontFamily: 'monospace',
      fontSize: '11px',
      whiteSpace: 'pre-wrap',
      lineHeight: '1.5',
      color: 'hsl(var(--foreground))',
      wordBreak: 'break-all'
    }} dangerouslySetInnerHTML={{ __html: highlighted }} />
  );
};
