import { api } from './api';
interface Envelope<T> { data: T; }
export interface FollowUp { id: string; patient: { fullName: string }; ashaWorker: { fullName: string }; scheduledFor: string; priority: string; status: string; reason: string; }
const unwrap = <T>(response: { data: Envelope<T> }) => response.data.data;
export const followUpService = { listPhc: async (params?: Record<string, string>) => unwrap(await api.get<Envelope<{ items: FollowUp[] }>>('/phc/me/follow-ups', { params })).items, listDoctor: async (params?: Record<string, string>) => unwrap(await api.get<Envelope<{ items: FollowUp[] }>>('/doctors/me/follow-ups', { params })).items };
