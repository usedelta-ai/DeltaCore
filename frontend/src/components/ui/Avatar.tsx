import React from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap: Record<string, string> = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-14 h-14 text-lg',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = '?',
  size = 'md',
  className = '',
}) => {
  if (src) {
    return (
      <img
        src={src.startsWith('data:') ? src : `data:image/png;base64,${src}`}
        alt={name}
        className={`${sizeMap[size]} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold flex-shrink-0 ${className}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
};
