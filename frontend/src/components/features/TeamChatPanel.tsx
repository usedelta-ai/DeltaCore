import React, { useRef, useEffect, useState } from 'react';
import { ChatMessageBubble } from '../ui/ChatMessageBubble';
import { MediaMessageRenderer } from './MediaMessageRenderer';
import { ConversationDivider } from './ConversationDivider';
import type { ChatMessage } from '../../services/api';
import { formatWhatsAppText } from '../../utils/whatsappFormat';
import { cleanMessageContent, formatTime, isAIMessage } from '../../utils/messageUtils';

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
    return 'human_takeover';
  }
  if (content.includes('finalized') || content.includes('✅') || content.includes('finalizad')) {
    return 'finalized';
  }
  return 'human_takeover';
}

function getMessageSender(
  msg: ChatMessage,
  leadName: string,
  currentUserName: string | undefined,
  userName: string | undefined,
  agentName: string | undefined,
  systemLogo?: string | null,
): { type: 'ai' | 'attendant' | 'lead'; author: string; avatarIcon: string; avatarSrc?: string } {
  const role = (msg.role || '').toLowerCase();
  const source = (msg.source || '').toLowerCase();
  const isAI = isAIMessage(msg);
  const isAttendant = role === 'attendant' || source === 'platform';

  if (isAI) {
    return { type: 'ai', author: agentName || 'Assistente IA', avatarIcon: 'smart_toy', avatarSrc: systemLogo || undefined };
  }
  if (isAttendant) {
    return { type: 'attendant', author: userName || currentUserName || 'Atendente', avatarIcon: 'person' };
  }
  return { type: 'lead', author: leadName || 'Lead', avatarIcon: 'person' };
}

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
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const filteredMessages = messages.filter(shouldDisplayMessage);

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

    const sender = getMessageSender(msg, leadName, currentUserName, userName, agentName, systemLogo);
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

  return (
    <section className="flex-1 bg-surface-bright flex flex-col relative overflow-hidden">
      <div className="p-6 bg-white border-b border-border-low-contrast flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-container rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">forum</span>
          </div>
          <div>
            <h3 className="font-headline-md text-body-lg font-bold">Colaboração Interna</h3>
            <p className="text-label-md text-on-surface-variant">Sincronizando com IA e Equipe</p>
          </div>
        </div>
        <div className="flex -space-x-2">
          {currentUserName && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-secondary flex items-center justify-center text-[10px] font-bold text-primary relative" style={{ marginLeft: -8 }}>
              {currentUserName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-[10px] flex items-center justify-center text-white font-bold relative" style={{ marginLeft: -8 }}>
            IA
          </div>
        </div>
      </div>

      <div
        ref={chatBodyRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-8"
      >
        <div className="text-center relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-low-contrast/50" />
          </div>
          <span className="relative bg-surface-bright px-4 text-[10px] font-label-md text-on-surface-variant uppercase tracking-widest">
            Histórico da Conversa
          </span>
        </div>

        {filteredMessages.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4 block">chat_bubble_outline</span>
            <p>Nenhuma mensagem nesta conversa</p>
          </div>
        )}

        <div className="space-y-6">
          {filteredMessages.map((msg, idx) => renderMessage(msg, idx))}
          {getFinalDivider()}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-5 z-10 w-10 h-10 rounded-full bg-primary text-white border-none shadow-[0_4px_12px_rgba(64,0,198,0.3)] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined">keyboard_double_arrow_down</span>
        </button>
      )}

      {/* Message Input Panel */}
      <div className="p-8 pt-4 bg-surface-bright">
        {leadStatus === 'CONCLUIDO' || leadStatus === 'FINALIZADO' ? (
          <div className="max-w-4xl mx-auto bg-surface-container border border-border-low-contrast rounded-2xl p-6 text-center shadow-md">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/70 mb-2 block" style={{ fontSize: '32px' }}>lock</span>
            <p className="text-body-md font-bold text-on-surface-variant">Atendimento finalizado</p>
            <p className="text-body-sm text-on-surface-variant/70 mt-1">Este atendimento foi concluído e não permite novas mensagens.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-white border border-border-low-contrast rounded-2xl p-2 shadow-xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
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
                <div className="flex justify-between items-center px-4 py-2 border-b border-border-low-contrast/50">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 text-label-md bg-transparent border-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xl">attach_file</span>
                      <span className="hidden sm:inline">Anexar</span>
                    </button>
                    <button
                      type="button"
                      onClick={startRecording}
                      className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 text-label-md bg-transparent border-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xl">mic</span>
                      <span className="hidden sm:inline">Gravar</span>
                    </button>
                  </div>
                </div>
                <textarea
                  className="w-full border-none resize-none p-4 text-body-md focus:ring-0 placeholder:text-on-surface-variant/50 outline-none"
                  placeholder="Escreva uma mensagem..."
                  rows={2}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <div className="flex justify-end px-4 py-2">
                  <button
                    disabled={sendingMessage}
                    className="bg-primary text-on-primary px-6 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity font-bold text-label-md cursor-pointer border-none disabled:opacity-50"
                    onClick={() => handleSend()}
                  >
                    <span>Enviar</span>
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
