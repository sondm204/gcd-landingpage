// Runs only against a NEW local PostgreSQL cluster under ignored test-results/.
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { createServer } from "node:net";
import assert from "node:assert/strict";

const bin = process.env.PG_BIN || (process.platform === "win32" ? "D:/Code/Postgres/bin" : "/usr/lib/postgresql/16/bin");
const ext = process.platform === "win32" ? ".exe" : "";
mkdirSync("test-results", { recursive: true });
const root = mkdtempSync(resolve("test-results/booth-db-"));
const data = join(root, "data");
const socket = createServer();
await new Promise((done) => socket.listen(0, "127.0.0.1", done));
const port = socket.address().port;
await new Promise((done) => socket.close(done));
function run(tool, args) {
  const result = spawnSync(join(bin, tool + ext), args, { encoding: "utf8", windowsHide: true, timeout: 60000 });
  if (result.status !== 0) throw new Error(`${tool}: ${result.error?.message || result.stderr || result.stdout}`);
  return result.stdout.trim();
}
const connection = ["-X", "-v", "ON_ERROR_STOP=1", "-h", "127.0.0.1", "-p", String(port), "-U", "postgres", "-d", "postgres"];
let started = false;
try {
  run("initdb", ["-D", data, "--no-sync", "--no-locale", "--encoding=UTF8", "-A", "trust", "-U", "postgres"]);
  run("pg_ctl", ["-D", data, "-l", join(root, "postgres.log"), "-o", `-h 127.0.0.1 -p ${port}`, "-w", "start"]);
  started = true;
  run("psql", [...connection, "--single-transaction", "-f", resolve("db/tests/bootstrap.sql")]);
  if (process.argv.includes("--flyway")) {
    const env = { ...process.env, FLYWAY_URL: `jdbc:postgresql://127.0.0.1:${port}/postgres?sslmode=disable`, FLYWAY_USER: "postgres", FLYWAY_PASSWORD: "local-test-password" };
    for (const command of ["migrate", "migrate", "validate"]) {
      const result = spawnSync(process.execPath, ["scripts/flyway.mjs", command], { env, encoding: "utf8", windowsHide: true, timeout: 60000 });
      if (result.status !== 0) throw new Error(`Flyway ${command}: ${result.stdout} ${result.stderr}`);
    }
    assert.equal(run("psql", [...connection, "-At", "-c", "select count(*) from public.gcd_flyway_schema_history where version='1' and success"]), "1");
    console.log("PASS: actual Flyway CLI migrate, repeat migrate and checksum validation on a new local database.");
  } else {
    for (const file of readdirSync("db/migrations").filter((name)=>/^V\d+__.*\.sql$/.test(name)).sort((a,b)=>Number(a.match(/^V(\d+)/)[1])-Number(b.match(/^V(\d+)/)[1]))) run("psql", [...connection, "--single-transaction", "-f", resolve("db/migrations",file)]);
  }
  run("psql", [...connection, "--single-transaction", "-f", resolve("db/tests/invariants.sql")]);
  run("psql", [...connection, "--single-transaction", "-f", resolve("db/tests/admin-edits.sql")]);
  function approve(id) {
    return new Promise((done) => {
      const child = spawn(join(bin, "psql" + ext), [...connection, "-c", `select public.review_booth_proposal('${id}', 'approved', '11111111-1111-4111-8111-111111111111', 'Concurrency check');`], { windowsHide: true });
      let stderr = "";
      child.stderr.on("data", (value) => stderr += value);
      child.stdout.resume();
      child.on("close", (code) => done({ code, stderr }));
    });
  }
  const results = await Promise.all([approve("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"), approve("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")]);
  assert.equal(results.filter((item) => item.code === 0).length, 1, "Exactly one concurrent approval may win");
  assert.match(results.find((item) => item.code !== 0).stderr, /ALREADY_REVIEWED|BOOTH_TAKEN/);
  assert.equal(run("psql", [...connection, "-At", "-c", "select count(*) from public.booth_proposals where position_id=3 and status='approved'"]), "1");
  assert.equal(run("psql", [...connection, "-At", "-c", "select count(*) from public.booth_proposals where position_id=3 and status='rejected'"]), "1");
  console.log("PASS: migrations, privacy, admin authorization, pending competition, idempotency, rate limits, auditing and concurrent approvals.");
} finally {
  if (started) run("pg_ctl", ["-D", data, "-m", "fast", "-w", "stop"]);
}
