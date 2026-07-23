import React from 'react';
import { Select } from '../ui/Select';

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
  countdown?: number;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  month?: string;
  onMonthChange?: (month: string) => void;
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
    <Select
      options={options}
      value={value}
      onChange={e => onChange(String(e.target.value))}
      className="pl-9 py-[8.5px]"
      containerClassName="w-full"
    />
  </div>
);

function buildMonthOptions(): FilterOption[] {
  const months: FilterOption[] = [];
  const now = new Date();
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    months.push({ value: `${y}-${m}`, label: `${monthNames[d.getMonth()]} ${y}` });
  }
  return months;
}

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
  countdown,
  isRefreshing,
  onRefresh,
  month,
  onMonthChange,
}) => {
  const statusOptions = [
    { value: '', label: 'Todas as Situações' },
    { value: 'NOVO', label: 'Novo Lead (IA)' },
    { value: 'HUMANO', label: 'Em Atendimento' },
    { value: 'FINALIZADO', label: 'Finalizado' },
    { value: 'CONCLUIDO', label: 'Faturado' },
  ];

  const monthOptions = buildMonthOptions();

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

        {/* Month */}
        <FilterSelect
          icon="calendar_month"
          value={month || ''}
          onChange={val => onMonthChange?.(val)}
          options={monthOptions}
          minWidth="160px"
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

      {/* Right: view toggle and refresh button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {onRefresh && countdown !== undefined && (
          <button
            onClick={onRefresh}
            title="Clique para atualizar agora"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-border-low-contrast text-on-surface-variant hover:text-primary hover:border-primary transition-all text-body-sm group h-[38px] hover:shadow-sm"
          >
            <span
              className={`material-symbols-outlined text-[16px] transition-transform duration-500 ${isRefreshing ? 'rotate-180' : 'group-hover:rotate-90'}`}
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              refresh
            </span>
            <span className="text-[12px] font-medium tabular-nums w-4 text-left">{countdown}s</span>
            <svg width="18" height="18" className="-rotate-90 shrink-0">
              <circle
                cx="9" cy="9" r="7"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.15"
                strokeWidth="1.5"
              />
              <circle
                cx="9" cy="9" r="7"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.7"
                strokeWidth="1.5"
                strokeDasharray={2 * Math.PI * 7}
                strokeDashoffset={2 * Math.PI * 7 * (1 - countdown / 12)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.9s linear' }}
              />
            </svg>
          </button>
        )}

        <div className="flex bg-surface-container-low/85 p-1 rounded-xl border border-border-low-contrast/50 h-[38px] items-center shadow-inner">
          <button
            title="Visualização em Kanban"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all duration-300 group cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-primary font-bold scale-[1.02]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
            }`}
            onClick={() => onViewModeChange?.('kanban')}
          >
            <span
              className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:scale-105"
              style={{ fontVariationSettings: viewMode === 'kanban' ? "'FILL' 1" : "'FILL' 0" }}
            >
              view_kanban
            </span>
            <span className="text-[12px] uppercase tracking-wider font-bold">Kanban</span>
          </button>
          <button
            title="Visualização em Lista"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all duration-300 group cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-primary font-bold scale-[1.02]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
            }`}
            onClick={() => onViewModeChange?.('list')}
          >
            <span
              className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:scale-105"
              style={{ fontVariationSettings: viewMode === 'list' ? "'FILL' 1" : "'FILL' 0" }}
            >
              list
            </span>
            <span className="text-[12px] uppercase tracking-wider font-bold">Lista</span>
          </button>
        </div>
      </div>
    </div>
  );
};
