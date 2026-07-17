import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string | null;
  containerClassName?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  id,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="text-label-md font-label-md text-on-surface-variant ml-1 font-semibold">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        <select
          id={selectId}
          className={`w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-4 py-2 pr-10 text-body-sm text-on-surface outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/10 focus:border-primary appearance-none cursor-pointer disabled:opacity-70 ${
            error ? 'border-status-critical focus:border-status-critical focus:ring-status-critical/10' : ''
          } ${className}`}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-3 pointer-events-none text-on-surface-variant text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>
          keyboard_arrow_down
        </span>
      </div>
      {error && (
        <span className="text-label-md text-status-critical ml-1">{error}</span>
      )}
    </div>
  );
};
