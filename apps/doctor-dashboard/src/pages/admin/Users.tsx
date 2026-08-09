import React, { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { UserModal } from '../../components/admin/UserModal';
import { adminService, PhcAshaWorker, PhcDoctor, PhcVillage } from '../../services/admin.service';
import { toast } from '../../utils/toast';

export const AdminUsers: React.FC = () => {
  const [doctors, setDoctors] = useState<PhcDoctor[]>([]); const [workers, setWorkers] = useState<PhcAshaWorker[]>([]); const [villages, setVillages] = useState<PhcVillage[]>([]); const [loading, setLoading] = useState(true); const [modal, setModal] = useState(false);
  const load = async () => { try { const [doctorItems, workerItems, villageItems] = await Promise.all([adminService.getDoctors(), adminService.getAshaWorkers(), adminService.getVillages()]); setDoctors(doctorItems); setWorkers(workerItems); setVillages(villageItems); } catch { toast.error('Unable to load PHC staff.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  if (loading) return <LoadingSpinner />;
  return <div className="space-y-6"><PageHeader title="PHC Staff Management" subtitle="Invite and view doctors and ASHA workers assigned to this PHC." action={<button onClick={() => setModal(true)} className="px-4 py-2 bg-[#1976D2] hover:bg-[#0D47A1] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm"><UserPlus className="w-4 h-4" /> Add staff</button>} /><StaffTable title="Doctors" headers={['NAME', 'EMAIL', 'SPECIALIZATION', 'STATUS']} rows={doctors.map((item) => [item.fullName, item.email, item.specialization || '—', item.status])} /><StaffTable title="ASHA Workers" headers={['NAME', 'EMPLOYEE CODE', 'VILLAGE', 'STATUS']} rows={workers.map((item) => [item.fullName, item.employeeCode, item.village.name, item.status])} /><UserModal isOpen={modal} villages={villages} onClose={() => setModal(false)} onSuccess={load} /></div>;
};
const StaffTable = ({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) => <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"><h2 className="p-4 text-sm font-bold text-slate-900 border-b border-slate-100">{title}</h2><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"> <tr>{headers.map((header) => <th key={header} className="p-4">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((value, cell) => <td key={cell} className="p-4 text-slate-700">{value}</td>)}</tr>) : <tr><td colSpan={headers.length} className="p-6 text-center text-slate-400">No staff found.</td></tr>}</tbody></table></div></section>;
