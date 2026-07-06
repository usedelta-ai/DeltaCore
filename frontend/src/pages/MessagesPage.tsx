import React, { useState, useEffect, useRef } from 'react';
import { Search, Bot, User, Wrench, ArrowDownCircle, Circle, CheckCheck } from 'lucide-react';
import type { ChatMessage } from '../services/api';
import { MediaMessageRenderer } from '../components/features/MediaMessageRenderer';
import { ToolResultCollapsible } from '../components/ui/ToolResultCollapsible';
import { JsonSyntaxHighlighter } from '../components/ui/JsonSyntaxHighlighter';
import { formatWhatsAppText } from '../utils/whatsappFormat';

function tryParseJson(str: string): any {
  if (!str) return null;
  const trimmed = str.trim();
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      return JSON.parse(str);
    } catch (_) {
      return null;
    }
  }
  return null;
}

interface MessagesPageProps {
  chatSearchQuery: string;
  setChatSearchQuery: (v: string) => void;
  getGroupedLeads: () => any[];
  selectedLeadId: number | null;
  setSelectedLeadId: (id: number) => void;
  chatHistory: ChatMessage[];
  historySource: string;
  historyTable: string;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  selectedLeadName?: string;
  userName?: string;
  systemLogo?: string | null;
}

export function cleanMessageContent(content: string): string {
  if (!content) return '';
  let cleaned = content;
  cleaned = cleaned.replace(/<userMsg>([\s\S]*?)<\/userMsg>/gi, '$1');
  cleaned = cleaned.replace(/<botMsg>([\s\S]*?)<\/botMsg>/gi, '$1');
  cleaned = cleaned.replace(/<aiMsg>([\s\S]*?)<\/aiMsg>/gi, '$1');
  cleaned = cleaned.replace(/<agentMsg>([\s\S]*?)<\/agentMsg>/gi, '$1');
  cleaned = cleaned.replace(/<assistantMsg>([\s\S]*?)<\/assistantMsg>/gi, '$1');
  cleaned = cleaned.replace(/<systemMsg>([\s\S]*?)<\/systemMsg>/gi, '$1');
  return cleaned.trim();
}

