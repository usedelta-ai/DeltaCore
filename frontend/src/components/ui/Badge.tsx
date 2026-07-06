import React from 'react';

interface BadgeProps {
  status: string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const statusLabel = (s: string) => {
    if (s === 'NOVO')       return 'Novo';
    if (s === 'HUMANO')     return 'Humano';
    if (s === 'FINALIZADO') return 'Finalizado';
    if (s === 'CONCLUIDO')  return 'Faturado';
    if (s === 'CANCELADO')  return 'Cancelado';
    return s;
  };

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
      {statusLabel(status)}
    </span>
  );
};
