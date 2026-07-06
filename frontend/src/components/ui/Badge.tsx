import React from 'react';

interface BadgeProps {
  status: string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const getLeadStatusBadgeClass = (s: string) => {
    if (s === 'NOVO')       return 'badge-info';      // Azul
    if (s === 'HUMANO')     return 'badge-warning';   // Âmbar
    if (s === 'FINALIZADO') return 'badge-purple';    // Roxo
    if (s === 'CONCLUIDO')  return 'badge-success';   // Verde
    if (s === 'CANCELADO')  return 'badge-danger';    // Vermelho
    return 'badge-secondary';
  };

  return (
    <span className={`badge ${getLeadStatusBadgeClass(status)}`}>
      {status}
    </span>
  );
};
