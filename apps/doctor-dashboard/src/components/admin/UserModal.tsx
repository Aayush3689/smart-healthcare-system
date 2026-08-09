import React, { useState } from 'react';
import { X, UserCheck } from 'lucide-react';
import { adminService, PhcVillage } from '../../services/admin.service';
import { toast } from '../../utils/toast';

interface UserModalProps { isOpen: boolean; villages: PhcVillage[]; onClose: () => void; onSuccess: () => void; }

export const UserModal: React.FC<UserModalProps> = ({ isOpen, villages, onClose, onSuccess }) => {
  const [kind, setKind] = useState<'doctor' | 'asha'>('doctor');
  const [form, setForm] = useState({ fullName: '', email: '', specialization: '', villageId: '', employeeCode: '' });
  const [saving, setSaving] = useState(false);
  if (!isOpen) return null;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      if (kind === 'doctor') await adminService.createDoctor({ email: form.email, fullName: form.fullName, specialization: form.specialization });
      else await adminService.createAshaWorker({ email: form.email, fullName: form.fullName, villageId: form.villageId, employeeCode: form.employeeCode });
      toast.success(`${kind === 'doctor' ? 'Doctor' : 'ASHA worker'} invitation created.`); onSuccess(); onClose();
    } catch (error) { toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not create this account.'); } finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"><div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden"><div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between"><div className="flex items-center gap-2"><UserCheck className="w-5 h-5 text-[#1976D2]" /><h3 className="font-bold text-slate-900 text-sm">Add PHC Staff</h3></div><button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button></div><form onSubmit={submit} className="p-6 space-y-4 text-xs"><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setKind('doctor')} className={`p-2 rounded-lg border font-semibold ${kind === 'doctor' ? 'bg-blue-50 border-[#1976D2] text-[#1976D2]' : 'border-slate-200 text-slate-600'}`}>Doctor</button><button type="button" onClick={() => setKind('asha')} className={`p-2 rounded-lg border font-semibold ${kind === 'asha' ? 'bg-blue-50 border-[#1976D2] text-[#1976D2]' : 'border-slate-200 text-slate-600'}`}>ASHA Worker</button></div><Input label="Full name" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} /><Input label="Email address" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />{kind === 'doctor' ? <Input label="Specialization" value={form.specialization} onChange={(value) => setForm({ ...form, specialization: value })} /> : <><label className="block font-semibold text-slate-700">Assigned village<select required value={form.villageId} onChange={(event) => setForm({ ...form, villageId: event.target.value })} className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"><option value="">Select a village</option>{villages.map((village) => <option key={village.id} value={village.id}>{village.name}</option>)}</select></label><Input label="Employee code" value={form.employeeCode} onChange={(value) => setForm({ ...form, employeeCode: value })} /></>}<div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 font-medium text-slate-600">Cancel</button><button disabled={saving} className="px-4 py-2 bg-[#1976D2] text-white font-bold rounded-lg disabled:opacity-50">{saving ? 'Creating...' : 'Create invitation'}</button></div></form></div></div>;
};
const Input = ({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) => <label className="block font-semibold text-slate-700">{label}<input type={type} required value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#1976D2]" /></label>;
