import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { JsonSyntaxHighlighter } from './JsonSyntaxHighlighter';

interface ToolResultCollapsibleProps {
  resultStr: string;
}

export const ToolResultCollapsible: React.FC<ToolResultCollapsibleProps> = ({ resultStr }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ marginTop: '10px' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: isOpen ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          padding: '6px 12px',
          borderRadius: '20px',
          cursor: 'pointer',
          color: '#10b981',
          fontSize: '11px',
          fontWeight: 600,
          outline: 'none',
          userSelect: 'none',
          transition: 'all 0.2s ease-in-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)';
          e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isOpen ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)';
          e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.15)';
        }}
      >
        <span style={{
          display: 'inline-flex',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease-in-out'
        }}>
          <ChevronDown size={14} />
        </span>
        <span>{isOpen ? 'Ocultar Resultado' : 'Visualizar Resultado / Retorno'}</span>
      </button>

      <div style={{
        maxHeight: isOpen ? '400px' : '0px',
        opacity: isOpen ? 1 : 0,
        overflowY: 'auto',
        transition: 'max-height 0.25s ease-in-out, opacity 0.2s ease-in-out, margin 0.2s ease-in-out',
        marginTop: isOpen ? '8px' : '0px',
      }}>
        {isOpen && (
          <div style={{
            margin: 0,
            padding: '10px 14px',
            background: 'rgba(16, 185, 129, 0.04)',
            borderLeft: '3px solid #10b981',
            border: '1px solid rgba(16, 185, 129, 0.1)',
            borderLeftWidth: '3px',
            borderRadius: '8px',
            overflowX: 'auto',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)'
          }}>
            <JsonSyntaxHighlighter jsonStr={resultStr} />
          </div>
        )}
      </div>
    </div>
  );
};
