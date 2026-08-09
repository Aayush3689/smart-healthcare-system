import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { toast } from '../../utils/toast';

type RiskStats = { predictions: { highRisk: number; mediumRisk: number; lowRisk: number } };
type RiskPatient = { patientId: string; patientName: string; village: { name: string }; disease: string; riskLevel: string; probability: number };
export const AdminAnalytics: React.FC = () => {
  const [stats, setStats] = useState<RiskStats | null>(null); const [highRisk, setHighRisk] = useState<RiskPatient[]>([]);
  useEffect(() => { Promise.all([adminService.getStatistics(), adminService.getHighRiskPatients({ limit: 50 })]).then(([statistics, result]) => { setStats(statistics as RiskStats); setHighRisk(((result as { items?: RiskPatient[] }).items || [])); }).catch(() => toast.error('Unable to load risk analytics.')); }, []);
  if (!stats) return <LoadingSpinner />;
  return <div className="space-y-6"><PageHeader title="Patient Risk Centre" subtitle="Risk is based on stored clinical predictions; high-risk cases include patient and ASHA referral context." /><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><RiskCard title="High-risk patients" count={stats.predictions.highRisk} icon={AlertTriangle} tone="rose" /><RiskCard title="Medium-risk patients" count={stats.predictions.mediumRisk} icon={ShieldAlert} tone="amber" /><RiskCard title="Low-risk patients" count={stats.predictions.lowRisk} icon={ShieldCheck} tone="emerald" /></div><section className="bg-white border border-slate-200 rounded-2xl overflow-hidden"><div className="p-5 border-b"><h2 className="font-bold text-slate-900">High-risk patient queue</h2><p className="text-xs text-slate-500 mt-1">Open referrals and appointments from the dashboard provide the PHC workflow context.</p></div><div className="overflow-x-auto"><table className="w-full text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-4 text-left">PATIENT</th><th className="p-4 text-left">VILLAGE</th><th className="p-4 text-left">CONDITION</th><th className="p-4 text-left">RISK</th></tr></thead><tbody>{highRisk.map((patient) => <tr key={patient.patientId} className="border-t"><td className="p-4 font-bold">{patient.patientName}</td><td className="p-4">{patient.village.name}</td><td className="p-4">{patient.disease}</td><td className="p-4 text-rose-600 font-bold">{patient.riskLevel} · {(patient.probability * 100).toFixed(0)}%</td></tr>)}</tbody></table></div></section></div>;
};
const RiskCard = ({ title, count, icon: Icon, tone }: { title: string; count: number; icon: typeof AlertTriangle; tone: 'rose' | 'amber' | 'emerald' }) => <div className={`p-5 bg-${tone}-50 border border-${tone}-100 rounded-2xl`}><Icon className={`w-5 h-5 text-${tone}-600`} /><p className="mt-4 text-xs font-semibold text-slate-600">{title}</p><p className="text-2xl font-extrabold text-slate-900">{count}</p></div>;
