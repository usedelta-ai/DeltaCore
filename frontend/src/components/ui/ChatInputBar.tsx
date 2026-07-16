import React, { useRef } from 'react';

interface ChatInputBarProps {
  onSend?: (text: string) => void;
  placeholder?: string;
  hint?: string;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSend,
  placeholder = 'Ask Lia or message the team...',
  hint = 'Type @Lia for AI help',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const val = textareaRef.current?.value.trim();
    if (val) {
      onSend?.(val);
      if (textareaRef.current) textareaRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="delta-chat-input-area">
      <div className="delta-chat-input-container">
        <textarea
          ref={textareaRef}
          className="delta-chat-textarea"
          placeholder={placeholder}
          rows={3}
          onKeyDown={handleKeyDown}
          onFocus={e => {
            e.currentTarget.parentElement?.classList.add('scale-[1.005]');
            e.currentTarget.parentElement?.style.setProperty('transform', 'scale(1.005)');
          }}
          onBlur={e => {
            e.currentTarget.parentElement?.style.removeProperty('transform');
          }}
        />
        <div className="delta-chat-input-bottom">
          <div className="delta-chat-input-actions">
            <button className="delta-chat-input-action-btn">
              <span className="material-symbols-outlined">attach_file</span>
              <span className="hidden-sm">Attach</span>
            </button>
            <button className="delta-chat-input-action-btn">
              <span className="material-symbols-outlined">alternate_email</span>
              <span className="hidden-sm">Mention</span>
            </button>
          </div>
          <div className="delta-chat-input-right">
            <span className="delta-chat-hint hidden-lg">
              <strong>{hint.split('@')[0]}</strong>@
              {hint.split('@')[1]?.split(' ')[0]}
            </span>
            <button className="delta-send-btn" onClick={handleSend}>
              <span>Send</span>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
