import React from 'react';

interface TopAppBarProps {
  searchPlaceholder?: string;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  searchPlaceholder = 'Search leads, agents, or activities...',
}) => {
  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md border-b border-border-low-contrast dark:border-outline-variant flex justify-between items-center px-gutter z-40">
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-outline">
            <span className="material-symbols-outlined" data-icon="search">search</span>
          </span>
          <input
            className="block w-full pl-10 pr-3 py-2 border-0 bg-surface-container-low rounded-lg focus:ring-2 focus:ring-primary text-body-sm transition-all"
            type="text"
            placeholder={searchPlaceholder}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
        </button>
        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined" data-icon="help">help</span>
        </button>
        <div className="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border border-outline-variant">
          <img
            className="w-full h-full object-cover"
            alt="Profile"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDV8UVoISFjv8pqJiEO2JNa2HP7lyM8oLdV6XAFD6XL45YJiuYOgSyPjTE75bm6Esh29gnjQ1AsApnQdq4Coj5Rv3JcJflH_ZTw1cHyW0mQRQItFferleGWUAq--xw2oQqiW6aKujgQ_3HisoQGFFrfBc_oTt2OV2aRuK0fp_2BB2j7GUxr5W9vPM5I0Fq6j165OgXPzKXCkM8ucRaP80p9rA8mLyRqBlPCYO9gMJVHXu4HDoS8D5IeOf-KZE_x0V4iRiMWPhanOPs"
          />
        </div>
      </div>
    </header>
  );
};
