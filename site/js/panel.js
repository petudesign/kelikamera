// Oikean reunan tietopaneeli: kamera tai liikennesäävaroitus.
// Kamerapaneeli piirretään kerran; aikajanaa selatessa päivitetään vain muuttuvat osat, jolloin
// kuvaelementti säilyy eikä vaihdossa näy tyhjää (välkyntä, DECISIONS.md 2026-11-12).

const panelEl=document.getElementById("panel");
let lastFocus=null;

function panelShown(){
  if(panelEl.inert){ lastFocus=document.activeElement; panelEl.inert=false; }
  const h=panelEl.querySelector("h2,[tabindex='-1']");
  if(h&&!panelEl.contains(document.activeElement)) h.focus({preventScroll:true});
}

function syncCamUrl(id){
  try{
    const u=new URL(location);
    if(id) u.searchParams.set("cam",id); else u.searchParams.delete("cam");
    history.replaceState(null,"",u);
  }catch{}
}

function closePanel(){
  if(typeof closeLightbox==="function") closeLightbox();
  panelEl.classList.remove("on"); current=null; select(""); syncCamUrl(null);
  delete panelEl.dataset.cam; panelEl.style.minHeight="";
  if(!panelEl.inert){ panelEl.inert=true; if(lastFocus&&document.contains(lastFocus)) lastFocus.focus({preventScroll:true}); lastFocus=null; }
  clearWarnSel(); refreshWarn();
}

/* ---------- kamera ---------- */
function scale(fr){
  const MAX=0.82;
  return `<div class="scale" aria-hidden="true"><div class="bar">
    ${fr!=null?`<i class="mark" style="left:${Math.max(0,Math.min(fr,MAX))/MAX*100}%"></i>`:""}</div>
    <div class="ends"><span>${T().slippery}</span><span>${T().grippy}</span></div></div>`;
}

function placeLine(c){
  const nm=nameOf(c)||"", parts=[];
  if(c.road!=null&&!new RegExp(`\\b${c.road}\\b`).test(nm)) parts.push(`${T().road} ${c.road}`);
  if(c.mun&&!nm.includes(c.mun)) parts.push(esc(c.mun));
  return parts.length?`<p>${parts.join(" · ")}</p>`:"";
}

function fmtView(raw,idx=0){
  let s=(raw||"").trim();
  if(!s) return "";
  if(/^\d+$/.test(s)) return T().viewFallback(s);
  if(LANG!=="en") return s.replace(/^tienpinta$/i,"Tienpinta").replace(/^tie (\d)/,"Tie $1");
  if(/^tienpinta$/i.test(s)) return "Road surface";
  s=s.replace(/\b[Tt]ie\s*(\d+)/g,"Road $1")
     .replace(/\bKehä\s+(I{1,3})\b/g,"Ring $1")
     .replace(/,?\s*\btienpinta\b/gi,m=>m.trim().startsWith(",")?", road surface":", road surface")
     .replace(/\bkamera\s*(\d+)/gi,"Camera $1")
     .replace(/\bSuunta\s*(\d+)/gi,"Direction $1")
     .replace(/\bYleiskuva\b/gi,"Overview")
     .replace(/\bPanoraama\b/gi,"Panorama")
     .replace(/\bRamppi\b/gi,"Ramp")
     .replace(/\bPuomi\b/gi,"Barrier")
     .replace(/\bItä\b/g,"East").replace(/\bitä\b/g,"east")
     .replace(/\bLänsi\b/g,"West").replace(/\blänsi\b/g,"west")
     .replace(/\bEtelä\b/g,"South").replace(/\betelä\b/g,"south")
     .replace(/\bPohjoinen\b/g,"North").replace(/\bpohjoinen\b/g,"north")
     .replace(/\btunneli\b/gi,"tunnel")
     .replace(/\bsilta\b/gi,"bridge")
     .replace(/\bristeys\b/gi,"junction")
     .replace(/\bliittymä\b/gi,"interchange")
     .replace(/\bpysäytyspaikka\b/gi,"lay-by")
     .replace(/\bmasto\b/gi,"mast")
     .replace(/^,\s*/,"")
     .replace(/\s{2,}/g," ").trim();
  return s?s[0].toUpperCase()+s.slice(1):T().viewFallback(idx+1);
}
function stripRoad(s,roadNum){
  if(!s||roadNum==null) return s||"";
  const m=s.replace(new RegExp(`^(?:tie|road|vt|kt|st)\\s*${roadNum}\\b[\\s,·-]*`,"i"),"").trim();
  return m||s;
}
const viewLabel=c=>{const pr=activePreset(c); return fmtView(pr.name||c.view,0)};
const viewName=c=>{if(presetsOf(c).length>1) return ""; const v=viewLabel(c); return v?" · "+esc(v):""};

