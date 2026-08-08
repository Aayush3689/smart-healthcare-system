import { Referral } from '../types';

export const mockReferrals: Referral[] = [
  {
    id: 'REF-8801',
    patientId: 'P-10245',
    patientName: 'Rahul Kumar',
    patientAge: 60,
    patientVillage: 'Village A',
    reason: 'Hypertensive crisis screening & severe blood sugar elevation',
    priority: 'Urgent',
    destinationPHC: 'Central Sub-District PHC',
    referredByDoctorId: 'usr-1',
    referredByDoctorName: 'Dr. Tariq Khan',
    status: 'Pending',
    notes: 'Patient exhibits 180/110 BP and fasting glucose above 200.',
    createdAt: '2026-08-07 09:30 AM'
  },
  {
    id: 'REF-8802',
    patientId: 'P-10246',
    patientName: 'Asha Devi',
    patientAge: 52,
    patientVillage: 'Village B',
    reason: 'Uncontrolled Diabetes & High BP',
    priority: 'High',
    destinationPHC: 'East Community Health Center',
    referredByDoctorId: 'usr-1',
    referredByDoctorName: 'Dr. Tariq Khan',
    status: 'Accepted',
    notes: 'Needs medication adjustment and lab diagnostic baseline.',
    createdAt: '2026-08-06 02:15 PM'
  }
];