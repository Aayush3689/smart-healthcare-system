import React, { useState } from 'react';
import { Patient, ReferralPriority } from '../../types';
import { referralService } from '../../services/referral.service';
import { toast } from '../../utils/toast';
import { X, Share2, Building2, AlertCircle } from 'lucide-react';

interface ReferralModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  patient,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [reason, setReason] = useState(
    `High risk identified for ${patient.diseaseRisks
      .filter((r) => r.riskLevel === 'HIGH')
      .map((r) => r.disease)
      .join(' & ')}. BP: ${patient.vitals.bloodPressureSys}/${patient.vitals.bloodPressureDia}, Sugar: ${patient.vitals.bloodSugar} mg/dL.`
  );
  const [priority, setPriority] = useState<ReferralPriority>('Urgent');
  const [destinationPHC, setDestinationPHC] = useState('Central Sub-District PHC');
  const [notes, setNotes] = useState('Patient requires urgent clinical workup and medication adjustment.');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await referralService.create({
        patientId: patient.id,
        patientName: patient.name,
        patientAge: patient.age,
        patientVillage: patient.village,
        reason,
        priority,
        destinationPHC,
        referredByDoctorId: 'usr-1',
        referredByDoctorName: 'Dr. Tariq Khan',
        notes
      });

      toast.success('Referral created successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to create referral.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-[#1976D2] rounded-lg">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Create PHC Referral</h3>
              <p className="text-xs text-slate-500">Patient: {patient.name} ({patient.id})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Health Center</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={destinationPHC}
                onChange={(e) => setDestinationPHC(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2]"
              >
                <option>Central Sub-District PHC</option>
                <option>East Community Health Center</option>
                <option>District Memorial Hospital</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Referral Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Urgent', 'High', 'Normal'] as ReferralPriority[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    priority === p
                      ? p === 'Urgent'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : p === 'High'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-[#1976D2] text-white border-[#1976D2]'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Reason</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Notes & Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Referral will be instantly dispatched to the target PHC queue.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#1976D2] hover:bg-[#0D47A1] text-white text-xs font-bold rounded-lg shadow-sm"
            >
              {submitting ? 'Creating...' : 'Create Referral'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};