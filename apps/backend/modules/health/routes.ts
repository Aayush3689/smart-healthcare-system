import { Router } from "express";
import { healthController } from "../../container/index.js";
import { asyncHandler } from "../../middleware/async-handler.js";

export const healthRoutes = Router();
healthRoutes.get("/", healthController.health);
healthRoutes.get("/ready", asyncHandler(healthController.ready));
healthRoutes.get("/live", healthController.live);
