import React from 'react';
import { Select } from './Select';
import type { SelectOption } from './Select';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-label-md font-label-md text-on-surface-variant">
        {label}
      </label>
      <input
        id={inputId}
        className={`px-3.5 py-3 text-body-sm rounded-xl border border-border-low-contrast bg-white text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10 ${
          error ? 'border-status-critical focus:border-status-critical focus:ring-status-critical/10' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="text-label-md text-status-critical">{error}</span>
      )}
    </div>
  );
};

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string | null;
  options: SelectOption[];
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  error,
  options,
  id,
  className = '',
  ...props
}) => {
  return (
    <Select
      label={label}
      error={error}
      options={options}
      id={id}
      className={className}
      {...props}
    />
  );
};

export type { SelectOption };

interface FormCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <label className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-surface-subtle border border-border-low-contrast cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        className="w-[18px] h-[18px] accent-primary rounded"
      />
      <span className="text-body-sm font-label-md text-on-surface">{label}</span>
    </label>
  );
};
