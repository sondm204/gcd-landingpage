// Real Next.js HTTP/UI against an isolated fake Supabase transport; SQL invariants run separately on PostgreSQL.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { shuffledOrders, products } from '../app/game/craft-shop/engine.ts';
import { notes } from '../app/game/rhythm/engine.ts';
import { places, roundOrder } from '../app/game/place/engine.ts';
const players=[], sessions=[], attempts=[], letters=[];
const adminId='11111111-1111-4111-8111-111111111111';
const settings={collecting_open:false,redeeming_open:false,minimum_stamps:null,reward_label:'Event gift'};
const stations=[1,2,3].map(id=>({booth_id:id,code:`TM0${id}`,name:`Heritage Booth ${id}`,zone:'Gian thương mại',enabled:true,active:true,title:null,qr_token:(String(id).repeat(64))}));
const stamps=[],redemptions=[];
const passport=p=>({card_code:p.passport_code,settings:{...settings},count:stamps.filter(s=>s.player_id===p.id).length,redemption:redemptions.find(r=>r.player_id===p.id)??null,stations:stations.filter(s=>s.enabled||stamps.some(st=>st.booth_id===s.booth_id&&st.player_id===p.id)).map(s=>({id:s.booth_id,code:s.code,name:s.title||s.name,zone:s.zone,active:s.enabled&&s.active,received_at:stamps.find(st=>st.booth_id===s.booth_id&&st.player_id===p.id)?.received_at??null}))});
const key='game-integration-server-only-key';
let loseLetterResponse=true;
const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(body));};
const error=(res,message,code='P0001')=>json(res,400,{message,code});
const backend=createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const body=chunks.length?JSON.parse(Buffer.concat(chunks).toString()):{};
    const admin={id:adminId,email:'admin@example.test',role:'authenticated',aud:'authenticated',app_metadata:{},user_metadata:{},created_at:new Date().toISOString()};
    if(url.pathname==='/auth/v1/token')return json(res,200,{access_token:`${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:adminId,aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.test`,refresh_token:'test-refresh',expires_in:3600,token_type:'bearer',user:admin});
    if(url.pathname==='/auth/v1/user')return req.headers.authorization?.includes('.test')?json(res,200,admin):json(res,401,{message:'No admin'});
    if(req.headers.apikey!==key)return json(res,403,{message:'Service role required'});
    const fn=url.pathname.replace('/rest/v1/rpc/','');
    if(fn==='booth_consume_rate_limit')return json(res,200,true);
    if(fn==='game_open_session'){
      let player=players.find(p=>p.phone===body.p_phone);
      if(!player){if(!body.p_name)return error(res,'NAME_REQUIRED');if(players.some(p=>p.name_key===body.p_name_key))return error(res,'duplicate name','23505');player={id:randomUUID(),phone:body.p_phone,name_key:body.p_name_key,display_name:body.p_name,passport_code:randomUUID().replaceAll('-','')+randomUUID().replaceAll('-','')};players.push(player);}
      sessions.push({token_hash:body.p_token_hash,player_id:player.id,expires_at:new Date(Date.now()+86400000).toISOString()});
      return json(res,200,{id:player.id,display_name:player.display_name});
    }
    if(fn==='game_start_attempt'){
      const previous=attempts.find(a=>a.player_id===body.p_player&&a.request_key===body.p_request_key);
      if(previous)return json(res,200,previous);
      const used=attempts.filter(a=>a.player_id===body.p_player&&a.game===body.p_game);
      if(used.length>=3)return error(res,'ATTEMPT_LIMIT');
      used.filter(a=>a.status==='started').forEach(a=>{a.status='abandoned';});
      const attempt={id:randomUUID(),player_id:body.p_player,game:body.p_game,mode:body.p_mode,request_key:body.p_request_key,seed:body.p_seed,attempt_number:used.length+1,status:'started',score:null,started_at:new Date().toISOString()};
      attempts.push(attempt);return json(res,200,attempt);
    }
    if(fn==='game_finish_attempt'){
      const a=attempts.find(a=>a.id===body.p_attempt&&a.player_id===body.p_player);
      if(!a)return error(res,'ATTEMPT_NOT_FOUND');
      if(a.status==='completed')return a.result_digest===body.p_digest?json(res,200,a):error(res,'RESULT_CONFLICT');
      if(a.status!=='started')return error(res,'ATTEMPT_CLOSED');
      Object.assign(a,{status:'completed',score:body.p_score,result_digest:body.p_digest,result:body.p_result});
      if(a.game==='postcard'){
        letters.push({attempt_id:a.id,player_id:a.player_id,...body.p_result});
        if(loseLetterResponse){loseLetterResponse=false;return json(res,503,{message:'Simulated lost commit response'});}
      }
      return json(res,200,a);
    }
    if(fn==='game_leaderboard'){
      const totals=players.map(p=>{
        const best={};for(const a of attempts.filter(a=>a.player_id===p.id&&a.status==='completed'))best[a.game]=Math.max(best[a.game]??0,a.score);
        return {player_id:p.id,display_name:p.display_name,best_scores:best,score:body.p_game?best[body.p_game]:Object.values(best).reduce((a,b)=>a+b,0)};
      }).filter(p=>p.score!==undefined&&Object.keys(p.best_scores).length).sort((a,b)=>b.score-a.score||a.display_name.localeCompare(b.display_name));
      const rows=totals.map(p=>({...p,rank:totals.findIndex(r=>r.score===p.score)+1,total_rows:totals.length}));
      return json(res,200,rows.slice(body.p_offset,body.p_offset+50));
    }
    if(fn.startsWith('event_passport_')){
      if(!['event_passport_state','event_passport_claim'].includes(fn)&&body.p_admin!==adminId)return error(res,'NOT_ADMIN');
      if(fn==='event_passport_state')return json(res,200,passport(players.find(p=>p.id===body.p_player)));
      if(fn==='event_passport_admin_state')return json(res,200,{settings,stations:stations.map(s=>({...s,id:s.booth_id,name:s.title||s.name,visits:stamps.filter(st=>st.booth_id===s.booth_id).length})),total_stamps:stamps.length,total_players:new Set(stamps.map(s=>s.player_id)).size,total_redemptions:redemptions.length});
      if(fn==='event_passport_claim'){
        const station=stations.find(s=>s.qr_token===body.p_token);if(!station)return error(res,'QR_INVALID');
        const existing=stamps.find(s=>s.player_id===body.p_player&&s.booth_id===station.booth_id);if(existing)return json(res,200,{reused:true,station_id:station.booth_id,received_at:existing.received_at});
        if(!settings.collecting_open)return error(res,'COLLECTION_CLOSED');if(!station.enabled)return error(res,'STATION_DISABLED');
        const stamp={player_id:body.p_player,booth_id:station.booth_id,received_at:new Date().toISOString()};stamps.push(stamp);return json(res,200,{reused:false,station_id:station.booth_id,received_at:stamp.received_at});
      }
      if(fn==='event_passport_configure'){Object.assign(settings,{collecting_open:body.p_collecting,redeeming_open:body.p_redeeming,minimum_stamps:body.p_minimum,reward_label:body.p_reward});return json(res,200,null);}
      if(fn==='event_passport_station_update'){const s=stations.find(s=>s.booth_id===body.p_id);s.enabled=body.p_enabled;s.title=body.p_title;if(body.p_rotate)s.qr_token=randomUUID().replaceAll('-','')+randomUUID().replaceAll('-','');return json(res,200,null);}
      if(fn==='event_passport_sync')return json(res,200,null);
      const player=players.find(p=>p.passport_code===body.p_card);if(!player)return error(res,'PASSPORT_NOT_FOUND');
      if(fn==='event_passport_lookup')return json(res,200,{player:{id:player.id,display_name:player.display_name},passport:passport(player)});
      if(fn==='event_passport_redeem'){
        const previous=redemptions.find(r=>r.player_id===player.id);if(previous)return json(res,200,{reused:true,redemption:previous});
        if(!settings.redeeming_open||settings.minimum_stamps===null)return error(res,'REDEMPTION_CLOSED');
        const count=passport(player).count;if(count<settings.minimum_stamps)return error(res,'NOT_ENOUGH_STAMPS');
        const redemption={player_id:player.id,stamp_count:count,reward_label:settings.reward_label,redeemed_at:new Date().toISOString()};redemptions.push(redemption);return json(res,200,{reused:false,redemption});
      }
    }
    const table=url.pathname.replace('/rest/v1/','');
    const source={game_players:players,game_sessions:sessions,game_attempts:attempts,event_passport_stations:stations,booth_admins:[{user_id:adminId,active:true}]}[table];
    if(source){
      const matches=row=>[...url.searchParams].every(([field,value])=>['select','limit','order'].includes(field)||value.startsWith('eq.')&&String(row[field])===value.slice(3)||value.startsWith('gt.')&&String(row[field])>value.slice(3));
      const rows=source.filter(matches);
      if(req.method==='DELETE'){for(const row of rows)source.splice(source.indexOf(row),1);return json(res,200,[]);}
      const fields=url.searchParams.get('select')?.split(',');
      const projected=fields?rows.map(row=>Object.fromEntries(fields.map(f=>[f,row[f]]))):rows;
      return json(res,200,req.headers.accept?.includes('vnd.pgrst.object')?projected[0]:projected);
    }
    return json(res,404,{message:'Unhandled fake endpoint'});
  }catch(e){return json(res,500,{message:e.message});}
});
await new Promise(resolve=>backend.listen(0,'127.0.0.1',resolve));
const probe=createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const origin=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{env:{...process.env,SUPABASE_URL:`http://127.0.0.1:${backend.address().port}`,SUPABASE_SERVICE_ROLE_KEY:key,SUPABASE_PUBLISHABLE_KEY:'test-publishable-key',BOOTH_RATE_LIMIT_SECRET:'test-game-rate-secret',APP_ORIGIN:origin},windowsHide:true});
let output='';child.stdout.on('data',b=>{output=(output+b).slice(-3000);});child.stderr.on('data',b=>{output=(output+b).slice(-3000);});
let browser;
try{
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch(origin+'/api/game/session')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}
  assert(ready,output);
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:390,height:740}}),page=await context.newPage();
  const consoleErrors=[];page.on('pageerror',e=>consoleErrors.push(e.message));
  const api=async(method,path,body)=>{const r=await context.request.fetch(origin+path,{method,headers:{origin},...(body===undefined?{}:{data:body})});return {status:r.status(),body:await r.json()};};
  assert.equal((await api('POST','/api/game/attempts',{game:'craft',mode:'online',request_key:randomUUID()})).status,401);
  await page.goto(origin+'/game');
  await page.getByLabel('Số điện thoại',{exact:true}).fill('0912345678');
  assert.equal(await page.getByLabel('Tên hiển thị',{exact:true}).count(),0);
  await page.getByRole('button',{name:'Tiếp tục →',exact:true}).click();
  await page.getByLabel('Tên hiển thị',{exact:true}).fill('Heritage Player');
  await page.getByRole('button',{name:'Tạo hộ chiếu →'}).click();
  await page.getByRole('heading',{name:'Xin chào, Heritage Player'}).waitFor();
  const player=players[0];assert.equal(player.phone,'+84912345678');
  assert.equal((await api('POST','/api/game/session',{phone:'+84912345678',display_name:'HERITAGE PLAYER'})).status,200);
  assert.equal(players.length,1);
  assert.equal((await api('POST','/api/game/session',{phone:'0912345678'})).status,200);
  assert.equal((await api('POST','/api/game/session',{phone:'0987654321',display_name:'Heritage Player'})).status,409);
  await page.goto(origin+'/game/postcard');
  for(let i=0;i<3;i++){
    await page.locator('.post-intro .post-primary').click();
    await page.locator('.post-editor textarea').fill('Explore Vietnam with me');
    const original=await page.locator('.post-live').elementHandle();
    await page.locator('.post-editor textarea').press('End');await page.locator('.post-editor textarea').press('!');
    assert(await original.evaluate(el=>el.isConnected));
    await page.getByRole('button',{name:'Gửi thư →',exact:true}).click();
    if(i===0){await page.getByRole('button',{name:'Thử gửi lại · không tốn thêm lượt'}).waitFor();await page.getByRole('button',{name:'Thử gửi lại · không tốn thêm lượt'}).click();}
    await page.getByRole('heading',{name:'Thư đã được gửi!'}).waitFor();
    assert.equal(letters.length,i+1);
    assert.equal(await page.locator('video').count(),0);
    await page.getByRole('button',{name:'Viết một lá thư khác'}).click();
  }
  assert(await page.locator('.post-intro .post-primary').isDisabled());
  assert.equal((await api('POST','/api/game/attempts',{game:'postcard',mode:'event',request_key:randomUUID()})).status,409);
  const savedLetters=await api('GET','/api/game/leaderboard?game=postcard');assert.equal(savedLetters.body.entries[0].score,100);
  await page.clock.install();
  await page.goto(origin+'/game/craft-shop');await page.getByRole('button',{name:'Mở cửa tiệm →'}).click();
  await page.locator('.craft-stats').waitFor();
  const activeCraft=attempts.findLast(a=>a.game==='craft');activeCraft.started_at=new Date(Date.now()-65000).toISOString();
  const orderItems=await page.locator('.craft-waiting-customer').first().locator('.craft-order-items li').evaluateAll(items=>items.map(item=>item.getAttribute('data-product')));
  for(const id of orderItems)await page.getByRole('button',{name:`Thêm ${products.find(p=>p.id===id).name}`,exact:true}).click();
  await page.getByRole('button',{name:'Giao hàng →',exact:true}).click();
  await page.clock.fastForward(60000);
  await page.locator('.game-run-result').getByText(/Đã lưu/).waitFor();assert.equal(activeCraft.score,10);
  await page.goto(origin+'/game/dong-ho');await page.getByRole('button',{name:'Mở ván in →'}).click();
  await page.locator('.print-board').waitFor();
  const activePrint=attempts.findLast(a=>a.game==='print');activePrint.started_at=new Date(Date.now()-185000).toISOString();
  await page.clock.fastForward(180400);
  await page.locator('.game-run-result').getByText(/Đã lưu/).waitFor();assert.equal(activePrint.score,0);
  const open=async game=>{const key=randomUUID();const first=await api('POST','/api/game/attempts',{game,mode:'online',request_key:key});assert.equal(first.status,201);const retry=await api('POST','/api/game/attempts',{game,mode:'online',request_key:key});assert.equal(retry.body.attempt.id,first.body.attempt.id);const a=attempts.find(a=>a.id===first.body.attempt.id);a.started_at=new Date(Date.now()-240000).toISOString();return first.body.attempt;};
  const craft=await open('craft');
  assert.equal((await api('POST',`/api/game/attempts/${craft.id}`,{score:10000})).status,400);
  assert.equal((await api('POST',`/api/game/attempts/${craft.id}`,[{type:'start',now:0,seed:craft.seed,orders:shuffledOrders(craft.seed)},{type:'tick',now:60000}])).body.score,0);
  const print=await open('print');assert.equal((await api('POST',`/api/game/attempts/${print.id}`,[{type:'start',seed:print.seed,now:0},{type:'tick',now:180000}])).body.score,0);
  const rhythm=await open('rhythm');
  const actions=[{type:'start'},...notes.flatMap(n=>[{type:'hit',lane:n.lane,elapsed:n.at},{type:'release',lane:n.lane,elapsed:n.at+(n.duration||1)}]).sort((a,b)=>a.elapsed-b.elapsed),{type:'tick',elapsed:60000}];
  const rhythmResult=await api('POST',`/api/game/attempts/${rhythm.id}`,actions);assert.equal(rhythmResult.status,200,JSON.stringify(rhythmResult));assert.equal(rhythmResult.body.score,300);
  const place=await open('place'),order=roundOrder(place.seed),placeActions=[{type:'start',seed:place.seed}];
  order.forEach((index,i)=>placeActions.push({type:'loaded',now:i*1000},{type:'pin',now:i*1000+1,point:places[index].point},{type:'submit',now:i*1000+2},{type:'next'}));
  assert.equal((await api('POST',`/api/game/attempts/${place.id}`,placeActions)).body.score,300);
  const board=await api('GET','/api/game/leaderboard');assert.equal(board.body.entries[0].score,710);assert(!JSON.stringify(board).includes('phone'));assert(!JSON.stringify(board).includes(player.phone));
  await page.goto(origin+'/game/leaderboard');await page.getByRole('cell',{name:'710',exact:true}).waitFor();
  await page.screenshot({path:'test-results/game-leaderboard-mobile.png'});
  await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();
  await page.goto(origin+'/game/rhythm');await page.getByRole('heading',{name:'Nhập tài khoản để bắt đầu'}).waitFor();
  assert.equal((await api('POST',`/api/game/attempts/${rhythm.id}`,actions)).status,401);
  assert.equal((await api('GET','/api/game/passport/admin')).status,401);
  assert.equal((await api('POST','/api/game/passport/claim',{code:stations[0].qr_token})).status,401);
  const adminContext=await browser.newContext({viewport:{width:1280,height:900}}),adminPage=await adminContext.newPage();
  await adminPage.goto(origin+'/game/admin#card='+player.passport_code);
  await adminPage.getByRole('link',{name:'Đăng nhập quản trị →'}).click();
  await adminPage.getByLabel('Email quản trị').fill('admin@example.test');
  await adminPage.getByLabel('Mật khẩu',{exact:true}).fill('test-only-password');
  await adminPage.getByRole('button',{name:'Đăng nhập quản trị'}).click();
  await adminPage.getByRole('heading',{name:'Điều phối sự kiện'}).waitFor();
  await adminPage.getByLabel('Mở nhận dấu',{exact:true}).check();
  await adminPage.getByLabel('Mở đổi quà',{exact:true}).check();
  await adminPage.getByLabel('Số dấu tối thiểu').fill('2');
  await adminPage.getByRole('button',{name:'Lưu cấu hình',exact:true}).click();
  await adminPage.getByText('Đã lưu cấu hình passport.').waitFor();
  const qr=await adminContext.request.get(origin+'/api/game/passport/admin/qr/1');assert.equal(qr.status(),200);assert((await qr.text()).includes('<svg'));
  await page.goto(origin+'/game/check-in#code='+stations[0].qr_token);
  await page.getByLabel('Số điện thoại',{exact:true}).fill('0912345678');
  await page.getByRole('button',{name:'Tiếp tục →',exact:true}).click();
  await page.getByRole('heading',{name:'Một dấu hẹn mới!'}).waitFor();
  assert.equal(await page.getByLabel('Tên hiển thị',{exact:true}).count(),0);
  assert.equal(stamps.length,1);
  await page.reload();await page.getByRole('heading',{name:'Dấu hẹn đã có trong hộ chiếu!'}).waitFor();assert.equal(stamps.length,1);
  await page.goto(origin+'/game/check-in#code='+stations[1].qr_token);
  await page.getByText('2 con dấu đã nhận',{exact:true}).waitFor();assert.equal(stamps.length,2);
  await page.goto(origin+'/game?tab=event');await page.getByRole('heading',{name:'Những trang dấu của bạn'}).waitFor();
  assert.equal(await page.locator('.game-stageCard, .game-account-games').count(),0);
  assert.equal(await page.locator('.passport-station[data-stamped=true]').count(),2);
  const publicPassport=await api('GET','/api/game/passport');assert(!JSON.stringify(publicPassport.body).includes('qr_token'));
  const cardImage=page.locator('.passport-reward-card img');await cardImage.scrollIntoViewIfNeeded();
  await cardImage.evaluate(img=>img.decode());assert(await cardImage.evaluate(img=>img.naturalWidth>0));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'test-results/event-passport-mobile.png',fullPage:true});
  await adminPage.reload();await adminPage.getByRole('button',{name:'Xác nhận trao quà',exact:true}).waitFor();
  assert(await adminPage.getByRole('button',{name:'Xác nhận trao quà',exact:true}).isEnabled());
  await adminPage.getByRole('button',{name:'Xác nhận trao quà',exact:true}).click();
  await adminPage.getByRole('button',{name:'Đã trao quà, xác nhận'}).click();
  await adminPage.getByText(/Đã xác nhận trao quà/).waitFor();assert.equal(redemptions.length,1);
  const again=await adminContext.request.post(origin+'/api/game/passport/admin',{headers:{origin},data:{action:'redeem',card:player.passport_code}});assert.equal((await again.json()).reused,true);assert.equal(redemptions.length,1);
  await page.getByRole('button',{name:'Cập nhật hộ chiếu'}).click();await page.getByText('Món quà đã được trao.',{exact:true}).waitFor();
  assert.equal((await api('GET','/api/game/leaderboard')).body.entries[0].score,710);
  await adminPage.locator('.passport-admin-station').first().locator('summary').click();
  await adminPage.locator('.passport-admin-station img').first().evaluate(img=>img.decode());
  await adminPage.evaluate(()=>{window.print=()=>{window.__printed=true;};});
  await adminPage.getByRole('button',{name:'In toàn bộ QR đang bật'}).click();
  await adminPage.waitForFunction(()=>window.__printed===true);
  assert.equal(await adminPage.locator('.passport-print-sheet article').count(),3);
  await adminPage.evaluate(()=>window.scrollTo(0,0));
  await adminPage.screenshot({path:'test-results/passport-admin.png',fullPage:true});
  await adminContext.close();
  assert.deepEqual(consoleErrors,[]);
  console.log('PASS: phone-first registration/login, game replay, QR check-in after login, duplicate stamps, event-only passport tab, authenticated admin QR, gift threshold and exactly-once redemption.');
}finally{if(browser)await browser.close();child.kill();backend.close();}
