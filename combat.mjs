const opponent=t=>t==='lula'?'bolsonaro':'lula';
export class Combat {
  constructor(config,emit=()=>{}){this.config=config;this.emit=emit;this.health={lula:config.maxHealth,bolsonaro:config.maxHealth};this.shield={lula:0,bolsonaro:0};this.energy={lula:0,bolsonaro:0};this.cooldown={lula:0,bolsonaro:0};this.hits={lula:0,bolsonaro:0};}
  attack(team,power,type='hit',source='Arena'){
    const target=opponent(team),blocked=Math.min(this.shield[target],power);this.shield[target]-=blocked;
    const damage=Math.min(this.health[target],Math.max(0,power-blocked));this.health[target]=Math.max(0,this.health[target]-damage);this.hits[team]++;
    this.emit({type,team,target,damage,blocked,text:`${source} • ${team.toUpperCase()} ${damage>0?`−${damage.toFixed(0)} de vida em ${target.toUpperCase()}`:'acertou o escudo'}${blocked>0?` • ${blocked.toFixed(0)} bloqueados`:''}`});
  }
  charge(team,power,source){this.energy[team]=Math.min(100,this.energy[team]+power);if(this.energy[team]>=100){this.energy[team]=0;this.attack(team,this.config.specialDamage,'special',`${source} • ESPECIAL DA TORCIDA`);}}
  bonus(team,action,power,source){
    if(action==='shield'){const gain=Math.min(Math.max(0,this.config.maxShield-this.shield[team]),power);this.shield[team]+=gain;this.emit({type:'shield',team,target:team,power:gain,text:`${source} • ESCUDO ${team.toUpperCase()} +${gain.toFixed(0)}`});}
    else if(action==='energy')this.charge(team,Math.min(100,power),source);
    else this.attack(team,Math.min(this.config.maxGiftDamage,power),action==='special'?'special':'hit',source);
  }
  tick(dt){
    // Ataques agendados juntos são resolvidos juntos, sem vantagem de ordem.
    const plans=[];for(const team of ['lula','bolsonaro']){this.cooldown[team]+=dt;while(this.cooldown[team]>=this.config.attackInterval){this.cooldown[team]-=this.config.attackInterval;if(this.health[team]>0)plans.push(team);}}
    for(const team of plans)this.attack(team,this.config.baseDamage,'hit','Golpe automático');
  }
  over(){return this.health.lula<=0||this.health.bolsonaro<=0;}
  snapshot(){return {health:{...this.health},shield:{...this.shield},energy:{...this.energy},hits:{...this.hits},maxHealth:this.config.maxHealth,maxShield:this.config.maxShield};}
}
