import { Router, type Request, type Response } from "express";
import { AuthRoutes } from "../modules/auth/index.js";
import { authController, authMiddleware } from "../container/index.js";
import { sendSuccess } from "../utils/api-response.js";

export class HealthController {
  public check = (_request: Request, response: Response): Response =>
    sendSuccess(response, 200, { status: "ok" }, "Backend is healthy.");
}

export class ApiRoutes {
  public readonly router = Router();
  private readonly healthController = new HealthController();
  constructor() {
    this.router.get("/health", this.healthController.check);
    this.router.use("/auth", new AuthRoutes(authController, authMiddleware).router);
  }
}

export const routes = new ApiRoutes().router;
