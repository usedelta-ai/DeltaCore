import React from 'react';
import type { ChatMessage } from '../../services/api';

interface SystemEventBubbleProps {
  msg: ChatMessage;
}

export const SystemEventBubble: React.FC<SystemEventBubbleProps> = ({ msg }) => {
  const eventDate = msg.createdAt ? new Date(msg.createdAt) : null;
  const formattedDate = eventDate
    ? eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';
  const eventColor = msg.content?.includes('✅') ? '#16a34a' : '#7c3aed';

  return (
    <div className="flex flex-col items-center gap-1 px-4 py-2 my-1.5 self-center w-full max-w-[90%]">
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 flex items-center">
          <div className="flex-1 h-[2px] rounded-full" style={{
            background: `linear-gradient(to right, transparent, ${eventColor}44, ${eventColor}88)`,
          }} />
          <span className="text-[10px] ml-1" style={{ color: eventColor }}>◆</span>
        </div>
        <span className="text-label-md font-bold text-center whitespace-nowrap px-3.5 py-1 rounded-full" style={{
          color: eventColor,
          background: `${eventColor}11`,
        }}>
          {msg.content}
        </span>
        <div className="flex-1 flex items-center">
          <span className="text-[10px] mr-1" style={{ color: eventColor }}>◆</span>
          <div className="flex-1 h-[2px] rounded-full" style={{
            background: `linear-gradient(to left, transparent, ${eventColor}44, ${eventColor}88)`,
          }} />
        </div>
      </div>
      {formattedDate && (
        <span className="text-[11px] text-on-surface-variant font-medium tracking-wide">
          {formattedDate}
        </span>
      )}
    </div>
  );
};
