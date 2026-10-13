import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {setTimeout as delay} from 'node:timers/promises';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
test('quatro salas isoladas, controle privado, transmissão somente leitura e reinício persistente',async()=>{
 const port=18789,base=`http://127.0.0.1:${port}`,secret='test-only-secret-not-for-production-12345678';
 const tempRoot=path.resolve('.test-data');fs.mkdirSync(tempRoot,{recursive:true});const dataDir=fs.mkdtempSync(path.join(tempRoot,'corrida-online-test-'));
 let child;let logs='';
 async function start(){logs='';child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port),APP_SECRET:secret,DATA_DIR:dataDir,NODE_ENV:'test'},stdio:['ignore','pipe','pipe']});child.stderr.on('data',b=>logs+=b);child.stdout.on('data',b=>logs+=b);for(let i=0;i<50;i++){try{if((await fetch(base+'/health')).ok)return;}catch{}await delay(100);}throw Error(logs||'Servidor não iniciou');}
 async function stop(){if(!child)return;const p=child;child=null;const done=new Promise(resolve=>p.once('exit',resolve));p.kill();await done;}
 const get=async url=>(await fetch(url)).json();
 const bootstrap=async room=>get(room.panel+'api/bootstrap');
 const post=async(room,boot,tail,payload={},expected=200)=>{const r=await fetch(room.panel+'api/'+tail,{method:'POST',headers:{Origin:base,'X-Studio-Token':boot.token,'Content-Type':'application/json'},body:JSON.stringify(payload)});const result=await r.json();assert.equal(r.status,expected,JSON.stringify(result));return result;};
 try{
  await start();assert.equal((await fetch(base+'/api/admin')).status,401);
  const result=await(await fetch(base+'/api/admin',{headers:{'X-Admin-Key':secret}})).json();assert.equal(result.rooms.length,4);
  const [a,b]=result.rooms,ba=await bootstrap(a),bb=await bootstrap(b);assert.notEqual(a.panel,b.panel);assert.notEqual(a.panel,a.overlay);
  assert.equal((await fetch(base+'/api/bootstrap')).status,404);assert.equal((await fetch(a.overlay+'api/bootstrap')).status,403);
  assert.equal((await fetch(a.overlay+'api/demo',{method:'POST',body:'{}'})).status,403);
  assert.equal((await fetch(a.panel.replace('sala1','sala2')+'api/state')).status,401);
  assert.equal((await fetch(a.panel+'api/demo',{method:'POST',headers:{Origin:'https://evil.test','X-Studio-Token':ba.token},body:'{}'})).status,403);
  await post(a,ba,'demo',{enabled:true});await post(b,bb,'demo',{enabled:true});await post(a,ba,'test',{type:'comment',text:'1'});await post(a,ba,'test',{type:'gift',name:'Rose',count:3,giftType:1,repeatEnd:true});
  assert.equal((await get(a.overlay+'api/state')).coins.lula,3);assert.equal((await get(b.overlay+'api/state')).coins.lula,0);
  await post(b,ba,'test',{type:'comment',text:'2'},403);
  const stream=await fetch(a.overlay+'api/stream');assert.match(stream.headers.get('content-type'),/event-stream/);const reader=stream.body.getReader(),chunk=await reader.read();assert(new TextDecoder().decode(chunk.value).includes('"lula":3'));await reader.cancel();
  const panel=await(await fetch(a.panel)).text();assert(panel.includes('/client.js'));assert(panel.includes('restore-backup'));
  const saved={...ba.config,title:'MINHA SALA',baseSpeed:1.2};await post(a,ba,'config',saved);
  assert.equal((await bootstrap(b)).config.title,bb.config.title);
  assert.equal((await fetch(base+'/server.mjs')).status,404);assert.equal((await fetch(base+'/data/sala1.json')).status,404);
  await stop();await start();const again=await(await fetch(base+'/api/admin',{headers:{'X-Admin-Key':secret}})).json();assert.equal(again.rooms[0].panel,a.panel);assert.equal((await bootstrap(a)).config.title,'MINHA SALA');assert.equal((await get(a.overlay+'api/state')).saved,true);
 }finally{await stop();const checked=path.resolve(dataDir);assert(checked.startsWith(tempRoot+path.sep)&&path.basename(checked).startsWith('corrida-online-test-'));fs.rmSync(checked,{recursive:true,force:true});}
});
