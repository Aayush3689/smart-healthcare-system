import { AccessPolicy } from "../common/policies/access.policy.js";
import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";
import { MailService } from "../integrations/mail.service.js";
import { ActiveAccountMiddleware } from "../middleware/active-account.middleware.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { AshaController } from "../modules/asha/controller.js";
import { AshaRepository } from "../modules/asha/repository.js";
import { AshaService } from "../modules/asha/service.js";
import { AppointmentController } from "../modules/appointments/controller.js";
import { AppointmentRepository } from "../modules/appointments/repository.js";
import { AppointmentService } from "../modules/appointments/service.js";
import { DoctorController } from "../modules/doctors/controller.js";
import { DoctorRepository } from "../modules/doctors/repository.js";
import { DoctorService } from "../modules/doctors/service.js";
import { ClinicalNoteController } from "../modules/clinical-notes/controller.js";
import { ClinicalNoteRepository } from "../modules/clinical-notes/repository.js";
import { ClinicalNoteService } from "../modules/clinical-notes/service.js";
import { FollowUpController } from "../modules/follow-ups/controller.js";
import { FollowUpRepository } from "../modules/follow-ups/repository.js";
import { FollowUpService } from "../modules/follow-ups/service.js";
import { PhcController } from "../modules/phcs/controller.js";
import { PhcRepository } from "../modules/phcs/repository.js";
import { PhcService } from "../modules/phcs/service.js";
import { VillageController } from "../modules/villages/controller.js";
import { VillageRepository } from "../modules/villages/repository.js";
import { VillageService } from "../modules/villages/service.js";
import { AssessmentRepository } from "../modules/assessments/repository.js";
import { AssessmentService } from "../modules/assessments/service.js";
import { AssessmentController } from "../modules/assessments/controller.js";
import { AuthController } from "../modules/auth/controller.js";
import { AuthRepository } from "../modules/auth/repository.js";
import { AuthService } from "../modules/auth/service.js";
import { PatientRepository } from "../modules/patients/repository.js";
import { PatientService } from "../modules/patients/service.js";
import { PredictionRepository } from "../modules/predictions/repository.js";
import { PredictionService } from "../modules/predictions/service.js";
import { PredictionController } from "../modules/predictions/controller.js";
import { ReferralRepository } from "../modules/referrals/repository.js";
import { ReferralService } from "../modules/referrals/service.js";
import { ReferralController } from "../modules/referrals/controller.js";
import { SyncController } from "../modules/sync/controller.js";
import { SyncRepository } from "../modules/sync/repository.js";
import { SyncService } from "../modules/sync/service.js";
import { PhcDashboardController } from "../modules/phc-dashboard/controller.js";
import { PhcDashboardRepository } from "../modules/phc-dashboard/repository.js";
import { PhcDashboardService } from "../modules/phc-dashboard/service.js";
import { JwtService } from "../utils/jwt.js";

export const jwtService = new JwtService(env.jwtSecret);
export const mailService = new MailService(env.smtp);
export const authController = new AuthController(
  new AuthService(new AuthRepository(prisma), mailService, jwtService),
);
export const authMiddleware = new AuthMiddleware(jwtService);
export const accessPolicy = new AccessPolicy(prisma);
export const activeAccountMiddleware = new ActiveAccountMiddleware(accessPolicy);
const patientService = new PatientService(new PatientRepository(prisma), accessPolicy);
export const predictionService = new PredictionService(
  new PredictionRepository(prisma),
  accessPolicy,
);
export const predictionController = new PredictionController(predictionService);
export const assessmentService = new AssessmentService(
  new AssessmentRepository(prisma),
  accessPolicy,
  predictionService,
);
export const assessmentController = new AssessmentController(assessmentService);
export const referralService = new ReferralService(new ReferralRepository(prisma), accessPolicy);
export const referralController = new ReferralController(referralService);
export const appointmentService = new AppointmentService(
  new AppointmentRepository(prisma),
  accessPolicy,
);
export const appointmentController = new AppointmentController(appointmentService);
export const doctorService = new DoctorService(new DoctorRepository(prisma), accessPolicy);
export const doctorController = new DoctorController(doctorService);
export const clinicalNoteService = new ClinicalNoteService(
  new ClinicalNoteRepository(prisma),
  accessPolicy,
);
export const clinicalNoteController = new ClinicalNoteController(clinicalNoteService);
export const followUpService = new FollowUpService(new FollowUpRepository(prisma), accessPolicy);
export const followUpController = new FollowUpController(followUpService);
export const phcService = new PhcService(new PhcRepository(prisma), accessPolicy);
export const phcController = new PhcController(phcService);
export const phcDashboardController = new PhcDashboardController(
  new PhcDashboardService(new PhcDashboardRepository(prisma), accessPolicy),
);
export const villageService = new VillageService(new VillageRepository(prisma), accessPolicy);
export const villageController = new VillageController(villageService);
export const ashaService = new AshaService(
  new AshaRepository(prisma),
  accessPolicy,
  patientService,
  assessmentService,
  referralService,
);
export const ashaController = new AshaController(ashaService);
export const syncController = new SyncController(
  new SyncService(
    new SyncRepository(prisma),
    accessPolicy,
    ashaService,
    predictionService,
    followUpService,
  ),
);
