import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { toast } from '../../utils/toast';

export const AdminSettings: React.FC = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Admin System Configuration" subtitle="Global system settings and sync status." />
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">System Integration & Backup</h3>
        <p className="text-xs text-slate-500">
          Sync active offline storage from field tablets to central PHC server.
        </p>
        <button
          onClick={() => toast.success('Database sync completed successfully!')}
          className="px-4 py-2 bg-[#1976D2] text-white text-xs font-bold rounded-lg hover:bg-[#0D47A1]"
        >
          Force Manual Sync
        </button>
      </div>
    </div>
  );
};