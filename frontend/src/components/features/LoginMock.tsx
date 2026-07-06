import React from 'react';
import type { UserRole } from '../../hooks/useAuthMock';
import { useAuthMock } from '../../hooks/useAuthMock';
import type { Empresa } from '../../services/api';
import { Shield, Users, User } from 'lucide-react';

interface LoginMockProps {
  empresas: Empresa[];
}

export const LoginMock: React.FC<LoginMockProps> = ({ empresas }) => {
  const { role, companyId, changeRole } = useAuthMock();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'superadmin') {
      changeRole('superadmin', null);
    } else {
      const [rolePart, companyIdPart] = val.split(':');
      changeRole(rolePart as UserRole, parseInt(companyIdPart, 10));
    }
  };

  const getRoleIcon = () => {
    if (role === 'superadmin') return <Shield size={16} style={{ color: 'hsl(var(--primary))' }} />;
    if (role === 'manager') return <Users size={16} style={{ color: 'hsl(var(--warning))' }} />;
    return <User size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />;
  };

  const currentValue = role === 'superadmin' ? 'superadmin' : `${role}:${companyId}`;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--card-border))',
      borderRadius: '24px',
      padding: '6px 16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      marginLeft: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {getRoleIcon()}
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
          Simular Perfil:
        </span>
      </div>
      <select
        value={currentValue}
        onChange={handleRoleChange}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'hsl(var(--foreground))',
          fontSize: '12px',
          fontWeight: 500,
          outline: 'none',
          cursor: 'pointer',
          paddingRight: '8px'
        }}
      >
        <option value="superadmin" style={{ background: 'hsl(var(--card))' }}>
          🛡️ Super Admin Geral
        </option>
        {empresas.map((emp) => (
          <React.Fragment key={emp.id}>
            <option value={`manager:${emp.id}`} style={{ background: 'hsl(var(--card))' }}>
              💼 Gerente: {emp.name}
            </option>
            <option value={`employee:${emp.id}`} style={{ background: 'hsl(var(--card))' }}>
              🧑‍💻 Funcionário: {emp.name}
            </option>
          </React.Fragment>
        ))}
      </select>
    </div>
  );
};
