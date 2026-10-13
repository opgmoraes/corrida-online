import test from 'node:test';import assert from 'node:assert/strict';import {EventEmitter} from 'node:events';import {setTimeout as delay} from 'node:timers/promises';import {Engine} from '../engine.mjs';import {TikTokAdapter} from '../tiktok.mjs';
class Mock extends EventEmitter{static clients=[];constructor(user,options){super();this.user=user;this.options=options;Mock.clients.push(this);}async connect(){this.emit('connected',{});}async disconnect(){}}
test('adaptador normaliza eventos atuais, espera final de sequência e rejeita cliente antigo',async()=>{
 const e=new Engine(),a=new TikTokAdapter(e,async()=>({TikTokLiveConnection:Mock}));
 await a.watch('conta1');await delay(0);const c=Mock.clients.at(-1);assert(e.live);assert.equal(c.options.processInitialData,false);
 c.emit('chat',{user:{uniqueId:'ana'},comment:'1',common:{msgId:'comment1'}});
 c.emit('gift',{user:{uniqueId:'ana'},giftDetails:{giftName:'Rose',giftType:1},giftId:1,repeatCount:5,repeatEnd:false,common:{msgId:'gift-progress'}});assert.equal(e.coins.lula,0);
 const final={user:{uniqueId:'ana'},giftDetails:{giftName:'Rose',giftType:1},giftId:1,repeatCount:5,repeatEnd:true,common:{msgId:'gift-final'}};c.emit('gift',final);c.emit('gift',final);assert.equal(e.coins.lula,5);
 await a.watch('conta2');await delay(0);c.emit('chat',{user:{uniqueId:'old'},comment:'2'});assert.equal(e.votes.bolsonaro,0);assert(e.live);
 Mock.clients.at(-1).emit('streamEnd',{});assert.equal(e.phase,'waiting');assert(!e.live);await a.stop();
});
test('dependência ausente aparece como erro de instalação',async()=>{const e=new Engine(),a=new TikTokAdapter(e,async()=>{throw Object.assign(Error(),{code:'ERR_MODULE_NOT_FOUND'});});await a.watch('teste');await delay(0);assert.equal(e.connection,'error');assert.match(e.message,/INSTALAR/);await a.stop();});
