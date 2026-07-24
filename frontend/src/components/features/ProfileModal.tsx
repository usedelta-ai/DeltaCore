import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, Trash2, Loader2 } from 'lucide-react';
import {  useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
    empresa_name?: string | null;
    empresa_logo?: string | null;
  };
  onAvatarUpdate: (avatar: string | null) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onAvatarUpdate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const roleLabel: Record<string, string> = {
    superadmin: 'Super Admin',
    manager: 'Gerente',
    employee: 'Funcionário',
  };

  // const { data: summary } = useQuery({
  //   queryKey: ['leads-summary', { month: '' }],
  //   queryFn: () => api.getLeadsSummary(),
  //   enabled: isOpen,
  //   staleTime: 30_000,
  // });

  // const attendedTotal = (summary?.HUMANO?.total || 0) + (summary?.FINALIZADO?.total || 0) + (summary?.CONCLUIDO?.total || 0);
  // const attendedValue = (summary?.HUMANO?.value || 0) + (summary?.FINALIZADO?.value || 0) + (summary?.CONCLUIDO?.value || 0);

  const avatarMutation = useMutation({
    mutationFn: (avatar: string | null) => api.updateMyAvatar(avatar),
    onSuccess: (data) => {
      onAvatarUpdate(data.avatar);
      queryClient.invalidateQueries({ queryKey: ['leads-summary'] });
      setPreview(null);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setPreview(base64);
      avatarMutation.mutate(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setPreview(null);
    avatarMutation.mutate(null);
  };

  useEffect(() => {
    if (!isOpen) {
      // setPreview(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const avatarSrc = preview
    ? `data:image/png;base64,${preview}`
    : user.avatar
      ? (user.avatar.startsWith('data:') ? user.avatar : `data:image/png;base64,${user.avatar}`)
      : null;

  // const formatCurrency = (value: number) => {
  //   return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  // };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white border border-border-low-contrast rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-5 border-b border-border-low-contrast">
          <h2 className="text-headline-md font-headline-md font-bold m-0">Perfil</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border-none cursor-pointer text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-container flex items-center justify-center border-2 border-outline-variant">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-on-primary-container">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera size={20} className="text-white" />
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-body-lg font-bold text-on-surface m-0">{user.name}</h3>
              <p className="text-body-sm text-on-surface-variant mt-0.5">{user.email}</p>
              <span className="inline-block mt-1 px-3 py-0.5 bg-secondary-container text-on-secondary-container text-label-md font-bold rounded-full">
                {roleLabel[user.role] || user.role}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex gap-2">
              {user.avatar && !avatarMutation.isPending && (
                <button
                  onClick={handleRemoveAvatar}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-label-md font-bold text-status-critical bg-status-critical/10 hover:bg-status-critical/20 rounded-lg transition-colors cursor-pointer border-none"
                >
                  <Trash2 size={14} />
                  Remover foto
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-label-md font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors cursor-pointer border-none"
              >
                {avatarMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
                {user.avatar ? 'Alterar foto' : 'Adicionar foto'}
              </button>
            </div>
          </div>

          {/*<div className="border-t border-border-low-contrast pt-5">
            <h4 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider mb-3">
              Resumo de Leads
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary-container/20 border border-primary-container/30 rounded-xl p-4 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">support_agent</span>
                  <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Atendidos</span>
                </div>
                <span className="text-headline-md font-bold text-on-surface">{attendedTotal}</span>
                <span className="text-body-sm text-on-surface-variant">{formatCurrency(attendedValue)}</span>
              </div>
            </div>
          </div>*/}
        </div>
      </div>
    </div>
  );
};
