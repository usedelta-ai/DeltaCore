import React from 'react';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  primary: 'bg-primary-container/20 text-primary border-primary/20',
  success: 'bg-status-success/10 text-status-success border-status-success/20',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-status-critical/10 text-status-critical border-status-critical/20',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  secondary: 'bg-surface-variant/50 text-on-surface-variant border-outline-variant/30',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  children,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
