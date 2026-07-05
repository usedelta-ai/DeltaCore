import { useState, useEffect } from 'react';

export type UserRole = 'superadmin' | 'manager' | 'employee';

export interface AuthState {
  role: UserRole;
  companyId: number | null;
}

export function useAuthMock() {
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('user-role') as UserRole) || 'superadmin';
  });

  const [companyId, setCompanyId] = useState<number | null>(() => {
    const cached = localStorage.getItem('user-company-id');
    return cached ? parseInt(cached, 10) : null;
  });

  const changeRole = (newRole: UserRole, newCompanyId: number | null) => {
    setRole(newRole);
    setCompanyId(newCompanyId);
    localStorage.setItem('user-role', newRole);
    if (newCompanyId !== null) {
      localStorage.setItem('user-company-id', newCompanyId.toString());
    } else {
      localStorage.removeItem('user-company-id');
    }
    // Dispatch event or reload page to sync headers and fetch new data
    window.location.reload();
  };

  return {
    role,
    companyId,
    changeRole,
    isSuperAdmin: role === 'superadmin',
    isManager: role === 'manager',
    isEmployee: role === 'employee',
    hasWritePermission: role !== 'employee',
  };
}
