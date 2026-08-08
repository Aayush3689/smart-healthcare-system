import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const indexUrl = new URL("../../routes/index.ts", import.meta.url);

test("API index mounts every completed top-level resource exactly once", async () => {
  const source = await readFile(indexUrl, "utf8");
  const prefixes = [
    "auth",
    "asha",
    "assessments",
    "predictions",
    "referrals",
    "appointments",
    "doctors",
    "phc",
    "clinical-notes",
    "patients",
    "follow-ups",
    "sync",
  ];

  for (const prefix of prefixes) {
    const matches = source.match(new RegExp(`this\\.router\\.use\\(\\s*"/${prefix}"`, "g"));
    assert.equal(matches?.length, 1, `/${prefix} must be mounted exactly once`);
  }
});

test("nested role routes are composed below their resource router", async () => {
  const source = await readFile(indexUrl, "utf8");
  assert.match(source, /ashaApiRoutes\.use\("\/me\/follow-ups"/);
  assert.match(source, /doctorApiRoutes\.use\("\/me\/referrals"/);
  assert.match(source, /doctorApiRoutes\.use\("\/me\/appointments"/);
  assert.match(source, /doctorApiRoutes\.use\("\/me\/clinical-notes"/);
  assert.match(source, /doctorApiRoutes\.use\("\/me\/follow-ups"/);
  assert.match(source, /phcApiRoutes\.use\("\/me\/doctors"/);
  assert.match(source, /phcApiRoutes\.use\("\/me\/referrals"/);
  assert.match(source, /phcApiRoutes\.use\("\/me\/appointments"/);
  assert.match(source, /phcApiRoutes\.use\("\/me\/follow-ups"/);
});
