import React, { useEffect, useState } from 'react';
import { assessmentService } from '../../services/assessment.service';
import { Assessment } from '../../types';
import { RiskBadge } from '../../components/common/RiskBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const DoctorAssessments: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await assessmentService.getAll();
      setAssessments(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="ASHA Worker Field Assessments" subtitle="Real-time clinical intake stream submitted from community health visits." />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="p-4">PATIENT</th>
                <th className="p-4">DATE</th>
                <th className="p-4">VILLAGE</th>
                <th className="p-4">ASHA WORKER</th>
                <th className="p-4">BP</th>
                <th className="p-4">SUGAR</th>
                <th className="p-4">BMI</th>
                <th className="p-4">AI RISK</th>
                <th className="p-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{a.patientName}</td>
                  <td className="p-4 text-slate-500">{a.date}</td>
                  <td className="p-4">{a.village}</td>
                  <td className="p-4">{a.ashaWorkerName}</td>
                  <td className="p-4 font-mono">{a.vitals.bloodPressureSys}/{a.vitals.bloodPressureDia}</td>
                  <td className="p-4 font-mono">{a.vitals.bloodSugar} mg/dL</td>
                  <td className="p-4 font-mono">{a.vitals.bmi}</td>
                  <td className="p-4"><RiskBadge risk={a.overallRisk} size="sm" /></td>
                  <td className="p-4"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};