function presetPillsHtml(c){
  const list=presetsOf(c);
  if(list.length<=1) return "";
  const sel=activePreset(c).id;
  return `<div class="presets" role="group" aria-label="${esc(T().views)}">${list.map((p,i)=>
    `<button type="button" class="pill" data-pid="${esc(p.id)}" aria-pressed="${p.id===sel}">${esc(stripRoad(fmtView(p.name,i)||T().viewFallback(i+1),c.road))}</button>`
  ).join("")}</div>`;
}

function syncPresetsEl(){
  const pr=panelEl.querySelector("#campresets .presets");
  if(!pr) return;
  initDragScroll(pr);
  const act=pr.querySelector('[aria-pressed="true"]');
  if(act) act.scrollIntoView({inline:"nearest",block:"nearest"});
}

function selectPreset(c,pid){
  if(!c||PRESET_SEL[c.id]===pid) return;
  PRESET_SEL[c.id]=pid;
  const vw=panelEl.querySelector("#camview"); if(vw) vw.innerHTML=viewName(c);
  const prEl=panelEl.querySelector("#campresets"); if(prEl) prEl.innerHTML=presetPillsHtml(c);
  syncPresetsEl();
  const ct=panelEl.querySelector("#camtime"); if(ct) ct.textContent="";
  showShot(c,false);
  if(slot===24) camTime(c);
  if(lbOpen()) syncLightboxMeta();
}

function stepPreset(dir){
  if(!current||current.type!=="cam") return;
  const c=byId[current.id]; if(!c) return;
  const list=presetsOf(c); if(list.length<=1) return;
  const idx=Math.max(0,list.findIndex(p=>p.id===activePreset(c).id));
  const next=list[(idx+dir+list.length)%list.length];
  selectPreset(c,next.id);
}

function camStatus(c){
  const L=T(), k=clsAt(c), past=slot!==24;
  // anturillinen kamera, jolta puuttuu yksi tunti: sama rakenne kuin muilla tunneilla (ei nytkähdystä)
  const hourGap=k==="ei mittausta"&&past&&!!c.h;
  const hasTemps=!past&&c.why==="nosensor"&&(c.roadT!=null||c.airT!=null);
  const station=`<span>${ic("tower")}${L.station} ${esc(c.st)}</span><span>${ic("pin")}<span class="num">${num(c.km," km")}</span></span>`;
  const sub=hourGap?`<span>${ic("clock")}<span class="num">${fmtClock(DATA.times[slot])}</span></span>${station}`
    :k==="ei mittausta"?(c.cls||c.h?"":(hasTemps?station:L.aiSoon))
    :`<span>${ic("clock")}${L.measured} <span class="num">${fmtClock(past?DATA.times[slot]:(c.mt||c.t))}</span></span>${station}`;
  const fav=isFavCam(c.id), favLbl=fav?L.unfavCam:L.favCam;
  return {k,past,hourGap,html:`<div><b>${L.cls[k]}</b><small>${sub}</small></div>
    <div class="status-acts"><button type="button" class="sharebtn" data-share="${esc(c.id)}" aria-label="${esc(L.copyLink)}" title="${esc(L.copyLink)}">${ic("link")}</button><button type="button" class="favbtn" data-fav="${esc(c.id)}" aria-pressed="${fav}" aria-label="${esc(favLbl)}" title="${esc(favLbl)}">${ic("star")}</button><button class="x" aria-label="${L.close}">${X}</button></div>`};
}

