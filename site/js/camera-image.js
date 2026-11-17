// Kamerakuva paneelissa: tuorein kuva tai aikajanan valitun hetken kuva Digitrafficin 24 h historiasta.
// Uusi kuva vaihdetaan vasta ladattuna, ettei vaihdossa näy tyhjää. Pyynnöt numeroidaan, jotta toistossa
// vanha, myöhässä valmistunut lataus ei korvaa uudempaa.

const HIST_API="https://tie.digitraffic.fi/api/weathercam/v1/stations/";
const HIST_TTL=10*6e4;
const HIST={};            // {kamera: {at, list: [{t, url}] | null (haku epäonnistui) | undefined (kesken), p}}
const SHOT={seq:0,shown:0};
const PRELOADED=new Set();

const presetOf=c=>c.img.split("/").pop().replace(".jpg","");
const shotImg=()=>panelEl.querySelector(".shot img");
const fmtGap=ms=>{const m=Math.round(ms/6e4);return m<90?`${m} min`:`${Math.round(m/60)} h`};

function loadHist(c){
  const h=HIST[c.id];
  if(h&&(h.p||Date.now()-h.at<HIST_TTL)) return h.p||Promise.resolve();
  const rec={at:Date.now(),list:h?h.list:undefined};
  rec.p=fetch(`${HIST_API}${c.id}/history`)
    .then(r=>r.ok?r.json():Promise.reject(r.status))
    .then(d=>{const pr=(d.presets||[]).find(x=>x.id===presetOf(c));
      rec.list=(pr&&pr.history||[]).map(x=>({t:Date.parse(x.lastModified),url:x.imageUrl})).filter(x=>x.t)})
    .catch(()=>{rec.list=rec.list||null})
    .finally(()=>{rec.at=Date.now();delete rec.p});
  HIST[c.id]=rec; return rec.p;
}

// lähin kuva hetkeä at; undefined = historia vielä hakematta, null = ei saatavilla
function shotAt(c,at){
  const l=HIST[c.id]&&HIST[c.id].list;
  if(!l||!l.length) return l===undefined?undefined:null;
  return l.reduce((a,b)=>Math.abs(b.t-at)<Math.abs(a.t-at)?b:a);
}

function swapWhenReady(url,camId){
  const my=++SHOT.seq, pre=new Image();
  // purkua odotetaan vain hetki: taustavälilehdessä decode() ei valmistu koskaan
  new Promise((ok,ko)=>{pre.onload=ok;pre.onerror=ko;pre.src=url;})
    .then(()=>Promise.race([pre.decode?pre.decode().catch(()=>{}):0,new Promise(r=>setTimeout(r,150))]))
    .then(()=>{ const im=shotImg();
      if(im&&current&&current.id===camId&&my>SHOT.shown){ SHOT.shown=my; im.src=url; } })
    .catch(()=>{});
}

function preloadNext(c){
  const nx=slot+1; if(nx>24) return;
  const s=shotAt(c,nx===24?Date.now():Date.parse(DATA.times[nx]));
  if(s&&s.url&&!PRELOADED.has(s.url)){ PRELOADED.add(s.url); new Image().src=s.url; }
}

// ottoaika Fintrafficin rajapinnasta (kuvapalvelin ei salli aikaleiman lukemista selaimesta)
async function camTime(c){
  try{
    const d=await (await fetch(`${HIST_API}${c.id}/data`)).json();
    const p=(d.presets||[]).find(x=>x.id===presetOf(c)), el=document.getElementById("camtime");
    if(p&&p.measuredTime&&el&&current&&current.id===c.id){
      const mins=Math.round((Date.now()-new Date(p.measuredTime))/6e4);
      el.textContent=` · ${T().camTaken(fmtClock(p.measuredTime))}${mins>=1?` (${mins} min)`:""}`;
    }
  }catch(e){}
}

// fresh = paneeli piirrettiin juuri (kuva asetetaan suoraan); muuten vaihto vasta ladattuna
function showShot(c,fresh){
  const im=shotImg(), cap=panelEl.querySelector("#shotcap"), L=T();
  if(!im) return;
  const past=slot!==24, at=past?Date.parse(DATA.times[slot]):0, shot=past?shotAt(c,at):null;
  if(past&&(shot===undefined||Date.now()-HIST[c.id].at>=HIST_TTL)){
    const s0=slot; loadHist(c).then(()=>{ if(current&&current.id===c.id&&slot===s0) showShot(c,false); });
  }
  const url=!past?`${c.img}?t=${Math.floor(Date.now()/6e4)}`:shot?shot.url:shot===null?c.img:"";
  const gap=shot?Math.abs(shot.t-at):0;
  cap.innerHTML=!past?"":shot?` · ${L.camTaken(fmtClock(new Date(shot.t).toISOString()))}${gap>20*6e4?` (${L.camGap(fmtGap(gap))})`:""}`
    :shot===null?`<br>${L.camLatest}`:`<br>${L.camLoading}`;
  im.onerror=()=>{ if(im.getAttribute("src")===url) im.outerHTML=`<div class="noimg">${L.noImg}</div>`; };
  if(fresh){ SHOT.shown=++SHOT.seq; if(url) im.src=url; }
  else if(url&&im.getAttribute("src")!==url) swapWhenReady(url,c.id);
  if(past) preloadNext(c);
}
