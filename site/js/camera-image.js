// Kamerakuva paneelissa ja lightboxissa: tuorein kuva tai aikajanan valitun hetken kuva Digitrafficin 24 h historiasta.
// Tukee aseman kaikkia kamerasuuntia (presetit). Uusi kuva vaihdetaan vasta ladattuna, ettei vaihdossa näy tyhjää.

const HIST_API="https://tie.digitraffic.fi/api/weathercam/v1/stations/";
const HIST_TTL=10*6e4, TIME_TTL=2*6e4;
const HIST={};            // {kamera: {at, byPreset: {id: [{t, url}]} | null | undefined, p}}
const PRESETS={};         // {kamera: {list: [{id, name, url}], p}}
const PRESET_SEL={};      // {kamera: presetId}
const CAM_TIME={};        // {kamera: {at, byPreset: {id: isoString}, p}}
const SHOT={seq:0,shown:0};
const PRELOADED=new Set();

const defaultPresetOf=c=>c.img.split("/").pop().replace(".jpg","");
const fallbackPreset=c=>({id:defaultPresetOf(c),name:c.view||"",url:c.img});
const presetsOf=c=>(PRESETS[c.id]&&PRESETS[c.id].list)||[fallbackPreset(c)];
const activePreset=c=>{const list=presetsOf(c), id=PRESET_SEL[c.id]; return list.find(p=>p.id===id)||list[0]};
const presetOf=c=>activePreset(c).id;
const shotImg=()=>panelEl.querySelector(".shot img");
const fmtGap=ms=>{const m=Math.round(ms/6e4);return m<90?`${m}\u00a0min`:`${Math.round(m/60)}\u00a0h`};

function loadPresets(c){
  const rec=PRESETS[c.id];
  if(rec&&(rec.p||rec.loaded)) return rec.p||Promise.resolve(rec.list);
  const entry=rec||{list:[fallbackPreset(c)],loaded:false};
  const defId=defaultPresetOf(c);
  entry.p=fetch(`${HIST_API}${c.id}`)
    .then(r=>r.ok?r.json():Promise.reject(r.status))
    .then(d=>{
      const raw=((d.properties&&d.properties.presets)||[]).filter(p=>p.inCollection!==false&&safeUrl(p.imageUrl));
      if(raw.length){
        const mapped=raw.map(p=>({id:p.id,name:(p.presentationName||"").trim(),url:safeUrl(p.imageUrl)}));
        // oletussuunta (yleensä Tienpinta) ensimmäiseksi, jotta kortti aukeaa tuttuun näkymään
        const di=mapped.findIndex(p=>p.id===defId);
        if(di>0){ const [def]=mapped.splice(di,1); mapped.unshift(def); }
        entry.list=mapped;
      }
      entry.loaded=true;
    })
    .catch(()=>{entry.loaded=true})
    .finally(()=>{delete entry.p});
  PRESETS[c.id]=entry;
  return entry.p;
}

function loadHist(c){
  const h=HIST[c.id];
  if(h&&(h.p||Date.now()-h.at<HIST_TTL)) return h.p||Promise.resolve();
  const rec={at:Date.now(),byPreset:h?h.byPreset:undefined};
  rec.p=fetch(`${HIST_API}${c.id}/history`)
    .then(r=>r.ok?r.json():Promise.reject(r.status))
    .then(d=>{
      const map={};
      (d.presets||[]).forEach(pr=>{
        map[pr.id]=(pr.history||[]).map(x=>({t:Date.parse(x.lastModified),url:safeUrl(x.imageUrl)})).filter(x=>x.t&&x.url);
      });
      rec.byPreset=map;
    })
    .catch(()=>{rec.byPreset=rec.byPreset||null})
    .finally(()=>{rec.at=Date.now();delete rec.p});
  HIST[c.id]=rec; return rec.p;
}

// lähin kuva hetkeä at; undefined = historia vielä hakematta, null = ei saatavilla
function shotAt(c,at,pid=presetOf(c)){
  const h=HIST[c.id];
  if(!h||h.byPreset===undefined) return undefined;
  const l=h.byPreset&&h.byPreset[pid];
  if(!l||!l.length) return null;
  return l.reduce((a,b)=>Math.abs(b.t-at)<Math.abs(a.t-at)?b:a);
}

function syncLightboxImg(url){
  const lb=document.getElementById("lb-img");
  if(lb&&typeof lbOpen==="function"&&lbOpen()) lb.src=url;
}