function roadTempVal(c){
  const t=num(c.roadT," °C");
  if(c.roadTr==null||Math.abs(c.roadTr)<0.2) return t;
  const cool=c.roadTr<=-0.5&&c.roadT!=null&&c.roadT<=2;
  const sign=c.roadTr>0?"+":"";
  return `${t}<span class="trend${cool?" cool":""}">${sign}${num(c.roadTr," °C/h",1)}</span>`;
}

function roadNavHtml(c){
  if(c.road==null) return "";
  const list=DATA.cameras.filter(x=>x.road===c.road).sort((a,b)=>(a.sec-b.sec)||(a.dist-b.dist));
  if(list.length<2) return "";
  const i=list.findIndex(x=>x.id===c.id); if(i<0) return "";
  const L=T(), prev=list[i-1], next=list[i+1];
  const btn=(cam,dir,icon,lbl,key)=>cam
    ?`<button type="button" class="rn-btn rn-${dir}" data-cam="${esc(cam.id)}" aria-label="${esc(lbl)}: ${esc(nameOf(cam))}" title="${esc(nameOf(cam))} (${key})">${dir==="prev"?icon:""}<span>${esc(stripRoad(nameOf(cam),c.road))}</span>${dir==="next"?icon:""}</button>`
    :`<span class="rn-btn rn-${dir} rn-off" aria-hidden="true">${icon}</span>`;
  return `<nav class="roadnav" aria-label="${esc(L.road)} ${esc(c.road)}">
    ${btn(prev,"prev",ic("prev"),L.prevCam,"←")}
    <span class="rn-pos num">${i+1}/${list.length}</span>
    ${btn(next,"next",ic("next"),L.nextCam,"→")}
  </nav>`;
}

function stepRoadCam(dir){
  if(!current||current.type!=="cam") return;
  const c=byId[current.id]; if(!c||c.road==null) return;
  const list=DATA.cameras.filter(x=>x.road===c.road).sort((a,b)=>(a.sec-b.sec)||(a.dist-b.dist));
  const i=list.findIndex(x=>x.id===c.id), target=list[i+dir];
  if(target) openCam(target.id);
}

const TMS_CACHE={};
function tmsRowHtml(d){
  if(!d||d.speed==null) return "";
  const L=T();
  const [cls,st]=d.ratio!=null&&d.ratio<60?["jam",L.trJam]:d.ratio!=null&&d.ratio<82?["slow",L.trSlow]:["ok",L.trSmooth];
  const vol=d.vol?`<span class="trend">${esc(L.vehH(Math.round(d.vol).toLocaleString(L.locale)))}</span>`:"";
  return `<div class="kv" id="tmsrow"><dt>${ic("car")}${L.traffic}</dt><dd class="num"><span class="tr-st ${cls}">${esc(st)}</span>${Math.round(d.speed)} km/h${vol}</dd></div>`;
}
function loadTraffic(c){
  if(!c.tms||slot!==24) return;
  const cached=TMS_CACHE[c.tms];
  const apply=d=>{
    if(!current||current.type!=="cam"||current.id!==c.id||slot!==24) return;
    const html=tmsRowHtml(d); if(!html) return;
    const old=panelEl.querySelector("#tmsrow"); if(old) old.remove();
    const read=panelEl.querySelector("#camread .read");
    if(read){
      const note=read.querySelector(".read-note");
      if(note) note.insertAdjacentHTML("beforebegin",html);
      else read.insertAdjacentHTML("beforeend",html);
    }else{
      const cr=panelEl.querySelector("#camread");
      const emp=cr&&cr.querySelector(".empty");
      if(emp){
        const noteHtml=`<p class="read-note">${emp.innerHTML}</p>`;
        emp.remove();
        cr.insertAdjacentHTML("afterbegin",`<dl class="read">${html}${noteHtml}</dl>`);
      }else if(cr) cr.insertAdjacentHTML("afterbegin",`<dl class="read">${html}</dl>`);
    }
  };
  if(cached&&Date.now()-cached.at<5*60e3) return apply(cached.d);
  fetch(`https://tie.digitraffic.fi/api/tms/v1/stations/${c.tms}/data`).then(r=>r.ok?r.json():null).then(j=>{
    if(!j||!Array.isArray(j.sensorValues)) return;
    const v={}; j.sensorValues.forEach(x=>v[x.name]=x.value);
    const sp=[v.KESKINOPEUS_5MIN_LIUKUVA_SUUNTA1,v.KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2].filter(x=>x!=null&&x>0);
    const sp60=[v.KESKINOPEUS_60MIN_KIINTEA_SUUNTA1,v.KESKINOPEUS_60MIN_KIINTEA_SUUNTA2].filter(x=>x!=null&&x>0);
    const speeds=sp.length?sp:sp60;
    const speed=speeds.length?speeds.reduce((a,b)=>a+b,0)/speeds.length:null;
    const vol=(v.OHITUKSET_60MIN_KIINTEA_SUUNTA1||0)+(v.OHITUKSET_60MIN_KIINTEA_SUUNTA2||0)||null;
    const ratios=[v.KESKINOPEUS_5MIN_LIUKUVA_SUUNTA1_VVAPAAS1,v.KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2_VVAPAAS2].filter(x=>x!=null&&x>0);
    const ratio=ratios.length?Math.min(...ratios):null;
    const d={speed,vol,ratio};
    TMS_CACHE[c.tms]={at:Date.now(),d};
    apply(d);
  }).catch(()=>{});
}

