// --- Existing Interfaces ---

export interface VillageData {
  id: string;
  name: string;
  population: number;
  patients: number;
  assessments: number;
  highRiskCount: number;
  referrals: number;
  ashaWorkers: number;
  status: 'Normal' | 'Attention Required' | 'Critical';
}

export interface AshaWorkerData {
  id: string;
  name: string;
  village: string;
  assessments: number;
  highRiskIdentified: number;
  referrals: number;
  lastActive: string;
  status: 'Active' | 'Inactive';
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Doctor' | 'ASHA Worker' | 'Administrator';
  village?: string;
  status: 'Active' | 'Pending' | 'Inactive';
  lastActive: string;
}

export interface DiseaseTrend {
  month: string;
  diabetes: number;
  hypertension: number;
  heartDisease: number;
  anemia: number;
  ckd: number;
}

// --- NEW Interfaces for Appointments, Risk Categorization, and Admin Entities ---

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  contact: string;
  available: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  location: string;
  bedsAvailable: number;
  contact: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  village: string;
  riskLevel: 'HIGH' | 'LOW' | 'MODERATE';
  assignedDoctorId?: string;
  condition: string;
  contact?: string;
}