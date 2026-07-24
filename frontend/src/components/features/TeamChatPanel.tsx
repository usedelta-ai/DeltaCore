import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ChatMessageBubble } from '../ui/ChatMessageBubble';
import { MediaMessageRenderer } from './MediaMessageRenderer';
import { ConversationDivider } from './ConversationDivider';
import type { ChatMessage, Lead, Agent, LeadStatus } from '../../services/api';
import { api } from '../../services/api';
import { formatWhatsAppText } from '../../utils/whatsappFormat';
import { cleanMessageContent, formatTime, isAIMessage } from '../../utils/messageUtils';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { TimelineDot } from './TimelineDots';
import { Select } from '../ui/Select';
import { useLeadAvatar } from '../../hooks/useLeadAvatar';

interface TeamChatPanelProps {
  messages: ChatMessage[];
  onSendMessage?: (text: string, options?: { messageType?: string; mediaBase64?: string; fileName?: string }) => void;
  leadName?: string;
  leadPhone?: string;
  currentUserName?: string;
  userName?: string;
  agentName?: string;
  systemLogo?: string | null;
  leadStatus?: string;
  finalizedAt?: string;
  lead?: Lead;
  agents?: Agent[];
  timelineDots?: TimelineDot[];
  onViewAllTimeline?: () => void;
  onUpdateLead?: (updateData: Partial<Lead>) => Promise<void>;
  hasWritePermission?: boolean;
  isSuperAdmin?: boolean;
  onPessoaClick?: (pessoaId: number) => void;
  formatCurrency?: (val: number | null) => string;
  formatDate?: (dateStr: string | null | undefined) => string;
  loadingMessages?: boolean;
  userAvatar?: string | null;
}

function isMediaMessage(msg: ChatMessage): boolean {
  const mt = (msg.messageType || '').toLowerCase();
  return !!(
    mt &&
    mt !== 'conversation' &&
    mt !== 'extendedtextmessage' &&
    mt !== 'text' &&
    mt !== 'reactionmessage'
  );
}

function isN8nTurnMessage(msg: ChatMessage): boolean {
  const content = typeof msg.content === 'string' ? msg.content.trim() : '';
  return content.startsWith('[') && content.endsWith(']');
}

function shouldDisplayMessage(msg: ChatMessage): boolean {
  const role = (msg.role || '').toLowerCase();
  if (role === 'tool_group') return false;
  if (msg.messageType === 'reactionMessage') return false;
  if (isN8nTurnMessage(msg)) return false;
  return true;
}

function getSystemEventType(msg: ChatMessage): 'human_takeover' | 'finalized' | null {
  const content = (msg.content || '').toLowerCase();
  const role = (msg.role || '').toLowerCase();
  if (role !== 'system_event') return null;
  if (content.includes('human_takeover') || content.includes('🔁') || content.includes('atendimento humano')) {
    if (content.includes('iniciado pela plataforma')) return null;
    return 'human_takeover';
  }
  if (content.includes('finalized') || content.includes('✅') || content.includes('finalizad')) {
    return 'finalized';
  }
  return null;
}

function getMessageSender(
  msg: ChatMessage,
  leadName: string,
  currentUserName: string | undefined,
  userName: string | undefined,
  agentName: string | undefined,
  systemLogo?: string | null,
  userAvatar?: string | null,
): { type: 'ai' | 'attendant' | 'lead'; author: string; avatarIcon: string; avatarSrc?: string } {
  const role = (msg.role || '').toLowerCase();
  const source = (msg.source || '').toLowerCase();
  const isAI = isAIMessage(msg);
  const isAttendant = role === 'attendant' || source === 'platform';

  if (isAI) {
    return { type: 'ai', author: agentName || 'Assistente IA', avatarIcon: 'smart_toy', avatarSrc: systemLogo || undefined };
  }
  if (isAttendant) {
    const avatarSrc = userAvatar
      ? (userAvatar.startsWith('data:') ? userAvatar : `data:image/png;base64,${userAvatar}`)
      : undefined;
    return { type: 'attendant', author: userName || currentUserName || 'Atendente', avatarIcon: 'person', avatarSrc };
  }
  return { type: 'lead', author: leadName || 'Lead', avatarIcon: 'person' };
}