function camReadings(c,s){
  const L=T(), fr=s.past?(c.hf?c.hf[slot]:null):c.friction;
  const row=(icon,label,val)=>`<div class="kv"><dt>${ic(icon)}${label}</dt><dd class="num">${val}</dd></div>`;
  if(s.k==="ei mittausta"&&!s.hourGap){
    if(c.cls) return "";
    const msg=`<strong>${L.noMeasure}</strong>${c.why==="far"?L.far(num(c.km," km")):L.nosensor} ${L.aiNote}`;
    if(!s.past&&c.why==="nosensor"&&(c.roadT!=null||c.airT!=null)){
      const rows=(c.roadT!=null?row("thermo",L.roadT,roadTempVal(c)):"")
        +(c.airT!=null?row("thermoSun",L.airT,num(c.airT," °C")):"");
      return `<dl class="read">${rows}<p class="read-note">${msg}</p></dl>`;
    }
    return `<p class="empty">${msg}</p>`;
  }
  const thin=s.k==="ohut"&&!s.past;
  return `<dl class="read">
    <div class="kv joined"><dt>${ic("gauge")}${L.friction}</dt><dd class="num">${num(fr,"",2)}</dd></div>${scale(fr)}
    ${thin?`<p class="thin">${L.thinIce(num(Math.max(c.ice||0,c.snow||0)," mm",2))}</p>`:""}
    ${s.past?"":row("thermo",L.roadT,roadTempVal(c))+row("thermoSun",L.airT,num(c.airT," °C"))
      +row("droplet",L.water,num(c.water," mm",2))+row("cloudSnow",L.snow,num(c.snow," mm",2))+row("snowflake",L.ice,num(c.ice," mm",2))}
  </dl>`;
}

function camHistory(c){
  if(!c.h) return "";
  const L=T();
  return `<div class="hist"><h3>${L.last24}</h3>
    <div class="strip">${c.h.map((_,i)=>{const k=histAt(c,i);return `<i class="${i===slot?"sel":""}" title="${fmtClock(DATA.times[i])}: ${L.cls[k]}" style="background:${COLORS[k]}"></i>`}).join("")}</div>
    <div class="strip-t"><span>${fmtClock(DATA.times[0])}</span><span>${L.now}</span></div></div>`;
}

