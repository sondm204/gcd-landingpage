import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';
const records=[],serviceKey='registration-test-service-key';let loseResponse=true;
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
const backend=createServer(async(req,res)=>{
  const chunks=[];for await(const part of req)chunks.push(part);const input=chunks.length?JSON.parse(Buffer.concat(chunks).toString()):{};
  if(req.headers.apikey!==serviceKey)return json(res,403,{message:'Service role required'});
  if(req.url==='/rest/v1/rpc/booth_consume_rate_limit')return json(res,200,true);
  if(req.url==='/rest/v1/rpc/register_event_attendee'){
    const previous=records.find(r=>r.request_key===input.p_request_key);
    if(previous)return previous.fingerprint===input.p_fingerprint?json(res,200,{reference:previous.reference,reused:true}):json(res,400,{message:'REQUEST_KEY_REUSED'});
    if(records.some(r=>r.phone===input.p_data.phone||r.email===input.p_data.email))return json(res,409,{code:'23505',message:'Duplicate contact'});
    const saved={...input.p_data,request_key:input.p_request_key,fingerprint:input.p_fingerprint,reference:`GCD2026-TEST${String(records.length+1).padStart(6,'0')}`};records.push(saved);
    if(loseResponse){loseResponse=false;return json(res,503,{message:'Response lost after commit'});}
    return json(res,200,{reference:saved.reference,reused:false});
  }
  return json(res,404,{message:'Unexpected test backend endpoint'});
});
await new Promise(done=>backend.listen(0,'127.0.0.1',done));
const portProbe=createServer();await new Promise(done=>portProbe.listen(0,'127.0.0.1',done));const port=portProbe.address().port;await new Promise(done=>portProbe.close(done));
const origin=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{windowsHide:true,env:{...process.env,SUPABASE_URL:`http://127.0.0.1:${backend.address().port}`,SUPABASE_PUBLISHABLE_KEY:'test-publishable',SUPABASE_SERVICE_ROLE_KEY:serviceKey,BOOTH_RATE_LIMIT_SECRET:'test-registration-secret',APP_ORIGIN:origin}});
let logs='',browser;child.stdout.on('data',v=>logs+=v);child.stderr.on('data',v=>logs+=v);
try{
  let ready=false;for(let i=0;i<80;i++){try{if((await fetch(origin+'/en')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}assert(ready,logs);
  browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/en');await expect(page.locator('.cloud-intro')).toHaveCount(0,{timeout:15000});
  await expect(page.locator('#event-registration')).toHaveCount(0);await page.getByRole('button',{name:'Open menu',exact:true}).click();await page.getByRole('link',{name:'Plan your journey',exact:true}).click();await expect(page).toHaveURL(origin+'/en/register');
  const form=page.locator('#event-registration form');await expect(form.locator('[name=full_name]')).toBeVisible();assert.equal((await page.request.get(origin+'/register')).status(),200);
  await expect(form.locator('[name=chapter]')).toHaveCount(0);await form.locator('[name=is_jci]').selectOption('yes');await expect(form.locator('[name=chapter]')).toHaveAttribute('required','');
  await form.locator('[name=is_jci]').selectOption('no');await expect(form.locator('[name=chapter]')).toHaveCount(0);
  await form.locator('[name=full_name]').fill('Nguyen An');await form.locator('[name=birth_date]').fill('2001-02-28');await form.locator('[name=phone]').fill('0912345678');await form.locator('[name=email]').fill(' AN@GMAIL.COM ');await form.locator('[name=facebook_url]').fill('facebook.com/nguyen.an');
  await form.locator('[name=is_jci]').selectOption('yes');await form.locator('[name=chapter]').fill('JCI Ha Noi');await form.locator('[name=consent]').check();
  assert(await page.locator('#event-registration').evaluate(el=>{const bounds=el.getBoundingClientRect();return bounds.x>=0&&bounds.right<=innerWidth&&Array.from(el.querySelectorAll('input,select,button')).every(control=>control.getBoundingClientRect().right<=bounds.right);}),'Registration fields must fit the phone');
  mkdirSync('test-results',{recursive:true});await page.locator('#event-registration').screenshot({path:'test-results/event-registration-mobile.png'});
  await form.getByRole('button',{name:'Submit registration',exact:true}).click();await expect(page.locator('.registration-alert')).toBeVisible();assert.equal(records.length,1);
  await form.getByRole('button',{name:'Submit registration',exact:true}).click();await expect(page.locator('.registration-success')).toContainText(records[0].reference);assert.equal(records.length,1);assert.equal(records[0].phone,'+84912345678');assert.equal(records[0].email,'an@gmail.com');assert.equal(records[0].chapter,'JCI Ha Noi');
  const payload={full_name:'Nguyen An',birth_date:'2001-02-28',phone:'0912345678',email:'an@gmail.com',facebook_url:'https://facebook.com/nguyen.an',is_jci:false,chapter:'',consent:true,website_confirm:''};
  const post=(data,key=randomUUID(),requestOrigin=origin)=>page.request.post(origin+'/api/registrations',{headers:{Origin:requestOrigin,'Idempotency-Key':key},data});
  assert.equal((await post(payload)).status(),409);assert.equal((await post({...payload,phone:'0987654321'})).status(),409);
  assert.equal((await post({...payload,birth_date:'2999-01-01'})).status(),400);assert.equal((await post({...payload,is_jci:true,chapter:''})).status(),400);assert.equal((await post({...payload,facebook_url:'https://evilfacebook.com/an'})).status(),400);assert.equal((await post(payload,randomUUID(),'https://other.test')).status(),403);
  const fresh={...payload,phone:'0987654321',email:'new@gmail.com'};const second=await post(fresh);assert.equal(second.status(),201);assert.equal(records.length,2);assert.equal(records[1].chapter,'');
  const reused=await post({...payload,full_name:'Changed'},records[0].request_key);assert.equal(reused.status(),409);
  assert.equal((await page.request.get(origin+'/api/registrations')).status(),405);assert.deepEqual(errors,[]);
  console.log('PASS: public registration UI, conditional JCI chapter, mobile layout, lost-response retry, contact uniqueness, validation, origin protection and no public listing.');
}catch(error){console.error(logs.slice(-1500));throw error;}finally{if(browser)await browser.close();child.kill();backend.close();}
