import type { Role } from "@prisma/client";

export interface RequestContext {
  userId: string;
  role: Role;
  params: Record<string, string>;
  query: Record<string, unknown>;
  body: Record<string, unknown>;
  file?: Express.Multer.File;
}

export interface ModuleService {
  execute(operation: string, context: RequestContext): Promise<unknown>;
}

export const pick = (body: Record<string, unknown>, fields: string[]) =>
  Object.fromEntries(
    fields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]),
  );

export const withDates = (body: Record<string, unknown>, fields: string[]) => {
  const data = { ...body };
  for (const field of fields) if (data[field]) data[field] = new Date(String(data[field]));
  return data;
};
