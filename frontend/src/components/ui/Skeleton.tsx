import React from 'react';

interface SkeletonProps {
  type?: 'circle' | 'title' | 'text';
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ type, style }) => {
  const className = `skeleton ${type ? `skeleton-${type}` : ''}`;
  return <div className={className} style={style} />;
};
