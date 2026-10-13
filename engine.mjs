import { defaults, validateConfig } from './config.mjs';
export class Engine {
  constructor(config=defaults){this.config=validateConfig(config);this.pending=null;this.live=false;this.demo=false;this.round=0;this.wins={lula:0,bolsonaro:0};this.users=new Map();this.seen=new Map();this.feed=[];this.seq=0;this.connection='idle';this.message='Informe seu @ no painel';this.last=Date.now();this.newRound(false);}
  newRound(start=true){if(this.pending){this.config=this.pending;this.pending=null;}this.round+=start?1:0;this.phase=start?'running':'waiting';this.remaining=this.config.duration;this.next=0;this.winner=null;this.distance={lula:0,bolsonaro:0};this.votes={lula:0,bolsonaro:0};this.coins={lula:0,bolsonaro:0};this.boost={lula:[],bolsonaro:[]};}
  active(){return this.live||this.demo;}
  connected(){this.live=true;this.demo=false;this.connection='live';this.message='TikTok conectado';if(this.phase==='waiting')this.newRound();}
  disconnected(message='Reconectando ao TikTok'){this.live=false;this.connection='retry';this.message=message;}
  ended(){this.live=false;this.connection='waiting';this.message='Live encerrada • aguardando próxima';this.users.clear();this.newRound(false);}
  setDemo(on){if(this.live&&on)throw Error('Desconecte a live antes de testar');this.demo=on;this.connection=on?'demo':'idle';this.message=on?'TESTE LOCAL • eventos simulados':'Aguardando conexão';this.users.clear();this.newRound(on);}
  configure(c){this.pending=validateConfig(c);if(this.phase==='waiting'){this.config=this.pending;this.pending=null;this.remaining=this.config.duration;}}
  effect(type,text,team=null){this.feed.push({id:++this.seq,type,text,team,at:Date.now()});this.feed=this.feed.slice(-15);}
  tick(dt){if(!this.active())return;dt=Math.max(0,Math.min(dt,1));
    if(this.phase==='result'){this.next-=dt;if(this.next<=0){if(this.pending){this.config=this.pending;this.pending=null;}this.newRound();}return;}
    if(this.phase!=='running')return;
    this.remaining=Math.max(0,this.remaining-dt);
    for(const team of ['lula','bolsonaro']){this.boost[team]=this.boost[team].map(b=>({...b,left:b.left-dt})).filter(b=>b.left>0);this.distance[team]=Math.min(100,this.distance[team]+this.config.baseSpeed*this.speed(team)*dt);}
    if(this.remaining<=0||Object.values(this.distance).some(n=>n>=100))this.finish();
  }
  speed(team){return Math.min(this.config.maxBoost,Math.max(1,...this.boost[team].map(b=>b.multiplier)));}
  finish(){if(this.phase!=='running')return;this.phase='result';const diff=this.distance.lula-this.distance.bolsonaro;this.winner=Math.abs(diff)<0.001?'tie':diff>0?'lula':'bolsonaro';if(this.winner!=='tie')this.wins[this.winner]++;this.next=this.config.intermission;this.effect('win',this.winner==='tie'?'EMPATE!':`${this.winner.toUpperCase()} VENCEU!`,this.winner==='tie'?null:this.winner);}
  accept(event,now=Date.now()){
    if(!event||!['comment','gift','like'].includes(event.type))return false;
    if(!this.active()||this.phase!=='running')return false;
    if(event.id){const id=String(event.id);if(this.seen.has(id))return false;this.seen.set(id,now);if(this.seen.size>10000)this.seen.delete(this.seen.keys().next().value);}
    const user=String(event.user||'viewer').slice(0,80);let profile=this.users.get(user)||{team:null,last:-Infinity};
    if(event.type==='comment'){
      const text=String(event.text).trim().toLowerCase();const team=['1','lula'].includes(text)?'lula':['2','bolsonaro'].includes(text)?'bolsonaro':null;
      if(!team||now-profile.last<this.config.commentCooldown)return false;
      profile={team,last:now};this.users.set(user,profile);if(this.users.size>20000)this.users.delete(this.users.keys().next().value);
      this.votes[team]++;this.distance[team]=Math.min(100,this.distance[team]+this.config.voteImpulse);this.effect('vote',`${user} → ${team.toUpperCase()}`,team);
    }else{
      const team=this.config.giftTarget==='selected'?profile.team:this.config.giftTarget;
      if(!team){if(event.type==='gift')this.effect('notice',`${user}: comente 1 ou 2 antes de enviar presentes`);return false;}
      if(event.type==='like'){const count=Number(event.count);if(!Number.isFinite(count)||count<1)return false;this.distance[team]=Math.min(100,this.distance[team]+Math.min(count,1000)*this.config.likeImpulse);if(this.distance[team]>=100)this.finish();return true;}
      if(Number(event.giftType)===1&&!event.repeatEnd)return false;
      const name=String(event.name||'').toLowerCase().trim();const gift=this.config.gifts.find(g=>g.giftId&&g.giftId===String(event.giftId))||this.config.gifts.find(g=>[g.name.toLowerCase(),...g.names].includes(name));
      if(!gift){this.effect('notice',`Presente sem regra: ${String(event.name||event.giftId).slice(0,50)}`);return false;}
      const count=Number(event.count??1);if(!Number.isInteger(count)||count<1||count>10000)return false;
      this.coins[team]+=gift.coins*count;this.distance[team]=Math.min(100,this.distance[team]+Math.min(100,gift.impulse*count));
      if(gift.seconds>0){this.boost[team].push({multiplier:gift.multiplier,left:gift.seconds,effect:gift.effect});this.boost[team]=this.boost[team].slice(-30);}
      this.effect(gift.effect,`${user} • ${gift.name} ×${count} • +${gift.impulse*count}%`,team);
    }
    if(Object.values(this.distance).some(n=>n>=100))this.finish();return true;
  }
  snapshot(){return {phase:this.phase,connected:this.live,demo:this.demo,connection:this.connection,message:this.message,round:this.round,remaining:this.remaining,next:this.next,winner:this.winner,distance:this.distance,votes:this.votes,coins:this.coins,wins:this.wins,speed:{lula:this.speed('lula'),bolsonaro:this.speed('bolsonaro')},feed:this.feed,config:this.config,pending:!!this.pending};}
}
