import type { RequestHandler, Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import type { ModuleController } from "./controller.js";

export const route =
  (router: Router, controller: ModuleController) =>
  (
    method: "get" | "post" | "patch" | "delete",
    path: string,
    operation: string,
    options: { status?: number; before?: RequestHandler[] } = {},
  ) =>
    router[method](
      path,
      ...(options.before ?? []),
      asyncHandler(controller.handle(operation, options.status)),
    );