function renderCamPanel(c,s){
  panelEl.setAttribute("aria-label",nameOf(c));
  panelEl.innerHTML=`<div class="scroll">
    <div class="status" style="--c:${COLORS[s.k]}">${s.html}</div>
    <div class="place"><h2 tabindex="-1">${esc(nameOf(c))}</h2>${placeLine(c)}<div id="roadnav">${roadNavHtml(c)}</div></div>
    <figure class="shot"><button type="button" class="shotbtn" aria-label="${esc(T().openFull)}"><img alt="${esc(nameOf(c))}"><span class="zoomhint" aria-hidden="true">${ic("expand")}</span></button>
      <div id="campresets">${presetPillsHtml(c)}</div>
      <figcaption>${ic("camera")}${T().camNow}<span id="camview">${viewName(c)}</span><span id="camtime"></span><span id="shotcap"></span></figcaption></figure>
    <div id="camread">${camReadings(c,s)}</div>
    <div id="camhist">${camHistory(c)}</div>
  </div>`;
}

function updateCamPanel(c,s){
  const st=panelEl.querySelector(".status");
  st.style.setProperty("--c",COLORS[s.k]); st.innerHTML=s.html;
  const vw=panelEl.querySelector("#camview"); if(vw) vw.innerHTML=viewName(c);
  const prEl=panelEl.querySelector("#campresets"); if(prEl) prEl.innerHTML=presetPillsHtml(c);
  const rnEl=panelEl.querySelector("#roadnav"); if(rnEl) rnEl.innerHTML=roadNavHtml(c);
  panelEl.querySelector("#camtime").textContent="";
  panelEl.querySelector("#camread").innerHTML=camReadings(c,s);
  panelEl.querySelector("#camhist").innerHTML=camHistory(c);
}

function openCam(id,keep){
  const c=byId[id]; if(!c) return;
  const same=keep&&panelEl.dataset.cam===id&&panelEl.querySelector(".shot");
  if(current&&current.type==="warn") clearWarnSel();
  current={type:"cam",id}; select(id); syncCamUrl(id); refreshWarn();
  if(!keep){
    if(isMobile()) setCollapsed(true);
    if(ready()) map.flyTo({center:[c.lon,c.lat],zoom:Math.max(map.getZoom(),8),
      offset:isMobile()?[0,-innerHeight*.3]:[-190,0],duration:prefersReduced()?0:800});
  }
  const prevH=panelEl.classList.contains("on")?panelEl.getBoundingClientRect().height:0;
  const s=camStatus(c);
  if(same) updateCamPanel(c,s); else renderCamPanel(c,s);
  syncPresetsEl();
  panelEl.classList.add("on"); panelEl.dataset.cam=id;
  if(!keep) panelShown();
  // puhelimessa alapaneeli mitoittuu sisällön mukaan: saman kameran selauksessa se ei lyhene
  panelEl.style.minHeight=isMobile()&&same?Math.max(prevH,panelEl.getBoundingClientRect().height)+"px":"";
  showShot(c,!same);
  if(!s.past){ camTime(c); loadTraffic(c); }
  loadPresets(c).then(()=>{
    if(!current||current.type!=="cam"||current.id!==c.id) return;
    const prEl=panelEl.querySelector("#campresets"); if(prEl) prEl.innerHTML=presetPillsHtml(c);
    syncPresetsEl();
    const vw=panelEl.querySelector("#camview"); if(vw) vw.innerHTML=viewName(c);
    if(lbOpen()) syncLightboxMeta();
  });
}

/* ---------- liikennesäävaroitus ---------- */
function clearWarnSel(){
  if(ready()) map.setFilter("warn-sel",["==",["get","i"],-1]);
  document.querySelectorAll(".warn").forEach(b=>b.removeAttribute("aria-current"));
}

