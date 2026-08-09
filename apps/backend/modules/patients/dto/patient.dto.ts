import type { Gender } from "@prisma/client";
export interface CreatePatientDto {
  id?: string;
  fullName: string;
  dateOfBirth: Date;
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
export type UpdatePatientDto = Partial<
  Omit<CreatePatientDto, "id" | "clientCreatedAt" | "deviceId">
>;
