import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let color = 'bg-gray-100 text-gray-800 border-gray-200';

  const normalized = status.toLowerCase();
  if (['active', 'accepted', 'completed', 'reviewed', 'optimal'].includes(normalized)) {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['pending', 'pending review', 'attention required'].includes(normalized)) {
    color = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['high risk zone', 'urgent', 'rejected'].includes(normalized)) {
    color = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${color}`}>
      {status}
    </span>
  );
};