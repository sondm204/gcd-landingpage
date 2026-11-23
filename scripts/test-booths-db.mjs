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
  run("psql", [...connection, "--single-transaction", "-f", resolve("db/tests/games.sql")]);
  run("psql", [...connection, "--single-transaction", "-f", resolve("db/tests/passports.sql")]);
  run("psql", [...connection, "--single-transaction", "-f", resolve("db/tests/position-locks.sql")]);
  run("psql", [...connection, "--single-transaction", "-f", resolve("db/tests/registrations.sql")]);
  console.log("PASS: private event registrations, JCI chapter requirements, duplicate contacts, dates and idempotent retries.");
  console.log("PASS: admin-only booking locks, preserved proposals, idempotent lock auditing, blocked approval/moves and unlock recovery.");
  const locker = spawn(join(bin,"psql"+ext), [...connection,"-At","-c","begin; select public.set_booth_position_lock(16::smallint,true,'11111111-1111-4111-8111-111111111111'); select 'LOCK_HELD'; select pg_sleep(1); commit;"], {windowsHide:true});
  let lockOutput="", lockErrors="";
  const lockReady = new Promise((done,reject) => {
    locker.stdout.on("data",value=>{lockOutput+=value;if(lockOutput.includes("LOCK_HELD"))done();});
    locker.stderr.on("data",value=>lockErrors+=value);
    locker.on("error",reject);
    locker.on("close",code=>{if(code || !lockOutput.includes("LOCK_HELD"))reject(new Error(lockErrors||"Lock transaction did not become ready"));});
  });
  const lockFinished = new Promise(done=>locker.on("close",code=>done(code)));
  await lockReady;
  const competing = spawnSync(join(bin,"psql"+ext), [...connection,"-c",`select public.submit_booth_proposal(gen_random_uuid(),'lock-race','{"position_id":16,"brand":"Race","booth_name":"Race Booth","contact_name":"Contact","email":"race@example.test","phone":"0901234567","category":"Other","description":""}'::jsonb,'[]');`], {encoding:"utf8",windowsHide:true,timeout:10000});
  assert.notEqual(competing.status,0);assert.match(competing.stderr,/BOOTH_LOCKED/);assert.equal(await lockFinished,0);
  run("psql",[...connection,"-c","select public.set_booth_position_lock(16::smallint,false,'11111111-1111-4111-8111-111111111111');"]);
  console.log("PASS: a submission waiting behind an uncommitted admin lock is rejected after that lock commits.");
  const concurrentPlayer = run("psql", [...connection, "-At", "-c", "select id from public.game_players where phone='+84900000003'"]);
  const gameStarts = await Promise.all(Array.from({ length: 4 }, () => new Promise(done => {
    const child = spawn(join(bin, "psql" + ext), [...connection, "-c", `select public.game_start_attempt('${concurrentPlayer}','place','online',gen_random_uuid(),42);`], { windowsHide: true });
    let stderr = ""; child.stderr.on("data", value => stderr += value); child.stdout.resume(); child.on("close", code => done({ code, stderr }));
  })));
  assert.equal(gameStarts.filter(r => r.code === 0).length, 3);
  assert.match(gameStarts.find(r => r.code !== 0).stderr, /ATTEMPT_LIMIT/);
  assert.equal(run("psql", [...connection, "-At", "-c", `select count(*) from public.game_attempts where player_id='${concurrentPlayer}'`]), "3");
  console.log("PASS: game account uniqueness, private data, best-score leaderboards, letter idempotency and concurrent three-attempt limit.");
  const card = run("psql", [...connection, "-At", "-c", "select passport_code from public.game_players where phone='+84900000003'"]);
  const gifts = await Promise.all(Array.from({ length: 2 }, () => new Promise(done => {
    const child = spawn(join(bin,"psql"+ext), [...connection,"-At","-c",`select public.event_passport_redeem('11111111-1111-4111-8111-111111111111','${card}')->>'reused';`],{windowsHide:true});
    let stdout="", stderr=""; child.stdout.on("data",value=>stdout+=value); child.stderr.on("data",value=>stderr+=value); child.on("close",code=>done({code,stdout:stdout.trim(),stderr}));
  })));
  assert(gifts.every(g=>g.code===0),JSON.stringify(gifts)); assert.equal(gifts.filter(g=>g.stdout==='false').length,1); assert.equal(gifts.filter(g=>g.stdout==='true').length,1);
  console.log("PASS: phone-only login, one stamp per booth, QR rotation, private passport state and exactly-once concurrent gift redemption.");
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
