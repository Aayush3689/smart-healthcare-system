import { api } from './api';

interface Envelope<T> { data: T; }
export interface Appointment { id: string; patient: { id: string; fullName: string; village?: { name: string } }; referral: { id: string; priority: string }; doctor: { id: string; fullName: string }; scheduledAt: string; durationMinutes: number; status: string; reason: string; }
const unwrap = <T>(response: { data: Envelope<T> }) => response.data.data;

export const appointmentService = {
  listPhc: async (params?: Record<string, string>) => unwrap(await api.get<Envelope<{ appointments: Appointment[] }>>('/phc/me/appointments', { params })).appointments,
  listDoctor: async (params?: Record<string, string>) => unwrap(await api.get<Envelope<{ appointments: Appointment[] }>>('/doctors/me/appointments', { params })).appointments,
  create: async (input: { patientId: string; referralId: string; doctorId: string; scheduledAt: string; durationMinutes: number; reason: string; notes?: string }) => unwrap(await api.post('/appointments', input)),
  confirm: async (id: string) => unwrap(await api.patch(`/appointments/${id}/confirm`, {})),
  cancel: async (id: string, reason: string) => unwrap(await api.patch(`/appointments/${id}/cancel`, { reason })),
  reschedule: async (id: string, scheduledAt: string, reason: string) => unwrap(await api.patch(`/appointments/${id}/reschedule`, { scheduledAt, reason })),
  noShow: async (id: string) => unwrap(await api.patch(`/appointments/${id}/no-show`, {})),
  start: async (id: string) => unwrap(await api.patch(`/doctors/me/appointments/${id}/start`, {})),
  complete: async (id: string) => unwrap(await api.patch(`/doctors/me/appointments/${id}/complete`, {})),
};
