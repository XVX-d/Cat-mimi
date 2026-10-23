const fs=require("fs"),vm=require("vm"),assert=require("assert");
const source=fs.readFileSync(__dirname+"/crazygames_bootstrap.js","utf8");
const key="cat-and-fish.crazy-basic.save.v1";
async function scenario({cloud={},local={},fail=false}={}){
  const remote=new Map(Object.entries(cloud)),old=new Map(Object.entries(local)),calls=[],outputs=[];
  let panel,change,auth,reloaded=false;
  const data={getItem:k=>{if(fail)throw Error("dataModuleDisabled");return remote.get(k)??null;},setItem:(k,v)=>remote.set(k,v),removeItem:k=>remote.delete(k)};
  const sdk={environment:"crazygames",init:async()=>{},data,
    game:{settings:{muteAudio:true},addSettingsChangeListener:f=>change=f,loadingStart:()=>calls.push("loadingStart")},
    user:{addAuthListener:f=>auth=f}};
  const root={CrazyGames:{SDK:sdk},CG_GAME_SCRIPTS:[],
    localStorage:{getItem:k=>old.get(k)??null,setItem:(k,v)=>old.set(k,v),removeItem:k=>old.delete(k)},
    dispatchEvent:e=>calls.push(e.type)};
  const doc={createElement:()=>({style:{},appendChild(x){outputs.push(x);},remove(){this.removed=true;}}),
    body:{appendChild:x=>panel=x},head:{appendChild:()=>{throw Error("Unexpected request");}}};
  const sandbox={window:root,document:doc,location:{protocol:"https:",reload:()=>{reloaded=true;}},
    console:{error:()=>{}},setTimeout,clearTimeout,Event};
  await vm.runInNewContext(source,sandbox);
  return {root,remote,old,calls,panel,change,auth,get reloaded(){return reloaded;}};
}
(async()=>{
  let r=await scenario({cloud:{[key]:"cloud-progress"},local:{[key]:"old-progress"}});
  assert.equal(r.root.CGBridge.storage.getItem(key),"cloud-progress");
  assert.equal(r.old.get(key),"old-progress");
  assert.deepEqual(r.calls,["loadingStart","cg-game-ready"]);
  r=await scenario({local:{[key]:"old-progress"}});
  assert.equal(r.remote.get(key),"old-progress");
  r.root.CGBridge.storage.setItem(key,"new-progress");
  assert.equal(r.remote.get(key),"new-progress");assert.equal(r.old.get(key),"old-progress");
  const context={destination:{},createGain:()=>({gain:{value:1},connect(){}})};
  const gain=r.root.CGBridge.audioDestination(context);assert.equal(gain.gain.value,0);
  r.change({muteAudio:false});assert.equal(gain.gain.value,1);
  r.change({muteAudio:true});assert.equal(gain.gain.value,0);
  r.auth();assert(r.reloaded);assert.throws(()=>r.root.CGBridge.storage.setItem(key,"wrong-account"));
  r=await scenario({fail:true});
  assert(!r.panel.removed);assert(!r.calls.includes("cg-game-ready"));assert.equal(r.remote.size,0);
  console.log("PASS: cloud priority, local migration, exclusive SDK writes, mute priority, account write freeze, data failure blocks startup");
})().catch(e=>{console.error(e);process.exitCode=1;});
