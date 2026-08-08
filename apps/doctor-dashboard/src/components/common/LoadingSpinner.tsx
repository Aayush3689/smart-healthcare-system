import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-3 border-[#1976D2] border-t-transparent rounded-full animate-spin" />
    </div>
  );
};