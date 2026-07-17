import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement> | { target: { name?: string; value: string | number } }) => void;
  error?: string | null;
  containerClassName?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  variant?: 'outline' | 'minimal';
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  error,
  containerClassName = '',
  className = '',
  placeholder = 'Selecione uma opção...',
  disabled = false,
  name,
  id,
  variant = 'outline',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // Find the selected option
  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search term
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      setHighlightedIndex(-1);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Scroll active option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (opt: SelectOption) => {
    if (onChange) {
      onChange({
        target: {
          name,
          value: opt.value,
        },
      } as any);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const isMinimal = variant === 'minimal';

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col gap-1.5 w-full relative ${containerClassName}`}
    >
      {label && (
        <label 
          htmlFor={selectId} 
          className="text-label-md font-label-md text-on-surface-variant ml-1 font-semibold select-none"
        >
          {label}
        </label>
      )}
      
      <div className="relative w-full">
        {/* Trigger Button */}
        <button
          id={selectId}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={
            isMinimal
              ? `w-full bg-transparent border-none p-0 pr-6 text-body-md font-medium mt-1 focus:ring-0 focus:outline-none cursor-pointer disabled:opacity-75 text-on-surface flex items-center justify-between relative ${className}`
              : `w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-4 py-2.5 pr-10 text-body-sm text-on-surface text-left outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/10 focus:border-primary cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-between shadow-sm hover:border-outline-variant/60 ${
                  error ? 'border-status-critical focus:border-status-critical focus:ring-status-critical/10' : ''
                } ${className}`
          }
        >
          <span className={`truncate ${!selectedOption ? 'text-on-surface-variant/50' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span 
            className={`material-symbols-outlined text-on-surface-variant text-[20px] transition-transform duration-200 pointer-events-none absolute ${
              isMinimal ? 'right-0' : 'right-3'
            }`}
            style={{ 
              fontVariationSettings: "'FILL' 0",
              transform: isOpen ? 'rotate(180deg)' : 'none'
            }}
          >
            keyboard_arrow_down
          </span>
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute z-50 w-full min-w-[220px] mt-2 bg-surface-container-lowest border border-border-low-contrast rounded-xl shadow-lg shadow-black/5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 left-0">
            {/* Search Input */}
            <div className="p-2 border-b border-border-low-contrast flex items-center gap-2 bg-surface-container-low">
              <span className="material-symbols-outlined text-on-surface-variant/60 text-[18px]">
                search
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Buscar..."
                className="w-full bg-transparent border-none text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-0.5 hover:bg-surface-variant rounded-full text-on-surface-variant/60"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>

            {/* Options List */}
            <div 
              ref={listRef}
              className="max-h-60 overflow-y-auto custom-scrollbar p-1"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`w-full text-left px-3 py-2 text-body-sm rounded-lg flex items-center justify-between transition-colors duration-150 cursor-pointer ${
                        isSelected 
                          ? 'bg-primary/10 text-primary font-semibold' 
                          : isHighlighted 
                            ? 'bg-surface-container text-on-surface' 
                            : 'text-on-surface hover:bg-surface-container/50'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          check
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-label-md text-on-surface-variant/60 select-none">
                  Nenhum resultado encontrado
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <span className="text-label-md text-status-critical ml-1">{error}</span>
      )}
    </div>
  );
};
