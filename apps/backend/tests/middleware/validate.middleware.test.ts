import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { validationMiddleware } from "../../middleware/validate.middleware.js";

test("query validation supports the getter-only Express 5 request query", () => {
  const prototype = Object.create(null) as object;
  Object.defineProperty(prototype, "query", {
    configurable: true,
    enumerable: true,
    get: () => ({ search: "Rampur", page: "1", limit: "20" }),
  });
  const request = Object.create(prototype) as Request;
  const schema = z.object({
    search: z.string(),
    page: z.coerce.number().int(),
    limit: z.coerce.number().int(),
  });
  let nextError: unknown;

  validationMiddleware.validateQuery(schema)(
    request,
    {} as Response,
    ((error?: unknown) => {
      nextError = error;
    }) as NextFunction,
  );

  assert.equal(nextError, undefined);
  assert.deepEqual(request.query, { search: "Rampur", page: 1, limit: 20 });
  assert.equal(Object.hasOwn(request, "query"), true);
});

test("invalid getter-only query still returns validation error", () => {
  const request = Object.create({}) as Request;
  Object.defineProperty(request, "query", { get: () => ({ page: "invalid" }) });
  let nextError: unknown;

  validationMiddleware.validateQuery(z.object({ page: z.coerce.number().int() }))(
    request,
    {} as Response,
    ((error?: unknown) => {
      nextError = error;
    }) as NextFunction,
  );

  assert.equal((nextError as { code?: string } | undefined)?.code, "VALIDATION_ERROR");
});
