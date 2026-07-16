import React, { useState, useRef, useEffect } from 'react';

interface AccordionProps {
  defaultOpen?: boolean;
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  defaultOpen = false,
  trigger,
  children,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  return (
    <div
      className={`bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-surface-container-low transition-colors text-left"
        type="button"
      >
        {trigger}
        <span
          className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>
      <div
        className="transition-all duration-300 overflow-hidden"
        style={{ maxHeight: isOpen ? contentHeight : 0, opacity: isOpen ? 1 : 0 }}
      >
        <div ref={contentRef} className="px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
};
