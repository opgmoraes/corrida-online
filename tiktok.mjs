// Adaptador separado: o motor e o painel não importam a biblioteca comunitária.
export class TikTokAdapter {
  constructor(engine,loadConnector=()=>import('tiktok-live-connector')){this.engine=engine;this.loadConnector=loadConnector;this.generation=0;this.timer=null;this.client=null;this.user='';this.attempt=0;}
  async stop(){this.generation++;clearTimeout(this.timer);const client=this.client;this.client=null;this.user='';if(client){client.removeAllListeners();client.on('error',()=>{});try{await client.disconnect();}catch{}}this.engine.live=false;}
  async watch(username){await this.stop();this.engine.demo=false;this.engine.ended();this.user=username;if(!username){this.engine.connection='idle';this.engine.message='Informe seu @ no painel';return;}this.attempt=0;const generation=this.generation;this.connect(generation);}
  async connect(generation){if(generation!==this.generation||!this.user)return;
    this.engine.connection='connecting';this.engine.message=`Aguardando LIVE de @${this.user}`;
    try{
      const {TikTokLiveConnection}=await this.loadConnector();if(generation!==this.generation)return;
      const client=new TikTokLiveConnection(this.user,{processInitialData:false,enableExtendedGiftInfo:true});this.client=client;
      const valid=()=>generation===this.generation&&this.client===client;
      client.on('connected',()=>{if(valid()){this.attempt=0;this.engine.connected();}});
      client.on('chat',d=>{if(valid())this.engine.accept({type:'comment',id:d.msgId||d.common?.msgId,user:d.user?.uniqueId||d.uniqueId,text:d.comment});});
      client.on('like',d=>{if(valid())this.engine.accept({type:'like',id:d.msgId||d.common?.msgId,user:d.user?.uniqueId||d.uniqueId,count:d.likeCount});});
      client.on('gift',d=>{if(!valid())return;const g=d.giftDetails||d.extendedGiftInfo||{};
        if(Number(g.giftType??d.giftType)===1&&!d.repeatEnd)return;
        const id=d.msgId||d.common?.msgId;this.engine.accept({type:'gift',id:id?`gift:${id}:${d.repeatCount}`:undefined,user:d.user?.uniqueId||d.uniqueId,giftId:d.giftId,name:g.giftName||d.giftName,giftType:g.giftType??d.giftType,repeatEnd:d.repeatEnd,count:Number(d.repeatCount||1)});
      });
      client.on('streamEnd',()=>{if(valid())this.engine.ended();});
      client.on('disconnected',()=>{if(valid()){if(this.engine.phase!=='waiting')this.engine.disconnected();this.retry(generation,client);}});
      client.on('error',()=>{if(valid())this.engine.message='Falha na conexão • tentando novamente';});
      await client.connect();
    }catch(error){if(generation!==this.generation)return;
      if(error.code==='ERR_MODULE_NOT_FOUND'){this.engine.connection='error';this.engine.message='Conector não instalado: execute INSTALAR-CONECTOR.cmd';return;}
      this.engine.disconnected('Live indisponível ou falha no conector • nova tentativa automática');this.retry(generation,this.client);
    }
  }
  retry(generation,client){if(generation!==this.generation)return;clearTimeout(this.timer);if(client){client.removeAllListeners();client.on('error',()=>{});Promise.resolve(client.disconnect()).catch(()=>{});}this.client=null;const delay=Math.min(60000,10000*2**Math.min(this.attempt++,3));this.timer=setTimeout(()=>this.connect(generation),delay);}
}