function openWarn(i,keep){
  if(!keep&&current&&current.type==="warn"&&current.i===i) return closePanel();  // sama uudelleen = pois
  const w=WARN[i]; if(!w) return;
  current={type:"warn",i}; select("");
  if(isMobile()&&!keep) setCollapsed(true);
  if(ready()){ map.setFilter("warn-sel",["==",["get","i"],i]); refreshWarn(); }
  document.querySelectorAll(".warn").forEach(b=>b.setAttribute("aria-current",String(+b.dataset.i===i)));
  if(!keep){ const b=new maplibregl.LngLatBounds(); w.polygons.flat().forEach(pt=>b.extend(pt)); if(!b.isEmpty()) map.fitBounds(b,{padding:fitPadding(),maxZoom:8}); }
  const L=T();
  panelEl.setAttribute("aria-label",L.warnings);
  delete panelEl.dataset.cam;
  panelEl.innerHTML=`<div class="scroll">
    <div class="status" style="--c:var(--warn)"><div><b${areaOf(w).length>40?' class="long"':""}>${esc(areaOf(w))}</b><small>${L.official}</small></div>
      <button class="x" aria-label="${L.close}">${X}</button></div>
    <div class="wpanel"><p class="num">${fmtTime(w.onset)} – ${fmtTime(w.expires)}</p>
      <p>${esc(w.description[LANG]||w.description.fi||"")}</p>
      <p class="src">${L.warnSrc} · <a class="btn" href="https://www.ilmatieteenlaitos.fi/varoitukset" target="_blank" rel="noopener">${L.readMore}${ic("ext")}</a></p></div>
  </div>`;
  panelEl.classList.add("on"); panelShown();
}

function openWarnList(only){
  clearWarnSel(); current={type:"warnlist",only:Array.isArray(only)?only:null}; select(""); refreshWarn();
  if(isMobile()) setCollapsed(true);
  const L=T();
  panelEl.setAttribute("aria-label",L.warnings);
  delete panelEl.dataset.cam;
  panelEl.innerHTML=`<div class="scroll">
    <div class="status" style="--c:var(--warn)"><div><b>${L.warnings}</b><small>${L.warnSub}</small></div>
      <button class="x" aria-label="${L.close}">${X}</button></div>
    <div class="wlist">${warnItems(current.only)}</div></div>`;
  panelEl.querySelectorAll(".warn").forEach(b=>b.onclick=()=>openWarn(+b.dataset.i));
  panelEl.classList.add("on"); panelShown();
}

function openNotice(m){
  if(!m) return;
  if(current&&current.type==="warn") clearWarnSel();
  current={type:"notice",m}; select(""); syncCamUrl(null); refreshWarn();
  if(isMobile()) setCollapsed(true);
  const L=T(), rawTitle=m.t[LANG]||m.t.fi||"", desc=m.d[LANG]||m.d.fi||"";
  const title=rawTitle.replace(/\.\s*(Tietyö|Roadwork)\.?$/i,"").trim()||rawTitle;
  const kind=m.type==="work"?L.roadWork:L.trafficNotice;
  const col=m.type==="work"?"#f59e0b":"#fb7185";
  const span=m.start?(fmtTime(m.start)+(m.end?` – ${fmtTime(m.end)}`:"")):"";
  const kx=111.32*Math.cos(m.lat*Math.PI/180), ky=110.57;
  const near=(DATA?.cameras||[]).map(c=>({c,d:Math.hypot((c.lon-m.lon)*kx,(c.lat-m.lat)*ky)}))
    .filter(x=>x.d<=15).sort((a,b)=>a.d-b.d).slice(0,3);
  const nearHtml=near.length?`<div class="ncams"><h3>${L.nearCams}</h3><ul class="list">${near.map(({c,d})=>{
    const k=clsAt(c);
    return `<li><button type="button" class="item" data-ncam="${esc(c.id)}"><span class="sw" style="background:${COLORS[k]}"></span>
      <span><b>${esc(nameOf(c))}</b><small>${L.cls[k]}</small></span><span class="km num">${num(d," km")}</span></button></li>`;
  }).join("")}</ul></div>`:"";
  panelEl.setAttribute("aria-label",kind);
  delete panelEl.dataset.cam;
  panelEl.innerHTML=`<div class="scroll">
    <div class="status" style="--c:${col}"><div><b class="long">${esc(title)}</b><small><span>${ic("tri")}${esc(kind)}</span></small></div>
      <button class="x" aria-label="${L.close}">${X}</button></div>
    <div class="read ncard">
      ${span?`<div class="kv"><dt>${ic("clock")}${L.valid}</dt><dd class="num nspan">${esc(span)}</dd></div>`:""}
      ${desc?`<p class="ndesc">${esc(desc)}</p>`:""}
    </div>
    ${nearHtml}
    <div class="wpanel nfoot"><p class="src">${L.trafficSrc} · <a class="btn" href="https://liikennetilanne.fintraffic.fi/" target="_blank" rel="noopener">${L.trafficMore}${ic("ext")}</a></p></div>
  </div>`;
  panelEl.classList.add("on"); panelShown();
}

