import { 
  VillageData, 
  AshaWorkerData, 
  AdminUser, 
  DiseaseTrend, 
  Doctor, 
  Hospital, 
  Patient 
} from '../types/admin';

// --- Existing Mock Data ---

export const mockVillages: VillageData[] = [
  { id: 'v1', name: 'Village A (Rampur)', population: 520, patients: 480, assessments: 120, highRiskCount: 34, referrals: 8, ashaWorkers: 5, status: 'Attention Required' },
  { id: 'v2', name: 'Village B (Sonpur)', population: 410, patients: 380, assessments: 95, highRiskCount: 21, referrals: 5, ashaWorkers: 4, status: 'Normal' },
  { id: 'v3', name: 'Village C (Kalyanpur)', population: 680, patients: 590, assessments: 140, highRiskCount: 13, referrals: 4, ashaWorkers: 6, status: 'Normal' },
  { id: 'v4', name: 'Village D (Chandpur)', population: 310, patients: 290, assessments: 60, highRiskCount: 8, referrals: 3, ashaWorkers: 3, status: 'Normal' },
  { id: 'v5', name: 'Village E (Balarampur)', population: 450, patients: 410, assessments: 110, highRiskCount: 18, referrals: 6, ashaWorkers: 4, status: 'Attention Required' }
];

export const mockAshaWorkers: AshaWorkerData[] = [
  { id: 'w1', name: 'Sunita Devi', village: 'Village A', assessments: 42, highRiskIdentified: 8, referrals: 5, lastActive: 'Today', status: 'Active' },
  { id: 'w2', name: 'Rina Das', village: 'Village B', assessments: 38, highRiskIdentified: 5, referrals: 3, lastActive: 'Today', status: 'Active' },
  { id: 'w3', name: 'Pooja Singh', village: 'Village C', assessments: 31, highRiskIdentified: 3, referrals: 2, lastActive: 'Yesterday', status: 'Active' },
  { id: 'w4', name: 'Meena Sharma', village: 'Village A', assessments: 29, highRiskIdentified: 6, referrals: 4, lastActive: 'Today', status: 'Active' },
  { id: 'w5', name: 'Anita Verma', village: 'Village D', assessments: 18, highRiskIdentified: 1, referrals: 1, lastActive: '3 days ago', status: 'Inactive' }
];

export const mockUsers: AdminUser[] = [
  { id: 'u1', name: 'Dr. Rajesh Khan', email: 'doctor@healthai.com', role: 'Doctor', village: 'PHC Central', status: 'Active', lastActive: 'Just now' },
  { id: 'u2', name: 'Sunita Devi', email: 'sunita@healthai.com', role: 'ASHA Worker', village: 'Village A', status: 'Active', lastActive: '10 mins ago' },
  { id: 'u3', name: 'Admin User', email: 'admin@healthai.com', role: 'Administrator', village: 'District HQ', status: 'Active', lastActive: 'Just now' },
  { id: 'u4', name: 'Dr. Anita Roy', email: 'anita.roy@healthai.com', role: 'Doctor', village: 'PHC West', status: 'Active', lastActive: '2 hours ago' }
];

export const mockDiseaseTrends: DiseaseTrend[] = [
  { month: 'Jan', diabetes: 24, hypertension: 32, heartDisease: 12, anemia: 18, ckd: 5 },
  { month: 'Feb', diabetes: 28, hypertension: 35, heartDisease: 14, anemia: 20, ckd: 6 },
  { month: 'Mar', diabetes: 35, hypertension: 42, heartDisease: 18, anemia: 22, ckd: 8 },
  { month: 'Apr', diabetes: 40, hypertension: 48, heartDisease: 22, anemia: 25, ckd: 10 },
  { month: 'May', diabetes: 45, hypertension: 55, heartDisease: 25, anemia: 28, ckd: 12 },
  { month: 'Jun', diabetes: 52, hypertension: 64, heartDisease: 30, anemia: 31, ckd: 15 }
];

// --- NEW Mock Data for Patients, Doctors & Hospitals ---

export const mockDoctors: Doctor[] = [
  { id: 'd1', name: 'Dr. Rajesh Khan', specialty: 'General Medicine', hospital: 'PHC Central', contact: '+91 9876543210', available: true },
  { id: 'd2', name: 'Dr. Anita Roy', specialty: 'Gynecology & Maternal Care', hospital: 'PHC West', contact: '+91 9876543211', available: true },
  { id: 'd3', name: 'Dr. Subhash Sen', specialty: 'Cardiology', hospital: 'District Referral Hospital', contact: '+91 9876543212', available: false }
];

export const mockHospitals: Hospital[] = [
  { id: 'h1', name: 'Central Sub-District PHC', location: 'Rampur Block A', bedsAvailable: 14, contact: '+91 3324567890' },
  { id: 'h2', name: 'West Block PHC Facility', location: 'Kalyanpur', bedsAvailable: 8, contact: '+91 3324567891' },
  { id: 'h3', name: 'District General Referral Hospital', location: 'District HQ Highway', bedsAvailable: 42, contact: '+91 3324567892' }
];

export const mockPatients: Patient[] = [
  { id: 'p1', name: 'Sujata Devi', age: 34, gender: 'Female', village: 'Village A (Rampur)', riskLevel: 'HIGH', condition: 'Severe Anemia / Preeclampsia', assignedDoctorId: 'd2', contact: '+91 9123456701' },
  { id: 'p2', name: 'Rahul Sharma', age: 45, gender: 'Male', village: 'Village E (Balarampur)', riskLevel: 'HIGH', condition: 'Critical Hypertension (>160/100)', assignedDoctorId: '', contact: '+91 9123456702' },
  { id: 'p3', name: 'Anita Kumar', age: 28, gender: 'Female', village: 'Village B (Sonpur)', riskLevel: 'LOW', condition: 'Routine ANC Checkup', assignedDoctorId: 'd1', contact: '+91 9123456703' },
  { id: 'p4', name: 'Bikram Das', age: 52, gender: 'Male', village: 'Village D (Chandpur)', riskLevel: 'LOW', condition: 'Mild Seasonal Fever', assignedDoctorId: '', contact: '+91 9123456704' },
  { id: 'p5', name: 'Meenakshi Paul', age: 61, gender: 'Female', village: 'Village C (Kalyanpur)', riskLevel: 'HIGH', condition: 'Diabetic Ketoacidosis Risk', assignedDoctorId: 'd1', contact: '+91 9123456705' }
];