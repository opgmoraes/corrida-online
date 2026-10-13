export const defaults = {
  version: 2, game: 'race', username: '', title: 'CORRIDA DOS PRESIDENTES',
  duration: 90, intermission: 8, baseSpeed: 0.7, voteImpulse: 0.65,
  commentCooldown: 1000, likeImpulse: 0.01, maxBoost: 6,
  giftTarget: 'selected',
  combat: {title:'ARENA DOS PRESIDENTES', duration:75, maxHealth:100, baseDamage:3, attackInterval:2.4, voteEnergy:8, likeEnergy:0.04, specialDamage:14, maxGiftDamage:25, maxShield:35},
  gifts: [
    {key:'rose', name:'Rosa', names:['rose','rosa'], giftId:'', coins:1, impulse:1, multiplier:1.4, seconds:2, effect:'spark',combatAction:'attack',combatPower:4},
    {key:'galaxy', name:'Galáxia', names:['galaxy','galáxia','galaxia'], giftId:'', coins:1000, impulse:10, multiplier:3, seconds:8, effect:'galaxy',combatAction:'special',combatPower:20}
  ]
};
export function validateConfig(input) {
  if(!input || typeof input !== 'object' || Array.isArray(input))throw Error('Configuração inválida');
  const c=structuredClone(defaults);
  c.game=input.game??'race';if(!['race','combat'].includes(c.game))throw Error('Escolha Corrida ou Combate');
  const combat=input.combat??{};if(typeof combat!=='object'||Array.isArray(combat)||combat===null)throw Error('Regras de combate inválidas');
  c.combat.title=String(combat.title??c.combat.title).trim().slice(0,64)||defaults.combat.title;
  for(const [key,min,max] of [['duration',15,300],['maxHealth',50,500],['baseDamage',1,20],['attackInterval',0.5,10],['voteEnergy',1,100],['likeEnergy',0,1],['specialDamage',1,50],['maxGiftDamage',1,50],['maxShield',1,100]]){const n=Number(combat[key]??c.combat[key]);if(!Number.isFinite(n)||n<min||n>max)throw Error(`Combate: ${key} de ${min} a ${max}`);c.combat[key]=n;}
  c.username=String(input.username??c.username).trim().replace(/^@/,'');
  if(c.username&&!/^[\w.]{1,64}$/.test(c.username))throw Error('Informe apenas o usuário do TikTok');
  c.title=String(input.title??c.title).trim().slice(0,64)||defaults.title;
  for(const [key,min,max] of [['duration',10,600],['intermission',3,60],['baseSpeed',0,5],['voteImpulse',0,10],['commentCooldown',250,10000],['likeImpulse',0,1],['maxBoost',1,20]]) {
    const n=Number(input[key]??c[key]); if(!Number.isFinite(n)||n<min||n>max)throw Error(`${key}: valor permitido de ${min} a ${max}`);c[key]=n;
  }
  c.giftTarget=input.giftTarget??c.giftTarget;
  if(!['selected','lula','bolsonaro'].includes(c.giftTarget))throw Error('Destino de presentes inválido');
  if(input.gifts!==undefined) {
    if(!Array.isArray(input.gifts)||input.gifts.length>30)throw Error('Máximo de 30 presentes');
    const keys=new Set();c.gifts=input.gifts.map((g,i)=>{
      if(!g||typeof g!=='object')throw Error('Presente inválido');
      const key=String(g.key??`gift${i}`).slice(0,40);if(!/^[\w-]+$/.test(key)||keys.has(key))throw Error('Identificador de presente inválido ou repetido');keys.add(key);
      const r={key,name:String(g.name??'').trim().slice(0,40),names:Array.isArray(g.names)?g.names.map(x=>String(x).toLowerCase().trim().slice(0,50)).filter(Boolean):[],giftId:String(g.giftId??'').trim()};
      if(!r.name||r.giftId&&!/^\d{1,20}$/.test(r.giftId))throw Error('Nome/ID do presente inválido');
      for(const [k,min,max] of [['coins',1,100000],['impulse',0,100],['multiplier',1,20],['seconds',0,60]]){const n=Number(g[k]);if(!Number.isFinite(n)||n<min||n>max)throw Error(`${r.name}: ${k} fora do limite`);r[k]=n;}
      r.effect=g.effect??'spark';if(!['spark','galaxy','fire'].includes(r.effect))throw Error('Efeito inválido');
      r.combatAction=g.combatAction??(r.effect==='galaxy'?'special':'attack');
      r.combatPower=Number(g.combatPower??(r.combatAction==='special'?20:r.combatAction==='shield'?10:4));
      if(!['attack','shield','special','energy'].includes(r.combatAction)||!Number.isFinite(r.combatPower)||r.combatPower<1||r.combatPower>100)throw Error('Ação/potência do presente no combate inválida');
      return r;
    });
  }
  return c;
}
