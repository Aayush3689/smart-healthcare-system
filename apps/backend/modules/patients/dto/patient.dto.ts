import type { Gender } from "@prisma/client";

export interface CreatePatientRequest {
  id?: string;
  fullName: string;
  dateOfBirth?: Date;
  age?: number;
  gender: Gender;
  phone?: string;
  address?: string;
  villageId: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  deviceId?: string;
  clientCreatedAt: Date;
}

export interface UpdatePatientRequest {
  fullName?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  phone?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
}

export interface PatientListItemResponse {
  id: string;
  fullName: string;
  age: number;
  gender: Gender;
  village: { id: string; name: string };
  registeredBy: { id: string; fullName: string };
}

export interface PatientTimelineItemResponse {
  type:
    | "PATIENT_REGISTERED"
    | "ASSESSMENT"
    | "PREDICTION"
    | "REFERRAL"
    | "APPOINTMENT"
    | "CLINICAL_NOTE"
    | "FOLLOW_UP";
  id: string;
  timestamp: Date;
}
