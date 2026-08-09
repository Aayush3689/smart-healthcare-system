import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, ClipboardList, HeartPulse, Users } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminService, PhcDashboard } from '../../services/admin.service';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { toast } from '../../utils/toast';

export const AdminDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<PhcDashboard | null>(null);
  const [trends, setTrends] = useState<Array<{ date: string; assessments: number; highRisk: number; referrals: number }>>([]);
  useEffect(() => { Promise.all([adminService.getDashboard(), adminService.getDashboardTrends('30D')]).then(([overview, trendData]) => { setDashboard(overview); const trend = trendData as { assessments: Array<{ date: string; count: number }>; highRiskPatients: Array<{ count: number }>; referrals: Array<{ count: number }> }; setTrends(trend.assessments.map((item, index) => ({ date: item.date.slice(5), assessments: item.count, highRisk: trend.highRiskPatients[index]?.count || 0, referrals: trend.referrals[index]?.count || 0 }))); }).catch(() => toast.error('Unable to load PHC dashboard.')); }, []);
  if (!dashboard) return <LoadingSpinner />;
  const { summary } = dashboard;
  return <div className="space-y-6">
    <PageHeader title="PHC Dashboard" subtitle="Live operational view for your Primary Health Centre." />
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard title="Total Patients" value={summary.totalPatients.toLocaleString()} icon={Users} />
      <StatCard title="High-risk Patients" value={summary.highRiskPatients.toLocaleString()} icon={AlertTriangle} badgeColor="bg-rose-50 text-rose-600" />
      <StatCard title="Pending Referrals" value={summary.pendingReferrals.toLocaleString()} icon={ClipboardList} badgeColor="bg-amber-50 text-amber-600" />
      <StatCard title="Appointments Today" value={summary.appointmentsToday.toLocaleString()} icon={CalendarDays} badgeColor="bg-emerald-50 text-emerald-600" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:col-span-2"><h2 className="font-bold text-slate-900 text-sm">30-day clinical activity</h2><p className="text-xs text-slate-500 mb-4">Assessments, high-risk detections, and referrals</p><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={trends}><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="assessments" stroke="#1976D2" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="highRisk" stroke="#e11d48" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="referrals" stroke="#f59e0b" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></section>
      <Panel title="High-risk patients" empty="No high-risk patients currently listed.">{dashboard.highRiskPatients.map((item) => <div key={item.patientId} className="flex justify-between py-3 border-b border-slate-100 last:border-0 text-xs"><div><p className="font-bold text-slate-900">{item.patientName}</p><p className="text-slate-500">{item.disease}</p></div><span className="text-rose-600 font-bold">{item.riskLevel}</span></div>)}</Panel>
      <Panel title="Today's appointments" empty="No appointments scheduled today.">{dashboard.todayAppointments.map((item) => <div key={item.id} className="flex justify-between py-3 border-b border-slate-100 last:border-0 text-xs"><div><p className="font-bold text-slate-900">{item.patient.fullName}</p><p className="text-slate-500">Dr. {item.doctor.fullName} · {item.startTime}</p></div><span className="text-slate-500">{item.status}</span></div>)}</Panel>
      <Panel title="Recent referrals" empty="No referrals found.">{dashboard.recentReferrals.map((item) => <div key={item.id} className="flex justify-between py-3 border-b border-slate-100 last:border-0 text-xs"><p className="font-bold text-slate-900">{item.patient.fullName}</p><span className="text-amber-700 font-semibold">{item.priority} · {item.status}</span></div>)}</Panel>
      <Panel title="Follow-ups due" empty="No follow-ups due.">{dashboard.followUpsDue.map((item) => <div key={item.id} className="flex justify-between py-3 border-b border-slate-100 last:border-0 text-xs"><p className="font-bold text-slate-900">{item.patient.fullName}</p><span className="text-slate-500">{new Date(item.dueDate).toLocaleDateString()}</span></div>)}</Panel>
    </div>
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs text-slate-600 flex gap-3"><HeartPulse className="w-5 h-5 text-[#1976D2] shrink-0" /><p>{summary.totalDoctors} doctors and {summary.totalAshaWorkers} ASHA workers support this PHC. {summary.followUpsDue} follow-ups are due, including {summary.missedFollowUps} missed follow-ups.</p></div>
  </div>;
};
const Panel = ({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) => <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"><h2 className="font-bold text-slate-900 text-sm mb-2">{title}</h2>{children.length ? children : <p className="py-5 text-xs text-slate-400">{empty}</p>}</section>;
export default AdminDashboard;
