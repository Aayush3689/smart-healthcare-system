import React, { useEffect, useState } from 'react';
import { adminService, PhcVillage } from '../../services/admin.service';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { toast } from '../../utils/toast';

export const AdminVillages: React.FC = () => {
  const [villages, setVillages] = useState<PhcVillage[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { adminService.getVillages().then(setVillages).catch(() => toast.error('Unable to load villages.')).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingSpinner />;
  return <div className="space-y-6"><PageHeader title="Village Directory" subtitle="Villages served by your PHC." /><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{villages.map((village) => <div key={village.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2"><div className="flex items-center justify-between"><h3 className="font-bold text-slate-900 text-base">{village.name}</h3><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${village.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{village.isActive ? 'ACTIVE' : 'INACTIVE'}</span></div><p className="text-xs text-slate-500">Population: {village.population?.toLocaleString() ?? 'Not recorded'}</p></div>)}</div></div>;
};
