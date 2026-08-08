import { Prediction } from '../types';

export const mockPredictions: Prediction[] = [
  {
    id: 'pred-1',
    patientId: 'P-10245',
    patientName: 'Rahul Kumar',
    age: 60,
    village: 'Village A',
    date: '2026-08-07',
    diabetesRisk: 92,
    hypertensionRisk: 94,
    heartDiseaseRisk: 76,
    anemiaRisk: 18,
    ckdRisk: 42,
    overallRisk: 'HIGH'
  },
  {
    id: 'pred-2',
    patientId: 'P-10246',
    patientName: 'Asha Devi',
    age: 52,
    village: 'Village B',
    date: '2026-08-06',
    diabetesRisk: 95,
    hypertensionRisk: 88,
    heartDiseaseRisk: 62,
    anemiaRisk: 25,
    ckdRisk: 38,
    overallRisk: 'HIGH'
  }
];