import React from 'react';
import { useLeadAvatar } from '../../hooks/useLeadAvatar';

interface LeadAvatarProps {
  leadId: number;
  avatarType: 'ai' | 'human';
  avatarLabel: string;
  src?: string | null;
  className?: string;
}

export const LeadAvatar: React.FC<LeadAvatarProps> = ({
  leadId,
  avatarType,
  avatarLabel,
  src,
  className = '',
}) => {
  const { data: fetchedSrc } = useLeadAvatar(leadId, avatarType !== 'ai' && !src);

  const avatarSrc = src ?? fetchedSrc;
  const avatarBg = avatarType === 'ai' ? 'bg-blue-500' : 'bg-secondary';

  return (
    <div
      className={`${avatarBg} flex items-center justify-center text-white font-bold rounded-full overflow-hidden shrink-0 ${className}`}
    >
      {avatarType === 'ai' ? (
        'Δ'
      ) : avatarSrc ? (
        <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
      ) : (
        avatarLabel
      )}
    </div>
  );
};
