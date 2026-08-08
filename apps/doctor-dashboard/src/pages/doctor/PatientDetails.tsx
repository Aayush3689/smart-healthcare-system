import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patient.service';
import { Patient } from '../../types';
import { RiskBadge } from '../../components/common/RiskBadge';
import { ReferralModal } from '../../components/doctor/ReferralModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { toast } from '../../utils/toast';
import {
  ArrowLeft,
  Brain,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Scale,
  ShieldAlert,
  Share2
} from 'lucide-react';

export const PatientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReferralOpen, setIsReferralOpen] = useState(false);

  useEffect(() => {
    async function loadPatient() {
      if (!id) return;
      try {
        const data = await patientService.getById(id);
        if (data) {
          setPatient(data);
        } else {
          toast.error('Patient not found.');
          navigate('/doctor/patients');
        }
      } finally {
        setLoading(false);
      }
    }
    loadPatient();
  }, [id, navigate]);

  if (loading) return <LoadingSpinner />;
  if (!patient) return null;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/doctor/patients')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#1976D2] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Patients
      </button>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900">{patient.name}</h1>
            <RiskBadge risk={patient.overallRisk} size="lg" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
            <span>Patient ID: <strong>{patient.id}</strong></span>
            <span>•</span>
            <span>Age: <strong>{patient.age} yrs</strong></span>
            <span>•</span>
            <span>Gender: <strong>{patient.gender}</strong></span>
            <span>•</span>
            <span>Village: <strong>{patient.village}</strong></span>
            <span>•</span>
            <span>ASHA Worker: <strong>{patient.ashaWorkerName}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsReferralOpen(true)}
            className="px-4 py-2.5 bg-[#1976D2] hover:bg-[#0D47A1] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Create PHC Referral
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Vitals & Anthropometrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="p-3.5 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Blood Pressure</span>
            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold text-rose-600">
                {patient.vitals.bloodPressureSys}/{patient.vitals.bloodPressureDia}
              </span>
              <Activity className="w-4 h-4 text-rose-500" />
            </div>
            <span className="text-[10px] text-slate-400">mmHg</span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Blood Sugar</span>
            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold text-rose-600">{patient.vitals.bloodSugar}</span>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <span className="text-[10px] text-slate-400">mg/dL</span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">BMI</span>
            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold text-slate-900">{patient.vitals.bmi}</span>
              <Scale className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-[10px] text-amber-600 font-semibold">Overweight</span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Weight</span>
            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold text-slate-900">{patient.vitals.weight}</span>
            </div>
            <span className="text-[10px] text-slate-400">kg</span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Temperature</span>
            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold text-slate-900">{patient.vitals.temperature}°F</span>
              <Thermometer className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">Normal</span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">SpO2</span>
            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold text-slate-900">{patient.vitals.spo2}%</span>
              <Wind className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">Healthy</span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Smoking / History</span>
            <span className="text-xs font-bold text-slate-800 block">Smoking: {patient.smokingStatus}</span>
            <span className="text-[10px] text-slate-500">
              Diabetes History: {patient.familyHistoryDiabetes ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-[#1976D2]" />
          <h2 className="text-base font-bold text-slate-900">AI Risk Assessment (Decision Support)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {patient.diseaseRisks.slice(0, 3).map((risk) => (
            <div key={risk.disease} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-900">{risk.disease}</span>
                <RiskBadge risk={risk.riskLevel} size="sm" />
              </div>
              <div className="flex items-baseline gap-2 my-1">
                <span className="text-2xl font-black text-slate-900">{risk.riskScore}%</span>
                <span className="text-xs text-slate-500">calculated probability</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full ${
                    risk.riskLevel === 'HIGH' ? 'bg-rose-600' : risk.riskLevel === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${risk.riskScore}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Why was this patient flagged?</h2>
            <p className="text-xs text-slate-500">Explainable AI factor contribution weights</p>
          </div>
          <span className="px-2.5 py-1 bg-blue-50 text-[#1976D2] text-xs font-semibold rounded-lg">
            XAI Model v2.4
          </span>
        </div>

        <div className="space-y-4">
          {patient.explainableFactors.map((f) => (
            <div key={f.factor} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">{f.factor} — <span className="text-slate-500 font-normal">{f.description}</span></span>
                <span className="text-slate-600 font-bold">{f.importance}% Impact</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#1976D2] h-full rounded-full transition-all duration-500"
                  style={{ width: `${f.importance}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
          <span>AI-generated risk factors support clinical review and do not substitute diagnostic exams.</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-900 to-[#1976D2] p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block mb-1">
            AI CLINICAL RECOMMENDATION
          </span>
          <p className="text-base font-semibold leading-relaxed">
            "{patient.aiRecommendation}"
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsReferralOpen(true)}
            className="px-5 py-2.5 bg-white text-[#1976D2] hover:bg-blue-50 text-xs font-bold rounded-xl shadow-md"
          >
            Create Referral
          </button>
        </div>
      </div>

      <ReferralModal
        patient={patient}
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
        onSuccess={() => toast.success('Patient state updated.')}
      />
    </div>
  );
};