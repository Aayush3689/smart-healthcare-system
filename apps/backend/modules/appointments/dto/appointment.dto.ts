import type { z } from "zod";
import type {
  appointmentListQueryValidation,
  cancelAppointmentValidation,
  createAppointmentValidation,
  rescheduleAppointmentValidation,
} from "../validation.js";

export type CreateAppointmentRequest = z.infer<typeof createAppointmentValidation>;
export type AppointmentListRequest = z.infer<typeof appointmentListQueryValidation>;
export type CancelAppointmentRequest = z.infer<typeof cancelAppointmentValidation>;
export type RescheduleAppointmentRequest = z.infer<typeof rescheduleAppointmentValidation>;
