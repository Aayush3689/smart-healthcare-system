import type { UserStatus } from "@prisma/client";
export interface AshaProfileResponseDto {
  id: string;
  userId: string;
  fullName: string;
  employeeCode: string;
  status: UserStatus;
  village: { id: string; name: string; district: string; state: string };
  phc: { id: string; name: string } | null;
}
export interface AshaDashboardResponseDto {
  patients: { total: number; registeredThisMonth: number };
  assessments: { today: number; thisMonth: number };
  risk: { highRisk: number; mediumRisk: number; lowRisk: number };
  referrals: { pending: number; accepted: number; completed: number };
  followUps: { pending: number; today: number };
  sync: { pending: number; failed: number };
}