function swapWhenReady(url,camId){
  const my=++SHOT.seq, pre=new Image();
  // purkua odotetaan vain hetki: taustavälilehdessä decode() ei valmistu koskaan
  new Promise((ok,ko)=>{pre.onload=ok;pre.onerror=ko;pre.src=url;})
    .then(()=>Promise.race([pre.decode?pre.decode().catch(()=>{}):0,new Promise(r=>setTimeout(r,150))]))
    .then(()=>{ const im=shotImg();
      if(im&&current&&current.id===camId&&my>SHOT.shown){ SHOT.shown=my; im.src=url; syncLightboxImg(url); } })
    .catch(()=>{});
}

function preloadNext(c){
  const nx=slot+1; if(nx>24) return;
  const pr=activePreset(c);
  const s=shotAt(c,nx===24?Date.now():Date.parse(DATA.times[nx]),pr.id);
  if(s&&s.url&&!PRELOADED.has(s.url)){ PRELOADED.add(s.url); new Image().src=s.url; }
}

function formatTaken(iso){
  if(!iso) return "";
  const ref=Date.parse(DATA.live||DATA.run)||Date.now();
  const ms=ref-Date.parse(iso), mins=Math.round(ms/6e4);
  return `${T().camTaken(fmtClock(iso))}${mins>=1?` (${fmtGap(ms)})`:""}`;
}

function renderCamTimeText(c){
  const rec=CAM_TIME[c.id], pid=presetOf(c);
  const iso=rec&&rec.byPreset&&rec.byPreset[pid];
  const txt=formatTaken(iso);
  const el=document.getElementById("camtime");
  if(el&&current&&current.id===c.id) el.textContent=txt?` · ${txt}`:"";
  if(typeof syncLightboxMeta==="function"&&typeof lbOpen==="function"&&lbOpen()) syncLightboxMeta();
}

// ottoaika Fintrafficin rajapinnasta (kuvapalvelin ei salli aikaleiman lukemista selaimesta)
async function camTime(c){
  const rec=CAM_TIME[c.id];
  if(rec&&rec.byPreset&&Date.now()-rec.at<TIME_TTL){ renderCamTimeText(c); return; }
  if(rec&&rec.p){ await rec.p; renderCamTimeText(c); return; }
  const entry={at:Date.now(),byPreset:rec?rec.byPreset:null};
  entry.p=fetch(`${HIST_API}${c.id}/data`)
    .then(r=>r.ok?r.json():Promise.reject(r.status))
    .then(d=>{
      const map={};
      (d.presets||[]).forEach(p=>{if(p.measuredTime) map[p.id]=p.measuredTime;});
      entry.byPreset=map;
    })
    .catch(()=>{})
    .finally(()=>{entry.at=Date.now();delete entry.p});
  CAM_TIME[c.id]=entry;
  await entry.p;
  if(current&&current.id===c.id&&slot===24) renderCamTimeText(c);
}

// fresh = paneeli piirrettiin juuri (kuva asetetaan suoraan); muuten vaihto vasta ladattuna
function showShot(c,fresh){
  const im=shotImg(), cap=panelEl.querySelector("#shotcap"), L=T();
  if(!im) return;
  const pr=activePreset(c);
  const past=slot!==24, at=past?Date.parse(DATA.times[slot]):0, shot=past?shotAt(c,at,pr.id):null;
  if(past&&(shot===undefined||Date.now()-HIST[c.id].at>=HIST_TTL)){
    const s0=slot, p0=pr.id;
    loadHist(c).then(()=>{ if(current&&current.id===c.id&&slot===s0&&presetOf(c)===p0) showShot(c,false); });
  }
  const url=!past?`${pr.url}?t=${Math.floor(Date.now()/6e4)}`:shot?shot.url:shot===null?pr.url:"";
  const gap=shot?Math.abs(shot.t-at):0;
  cap.innerHTML=!past?"":shot?` · ${L.camTaken(fmtClock(new Date(shot.t).toISOString()))}${gap>20*6e4?` (${L.camGap(fmtGap(gap))})`:""}`
    :shot===null?`<br>${L.camLatest}`:`<br>${L.camLoading}`;
  im.onerror=()=>{ if(im.getAttribute("src")===url) im.outerHTML=`<div class="noimg">${L.noImg}</div>`; };
  if(fresh){ SHOT.shown=++SHOT.seq; if(url){ im.src=url; syncLightboxImg(url); } }
  else if(url&&im.getAttribute("src")!==url) swapWhenReady(url,c.id);
  if(typeof syncLightboxMeta==="function"&&typeof lbOpen==="function"&&lbOpen()) syncLightboxMeta();
  if(past) preloadNext(c);
}
