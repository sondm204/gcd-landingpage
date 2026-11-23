// Production Next.js routes and UI against local fake Supabase. No production data.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import ExcelJS from 'exceljs';
import { conceptPositions } from '../lib/booths/types.ts';

const serviceKey = 'admin-export-test-service', adminId = '11111111-1111-4111-8111-111111111111';
let activeAdmin = true, failQuery = false, inflatedCount = false, rowCap = 1000;
const user = { id: adminId, email: 'admin@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
const jwt = () => `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:adminId,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.test`;
const attendees = Array.from({length:1105},(_,i)=>({id:randomUUID(),reference:`GCD2026-${String(i).padStart(12,'0')}`,full_name:i===0?'=HYPERLINK("unsafe")':`Nguyen An ${String(i).padStart(4,'0')}`,birth_date:'2001-02-28',phone:`+849${String(i).padStart(8,'0')}`,email:`person${i}@example.test`,facebook_url:`https://facebook.com/person${i}`,is_jci:i%2===0,chapter:i%2===0?'JCI Ha Noi':'',created_at:`2026-01-0${i%2+1}T10:00:00Z`,fingerprint:'must-never-leak',request_key:'must-never-leak'}));
const proposals = Array.from({length:1105},(_,i)=>({id:randomUUID(),reference:`GCD-${i}`,position_id:i%40+1,brand:i===0?'=SUM(1,2)':`Brand ${i}`,booth_name:`Booth ${i}`,status:['pending','approved','rejected'][i%3],contact_name:'Contact Name',phone:'0912345678',email:`booth${i}@example.test`,website:'https://example.test',category:'Culture',description:'Brand description',image_paths:[],payment:{base:800000,discount:100000,amount:700000,discount_code:'WELCOME',memo:'TRANSFER',receipt_path:i%2?'private/receipt.png':null},created_at:'2026-01-01T10:00:00Z',updated_at:'2026-01-02T10:00:00Z',reviewed_at:null,review_note:null}));
const json = (res,status,data,headers={}) => {res.writeHead(status,{'Content-Type':'application/json',...headers});res.end(JSON.stringify(data));};
const requests = [];
function selectRows(url,source) {
  let rows=[...source];
  for(const key of ['is_jci','status','position_id'])if(url.searchParams.has(key))rows=rows.filter(r=>String(r[key])===url.searchParams.get(key).slice(3));
  for(const filter of url.searchParams.getAll('created_at')) { const [op,...rest]=filter.split('.'),value=rest.join('.');rows=rows.filter(r=>op==='gte'?Date.parse(r.created_at)>=Date.parse(value):Date.parse(r.created_at)<=Date.parse(value)); }
  const search=url.searchParams.get('or');
  if(search){const fields=[...search.matchAll(/(\w+)\.ilike\."%([^"%]*)%"/g)].map(m=>[m[1],m[2].replaceAll('\\_','_').toLowerCase()]);rows=rows.filter(r=>fields.some(([field,term])=>String(r[field]||'').toLowerCase().includes(term)));}
  const ascending=url.searchParams.get('order')?.startsWith('created_at.asc');
  rows.sort((a,b)=>(Date.parse(a.created_at)-Date.parse(b.created_at))*(ascending?1:-1)||a.id.localeCompare(b.id));
  const total=inflatedCount?20001:rows.length,offset=Number(url.searchParams.get('offset')||0),limit=Math.min(rowCap,Number(url.searchParams.get('limit')||1000)),columns=url.searchParams.get('select').split(',');
  return {rows:rows.slice(offset,offset+limit).map(r=>Object.fromEntries(columns.map(k=>[k,r[k]]))),total,offset};
}
const backend=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost'),chunks=[];for await(const part of req)chunks.push(part);const body=chunks.length?JSON.parse(Buffer.concat(chunks).toString()):{};
    if(url.pathname==='/auth/v1/token')return json(res,200,{access_token:jwt(),refresh_token:'test-refresh',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user});
    if(url.pathname==='/auth/v1/user')return req.headers.authorization?json(res,200,user):json(res,401,{message:'Unauthorized'});
    if(url.pathname==='/auth/v1/logout'){res.writeHead(204);return res.end();}
    if(req.headers.apikey!==serviceKey)return json(res,403,{message:'Service role required'});
    if(url.pathname==='/rest/v1/rpc/booth_consume_rate_limit')return json(res,200,true);
    if(url.pathname==='/rest/v1/booth_admins')return json(res,200,activeAdmin?[{user_id:adminId}]:[]);
    if(url.pathname==='/rest/v1/booth_public_map')return json(res,200,conceptPositions());
    if(url.pathname==='/rest/v1/booth_vouchers')return json(res,200,[]);
    if(['/rest/v1/event_registrations','/rest/v1/booth_proposals'].includes(url.pathname)){
      requests.push(url);if(failQuery)return json(res,503,{message:'Test backend unavailable'});
      const {rows,total,offset}=selectRows(url,url.pathname.endsWith('event_registrations')?attendees:proposals);
      return json(res,200,rows,{'Content-Range':`${offset}-${offset+rows.length-1}/${total}`});
    }
    throw new Error(`Unexpected backend path ${url.pathname} ${Object.keys(body)}`);
  }catch(error){console.error(error);return json(res,500,{message:'Fake backend failure'});}
});
await new Promise(done=>backend.listen(0,'127.0.0.1',done));
const probe=createServer();await new Promise(done=>probe.listen(0,'127.0.0.1',done));const port=probe.address().port;await new Promise(done=>probe.close(done));
const origin=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{windowsHide:true,env:{...process.env,SUPABASE_URL:`http://127.0.0.1:${backend.address().port}`,SUPABASE_PUBLISHABLE_KEY:'test-publishable',SUPABASE_SERVICE_ROLE_KEY:serviceKey,BOOTH_RATE_LIMIT_SECRET:'test-export-secret',APP_ORIGIN:origin}});
let logs='',browser;child.stdout.on('data',v=>logs+=v);child.stderr.on('data',v=>logs+=v);
async function workbook(response) {assert.equal(response.status(),200);assert.match(response.headers()['content-type'],/spreadsheetml/);assert.match(response.headers()['cache-control'],/no-store/);const book=new ExcelJS.Workbook();await book.xlsx.load(await response.body());return book;}
try{
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch(origin+'/register/admin')).ok){ready=true;break;}}catch{}await new Promise(done=>setTimeout(done,200));}assert(ready,logs);
  browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const path of ['/api/registrations/admin','/api/registrations/admin/export','/api/booths/admin/proposals/export'])assert.equal((await page.request.get(origin+path)).status(),401);
  await page.goto(origin+'/en/register/admin');await expect(page.getByRole('heading',{name:'Admin access required'})).toBeVisible();
  assert.match(await page.locator('meta[name=robots]').getAttribute('content'),/noindex/);
  await page.locator('.registration-admin-login').getByRole('link',{name:'Admin sign-in'}).click();await expect(page).toHaveURL(origin+'/en/register/admin/login');
  await page.locator('[name=email]').fill('admin@example.test');await page.locator('[name=password]').fill('test-password-123');await page.locator('.booth-login button[type=submit]').click();await expect(page).toHaveURL(origin+'/en/register/admin');
  await expect(page.locator('.registration-results-toolbar strong')).toHaveText('1105 registrations');await expect(page.locator('.registration-table tbody tr')).toHaveCount(20);
  const firstReference=await page.locator('.registration-table tbody tr').first().locator('code').textContent();
  await page.getByRole('button',{name:'Next →',exact:true}).click();await expect(page.locator('.registration-pagination')).toContainText('Page 2 / 56');await expect(page.locator('.registration-table tbody tr').first().locator('code')).not.toHaveText(firstReference);
  const apply=()=>page.getByRole('button',{name:'Apply filters',exact:true}).click();
  await page.getByLabel('Records per page').selectOption('50');await apply();await expect(page.locator('.registration-table tbody tr')).toHaveCount(50);await expect(page.locator('.registration-pagination')).toContainText('Page 1 / 23');
  await page.getByLabel('Search registrations',{exact:true}).fill('JCI Ha Noi');await page.getByLabel('Active in JCI').selectOption('yes');await apply();await expect(page.locator('.registration-results-toolbar strong')).toHaveText('553 registrations');
  await page.getByLabel('Registered from',{exact:true}).fill('2026-01-01');await page.getByLabel('Until',{exact:true}).fill('2026-01-01');await apply();await expect(page.locator('.registration-results-toolbar strong')).toHaveText('553 registrations');
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export filtered Excel',exact:true}).click()]);assert.match(download.suggestedFilename(),/^GCD2026-attendees-.*\.xlsx$/);
  const downloaded=new ExcelJS.Workbook();await downloaded.xlsx.load(readFileSync(await download.path()));assert.equal(downloaded.worksheets[0].rowCount,554);assert.equal(downloaded.worksheets[0].getRow(1).getCell(1).value,'Reference');
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();await expect(page.locator('.registration-results-toolbar strong')).toHaveText('1105 registrations');
  const response=await page.request.get(origin+'/api/registrations/admin?page=2&page_size=100&sort=oldest');assert.equal(response.status(),200);const data=await response.json();assert.equal(data.total,1105);assert.equal(data.registrations.length,100);assert(!JSON.stringify(data).includes('must-never-leak'));
  const localPhone=await (await page.request.get(origin+'/api/registrations/admin?q=0900000000')).json();assert.equal(localPhone.total,1);assert.equal(localPhone.registrations[0].phone,'+84900000000');
  const book=await workbook(await page.request.get(origin+'/api/registrations/admin/export?locale=vi&page=2&page_size=20'));assert.equal(book.worksheets[0].rowCount,1106);assert.equal(book.worksheets[0].getRow(1).getCell(1).value,'Mã đăng ký');
  const formulaRow=book.worksheets[0].getRows(2,1105).find(row=>row.getCell(2).value==='=HYPERLINK("unsafe")');assert(formulaRow);assert.equal(formulaRow.getCell(2).type,ExcelJS.ValueType.String);assert.equal(formulaRow.getCell(2).formula,undefined);assert.equal(formulaRow.getCell(4).value,'+84900000000');assert.equal(formulaRow.getCell(3).value,'28/02/2001');assert.equal(formulaRow.getCell(4).numFmt,'@');assert(book.worksheets[0].autoFilter);assert.equal(book.worksheets[0].views[0].state,'frozen');
  const boothBook=await workbook(await page.request.get(origin+'/api/booths/admin/proposals/export?locale=en'));assert.equal(boothBook.worksheets[0].rowCount,1106);assert.equal(boothBook.worksheets[0].getRow(1).getCell(15).value,'Amount due (VND)');const boothRow=boothBook.worksheets[0].getRows(2,1105).find(row=>row.getCell(4).value==='=SUM(1,2)');assert.equal(boothRow.getCell(4).type,ExcelJS.ValueType.String);assert.equal(boothRow.getCell(8).value,'0912345678');assert.equal(boothRow.getCell(15).value,700000);assert.equal(boothRow.getCell(15).type,ExcelJS.ValueType.Number);assert(!JSON.stringify(boothBook.model).includes('private/receipt.png'));
  const filteredBook=await workbook(await page.request.get(origin+'/api/booths/admin/proposals/export?status=approved&position=2'));assert.equal(filteredBook.worksheets[0].rowCount,proposals.filter(r=>r.status==='approved'&&r.position_id===2).length+1);
  rowCap=100;const cappedBook=await workbook(await page.request.get(origin+'/api/registrations/admin/export?jci=yes'));assert.equal(cappedBook.worksheets[0].rowCount,554);rowCap=1000;
  for(const query of ['page=0','page_size=21','jci=invalid','from=2026-02-30','from=2026-02-01&to=2026-01-01'])assert.equal((await page.request.get(origin+'/api/registrations/admin?'+query)).status(),400);
  assert.equal((await page.request.get(origin+'/api/booths/admin/proposals/export?position=41')).status(),400);
  inflatedCount=true;assert.equal((await page.request.get(origin+'/api/registrations/admin/export')).status(),400);inflatedCount=false;
  failQuery=true;assert.equal((await page.request.get(origin+'/api/registrations/admin')).status(),503);assert.equal((await page.request.get(origin+'/api/registrations/admin/export')).status(),503);failQuery=false;
  await page.getByLabel('Search registrations',{exact:true}).fill('No matches');await apply();await expect(page.locator('.registration-table')).toContainText('No registrations match these filters.');
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();await expect(page.locator('.registration-results-toolbar strong')).toHaveText('1105 registrations');
  mkdirSync('test-results',{recursive:true});await page.locator('.registration-admin').screenshot({path:'test-results/registration-admin-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:'test-results/registration-admin-mobile.png',fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Only the table, not the entire page, should scroll horizontally.');
  await page.setViewportSize({width:1440,height:1000});await page.goto(origin+'/en/booths');await expect(page.getByRole('button',{name:'Export booth Excel',exact:true})).toBeVisible();
  const [boothDownload]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export booth Excel',exact:true}).click()]);assert.match(boothDownload.suggestedFilename(),/booths.*\.xlsx$/);
  await page.locator('.booth-admin-toolbar').getByRole('link',{name:'Attendees'}).click();await expect(page).toHaveURL(origin+'/en/register/admin');await expect(page.locator('.registration-results-toolbar strong')).toHaveText('1105 registrations');
  activeAdmin=false;for(const path of ['/api/registrations/admin','/api/registrations/admin/export','/api/booths/admin/proposals/export'])assert.equal((await page.request.get(origin+path)).status(),403);
  await page.getByRole('button',{name:'Reload',exact:true}).click();await expect(page.getByRole('heading',{name:'Admin access required'})).toBeVisible();assert(!await page.locator('.registration-admin').textContent().then(text=>text.includes('@example.test')));
  assert(requests.some(url=>url.searchParams.get('offset')==='1000'),'Exports must fetch beyond the Supabase 1000-row default');assert.deepEqual(errors,[]);
  console.log('PASS: admin login/role checks, pagination, filters, mobile layout, XLSX downloads, 1105-row exports, formula-safe strings, phone formatting, numeric fees, empty/error states and revoked access.');
}catch(error){console.error(logs.slice(-2500));throw error;}finally{if(browser)await browser.close();child.kill();backend.close();}
