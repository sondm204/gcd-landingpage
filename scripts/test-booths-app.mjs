// Full Next.js HTTP/UI flow against a local fake Supabase transport.
// Database transaction invariants are tested separately on real PostgreSQL.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { conceptPositions } from "../lib/booths/types.ts";

const serviceKey = "test-server-only-service-key";
const adminId = "11111111-1111-4111-8111-111111111111";
const nonAdminId = "22222222-2222-4222-8222-222222222222";
const proposals = [];
let activeAdmin = true;
const uploads = new Map();
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jhX0AAAAASUVORK5CYII=", "base64");
const user = (id) => ({ id, email: id === adminId ? "admin@example.test" : "guest@example.test", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() });
const jwt = (id) => `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: id, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now()/1000)+3600 })).toString("base64url")}.test-signature`;
const publicMap = () => conceptPositions().map((position) => {
  const winner = proposals.find((item) => item.position_id === position.id && item.status === "approved");
  return { ...position, is_booked: Boolean(winner), pending_count: proposals.filter((item) => item.position_id === position.id && item.status === "pending").length, confirmed_brand: winner?.brand || null, confirmed_booth: winner?.booth_name || null };
});
const json = (res, status, body, headers = {}) => { res.writeHead(status, { "Content-Type": "application/json", ...headers }); res.end(JSON.stringify(body)); };
const backend = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks);
    const body = req.headers["content-type"]?.includes("application/json") && raw.length ? JSON.parse(raw.toString()) : {};
    if (url.pathname === "/auth/v1/token") {
      const id = body.email === "admin@example.test" ? adminId : nonAdminId;
      return json(res, 200, { access_token: jwt(id), refresh_token: "test-refresh-token", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now()/1000)+3600, user: user(id) });
    }
    if (url.pathname === "/auth/v1/user") {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return json(res, 401, { message: "Unauthorized" });
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
      return json(res, 200, user(payload.sub));
    }
    if (url.pathname === "/auth/v1/logout") { res.writeHead(204); return res.end(); }
    if (req.headers.apikey !== serviceKey && !url.pathname.startsWith("/storage/v1/object/sign/")) return json(res, 403, { message: "Service role required" });
    if (url.pathname === "/rest/v1/booth_admins") return json(res, 200, activeAdmin && url.searchParams.get("user_id") === `eq.${adminId}` ? [{ user_id: adminId }] : []);
    if (url.pathname === "/rest/v1/booth_public_map") {
      const map = publicMap(); const id = url.searchParams.get("id");
      const rows = id ? map.filter((item) => item.id === Number(id.slice(3))) : map;
      return json(res, 200, req.headers.accept?.includes("vnd.pgrst.object") ? rows[0] : rows);
    }
    if (url.pathname === "/rest/v1/booth_proposals") {
      let rows = [...proposals];
      for (const key of ["request_key", "status", "position_id", "id"]) {
        const filter = url.searchParams.get(key);
        if (filter) rows = rows.filter((item) => String(item[key]) === filter.slice(3));
      }
      const total = rows.length;
      const offset = Number(url.searchParams.get("offset") || 0), limit = Number(url.searchParams.get("limit") || 20);
      rows = rows.slice(offset, offset+limit);
      return json(res, 200, rows, { "Content-Range": `${offset}-${offset+rows.length-1}/${total}` });
    }
    if (url.pathname === "/rest/v1/rpc/booth_consume_rate_limit") return json(res, 200, true);
    if (url.pathname === "/rest/v1/rpc/submit_booth_proposal") {
      const previous = proposals.find((item) => item.request_key === body.p_request_key);
      if (previous) return json(res, 200, { id: previous.id, reference: previous.reference, reused: true });
      if (publicMap().find((item) => item.id === body.p_data.position_id).is_booked) return json(res, 400, { message: "BOOTH_TAKEN" });
      const entry = { ...body.p_data, id: randomUUID(), request_key: body.p_request_key, fingerprint: body.p_fingerprint, reference: `GCD-TEST${proposals.length+1}`, status: "pending", image_paths: body.p_images, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), reviewed_at: null, review_note: null };
      proposals.push(entry); return json(res, 200, { id: entry.id, reference: entry.reference, reused: false });
    }
    if (url.pathname === "/rest/v1/rpc/review_booth_proposal") {
      if (body.p_admin_id !== adminId) return json(res, 400, { message: "NOT_ADMIN" });
      const entry = proposals.find((item) => item.id === body.p_proposal_id);
      if (!entry) return json(res, 400, { message: "NOT_FOUND" });
      if (entry.status !== "pending") return json(res, 400, { message: "ALREADY_REVIEWED" });
      entry.status = body.p_decision; entry.review_note = body.p_note; entry.reviewed_at = new Date().toISOString();
      entry.updated_at = new Date().toISOString();
      if (body.p_decision === "approved") proposals.filter((item) => item.position_id === entry.position_id && item.status === "pending").forEach((item) => { item.status = "rejected"; item.reviewed_at = new Date().toISOString(); });
      return json(res, 200, { id: entry.id, position_id: entry.position_id, status: entry.status });
    }
    if (url.pathname === "/rest/v1/rpc/update_confirmed_booth") {
      const entry=proposals.find((item)=>item.id===body.p_proposal_id);
      if (!entry) return json(res,400,{message:"NOT_FOUND"});
      if (entry.updated_at!==body.p_expected_updated_at) return json(res,400,{message:"STALE_PROPOSAL"});
      if (entry.status!=="approved") return json(res,400,{message:"NOT_CONFIRMED"});
      if (proposals.some((item)=>item.id!==entry.id && item.position_id===body.p_data.position_id && item.status==="approved")) return json(res,400,{message:"BOOTH_TAKEN"});
      const old=entry.position_id;
      Object.assign(entry,body.p_data,{image_paths:body.p_images,updated_at:new Date(Math.max(Date.now(),Date.parse(entry.updated_at)+1)).toISOString()});
      if(old!==entry.position_id)proposals.filter((item)=>item.position_id===entry.position_id&&item.status==="pending").forEach((item)=>{item.status="rejected";item.reviewed_at=new Date().toISOString();});
      return json(res,200,{id:entry.id,position_id:entry.position_id,previous_position_id:old,updated_at:entry.updated_at});
    }
    if (url.pathname.startsWith("/storage/v1/object/booth-proposals/")) {
      const key = decodeURIComponent(url.pathname.split("/booth-proposals/")[1]);
      if (req.method === "POST") { uploads.set(key, raw); return json(res, 200, { Key: key }); }
    }
    if (url.pathname === "/storage/v1/object/booth-proposals" && req.method === "DELETE") { body.prefixes?.forEach((key) => uploads.delete(key)); return json(res, 200, []); }
    if (url.pathname === "/storage/v1/object/sign/booth-proposals") return json(res, 200, body.paths.map((path) => ({ path, signedURL: `/object/sign/booth-proposals/${path}?token=test` })));
    if (url.pathname.startsWith("/storage/v1/object/sign/booth-proposals/")) { res.writeHead(200, { "Content-Type": "image/png" }); return res.end(png); }
    return json(res, 404, { message: `Unexpected mock request ${req.method} ${url.pathname}` });
  } catch (error) { return json(res, 500, { message: error.message }); }
});
await new Promise((done) => backend.listen(0, "127.0.0.1", done));
const backendUrl = `http://127.0.0.1:${backend.address().port}`;
// Ask the OS for an unused app port without touching existing local services.
const probe = createServer(); await new Promise((done) => probe.listen(0, "127.0.0.1", done));
const port = probe.address().port; await new Promise((done) => probe.close(done));
const origin = `http://127.0.0.1:${port}`;
const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, APP_ORIGIN: origin, SUPABASE_URL: backendUrl, SUPABASE_PUBLISHABLE_KEY: "test-publishable-key", SUPABASE_SERVICE_ROLE_KEY: serviceKey, BOOTH_RATE_LIMIT_SECRET: "test-rate-limit-secret" } });
let logs = ""; app.stdout.on("data", (chunk) => logs += chunk); app.stderr.on("data", (chunk) => logs += chunk);
let browser;
let preview;
try {
  for (let i=0; i<100; i++) { try { if ((await fetch(origin)).ok) break; } catch {} await new Promise((done) => setTimeout(done, 200)); }
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const pageErrors = []; page.on("pageerror", (err) => pageErrors.push(err.message));
  const unauthorized = await fetch(`${origin}/api/booths/admin/proposals`); assert.equal(unauthorized.status, 401);
  const foreign = await fetch(`${origin}/api/booths/proposals`, { method: "POST", headers: { Origin: "https://foreign.test" } }); assert.equal(foreign.status, 403);
  await page.goto(`${origin}/booths`);
  await page.getByRole("button", { name: /^B12 —/ }).waitFor();
  assert.equal(await page.locator(".booth-map-spot").count(), 40);
  await page.getByLabel("Chọn nhanh vị trí").selectOption("12");
  await page.getByLabel("Thương hiệu / đơn vị *", { exact: true }).fill("Gốm Việt");
  await page.getByLabel("Tên gian hàng *", { exact: true }).fill("Câu chuyện đất");
  await page.locator('select[name="category"]').selectOption("Thủ công & làng nghề");
  await page.getByLabel("Người liên hệ *", { exact: true }).fill("Nguyễn An");
  await page.getByLabel("Điện thoại *", { exact: true }).fill("0901234567");
  await page.getByLabel("Email *", { exact: true }).fill("brand@example.test");
  await page.getByLabel("Website / trang thương hiệu", { exact: true }).fill("https://example.test");
  await page.getByLabel("Câu chuyện & nội dung gian hàng", { exact: true }).fill("");
  await page.locator('input[name="images"]').setInputFiles({ name: "booth.png", mimeType: "image/png", buffer: png });
  await page.locator('input[name="consent"]').check();
  await page.getByRole("button", { name: "Gửi đề xuất cho B12" }).click();
  await page.locator(".booth-reference").waitFor();
  assert.equal(proposals.length, 1); assert.equal(uploads.size, 1); assert.equal(proposals[0].status, "pending");
  assert.equal(proposals[0].description, "");
  const publicBefore = await (await fetch(`${origin}/api/booths`)).json();
  assert.equal(publicBefore.positions.find((item) => item.id === 12).is_booked, false);
  assert(!JSON.stringify(publicBefore).includes("brand@example.test"));
  const secondKey = randomUUID();
  const submitSecond = async (key = secondKey, expectedStatus = 201, positionId = "12") => {
    const form = new FormData();
    for (const [key, value] of Object.entries({ position_id: positionId, brand: "Brand Two", booth_name: "Another Booth", contact_name: "Contact Two", phone: "0901234568", email: "second@example.test", website: "", category: "Khác", description: "A second proposal for the same booth location.", consent: "true", website_confirm: "" })) form.set(key, value);
    const response = await fetch(`${origin}/api/booths/proposals`, { method: "POST", headers: { Origin: origin, "Idempotency-Key": key }, body: form });
    assert.equal(response.status, expectedStatus); return response.json();
  };
  const second = await submitSecond(), retry = await submitSecond();
  assert.equal(second.reference, retry.reference); assert.equal(proposals.length, 2);
  await submitSecond(randomUUID(),201,"13");
  const blockedReview = await fetch(`${origin}/api/booths/admin/proposals/${proposals[0].id}`, { method: "PATCH", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ decision: "approved" }) }); assert.equal(blockedReview.status, 401);
  const notAdmin = await fetch(`${origin}/api/booths/admin/login`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ email: "guest@example.test", password: "test-password" }) }); assert.equal(notAdmin.status, 403);
  const invalidFile = new FormData();
  for (const [key, value] of Object.entries({ position_id: "13", brand: "Invalid image", booth_name: "Invalid Booth", contact_name: "Test Contact", phone: "0901234567", email: "image@example.test", website: "", category: "Khác", description: "An otherwise valid proposal with an invalid image.", consent: "true", website_confirm: "" })) invalidFile.set(key, value);
  invalidFile.append("images", new Blob(["this is not a PNG"], { type: "image/png" }), "fake.png");
  const invalidResponse = await fetch(`${origin}/api/booths/proposals`, { method: "POST", headers: { Origin: origin, "Idempotency-Key": randomUUID() }, body: invalidFile });
  assert.equal(invalidResponse.status, 400); assert.equal(uploads.size, 1);
  await page.goto(`${origin}/booths/admin/login`);
  await page.getByLabel("Email quản trị").fill("admin@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Đăng nhập quản trị" }).click();
  await page.locator(".booth-admin-mode").waitFor();
  await page.getByLabel("Tài khoản quản trị", { exact: true }).click();
  await page.locator(".booth-account-popup").getByText("admin@example.test", { exact: true }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".booth-account").getAttribute("open"), null);
  await page.locator(".booth-group-overview button").filter({hasText:"B12"}).click();
  await page.locator(".booth-admin-item").first().waitFor();
  const authCookies = (await page.context().cookies()).filter((cookie) => cookie.name.includes("auth-token"));
  assert(authCookies.length > 0 && authCookies.every((cookie) => cookie.httpOnly && cookie.sameSite === "Lax"));
  assert.equal(await page.locator(".booth-admin-item").count(), 2);
  activeAdmin = false;
  const revoked = await page.evaluate(async (id) => (await fetch(`/api/booths/admin/proposals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision: "approved" }) })).status, proposals[0].id);
  assert.equal(revoked, 403); assert.equal(proposals[0].status, "pending"); activeAdmin = true;
  await page.getByRole("button", { name: /B12 · Gốm Việt/ }).click();
  await page.locator(".booth-admin-images img").waitFor();
  await page.screenshot({ path: "test-results/booths-admin.png", fullPage: true });
  await page.getByRole("button", { name: "Duyệt & chốt B12" }).click();
  await page.getByRole("button", { name: "Xác nhận duyệt", exact: true }).click();
  await page.getByRole("button", { name:"Sửa thông tin / ảnh / vị trí",exact:true }).waitFor();
  assert.equal(proposals.filter((item) => item.status === "approved").length, 1);
  assert.equal(proposals.filter((item) => item.status === "rejected").length, 1);
  await submitSecond(randomUUID(), 409);
  const originalStamp=proposals[0].updated_at;
  await page.getByRole("button", { name:"Sửa thông tin / ảnh / vị trí",exact:true }).click();
  await page.locator('.booth-edit-form input[name="brand"]').fill("Gốm Việt mới");
  await page.locator('.booth-edit-form input[name="booth_name"]').fill("Đất và tương lai");
  await page.locator('.booth-edit-form select[name="position_id"]').selectOption("13");
  await page.locator('.booth-edit-form input[name="confirm_move"]').check();
  await page.getByLabel("Giữ ảnh 1",{exact:true}).uncheck();
  await page.locator('.booth-edit-form input[name="images"]').setInputFiles({name:"updated.png",mimeType:"image/png",buffer:png});
  await page.getByRole("button",{name:"Lưu thay đổi",exact:true}).click();
  await page.locator(".booth-admin-detail h2").filter({hasText:"Đất và tương lai"}).waitFor();
  assert.equal(proposals[0].position_id,13);assert.equal(proposals[0].brand,"Gốm Việt mới");
  assert.equal(proposals[0].image_paths.length,1);assert(proposals[0].image_paths[0].startsWith("admin/"));
  assert.equal(proposals.find((item)=>item.reference!==proposals[0].reference&&item.position_id===13).status,"rejected");
  const stale=await page.evaluate(async({id,stamp})=>{
    const form=new FormData();
    for(const[key,value]of Object.entries({position_id:"12",brand:"Stale Brand",booth_name:"Stale Booth",contact_name:"Contact Test",email:"test@example.test",phone:"0901234567",website:"",category:"Khác",description:"This stale update must not overwrite the new data.",expected_updated_at:stamp,retained_images:"[]",confirm_move:"true",note:""}))form.set(key,value);
    return(await fetch(`/api/booths/admin/proposals/${id}/details`,{method:"PATCH",body:form})).status;
  },{id:proposals[0].id,stamp:originalStamp});
  assert.equal(stale,409);assert.equal(proposals[0].brand,"Gốm Việt mới");
  await page.getByLabel("Tài khoản quản trị", { exact: true }).click();
  await page.locator(".booth-account-popup").getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.getByRole("link", { name: "Đăng nhập quản trị", exact: true }).waitFor();
  await page.locator(".booth-form-card").waitFor();
  await page.goto(`${origin}/booths`);
  await page.getByLabel("Chọn nhanh vị trí").selectOption("13");
  await page.locator(".booth-reserved").waitFor();
  assert.equal(await page.getByRole("button", { name: "Gửi đề xuất cho B13" }).count(), 0);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
    await page.screenshot({ path: `test-results/booths-${width}.png`, fullPage: true });
  }
  await page.getByLabel("Chọn nhanh vị trí").selectOption("12");
  await page.screenshot({ path: "test-results/booths-mobile-form.png", fullPage: true });
  assert.deepEqual(pageErrors, []);
  const previewProbe = createServer(); await new Promise((done) => previewProbe.listen(0, "127.0.0.1", done));
  const previewPort = previewProbe.address().port; await new Promise((done) => previewProbe.close(done));
  const previewOrigin = `http://127.0.0.1:${previewPort}`;
  preview = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(previewPort)], { windowsHide: true, stdio: "ignore", env: { ...process.env, APP_ORIGIN: previewOrigin, SUPABASE_URL: "", SUPABASE_PUBLISHABLE_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "", BOOTH_RATE_LIMIT_SECRET: "" } });
  for (let i=0; i<100; i++) { try { if ((await fetch(previewOrigin)).ok) break; } catch {} await new Promise((done) => setTimeout(done, 200)); }
  const previewMap = await (await fetch(`${previewOrigin}/api/booths`)).json();
  assert.equal(previewMap.configured, false); assert.equal(previewMap.positions.length, 40);
  const previewSubmit = await fetch(`${previewOrigin}/api/booths/proposals`, { method: "POST", headers: { Origin: previewOrigin } }); assert.equal(previewSubmit.status, 503);
  await page.goto(`${previewOrigin}/booths`);
  await page.locator(".booth-map-spot").first().waitFor();
  assert(await page.locator('.booth-form-card button[type="submit"]').isDisabled());
  await page.screenshot({ path: "test-results/booths-unconfigured.png", fullPage: true });
  console.log("PASS: Next.js validation/auth/CSRF, private image upload, anonymous competing submissions, idempotent retry, admin login/approval/logout, public confirmation and responsive UI.");
} catch (error) {
  console.error(logs.slice(-4000));
  throw error;
} finally {
  if (browser) await browser.close();
  app.kill();
  preview?.kill();
  await new Promise((done) => backend.close(done));
}
