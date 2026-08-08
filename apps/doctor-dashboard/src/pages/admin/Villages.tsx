import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { Village } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminVillages: React.FC = () => {
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await adminService.getVillages();
      setVillages(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Village Directory" subtitle="Manage healthcare coverage zones." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {villages.map((v) => (
          <div key={v.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">{v.name}</h3>
              <StatusBadge status={v.status} />
            </div>
            <p className="text-xs text-slate-500">Population: {v.population} | Registered: {v.registeredPatients}</p>
            <div className="pt-2 flex justify-between text-xs font-semibold text-slate-700">
              <span>High Risk: <strong className="text-rose-600">{v.highRiskCount}</strong></span>
              <span>ASHA Workers: {v.ashaWorkersCount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};