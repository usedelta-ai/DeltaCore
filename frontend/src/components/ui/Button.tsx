import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:opacity-90 shadow-md shadow-primary/20',
  secondary: 'bg-surface-container text-on-surface border border-border-low-contrast hover:bg-surface-container-high',
  danger: 'bg-status-critical/10 text-status-critical border border-status-critical/20 hover:bg-status-critical/20',
  ghost: 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
  success: 'bg-status-success text-white hover:opacity-90 shadow-md shadow-status-success/20',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-label-md rounded-lg',
  md: 'px-4 py-2 text-label-md rounded-xl',
  lg: 'px-6 py-3 text-body-md rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
