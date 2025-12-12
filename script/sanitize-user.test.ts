import { strict as assert } from "node:assert";
import test from "node:test";
import { sanitizeUser, sanitizeUsers } from "../server/user-sanitizer";

const sampleUser = {
  id: "u1",
  email: "a@example.com",
  password: "hash",
  role: "admin",
};

test("sanitizeUser removes password field", () => {
  const result = sanitizeUser(sampleUser);
  assert.ok(result);
  assert.equal((result as any).password, undefined);
  assert.equal(result?.id, sampleUser.id);
  assert.equal(result?.email, sampleUser.email);
});

test("sanitizeUsers strips passwords for arrays", () => {
  const result = sanitizeUsers([sampleUser, { id: "u2", password: "secret" }]);
  assert.equal(result.length, 2);
  assert.equal((result[0] as any).password, undefined);
  assert.equal((result[1] as any).password, undefined);
});

test("sanitizeUser returns null/undefined as-is", () => {
  assert.equal(sanitizeUser(undefined), undefined);
  assert.equal(sanitizeUser(null), null);
});
