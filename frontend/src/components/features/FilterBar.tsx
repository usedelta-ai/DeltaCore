import React from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  companyOptions?: FilterOption[];
  agentOptions?: FilterOption[];
  selectedCompany?: string;
  selectedAgent?: string;
  onCompanyChange?: (val: string) => void;
  onAgentChange?: (val: string) => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  selectedStatus?: string;
  onStatusChange?: (val: string) => void;
  viewMode?: 'kanban' | 'list';
  onViewModeChange?: (mode: 'kanban' | 'list') => void;
}

interface FilterSelectProps {
  icon: string;
  value: string;
  onChange: (val: string) => void;
  options: FilterOption[];
  minWidth?: string;
}

const FilterSelect: React.FC<FilterSelectProps> = ({ icon, value, onChange, options, minWidth = '180px' }) => (
  <div className="relative flex items-center" style={{ minWidth }}>
    <span
      className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[17px] pointer-events-none z-10"
      style={{ fontVariationSettings: "'FILL' 0" }}
    >
      {icon}
    </span>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl pl-9 pr-8 py-[9px] text-body-sm text-on-surface outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/10 focus:border-primary appearance-none cursor-pointer hover:border-primary/40"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    <span
      className="material-symbols-outlined absolute right-2.5 pointer-events-none text-on-surface-variant text-[18px]"
      style={{ fontVariationSettings: "'FILL' 0" }}
    >
      keyboard_arrow_down
    </span>
  </div>
);

export const FilterBar: React.FC<FilterBarProps> = ({
  companyOptions = [],
  agentOptions = [],
  selectedCompany = '',
  selectedAgent = '',
  onCompanyChange,
  onAgentChange,
  searchTerm = '',
  onSearchChange,
  selectedStatus = '',
  onStatusChange,
  viewMode = 'kanban',
  onViewModeChange,
}) => {
  const statusOptions = [
    { value: '', label: 'Todas as Situações' },
    { value: 'NOVO', label: 'Novo Lead (IA)' },
    { value: 'HUMANO', label: 'Em Atendimento' },
    { value: 'FINALIZADO', label: 'Finalizado' },
    { value: 'CONCLUIDO', label: 'Faturado' },
  ];

  return (
    <div className="flex items-center justify-between gap-3 mb-8 w-full px-4 flex-wrap">
      {/* Left group: all filters in one row */}
      <div className="flex items-center gap-2 flex-wrap flex-1">
        {/* Search */}
        <div className="relative flex items-center" style={{ minWidth: '210px' }}>
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[17px] pointer-events-none z-10">
            search
          </span>
          <input
            type="text"
            placeholder="Nome ou telefone..."
            value={searchTerm}
            onChange={e => onSearchChange?.(e.target.value)}
            className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl text-body-sm text-on-surface focus:ring-2 focus:ring-primary/10 focus:border-primary pl-9 pr-4 py-[9px] outline-none transition-all duration-200 hover:border-primary/40 placeholder:text-on-surface-variant/60"
          />
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border-low-contrast hidden sm:block" />

        {/* Company */}
        {companyOptions.length > 0 && (
          <FilterSelect
            icon="business"
            value={selectedCompany}
            onChange={val => onCompanyChange?.(val)}
            options={[{ value: '', label: 'Todas as Empresas' }, ...companyOptions]}
            minWidth="180px"
          />
        )}

        {/* Agent */}
        <FilterSelect
          icon="support_agent"
          value={selectedAgent}
          onChange={val => onAgentChange?.(val)}
          options={[{ value: '', label: 'Todos os Agentes' }, ...agentOptions]}
          minWidth="180px"
        />

        {/* Status */}
        <FilterSelect
          icon="label"
          value={selectedStatus}
          onChange={val => onStatusChange?.(val)}
          options={statusOptions}
          minWidth="185px"
        />
      </div>

      {/* Right: view toggle */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex bg-surface-container-low p-1 rounded-xl border border-border-low-contrast">
          <button
            title="Kanban"
            className={`p-1.5 px-3 rounded-lg transition-all duration-200 ${
              viewMode === 'kanban'
                ? 'bg-white shadow-sm text-primary'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
            onClick={() => onViewModeChange?.('kanban')}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: viewMode === 'kanban' ? "'FILL' 1" : "'FILL' 0" }}
            >
              view_kanban
            </span>
          </button>
          <button
            title="Lista"
            className={`p-1.5 px-3 rounded-lg transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-white shadow-sm text-primary'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
            onClick={() => onViewModeChange?.('list')}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: viewMode === 'list' ? "'FILL' 1" : "'FILL' 0" }}
            >
              list
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
