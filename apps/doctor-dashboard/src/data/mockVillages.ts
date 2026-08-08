import { Village, ASHAWorker } from '../types';

export const mockVillages: Village[] = [
  {
    id: 'v-1',
    name: 'Village A',
    population: 520,
    registeredPatients: 480,
    assessmentsCount: 120,
    highRiskCount: 34,
    referralsCount: 8,
    ashaWorkersCount: 5,
    status: 'Attention Required'
  },
  {
    id: 'v-2',
    name: 'Village B',
    population: 410,
    registeredPatients: 380,
    assessmentsCount: 95,
    highRiskCount: 21,
    referralsCount: 6,
    ashaWorkersCount: 4,
    status: 'Attention Required'
  },
  {
    id: 'v-3',
    name: 'Village C',
    population: 310,
    registeredPatients: 290,
    assessmentsCount: 80,
    highRiskCount: 13,
    referralsCount: 4,
    ashaWorkersCount: 3,
    status: 'Optimal'
  }
];

export const mockAshaWorkers: ASHAWorker[] = [
  {
    id: 'asha-1',
    name: 'Sunita Devi',
    village: 'Village A',
    phone: '+91 91234 56789',
    assessmentsCount: 42,
    highRiskIdentified: 8,
    referralsMade: 5,
    lastActive: 'Today, 08:30 AM',
    status: 'Active'
  },
  {
    id: 'asha-2',
    name: 'Rina Das',
    village: 'Village B',
    phone: '+91 91234 56790',
    assessmentsCount: 38,
    highRiskIdentified: 5,
    referralsMade: 3,
    lastActive: 'Today, 09:10 AM',
    status: 'Active'
  }
];