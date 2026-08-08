import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patient.service';
import { Patient } from '../../types';
import { RiskBadge } from '../../components/common/RiskBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Search, Eye } from 'lucide-react';

export const DoctorPatients: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [villageFilter, setVillageFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await patientService.getAll();
      setPatients(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  const filteredPatients = patients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || p.overallRisk === riskFilter;
    const matchesVillage = villageFilter === 'ALL' || p.village === villageFilter;
    return matchesSearch && matchesRisk && matchesVillage;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Patients Register" subtitle="Manage and review all registered rural community patients." />

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-[#1976D2]"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk</option>
            <option value="MODERATE">Moderate Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <select
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
          >
            <option value="ALL">All Villages</option>
            <option value="Village A">Village A</option>
            <option value="Village B">Village B</option>
            <option value="Village C">Village C</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="p-4">PATIENT</th>
                <th className="p-4">AGE</th>
                <th className="p-4">VILLAGE</th>
                <th className="p-4">BLOOD PRESSURE</th>
                <th className="p-4">BLOOD SUGAR</th>
                <th className="p-4">RISK STATUS</th>
                <th className="p-4">LAST ASSESSMENT</th>
                <th className="p-4">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">
                    {patient.name}
                    <span className="block text-[10px] font-normal text-slate-400">{patient.id}</span>
                  </td>
                  <td className="p-4">{patient.age} yrs</td>
                  <td className="p-4">{patient.village}</td>
                  <td className="p-4 font-mono font-semibold">{patient.vitals.bloodPressureSys}/{patient.vitals.bloodPressureDia}</td>
                  <td className="p-4 font-mono font-semibold">{patient.vitals.bloodSugar} mg/dL</td>
                  <td className="p-4"><RiskBadge risk={patient.overallRisk} size="sm" /></td>
                  <td className="p-4 text-slate-500">{patient.lastAssessmentDate}</td>
                  <td className="p-4">
                    <button
                      onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                      className="px-3 py-1.5 bg-[#1976D2] text-white font-semibold rounded-lg hover:bg-[#0D47A1] transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Profile
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