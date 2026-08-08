export type Role = 'doctor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  village?: string;
  avatar?: string;
  specialization?: string;
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface Vitals {
  bloodPressureSys: number;
  bloodPressureDia: number;
  bloodSugar: number;
  temperature: number;
  spo2: number;
  weight: number;
  height: number;
  bmi: number;
}

export interface DiseaseRisk {
  disease: string;
  riskScore: number;
  riskLevel: RiskLevel;
}

export interface AIExplainableFactor {
  factor: string;
  importance: number;
  description: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  village: string;
  phone: string;
  ashaWorkerName: string;
  ashaWorkerId: string;
  smokingStatus: 'Yes' | 'No' | 'Former';
  familyHistoryDiabetes: boolean;
  familyHistoryHypertension: boolean;
  vitals: Vitals;
  overallRisk: RiskLevel;
  diseaseRisks: DiseaseRisk[];
  explainableFactors: AIExplainableFactor[];
  aiRecommendation: string;
  lastAssessmentDate: string;
}

export interface Assessment {
  id: string;
  patientId: string;
  patientName: string;
  village: string;
  date: string;
  ashaWorkerName: string;
  vitals: Vitals;
  overallRisk: RiskLevel;
  status: 'Reviewed' | 'Pending Review' | 'Referred';
}

export interface Prediction {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  village: string;
  date: string;
  diabetesRisk: number;
  hypertensionRisk: number;
  heartDiseaseRisk: number;
  anemiaRisk: number;
  ckdRisk: number;
  overallRisk: RiskLevel;
}

export type ReferralPriority = 'Urgent' | 'High' | 'Normal';
export type ReferralStatus = 'Pending' | 'Accepted' | 'Completed' | 'Rejected';

export interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientVillage: string;
  reason: string;
  priority: ReferralPriority;
  destinationPHC: string;
  referredByDoctorId: string;
  referredByDoctorName: string;
  status: ReferralStatus;
  notes: string;
  createdAt: string;
}

export interface Village {
  id: string;
  name: string;
  population: number;
  registeredPatients: number;
  assessmentsCount: number;
  highRiskCount: number;
  referralsCount: number;
  ashaWorkersCount: number;
  status: 'Optimal' | 'Attention Required' | 'High Risk Zone';
}

export interface ASHAWorker {
  id: string;
  name: string;
  village: string;
  phone: string;
  assessmentsCount: number;
  highRiskIdentified: number;
  referralsMade: number;
  lastActive: string;
  status: 'Active' | 'Inactive';
}

export interface DashboardStats {
  totalPatients: number;
  highRiskPatients: number;
  urgentCases: number;
  activeReferrals: number;
  assessmentsThisMonth: number;
  totalVillages: number;
  totalAshaWorkers: number;
}