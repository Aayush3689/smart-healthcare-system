import type {
  AppointmentStatus,
  Disease,
  FollowUpStatus,
  ReferralPriority,
  ReferralStatus,
  RiskLevel,
  UserStatus,
} from "@prisma/client";

export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedDashboardDto<T> {
  items: T[];
  pagination: PaginationDto;
}

export interface NamedEntityDto {
  id: string;
  fullName: string;
}

export interface VillageReferenceDto {
  id: string;
  name: string;
}

export interface PhcDashboardSummaryDto {
  totalPatients: number;
  totalAshaWorkers: number;
  totalDoctors: number;
  totalAssessments: number;
  highRiskPatients: number;
  pendingReferrals: number;
  appointmentsToday: number;
  followUpsDue: number;
  missedFollowUps: number;
}

export interface TrendPointDto {
  date: string;
  count: number;
}

export interface ReferralDashboardItemDto {
  id: string;
  patient: NamedEntityDto;
  village: VillageReferenceDto;
  priority: ReferralPriority;
  status: ReferralStatus;
  createdAt: Date;
}

export interface HighRiskPatientDashboardItemDto {
  patientId: string;
  patientName: string;
  village: VillageReferenceDto;
  disease: Disease;
  riskLevel: RiskLevel;
  probability: number;
  assessmentId: string;
  predictionId: string;
}

export interface AppointmentDashboardItemDto {
  id: string;
  patient: NamedEntityDto;
  doctor: NamedEntityDto;
  date: string;
  startTime: string;
  durationMinutes: number;
  status: AppointmentStatus;
}

export interface FollowUpDashboardItemDto {
  id: string;
  patient: NamedEntityDto;
  village: VillageReferenceDto;
  ashaWorker: NamedEntityDto;
  dueDate: string;
  status: FollowUpStatus;
}

export interface VillageDashboardItemDto {
  villageId: string;
  name: string;
  population: number | null;
  patients: number;
  assessments: number;
  highRiskPatients: number;
  pendingReferrals: number;
  appointmentsToday: number;
  followUpsDue: number;
  missedFollowUps: number;
  ashaWorkers: number;
}

export interface DoctorWorkloadDto {
  doctorId: string;
  fullName: string;
  specialization: string | null;
  status: UserStatus;
  todayAppointments: number;
  pendingReferrals: number;
  upcomingAppointments: number;
}

export interface AshaWorkerDashboardItemDto {
  ashaWorkerId: string;
  fullName: string;
  employeeCode: string;
  status: UserStatus;
  village: VillageReferenceDto;
  patientsRegistered: number;
  assessmentsCompleted: number;
  referralsCreated: number;
  followUpsCompleted: number;
}

export interface PhcDashboardDto {
  summary: PhcDashboardSummaryDto;
  recentReferrals: ReferralDashboardItemDto[];
  todayAppointments: AppointmentDashboardItemDto[];
  highRiskPatients: HighRiskPatientDashboardItemDto[];
  followUpsDue: FollowUpDashboardItemDto[];
}

export interface PhcDashboardTrendsDto {
  period: "7D" | "30D" | "90D";
  assessments: TrendPointDto[];
  highRiskPatients: TrendPointDto[];
  referrals: TrendPointDto[];
  completedAppointments: TrendPointDto[];
}
