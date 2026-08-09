import { api } from './api';
interface Envelope<T> { data: T; }
export interface PhcPatient { id: string; fullName: string; age: number; gender: string; village: { id: string; name: string }; registeredBy: { id: string; fullName: string }; }
export interface PatientSummary { patient: PhcPatient & { phone?: string; address?: string }; latestPredictions: Array<{ disease: string; riskLevel: string; probability: number }>; activeReferrals: Array<{ id: string; status: string; priority: string }>; upcomingAppointment: { id: string; scheduledAt: string; status: string } | null; pendingFollowUps: Array<{ id: string; scheduledFor: string; status: string }>; }
const unwrap = <T>(response: { data: Envelope<T> }) => response.data.data;
export const phcPatientService = { list: async (params?: Record<string, string>) => unwrap(await api.get<Envelope<{ items: PhcPatient[] }>>('/patients', { params })).items, summary: async (id: string) => unwrap(await api.get<Envelope<PatientSummary>>(`/patients/${id}/summary`)) };
