import React, { useState } from 'react';
import { Save, Bell } from 'lucide-react';

export const Settings: React.FC = () => {
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Settings</h1>
        <p className="text-sm text-slate-500">Configure district healthcare thresholds and notification alerts.</p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg font-medium">
          Settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" /> High-Risk Threshold Alerts
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600 rounded" />
              <span className="text-sm text-slate-700">Send instant SMS alert when high-risk blood pressure (&gt;180 mmHg) is recorded</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600 rounded" />
              <span className="text-sm text-slate-700">Notify district medical officer if village high-risk cases exceed 20%</span>
            </label>
          </div>
        </div>

        <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Preferences
        </button>
      </form>
    </div>
  );
};