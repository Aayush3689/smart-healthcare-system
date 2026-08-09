import type { z } from "zod";
import type {
  createDoctorValidation,
  doctorListQueryValidation,
  doctorPatientListQueryValidation,
  updateAvailabilityValidation,
  updateDoctorValidation,
} from "../validation.js";

export type CreateDoctorRequest = z.infer<typeof createDoctorValidation>;
export type UpdateDoctorRequest = z.infer<typeof updateDoctorValidation>;
export type DoctorListRequest = z.infer<typeof doctorListQueryValidation>;
export type DoctorPatientListRequest = z.infer<typeof doctorPatientListQueryValidation>;
export type UpdateAvailabilityRequest = z.infer<typeof updateAvailabilityValidation>;
