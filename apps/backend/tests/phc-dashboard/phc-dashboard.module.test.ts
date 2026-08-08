import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Disease, ReferralPriority, ReferralStatus } from "@prisma/client";
import { PhcDashboardService } from "../../modules/phc-dashboard/service.js";
import {
  highRiskDashboardQueryValidation,
  referralDashboardQueryValidation,
  trendDashboardQueryValidation,
} from "../../modules/phc-dashboard/validation.js";

test("dashboard filters are strict and use bounded pagination", () => {
  const parsed = referralDashboardQueryValidation.parse({
    status: ReferralStatus.PENDING,
    priority: ReferralPriority.HIGH,
  });
  assert.deepEqual(parsed, {
    status: ReferralStatus.PENDING,
    priority: ReferralPriority.HIGH,
    page: 1,
    limit: 20,
  });
  assert.equal(referralDashboardQueryValidation.safeParse({ phcId: "unsafe" }).success, false);
  assert.equal(
    highRiskDashboardQueryValidation.safeParse({ disease: Disease.DIABETES, limit: 101 }).success,
    false,
  );
  assert.equal(trendDashboardQueryValidation.parse({}).period, "30D");
});

test("dashboard scope always comes from the authenticated PHC admin", async () => {
  let repositoryPhcId: string | undefined;
  const service = new PhcDashboardService(
    {
      referrals: async (phcId: string) => {
        repositoryPhcId = phcId;
        return [[], 0];
      },
    } as never,
    { requireAdminPhc: async () => ({ phcId: "phc-from-token" }) } as never,
  );
  const result = await service.referrals("admin-user", {
    page: 1,
    limit: 20,
  });
  assert.equal(repositoryPhcId, "phc-from-token");
  assert.deepEqual(result.pagination, { page: 1, limit: 20, total: 0 });
});

test("trend output contains every day, including zero-count days", async () => {
  const service = new PhcDashboardService(
    {
      trends: async () => [[{ createdAt: new Date() }], [], [], []],
    } as never,
    { requireAdminPhc: async () => ({ phcId: "phc-1" }) } as never,
  );
  const result = await service.trends("admin-user", { period: "7D" });
  assert.equal(result.assessments.length, 7);
  assert.equal(result.highRiskPatients.length, 7);
  assert.equal(
    result.assessments.reduce((sum, point) => sum + point.count, 0),
    1,
  );
});

test("PHC dashboard exposes only the nine read-only routes", async () => {
  const source = await readFile(
    new URL("../../modules/phc-dashboard/routes.ts", import.meta.url),
    "utf8",
  );
  assert.equal((source.match(/phcDashboardRoutes\.get\(/g) ?? []).length, 9);
  assert.doesNotMatch(source, /phcDashboardRoutes\.(post|patch|put|delete)\(/);
  for (const path of [
    "referrals",
    "high-risk-patients",
    "appointments",
    "follow-ups",
    "villages",
    "doctors",
    "asha-workers",
    "trends",
  ]) {
    assert.match(source, new RegExp(`"/${path}"`));
  }
});
