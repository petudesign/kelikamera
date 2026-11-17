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

function closePanel(){
  panelEl.classList.remove("on"); current=null; select("");
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

const viewName=c=>!c.view?"":" · "+esc(T().viewMap[c.view]||c.view.replace(/^Tie (\d)/,LANG==="en"?"Road $1":"Tie $1"));

function camStatus(c){
  const L=T(), k=clsAt(c), past=slot!==24;
  // anturillinen kamera, jolta puuttuu yksi tunti: sama rakenne kuin muilla tunneilla (ei nytkähdystä)
  const hourGap=k==="ei mittausta"&&past&&!!c.h;
  const station=`<span>${ic("tower")}${L.station} ${c.st}</span><span>${ic("pin")}<span class="num">${num(c.km," km")}</span></span>`;
  const sub=hourGap?`<span>${ic("clock")}<span class="num">${fmtClock(DATA.times[slot])}</span></span>${station}`
    :k==="ei mittausta"?(c.cls||c.h?"":L.aiSoon)
    :`<span>${ic("clock")}${L.measured} <span class="num">${fmtClock(past?DATA.times[slot]:(c.mt||c.t))}</span></span>${station}`;
  return {k,past,hourGap,html:`<div><b>${L.cls[k]}</b><small>${sub}</small></div><button class="x" aria-label="${L.close}">${X}</button>`};
}

function camReadings(c,s){
  const L=T(), fr=s.past?(c.hf?c.hf[slot]:null):c.friction;
  if(s.k==="ei mittausta"&&!s.hourGap)
    return c.cls?"":`<p class="empty"><strong>${L.noMeasure}</strong>${c.why==="far"?L.far(num(c.km," km")):L.nosensor} ${L.aiNote}</p>`;
  const thin=["jää/kuura","luminen"].includes(s.k)&&fr!=null&&fr>=0.6&&!s.past&&(c.ice||c.snow);
  const row=(icon,label,val)=>`<div class="kv"><dt>${ic(icon)}${label}</dt><dd class="num">${val}</dd></div>`;
  return `<dl class="read">
    <div class="kv joined"><dt>${ic("gauge")}${L.friction}</dt><dd class="num">${num(fr,"",2)}</dd></div>${scale(fr)}
    ${thin?`<p class="thin">${L.thinIce(num(Math.max(c.ice||0,c.snow||0)," mm",2))}</p>`:""}
    ${s.past?"":row("thermo",L.roadT,num(c.roadT," °C"))+row("thermoSun",L.airT,num(c.airT," °C"))
      +row("droplet",L.water,num(c.water," mm",2))+row("cloudSnow",L.snow,num(c.snow," mm",2))+row("snowflake",L.ice,num(c.ice," mm",2))}
  </dl>`;
}

function camHistory(c){
  if(!c.h) return "";
  const L=T(), name=x=>x>=0?KEYS[x]:"ei mittausta";
  return `<div class="hist"><h3>${L.last24}</h3>
    <div class="strip">${c.h.map((x,i)=>`<i class="${i===slot?"sel":""}" title="${fmtClock(DATA.times[i])}: ${L.cls[name(x)]}" style="background:${COLORS[name(x)]}"></i>`).join("")}</div>
    <div class="strip-t"><span>${fmtClock(DATA.times[0])}</span><span>${L.now}</span></div></div>`;
}

function renderCamPanel(c,s){
  panelEl.setAttribute("aria-label",nameOf(c));
  panelEl.innerHTML=`<div class="scroll">
    <div class="status" style="--c:${COLORS[s.k]}">${s.html}</div>
    <div class="place"><h2 tabindex="-1">${esc(nameOf(c))}</h2>${placeLine(c)}</div>
    <figure class="shot"><img alt="${esc(nameOf(c))}">
      <figcaption>${ic("camera")}${T().camNow}${viewName(c)}<span id="camtime"></span><span id="shotcap"></span></figcaption></figure>
    <div id="camread">${camReadings(c,s)}</div>
    <div id="camhist">${camHistory(c)}</div>
  </div>`;
}

function updateCamPanel(c,s){
  const st=panelEl.querySelector(".status");
  st.style.setProperty("--c",COLORS[s.k]); st.innerHTML=s.html;
  panelEl.querySelector("#camtime").textContent="";
  panelEl.querySelector("#camread").innerHTML=camReadings(c,s);
  panelEl.querySelector("#camhist").innerHTML=camHistory(c);
}

function openCam(id,keep){
  const c=byId[id]; if(!c) return;
  const same=keep&&panelEl.dataset.cam===id&&panelEl.querySelector(".shot");
  if(current&&current.type==="warn") clearWarnSel();
  current={type:"cam",id}; select(id); refreshWarn();
  if(!keep){
    if(isMobile()) setCollapsed(true);
    if(ready()) map.flyTo({center:[c.lon,c.lat],zoom:Math.max(map.getZoom(),8),
      offset:isMobile()?[0,-innerHeight*.3]:[-190,0],duration:prefersReduced()?0:800});
  }
  const prevH=panelEl.classList.contains("on")?panelEl.getBoundingClientRect().height:0;
  const s=camStatus(c);
  if(same) updateCamPanel(c,s); else renderCamPanel(c,s);
  panelEl.classList.add("on"); panelEl.dataset.cam=id;
  if(!keep) panelShown();
  // puhelimessa alapaneeli mitoittuu sisällön mukaan: saman kameran selauksessa se ei lyhene
  panelEl.style.minHeight=isMobile()&&same?Math.max(prevH,panelEl.getBoundingClientRect().height)+"px":"";
  showShot(c,!same);
  if(!s.past) camTime(c);
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
  if(!keep){ const b=new maplibregl.LngLatBounds(); w.polygons.flat().forEach(pt=>b.extend(pt)); map.fitBounds(b,{padding:fitPadding(),maxZoom:8}); }
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

/* ---------- sulkeminen: painike, Esc ja pyyhkäisy alas (puhelin) ---------- */
addEventListener("keydown",e=>{if(e.key==="Escape")closePanel()});
panelEl.addEventListener("click",e=>{ if(e.target.closest(".x")) closePanel(); });
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
