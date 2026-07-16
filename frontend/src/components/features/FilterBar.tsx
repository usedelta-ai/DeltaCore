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
  viewMode?: 'kanban' | 'list';
  onViewModeChange?: (mode: 'kanban' | 'list') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  companyOptions = [],
  agentOptions = [],
  selectedCompany = '',
  selectedAgent = '',
  onCompanyChange,
  onAgentChange,
  viewMode = 'kanban',
  onViewModeChange,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-label-md text-on-surface-variant ml-1">Company</label>
          <select
            className="bg-surface border-border-low-contrast rounded-lg text-body-sm focus:ring-primary focus:border-primary px-4 py-2 min-w-[180px]"
            value={selectedCompany}
            onChange={e => onCompanyChange?.(e.target.value)}
          >
            <option value="">All Companies</option>
            {companyOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-label-md text-on-surface-variant ml-1">Agent</label>
          <select
            className="bg-surface border-border-low-contrast rounded-lg text-body-sm focus:ring-primary focus:border-primary px-4 py-2 min-w-[180px]"
            value={selectedAgent}
            onChange={e => onAgentChange?.(e.target.value)}
          >
            <option value="">All Agents</option>
            {agentOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-auto">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-low-contrast text-body-sm hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-[18px]" data-icon="filter_list">filter_list</span>
          More Filters
        </button>

        <div className="h-8 w-[1px] bg-border-low-contrast mx-2" />

        <div className="flex bg-surface-container-low p-1 rounded-lg">
          <button
            className={`p-1 px-3 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => onViewModeChange?.('kanban')}
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="view_kanban" style={{ fontVariationSettings: "'FILL' 1" }}>view_kanban</span>
          </button>
          <button
            className={`p-1 px-3 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => onViewModeChange?.('list')}
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="list">list</span>
          </button>
        </div>
      </div>
    </div>
  );
};
