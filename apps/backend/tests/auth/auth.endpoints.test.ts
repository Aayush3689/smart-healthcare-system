import assert from "node:assert/strict";
import test from "node:test";
import { Platform, Role, UserStatus } from "@prisma/client";
import { AuthService } from "../../modules/auth/service.js";
import {
  provisionAccountValidation,
  requestOtpValidation,
  verifyOtpValidation,
} from "../../modules/auth/validation.js";
import { createOtp, hashOtp, verifyOtp } from "../../utils/otp.js";

const user = {
  id: "user-1",
  email: "doctor@example.com",
  role: Role.DOCTOR,
  status: UserStatus.INVITED,
  isEmailVerified: false,
};

test("request-otp endpoint validation normalizes email and rejects extra fields", () => {
  assert.deepEqual(requestOtpValidation.parse({ email: " Doctor@Example.com " }), {
    email: "doctor@example.com",
  });
  assert.equal(requestOtpValidation.safeParse({ email: "bad", extra: true }).success, false);
});

test("verify-otp endpoint validation defaults platform", () => {
  assert.equal(
    verifyOtpValidation.parse({ email: user.email, otp: "123456" }).platform,
    Platform.MOBILE_APP,
  );
});

test("provision-account endpoint validation requires role-specific fields", () => {
  assert.equal(
    provisionAccountValidation.safeParse({
      email: user.email,
      role: Role.DOCTOR,
      fullName: "Ada Rao",
    }).success,
    false,
  );
});

test("ASHA provisioning rejects a missing or cross-PHC village before transaction", async () => {
  let provisioned = false;
  const service = new AuthService(
    {
      adminPhc: async () => ({ phcId: "phc-1" }),
      village: async () => null,
      provision: async () => {
        provisioned = true;
      },
    } as never,
    {} as never,
    {} as never,
  );
  await assert.rejects(
    () =>
      service.provision("admin-user", {
        email: "asha@example.com",
        role: Role.ASHA_WORKER,
        fullName: "Asha Devi",
        villageId: "11111111-1111-4111-8111-111111111111",
        employeeCode: "ASHA-001",
      }),
    (error: unknown) =>
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "VILLAGE_NOT_FOUND",
  );
  assert.equal(provisioned, false);
});

test("ASHA provisioning accepts an active village in the admin PHC", async () => {
  let provisionedVillage = "";
  const service = new AuthService(
    {
      adminPhc: async () => ({ phcId: "phc-1" }),
      village: async () => ({ id: "village-1", phcId: "phc-1", isActive: true }),
      provision: async (data: { villageId?: string }) => {
        provisionedVillage = data.villageId ?? "";
        return {
          id: "asha-user",
          email: "asha@example.com",
          role: Role.ASHA_WORKER,
          status: UserStatus.INVITED,
          isEmailVerified: false,
        };
      },
    } as never,
    {} as never,
    {} as never,
  );
  const result = await service.provision("admin-user", {
    email: "asha@example.com",
    role: Role.ASHA_WORKER,
    fullName: "Asha Devi",
    villageId: "11111111-1111-4111-8111-111111111111",
    employeeCode: "ASHA-001",
  });
  assert.equal(provisionedVillage, "11111111-1111-4111-8111-111111111111");
  assert.equal(result.role, Role.ASHA_WORKER);
});

test("request-otp endpoint flow sends a six-digit code", async () => {
  let sentOtp = "";
  let otpHash = "";
  const repository = {
    findUserByEmail: async () => user,
    createOtp: async (_id: string, _email: string, hash: string, expiresAt: Date) => {
      assert.ok(expiresAt > new Date());
      otpHash = hash;
    },
  };
  const mailer = {
    sendLoginOtp: async (_email: string, otp: string) => {
      sentOtp = otp;
    },
  };
  const service = new AuthService(repository as never, mailer as never, {} as never);
  await service.requestOtp(user.email);
  assert.match(sentOtp, /^\d{6}$/);
  assert.equal(await verifyOtp(sentOtp, otpHash), true);
});

test("verify-otp endpoint flow returns tokens and completes login", async () => {
  const otp = createOtp();
  let completed = false;
  const repository = {
    latestOtp: async () => ({ id: "otp-1", userId: user.id, otpHash: await hashOtp(otp) }),
    findUserById: async () => user,
    completeLogin: async () => {
      completed = true;
    },
  };
  const service = new AuthService(
    repository as never,
    {} as never,
    { sign: () => "access-token" } as never,
  );
  const result = await service.verifyOtp(user.email, otp, Platform.MOBILE_APP);
  assert.equal(completed, true);
  assert.equal(result.accessToken, "access-token");
  assert.match(result.refreshToken, /^[A-Za-z0-9_-]{64}$/);
  assert.equal(result.user.email, user.email);
});
