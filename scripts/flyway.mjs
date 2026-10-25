import { parseEnv } from "node:util";
import { existsSync, createReadStream, createWriteStream } from "node:fs";
import { readFile, mkdir, mkdtemp, readdir, rename, unlink } from "node:fs/promises";
import { resolve, join, dirname, delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createInterface } from "node:readline";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION = "13.11.1";
const CACHE = join(ROOT, ".tools", "flyway", VERSION);
const IMAGE = `flyway/flyway:${VERSION}`;
const WINDOWS = process.platform === "win32";
const POWERSHELL = join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");

export function mergeEnv(contents, inherited = {}) {
  const result = { ...inherited };
  for (const [key, value] of Object.entries(parseEnv(contents))) {
    if (key.startsWith("FLYWAY_") && result[key] === undefined) result[key] = value;
  }
  return result;
}

export function validateEnv(env) {
  const missing = ["FLYWAY_URL", "FLYWAY_USER", "FLYWAY_PASSWORD"].filter((key) => !env[key] || /YOUR_PROJECT_REF|YOUR_DATABASE_PASSWORD/.test(env[key]));
  if (missing.length) throw new Error(`Chưa điền ${missing.join(", ")} trong .env.flyway hoặc environment.`);
  if (!env.FLYWAY_URL.startsWith("jdbc:postgresql://")) throw new Error("FLYWAY_URL phải bắt đầu bằng jdbc:postgresql://.");
  let url;
  try { url = new URL(env.FLYWAY_URL.slice(5)); }
  catch { throw new Error("FLYWAY_URL chưa phải JDBC URL hợp lệ."); }
  if (url.username || url.password) throw new Error("Đặt tài khoản ở FLYWAY_USER và mật khẩu ở FLYWAY_PASSWORD, không nhúng trong URL.");
  if (url.hostname.endsWith(".pooler.supabase.com") && url.port === "6543") throw new Error("Migration cần Direct connection hoặc Session pooler cổng 5432, không dùng Transaction pooler cổng 6543.");
  if (/[?&]password=/i.test(env.FLYWAY_URL)) throw new Error("Đặt mật khẩu ở FLYWAY_PASSWORD thay vì nhúng trong FLYWAY_URL.");
}

export function redact(text, env) {
  let result = text;
  for (const secret of [env.FLYWAY_PASSWORD, env.FLYWAY_PASSWORD && encodeURIComponent(env.FLYWAY_PASSWORD)].filter(Boolean)) result = result.split(secret).join("[REDACTED]");
  return result;
}

function portableCli() { return join(CACHE, `flyway-${VERSION}`, WINDOWS ? "flyway.cmd" : "flyway"); }

