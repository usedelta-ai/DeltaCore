import React from 'react';
import { useLeadAvatar } from '../../hooks/useLeadAvatar';

interface LeadAvatarProps {
  leadId: number;
  avatarType: 'ai' | 'human';
  avatarLabel: string;
  className?: string;
}

/**
 * Displays a lead's WhatsApp profile picture fetched asynchronously from
 * the Evolution API. Uses TanStack Query with 30-minute stale/refetch.
 *
 * Falls back to the initials avatar (avatarLabel) while loading or if no image
 * is available — matching the existing behaviour.
 */
export const LeadAvatar: React.FC<LeadAvatarProps> = ({
  leadId,
  avatarType,
  avatarLabel,
  className = '',
}) => {
  const { data: src } = useLeadAvatar(leadId, avatarType !== 'ai');

  const avatarBg = avatarType === 'ai' ? 'bg-blue-500' : 'bg-secondary';

  return (
    <div
      className={`${avatarBg} flex items-center justify-center text-white font-bold rounded-full overflow-hidden shrink-0 ${className}`}
    >
      {avatarType === 'ai' ? (
        'Δ'
      ) : src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        avatarLabel
      )}
    </div>
  );
};
