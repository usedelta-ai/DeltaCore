import React, { useState, useMemo } from 'react';
import type { TimelineEvent } from '../../hooks/useLeadDetail';

interface ActivityModalProps {
  events: TimelineEvent[];
  leadName?: string;
  onClose: () => void;
}

type FilterType = 'all' | 'ai' | 'human' | 'system';

export const ActivityModal: React.FC<ActivityModalProps> = ({ events, leadName, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState<FilterType>('all');
  const [userFilter, setUserFilter] = useState('all');

  const filteredEvents = useMemo(() => {
    let result = events;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        e =>
          e.label.toLowerCase().includes(q) ||
          (e.description || '').toLowerCase().includes(q)
      );
    }

    if (activityFilter !== 'all') {
      result = result.filter(e => e.type === activityFilter);
    }

    if (userFilter !== 'all') {
      result = result.filter(e => e.type === userFilter);
    }

    return [...result].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [events, searchQuery, activityFilter, userFilter]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    for (const event of filteredEvents) {
      const eventDate = new Date(event.timestamp);
      eventDate.setHours(0, 0, 0, 0);
      
      let dateLabel = eventDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
      let dayLabel = dateLabel;

      if (eventDate.getTime() === today.getTime()) {
        dayLabel = 'Hoje';
      } else if (eventDate.getTime() === yesterday.getTime()) {
        dayLabel = 'Ontem';
      } else {
        const weekday = eventDate.toLocaleDateString('pt-BR', { weekday: 'long' });
        dayLabel = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      }

      const key = `${dayLabel}||${dateLabel}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    }
    return groups;
  }, [filteredEvents]);

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + ["Data,Hora,Tipo,Evento,Descricao"].join(",") + "\n"
      + filteredEvents.map(e => {
          const date = new Date(e.timestamp).toLocaleDateString('pt-BR');
          const time = new Date(e.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          return `"${date}","${time}","${e.type}","${e.label.replace(/"/g, '""')}","${(e.description || '').replace(/"/g, '""')}"`;
        }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `historico_atividades_${leadName || 'lead'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 md:p-8" onClick={onClose}>
      <div 
        className="w-full max-w-6xl h-full max-h-[90vh] bg-surface-container-lowest rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <header className="flex items-center justify-between px-8 h-20 border-b border-border-low-contrast flex-shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">Histórico de Atividades</h2>
            <div className="hidden md:flex relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
              <input 
                className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full w-64 text-body-sm focus:ring-2 focus:ring-primary transition-all outline-none" 
                placeholder="Pesquisar registros..." 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-border-low-contrast hover:bg-surface-container rounded-xl font-semibold transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              <span className="text-body-sm">Exportar Log</span>
            </button>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer" 
              title="Fechar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </header>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth bg-surface">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-border-low-contrast shadow-sm hover:border-primary transition-colors cursor-pointer group">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">filter_list</span>
              <select 
                value={activityFilter}
                onChange={e => setActivityFilter(e.target.value as FilterType)}
                className="text-body-sm font-medium border-none p-0 bg-transparent focus:ring-0 cursor-pointer outline-none"
              >
                <option value="all">Tipo de Atividade: Todos</option>
                <option value="ai">Tipo: Agente IA</option>
                <option value="human">Tipo: Atendente Humano</option>
                <option value="system">Tipo: Sistema / Transição de Status</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-border-low-contrast shadow-sm hover:border-primary transition-colors cursor-pointer group">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">group</span>
              <select 
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
                className="text-body-sm font-medium border-none p-0 bg-transparent focus:ring-0 cursor-pointer outline-none"
              >
                <option value="all">Responsável: Todos</option>
                <option value="ai">Apenas Agente IA</option>
                <option value="human">Apenas Humanos</option>
                <option value="system">Apenas Sistema</option>
              </select>
            </div>
          </div>

          {/* Timeline Content */}
          <div className="max-w-4xl mx-auto">
            {Object.keys(groupedByDate).length === 0 ? (
              <div className="text-center py-16 text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl block mb-3">search_off</span>
                <p className="text-body-lg">Nenhuma atividade encontrada para os filtros selecionados.</p>
              </div>
            ) : (
              Object.entries(groupedByDate).map(([key, dayEvents]) => {
                const [dayLabel, dateLabel] = key.split('||');
                const isToday = dayLabel === 'Hoje';
                return (
                  <section key={key} className="relative mb-8">
                    <div className="flex items-center gap-4 mb-6">
                      <h3 className={`font-headline-md text-headline-md font-bold ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {dayLabel}
                      </h3>
                      <div className="h-[1px] flex-1 bg-border-low-contrast opacity-50"></div>
                      <span className="text-label-md text-on-surface-variant">{dateLabel}</span>
                    </div>

                    <div className="relative space-y-6 ml-2 pl-0.5 border-l border-border-low-contrast/50">
                      {dayEvents.map((event, idx) => {
                        const isAI = event.type === 'ai';
                        const isSystem = event.type === 'system';
                        
                        return (
                          <div key={event.id || idx} className="relative pl-12 group">
                            {/* Icon container */}
                            {isAI ? (
                              <div className="absolute left-[-22px] top-1 w-11 h-11 rounded-full bg-white flex items-center justify-center z-10 border border-border-low-contrast shadow-[0_0_15px_rgba(64,0,198,0.1)]">
                                <span className="material-symbols-outlined text-primary text-xl">{event.icon || 'smart_toy'}</span>
                              </div>
                            ) : isSystem ? (
                              <div className="absolute left-[-22px] top-1 w-11 h-11 rounded-full bg-white flex items-center justify-center z-10 border border-border-low-contrast">
                                <div className="w-8 h-8 rounded-full bg-status-success/20 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-status-success text-xl">{event.icon || 'check_circle'}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="absolute left-[-20px] top-1 w-10 h-10 rounded-full bg-white flex items-center justify-center z-10 border border-border-low-contrast overflow-hidden">
                                {event.avatarSrc ? (
                                  <img className="w-full h-full object-cover" src={event.avatarSrc} alt="Profile" />
                                ) : (
                                  <span className="material-symbols-outlined text-on-surface-variant text-lg">person</span>
                                )}
                              </div>
                            )}

                            {/* Card content */}
                            <div className={`bg-white border border-border-low-contrast p-6 rounded-xl shadow-sm hover:shadow-md transition-all group-hover:translate-x-1 cursor-pointer ${isSystem ? 'border-l-4 border-l-status-success' : ''}`}>
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-on-surface text-body-lg">{event.label}</h4>
                                <span className="text-label-md text-on-surface-variant">{formatTimestamp(event.timestamp)}</span>
                              </div>
                              
                              {event.description && (
                                <p className="text-body-md text-on-surface-variant leading-relaxed mb-3">
                                  {event.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {isAI ? (
                                  <span className="px-2.5 py-0.5 bg-secondary-container text-on-secondary-container text-[11px] font-semibold rounded-full flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">smart_toy</span>
                                    Tarefa Automatizada
                                  </span>
                                ) : isSystem ? (
                                  <span className="px-2.5 py-0.5 bg-status-success/15 text-status-success text-[11px] font-semibold rounded-full flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">settings</span>
                                    Sistema / Evento
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 bg-primary-fixed/30 text-on-primary-fixed text-[11px] font-semibold rounded-full flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">person</span>
                                    Operador
                                  </span>
                                )}
                                
                                {/* Extracts operator name from taken_motive / motive description if present */}
                                {event.description && event.description.includes(' por ') && (
                                  <span className="px-2.5 py-0.5 bg-surface-container-high text-on-surface-variant text-[11px] font-bold rounded-full">
                                    Ação por: {event.description.split(' por ').pop()?.replace(/\.$/, '')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <footer className="h-16 px-8 border-t border-border-low-contrast bg-white flex items-center justify-end flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all cursor-pointer"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
};

