import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { ASHAWorker } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { UserModal } from '../../components/admin/UserModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { UserPlus } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [workers, setWorkers] = useState<ASHAWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await adminService.getAshaWorkers();
      setWorkers(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & ASHA Field Management"
        subtitle="Manage active community healthcare personnel."
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#1976D2] hover:bg-[#0D47A1] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="p-4">NAME</th>
                <th className="p-4">ROLE</th>
                <th className="p-4">VILLAGE</th>
                <th className="p-4">ASSESSMENTS</th>
                <th className="p-4">HIGH RISK IDENTIFIED</th>
                <th className="p-4">LAST ACTIVE</th>
                <th className="p-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workers.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{w.name}</td>
                  <td className="p-4 text-slate-600 font-medium">ASHA Worker</td>
                  <td className="p-4">{w.village}</td>
                  <td className="p-4 font-bold">{w.assessmentsCount}</td>
                  <td className="p-4 font-bold text-rose-600">{w.highRiskIdentified}</td>
                  <td className="p-4 text-slate-400">{w.lastActive}</td>
                  <td className="p-4"><StatusBadge status={w.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => {}} />
    </div>
  );
};