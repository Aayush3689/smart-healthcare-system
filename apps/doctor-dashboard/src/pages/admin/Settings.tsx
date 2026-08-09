import React, { useEffect, useState } from 'react';
import { Building2, Save } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { adminService, PhcProfile } from '../../services/admin.service';
import { toast } from '../../utils/toast';

export const AdminSettings: React.FC = () => {
  const [profile, setProfile] = useState<PhcProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { adminService.getProfile().then(setProfile).catch(() => toast.error('Unable to load PHC profile.')); }, []);
  if (!profile) return <LoadingSpinner />;

  const update = (field: keyof PhcProfile, value: string) => setProfile({ ...profile, [field]: value });
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const saved = await adminService.updateProfile({ name: profile.name, address: profile.address, district: profile.district, state: profile.state, phone: profile.phone || null });
      setProfile(saved); toast.success('PHC profile updated successfully.');
    } catch (error) { toast.error(message(error, 'Could not update the PHC profile.')); } finally { setSaving(false); }
  };

  return <div className="space-y-6 max-w-3xl">
    <PageHeader title="PHC Profile" subtitle="Manage your facility details and contact information." />
    <form onSubmit={save} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
      <div className="flex gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100"><Building2 className="w-5 h-5 text-[#1976D2]" /><div><p className="text-sm font-bold text-slate-900">{profile.code}</p><p className="text-xs text-slate-500">Status: {profile.status}</p></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="PHC name" value={profile.name} onChange={(value) => update('name', value)} />
        <Field label="Phone" value={profile.phone || ''} onChange={(value) => update('phone', value)} placeholder="+919876543210" />
        <Field label="Address" value={profile.address} onChange={(value) => update('address', value)} />
        <Field label="District" value={profile.district} onChange={(value) => update('district', value)} />
        <Field label="State" value={profile.state} onChange={(value) => update('state', value)} />
      </div>
      <button disabled={saving} className="px-4 py-2 bg-[#1976D2] text-white text-xs font-bold rounded-lg hover:bg-[#0D47A1] disabled:opacity-50 flex items-center gap-2"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save PHC Profile'}</button>
    </form>
  </div>;
};

const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) => <label className="block text-xs font-semibold text-slate-700">{label}<input required={label !== 'Phone'} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#1976D2]" /></label>;
const message = (error: unknown, fallback: string) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
