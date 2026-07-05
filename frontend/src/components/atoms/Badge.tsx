import React from 'react';

interface BadgeProps {
  status: string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const getLeadStatusBadgeClass = (s: string) => {
    if (s === 'NOVO') return 'badge-info';
    if (s === 'HUMANO') return 'badge-warning';
    if (s === 'CANCELADO') return 'badge-danger';
    return 'badge-success';
  };

  return (
    <span className={`badge ${getLeadStatusBadgeClass(status)}`}>
      {status}
    </span>
  );
};
