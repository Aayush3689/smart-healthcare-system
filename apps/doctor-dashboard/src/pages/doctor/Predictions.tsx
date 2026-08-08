import React, { useEffect, useState } from 'react';
import { predictionService } from '../../services/prediction.service';
import { Prediction } from '../../types';
import { RiskBadge } from '../../components/common/RiskBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Brain, Sparkles } from 'lucide-react';

export const DoctorPredictions: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await predictionService.getAll();
      setPredictions(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Disease Risk Analytics"
        subtitle="Machine learning probabilistic predictions across target NCD disease models."
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Total Model Runs</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">428</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">High Risk Flagged</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">86</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Moderate Risk</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">142</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Low Risk</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">200</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#1976D2]" />
            <h3 className="font-bold text-slate-900 text-sm">Patient Multi-Disease Prediction Matrix</h3>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Decision Support Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="p-4">PATIENT</th>
                <th className="p-4">VILLAGE</th>
                <th className="p-4">DIABETES</th>
                <th className="p-4">HYPERTENSION</th>
                <th className="p-4">HEART DISEASE</th>
                <th className="p-4">ANEMIA</th>
                <th className="p-4">CKD</th>
                <th className="p-4">OVERALL RISK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {predictions.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{p.patientName}</td>
                  <td className="p-4 text-slate-500">{p.village}</td>
                  <td className="p-4 font-bold text-rose-600">{p.diabetesRisk}%</td>
                  <td className="p-4 font-bold text-rose-600">{p.hypertensionRisk}%</td>
                  <td className="p-4 font-bold text-amber-600">{p.heartDiseaseRisk}%</td>
                  <td className="p-4 text-slate-600">{p.anemiaRisk}%</td>
                  <td className="p-4 text-slate-600">{p.ckdRisk}%</td>
                  <td className="p-4"><RiskBadge risk={p.overallRisk} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};