// Key formatting with translation helper
const formatKey = (key: string, trans: Record<string, string> | null) => {
  if (!key) return '';
  if (trans && trans[key]) return trans[key];
  const defaultTranslations: Record<string, string> = {
    room_type: 'Tipo de Quarto',
    guest_count: 'Hóspedes',
    check_in_date: 'Check-in',
    check_out_date: 'Check-out',
    children_count: 'Crianças',
    adults_count: 'Adultos',
    phone: 'Telefone',
    email: 'E-mail',
    city: 'Cidade',
    state: 'Estado',
    country: 'País',
    notes: 'Observações',
    reservation_code: 'Código da Reserva',
    created_at: 'Criado em',
    updated_at: 'Atualizado em',
    conversation_summary: 'Resumo da Conversa'
  };
  if (defaultTranslations[key]) return defaultTranslations[key];
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const TeamChatPanel: React.FC<TeamChatPanelProps> = ({
  messages = [],
  onSendMessage,
  leadName = 'Lead',
  currentUserName,
  userName,
  agentName,
  systemLogo,
  leadStatus,
  finalizedAt,
  lead,
  agents = [],
  timelineDots = [],
  onViewAllTimeline,
  onUpdateLead,
  hasWritePermission = true,
  isSuperAdmin = false,
  onPessoaClick,
  formatCurrency: _formatCurrency,
  formatDate,
  loadingMessages = false,
  userAvatar,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch lead's WhatsApp profile picture (cached 30 min via TanStack Query)
  const { data: leadAvatarSrc } = useLeadAvatar(lead?.id, leadStatus !== 'NOVO');
  
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // Media states
  const [selectedFile, setSelectedFile] = useState<{ file: File; preview: string; type: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; base64: string; mimeType: string; duration: number } | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingDurationRef = useRef<number>(0);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Expanded info panel state
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [showMotiveBanner, setShowMotiveBanner] = useState(true);

  // Local modals for status transitions (CONCLUIDO and HUMANO)
  const [showLocalConcludedModal, setShowLocalConcludedModal] = useState(false);
  const [localSaleStep, setLocalSaleStep] = useState<'ask_sale' | 'enter_value'>('ask_sale');
  const [localSaleValue, setLocalSaleValue] = useState('');
  const [showLocalHumanModal, setShowLocalHumanModal] = useState(false);
  const [localHumanMotive, setLocalHumanMotive] = useState('');

  // States copied from LeadCoreInfoPanel for editing lead properties
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showConfirmCreate, setShowConfirmCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<LeadStatus>('NOVO');
  const [agentId, setAgentId] = useState<number>(0);
  const [customProps, setCustomProps] = useState<{ id: string; key: string; value: string }[]>([]);

  // Find agent translations and schema
  const agent = lead ? agents.find(a => a.id === lead.agent_id) : undefined;
  const translations = React.useMemo(() => {
    let trans: Record<string, string> = {};
    if (agent && agent.translations) {
      try {
        trans = typeof agent.translations === 'string' ? JSON.parse(agent.translations) : agent.translations;
      } catch (_) {}
    }
    return trans;
  }, [agent, agents]);

  const schemaFields = React.useMemo(() => {
    if (!agent?.custom_properties_schema) return [];
    try {
      const s = typeof agent.custom_properties_schema === 'string'
        ? JSON.parse(agent.custom_properties_schema)
        : agent.custom_properties_schema;
      if (s && Array.isArray(s.fields)) return s.fields as Array<{ key: string; label: string; type: string; required: boolean; placeholder?: string; options?: { value: string; label: string }[] }>;
    } catch (_) {}
    return [];
  }, [agent]);

  const schemaMap = React.useMemo(() => {
    const map = new Map<string, typeof schemaFields[number]>();
    schemaFields.forEach(f => map.set(f.key, f));
    return map;
  }, [schemaFields]);

  // Sync state with incoming lead changes
  useEffect(() => {
    if (!lead) return;
    setName(lead.name || '');
    setPhone(lead.remote_jid_alt?.replace('@s.whatsapp.net', '') || '');
    setValue(lead.value !== null && lead.value !== undefined ? String(lead.value) : '');
    setStatus(lead.status || 'NOVO');
    setAgentId(lead.agent_id || 0);

    const cProps = lead.custom_properties || {};

    // Initialize custom properties: merge schema fields with existing values
    const existingKeys = new Set<string>();
    const customList: { id: string; key: string; value: string }[] = [];

    for (const [k, v] of Object.entries(cProps)) {
      existingKeys.add(k);
      customList.push({
        id: Math.random().toString(36).substr(2, 9),
        key: k,
        value: typeof v === 'object' ? JSON.stringify(v) : String(v),
      });
    }

    for (const field of schemaFields) {
      if (existingKeys.has(field.key)) continue;
      customList.push({
        id: Math.random().toString(36).substr(2, 9),
        key: field.key,
        value: field.type === 'boolean' ? 'false' : '',
      });
    }

    setCustomProps(customList);
    setShowMotiveBanner(true);
  }, [lead, schemaFields]);




  const triggerSave = async (payload: Partial<Lead>) => {
    if (!onUpdateLead || !hasWritePermission || !lead) return;
    setSaveStatus('saving');
    try {
      await onUpdateLead(payload);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Erro ao atualizar campo do lead:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const handleTextBlur = (field: string, currentVal: string, originalVal: string) => {
    if (!lead) return;
    if (currentVal === originalVal) return;

    if (field === 'name') {
      triggerSave({ name: currentVal || null });
    } else if (field === 'phone') {
      const suffix = lead.remote_jid_alt?.includes('@s.whatsapp.net') ? '@s.whatsapp.net' : '';
      triggerSave({ remote_jid_alt: currentVal ? `${currentVal}${suffix}` : '' });
    } else if (field === 'value') {
      triggerSave({ value: currentVal ? Number(currentVal) : null });
    } else {
      // It's a key inside custom_properties
      const updatedProps = { ...(lead.custom_properties || {}) };
      triggerSave({ custom_properties: updatedProps });
    }
  };

  const handleConfirmHuman = () => {
    if (!localHumanMotive.trim()) return;
    setShowLocalHumanModal(false);
    triggerSave({
      status: 'HUMANO',
      taken_motive: localHumanMotive,
      taken_over_at: new Date().toISOString()
    });
  };

  const handleConfirmConcluded = (hasSale: boolean) => {
    setShowLocalConcludedModal(false);
    const finalVal = hasSale ? Number(localSaleValue) : null;
    triggerSave({
      status: 'CONCLUIDO',
      value: finalVal,
      taken_motive: hasSale ? `Atendimento concluído com venda (R$ ${localSaleValue})` : 'Atendimento concluído sem venda'
    });
  };

  const handleSelectChange = (field: 'status' | 'agent_id', val: any) => {
    if (!lead) return;
    if (field === 'status') {
      const newStatus = val as LeadStatus;
      if (newStatus === 'CONCLUIDO') {
        setLocalSaleStep('ask_sale');
        setLocalSaleValue('');
        setShowLocalConcludedModal(true);
      } else if (newStatus === 'HUMANO') {
        setLocalHumanMotive('');
        setShowLocalHumanModal(true);
      } else {
        setStatus(newStatus);
        const statusMap: Record<string, string> = {
          'NOVO': 'Novo Lead',
          'FINALIZADO': 'Finalizado',
          'CANCELADO': 'Cancelado'
        };
        const statusText = statusMap[newStatus] || newStatus;
        triggerSave({ 
          status: newStatus,
          taken_motive: `Status alterado para ${statusText} inline`
        });
      }
    } else if (field === 'agent_id') {
      const newAgentId = Number(val);
      if (newAgentId === lead.agent_id) return;
      setAgentId(newAgentId);
      triggerSave({ agent_id: newAgentId });
    }
  };

  const handleCustomPropChange = (id: string, newVal: string) => {
    setCustomProps(prev =>
      prev.map(item => (item.id === id ? { ...item, value: newVal } : item))
    );
  };

  const saveCustomProps = (targetPropsList = customProps) => {
    if (!lead) return;
    const updatedProps: Record<string, any> = {};
    targetPropsList.forEach(item => {
      if (item.key.trim()) {
        // Try parsing booleans before saving
        let val: any = item.value;
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (val !== '' && !isNaN(Number(val))) val = Number(val);

        updatedProps[item.key.trim()] = val;
      }
    });
    triggerSave({ custom_properties: updatedProps });
  };

  const isNearBottom = () => {
    if (!chatBodyRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
    // Permitir uma margem de erro de 150px
    return scrollHeight - scrollTop - clientHeight < 150;
  };

  const scrollToBottom = (force = false) => {
    if (force || isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll to bottom when messages load or change
  useEffect(() => {
    if (loadingMessages) return;
    
    // When history loaded, force the scroll to the bottom instantly
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 50);
    return () => clearTimeout(timer);
  }, [loadingMessages]);

  useEffect(() => {
    if (!loadingMessages) {
      scrollToBottom();
    }
  }, [messages, loadingMessages]);

  useEffect(() => {
    const handleMediaLoaded = () => {
      scrollToBottom();
    };
    window.addEventListener('chat-media-loaded', handleMediaLoaded);
    return () => {
      window.removeEventListener('chat-media-loaded', handleMediaLoaded);
    };
  }, []);

  const handleScroll = () => {
    const el = chatBodyRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 35;
    setShowScrollButton(!isAtBottom);
  };

  const toBase64 = (file: File | Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleSend = async () => {
    const val = inputText.trim();
    const hasFile = !!selectedFile;
    if (!val && !hasFile) return;

    setSendingMessage(true);
    let options: { messageType?: string; mediaBase64?: string; fileName?: string } | undefined;

    if (hasFile) {
      try {
        const base64 = await toBase64(selectedFile!.file);
        options = {
          messageType: selectedFile!.type,
          mediaBase64: base64,
          fileName: selectedFile!.file.name
        };
      } catch (err) {
        alert('Erro ao ler arquivo.');
        setSendingMessage(false);
        return;
      }
    }

    onSendMessage?.(val, options);
    setInputText('');
    setSelectedFile(null);
    setSendingMessage(false);
    setTimeout(() => scrollToBottom(true), 150);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = 'audio/ogg;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const actualMime = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: actualMime });
        audioChunksRef.current = [];

        const audioBase64 = await toBase64(blob);
        setRecordedAudio({
          blob,
          base64: audioBase64,
          mimeType: actualMime,
          duration: recordingDurationRef.current
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingDurationRef.current = 0;
      recordingTimerRef.current = setInterval(() => {
        recordingDurationRef.current += 1;
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch {
      alert('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const cancelRecordedAudio = () => {
    setRecordedAudio(null);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.currentTime = 0;
    }
  };

  const sendRecordedAudio = async () => {
    if (!recordedAudio) return;
    setSendingMessage(true);
    try {
      const audioExt = recordedAudio.mimeType.includes('ogg') ? 'ogg' : (recordedAudio.mimeType.includes('mp4') ? 'mp4' : 'webm');
      onSendMessage?.('', {
        messageType: 'audio',
        mediaBase64: recordedAudio.base64,
        fileName: `audio.${audioExt}`
      });
      setRecordedAudio(null);
    } catch (err) {
      alert('Erro ao enviar áudio.');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredMessages = useMemo(() => messages.filter(shouldDisplayMessage), [messages]);

  const hasFinalDivider = leadStatus === 'CONCLUIDO' || leadStatus === 'FINALIZADO';

  const visibleMessages = useMemo(() => {
    const result: ChatMessage[] = [];
    for (let i = 0; i < filteredMessages.length; i++) {
      const current = filteredMessages[i];
      const role = (current.role || '').toLowerCase();

      if (role === 'system_event' && hasFinalDivider && getSystemEventType(current) === 'finalized') {
        continue;
      }

      const prev = result[result.length - 1];
      if (!prev) {
        result.push(current);
        continue;
      }
      const prevRole = (prev.role || '').toLowerCase();
      if (prevRole === 'system_event' && role === 'system_event') {
        const a = new Date(prev.createdAt || prev.created_at);
        const b = new Date(current.createdAt || current.created_at);
        const sameMinute = a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() && a.getHours() === b.getHours() && a.getMinutes() === b.getMinutes();
        const sameContent = String(prev.content ?? '') === String(current.content ?? '');
        if (sameMinute && sameContent) {
          result[result.length - 1] = current;
          continue;
        }
      }
      result.push(current);
    }
    return result;
  }, [filteredMessages, hasFinalDivider]);

  const renderMessage = (msg: ChatMessage, idx: number) => {
    const role = (msg.role || '').toLowerCase();

    if (role === 'system_event') {
      const eventType = getSystemEventType(msg);
      if (!eventType) return null;
      return (
        <ConversationDivider
          key={`${msg.id}-${idx}`}
          type={eventType}
          timestamp={msg.createdAt}
        />
      );
    }

    const sender = getMessageSender(msg, leadName, currentUserName, userName, agentName, systemLogo, userAvatar);
    // Inject the lead's WhatsApp profile picture for incoming lead messages
    if (sender.type === 'lead' && leadAvatarSrc) {
      sender.avatarSrc = leadAvatarSrc;
    }
    const cleaned = cleanMessageContent(typeof msg.content === 'string' ? msg.content : '');

    if (isMediaMessage(msg)) {
      return (
        <ChatMessageBubble
          key={`${msg.id}-${idx}`}
          message={{
            id: String(msg.id),
            type: sender.type,
            author: sender.author,
            time: formatTime(msg.createdAt),
            content: (
              <MediaMessageRenderer
                messageId={msg.id}
                messageType={msg.messageType!}
                content={cleaned}
                whatsAppMessageId={msg.messageId}
                localMediaBase64={(msg as any).mediaBase64}
              />
            ),
            avatarIcon: sender.avatarIcon,
            avatarSrc: sender.avatarSrc,
            quotedMessage: msg.quoted_message_text
              ? { text: cleanMessageContent(msg.quoted_message_text), author: leadName || 'Lead' }
              : undefined,
          }}
        />
      );
    }

    return (
      <ChatMessageBubble
        key={`${msg.id}-${idx}`}
        message={{
          id: String(msg.id),
          type: sender.type,
          author: sender.author,
          time: formatTime(msg.createdAt),
          content: formatWhatsAppText(cleaned || (msg.content ? String(msg.content) : '')),
          avatarIcon: sender.avatarIcon,
          avatarSrc: sender.avatarSrc,
          quotedMessage: msg.quoted_message_text
            ? { text: cleanMessageContent(msg.quoted_message_text), author: leadName || 'Lead' }
            : undefined,
        }}
      />
    );
  };

  const getFinalDivider = () => {
    if (leadStatus === 'CONCLUIDO') {
      return <ConversationDivider key="final-concluded" type="concluded" timestamp={finalizedAt} />;
    }
    if (leadStatus === 'FINALIZADO') {
      return <ConversationDivider key="final-finalized" type="finalized" timestamp={finalizedAt} />;
    }
    return null;
  };

  if (loadingMessages || !lead) {
    return (
      <div className="flex-1 bg-surface-container-lowest flex flex-col items-center justify-center h-full">
        <div className="w-10 h-10 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin mb-3"></div>
        <p className="text-body-sm text-on-surface-variant font-medium animate-pulse">Carregando conversa...</p>
      </div>
    );
  }

  return (
    <section className="flex-1 bg-surface-container-lowest flex flex-col overflow-hidden h-full">


      {/* Chat Messages */}
      <div
        ref={chatBodyRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 flex flex-col gap-6"
        id="chat-scroll-area"
      >
        <div className="text-center relative mb-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-low-contrast/50" />
          </div>
          <span className="relative bg-surface-container-lowest px-4 text-[10px] font-label-md text-on-surface-variant uppercase tracking-widest">
            Histórico da Conversa
          </span>
        </div>

        {visibleMessages.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4 block">chat_bubble_outline</span>
            <p>Nenhuma mensagem nesta conversa</p>
          </div>
        )}

        <div className="space-y-6">
          {visibleMessages.map((msg, idx) => renderMessage(msg, idx))}
          {getFinalDivider()}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 right-6 z-10 w-10 h-10 rounded-full bg-primary text-white border-none shadow-[0_4px_12px_rgba(64,0,198,0.3)] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined">keyboard_double_arrow_down</span>
        </button>
      )}

      {/* Chat Input Area with Expandable Info Panel */}
      <div className="p-6 bg-surface-container-lowest shrink-0 relative">
        {/* Expandable Info Panel */}
        <div
          className="absolute left-6 right-6 bottom-full mb-2 z-30 overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: isInfoExpanded ? '600px' : '0px',
            opacity: isInfoExpanded ? 1 : 0,
          }}
        >
          <div className="bg-surface-container-lowest border border-border-low-contrast rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] flex flex-col max-h-[550px]">
            {/* Cabeçalho Fixo */}
            <div className="p-6 pb-4 flex items-center justify-between border-b border-border-low-contrast shrink-0">
              <h3 className="font-headline text-body-lg font-bold flex items-center gap-2 m-0 text-on-surface">
                <span className="material-symbols-outlined text-primary text-[24px]">info</span>
                Detalhes do Lead
              </h3>
              <div className="flex items-center gap-3">
                {saveStatus === 'saving' && (
                  <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold animate-pulse">
                    Salvando...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-[11px] bg-status-success/15 text-status-success px-2 py-0.5 rounded-full font-bold">
                    ✓ Salvo
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-[11px] bg-status-critical/15 text-status-critical px-2 py-0.5 rounded-full font-bold">
                    ⚠️ Erro
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsInfoExpanded(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant cursor-pointer border-none bg-transparent shrink-0"
                  title="Fechar detalhes"
                >
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>
            </div>

            {/* Conteúdo Rolável */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              {/* Informações Básicas */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Nome */}
                  <div className="bg-surface-container-low border border-border-low-contrast rounded-lg p-3">
                    <span className="text-label-md text-on-surface-variant uppercase">Nome</span>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onBlur={() => handleTextBlur('name', name, lead?.name || '')}
                      disabled={!hasWritePermission}
                      placeholder="Sem nome"
                      className="w-full bg-transparent border-none p-0 text-body-md font-medium mt-1 focus:ring-0 focus:outline-none disabled:opacity-75 text-on-surface"
                    />
                  </div>

                  {/* Telefone */}
                  <div className="bg-surface-container-low border border-border-low-contrast rounded-lg p-3 flex justify-between items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-label-md text-on-surface-variant uppercase">Telefone</span>
                      <input
                        type="text"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        onBlur={() => handleTextBlur('phone', phone, lead?.remote_jid_alt?.replace('@s.whatsapp.net', '') || '')}
                        disabled={!hasWritePermission}
                        placeholder="Sem telefone"
                        className="w-full bg-transparent border-none p-0 text-body-md font-medium mt-1 focus:ring-0 focus:outline-none disabled:opacity-75 truncate text-on-surface"
                      />
                    </div>
                    {lead?.pessoa_id ? (
                      <button
                        type="button"
                        onClick={() => onPessoaClick?.(lead.pessoa_id!)}
                        title="Ver Cadastro de Pessoa"
                        className="text-[11px] text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0 shrink-0"
                      >
                        <span className="material-symbols-outlined text-[18px]">contact_page</span>
                      </button>
                    ) : (
                      phone && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!name.trim()) {
                              setCreateFeedback({ type: 'error', title: 'Nome obrigatório', message: 'O nome do lead é necessário para criar o cadastro.' });
                              return;
                            }
                            setShowConfirmCreate(true);
                          }}
                          title="Criar cadastro unificado para este telefone"
                          className="text-[11px] text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0 shrink-0"
                        >
                          <span className="material-symbols-outlined text-[18px]">person_add</span>
                        </button>
                      )
                    )}
                  </div>

                  {/* Valor Estimado */}
                  <div className="bg-surface-container-low border border-border-low-contrast rounded-lg p-3">
                    <span className="text-label-md text-on-surface-variant uppercase">Valor Estimado</span>
                    <div className="relative flex items-center mt-1">
                      <span className="text-primary font-bold text-sm mr-1">R$</span>
                      <input
                        type="number"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onBlur={() => handleTextBlur('value', value, lead?.value !== null && lead?.value !== undefined ? String(lead.value) : '')}
                        disabled={!hasWritePermission}
                        placeholder="0"
                        className="w-full bg-transparent border-none p-0 text-body-md font-bold text-primary focus:ring-0 focus:outline-none disabled:opacity-75"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="bg-surface-container-low border border-border-low-contrast rounded-lg p-3">
                    <span className="text-label-md text-on-surface-variant uppercase">Status</span>
                    <Select
                      options={[
                        { value: 'NOVO', label: 'Novo Lead' },
                        { value: 'HUMANO', label: 'Em Atendimento' },
                        { value: 'FINALIZADO', label: 'Finalizado' },
                        { value: 'CONCLUIDO', label: 'Faturado' },
                        ...(localStorage.getItem('user-role') === 'superadmin'
                          ? [{ value: 'CANCELADO', label: 'Cancelado' }]
                          : [])
                      ]}
                      value={status}
                      onChange={e => handleSelectChange('status', e.target.value)}
                      disabled={!hasWritePermission}
                      variant="minimal"
                    />
                  </div>

                  {/* Agente Responsável */}
                  <div className="bg-surface-container-low border border-border-low-contrast rounded-lg p-3">
                    <span className="text-label-md text-on-surface-variant uppercase">Agente Responsável</span>
                    <Select
                      options={[
                        { value: 0, label: 'Sem agente' },
                        ...agents.map(ag => ({ value: ag.id, label: ag.name }))
                      ]}
                      value={agentId}
                      onChange={e => handleSelectChange('agent_id', e.target.value)}
                      disabled={!hasWritePermission || !isSuperAdmin}
                      variant="minimal"
                    />
                  </div>

                </div>
              </div>

              {/* Atividade Recente (Timeline Horizontal) */}
              <div>
                <div className="flex justify-between items-center mb-3 border-t border-border-low-contrast pt-4">
                  <h3 className="font-headline text-body-lg font-bold text-on-surface m-0">Atividade Recente</h3>
                  {onViewAllTimeline && (
                    <button
                      onClick={onViewAllTimeline}
                      className="text-label-md text-primary font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
                    >
                      Ver histórico completo
                    </button>
                  )}
                </div>
                {timelineDots && timelineDots.length > 0 ? (
                  <div className="flex items-center gap-6 py-4 overflow-x-auto min-h-[90px] border border-border-low-contrast/50 rounded-xl p-4 bg-surface-container-low/30 scrollbar-thin">
                    {timelineDots.map((dot, idx) => {
                      const isAI = dot.type === 'ai';
                      const isSystem = dot.type === 'add';

                      return (
                        <div key={idx} className="flex items-center gap-3 relative flex-shrink-0">
                          {/* Dot Icon */}
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center z-10 shrink-0 border border-border-low-contrast shadow-sm">
                            {isAI ? (
                              <span className="material-symbols-outlined text-primary text-[18px]">{dot.icon || 'smart_toy'}</span>
                            ) : isSystem ? (
                              <div className="w-7 h-7 rounded-full bg-status-success/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-status-success text-[18px]">{dot.icon || 'check_circle'}</span>
                              </div>
                            ) : (
                              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">{dot.icon || 'person'}</span>
                            )}
                          </div>
                          {/* Label */}
                        <div className="flex flex-col pr-4 min-w-[120px]">
                          <span className="text-body-sm font-semibold text-on-surface leading-tight truncate">{dot.label}</span>
                          <span className="text-[10px] text-on-surface-variant font-medium mt-0.5">Atividade</span>
                        </div>
                        {/* Connecting Line */}
                        {idx < timelineDots.length - 1 && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-border-low-contrast/60"></div>
                        )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-body-sm text-on-surface-variant/60 italic m-0">Nenhuma atividade recente.</p>
                )}
              </div>

              {/* Propriedades Personalizadas Dinâmicas */}
              {customProps.length > 0 && (
                <div className="mt-2 pt-4 border-t border-border-low-contrast">
                  <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-3 m-0">
                    Propriedades Personalizadas Adicionais
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customProps.map(item => {
                      const label = formatKey(item.key, translations);
                      const schemaField = schemaMap.get(item.key);

                      return (
                        <div key={item.id} className="bg-surface-container-low border border-border-low-contrast rounded-lg p-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">
                            {label}
                          </span>
                          {schemaField?.type === 'textarea' ? (
                            <textarea
                              value={item.value}
                              onChange={e => handleCustomPropChange(item.id, e.target.value)}
                              onBlur={() => saveCustomProps()}
                              disabled={!hasWritePermission}
                              rows={2}
                              className="w-full bg-transparent border-none p-0 text-body-sm text-on-surface-variant focus:ring-0 outline-none resize-y disabled:opacity-75"
                            />
                          ) : schemaField?.type === 'boolean' ? (
                            <Select
                              options={[
                                { value: 'true', label: 'Sim' },
                                { value: 'false', label: 'Não' }
                              ]}
                              value={String(item.value)}
                              onChange={e => {
                                handleCustomPropChange(item.id, String(e.target.value));
                                const updated = customProps.map(p => p.id === item.id ? { ...p, value: String(e.target.value) } : p);
                                saveCustomProps(updated);
                              }}
                              disabled={!hasWritePermission}
                              variant="minimal"
                            />
                          ) : schemaField?.type === 'select' ? (
                            <Select
                              options={schemaField.options || []}
                              value={item.value}
                              onChange={e => {
                                handleCustomPropChange(item.id, String(e.target.value));
                                const updated = customProps.map(p => p.id === item.id ? { ...p, value: String(e.target.value) } : p);
                                saveCustomProps(updated);
                              }}
                              disabled={!hasWritePermission}
                              variant="minimal"
                            />
                          ) : schemaField?.type === 'date' ? (
                            <input
                              type="date"
                              value={item.value}
                              onChange={e => {
                                handleCustomPropChange(item.id, e.target.value);
                                const updated = customProps.map(p => p.id === item.id ? { ...p, value: e.target.value } : p);
                                saveCustomProps(updated);
                              }}
                              disabled={!hasWritePermission}
                              className="w-full bg-transparent border-none p-0 text-body-sm text-on-surface focus:ring-0 outline-none disabled:opacity-75"
                            />
                          ) : schemaField?.type === 'number' ? (
                            <input
                              type="number"
                              value={item.value}
                              onChange={e => handleCustomPropChange(item.id, e.target.value)}
                              onBlur={() => saveCustomProps()}
                              disabled={!hasWritePermission}
                              className="w-full bg-transparent border-none p-0 text-body-sm text-on-surface focus:ring-0 outline-none disabled:opacity-75"
                            />
                          ) : (
                            <input
                              type={!isNaN(Number(item.value)) && item.value !== '' ? 'number' : 'text'}
                              value={item.value}
                              onChange={e => handleCustomPropChange(item.id, e.target.value)}
                              onBlur={() => saveCustomProps()}
                              disabled={!hasWritePermission}
                              className="w-full bg-transparent border-none p-0 text-body-sm text-on-surface focus:ring-0 outline-none disabled:opacity-75"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Motivo da Transferência */}
              {lead?.taken_motive && (
                <div className="mt-4 pt-4 border-t border-border-low-contrast">
                  <div className="bg-secondary-container/5 border border-secondary/25 p-3 rounded-lg text-secondary">
                    <span className="text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">info</span> Motivo da Transferência / Atendimento Humano
                    </span>
                    <p className="text-body-sm text-on-surface-variant leading-relaxed font-medium m-0">
                      {lead.taken_motive}
                    </p>
                  </div>
                </div>
              )}

              {/* Data Details */}
              <div className="mt-2 pt-4 border-t border-border-low-contrast flex flex-wrap gap-4 text-xs text-on-surface-variant">
                {lead?.created_at && <div><strong>Criado:</strong> {formatDate ? formatDate(lead.created_at) : lead.created_at}</div>}
                {lead?.taken_over_at && <div><strong>Assumido:</strong> {formatDate ? formatDate(lead.taken_over_at) : lead.taken_over_at}</div>}
                {lead?.updated_at && <div><strong>Atualizado:</strong> {formatDate ? formatDate(lead.updated_at) : lead.updated_at}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Motivo da Transferência / Alerta Flutuante */}
        {lead?.taken_motive && showMotiveBanner && (
          <div className="max-w-5xl mx-auto mb-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 flex items-start gap-2.5 shadow-sm text-body-sm relative z-10">
            <span className="material-symbols-outlined text-amber-600 shrink-0 mt-0.5">info</span>
            <div className="flex-1 pr-6">
              <span className="font-bold text-[10px] uppercase tracking-wider text-amber-700 block mb-0.5">Motivo do Atendimento Humano</span>
              <p className="m-0 leading-relaxed font-medium">{lead.taken_motive}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMotiveBanner(false);
              }}
              className="absolute right-2.5 top-2.5 w-6 h-6 flex items-center justify-center rounded-full hover:bg-amber-100 text-amber-700 cursor-pointer border-none bg-transparent"
              title="Fechar aviso"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Collapsed Panel Header / Strip */}
        <div
          onClick={() => setIsInfoExpanded(!isInfoExpanded)}
          className="max-w-5xl mx-auto mb-3 flex items-center justify-between px-4 py-2 bg-surface-container-low border border-border-low-contrast rounded-xl text-on-surface-variant relative z-10 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.08)] transition-all cursor-pointer select-none"
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">person</span>
              <span className="text-label-md font-headline font-bold uppercase tracking-wider">{lead?.name || 'Sem Nome'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">phone</span>
              <span className="text-label-md">
                {lead?.remote_jid_alt?.replace('@s.whatsapp.net', '') || 'Sem telefone'}
              </span>
            </div>
            {lead?.taken_motive && !showMotiveBanner && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMotiveBanner(true);
                }}
                className="flex items-center gap-1 text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold cursor-pointer transition-colors shrink-0"
                title="Reexibir motivo do atendimento humano"
              >
                <span className="material-symbols-outlined text-[14px] text-amber-600">info</span>
                Ver Motivo
              </button>
            )}
            {/* Removido o item de Origem/Suporte */}
          </div>
          <div
            className="flex items-center gap-1 text-label-md hover:text-primary transition-colors"
          >
            {isInfoExpanded ? 'Ver menos' : 'Ver mais'} 
            <span
              className="material-symbols-outlined text-[16px] transition-transform duration-300"
              style={{ transform: isInfoExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              keyboard_arrow_down
            </span>
          </div>
        </div>

        {/* Text Input area */}
        {leadStatus === 'CONCLUIDO' || leadStatus === 'FINALIZADO' ? (
          <div className="max-w-5xl mx-auto bg-surface-container border border-border-low-contrast rounded-2xl p-6 text-center shadow-md">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/70 mb-2 block" style={{ fontSize: '32px' }}>lock</span>
            <p className="text-body-md font-bold text-on-surface-variant">Atendimento finalizado</p>
            <p className="text-body-sm text-on-surface-variant/70 mt-1">Este atendimento foi concluído e não permite novas mensagens.</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-border-low-contrast rounded-xl shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-3 max-w-5xl mx-auto">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                let fileType = 'document';
                if (file.type.startsWith('image/')) fileType = 'image';
                else if (file.type.startsWith('audio/')) fileType = 'audio';
                else if (file.type.startsWith('video/')) fileType = 'video';
                const preview = URL.createObjectURL(file);
                setSelectedFile({ file, preview, type: fileType });
                e.target.value = '';
              }}
            />

            {/* Attachment Preview Bar */}
            {selectedFile && (
              <div className="flex items-center gap-3 p-3 bg-surface-container rounded-xl mb-2">
                <div className="w-10 h-10 bg-outline-variant/30 rounded-lg flex items-center justify-center overflow-hidden">
                  {selectedFile.type === 'image' ? (
                    <img src={selectedFile.preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-on-surface-variant">description</span>
                  )}
                </div>
                <span className="text-body-sm text-on-surface truncate flex-1 font-medium">{selectedFile.file.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-500/10 hover:text-red-500 cursor-pointer text-on-surface-variant text-lg font-bold border-none"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Audio Recording UI */}
            {isRecording ? (
              <div className="flex items-center justify-between p-4 bg-red-50/80 border border-red-200/50 rounded-xl mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  <span className="text-body-sm font-bold text-red-600">Gravando áudio...</span>
                  <span className="text-body-sm text-on-surface-variant font-mono">{formatDuration(recordingDuration)}</span>
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-label-md font-bold cursor-pointer hover:opacity-90 border-none"
                >
                  Parar
                </button>
              </div>
            ) : recordedAudio ? (
              <div className="flex items-center justify-between p-3 bg-surface-container rounded-xl mb-2">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm cursor-pointer border-none"
                    onClick={() => {
                      if (!audioPreviewRef.current) {
                        audioPreviewRef.current = new Audio(URL.createObjectURL(recordedAudio.blob));
                        audioPreviewRef.current.onended = () => {
                          const btn = document.querySelector('.audio-preview-play-btn');
                          if (btn) btn.textContent = '▶';
                        };
                      }
                      const audio = audioPreviewRef.current;
                      const btn = document.querySelector('.audio-preview-play-btn');
                      if (audio.paused) {
                        audio.play();
                        if (btn) btn.textContent = '⏸';
                      } else {
                        audio.pause();
                        if (btn) btn.textContent = '▶';
                      }
                    }}
                  >
                    <span className="audio-preview-play-btn">▶</span>
                  </button>
                  <span className="text-body-sm font-medium text-on-surface-variant">Áudio gravado ({formatDuration(recordedAudio.duration)})</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelRecordedAudio}
                    className="px-4 py-2 border border-border-low-contrast rounded-lg text-label-md font-bold cursor-pointer hover:bg-surface-container-high border-none bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={sendRecordedAudio}
                    disabled={sendingMessage}
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-bold cursor-pointer hover:opacity-90 disabled:opacity-50 border-none"
                  >
                    {sendingMessage ? '...' : 'Enviar'}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Input Text Area and controls */}
            {!isRecording && !recordedAudio && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-on-surface-variant hover:text-primary p-1.5 rounded-md hover:bg-surface-container transition-colors flex items-center gap-1 text-label-md bg-transparent border-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">attach_file</span> Anexar
                  </button>
                  <button
                    type="button"
                    onClick={startRecording}
                    className="text-on-surface-variant hover:text-primary p-1.5 rounded-md hover:bg-surface-container transition-colors flex items-center gap-1 text-label-md bg-transparent border-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">mic</span> Gravar
                  </button>
                </div>
                <div className="flex gap-3 items-end">
                  <textarea
                    className="w-full bg-transparent border-none focus:ring-0 resize-none text-body-md p-0 placeholder:text-on-surface-variant/60 outline-none"
                    placeholder="Escreva uma mensagem..."
                    rows={2}
                    value={inputText}
                    onFocus={() => setIsInfoExpanded(false)}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button
                    disabled={sendingMessage}
                    className="bg-primary text-on-primary hover:bg-primary-container px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm shrink-0 border-none cursor-pointer disabled:opacity-50"
                    onClick={() => handleSend()}
                  >
                    <span>Enviar</span>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Confirm create pessoa modal */}
      {showConfirmCreate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => !createLoading && setShowConfirmCreate(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm flex flex-col gap-4 border border-border-low-contrast"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex gap-4 items-start">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0 flex items-center justify-center">
                <AlertTriangle size={26} className="text-primary" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-on-surface mb-1">Criar Cadastro de Pessoa</h3>
                <p className="text-body-sm text-on-surface-variant">
                  Deseja criar um cadastro para <strong>"{name}"</strong> com o telefone <strong className="font-mono">{phone}</strong>?
                </p>
                <p className="text-[11px] italic text-on-surface-variant mt-2">
                  💡 Todos os leads com esse número serão vinculados automaticamente.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-border-low-contrast">
              <button
                onClick={() => setShowConfirmCreate(false)}
                disabled={createLoading}
                className="px-4 py-2 rounded-xl border border-border-low-contrast text-on-surface-variant font-bold text-sm hover:bg-surface-container transition-colors cursor-pointer bg-white"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setCreateLoading(true);
                  try {
                    const newPessoa = await api.createPessoa({ name, phone });
                    if (onUpdateLead) {
                      await onUpdateLead({ pessoa_id: newPessoa.id });
                    }
                    setShowConfirmCreate(false);
                    setCreateFeedback({
                      type: 'success',
                      title: 'Cadastro criado!',
                      message: 'A pessoa foi cadastrada e vinculada com sucesso. Outros leads com o mesmo número também foram associados.'
                    });
                  } catch (err: any) {
                    setShowConfirmCreate(false);
                    setCreateFeedback({
                      type: 'error',
                      title: 'Erro ao criar cadastro',
                      message: err.message || 'Não foi possível criar o cadastro.'
                    });
                  } finally {
                    setCreateLoading(false);
                  }
                }}
                disabled={createLoading}
                className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {createLoading ? 'Criando...' : 'Criar e Vincular'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback modal (success/error) */}
      {createFeedback && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setCreateFeedback(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm flex flex-col items-center text-center gap-4 border border-border-low-contrast"
            onClick={e => e.stopPropagation()}
          >
            {createFeedback.type === 'success' ? (
              <CheckCircle size={52} className="text-status-success" />
            ) : (
              <XCircle size={52} className="text-status-critical" />
            )}
            <div>
              <h3 className="text-lg font-extrabold text-on-surface mb-1">{createFeedback.title}</h3>
              <p className="text-body-sm text-on-surface-variant">{createFeedback.message}</p>
            </div>
            <button
              onClick={() => setCreateFeedback(null)}
              className="w-full py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
      {/* Local Concluded Modal */}
      {showLocalConcludedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[250] p-4">
          <div className="bg-white border border-border-low-contrast rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in text-on-surface">
            {localSaleStep === 'ask_sale' ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl mx-auto mb-4">💰</div>
                <h3 className="text-body-lg font-bold mb-2">Finalizar Atendimento</h3>
                <p className="text-body-md text-on-surface-variant mb-6">Houve venda neste atendimento?</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                  <button
                    onClick={() => setLocalSaleStep('enter_value')}
                    className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity cursor-pointer border-none"
                  >
                    Sim, houve venda
                  </button>
                  <button
                    onClick={() => handleConfirmConcluded(false)}
                    className="flex-1 px-6 py-3 border border-border-low-contrast rounded-xl font-bold hover:bg-surface-container transition-colors cursor-pointer bg-transparent text-on-surface"
                  >
                    Não houve venda
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowLocalConcludedModal(false);
                    setStatus(lead?.status || 'NOVO');
                  }}
                  className="text-label-md text-on-surface-variant hover:text-primary transition-colors font-bold cursor-pointer bg-transparent border-none"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-status-success/10 text-status-success rounded-full flex items-center justify-center text-3xl mx-auto mb-4">💰</div>
                <h3 className="text-body-lg font-bold mb-2">Valor da Venda</h3>
                <p className="text-body-md text-on-surface-variant mb-4 font-headline">Qual o valor gerado neste atendimento?</p>
                <input
                  type="number"
                  placeholder="0,00"
                  value={localSaleValue}
                  onChange={e => setLocalSaleValue(e.target.value)}
                  className="w-full border border-border-low-contrast rounded-xl px-4 py-3 text-body-md mb-6 text-center focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-bold text-lg text-on-surface bg-transparent"
                />
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setShowLocalConcludedModal(false);
                      setStatus(lead?.status || 'NOVO');
                    }}
                    className="flex-1 px-6 py-3 border border-border-low-contrast rounded-xl font-bold hover:bg-surface-container transition-colors cursor-pointer bg-transparent text-on-surface"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleConfirmConcluded(true)}
                    className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity cursor-pointer border-none"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Local Human Motive Modal */}
      {showLocalHumanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[250] p-4">
          <div className="bg-white border border-border-low-contrast rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in text-on-surface">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl mx-auto mb-4">👋</div>
              <h3 className="text-body-lg font-bold mb-2">Atendimento Humano</h3>
              <p className="text-body-md text-on-surface-variant mb-4">Por favor, informe o motivo do atendimento humano:</p>
              <textarea
                placeholder="Ex: Cliente quer tirar dúvidas específicas sobre contrato..."
                rows={3}
                value={localHumanMotive}
                onChange={e => setLocalHumanMotive(e.target.value)}
                className="w-full border border-border-low-contrast rounded-xl px-4 py-3 text-body-md mb-6 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-on-surface bg-transparent resize-none"
              />
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowLocalHumanModal(false);
                    setStatus(lead?.status || 'NOVO');
                  }}
                  className="flex-1 px-6 py-3 border border-border-low-contrast rounded-xl font-bold hover:bg-surface-container transition-colors cursor-pointer bg-transparent text-on-surface"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmHuman}
                  disabled={!localHumanMotive.trim()}
                  className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity cursor-pointer border-none disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
