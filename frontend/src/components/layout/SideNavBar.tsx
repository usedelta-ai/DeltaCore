import React, { useState, useEffect, useRef } from 'react';
import type { Tab as AppTab } from '../../App';

const ADD_LABELS: Record<AppTab, string> = {
  leads: 'Novo Lead',
  pessoas: 'Nova Pessoa',
  agents: 'Novo Agente',
  users: 'Novo Usuário',
  empresas: 'Nova Empresa',
  'follow-ups': 'Novo Follow-up',
  messages: '',
};

interface SideNavBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  systemName?: string;
  systemLogo?: string | null;
  isSuperAdmin?: boolean;
  onNewLead?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onLogout?: () => void;
  userName?: string;
  appVersion?: string;
}

const navItems = [
  { tab: 'empresas' as AppTab, icon: 'business', label: 'Empresas', superAdminOnly: true },
  { tab: 'agents' as AppTab, icon: 'smart_toy', label: 'Agentes', superAdminOnly: false },
  { tab: 'follow-ups' as AppTab, icon: 'event_repeat', label: 'Follow-ups', superAdminOnly: false },
  { tab: 'leads' as AppTab, icon: 'person_search', label: 'Leads', superAdminOnly: false },
  { tab: 'pessoas' as AppTab, icon: 'contact_page', label: 'Pessoas', superAdminOnly: false },
  { tab: 'messages' as AppTab, icon: 'chat', label: 'Histórico de Chat', superAdminOnly: true },
  { tab: 'users' as AppTab, icon: 'manage_accounts', label: 'Usuários', superAdminOnly: true },
];

export const SideNavBar: React.FC<SideNavBarProps> = ({
  activeTab,
  onTabChange,
  systemName = 'DeltaAI Admin',
  systemLogo = null,
  isSuperAdmin = false,
  onNewLead,
  collapsed = false,
  onToggleCollapse,
  onLogout,
  userName,
  appVersion,
}) => {
  const [logoError, setLogoError] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setLogoError(false);
  }, [systemLogo]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (collapsed) return;
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (onToggleCollapse) {
          onToggleCollapse();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [collapsed, onToggleCollapse]);

  const filteredItems = navItems.filter(item => !item.superAdminOnly || isSuperAdmin);

  return (
    <aside
      ref={sidebarRef}
      className={`fixed left-0 top-0 h-screen ${
        collapsed ? 'w-20' : 'w-64'
      } bg-surface-container-low dark:bg-surface-dim border-r border-border-low-contrast dark:border-outline-variant flex flex-col py-6 z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}
    >
      {/* Logo / Company Area */}
      <div className={`mb-8 ${collapsed ? 'px-4 flex justify-center' : 'px-4'}`}>
        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-3.5'}`}>
          {systemLogo && !logoError ? (
            <img
              src={systemLogo.startsWith('data:') ? systemLogo : `data:image/png;base64,${systemLogo}`}
              alt={systemName}
              className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-outline-variant/40"
              onError={() => setLogoError(true)}
            />
          ) : (
            isSuperAdmin ? (
              <img
                src="/logo.jpg"
                alt="DeltaAI"
                className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-outline-variant/40"
              />
            ) : (
              <div className="w-11 h-11 bg-primary rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/20">
                <span className="text-white font-bold text-xl">
                  {(userName || systemName).charAt(0).toUpperCase()}
                </span>
              </div>
            )
          )}
          {!collapsed && (
            <div className="overflow-hidden min-w-0">
              <h1 className="text-lg font-extrabold text-on-surface truncate">{systemName}</h1>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-border-low-contrast rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all cursor-pointer z-10 shadow-sm"
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        <span className="material-symbols-outlined text-sm">
          {collapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? 'flex flex-col items-center' : ''} space-y-1 px-3`}>
        {filteredItems.map(item => (
          <button
            key={item.tab}
            onClick={() => onTabChange(item.tab)}
            title={collapsed ? item.label : undefined}
            className={`flex items-center ${
              collapsed ? 'justify-center w-10 h-10' : 'gap-3 w-full px-3 py-2.5'
            } rounded-lg transition-all duration-200 text-left ${
              activeTab === item.tab
                ? 'bg-secondary-container text-on-secondary-container font-bold scale-[0.99]'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className={`material-symbols-outlined flex-shrink-0 ${activeTab === item.tab ? 'text-primary' : ''}`}>{item.icon}</span>
            {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom: Company Info + Logout */}
      <div className={`mt-auto pt-4 px-3 border-t border-border-low-contrast ${collapsed ? 'flex flex-col items-center px-0' : ''}`}>
        {onNewLead && ADD_LABELS[activeTab] && (activeTab !== 'agents' || isSuperAdmin) && (
          <button
            onClick={onNewLead}
            className={`${
              collapsed
                ? 'w-10 h-10 flex items-center justify-center rounded-xl mt-4'
                : 'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl mt-4'
            } bg-primary text-on-primary font-bold hover:opacity-90 transition-opacity cursor-pointer mb-4`}
            title={collapsed ? ADD_LABELS[activeTab] : undefined}
          >
            <span className="material-symbols-outlined text-sm">add</span>
            {!collapsed && <span className="text-sm">{ADD_LABELS[activeTab]}</span>}
          </button>
        )}

        {/* Version */}
        {appVersion && (
          <div className={`mb-2 ${collapsed ? 'text-center' : 'px-3'}`}>
            <span className="text-[10px] text-on-surface-variant/50 font-mono">
              {collapsed ? 'v' : 'v'} {appVersion}
            </span>
          </div>
        )}

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className={`flex items-center w-full ${
              collapsed ? 'justify-center w-10 h-10' : 'gap-3 px-3 py-2.5'
            } rounded-lg text-on-surface-variant hover:bg-status-critical/10 hover:text-status-critical transition-all duration-200`}
            title="Sair"
          >
            <span className="material-symbols-outlined flex-shrink-0 text-lg">logout</span>
            {!collapsed && <span className="text-sm font-medium">Sair</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
