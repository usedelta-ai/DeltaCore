import React, { useState } from 'react';
import { api } from '../../services/api';
import { KeyRound, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface ChangePasswordScreenProps {
  userName: string;
  onPasswordChanged: () => void;
  onLogout: () => void;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ userName, onPasswordChanged, onLogout }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    if (currentPassword === newPassword) {
      setError('A nova senha deve ser diferente da senha atual');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setTimeout(() => {
        onPasswordChanged();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-5 bg-background z-50" style={{
        background: 'radial-gradient(circle at 80% 20%, hsla(262, 83%, 58%, 0.15), transparent 45%), radial-gradient(circle at 10% 80%, hsla(0, 84%, 60%, 0.1), transparent 45%), hsl(var(--background))'
      }}>
        <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-border-low-contrast/50 rounded-2xl p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Senha alterada!</h2>
            <p className="text-on-surface-variant">Redirecionando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5 bg-background z-50" style={{
      background: 'radial-gradient(circle at 80% 20%, hsla(262, 83%, 58%, 0.15), transparent 45%), radial-gradient(circle at 10% 80%, hsla(0, 84%, 60%, 0.1), transparent 45%), hsl(var(--background))'
    }}>
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-border-low-contrast/50 rounded-2xl p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]">
        <div className="flex flex-col items-center gap-2.5 text-center w-full mb-6">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <KeyRound size={28} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Alterar Senha</h2>
          <p className="text-sm text-on-surface-variant">
            Olá, <strong>{userName}</strong>! No primeiro acesso você precisa criar uma nova senha.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50/80 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Senha Atual</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type={showCurrent ? 'text' : 'password'}
                className="w-full pl-12 pr-12 py-3 bg-surface-container-lowest border border-border-low-contrast rounded-xl text-body-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none disabled:opacity-50"
                placeholder="Sua senha atual"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50" disabled={loading}>
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Nova Senha</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type={showNew ? 'text' : 'password'}
                className="w-full pl-12 pr-12 py-3 bg-surface-container-lowest border border-border-low-contrast rounded-xl text-body-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none disabled:opacity-50"
                placeholder="Nova senha (mín. 6 caracteres)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50" disabled={loading}>
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Confirmar Nova Senha</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type={showConfirm ? 'text' : 'password'}
                className="w-full pl-12 pr-12 py-3 bg-surface-container-lowest border border-border-low-contrast rounded-xl text-body-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none disabled:opacity-50"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50" disabled={loading}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-on-primary py-3 px-4 rounded-xl font-semibold text-base shadow-[0_8px_20px_-6px_hsla(262,83%,58%,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            disabled={loading}
          >
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="text-sm text-on-surface-variant hover:text-primary transition-colors text-center"
            disabled={loading}
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  );
};
