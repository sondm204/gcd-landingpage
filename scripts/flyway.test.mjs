import test from "node:test";
import assert from "node:assert/strict";
import { mergeEnv, validateEnv, redact } from "./flyway.mjs";

test("loads quoted Flyway values without evaluating shell characters", () => {
  const env = mergeEnv(`# comments\nFLYWAY_URL="jdbc:postgresql://localhost:5432/postgres?sslmode=require"\nFLYWAY_USER=postgres\nFLYWAY_PASSWORD='a#b=c$()! & secret'\nUNRELATED_KEY=ignored\n`);
  assert.equal(env.FLYWAY_PASSWORD, "a#b=c$()! & secret");
  assert.equal(env.UNRELATED_KEY, undefined);
  assert.doesNotThrow(() => validateEnv(env));
});

test("CI environment takes precedence over local .env.flyway", () => {
  const result = mergeEnv("FLYWAY_PASSWORD=local\nFLYWAY_USER=postgres", { FLYWAY_PASSWORD: "ci-secret", PATH: "system-path" });
  assert.equal(result.FLYWAY_PASSWORD, "ci-secret");
  assert.equal(result.FLYWAY_USER, "postgres");
  assert.equal(result.PATH, "system-path");
});

test("invalid or missing configuration fails without echoing values", () => {
  assert.throws(() => validateEnv({}), /FLYWAY_URL/);
  assert.throws(() => validateEnv({ FLYWAY_URL: "postgresql://localhost/db", FLYWAY_USER: "postgres", FLYWAY_PASSWORD: "secret" }), /jdbc:postgresql/);
  assert.throws(() => validateEnv({ FLYWAY_URL: "jdbc:postgresql://localhost/db?password=private", FLYWAY_USER: "postgres", FLYWAY_PASSWORD: "secret" }), (error) => !error.message.includes("private"));
  assert.throws(() => validateEnv({ FLYWAY_URL: "jdbc:postgresql://postgres:private@localhost/db", FLYWAY_USER: "postgres", FLYWAY_PASSWORD: "secret" }), (error) => !error.message.includes("private"));
  assert.throws(() => validateEnv({ FLYWAY_URL: "jdbc:postgresql://aws-0-region.pooler.supabase.com:6543/postgres", FLYWAY_USER: "postgres", FLYWAY_PASSWORD: "secret" }), /6543/);
});

test("masks raw and URL encoded passwords from process output", () => {
  const env = { FLYWAY_PASSWORD: "secret#&=" };
  assert.equal(redact(`failure ${env.FLYWAY_PASSWORD} ${encodeURIComponent(env.FLYWAY_PASSWORD)}`, env), "failure [REDACTED] [REDACTED]");
});
