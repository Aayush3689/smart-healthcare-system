import { Assessment } from '../types';

export const mockAssessments: Assessment[] = [
  {
    id: 'asm-101',
    patientId: 'P-10245',
    patientName: 'Rahul Kumar',
    village: 'Village A',
    date: '2026-08-07',
    ashaWorkerName: 'Sunita Devi',
    vitals: {
      bloodPressureSys: 180,
      bloodPressureDia: 110,
      bloodSugar: 205,
      temperature: 98.6,
      spo2: 96,
      weight: 89,
      height: 174,
      bmi: 29.4
    },
    overallRisk: 'HIGH',
    status: 'Pending Review'
  },
  {
    id: 'asm-102',
    patientId: 'P-10246',
    patientName: 'Asha Devi',
    village: 'Village B',
    date: '2026-08-06',
    ashaWorkerName: 'Rina Das',
    vitals: {
      bloodPressureSys: 165,
      bloodPressureDia: 100,
      bloodSugar: 220,
      temperature: 98.4,
      spo2: 97,
      weight: 78,
      height: 158,
      bmi: 31.2
    },
    overallRisk: 'HIGH',
    status: 'Referred'
  }
];