import React from 'react';

interface TopAppBarProps {
  searchPlaceholder?: string;
  onProfileClick?: () => void;
  userAvatar?: string | null;
  userName?: string;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onProfileClick,
  userAvatar,
  userName = 'Profile',
}) => {
  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md border-b border-border-low-contrast dark:border-outline-variant flex justify-between items-center px-gutter z-40">
      <div className="flex items-center gap-4">

      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
        </button>
        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined" data-icon="help">help</span>
        </button>
        <button
          onClick={onProfileClick}
          style={{marginTop: '-7px'}}
          className="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border border-outline-variant cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        >
          {userAvatar ? (
            <img
              className="w-full h-full object-cover"
              alt={userName}
              src={userAvatar.startsWith('data:') ? userAvatar : `data:image/png;base64,${userAvatar}`}
            />
          ) : (
            <span className="text-xs font-bold text-on-secondary-container">
              {userName.charAt(0).toUpperCase()}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
