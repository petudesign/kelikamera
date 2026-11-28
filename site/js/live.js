// Anturien nykytila suoraan Digitrafficista. Kartan data rakennetaan keruuajossa, jonka GitHub voi pudottaa
// tunneiksi, joten lukemat päivitetään selaimessa. Luokittelun säännöt tulevat datasta (labels.py), ei tästä.

const LIVE_URL="https://tie.digitraffic.fi/api/weather/v2/stations/data", LIVE_EVERY=5*60e3;
let liveAt=0;

function liveReading(v,R,now){
  const opt=v.OPTISEN_ANTURIN_KELI1;
  if(!opt||opt.value==null||now-Date.parse(opt.measuredTime)>R.maxAgeMin*60e3) return null;
  const val=n=>v[n]&&v[n].value!=null?Math.round(v[n].value*100)/100:null;
  const r={mt:opt.measuredTime,cls:R.codes[Math.trunc(opt.value)]||null,friction:val("KITKA1_LUKU"),water:val("VEDEN_MÄÄRÄ1"),
    snow:val("LUMEN_MÄÄRÄ1"),ice:val("JÄÄN_MÄÄRÄ1"),roadT:val("TIE_1"),roadTr:val("TIE_1_DERIVAATTA"),airT:val("ILMA")};
  r.thin=SLIPPERY.includes(r.cls)&&r.friction!=null&&r.friction>=R.thinFriction&&Math.max(r.ice||0,r.snow||0)<R.thinLayer;
  r.why=r.cls?null:"nosensor";
  return r;
}
function liveTemps(v,R,now){
  const pick=n=>{const x=v[n]; return x&&x.value!=null&&now-Date.parse(x.measuredTime)<=R.maxAgeMin*60e3?Math.round(x.value*100)/100:null;};
  const roadT=pick("TIE_1"), roadTr=pick("TIE_1_DERIVAATTA"), airT=pick("ILMA");
  return roadT!=null||airT!=null?{roadT,roadTr,airT}:null;
}
async function refreshLive(){
  liveAt=Date.now();
  let d;
  try{
    const resp=await fetch(LIVE_URL);
    if(!resp.ok) return;
    d=await resp.json();
  }catch{ return; }  // ei yhteyttä: kartta jää keruuajon tietoihin
  if(!d||!Array.isArray(d.stations)) return;
  const by={};
  d.stations.forEach(s=>{const v={}; (s.sensorValues||[]).forEach(x=>v[x.name]=x); by[s.id]=v;});
  for(const c of DATA.cameras){
    if(c.km==null||c.km>DATA.maxKm||!by[c.st]) continue;
    const r=liveReading(by[c.st],DATA.rules,liveAt);
    if(r&&(!c.mt||Date.parse(r.mt)>Date.parse(c.mt))) Object.assign(c,r);
    else if(!c.cls){ const t=liveTemps(by[c.st],DATA.rules,liveAt); if(t) Object.assign(c,t); }
  }
  DATA.live=d.dataUpdatedTime;
  renderData(); refreshMap();
  if(current&&current.type==="cam") openCam(current.id,true);
}
function startLive(){
  refreshLive();
  setInterval(()=>{if(document.visibilityState==="visible")refreshLive()},LIVE_EVERY);
  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="visible"&&Date.now()-liveAt>LIVE_EVERY) refreshLive();
  });
}
