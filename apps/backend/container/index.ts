import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";
import { MailService } from "../integrations/mail.service.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { AuthController } from "../modules/auth/controller.js";
import { AuthRepository } from "../modules/auth/repository.js";
import { AuthService } from "../modules/auth/service.js";
import { JwtService } from "../utils/jwt.js";

export const jwtService = new JwtService(env.jwtSecret);
export const mailService = new MailService(env.smtp);
export const authRepository = new AuthRepository(prisma);
export const authService = new AuthService(authRepository, mailService, jwtService);
export const authController = new AuthController(authService);
export const authMiddleware = new AuthMiddleware(jwtService);
