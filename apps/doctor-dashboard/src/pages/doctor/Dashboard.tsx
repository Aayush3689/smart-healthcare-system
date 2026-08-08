import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patient.service';
import { referralService } from '../../services/referral.service';
import { Patient, Referral } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { RiskBadge } from '../../components/common/RiskBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Users,
  AlertTriangle,
  Flame,
  Share2,
  ChevronRight,
  Eye,
  Activity,
  Stethoscope,
  ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pData, rData] = await Promise.all([
          patientService.getAll(),
          referralService.getAll()
        ]);
        setPatients(pData);
        setReferrals(rData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <LoadingSpinner />;

  const highRiskPatients = patients.filter((p) => p.overallRisk === 'HIGH');

  const diseaseDistributionData = [
    { name: 'Diabetes', count: 18, color: '#EF4444' },
    { name: 'Hypertension', count: 24, color: '#F59E0B' },
    { name: 'Heart Risk', count: 12, color: '#0284C7' },
    { name: 'Anemia', count: 8, color: '#10B981' },
    { name: 'CKD', count: 6, color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-2 sm:p-4">
      {/* Page Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-sky-600 rounded-xl text-white shadow-sm">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <PageHeader
              title="Good morning, Dr. Khan 👋"
              subtitle="Here's today's patient risk overview across assigned rural primary centers."
            />
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>PHC System Live Sync</span>
        </div>
      </div>

      {/* Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={patients.length * 25 + 3}
          icon={Users}
          trend="+12 this week"
          trendDirection="up"
          subtitle="Registered across 5 villages"
        />
        <StatCard
          title="High Risk Patients"
          value={highRiskPatients.length + 14}
          icon={AlertTriangle}
          trend="+3 new today"
          trendDirection="up"
          badgeColor="bg-red-50 text-red-600 border border-red-100"
        />
        <StatCard
          title="Urgent Cases"
          value={7}
          icon={Flame}
          trend="Immediate review"
          trendDirection="down"
          badgeColor="bg-amber-50 text-amber-600 border border-amber-100"
        />
        <StatCard
          title="Active Referrals"
          value={referrals.length + 9}
          icon={Share2}
          trend="12 pending PHC review"
          badgeColor="bg-sky-50 text-sky-700 border border-sky-100"
        />
      </div>

      {/* Analytics & Referrals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart View */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Disease Risk Distribution</h3>
              <p className="text-xs text-slate-500">AI Flagged High & Moderate Risk Case Volumes</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
              <Activity className="w-5 h-5 text-sky-600" />
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diseaseDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #E2E8F0', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px' 
                  }} 
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                  {diseaseDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Referrals Queue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Referrals</h3>
              <p className="text-xs text-slate-500">From ASHA Workers</p>
            </div>
            <button
              onClick={() => navigate('/doctor/referrals')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center"
            >
              View all <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[260px]">
            {referrals.slice(0, 4).map((ref) => (
              <div key={ref.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-sky-200 transition-colors flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{ref.patientName}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{ref.destinationPHC}</p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{ref.createdAt}</span>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    ref.priority === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {ref.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High-Risk Patient Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">High Risk Patients Requiring Attention</h3>
            <p className="text-xs text-slate-500">Patients prioritized by AI risk score thresholds</p>
          </div>
          <button
            onClick={() => navigate('/doctor/patients')}
            className="px-3.5 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold rounded-lg hover:bg-sky-100 transition-colors flex items-center space-x-1"
          >
            <span>All Patients</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Patient</th>
                <th className="p-4">Age</th>
                <th className="p-4">Village</th>
                <th className="p-4">Blood Pressure</th>
                <th className="p-4">Blood Sugar</th>
                <th className="p-4">Risk Level</th>
                <th className="p-4">AI Prediction</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {highRiskPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-sky-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">
                    {patient.name}
                    <span className="block text-[10px] font-mono font-normal text-slate-400 mt-0.5">{patient.id}</span>
                  </td>
                  <td className="p-4 font-medium">{patient.age} yrs</td>
                  <td className="p-4 text-slate-600 font-medium">{patient.village}</td>
                  <td className="p-4 font-mono font-bold text-red-600">
                    {patient.vitals.bloodPressureSys}/{patient.vitals.bloodPressureDia} <span className="text-[10px] font-normal text-slate-400">mmHg</span>
                  </td>
                  <td className="p-4 font-mono font-bold text-red-600">
                    {patient.vitals.bloodSugar} <span className="text-[10px] font-normal text-slate-400">mg/dL</span>
                  </td>
                  <td className="p-4">
                    <RiskBadge risk={patient.overallRisk} size="sm" />
                  </td>
                  <td className="p-4 font-medium text-slate-800">
                    <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100 font-semibold">
                      {patient.diseaseRisks
                        .filter((r) => r.riskLevel === 'HIGH')
                        .map((r) => r.disease)
                        .join(' + ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                      className="px-3 py-1.5 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Patient
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};