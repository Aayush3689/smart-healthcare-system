import { api } from './api';

interface ApiEnvelope<T> { data: T; }

export interface PhcProfile { id: string; name: string; code: string; address: string; district: string; state: string; phone: string | null; status: string; }
export interface PhcVillage { id: string; name: string; population: number | null; isActive: boolean; }
export interface PhcDoctor { id: string; fullName: string; email: string; specialization: string | null; status: string; }
export interface PhcAshaWorker { id: string; fullName: string; employeeCode: string; status: string; village: { id: string; name: string }; createdAt: string; }
export interface PhcOverview { totalPatients: number; totalAshaWorkers: number; totalDoctors: number; activeDoctors: number; pendingReferrals: number; highRiskPatients: number; appointmentsToday: number; followUpsDue: number; missedFollowUps: number; }
export interface PhcDashboard { summary: PhcOverview; recentReferrals: Array<{ id: string; patient: { fullName: string }; priority: string; status: string }>; todayAppointments: Array<{ id: string; patient: { fullName: string }; doctor: { fullName: string }; startTime: string; status: string }>; highRiskPatients: Array<{ patientId: string; patientName: string; disease: string; riskLevel: string }>; followUpsDue: Array<{ id: string; patient: { fullName: string }; dueDate: string; status: string }>; }

const unwrap = <T>(response: { data: ApiEnvelope<T> }) => response.data.data;

export const adminService = {
  getProfile: async () => unwrap(await api.get<ApiEnvelope<PhcProfile>>('/phc/me')),
  updateProfile: async (profile: Partial<Pick<PhcProfile, 'name' | 'address' | 'district' | 'state' | 'phone'>>) => unwrap(await api.patch<ApiEnvelope<PhcProfile>>('/phc/me', profile)),
  getVillages: async () => unwrap(await api.get<ApiEnvelope<{ items: PhcVillage[] }>>('/phc/me/villages')).items,
  getOverview: async () => unwrap(await api.get<ApiEnvelope<PhcOverview>>('/phc/me/overview')),
  getStatistics: async (params?: { from?: string; to?: string; villageId?: string }) => unwrap(await api.get('/phc/me/statistics', { params })),
  getDiseaseStatistics: async (params?: { from?: string; to?: string; villageId?: string }) => unwrap(await api.get('/phc/me/disease-statistics', { params })),
  getVillageStatistics: async () => unwrap(await api.get('/phc/me/villages/statistics')),
  getOperations: async () => unwrap(await api.get('/phc/me/operations')),
  getAshaWorkers: async () => unwrap(await api.get<ApiEnvelope<{ items: PhcAshaWorker[] }>>('/phc/me/asha-workers')).items,
  getDoctors: async () => unwrap(await api.get<ApiEnvelope<{ items: PhcDoctor[] }>>('/phc/me/doctors')).items,
  createDoctor: async (input: { email: string; fullName: string; specialization: string }) => unwrap(await api.post<ApiEnvelope<PhcDoctor>>('/phc/me/doctors', input)),
  createAshaWorker: async (input: { email: string; fullName: string; villageId: string; employeeCode: string }) => unwrap(await api.post('/auth/accounts', { ...input, role: 'ASHA_WORKER' })),
  deactivateDoctor: async (doctorId: string) => unwrap(await api.patch(`/phc/me/doctors/${doctorId}/deactivate`, {})),
  activateDoctor: async (doctorId: string) => unwrap(await api.patch(`/phc/me/doctors/${doctorId}/activate`, {})),
  getDashboard: async () => unwrap(await api.get<ApiEnvelope<PhcDashboard>>('/phc-dashboard')),
  getDashboardReferrals: async (params?: Record<string, string | number>) => unwrap(await api.get('/phc-dashboard/referrals', { params })),
  getHighRiskPatients: async (params?: Record<string, string | number>) => unwrap(await api.get('/phc-dashboard/high-risk-patients', { params })),
  getDashboardAppointments: async (params?: Record<string, string | number>) => unwrap(await api.get('/phc-dashboard/appointments', { params })),
  getDashboardFollowUps: async (params?: Record<string, string | number>) => unwrap(await api.get('/phc-dashboard/follow-ups', { params })),
  getDashboardVillages: async (params?: Record<string, string | number>) => unwrap(await api.get('/phc-dashboard/villages', { params })),
  getDashboardDoctors: async (params?: Record<string, string | number>) => unwrap(await api.get('/phc-dashboard/doctors', { params })),
  getDashboardAshaWorkers: async (params?: Record<string, string | number>) => unwrap(await api.get('/phc-dashboard/asha-workers', { params })),
  getDashboardTrends: async (period: '7D' | '30D' | '90D' = '30D') => unwrap(await api.get('/phc-dashboard/trends', { params: { period } })),
};
