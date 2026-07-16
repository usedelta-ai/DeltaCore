import React from 'react';

interface ChatMessage {
  id: string;
  type: 'ai' | 'attendant' | 'lead';
  author: string;
  time: string;
  content: React.ReactNode;
  avatarIcon?: string;
  avatarSrc?: string;
  quotedMessage?: { text: string; author: string };
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const { type, author, time, content, avatarIcon, avatarSrc, quotedMessage } = message;
  const isRight = type === 'ai' || type === 'attendant';

  let avatarBg: string;
  let bubbleBg: string;
  let bubbleRadius: string;
  let textColor: string;
  let authorColor: string;
  let quoteBorder: string;

  if (type === 'ai') {
    avatarBg = 'bg-gradient-to-br from-primary to-ai-accent';
    bubbleBg = 'bg-surface-container text-on-surface';
    bubbleRadius = 'rounded-2xl rounded-tr-none';
    textColor = 'text-on-surface';
    authorColor = 'text-on-surface';
    quoteBorder = 'border-primary/40';
  } else if (type === 'attendant') {
    avatarBg = 'bg-secondary-container';
    bubbleBg = 'bg-secondary-container/40 text-on-secondary-container';
    bubbleRadius = 'rounded-2xl rounded-tr-none';
    textColor = 'text-on-secondary-container';
    authorColor = 'text-secondary';
    quoteBorder = 'border-secondary/40';
  } else {
    avatarBg = 'bg-surface-container-high';
    bubbleBg = 'bg-primary-container/30 text-on-primary-container';
    bubbleRadius = 'rounded-2xl rounded-tl-none';
    textColor = 'text-black';
    authorColor = 'text-primary';
    quoteBorder = 'border-primary/50';
  }

  const isPending = String(message.id).startsWith('temp-');

  return (
    <div className={`flex gap-3 ${isRight ? 'flex-row-reverse ml-auto' : 'mr-auto'} ${isPending ? 'opacity-70 animate-pulse pointer-events-none' : ''} transition-all duration-300`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${avatarBg}`}>
        {type === 'ai' ? (
          avatarSrc ? (
            <img src={avatarSrc} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="material-symbols-outlined" style={{ color: 'white', fontSize: 18 }}>
              {avatarIcon || 'smart_toy'}
            </span>
          )
        ) : avatarSrc ? (
          <img src={avatarSrc} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-on-surface-variant font-bold text-[10px]">
            {author.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className={`flex flex-col gap-1 max-w-[70%] ${isRight ? 'items-end' : ''}`}>
        <div className={`flex items-center gap-2 ${isRight ? 'flex-row-reverse' : ''}`}>
          <span className={`text-label-md font-label-md ${authorColor}`}>{author}</span>
          {isPending ? (
            <span className="text-[10px] text-on-surface-variant flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              Enviando...
            </span>
          ) : (
            <span className="text-[10px] text-on-surface-variant">{time}</span>
          )}
        </div>

        <div className={`px-4 py-3 ${bubbleBg} ${bubbleRadius}`}>
          {quotedMessage && (
            <div className={`mb-2 pl-2.5 border-l-[3px] pb-1.5 text-xs italic ${quoteBorder}`}>
              <div className="font-bold text-[10px] uppercase tracking-wider text-on-surface-variant mb-0.5">
                {quotedMessage.author}
              </div>
              <div className="text-on-surface-variant/70 line-clamp-2">
                {quotedMessage.text}
              </div>
            </div>
          )}
          {typeof content === 'string' ? (
            <p className={`text-body-sm ${textColor} m-0 whitespace-pre-wrap leading-relaxed`}>
              {content}
            </p>
          ) : (
            <div className={`text-body-sm ${textColor} m-0 leading-relaxed`}>
              {content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};