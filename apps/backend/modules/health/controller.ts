import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../../utils/api-response.js";
import type { HealthService } from "./service.js";

export class HealthController {
  public constructor(private readonly service: HealthService) {}

  public live = (_request: Request, response: Response) =>
    sendSuccess(response, 200, this.service.live(), "Service is alive.");

  public health = (_request: Request, response: Response) =>
    sendSuccess(response, 200, this.service.health(), "Service health fetched successfully.");

  public ready = async (_request: Request, response: Response) => {
    const result = await this.service.ready();
    if (!result.ready) {
      return sendError(response, 503, "Service is not ready.", "SERVICE_NOT_READY", result.details);
    }

    return sendSuccess(
      response,
      200,
      { status: "READY", dependencies: result.dependencies },
      "Service is ready.",
    );
  };
}
