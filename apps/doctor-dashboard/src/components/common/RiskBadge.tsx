import React from 'react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  risk: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, size = 'md' }) => {
  let styles = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  
  if (risk === 'HIGH' || risk === 'CRITICAL') {
    styles = 'bg-rose-100 text-rose-800 border-rose-200';
  } else if (risk === 'MODERATE') {
    styles = 'bg-amber-100 text-amber-800 border-amber-200';
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-2.5 py-1 text-xs font-bold tracking-wide',
    lg: 'px-3 py-1.5 text-sm font-extrabold tracking-wide'
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${styles} ${sizeStyles[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        risk === 'HIGH' || risk === 'CRITICAL' ? 'bg-rose-600' : risk === 'MODERATE' ? 'bg-amber-600' : 'bg-emerald-600'
      }`} />
      {risk} RISK
    </span>
  );
};