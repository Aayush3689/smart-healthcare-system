import { authorizedRequest } from '@/lib/auth';

type QueryValue = string | number | boolean | undefined;
type Query = Record<string, QueryValue>;
type ApiRecord = Record<string, unknown>;

const id = (value: string) => encodeURIComponent(value);

const withQuery = (path: string, query?: Query) => {
  if (!query) return path;
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `${path}?${value}` : path;
};

const request = async <T>(path: string, method: 'GET' | 'POST' | 'PATCH' = 'GET', body?: ApiRecord | FormData) => {
  const response = await authorizedRequest<T>(path, method, body);
  return response.data;
};

/**
 * Authenticated ASHA-worker API. Every endpoint derives the worker from the
 * access token; callers must never supply an ASHA worker ID.
 */
export const ashaApi = {
  // Profile, dashboard, and village assignment
  profile: () => request<ApiRecord>('/api/v1/asha/me'),
  updateProfile: (fullName: string) => request<ApiRecord>('/api/v1/asha/me', 'PATCH', { fullName }),
  dashboard: () => request<ApiRecord>('/api/v1/asha/me/dashboard'),
  statistics: (query?: Query) => request<ApiRecord>(withQuery('/api/v1/asha/me/statistics', query)),
  village: () => request<ApiRecord>('/api/v1/asha/me/village'),

  // Patients and their ASHA-scoped clinical records
  patients: (query?: Query) => request<ApiRecord>(withQuery('/api/v1/asha/me/patients', query)),
  createPatient: (patient: ApiRecord) => request<ApiRecord>('/api/v1/asha/me/patients', 'POST', patient),
  patient: (patientId: string) => request<ApiRecord>(`/api/v1/asha/me/patients/${id(patientId)}`),
  updatePatient: (patientId: string, patient: ApiRecord) => request<ApiRecord>(`/api/v1/asha/me/patients/${id(patientId)}`, 'PATCH', patient),
  patientAssessments: (patientId: string) => request<ApiRecord>(`/api/v1/asha/me/patients/${id(patientId)}/assessments`),
  patientPredictions: (patientId: string, query?: Query) => request<ApiRecord>(withQuery(`/api/v1/asha/me/patients/${id(patientId)}/predictions`, query)),
  patientReferrals: (patientId: string, query?: Query) => request<ApiRecord>(withQuery(`/api/v1/asha/me/patients/${id(patientId)}/referrals`, query)),
  patientAppointments: (patientId: string, query?: Query) => request<ApiRecord>(withQuery(`/api/v1/asha/me/patients/${id(patientId)}/appointments`, query)),
  patientFollowUps: (patientId: string, query?: Query) => request<ApiRecord>(withQuery(`/api/v1/asha/me/patients/${id(patientId)}/follow-ups`, query)),
  patientDocuments: (patientId: string) => request<ApiRecord>(`/api/v1/asha/me/patients/${id(patientId)}/documents`),
  uploadPatientDocument: (patientId: string, formData: FormData) => request<ApiRecord>(`/api/v1/asha/me/patients/${id(patientId)}/documents`, 'POST', formData),

  // Assessments and explainable predictions
  assessments: (query?: Query) => request<ApiRecord>(withQuery('/api/v1/asha/me/assessments', query)),
  createAssessment: (assessment: ApiRecord) => request<ApiRecord>('/api/v1/asha/me/assessments', 'POST', assessment),
  assessment: (assessmentId: string) => request<ApiRecord>(`/api/v1/asha/me/assessments/${id(assessmentId)}`),
  updateAssessment: (assessmentId: string, assessment: ApiRecord) => request<ApiRecord>(`/api/v1/asha/me/assessments/${id(assessmentId)}`, 'PATCH', assessment),
  completeAssessment: (assessmentId: string) => request<ApiRecord>(`/api/v1/asha/me/assessments/${id(assessmentId)}/complete`, 'POST', {}),
  assessmentPredictions: (assessmentId: string) => request<ApiRecord>(`/api/v1/asha/me/assessments/${id(assessmentId)}/predictions`),
  assessmentDocuments: (assessmentId: string) => request<ApiRecord>(`/api/v1/assessments/${id(assessmentId)}/documents`),

  // Referral, appointment, and follow-up coordination
  referrals: (query?: Query) => request<ApiRecord>(withQuery('/api/v1/asha/me/referrals', query)),
  createReferral: (referral: ApiRecord) => request<ApiRecord>('/api/v1/asha/me/referrals', 'POST', referral),
  referral: (referralId: string) => request<ApiRecord>(`/api/v1/asha/me/referrals/${id(referralId)}`),
  cancelReferral: (referralId: string, reason: string) => request<ApiRecord>(`/api/v1/referrals/${id(referralId)}/cancel`, 'PATCH', { reason }),
  appointments: (query?: Query) => request<ApiRecord>(withQuery('/api/v1/asha/me/appointments', query)),
  appointment: (appointmentId: string) => request<ApiRecord>(`/api/v1/appointments/${id(appointmentId)}`),
  appointmentHistory: (appointmentId: string) => request<ApiRecord>(`/api/v1/appointments/${id(appointmentId)}/history`),
  cancelAppointment: (appointmentId: string, reason: string) => request<ApiRecord>(`/api/v1/appointments/${id(appointmentId)}/cancel`, 'PATCH', { reason }),
  followUps: (query?: Query) => request<ApiRecord>(withQuery('/api/v1/asha/me/follow-ups', query)),
  followUp: (followUpId: string) => request<ApiRecord>(`/api/v1/follow-ups/${id(followUpId)}`),
  followUpHistory: (followUpId: string) => request<ApiRecord>(`/api/v1/follow-ups/${id(followUpId)}/history`),
  startFollowUp: (followUpId: string) => request<ApiRecord>(`/api/v1/asha/me/follow-ups/${id(followUpId)}/start`, 'PATCH', {}),
  completeFollowUp: (followUpId: string, details: ApiRecord) => request<ApiRecord>(`/api/v1/asha/me/follow-ups/${id(followUpId)}/complete`, 'POST', details),
  missFollowUp: (followUpId: string, details: ApiRecord) => request<ApiRecord>(`/api/v1/asha/me/follow-ups/${id(followUpId)}/missed`, 'PATCH', details),

  // Notifications, documents, OCR, and voice entry
  notifications: () => request<ApiRecord>('/api/v1/asha/me/notifications'),
  markNotificationRead: (notificationId: string) => request<ApiRecord>(`/api/v1/asha/me/notifications/${id(notificationId)}/read`, 'PATCH', {}),
  markAllNotificationsRead: () => request<ApiRecord>('/api/v1/asha/me/notifications/read-all', 'POST', {}),
  startOcr: (documentId: string) => request<ApiRecord>(`/api/v1/asha/me/documents/${id(documentId)}/ocr`, 'POST', {}),
  ocrStatus: (documentId: string) => request<ApiRecord>(`/api/v1/asha/me/documents/${id(documentId)}/ocr`),
  extraction: (documentId: string) => request<ApiRecord>(`/api/v1/asha/me/documents/${id(documentId)}/extraction`),
  correctExtraction: (documentId: string, extractedData: ApiRecord) => request<ApiRecord>(`/api/v1/asha/me/documents/${id(documentId)}/extraction`, 'PATCH', { extractedData }),
  transcribeSpeech: (formData: FormData) => request<ApiRecord>('/api/v1/asha/me/speech/transcribe', 'POST', formData),
};
