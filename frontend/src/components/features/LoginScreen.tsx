import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { KeyRound, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: { id: number; name: string; email: string; role: string; empresa_id?: number | null; empresa_name?: string | null; empresa_logo?: string | null; avatar?: string | null }, mustChangePassword: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);

  useEffect(() => {
    const getTenantFromUrl = (): string | null => {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        const first = parts[0];
        try {
          const dec = atob(first);
          if (/^\d+$/.test(dec)) return first;
        } catch (_) {}
      }

      const params = new URLSearchParams(window.location.search);
      const queryTenant = params.get('tenant') || params.get('company') || params.get('id');
      if (queryTenant) {
        return queryTenant;
      }

      let hash = window.location.hash.replace(/^#\/?/, '');
      if (hash.startsWith('login/')) {
        hash = hash.substring(6);
      }
      if (hash && hash.length > 2) {
        try {
          const dec = atob(hash);
          if (/^\d+$/.test(dec)) return hash;
        } catch (_) {}
      }

      return null;
    };

    const base64Id = getTenantFromUrl();
    if (base64Id) {
      setLoadingCompany(true);
      api.getPublicEmpresa(base64Id)
        .then((empresa) => {
          if (empresa && empresa.id) {
            setCompanyId(empresa.id);
            setCompanyName(empresa.name);
            setCompanyLogo(empresa.logo);
          }
        })
        .catch((err) => {
          console.error('Error fetching public empresa:', err);
          setError('Empresa não encontrada ou inativa');
        })
        .finally(() => {
          setLoadingCompany(false);
        });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login({ email, password, empresaId: companyId || undefined });
      if (res && res.token && res.user) {
        onLoginSuccess(res.token, res.user, res.must_change_password);
      } else {
        setError('Resposta inválida do servidor');
      }
    } catch (err: any) {
      setError(err.message || 'E-mail ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5 bg-background z-50" style={{
      background: 'radial-gradient(circle at 80% 20%, hsla(262, 83%, 58%, 0.15), transparent 45%), radial-gradient(circle at 10% 80%, hsla(0, 84%, 60%, 0.1), transparent 45%), hsl(var(--background))'
    }}>
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-border-low-contrast/50 rounded-2xl p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex flex-col items-center gap-2.5 text-center w-full">
          {loadingCompany ? (
            <>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-border-low-contrast via-surface to-border-low-contrast bg-[200%_100%] animate-pulse" style={{ animation: 'shimmer 1.5s infinite' }} />
              <div className="flex flex-col items-center gap-1.5 w-full">
                <div className="w-40 h-6 rounded bg-gradient-to-r from-border-low-contrast via-surface to-border-low-contrast bg-[200%_100%] animate-pulse" style={{ animation: 'shimmer 1.5s infinite' }} />
                <div className="w-55 h-3.5 rounded bg-gradient-to-r from-border-low-contrast via-surface to-border-low-contrast bg-[200%_100%] animate-pulse mt-1" style={{ animation: 'shimmer 1.5s infinite' }} />
              </div>
            </>
          ) : (
            <>
              {companyLogo ? (
                <img src={`data:image/png;base64,${companyLogo}`} alt={companyName || "Company Logo"} className="w-16 h-16 rounded-xl object-cover shadow-[0_8px_20px_-6px_hsla(262,83%,58%,0.3)]" />
              ) : (
                <img src="/logo.jpg" alt="DeltaAI Logo" className="w-16 h-16 rounded-xl object-cover shadow-[0_8px_20px_-6px_hsla(262,83%,58%,0.3)]" />
              )}
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{companyName ? companyName : "DeltaAI Admin"}</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  {companyName ? `Acesso restrito para ${companyName}` : "Entre para acessar sua conta"}
                </p>
              </div>
            </>
          )}
        </div>



        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50/80 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">E-mail</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="email"
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-border-low-contrast rounded-xl text-body-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none disabled:opacity-50"
                placeholder="nome@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Senha</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-12 pr-12 py-3 bg-surface-container-lowest border border-border-low-contrast rounded-xl text-body-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none disabled:opacity-50"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-on-primary py-3 px-4 rounded-xl font-semibold text-base shadow-[0_8px_20px_-6px_hsla(262,83%,58%,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};