function findSystemCli(env) {
  if (env.GCD_FLYWAY_CLI) {
    const path = resolve(env.GCD_FLYWAY_CLI);
    if (!existsSync(path)) throw new Error("Không tìm thấy file chạy tại GCD_FLYWAY_CLI.");
    return path;
  }
  const names = WINDOWS ? ["flyway.cmd", "flyway.exe", "flyway.bat"] : ["flyway"];
  for (const path of (env.PATH || env.Path || "").split(delimiter)) {
    for (const name of names) {
      const candidate = join(path.replace(/^"|"$/g, ""), name);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

async function run(command, args, env = process.env) {
  return new Promise((done, reject) => {
    let dnsFailure = false;
    const child = spawn(command, args, { cwd: ROOT, env, windowsHide: true, stdio: ["inherit", "pipe", "pipe"] });
    for (const stream of [child.stdout, child.stderr]) {
      createInterface({ input: stream }).on("line", (line) => {
        if (line.includes("UnknownHostException")) dnsFailure = true;
        console.log(redact(line, env));
      });
    }
    child.on("error", reject);
    child.on("close", (code) => {
      if (code && dnsFailure) console.error("Không phân giải được host database. Nếu dùng Supabase Direct, kiểm tra host trong Connect và DNS/IPv6 của môi trường chạy Flyway. Runner giữ nguyên .env.flyway, không tự đổi kiểu kết nối.");
      done(code ?? 1);
    });
  });
}

async function fetchOfficial(url, json = false) {
  const response = await fetch(url, { headers: { "User-Agent": "gcd-landingpage-flyway-setup", ...(json ? { Accept: "application/vnd.github+json" } : {}) }, signal: AbortSignal.timeout(180000) });
  if (!response.ok) throw new Error(`Không tải được Flyway từ nguồn chính thức (HTTP ${response.status}).`);
  return response;
}

async function installPortable() {
  if (existsSync(portableCli())) return portableCli();
  const platforms = { win32: "windows", linux: "linux", darwin: "macosx" };
  const platform = platforms[process.platform];
  const arch = { x64: "x64", arm64: "arm64" }[process.arch];
  if (!platform || !arch) throw new Error("Nền tảng chưa có bộ cài portable. Cài Flyway CLI hoặc dùng Docker Engine.");
  const filename = `flyway-commandline-${VERSION}-${platform}-${arch}.${WINDOWS ? "zip" : "tar.gz"}`;
  console.log(`Đang chuẩn bị Flyway Open Source ${VERSION} cho dự án…`);
  const release = await (await fetchOfficial(`https://api.github.com/repos/flyway/flyway/releases/tags/flyway-${VERSION}`, true)).json();
  const asset = release.assets?.find((item) => item.name === filename);
  if (!asset || !/^sha256:[a-f0-9]{64}$/i.test(asset.digest || "")) throw new Error("Bộ cài chính thức không có SHA-256 hợp lệ; chưa cài Flyway.");
  const expectedUrl = `https://github.com/flyway/flyway/releases/download/flyway-${VERSION}/${filename}`;
  if (asset.browser_download_url !== expectedUrl) throw new Error("URL bộ cài không đúng nguồn Flyway chính thức.");
  await mkdir(CACHE, { recursive: true });
  const staging = await mkdtemp(join(CACHE, "download-"));
  const archive = join(staging, filename);
  const response = await fetchOfficial(expectedUrl);
  if (!response.body) throw new Error("Bộ cài tải về trống.");
  await pipeline(Readable.fromWeb(response.body), createWriteStream(archive, { flags: "wx" }));
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(archive)) hash.update(chunk);
  if (`sha256:${hash.digest("hex")}` !== asset.digest.toLowerCase()) throw new Error("SHA-256 không khớp. Dừng cài đặt Flyway.");
  const extract = join(staging, "extracted");
  await mkdir(extract);
  const code = WINDOWS
    ? await run(POWERSHELL, ["-NoProfile", "-NonInteractive", "-Command", "Expand-Archive -LiteralPath $env:GCD_FLYWAY_ARCHIVE -DestinationPath $env:GCD_FLYWAY_EXTRACT -Force"], { ...process.env, GCD_FLYWAY_ARCHIVE: archive, GCD_FLYWAY_EXTRACT: extract })
    : await run("tar", ["-xzf", archive, "-C", extract]);
  if (code !== 0) throw new Error("Không giải nén được bộ cài Flyway.");
  const entry = (await readdir(extract, { withFileTypes: true })).find((item) => item.isDirectory() && item.name === `flyway-${VERSION}`);
  if (!entry) throw new Error("Bộ cài thiếu thư mục Flyway.");
  await rename(join(extract, entry.name), join(CACHE, entry.name));
  await unlink(archive);
  if (!existsSync(portableCli())) throw new Error("Bộ cài thiếu file chạy Flyway.");
  console.log("Đã cài Flyway portable trong .tools/ (không cần sửa PATH).");
  return portableCli();
}

export async function main(command = "migrate") {
  if (!["setup", "version", "info", "validate", "migrate"].includes(command)) throw new Error("Chỉ hỗ trợ setup, version, info, validate hoặc migrate.");
  let env = { ...process.env };
  const envPath = join(ROOT, ".env.flyway");
  if (existsSync(envPath) && !["setup", "version"].includes(command)) env = mergeEnv(await readFile(envPath, "utf8"), env);
  if (!["setup", "version"].includes(command)) validateEnv(env);
  let cli = findSystemCli(env) || (existsSync(portableCli()) ? portableCli() : null);
  if (!cli && command !== "setup") {
    const docker = spawnSync("docker", ["info", "--format", "{{.ServerVersion}}"], { encoding: "utf8", timeout: 10000, windowsHide: true });
    if (docker.status === 0) {
      console.log(`Dùng Flyway Docker ${VERSION}.`);
      return run("docker", ["run", "--rm", "-e", "FLYWAY_URL", "-e", "FLYWAY_USER", "-e", "FLYWAY_PASSWORD", "--mount", `type=bind,src=${join(ROOT, "db")},dst=/flyway/sql,readonly`, "--mount", `type=bind,src=${join(ROOT, "flyway.conf")},dst=/flyway/conf/flyway.conf,readonly`, IMAGE, ...(command === "version" ? ["-v"] : ["-configFiles=/flyway/conf/flyway.conf", "-locations=filesystem:/flyway/sql/migrations", command])], env);
    }
  }
  cli ||= await installPortable();
  const task = ["setup", "version"].includes(command) ? "-v" : command;
  console.log(task === "-v" ? "Kiểm tra Flyway CLI…" : `Flyway ${command}: đã nạp cấu hình; mật khẩu chỉ truyền qua environment.`);
  if (WINDOWS && /\.(cmd|bat)$/i.test(cli)) {
    // Environment variables keep paths/passwords out of shell interpolation.
    return run(POWERSHELL, ["-NoProfile", "-NonInteractive", "-Command", "& $env:GCD_FLYWAY_EXEC '-configFiles=flyway.conf' $env:GCD_FLYWAY_TASK; exit $LASTEXITCODE"], { ...env, GCD_FLYWAY_EXEC: cli, GCD_FLYWAY_TASK: task });
  }
  return run(cli, ["-configFiles=flyway.conf", task], env);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv[2]).then((code) => { process.exitCode = code; }).catch((error) => {
    // Never dump environment or nested HTTP/database request objects.
    console.error(error instanceof Error ? error.message : "Không chạy được Flyway.");
    process.exitCode = 1;
  });
}