/* ---------- sulkeminen: painike, Esc ja pyyhkäisy alas (puhelin) ---------- */
addEventListener("keydown",e=>{
  if(lbOpen()){
    if(e.key==="Escape"){ e.stopImmediatePropagation(); closeLightbox(); }
    else if(e.key==="ArrowLeft"){ e.preventDefault(); stepPreset(-1); }
    else if(e.key==="ArrowRight"){ e.preventDefault(); stepPreset(1); }
    return;
  }
  if(e.key==="Escape") return closePanel();
  if((e.key==="ArrowLeft"||e.key==="ArrowRight")&&current&&current.type==="cam"){
    const ae=document.activeElement, tag=(ae?.tagName||"").toLowerCase();
    if(tag==="input"||tag==="textarea"||tag==="select"||ae?.getAttribute("role")==="tab") return;
    e.preventDefault();
    stepRoadCam(e.key==="ArrowLeft"?-1:1);
  }
});
panelEl.addEventListener("click",e=>{
  if(e.target.closest(".x")) return closePanel();
  const sb=e.target.closest(".sharebtn[data-share]");
  if(sb){
    const u=new URL(location); u.searchParams.set("cam",sb.dataset.share);
    const done=()=>{
      sb.dataset.copied="true"; sb.innerHTML=ic("check");
      sb.setAttribute("aria-label",T().copied); sb.title=T().copied;
      clearTimeout(sb._t);
      sb._t=setTimeout(()=>{sb.removeAttribute("data-copied"); sb.innerHTML=ic("link");
        sb.setAttribute("aria-label",T().copyLink); sb.title=T().copyLink;},1800);
    };
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(u.href).then(done,done);
    else done();
    return;
  }
  const fb=e.target.closest(".favbtn[data-fav]");
  if(fb){
    const id=fb.dataset.fav; toggleFavCam(id);
    const on=isFavCam(id), lbl=on?T().unfavCam:T().favCam;
    fb.setAttribute("aria-pressed",String(on)); fb.setAttribute("aria-label",lbl); fb.title=lbl;
    if(typeof renderFavCams==="function") renderFavCams();
    return;
  }
  const rn=e.target.closest(".roadnav button[data-cam]");
  if(rn) return openCam(rn.dataset.cam);
  const nc=e.target.closest("button[data-ncam]");
  if(nc) return openCam(nc.dataset.ncam);
  if(e.target.closest(".shotbtn")) return openLightbox();
  const pill=e.target.closest(".pill[data-pid]");
  if(pill&&current&&current.type==="cam") selectPreset(byId[current.id],pill.dataset.pid);
});
// Seuraa sormea 1:1, ylöspäin kuminauhamainen vastus; sulkeutuu matkasta (> 80 px) tai näpäytyksestä (> 0,5 px/ms).
let swipe=null;
panelEl.addEventListener("touchstart",e=>{
  const top=panelEl.getBoundingClientRect().top, y=e.touches[0].clientY;
  swipe=(y-top<90&&panelEl.querySelector(".scroll").scrollTop===0)?{y0:y,y,t:e.timeStamp,vel:0}:null;
},{passive:true});
panelEl.addEventListener("touchmove",e=>{
  if(!swipe) return;
  const y=e.touches[0].clientY, dt=e.timeStamp-swipe.t, raw=y-swipe.y0;
  if(dt>0) swipe.vel=(y-swipe.y)/dt;
  swipe.y=y; swipe.t=e.timeStamp;
  panelEl.style.transition="none"; panelEl.style.transform=`translateY(${raw<0?raw*0.15:raw}px)`;
},{passive:true});
panelEl.addEventListener("touchend",e=>{
  if(!swipe) return;
  const dy=e.changedTouches[0].clientY-swipe.y0, vel=swipe.vel; swipe=null;
  panelEl.style.transition=""; panelEl.style.transform="";
  if(dy>80||(dy>24&&vel>0.5)) closePanel();
});
