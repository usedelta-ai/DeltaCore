import React from 'react';

export interface TimelineDot {
  type: 'ai' | 'human' | 'add';
  icon?: string;
  label?: string;
  src?: string;
}

interface TimelineDotsProps {
  dots: TimelineDot[];
  onViewAll?: () => void;
}

export const TimelineDots: React.FC<TimelineDotsProps> = ({ dots, onViewAll }) => {
  return (
    <div className="p-6 bg-surface-container-lowest border-t border-border-low-contrast mt-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="font-label-md text-on-surface-variant uppercase tracking-widest text-[10px] font-bold">
          Atividade Recente
        </span>
        <button 
          className="text-primary text-[10px] uppercase font-bold hover:underline cursor-pointer transition-all" 
          onClick={onViewAll}
        >
          Ver Tudo
        </button>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {dots.map((dot, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className="w-6 h-px bg-border-low-contrast/50 flex-shrink-0" />}
            {dot.type === 'ai' ? (
              <div className="relative group cursor-pointer flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center border-2 border-white ring-1 ring-primary/20 shadow-[0_0_12px_rgba(88,43,232,0.3)] hover:scale-105 transition-transform duration-200">
                  <span className="material-symbols-outlined text-white text-sm">
                    {dot.icon || 'smart_toy'}
                  </span>
                </div>
                {dot.label && (
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none z-50 shadow-sm border border-border-low-contrast">
                    {dot.label}
                  </div>
                )}
              </div>
            ) : dot.type === 'human' ? (
              <div className="relative group cursor-pointer flex-shrink-0">
                <div className="w-9 h-9 rounded-full border-2 border-white ring-1 ring-border-low-contrast overflow-hidden flex items-center justify-center bg-white shadow-sm hover:scale-105 transition-transform duration-200">
                  {dot.src ? (
                    <img src={dot.src} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full bg-secondary-container flex items-center justify-center text-[10px] font-bold text-on-secondary-container">
                      {dot.label?.charAt(0) || 'H'}
                    </div>
                  )}
                </div>
                {dot.label && (
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none z-50 shadow-sm border border-border-low-contrast">
                    {dot.label}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative group cursor-pointer flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-status-success/20 flex items-center justify-center border-2 border-white ring-1 ring-status-success/30 shadow-sm hover:scale-105 transition-transform duration-200">
                  <span className="material-symbols-outlined text-xs text-status-success">
                    {dot.icon || 'check_circle'}
                  </span>
                </div>
                {dot.label && (
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none z-50 shadow-sm border border-border-low-contrast">
                    {dot.label}
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