function formatTime(date: any): string {
  if (!date) return '';
  try {
    return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// Renders a single n8n "turn" — a JSON array row from the dynamic table
function N8nTurnBubble({ msg, agentName, systemLogo }: { msg: ChatMessage; agentName?: string; systemLogo?: string | null }) {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const parsed = tryParseJson(msg.content);
  if (!Array.isArray(parsed)) return null;

  const toggleCollapse = (idx: number) => setCollapsed(p => ({ ...p, [idx]: !p[idx] }));

  return (
    <div style={{
      alignSelf: 'flex-start',
      maxWidth: '82%',
      width: 'fit-content',
      minWidth: '260px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      {parsed.map((item: any, idx: number) => {
        const role = (item.role || '').toLowerCase();

        // ── User / Human turn inside n8n history (quoted context)
        if (role === 'user' || role === 'human') {
          const userText = cleanMessageContent(typeof item.content === 'string' ? item.content : JSON.stringify(item.content));
          if (!userText) return null;
          return (
            <div key={idx} style={{
              alignSelf: 'flex-end',
              background: '#d9fdd3',
              borderRadius: '12px 0 12px 12px',
              padding: '10px 14px 22px 14px',
              maxWidth: '100%',
              position: 'relative',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            }}>
              <div style={{ fontSize: '11px', color: '#25d366', fontWeight: 700, marginBottom: '2px' }}>Lead</div>
              <div style={{ fontSize: '14px', color: '#111b21', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{formatWhatsAppText(userText)}</div>
              <div style={{ position: 'absolute', bottom: '5px', right: '10px', fontSize: '10px', color: '#667781' }}>
                {formatTime(msg.createdAt)}
              </div>
            </div>
          );
        }

        // ── Assistant text response
        if ((role === 'assistant' || role === 'ai') && !Array.isArray(item.content)) {
          let assistantText = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
          try {
            const p = JSON.parse(assistantText);
            if (p && Array.isArray(p.messages)) assistantText = p.messages.join('\n');
            else if (p && typeof p.message === 'string') assistantText = p.message;
          } catch (_) {}
          const cleanedText = cleanMessageContent(assistantText);
          if (!cleanedText) return null;
          return (
            <div key={idx} style={{
              alignSelf: 'flex-start',
              background: '#ffffff',
              borderRadius: '0 12px 12px 12px',
              padding: '10px 14px 22px 14px',
              maxWidth: '100%',
              position: 'relative',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            }}>
              <div style={{ fontSize: '11px', color: '#0088cc', fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {systemLogo ? (
                  <img src={systemLogo} alt="" style={{ width: '14px', height: '14px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : agentName ? (
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#0088cc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700 }}>{agentName[0].toUpperCase()}</div>
                ) : (
                  <Bot size={11} />
                )}
                {agentName || 'Agente'}
              </div>
              <div style={{ fontSize: '14px', color: '#111b21', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{formatWhatsAppText(cleanedText)}</div>
              <div style={{ position: 'absolute', bottom: '5px', right: '10px', fontSize: '10px', color: '#667781' }}>
                {formatTime(msg.createdAt)}
              </div>
            </div>
          );
        }

        // ── Tool calls (assistant with array content)
        if ((role === 'assistant' || role === 'ai') && Array.isArray(item.content)) {
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {item.content.map((tc: any, tcIdx: number) => {
                const isCollapsed = collapsed[idx * 1000 + tcIdx] ?? true;
                return (
                  <div key={tcIdx} style={{
                    background: '#f3f0ff',
                    border: '1px solid #c4b5fd',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  }}>
                    <div
                      onClick={() => toggleCollapse(idx * 1000 + tcIdx)}
                      style={{
                        background: '#ede9fe',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        userSelect: 'none',
                        borderBottom: isCollapsed ? 'none' : '1px solid #c4b5fd',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#7c3aed' }}>
                        <Wrench size={11} />
                        Tool Call
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: '#7c3aed',
                          color: '#fff',
                          padding: '1px 8px',
                          borderRadius: '10px',
                          fontFamily: 'monospace',
                          fontSize: '10px',
                          fontWeight: 600
                        }}>
                          {tc.toolName}
                        </span>
                        <span style={{ fontSize: '10px', color: '#7c3aed' }}>{isCollapsed ? '▸' : '▾'}</span>
                      </div>
                    </div>
                    {!isCollapsed && (
                      <div style={{ padding: '10px 12px', background: '#faf9ff' }}>
                        <JsonSyntaxHighlighter jsonStr={typeof tc.args === 'string' ? tc.args : JSON.stringify(tc.args, null, 2)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }

        // ── Tool results
        if (role === 'tool' && Array.isArray(item.content)) {
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {item.content.map((tr: any, trIdx: number) => {
                const isCollapsed = collapsed[(idx + 500) * 1000 + trIdx] ?? true;
                const resultStr = typeof tr.result === 'string' ? tr.result : JSON.stringify(tr.result, null, 2);
                return (
                  <div key={trIdx} style={{
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  }}>
                    <div
                      onClick={() => toggleCollapse((idx + 500) * 1000 + trIdx)}
                      style={{
                        background: '#dcfce7',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        userSelect: 'none',
                        borderBottom: isCollapsed ? 'none' : '1px solid #86efac',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#15803d' }}>
                        <ArrowDownCircle size={11} />
                        Tool Result
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: '#16a34a',
                          color: '#fff',
                          padding: '1px 8px',
                          borderRadius: '10px',
                          fontFamily: 'monospace',
                          fontSize: '10px',
                          fontWeight: 600
                        }}>
                          {tr.toolName}
                        </span>
                        <span style={{ fontSize: '10px', color: '#16a34a' }}>{isCollapsed ? '▸' : '▾'}</span>
                      </div>
                    </div>
                    {!isCollapsed && (
                      <div style={{ padding: '10px 12px', background: '#fafffe' }}>
                        <ToolResultCollapsible resultStr={resultStr} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }

        return null;
      })}
      <div style={{ fontSize: '10px', color: '#667781', textAlign: 'right', marginTop: '-4px' }}>
        {formatTime(msg.createdAt)}
      </div>
    </div>
  );
}

function deepJsonFormat(value: any): any {
  if (typeof value === 'string') {
    try { const p = JSON.parse(value); return deepJsonFormat(p); } catch { return value; }
  }
  if (Array.isArray(value)) return value.map(deepJsonFormat);
  if (value && typeof value === 'object') {
    const r: any = {};
    for (const [k, v] of Object.entries(value)) r[k] = deepJsonFormat(v);
    return r;
  }
  return value;
}

function ToolGroupEvent({ msg, agentName, systemLogo }: { msg: ChatMessage; agentName?: string; systemLogo?: string | null }) {
  const [showArgs, setShowArgs] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const parsed = tryParseJson(msg.content);
  if (!parsed || !parsed.toolName) return null;

  const { toolName, args, result } = parsed;
  const hasResult = result !== null && result !== undefined && result !== '';
  const argsStr = JSON.stringify(deepJsonFormat(args), null, 2);
  const resultStr = hasResult ? JSON.stringify(deepJsonFormat(result), null, 2) : '';

  return (
    <div style={{
      alignSelf: 'flex-end',
      width: '460px',
      maxWidth: '90%',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px 0 12px 12px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
      }}>
        {/* ── Agent header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 12px 4px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#0088cc',
        }}>
          {systemLogo ? (
            <img src={systemLogo} alt="" style={{ width: '14px', height: '14px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : agentName ? (
            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#0088cc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700 }}>{agentName[0].toUpperCase()}</div>
          ) : (
            <Bot size={11} />
          )}
          {agentName || 'Agente'}
        </div>

        {/* ── Tool name header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0 12px 8px',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: '#fff',
            padding: '2px 10px',
            borderRadius: '10px',
            fontFamily: 'monospace',
            fontSize: '10px',
            fontWeight: 600,
          }}>
            <Wrench size={9} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            {toolName}
          </div>
        </div>

        {/* ── Args ── */}
        {args && (
          <>
            <div
              onClick={() => setShowArgs(p => !p)}
              style={{
                padding: '7px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none',
                background: showArgs ? '#f5f3ff' : 'transparent',
                borderTop: '1px solid #e9edef',
                fontSize: '11px',
                color: '#6b21a8',
                fontWeight: 600,
                transition: 'background 0.15s',
              }}
            >
              <span>📥 Entrada</span>
              <span style={{
                fontSize: '9px',
                color: '#7c3aed',
                transition: 'transform 0.2s',
                display: 'inline-block',
                transform: showArgs ? 'rotate(90deg)' : 'none',
              }}>▸</span>
            </div>
            {showArgs && (
              <div style={{ padding: '10px 12px', background: '#faf9ff', borderTop: '1px solid #e9edef', maxHeight: '300px', overflow: 'auto' }}>
                <JsonSyntaxHighlighter jsonStr={argsStr} />
              </div>
            )}
          </>
        )}

        {/* ── Result ── */}
        {hasResult && (
          <>
            <div
              onClick={() => setShowResult(p => !p)}
              style={{
                padding: '7px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none',
                background: showResult ? '#f0fdf4' : 'transparent',
                borderTop: '1px solid #e9edef',
                fontSize: '11px',
                color: '#15803d',
                fontWeight: 600,
                transition: 'background 0.15s',
              }}
            >
              <span>📤 Saída</span>
              <span style={{
                fontSize: '9px',
                color: '#16a34a',
                transition: 'transform 0.2s',
                display: 'inline-block',
                transform: showResult ? 'rotate(90deg)' : 'none',
              }}>▸</span>
            </div>
            {showResult && (
              <div style={{ padding: '10px 12px', background: '#fafffe', borderTop: '1px solid #e9edef', maxHeight: '300px', overflow: 'auto' }}>
                <JsonSyntaxHighlighter jsonStr={resultStr} />
              </div>
            )}
          </>
        )}
      </div>
      <div style={{ fontSize: '10px', color: '#667781', textAlign: 'right', paddingRight: '2px' }}>
        {formatTime(msg.createdAt)}
      </div>
    </div>
  );
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  chatSearchQuery,
  setChatSearchQuery,
  getGroupedLeads,
  selectedLeadId,
  setSelectedLeadId,
  chatHistory,
  historySource,
  historyTable,
  chatContainerRef,
  selectedLeadName,
  userName,
  systemLogo,
}) => {
  const [expandedAgents, setExpandedAgents] = useState<Record<number, boolean>>({});
  const [hasLoadedChatInitial, setHasLoadedChatInitial] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Smart scroll: always scroll on initial load, only follow if at bottom on updates
  useEffect(() => {
    if (!chatContainerRef.current) return;
    const el = chatContainerRef.current;

    if (!hasLoadedChatInitial && chatHistory.length > 0) {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'instant' as any });
      }
      setHasLoadedChatInitial(true);
    } else {
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
      if (isAtBottom && chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [chatHistory, hasLoadedChatInitial]);

  // Reset initial load flag when selected lead changes
  useEffect(() => {
    setHasLoadedChatInitial(false);
  }, [selectedLeadId]);

  const toggleAgentExpand = (agentId: number) => {
    setExpandedAgents(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '0', height: 'calc(100vh - 120px)', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e9edef', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

      {/* ── Left Sidebar ── */}
      <div style={{ background: '#fff', borderRight: '1px solid #e9edef', display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
        {/* Search */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f2f5', background: '#f0f2f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px 12px', borderRadius: '24px', border: '1px solid #e9edef' }}>
            <Search size={14} style={{ color: '#8696a0', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Buscar lead..."
              value={chatSearchQuery}
              onChange={e => setChatSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#111b21', outline: 'none', width: '100%', fontSize: '13px' }}
            />
          </div>
        </div>

        {/* Lead list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {getGroupedLeads().map(empGroup => (
            <div key={empGroup.empresaId}>
              <div style={{ padding: '8px 16px 4px', fontSize: '11px', fontWeight: 700, color: '#667781', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f0f2f5' }}>
                {empGroup.empresaName}
              </div>
              {empGroup.agents.map((agGroup: any) => (
                <div key={agGroup.agentId}>
                  <div
                    onClick={() => toggleAgentExpand(agGroup.agentId)}
                    style={{
                      padding: '8px 16px 4px 20px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#0088cc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      userSelect: 'none',
                    }}
                  >
                    <Bot size={11} />
                    {agGroup.agentName}
                    <span style={{ marginLeft: 'auto', fontSize: '9px', opacity: 0.6 }}>
                      {expandedAgents[agGroup.agentId] ? '▼' : '▶'}
                    </span>
                  </div>
                  {expandedAgents[agGroup.agentId] && (
                    <div>
                      {agGroup.leads.map((ld: any) => {
                        const isSelected = selectedLeadId === ld.id;
                        const isHuman = ld.status === 'HUMANO';
                        const isNew = ld.status === 'NOVO';
                        const isFinalized = ld.status === 'FINALIZADO';
                        const isConcluded = ld.status === 'CONCLUIDO';

                        return (
                          <button
                            key={ld.id}
                            onClick={() => setSelectedLeadId(ld.id)}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '12px 16px',
                              border: 'none',
                              borderBottom: '1px solid #f0f2f5',
                              background: isSelected ? '#f0f2f5' : '#fff',
                              color: '#111b21',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'background 0.15s',
                            }}
                          >
                            {/* Avatar */}
                            <div style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              background: isHuman ? '#ff9800' : '#25d366',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              color: '#fff',
                              fontSize: '16px',
                              fontWeight: 700,
                            }}>
                              {isHuman ? <User size={20} /> : (ld.name || ld.remote_jid_alt || '?')[0].toUpperCase()}
                            </div>

                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <span style={{ fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                  {ld.name || ld.remote_jid_alt}
                                </span>
                                <span style={{
                                  fontSize: '9px',
                                  padding: '2px 6px',
                                  borderRadius: '8px',
                                  fontWeight: 600,
                                  flexShrink: 0,
                                  marginLeft: '4px',
                                  background: isHuman ? '#fff3e0' : isNew ? '#e3f2fd' : isFinalized ? '#f3f0ff' : isConcluded ? '#f0fdf4' : '#f1f8e9',
                                  color: isHuman ? '#e65100' : isNew ? '#1565c0' : isFinalized ? '#7c3aed' : isConcluded ? '#16a34a' : '#2e7d32',
                                }}>
                                  {isHuman ? 'Humano' : isNew ? 'Novo' : isFinalized ? 'Finalizado' : isConcluded ? 'Faturado' : ld.status}
                                </span>
                              </div>
                              {ld.lastmessage && (
                                <div style={{ fontSize: '12px', color: '#667781', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {ld.lastmessage}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#efeae2', overflow: 'hidden' }}>
        {selectedLeadId ? (
          <>
            {/* Chat Header */}
            <div style={{
              background: '#f0f2f5',
              borderBottom: '1px solid #e9edef',
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#25d366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '16px',
                flexShrink: 0,
              }}>
                {(selectedLeadName || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#111b21' }}>{selectedLeadName || 'Conversa'}</div>
                <div style={{ fontSize: '11px', color: '#667781' }}>
                  {historySource === 'dynamic_n8n_table_combined' ? `🤖 Histórico do Agente — ${historyTable}` : '💬 Mensagens WhatsApp'}
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                background: '#e8f5e9',
                color: '#2e7d32',
                fontSize: '11px',
                fontWeight: 600,
              }}>
                <Circle size={8} style={{ fill: '#2e7d32' }} />
                Ao Vivo
              </div>
            </div>

            {/* Messages Feed */}
            <div
              className="chat-messages"
              ref={chatContainerRef as any}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 60px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23efeae2'/%3E%3Cg opacity='0.04'%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='%23000' stroke-width='1'/%3E%3Ccircle cx='150' cy='50' r='30' fill='none' stroke='%23000' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              {(() => {
                // Look up agent name for the selected lead
                let currentAgentName = '';
                if (selectedLeadId) {
                  for (const empGroup of getGroupedLeads()) {
                    for (const agGroup of empGroup.agents) {
                      if (agGroup.leads.some((ld: any) => ld.id === selectedLeadId)) {
                        currentAgentName = agGroup.agentName;
                        break;
                      }
                    }
                    if (currentAgentName) break;
                  }
                }
                return chatHistory.map(msg => {
                  const roleLower = (msg.role || '').toLowerCase();
                  const isAi =
                    roleLower === 'assistant' ||
                    roleLower === 'bot' ||
                    roleLower === 'ai' ||
                    (msg.source || '').toLowerCase() === 'bot' ||
                    (msg.source || '').toLowerCase() === 'ai';

                  // ── System events (human takeover, finalized) ──
                  if (roleLower === 'system_event') {
                    const eventDate = msg.createdAt ? new Date(msg.createdAt) : null;
                    const formattedDate = eventDate
                      ? eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      : '';
                    const eventColor = msg.content?.includes('✅') ? '#16a34a' : '#7c3aed';
                    return (
                      <div key={msg.id} style={{
                        alignSelf: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '8px 16px 6px',
                        margin: '6px 0',
                      }}>
                        <div style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                            <div style={{
                              flex: 1,
                              height: '2px',
                              background: `linear-gradient(to right, transparent, ${eventColor}44, ${eventColor}88)`,
                              borderRadius: '1px',
                            }} />
                            <span style={{ color: eventColor, fontSize: '10px', marginLeft: '4px' }}>◆</span>
                          </div>
                          <span style={{
                            fontSize: '12px',
                            color: eventColor,
                            fontWeight: 700,
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            background: `${eventColor}11`,
                            padding: '3px 14px',
                            borderRadius: '12px',
                          }}>
                            {msg.content}
                          </span>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: eventColor, fontSize: '10px', marginRight: '4px' }}>◆</span>
                            <div style={{
                              flex: 1,
                              height: '2px',
                              background: `linear-gradient(to left, transparent, ${eventColor}44, ${eventColor}88)`,
                              borderRadius: '1px',
                            }} />
                          </div>
                        </div>
                        {formattedDate && (
                          <span style={{ fontSize: '11px', color: '#8696a0', fontWeight: 500, letterSpacing: '0.3px' }}>
                            {formattedDate}
                          </span>
                        )}
                      </div>
                    );
                  }

                  // ── Tool group (call + result) from combined n8n + messages history ──
                  if (roleLower === 'tool_group') {
                    return <ToolGroupEvent key={msg.id} msg={msg} agentName={currentAgentName} systemLogo={systemLogo} />;
                  }

                  // n8n JSON turn bubble
                  const parsedHistory = tryParseJson(msg.content);
                  if (Array.isArray(parsedHistory)) {
                    return <N8nTurnBubble key={msg.id} msg={msg} agentName={currentAgentName} systemLogo={systemLogo} />;
                  }

                  // Regular WhatsApp-style message bubble
                  const cleanedText = cleanMessageContent(msg.content);
                  if (!cleanedText && !msg.messageType) return null;

                  const isAttendant = (msg.role || '').toLowerCase() === 'attendant' || (msg.source || '').toLowerCase() === 'platform';
                  const isFromClient = (msg.role || '').toLowerCase() === 'user' || (msg.role || '').toLowerCase() === 'human';
                  const isSentByUs = isAi || isAttendant || (msg.role || '').toLowerCase() === 'assistant' || (msg.role || '').toLowerCase() === 'admin' || (msg.source || '').toLowerCase() === 'operator';
                  const bubbleBg = isAttendant ? '#dbeafe' : (isSentByUs ? '#d9fdd3' : '#ffffff');
                  const clientName = selectedLeadName || 'Lead';
                  const senderName = isAi ? (currentAgentName || 'Agente') : (isAttendant ? (userName || 'Atendente') : (isFromClient ? clientName : ''));

                  const avatarStyle = { width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '9px', fontWeight: 700, overflow: 'hidden' } as const;

                  let avatar: React.ReactNode;
                  if (isAi && systemLogo) {
                    avatar = <img src={systemLogo} alt="" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />;
                  } else if (isAi && currentAgentName) {
                    avatar = <div style={{ ...avatarStyle, background: '#0088cc', color: '#fff' }}>{currentAgentName[0].toUpperCase()}</div>;
                  } else if (isAi) {
                    avatar = <Bot size={11} />;
                  } else if (isAttendant) {
                    avatar = <div style={{ ...avatarStyle, background: '#0088cc', color: '#fff' }}><User size={9} /></div>;
                  } else if (isFromClient) {
                    const initial = (selectedLeadName || '?')[0].toUpperCase();
                    avatar = <div style={{ ...avatarStyle, background: '#25d366', color: '#fff' }}>{initial}</div>;
                  } else {
                    avatar = <div style={{ ...avatarStyle, background: '#8696a0', color: '#fff' }}><User size={9} /></div>;
                  }

                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isSentByUs ? 'flex-end' : 'flex-start',
                        maxWidth: '72%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isSentByUs ? 'flex-end' : 'flex-start',
                        gap: '2px',
                      }}
                    >
                      <div
                        style={{
                          background: bubbleBg,
                          borderRadius: isSentByUs ? '12px 0 12px 12px' : '0 12px 12px 12px',
                          padding: '8px 14px 22px 14px',
                          position: 'relative',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                          wordBreak: 'break-word',
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 700, color: isAttendant ? '#2563eb' : '#0088cc', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {avatar}
                          {senderName}
                        </div>
                        {msg.quoted_message_text && (
                          <div style={{ borderLeft: '3px solid #25d366', paddingLeft: '8px', fontSize: '12px', color: '#667781', marginBottom: '6px', fontStyle: 'italic' }}>
                            {cleanMessageContent(msg.quoted_message_text)}
                          </div>
                        )}
                        {msg.messageType && msg.messageType !== 'conversation' && msg.messageType !== 'extendedTextMessage' ? (
                          <MediaMessageRenderer messageId={msg.id} messageType={msg.messageType} content={cleanedText} whatsAppMessageId={msg.messageId} />
                        ) : (
                          <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: 1.45, color: '#111b21' }}>
                            {formatWhatsAppText(cleanedText)}
                          </div>
                        )}
                        <div style={{ position: 'absolute', bottom: '5px', right: '10px', fontSize: '10px', color: '#667781', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {formatTime(msg.createdAt)}
                          {(msg.role || '').toLowerCase() !== 'user' && (msg.role || '').toLowerCase() !== 'human' && <CheckCheck size={12} style={{ color: '#53bdeb' }} />}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
              <div ref={chatEndRef} />
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: '#667781', background: '#f0f2f5' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#e9edef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width="40" height="40" fill="#c4c4c4">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#111b21', marginBottom: '4px' }}>Selecione uma conversa</div>
              <div style={{ fontSize: '13px' }}>Escolha um lead na lista para ver o histórico</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
