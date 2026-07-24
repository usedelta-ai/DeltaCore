import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { Bot, User, Send, Mic, Smile } from 'lucide-react';
import type { Lead, Agent, Empresa, ChatMessage, LeadStatus } from '../services/api';
import { api } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { ConfirmationModal } from '../components/Modal';
import { formatWhatsAppText } from '../utils/whatsappFormat';
import { MediaMessageRenderer } from '../components/features/MediaMessageRenderer';
import { LeadAvatar } from '../components/features/LeadAvatar';

interface LeadsPageProps {
  updateLead: (id: number, data: Partial<Lead>) => Promise<any>;
  getFilteredLeads: () => Lead[];
  getFilteredAgents: () => Agent[];
  isSuperAdmin: boolean;
  empresas: Empresa[];
  agents: Agent[];
  filterEmpresaId: number | string;
  setFilterEmpresaId: (v: number | string) => void;
  filterAgentId: number | string;
  setFilterAgentId: (v: number | string) => void;
  hasWritePermission: boolean;
  openEditForm: (item: any) => void;
  confirmDelete: (id: number, name: string) => void;
  setSelectedLeadId: (id: number) => void;
  setActiveTab: (tab: any) => void;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  editingId: number | null;
  leadName: string;
  setLeadName: (v: string) => void;
  leadAgentId: number;
  setLeadAgentId: (v: number) => void;
  leadRemoteJid: string;
  setLeadRemoteJid: (v: string) => void;
  leadStatus: string;
  setLeadStatus: (v: string) => void;
  leadValue: string;
  setLeadValue: (v: string) => void;
  actionLoading: boolean;
  handleSave: (e: React.FormEvent) => void;
  deleteModal: { isOpen: boolean; id: number; name: string };
  handleDelete: () => void;
  setDeleteModal: (v: any) => void;
  refetchLeads?: () => Promise<any> | void;
  systemLogo?: string | null;
  userName?: string;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({
  updateLead,
  getFilteredLeads,
  getFilteredAgents,
  isSuperAdmin,
  empresas,
  agents,
  filterEmpresaId,
  setFilterEmpresaId,
  filterAgentId,
  setFilterAgentId,
  hasWritePermission,
  openEditForm,
  confirmDelete,
  setSelectedLeadId,
  setActiveTab,
  isFormOpen,
  setIsFormOpen,
  editingId,
  leadName,
  setLeadName,
  leadAgentId,
  setLeadAgentId,
  leadRemoteJid,
  setLeadRemoteJid,
  leadStatus,
  setLeadStatus,
  leadValue,
  setLeadValue,
  actionLoading,
  handleSave,
  deleteModal,
  handleDelete,
  setDeleteModal,
  refetchLeads,
  systemLogo,
  userName,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);

  // Fullscreen Modal and Chat States
  const [selectedLeadForModal, setSelectedLeadForModal] = useState<Lead | null>(null);
  const [modalChatHistory, setModalChatHistory] = useState<ChatMessage[]>([]);
  const [loadingModalChat, setLoadingModalChat] = useState(false);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ file: File; preview: string; type: string } | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const wasAtBottomRef = useRef<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [hasLoadedChatInitial, setHasLoadedChatInitial] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Finalization and sale tracking states
  const [showFinalizationModal, setShowFinalizationModal] = useState(false);
  const [finalizationStep, setFinalizationStep] = useState<'ask_sale' | 'enter_value'>('ask_sale');
  const [finalizationValue, setFinalizationValue] = useState('');
  const [finalizationLoading, setFinalizationLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; base64: string; mimeType: string; duration: number } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const recordingDurationRef = useRef(0);
  const lastPresenceSentRef = useRef<number>(0);
  const presenceTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);

  const EMOJI_CATEGORIES = [
    {
      name: 'Smileys',
      icon: '😀',
      emojis: ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾']
    },
    {
      name: 'Pessoas',
      icon: '👋',
      emojis: ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁','👅','👄','💋','👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','🕵','💂','🥷','👷','🤴','👸','👳','👲','🧕','🤵','👰','🤰','🤱','👼','🎅','🤶','🦸','🦹','🧙','🧚','🧛','🧜','🧝','🧞','🧟','🧌','💆','💇','🚶','🧍','🧎','🏃','💃','🕺','👯','🧖','🧗','🤸','⛹','🏋','🏌','🏇','🧘','🏄','🏊','🤽','🚣','🏂','🪂','🏋','🤼','🤾','🤺','⛷','🏇','🧗']
    },
    {
      name: 'Animais',
      icon: '🐶',
      emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🪸','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿','🦔','🐾','🐉','🐲']
    },
    {
      name: 'Comida',
      icon: '🍎',
      emojis: ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🫘','🥐','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','🫖','☕','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🫗','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴','🍽','🥣','🥡','🥢','🧂']
    },
    {
      name: 'Viagem',
      icon: '🌍',
      emojis: ['🌍','🌎','🌏','🌐','🗺','🗾','🧭','🏔','⛰','🌋','🗻','🏕','🏖','🏜','🏝','🏞','🏟','🏛','🏗','🧱','🪨','🪵','🛖','🏘','🏚','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','🕍','⛩','🕋','⛲','⛺','🌁','🌃','🏙','🌄','🌅','🌆','🌇','🌉','♨️','🎠','🎡','🎢','💈','🎪','🚂','🚃','🚄','🚅','🚆','🚇','🚈','🚉','🚊','🚝','🚞','🚋','🚌','🚍','🚎','🚐','🚑','🚒','🚓','🚔','🚕','🚖','🚗','🚘','🚙','🛻','🚚','🚛','🚜','🏎','🏍','🛵','🛺','🚲','🛴','🛹','🛼','🚏','🛣','🛤','🛢','⛽','🛳','⛴','🛥','🚢','✈','🛩','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰','🚀','🛸','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽']
    },
    {
      name: 'Atividades',
      icon: '⚽',
      emojis: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛷','⛸','🥌','🎿','⛷','🏂','🪂','🏋','🤼','🤸','🤺','⛹','🤾','🏌','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🎯','🎮','🕹','🎲','♠','♥','♦','♣','🃏','🀄','🎴','🎭','🖼','🎨','🧵','🧶','🎼','🎤','🎧','🪘','🥁','🪗','🎷','🎸','🎺','🎻','🪕','🎙','🎚','🎛','🎶','🎵','🎹','🎬','🎥','🎞','📺','📻','🎙','🎚','🎛','🧭','⏱','⏲','⏰','🕰','⌛','📡','🔋','🪫','🔌','💡','🔦','🕯','🪔','🧯','🗑','🛢','💸','💵','💴','💶','💷','🪙','💰','💳','💎','⚖','🪜','🧰','🪛','🔧','🔨','⚒','🛠','⛏','🪚','🔩','⚙','🪤','🧱','⛓','🧲','🔫','💣','🧨','🪓','🔪','🗡','⚔','🛡','🚬','⚰','🪦','⚱','🏺','🔮','📿','🧿','🪬','💈','⚗','🔭','🔬','🕳','🩻','🩼','🩺','💉','🩸','💊','🩹','🩰','🩱','🩲','🩳','👙','👗','👘','🥻','🩴','👚','👖','🩲','🧦','👔','👕','👗','👙','🩱','👘','🥻','🩳','👖','🧣','🧤','🧥','🧦','👟','👞','👡','👠','👢','🥿','👣','👑','👒','🎩','🎓','🧢','🪖','⛑','📿','💄','💍','💎']
    },
    {
      name: 'Objetos',
      icon: '💡',
      emojis: ['💡','🔦','🕯','🪔','🧯','🗑','🛢','💸','💵','💴','💶','💷','🪙','💰','💳','💎','⚖','🪜','🧰','🪛','🔧','🔨','⚒','🛠','⛏','🪚','🔩','⚙','🪤','🧱','⛓','🧲','🔫','💣','🧨','🪓','🔪','🗡','⚔','🛡','🚬','⚰','🪦','⚱','🏺','🔮','📿','🧿','🪬','💈','⚗','🔭','🔬','🕳','🩻','🩼','🩺','💉','🩸','💊','🩹','🔌','🔋','🪫','📱','📲','💻','⌨','🖥','🖨','🖱','🖲','🕹','🗜','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽','🎞','📞','☎','📟','📠','📺','📻','🎙','🎚','🎛','🧭','⏱','⏲','⏰','🕰','⌛','📡','🔋','🪫','🔌','💡','🔦','🕯','🪔','🧯','🗑','🛢','💸','💵','💴','💶','💷','🪙','💰','💳','💎','⚖','🪜','🧰','🪛','🔧','🔨','⚒','🛠','⛏','🪚','🔩','⚙','🪤','🧱','⛓','🧲','🔫','💣','🧨','🪓','🔪','🗡','⚔','🛡','🚬','⚰','🪦','⚱','🏺','🔮','📿','🧿','🪬','💈','⚗','🔭','🔬','🕳','🩻','🩼','🩺','💉','🩸','💊','🩹','📝','📖','📚','📕','📗','📘','📙','📔','📓','📒','📃','📜','📄','📑','🧾','✉','📧','💌','📩','📨','📤','📥','📦','📪','📫','📬','📭','📮','✏','✒','🖊','🖋','🖌','🖍','📎','🖇','📏','📐','✂','📌','📍','🚩','🏳','🏴','🏁','🎌']
    },
    {
      name: 'Símbolos',
      icon: '❤️',
      emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮','✝','☪','🕉','☸','✡','🔯','🕎','☯','🦉','🆔','🈳','🈹','📴','📳','🈶','🈚','🈸','🈺','🈷','✴','🆚','🉑','💮','🉐','㊗','㊙','🈴','🈵','🈲','🅰','🅱','🆎','🆑','🅾','🆘','❌','⭕','🛑','⛔','📛','🚫','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼','⁉','🔅','🔆','〽','⚠','🚸','🔱','⚜','🔰','♻','✅','🈯','💹','❇','✳','❎','🌐','💠','Ⓜ','🌀','💤','🏧','🚾','♿','🅿','🛗','🈳','🈹','🛐','⏏','🆙','🆒','🆓','🆕','🆖','🆗','🆙','🆒','🆓','🆕','🆖','🆗','🆘','🆔','🔃','🔄','🔙','🔚','🔛','🔜','🔝','🛐','⚛','🉑','☢','☣','📛','🔰','♻','💱','💲','🔱','📶','🈁','🈂','🔤','🔡','🔠','🔢','🔣','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','▶','⏸','⏹','⏺','⏭','⏮','⏩','⏪','⏫','⏬','◀','🔼','🔽','➡','⬅','⬆','⬇','↗','↘','↙','↖','↕','🔄','↩','↪','⤴','⤵','🔃','🔄','🔙','🔚','🔛','🔜','🔝','🛐','⚛','🉑','☢','☣','📛','🔰','♻','💱','💲','🔱','📶','🈁','🈂','🔤','🔡','🔠','🔢','🔣']
    },
    {
      name: 'Bandeiras',
      icon: '🏁',
      emojis: ['🏁','🚩','🎌','🏴','🏳','🏳‍🌈','🏳‍⚧','🏴‍☠','🇦🇨','🇦🇩','🇦🇪','🇦🇫','🇦🇬','🇦🇮','🇦🇱','🇦🇲','🇦🇴','🇦🇶','🇦🇷','🇦🇸','🇦🇹','🇦🇺','🇦🇼','🇦🇽','🇦🇿','🇧🇦','🇧🇧','🇧🇩','🇧🇪','🇧🇫','🇧🇬','🇧🇭','🇧🇮','🇧🇯','🇧🇱','🇧🇲','🇧🇳','🇧🇴','🇧🇶','🇧🇷','🇧🇸','🇧🇹','🇧🇻','🇧🇼','🇧🇾','🇧🇿','🇨🇦','🇨🇨','🇨🇩','🇨🇫','🇨🇬','🇨🇭','🇨🇮','🇨🇰','🇨🇱','🇨🇲','🇨🇳','🇨🇴','🇨🇵','🇨🇷','🇨🇺','🇨🇻','🇨🇼','🇨🇽','🇨🇾','🇨🇿','🇩🇪','🇩🇬','🇩🇯','🇩🇰','🇩🇲','🇩🇴','🇩🇿','🇪🇦','🇪🇨','🇪🇪','🇪🇬','🇪🇭','🇪🇷','🇪🇸','🇪🇹','🇪🇺','🇫🇮','🇫🇯','🇫🇰','🇫🇲','🇫🇴','🇫🇷','🇬🇦','🇬🇧','🇬🇩','🇬🇪','🇬🇫','🇬🇬','🇬🇭','🇬🇮','🇬🇱','🇬🇲','🇬🇳','🇬🇵','🇬🇶','🇬🇷','🇬🇸','🇬🇹','🇬🇺','🇬🇼','🇬🇾','🇭🇰','🇭🇲','🇭🇳','🇭🇷','🇭🇹','🇭🇺','🇮🇨','🇮🇩','🇮🇪','🇮🇱','🇮🇲','🇮🇳','🇮🇴','🇮🇶','🇮🇷','🇮🇸','🇮🇹','🇯🇪','🇯🇲','🇯🇴','🇯🇵','🇰🇪','🇰🇬','🇰🇭','🇰🇮','🇰🇲','🇰🇳','🇰🇵','🇰🇷','🇰🇼','🇰🇾','🇰🇿','🇱🇦','🇱🇧','🇱🇨','🇱🇮','🇱🇰','🇱🇷','🇱🇸','🇱🇹','🇱🇺','🇱🇻','🇱🇾','🇲🇦','🇲🇨','🇲🇩','🇲🇪','🇲🇫','🇲🇬','🇲🇭','🇲🇰','🇲🇱','🇲🇲','🇲🇳','🇲🇴','🇲🇵','🇲🇶','🇲🇷','🇲🇸','🇲🇹','🇲🇺','🇲🇻','🇲🇼','🇲🇽','🇲🇾','🇲🇿','🇳🇦','🇳🇨','🇳🇪','🇳🇫','🇳🇬','🇳🇮','🇳🇱','🇳🇴','🇳🇵','🇳🇷','🇳🇺','🇳🇿','🇴🇲','🇵🇦','🇵🇪','🇵🇫','🇵🇬','🇵🇭','🇵🇰','🇵🇱','🇵🇲','🇵🇳','🇵🇷','🇵🇸','🇵🇹','🇵🇼','🇵🇾','🇶🇦','🇷🇪','🇷🇴','🇷🇸','🇷🇺','🇷🇼','🇸🇦','🇸🇧','🇸🇨','🇸🇩','🇸🇪','🇸🇬','🇸🇭','🇸🇮','🇸🇯','🇸🇰','🇸🇱','🇸🇲','🇸🇳','🇸🇴','🇸🇷','🇸🇸','🇸🇹','🇸🇻','🇸🇽','🇸🇾','🇸🇿','🇹🇦','🇹🇨','🇹🇩','🇹🇫','🇹🇬','🇹🇭','🇹🇯','🇹🇰','🇹🇱','🇹🇲','🇹🇳','🇹🇴','🇹🇷','🇹🇹','🇹🇻','🇹🇼','🇹🇿','🇺🇦','🇺🇬','🇺🇲','🇺🇳','🇺🇸','🇺🇾','🇺🇿','🇻🇦','🇻🇨','🇻🇪','🇻🇬','🇻🇮','🇻🇳','🇻🇺','🇼🇫','🇼🇸','🇽🇰','🇾🇪','🇾🇹','🇿🇦','🇿🇲','🇿🇼','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🏴󠁧󠁢󠁳󠁣󠁴󠁿','🏴󠁧󠁢󠁷󠁬󠁳󠁿']
    }
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const insertEmoji = (emoji: string) => {
    const input = messageInputRef.current;
    if (input) {
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? start;
      input.value = input.value.substring(0, start) + emoji + input.value.substring(end);
      input.selectionStart = input.selectionEnd = start + emoji.length;
      input.focus();
    }
    setShowEmojiPicker(false);
  };

  const sendPresence = useCallback(async (leadId: number, presence: 'composing' | 'recording') => {
    const now = Date.now();
    const minInterval = presence === 'recording' ? 10000 : 5000;
    if (now - lastPresenceSentRef.current < minInterval) return;
    lastPresenceSentRef.current = now;
    try {
      await api.sendPresence(leadId, presence);
    } catch {
      // best effort - silencioso
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (selectedLeadForModal) {
      sendPresence(selectedLeadForModal.id, 'recording');
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let mimeType = 'audio/ogg;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm;codecs=opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const recordedDuration = recordingDurationRef.current;
        const actualMime = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: actualMime });
        audioChunksRef.current = [];

        const toBase64 = (b: Blob): Promise<string> => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(b);
        });

        const audioBase64 = await toBase64(blob);
        setRecordedAudio({ blob, base64: audioBase64, mimeType: actualMime, duration: recordedDuration });
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
  }, [selectedLeadForModal, sendPresence]);

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
    if (!recordedAudio || !selectedLeadForModal || sendingMessage) return;
    setSendingMessage(true);
    try {
      const audioExt = recordedAudio.mimeType.includes('ogg') ? 'ogg' : (recordedAudio.mimeType.includes('mp4') ? 'mp4' : 'webm');
      const res = await api.sendLeadMessage(selectedLeadForModal.id, '', {
        messageType: 'audio',
        mediaBase64: recordedAudio.base64,
        fileName: `audio.${audioExt}`,
        quotedMessageId: replyToMessage?.id,
      });
      if (res.success && res.message) {
        setModalChatHistory(prev => [...prev, res.message]);
        setReplyToMessage(null);
        setRecordedAudio(null);
        if (selectedLeadForModal.status === 'NOVO') {
          setSelectedLeadForModal(prev => prev ? { ...prev, status: 'HUMANO' } : null);
          updateLead(selectedLeadForModal.id, { status: 'HUMANO' });
        }
      }
    } catch (err: any) {
      alert('Erro ao enviar áudio: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (selectedLeadForModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedLeadForModal]);

  // Keep props references to satisfy TS unused locals rule
  if (false as any) {
    setSelectedLeadId(0);
    setActiveTab('leads');
    console.log(ConfirmationModal, deleteModal, handleDelete, setDeleteModal);
  }

  // Periodic automatic sync for the main leads list using stable ref wrapper
  const refetchRef = useRef(refetchLeads);
  useEffect(() => {
    refetchRef.current = refetchLeads;
  }, [refetchLeads]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (refetchRef.current) {
        setIsRefreshing(true);
        try {
          await refetchRef.current();
        } catch (_) {}
        setTimeout(() => setIsRefreshing(false), 600);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Load filters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const companyParam = params.get('empresa');
    const agentParam = params.get('agente');
    if (companyParam) setFilterEmpresaId(companyParam);
    if (agentParam) setFilterAgentId(agentParam);
  }, []);

  const handleCompanyChange = (val: string) => {
    setFilterEmpresaId(val);
    const url = new URL(window.location.href);
    if (val) {
      url.searchParams.set('empresa', val);
    } else {
      url.searchParams.delete('empresa');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const handleAgentChange = (val: string) => {
    setFilterAgentId(val);
    const url = new URL(window.location.href);
    if (val) {
      url.searchParams.set('agente', val);
    } else {
      url.searchParams.delete('agente');
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Filtered Leads
  const filteredLeads = getFilteredLeads().filter(ld => {
    if (filterEmpresaId !== '') {
      const ag = agents.find(a => a.id === ld.agent_id);
      if (!ag || ag.empresa_id !== Number(filterEmpresaId)) return false;
    }
    if (filterAgentId !== '' && ld.agent_id !== Number(filterAgentId)) return false;
    return true;
  });

  // Load and poll chat history + lead data when fullscreen modal is active
  const leadModalIdRef = useRef<number | null>(null);
  useEffect(() => {
    const leadId = selectedLeadForModal?.id ?? null;
    if (!leadId) {
      leadModalIdRef.current = null;
      return;
    }
    leadModalIdRef.current = leadId;

    const loadInitial = async () => {
      setLoadingModalChat(true);
      try {
        const [historyRes, leadRes] = await Promise.all([
          api.getLeadHistory(leadId),
          api.getLeadById(leadId),
        ]);
        setModalChatHistory(historyRes.messages || []);
        if (leadRes) setSelectedLeadForModal(leadRes);
      } catch (err) {
        console.error('Erro ao carregar dados do lead:', err);
      } finally {
        setLoadingModalChat(false);
      }
    };
    loadInitial();

    const ticker = setInterval(async () => {
      const currentId = leadModalIdRef.current;
      if (!currentId) return;
      try {
        const [historyRes, leadRes] = await Promise.all([
          api.getLeadHistory(currentId),
          api.getLeadById(currentId),
        ]);
        const newMessages = historyRes.messages || [];
        setModalChatHistory(prev => {
          if (prev.length !== newMessages.length) return newMessages;
          if (prev.length > 0 && newMessages.length > 0) {
            const prevLast = prev[prev.length - 1];
            const newLast = newMessages[newMessages.length - 1];
            if (prevLast.id !== newLast.id || prevLast.content !== newLast.content) {
              return newMessages;
            }
          }
          return prev;
        });
        if (leadRes) setSelectedLeadForModal(leadRes);
      } catch (_) {}
    }, 3000);

    return () => clearInterval(ticker);
  }, [selectedLeadForModal?.id]);

  // Reset initial load status when selected lead changes
  useEffect(() => {
    setHasLoadedChatInitial(false);
  }, [selectedLeadForModal]);

  // Track scroll position dynamically
  useEffect(() => {
    const el = chatBodyRef.current;
    if (!el) return;
    const handleScroll = () => {
      // Se a diferença for menor que 35px, consideramos que o scroll está no final
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 35;
      wasAtBottomRef.current = isAtBottom;
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [selectedLeadForModal?.id]);

  // Handle scroll positioning before paint (useLayoutEffect)
  useLayoutEffect(() => {
    const el = chatBodyRef.current;
    if (!el) return;

    // Apenas rola se não estiver mais carregando as mensagens e houver mensagens no histórico
    if (!hasLoadedChatInitial && !loadingModalChat && modalChatHistory.length > 0) {
      // Carga inicial: rola imediatamente para o final de forma síncrona
      el.scrollTop = el.scrollHeight;
      wasAtBottomRef.current = true;
      
      // Múltiplos disparos garantem o scroll final mesmo com imagens e mídias sendo renderizadas
      const scrollAttempts = [80, 250, 600];
      scrollAttempts.forEach((delay) => {
        setTimeout(() => {
          if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
          }
          if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'instant' as any });
          }
        }, delay);
      });
      
      setHasLoadedChatInitial(true);
    } else if (hasLoadedChatInitial && wasAtBottomRef.current) {
      // Se já carregou inicialmente e estava no fundo antes de receber atualizações
      el.scrollTop = el.scrollHeight;
    }
  }, [modalChatHistory, hasLoadedChatInitial, loadingModalChat]);

  const handleQuickAssume = async () => {
    if (!selectedLeadForModal) return;
    try {
      const motive = `Assumido por ${userName || 'Atendente'}`;
      await updateLead(selectedLeadForModal.id, { status: 'HUMANO', taken_motive: motive });
      setSelectedLeadForModal(prev => prev ? { ...prev, status: 'HUMANO' as const, taken_motive: motive } : null);
    } catch (err: any) {
      alert('Erro ao assumir atendimento: ' + err.message);
    }
  };

  const handleQuickCancel = async () => {
    if (!selectedLeadForModal) return;
    if (!confirm('Tem certeza que deseja cancelar este atendimento?')) return;
    try {
      const motive = `Cancelado por ${userName || 'Atendente'}`;
      await updateLead(selectedLeadForModal.id, { status: 'CANCELADO', taken_motive: motive });
      setSelectedLeadForModal(prev => prev ? { ...prev, status: 'CANCELADO' as const, taken_motive: motive } : null);
    } catch (err: any) {
      alert('Erro ao cancelar atendimento: ' + err.message);
    }
  };

  const handleFinalize = async (hadSale: boolean, value?: number) => {
    if (!selectedLeadForModal) return;
    setFinalizationLoading(true);
    try {
      const targetStatus = hadSale ? 'CONCLUIDO' : 'FINALIZADO';
      const motive = `${hadSale ? 'Concluído com venda' : 'Finalizado sem venda'} por ${userName || 'Atendente'}`;
      const updateData: Partial<Lead> = { status: targetStatus, taken_motive: motive };
      if (hadSale && value !== undefined) {
        updateData.value = value;
      }
      await updateLead(selectedLeadForModal.id, updateData);
      setSelectedLeadForModal(prev => prev ? {
        ...prev,
        status: targetStatus,
        taken_motive: motive,
        ...(hadSale && value !== undefined ? { value } : {}),
      } : null);
      setShowFinalizationModal(false);
    } catch (err: any) {
      alert('Erro ao finalizar atendimento: ' + err.message);
    } finally {
      setFinalizationLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawText = messageInputRef.current?.value.trim() || '';
    const hasFile = !!selectedFile;
    if ((!rawText && !hasFile) || !selectedLeadForModal || sendingMessage) return;
    setSendingMessage(true);
    const senderLabel = userName || 'Atendente';
    const text = rawText ? `*${senderLabel}*\n${rawText}` : '';

    let messageType: string | undefined;
    let mediaBase64: string | undefined;
    let fileName: string | undefined;

    if (hasFile) {
      messageType = selectedFile!.type;
      fileName = selectedFile!.file.name;
      try {
        const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        mediaBase64 = await toBase64(selectedFile!.file);
      } catch {
        alert('Erro ao ler arquivo.');
        setSendingMessage(false);
        return;
      }
    }

    const quotedMessageId = replyToMessage?.id || undefined;

    try {
      const res = await api.sendLeadMessage(selectedLeadForModal.id, text, { messageType, mediaBase64, fileName, quotedMessageId });
      if (res.success && res.message) {
        setModalChatHistory(prev => [...prev, res.message]);
        if (messageInputRef.current) messageInputRef.current.value = '';
        setReplyToMessage(null);
        setSelectedFile(null);
        if (selectedLeadForModal.status === 'NOVO') {
          setSelectedLeadForModal(prev => prev ? { ...prev, status: 'HUMANO' } : null);
          updateLead(selectedLeadForModal.id, { status: 'HUMANO' });
        }
      }
    } catch (err: any) {
      alert('Erro ao enviar mensagem: ' + err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  // Helper to clean XML-like tags (e.g. <userMsg>, <agentMsg>) from content
  const cleanMsgContent = (content: string) => {
    if (!content) return '';
    return content
      .replace(/<\/?[a-zA-Z]+Msg>/g, '')
      .replace(/<transcription>([\s\S]*?)<\/transcription>/gi, '$1')
      .replace(/<transcricao>([\s\S]*?)<\/transcricao>/gi, '$1')
      .trim();
  };

  // Translation helpers matching the n8n logic
  const formatKey = (key: string, translations: Record<string, string> | null) => {
    if (!key) return '';
    if (translations && translations[key]) {
      return translations[key];
    }

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

    if (defaultTranslations[key]) {
      return defaultTranslations[key];
    }

    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatValue = (key: string, value: any, translations: Record<string, string> | null) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }

    if (key === 'room_type') {
      const normalized = String(value).trim().toLowerCase();
      if (translations && translations[normalized]) {
        return translations[normalized];
      }

      const roomTranslations: Record<string, string> = {
        single: 'Solteiro',
        double: 'Duplo',
        triple: 'Triplo',
        quadruple: 'Quádruplo',
        suite: 'Suíte',
        deluxe: 'Luxo',
        premium: 'Premium',
        family: 'Família',
        casal: 'Casal'
      };

      return roomTranslations[normalized] || value;
    }

    if (key.includes('date') || key.includes('at')) {
      try {
        const parsedDate = new Date(value);
        if (!isNaN(parsedDate.getTime())) {
          return new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            dateStyle: 'short',
            timeStyle: 'short'
          }).format(parsedDate);
        }
      } catch (e) {
        return String(value);
      }
    }

    const normalized = String(value).trim().toLowerCase();
    if (translations && translations[normalized]) {
      return translations[normalized];
    }

    return String(value);
  };

  const formatCurrency = (val: number | null) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          dateStyle: 'short',
          timeStyle: 'short'
        }).format(date);
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  };


  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDraggedOverCol(status);
  };

  const handleDragLeave = () => {
    setDraggedOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const leadIdStr = e.dataTransfer.getData('text/plain');
    if (!leadIdStr) return;
    const leadId = Number(leadIdStr);
    if (!isNaN(leadId)) {
      try {
        const leadStatusVal = status as LeadStatus;
        const statusMap: Record<string, string> = {
          'NOVO': 'Novo Lead',
          'HUMANO': 'Em Atendimento',
          'FINALIZADO': 'Finalizado',
          'CONCLUIDO': 'Faturado',
          'CANCELADO': 'Cancelado'
        };
        const statusText = statusMap[leadStatusVal] || leadStatusVal;
        const motive = `Alterado para ${statusText} via Kanban por ${userName || 'Atendente'}`;
        await updateLead(leadId, { status: leadStatusVal, taken_motive: motive });
        // Update modal status if open and matched
        if (selectedLeadForModal && selectedLeadForModal.id === leadId) {
          setSelectedLeadForModal(prev => prev ? { ...prev, status: leadStatusVal, taken_motive: motive } : null);
        }
      } catch (err) {
        console.error('Erro ao atualizar status do lead:', err);
      }
    }
  };

  // Modern Columns using gradients in CSS
  const columns = [
    { title: 'Novos Leads', status: 'NOVO', className: 'status-new' },
    { title: 'Em Atendimento Humano', status: 'HUMANO', className: 'status-human' },
    { title: 'Finalizados', status: 'FINALIZADO', className: 'status-finished' },
    { title: 'Faturados', status: 'CONCLUIDO', className: 'status-billed' }
  ];

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Filters and View Switcher Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          gap: '16px', 
          backgroundColor: 'hsl(var(--card))', 
          border: '1px solid hsl(var(--card-border))', 
          padding: '16px', 
          borderRadius: 'var(--radius)' 
        }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {isSuperAdmin && (
              <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>Empresa</label>
                <select className="form-control" value={filterEmpresaId} onChange={e => handleCompanyChange(e.target.value)}>
                  <option value="">Todas</option>
                  {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
            )}
            <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>Agente</label>
              <select className="form-control" value={filterAgentId} onChange={e => handleAgentChange(e.target.value)}>
                <option value="">Todos</option>
                {getFilteredAgents().filter(ag => filterEmpresaId === '' || ag.empresa_id === Number(filterEmpresaId)).map(ag => (
                  <option key={ag.id} value={ag.id}>{ag.name}</option>
                ))}
              </select>
            </div>
            
            {isRefreshing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: 600, paddingLeft: '8px' }} className="animate-pulse">
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #10b981', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                Atualizando...
              </div>
            )}
          </div>

          <div className="kanban-view-toggle">
            <button
              type="button"
              className={`kanban-view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              📋 Kanban
            </button>
            <button
              type="button"
              className={`kanban-view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              ☰ Tabela
            </button>
          </div>
        </div>

        {/* View Mode Content */}
        {viewMode === 'table' ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>JID</th>
                  <th>Agente</th>
                  <th>Status</th>
                  <th>Valor</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(ld => (
                  <tr key={ld.id}>
                    <td>{ld.name || 'Sem nome'}</td>
                    <td>{ld.remote_jid_alt}</td>
                    <td>{ld.agent_name || 'Sem agente'}</td>
                    <td><Badge variant="primary">{ld.status}</Badge></td>
                    <td>{ld.value ? formatCurrency(ld.value) : '-'}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedLeadForModal(ld)}>
                        💬 Chat
                      </button>
                      {hasWritePermission && (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(ld)}>
                            Editar
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => confirmDelete(ld.id, ld.name || ld.remote_jid_alt)}>
                            Excluir
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Kanban Board View */
          <div className="kanban-board" style={{ gridTemplateColumns: 'repeat(4, minmax(280px, 1fr))' }}>
            {columns.map(col => {
              const leadsInCol = filteredLeads
                .filter(l => l.status === col.status)
                .sort((a, b) => {
                  const dateCmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  if (dateCmp !== 0) return dateCmp;
                  const aMsg = a.lastmessage ?? '';
                  const bMsg = b.lastmessage ?? '';
                  return bMsg.localeCompare(aMsg);
                });
              const isOver = draggedOverCol === col.status;

              // Calculate column revenue
              const totalColRevenue = leadsInCol.reduce((acc, l) => acc + Number(l.value || 0), 0);

              return (
                <div 
                  key={col.status}
                  className={`kanban-col ${isOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, col.status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.status)}
                >
                  <div className={`column-header ${col.className}`}>
                    <div>
                      <div className="column-title">{col.title}</div>
                      <div className="column-subtitle">{leadsInCol.length} lead(s)</div>
                      {totalColRevenue > 0 && (
                        <div className="column-revenue" style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '4px' }}>
                          {formatCurrency(totalColRevenue)}
                        </div>
                      )}
                    </div>
                    <div className="column-badge">{leadsInCol.length}</div>
                  </div>

                  <div className="kanban-col-list">
                    {leadsInCol.map(ld => {
                      const timeElapsed = Date.now() - new Date(ld.created_at || 0).getTime();
                      const isDelayed = ld.status === 'HUMANO' && !ld.taken_over_at && timeElapsed > 4 * 60 * 60 * 1000;

                      return (
                        <div
                          key={ld.id}
                          className={`lead-card ${isDelayed ? 'delayed-highlight' : ''}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, ld.id)}
                          onClick={() => setSelectedLeadForModal(ld)}
                          style={{ cursor: 'pointer' }}
                        >
                          {isDelayed && (
                            <div className="delay-badge">
                              ⚠️ Humano pendente há +4h
                            </div>
                          )}

                          <div className="lead-top">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="lead-name">{ld.name || 'Sem Nome'}</div>
                              <div className="lead-subdetails">
                                <span className="lead-id">#{ld.id}</span>
                                {ld.remote_jid_alt && (
                                  <span className="lead-phone">
                                    {ld.remote_jid_alt.replace('@s.whatsapp.net', '')}
                                  </span>
                                )}
                              </div>
                            </div>
                            {ld.value && (
                              <span className="badge badge-success" style={{ fontSize: '10px' }}>
                                {formatCurrency(ld.value)}
                              </span>
                            )}
                          </div>

                          {ld.taken_motive && (
                            <div className="taken-motive-box">
                              <div className="taken-motive-label">Motivo do Atendimento Humano</div>
                              <div className="taken-motive-text">{ld.taken_motive}</div>
                            </div>
                          )}

                          <div className="lead-footer">
                            <div className="lead-footer-row">
                              <span className="lead-date-label">Criado: {formatDate(ld.created_at)}</span>
                              {ld.agent_name && (
                                <span className="lead-agent-badge">👤 {ld.agent_name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {leadsInCol.length === 0 && (
                      <div className="empty-column">
                        Nenhum lead nesta coluna
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Interactive Lead Modal & WhatsApp Chat */}
      {selectedLeadForModal && (
        <div className="lead-modal-overlay">
          <div className="lead-modal-container">
            {/* Sidebar Details */}
            <div className="lead-modal-sidebar">
              <div className="lead-sidebar-header">
                <div className="lead-sidebar-title">{selectedLeadForModal.name || 'Sem nome'}</div>
                <div className="lead-sidebar-subtitle">{selectedLeadForModal.remote_jid_alt}</div>
              </div>
              <div className="lead-sidebar-content">
                <div className="lead-prop-group">
                  <span className="lead-prop-label">Status</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`badge badge-${selectedLeadForModal.status === 'NOVO' ? 'info' : selectedLeadForModal.status === 'HUMANO' ? 'warning' : 'success'}`}>
                      {selectedLeadForModal.status}
                    </span>
                    <select
                      className="form-control"
                      value={selectedLeadForModal.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value as LeadStatus;
                        try {
                          await updateLead(selectedLeadForModal.id, { status: newStatus });
                          setSelectedLeadForModal(prev => prev ? { ...prev, status: newStatus } : null);
                        } catch (err) {
                          console.error('Erro ao atualizar status no modal:', err);
                        }
                      }}
                      style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                    >
                      <option value="NOVO">NOVO</option>
                      <option value="HUMANO">HUMANO</option>
                      <option value="FINALIZADO">FINALIZADO</option>
                      <option value="CONCLUIDO">FATURADO</option>
                      <option value="CANCELADO">CANCELADO</option>
                    </select>
                  </div>
                </div>
                <div className="lead-prop-group">
                  <span className="lead-prop-label">Agente Vinculado</span>
                  <span className="lead-prop-value">{selectedLeadForModal.agent_name || 'Sem agente'}</span>
                </div>
                <div className="lead-prop-group">
                  <span className="lead-prop-label">Valor Estimado</span>
                  <span className="lead-prop-value">
                    {selectedLeadForModal.value ? formatCurrency(selectedLeadForModal.value) : 'Não informado'}
                  </span>
                </div>
                
                {/* Properties list */}
                <div className="lead-prop-group">
                  <span className="lead-prop-label">Propriedades Personalizadas</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    {(() => {
                      const agent = agents.find(a => a.id === selectedLeadForModal.agent_id);
                      let translations: Record<string, string> = {};
                      if (agent && agent.translations) {
                        try {
                          translations = typeof agent.translations === 'string' ? JSON.parse(agent.translations) : agent.translations;
                        } catch (_) {}
                      }
                      const props = selectedLeadForModal.custom_properties || {};
                      if (Object.keys(props).length === 0) {
                        return <span style={{ fontSize: '13px', fontStyle: 'italic', color: 'hsl(var(--muted-foreground))' }}>Nenhuma propriedade registrada.</span>;
                      }
                      return Object.entries(props).map(([k, v]) => {
                        const label = formatKey(k, translations);
                        return (
                          <div key={k} style={{ fontSize: '13px', background: 'hsl(var(--secondary) / 0.4)', padding: '8px 12px', borderRadius: '6px', border: '1px solid hsl(var(--card-border))' }}>
                            <strong style={{ color: 'hsl(var(--primary))' }}>{label}:</strong> {formatValue(k, v, translations)}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
                
                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                  <button className="btn btn-secondary" onClick={() => setSelectedLeadForModal(null)} style={{ width: '100%' }}>
                    Fechar Detalhes
                  </button>
                </div>
              </div>
            </div>

            {/* WhatsApp Chat Panel */}
            <div className="wpp-chat-panel">
              <div className="wpp-chat-header">
                <div className="wpp-chat-user-info">
                  <LeadAvatar
                    leadId={selectedLeadForModal.id}
                    avatarType={selectedLeadForModal.status === 'NOVO' ? 'ai' : 'human'}
                    avatarLabel={(selectedLeadForModal.name || 'S')[0].toUpperCase()}
                    className="w-10 h-10 text-sm border-2 border-white/20 shadow-md"
                  />
                  <div>
                    <div className="wpp-chat-name">{selectedLeadForModal.name || 'Sem nome'}</div>
                    <div className="wpp-chat-status">
                      {selectedLeadForModal.session_id ? `Sessão: ${selectedLeadForModal.session_id}` : 'Sem sessão activa'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="wpp-action-bar">
                    {selectedLeadForModal.status === 'NOVO' && (
                      <button className="wpp-action-btn assume" onClick={handleQuickAssume}>
                        🤝 Assumir
                      </button>
                    )}
                    {selectedLeadForModal.status === 'HUMANO' && (
                      <button className="wpp-action-btn finalize" onClick={() => {
                        setFinalizationStep('ask_sale');
                        setFinalizationValue('');
                        setShowFinalizationModal(true);
                      }}>
                        ✅ Finalizar
                      </button>
                    )}
                    {selectedLeadForModal.status !== 'CANCELADO' && selectedLeadForModal.status !== 'FINALIZADO' && hasWritePermission && (
                      <button className="wpp-action-btn cancel" onClick={handleQuickCancel}>
                        🚫 Cancelar
                      </button>
                    )}
                  </div>
                  <button onClick={() => setSelectedLeadForModal(null)} style={{ color: '#8696a0', fontSize: '20px', padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
              </div>

              <div ref={chatBodyRef} className="wpp-chat-body">
                {loadingModalChat && modalChatHistory.length === 0 ? (
                  <div className="wpp-chat-loading">
                    <div className="wpp-chat-loading-row">
                      <div className="wpp-chat-loading-shimmer received" />
                    </div>
                    <div className="wpp-chat-loading-row sent">
                      <div className="wpp-chat-loading-shimmer sent" />
                    </div>
                    <div className="wpp-chat-loading-row">
                      <div className="wpp-chat-loading-shimmer received" style={{ width: '140px' }} />
                    </div>
                    <div className="wpp-chat-loading-row sent">
                      <div className="wpp-chat-loading-shimmer sent" style={{ width: '180px' }} />
                    </div>
                  </div>
                ) : modalChatHistory.length === 0 ? (
                  <div style={{ color: '#8696a0', textAlign: 'center', margin: 'auto', animation: 'fadeIn 0.3s ease-out' }}>Nenhuma mensagem registrada.</div>
                ) : (() => {
                  const currentAgent = agents.find(a => a.id === selectedLeadForModal?.agent_id);
                  const agentName = currentAgent?.name || 'Agente';
                  const agentInstance = currentAgent?.instance_name || '';
                  return modalChatHistory.map((msg, idx) => {
                    const role = (msg.role || '').toLowerCase();
                    const source = (msg.source || '').toLowerCase();

                    // ── System events (human takeover, finalized) ──
                    if (role === 'system_event') {
                      const eventDate = msg.createdAt ? new Date(msg.createdAt) : null;
                      const formattedDate = eventDate
                        ? eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : '';
                      const eventColor = msg.content?.includes('✅') ? '#16a34a' : '#7c3aed';
                      return (
                        <div key={msg.id || idx} style={{
                          alignSelf: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '8px 16px 6px',
                          margin: '6px 0',
                          width: '100%',
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

                    const isSentByUs = role === 'attendant' || role === 'assistant' || role === 'bot' || role === 'admin' || role === 'ai' || source === 'bot' || source === 'operator' || source === 'platform' || source === 'ai';
                    const isAi = role === 'assistant' || role === 'bot' || role === 'ai' || source === 'bot' || source === 'ai';
                    const                     isAttendant = role === 'attendant' || source === 'platform';
                    const isFromClient = role === 'user' || role === 'human';
                    
                    const clientName = selectedLeadForModal?.name || 'Lead';
                    const senderName = isAi ? agentName : (isAttendant ? 'Atendente' : (isFromClient ? clientName : ''));
                    
                    const avatarStyle = { width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '9px', fontWeight: 700, overflow: 'hidden' } as const;
                    
                    let avatar: React.ReactNode = null;
                    if (isAi && systemLogo) {
                      avatar = <img src={systemLogo} alt="" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />;
                    } else if (isAi && agentName) {
                      avatar = <div style={{ ...avatarStyle, background: '#0088cc', color: '#fff' }}>{agentName[0].toUpperCase()}</div>;
                    } else if (isAi) {
                      avatar = <Bot size={11} />;
                    } else if (isAttendant) {
                      avatar = <div style={{ ...avatarStyle, background: '#0088cc', color: '#fff' }}><User size={9} /></div>;
                    } else if (isFromClient) {
                      const initial = (selectedLeadForModal?.name || '?')[0].toUpperCase();
                      avatar = <div style={{ ...avatarStyle, background: '#25d366', color: '#fff' }}>{initial}</div>;
                    }

                    return (
                      <div key={msg.id || idx} className={`wpp-msg-wrapper ${isSentByUs ? 'sent' : 'received'}`}>
                        <div
                          className={`wpp-bubble ${isSentByUs ? 'sent' : 'received'}`}
                          onClick={() => { if (isSentByUs || isFromClient) setReplyToMessage(msg); }}
                          style={{
                            cursor: (isSentByUs || isFromClient) ? 'pointer' : 'default',
                            ...(isAttendant ? { background: '#dbeafe' } : {}),
                          }}
                        >
                          {msg.quoted_message_text && (
                            <div style={{ borderLeft: '3px solid #25d366', paddingLeft: '8px', fontSize: '12px', color: '#667781', marginBottom: '6px', fontStyle: 'italic' }}>
                              {cleanMsgContent(msg.quoted_message_text)}
                            </div>
                          )}
                          {(isSentByUs || isFromClient) && avatar && (
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#0088cc', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {avatar}
                              {senderName}
                            </div>
                          )}
                          {msg.messageType && msg.messageType !== 'conversation' && msg.messageType !== 'extendedTextMessage' ? (
                            <MediaMessageRenderer
                              messageId={msg.id}
                              messageType={msg.messageType}
                              content={cleanMsgContent(msg.content)}
                              instanceName={agentInstance}
                              whatsAppMessageId={msg.messageId}
                            />
                          ) : (
                            <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: 1.45, color: '#111b21' }}>
                              {formatWhatsAppText(cleanMsgContent(msg.content))}
                            </div>
                          )}
                          <span className="wpp-time">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="wpp-chat-footer" style={{ flexDirection: 'column', gap: '0', padding: '0', height: 'auto' }}>
                {selectedLeadForModal.status === 'NOVO' || selectedLeadForModal.status === 'HUMANO' ? (
                  <>
                    {replyToMessage && (
                      <div className="wpp-reply-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 24px', background: '#e9edef', borderTop: '1px solid #d1d7db', fontSize: '12px', width: '100%' }}>
                        <div style={{ borderLeft: '3px solid #0088cc', paddingLeft: '8px', flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, color: '#0088cc', fontSize: '11px' }}>Respondendo</div>
                          <div style={{ color: '#667781', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cleanMsgContent(replyToMessage.content || '')}</div>
                        </div>
                        <button type="button" onClick={() => setReplyToMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8696a0', fontSize: '16px', padding: '0 4px', transition: 'color 0.15s', lineHeight: 1 }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#8696a0'}>✕</button>
                      </div>
                    )}
                    {selectedFile && (
                      <div className="wpp-file-preview" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 24px', background: '#e9edef', borderTop: '1px solid #d1d7db', width: '100%' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#d1d7db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', overflow: 'hidden', flexShrink: 0 }}>
                          {selectedFile.type === 'image' ? (
                            <img src={selectedFile.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            '📎'
                          )}
                        </div>
                        <span style={{ fontSize: '13px', color: '#111b21', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.file.name}</span>
                        <button type="button" onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8696a0', fontSize: '16px', padding: '0 4px', transition: 'color 0.15s', lineHeight: 1 }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#8696a0'}>✕</button>
                      </div>
                    )}
                    {isRecording ? (
                      <div className="wpp-recording-bar">
                        <div className="wpp-recording-dot" />
                        <span className="wpp-recording-timer">{formatDuration(recordingDuration)}</span>
                        <span className="wpp-recording-label">Gravando áudio...</span>
                        <button type="button" onClick={stopRecording} className="wpp-recording-stop-btn" title="Parar gravação">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                        </button>
                      </div>
                    ) : recordedAudio ? (
                      <div className="wpp-audio-preview-bar">
                        <button
                          type="button"
                          className="wpp-audio-preview-play"
                          onClick={() => {
                            if (!audioPreviewRef.current) {
                              audioPreviewRef.current = new Audio(URL.createObjectURL(recordedAudio.blob));
                              audioPreviewRef.current.onended = () => {
                                const btn = document.querySelector('.wpp-audio-preview-play');
                                if (btn) btn.textContent = '▶';
                              };
                            }
                            if (audioPreviewRef.current.paused) {
                              audioPreviewRef.current.play();
                            } else {
                              audioPreviewRef.current.pause();
                            }
                          }}
                        >
                          ▶
                        </button>
                        <div className="wpp-audio-preview-wave">
                          <div className="wpp-audio-preview-progress" />
                          <div className="wpp-audio-preview-bars">
                            {Array.from({ length: 30 }).map((_, i) => (
                              <div key={i} className="wpp-audio-bar" style={{ height: `${20 + Math.sin(i * 1.2) * 40 + Math.random() * 20}%` }} />
                            ))}
                          </div>
                        </div>
                        <span className="wpp-audio-preview-duration">{formatDuration(recordedAudio.duration)}</span>
                        <button type="button" onClick={cancelRecordedAudio} className="wpp-audio-preview-cancel" title="Cancelar">
                          ✕
                        </button>
                        <button type="button" onClick={sendRecordedAudio} className="wpp-audio-preview-send" title="Enviar áudio" disabled={sendingMessage}>
                          {sendingMessage ? '...' : <Send size={18} />}
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', width: '100%' }}>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          let fileType = 'document';
                          if (file.type.startsWith('image/')) fileType = 'image';
                          else if (file.type.startsWith('audio/')) fileType = 'audio';
                          else if (file.type.startsWith('video/')) fileType = 'video';
                          const preview = URL.createObjectURL(file);
                          setSelectedFile({ file, preview, type: fileType });
                          e.target.value = '';
                        }} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8696a0', padding: '4px', display: 'flex', alignItems: 'center', fontSize: '20px', lineHeight: 1 }} title="Anexar arquivo">
                          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        </button>
                        <div style={{ position: 'relative' }}>
                          <button type="button" onClick={() => setShowEmojiPicker(prev => !prev)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8696a0', padding: '4px', display: 'flex', alignItems: 'center' }} title="Emoji">
                            <Smile size={22} />
                          </button>
                          {showEmojiPicker && (
                            <div ref={emojiPickerRef} style={{ position: 'absolute', bottom: '48px', left: '-8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.18)', zIndex: 100, width: '336px' }}>
                              {/* Categories Tabs */}
                              <div style={{ display: 'flex', gap: '2px', padding: '8px 10px 4px', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
                                {EMOJI_CATEGORIES.map((cat, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setActiveEmojiCategory(idx)}
                                    style={{
                                      background: idx === activeEmojiCategory ? '#e8f4fd' : 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      borderRadius: '8px',
                                      padding: '6px 8px',
                                      fontSize: '18px',
                                      lineHeight: 1,
                                      flexShrink: 0,
                                      borderBottom: idx === activeEmojiCategory ? '2px solid #0088cc' : '2px solid transparent',
                                      transition: 'all 0.15s',
                                      opacity: idx === activeEmojiCategory ? 1 : 0.5
                                    }}
                                    title={cat.name}
                                  >
                                    {cat.icon}
                                  </button>
                                ))}
                              </div>
                              {/* Emoji Grid */}
                              <div style={{ padding: '8px', maxHeight: '260px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map((emoji, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => insertEmoji(emoji)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: '24px',
                                      padding: '4px',
                                      lineHeight: 1,
                                      borderRadius: '8px',
                                      transition: 'background 0.12s',
                                      width: '40px',
                                      height: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          className="wpp-input-area"
                          placeholder="Digite uma mensagem"
                          ref={messageInputRef}
                          disabled={sendingMessage}
                          onChange={() => {
                            if (!selectedLeadForModal) return;
                            if (messageInputRef.current?.value.trim()) {
                              sendPresence(selectedLeadForModal.id, 'composing');
                              if (presenceTypingTimerRef.current) clearTimeout(presenceTypingTimerRef.current);
                            }
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Escape') {
                              setReplyToMessage(null);
                              setSelectedFile(null);
                              setShowEmojiPicker(false);
                              cancelRecordedAudio();
                            }
                          }}
                        />
                        <button type="button" onClick={startRecording} disabled={sendingMessage || !!recordedAudio} style={{ background: 'none', border: 'none', cursor: sendingMessage ? 'not-allowed' : 'pointer', color: '#8696a0', padding: '4px', display: 'flex', alignItems: 'center', opacity: (sendingMessage || !!recordedAudio) ? 0.5 : 1 }} title="Gravar áudio">
                          <Mic size={22} />
                        </button>
                        <button type="submit" className="wpp-send-btn" disabled={sendingMessage}>
                          {sendingMessage ? '...' : <Send size={18} />}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color: '#8696a0', textAlign: 'center', width: '100%', fontSize: '13px', fontStyle: 'italic', padding: '20px' }}>
                    Envio de mensagens bloqueado para este status (Apenas Novo ou Humano).
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {showFinalizationModal && (
        <div className="finalization-modal-overlay">
          <div className="finalization-modal">
            {finalizationStep === 'ask_sale' ? (
              <>
                <div className="fin-modal-icon">✅</div>
                <h3>Finalizar Atendimento</h3>
                <p>Houve venda neste atendimento?</p>
                <div className="fin-modal-actions">
                  <button className="fin-btn yes" onClick={() => {
                    setFinalizationStep('enter_value');
                  }}>
                    💰 Sim, houve venda
                  </button>
                  <button className="fin-btn no" onClick={() => handleFinalize(false)}>
                    ❌ Não houve venda
                  </button>
                </div>
                <button className="fin-btn-cancel" onClick={() => setShowFinalizationModal(false)}>
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <div className="fin-modal-icon">💰</div>
                <h3>Valor da Venda</h3>
                <p>Qual o valor gerado neste atendimento?</p>
                <input
                  type="number"
                  className="fin-value-input"
                  placeholder="0,00"
                  value={finalizationValue}
                  onChange={e => setFinalizationValue(e.target.value)}
                  autoFocus
                />
                <div className="fin-modal-actions">
                  <button className="fin-btn yes" disabled={finalizationLoading}
                    onClick={() => handleFinalize(true, Number(finalizationValue))}>
                    {finalizationLoading ? 'Salvando...' : '✅ Confirmar'}
                  </button>
                  <button className="fin-btn no" onClick={() => setFinalizationStep('ask_sale')}>
                    ← Voltar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--card-border))', paddingBottom: '12px', marginBottom: '20px' }}>
              <h2>{editingId ? 'Editar' : 'Novo'} Lead</h2>
              <button onClick={() => setIsFormOpen(false)} className="btn-ghost">✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Nome do Lead</label>
                <input type="text" className="form-control" value={leadName} onChange={e => setLeadName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Agente Vinculado</label>
                <select className="form-control" value={leadAgentId} onChange={e => setLeadAgentId(Number(e.target.value))}>
                  {getFilteredAgents().map(ag => <option key={ag.id} value={ag.id}>{ag.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Remote JID / Telefone</label>
                <input type="text" className="form-control" value={leadRemoteJid} onChange={e => setLeadRemoteJid(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={leadStatus} onChange={e => setLeadStatus(e.target.value)}>
                  <option value="NOVO">NOVO</option>
                  <option value="HUMANO">HUMANO</option>
                  <option value="FINALIZADO">FINALIZADO</option>
                  <option value="CONCLUIDO">CONCLUIDO</option>
                  <option value="CANCELADO">CANCELADO</option>
                </select>
              </div>
              <div className="form-group">
                <label>Valor estimado</label>
                <input type="text" className="form-control" value={leadValue} onChange={e => setLeadValue(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid hsl(var(--card-border))', paddingTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} disabled={actionLoading}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
};

