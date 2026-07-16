import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { KeyRound, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: { id: number; name: string; email: string; role: string; empresa_id?: number | null }) => void;
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
    // Extract tenant parameter from pathname, hash or query params
    const getTenantFromUrl = (): string | null => {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        const first = parts[0];
        try {
          const dec = atob(first);
          if (/^\d+$/.test(dec)) return first;
        } catch (_) {}
      }

      // Fallback to query param
      const params = new URLSearchParams(window.location.search);
      const queryTenant = params.get('tenant') || params.get('company') || params.get('id');
      if (queryTenant) {
        return queryTenant;
      }

      // Fallback to hash
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
        onLoginSuccess(res.token, res.user);
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
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 80% 20%, hsla(262, 83%, 58%, 0.15), transparent 45%), radial-gradient(circle at 10% 80%, hsla(0, 84%, 60%, 0.1), transparent 45%), hsl(var(--background))',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'hsla(var(--card) / 0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid hsla(var(--card-border) / 0.5)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '420px',
        padding: '40px',
        boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center', width: '100%' }}>
          <style>{`
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
          `}</style>
          {loadingCompany ? (
            <>
              {/* Skeleton logo */}
              <div 
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(90deg, hsl(var(--card-border)) 25%, hsl(var(--card)) 50%, hsl(var(--card-border)) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                  boxShadow: '0 8px 20px -6px rgba(0, 0, 0, 0.05)'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
                {/* Skeleton title */}
                <div 
                  style={{
                    width: '160px',
                    height: '24px',
                    borderRadius: '4px',
                    background: 'linear-gradient(90deg, hsl(var(--card-border)) 25%, hsl(var(--card)) 50%, hsl(var(--card-border)) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                  }}
                />
                {/* Skeleton subtitle */}
                <div 
                  style={{
                    width: '220px',
                    height: '14px',
                    borderRadius: '4px',
                    background: 'linear-gradient(90deg, hsl(var(--card-border)) 25%, hsl(var(--card)) 50%, hsl(var(--card-border)) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                    marginTop: '4px'
                  }}
                />
              </div>
            </>
          ) : (
            <>
              {companyLogo ? (
                <img src={`data:image/png;base64,${companyLogo}`} alt={companyName || "Company Logo"} style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover', boxShadow: '0 8px 20px -6px hsla(262, 83%, 58%, 0.3)' }} />
              ) : (
                <img src="/logo.jpg" alt="DeltaAI Logo" style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover', boxShadow: '0 8px 20px -6px hsla(262, 83%, 58%, 0.3)' }} />
              )}
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>{companyName ? companyName : "DeltaAI Admin"}</h2>
                <p style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
                  {companyName ? `Acesso restrito para ${companyName}` : "Entre para acessar sua conta"}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '48px' }}
                placeholder="nome@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: '48px', paddingRight: '48px' }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'hsl(var(--muted-foreground))',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  display: 'flex',
                  alignItems: 'center'
                }}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              padding: '12px',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 8px 20px -6px hsla(262, 83%, 58%, 0.4)',
              marginTop: '8px'
            }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};
