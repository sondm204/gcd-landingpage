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
const key='game-integration-server-only-key';
let loseLetterResponse=true;
const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(body));};
const error=(res,message,code='P0001')=>json(res,400,{message,code});
const backend=createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const body=chunks.length?JSON.parse(Buffer.concat(chunks).toString()):{};
    if(req.headers.apikey!==key)return json(res,403,{message:'Service role required'});
    const fn=url.pathname.replace('/rest/v1/rpc/','');
    if(fn==='booth_consume_rate_limit')return json(res,200,true);
    if(fn==='game_open_session'){
      let player=players.find(p=>p.phone===body.p_phone);
      if(player&&player.name_key!==body.p_name_key)return error(res,'ACCOUNT_MISMATCH');
      if(!player){if(players.some(p=>p.name_key===body.p_name_key))return error(res,'duplicate name','23505');player={id:randomUUID(),phone:body.p_phone,name_key:body.p_name_key,display_name:body.p_name};players.push(player);}
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
    const table=url.pathname.replace('/rest/v1/','');
    const source={game_players:players,game_sessions:sessions,game_attempts:attempts}[table];
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
  await page.getByLabel('Tên hiển thị',{exact:true}).fill('Heritage Player');
  await page.getByRole('button',{name:'Vào hành trình →'}).click();
  await page.getByRole('heading',{name:'Xin chào, Heritage Player'}).waitFor();
  const player=players[0];assert.equal(player.phone,'+84912345678');
  assert.equal((await api('POST','/api/game/session',{phone:'+84912345678',display_name:'HERITAGE PLAYER'})).status,200);
  assert.equal(players.length,1);
  assert.equal((await api('POST','/api/game/session',{phone:'0912345678',display_name:'Wrong Name'})).status,409);
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
  assert.deepEqual(consoleErrors,[]);
  console.log('PASS: actual Next.js account cookies, uniqueness, login gate, idempotent starts, 3-letter limit, retry after committed error, private leaderboards and server replay for all four scored games.');
}finally{if(browser)await browser.close();child.kill();backend.close();}
