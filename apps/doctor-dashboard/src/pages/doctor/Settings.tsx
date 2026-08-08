import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { toast } from '../../utils/toast';

export const DoctorSettings: React.FC = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Account & Portal Settings" subtitle="Configure preferences, decision support sensitivity, and security." />

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">AI Decision Support Thresholds</h3>
        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <p className="font-bold text-slate-800">High Risk Threshold Flagging</p>
              <p className="text-slate-500">Automatically flag patients with risk probability &gt; 80%</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#1976D2] rounded" />
          </label>
        </div>

        <div className="pt-4">
          <button
            onClick={() => toast.success('Settings updated successfully!')}
            className="px-4 py-2 bg-[#1976D2] text-white text-xs font-bold rounded-lg hover:bg-[#0D47A1]"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};