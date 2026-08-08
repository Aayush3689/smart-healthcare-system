import type { Response } from "express";

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(
  response: Response,
  statusCode: number,
  data: T,
  message = "Request completed successfully.",
): Response<ApiSuccess<T>> {
  return response.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  response: Response,
  statusCode: number,
  message: string,
  code: string,
  details?: unknown,
): Response<ApiError> {
  return response.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      ...(details === undefined ? {} : { details }),
    },
  });
}
