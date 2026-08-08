import React, { useEffect, useState } from 'react';
import { referralService } from '../../services/referral.service';
import { Referral } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const DoctorReferrals: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await referralService.getAll();
      setReferrals(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="PHC Referral Management" subtitle="Track patient referral statuses sent to Primary Health Centers." />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="p-4">REF ID</th>
                <th className="p-4">PATIENT</th>
                <th className="p-4">DESTINATION PHC</th>
                <th className="p-4">PRIORITY</th>
                <th className="p-4">REASON</th>
                <th className="p-4">CREATED AT</th>
                <th className="p-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {referrals.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-slate-900">{r.id}</td>
                  <td className="p-4 font-bold text-slate-800">{r.patientName}</td>
                  <td className="p-4 font-medium text-slate-700">{r.destinationPHC}</td>
                  <td className="p-4 font-bold">
                    <span className={`px-2 py-0.5 rounded ${r.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.priority}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 max-w-xs truncate">{r.reason}</td>
                  <td className="p-4 text-slate-400">{r.createdAt}</td>
                  <td className="p-4"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};