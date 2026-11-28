// Vasen kortti: selite, varoituslista, Liukastumassa, tiet, kamerahaku, välilehdet ja kieli.

// datasta riippuvat osat (myös anturien päivityksen jälkeen, ks. live.js)
function renderData(){
  const at=DATA.live||DATA.run, u=document.getElementById("updated"), today=new Date(at).toDateString()===new Date().toDateString();
  u.textContent=isMobile()&&today?fmtClock(at):fmt(at,{day:"numeric",month:"numeric",hour:"2-digit",minute:"2-digit"}); u.dateTime=at;
  const worse=worsening(), bd=document.querySelector("#tab-worse .badge"); bd.hidden=!worse.length; bd.textContent=worse.length||"";
  renderFavCams(); renderLegend(); renderLayers(); renderWarnings(); renderWorse(worse); renderRoads(); renderTimeline(); renderRoute();
}
function renderLayers(){
  const el=document.getElementById("layers"); if(!el) return;
  const L=T();
  el.innerHTML=`<div class="layer-row">
    <button type="button" class="lchip" id="t-maint" aria-pressed="${maintOn}">${ic("truck")}<span>${L.layerMaint}</span></button>
    <button type="button" class="lchip" id="t-work" aria-pressed="${workOn}">${ic("cone")}<span>${L.layerWork}</span></button>
  </div>${maintOn?`<div class="mkey"><span><i style="background:#38bdf8"></i>${L.maintSalt}</span><span><i style="background:#60a5fa"></i>${L.maintPlow}</span><span><i style="background:#f59e0b"></i>${L.maintSand}</span></div>`:""}`;
  el.querySelector("#t-maint").onclick=()=>{ maintOn=!maintOn; renderLayers(); if(typeof syncMaint==="function") syncMaint(); };
  el.querySelector("#t-work").onclick=()=>{ workOn=!workOn; renderLayers(); if(typeof syncTraffic==="function") syncTraffic(); };
}
function renderFavCams(){
  const el=document.getElementById("favcams"); if(!el) return;
  const list=FAV_CAMS.map(id=>byId[id]).filter(Boolean);
  if(!list.length){ el.hidden=true; el.innerHTML=""; return; }
  el.hidden=false;
  el.innerHTML=`<div class="favhead">${ic("star")}<span>${T().favCamsLabel}</span></div>
    <div class="favchips" role="list">${list.map(c=>{
      const k=clsAt(c), t=c.roadT!=null?c.roadT:c.airT;
      return `<button type="button" class="favchip" role="listitem" data-id="${esc(c.id)}">
        <span class="sw" style="background:${COLORS[k]}"></span><span class="fn">${esc(nameOf(c))}</span>
        ${t!=null?`<span class="ft num">${num(t,"\u00a0°C")}</span>`:""}</button>`;
    }).join("")}</div>`;
  el.querySelectorAll(".favchip").forEach(b=>b.onclick=()=>{ if(isMobile()) setCollapsed(true); openCam(b.dataset.id); });
  initDragScroll(el.querySelector(".favchips"));
}
function renderAll(){
  document.documentElement.lang=LANG; document.title=T().title;
  document.getElementById("map").setAttribute("aria-label",T().mapLabel);
  document.getElementById("slider").setAttribute("aria-label",LANG==="en"?"Timeline, last 24 hours":"Aikajana, viimeiset 24 tuntia");
  foldBtn.setAttribute("aria-label",keyEl.classList.contains("collapsed")?T().camSearchLabel:T().close);
  document.querySelectorAll("[data-t]").forEach(el=>el.textContent=T()[el.dataset.t]);
  document.getElementById("sourcesList").innerHTML=T().sourcesItems.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join("");
  document.getElementById("privacyList").innerHTML=T().privacyItems.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join("");
  document.querySelectorAll(".lang button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.lang===LANG)));
  // tekstit päivitetään vain, jos ne muuttuvat: uudelleenpiirto laskettaisiin uudeksi LCP:ksi
  const setTab=(id,txt)=>{const sp=document.querySelector(`#${id}>span`); if(sp.textContent!==txt) sp.textContent=txt;};
  setTab("tab-map",T().tabMap); setTab("tab-route",T().tabRoute);
  document.getElementById("camq").placeholder=T().camSearchPh;
  document.getElementById("camclr").setAttribute("aria-label",T().clearSearch);
  document.getElementById("from").placeholder=T().placeholderFrom; document.getElementById("to").placeholder=T().placeholderTo;
  document.getElementById("locate").setAttribute("aria-label",T().myLoc); document.getElementById("locate").title=T().myLoc;
  setTab("tab-worse",T().tabWorse); setTab("tab-roads",T().tabRoads);
  renderData();
  if(current) current.type==="cam"?(delete panelEl.dataset.cam,openCam(current.id,true)):current.type==="warnlist"?openWarnList(current.only):openWarn(current.i,true);
}

function counts(){
  const n=Object.fromEntries(ORDER.map(k=>[k,0]));
  DATA.cameras.forEach(c=>{if(road==null||c.road===road)n[clsAt(c)]++});
  return n;
}
function renderLegend(){
  const n=counts(), maxMeas=Math.max(1,...ORDER.filter(k=>k!=="ei mittausta").map(k=>n[k]));
  const el=document.getElementById("rows");
  el.innerHTML=ORDER.map(k=>{
    const unm=k==="ei mittausta", pct=unm||!n[k]?0:(n[k]/maxMeas*100);
    return `<li${unm?' class="sep"':""}><button class="row" aria-pressed="${!hidden.has(k)}" data-k="${k}" style="color:${COLORS[k]}">
      <span class="sw" style="background:${COLORS[k]}"></span><span class="lbl" style="color:var(--text)">${T().cls[k]}</span>
      <span class="share" aria-hidden="true">${pct?`<i style="width:${pct.toFixed(1)}%"></i>`:""}</span><span class="n num">${n[k]}</span></button></li>`;
  }).join("");
  el.querySelectorAll(".row").forEach(b=>b.onclick=()=>{
    const k=b.dataset.k; hidden.has(k)?hidden.delete(k):hidden.add(k);
    b.setAttribute("aria-pressed",String(!hidden.has(k))); applyFilter();
  });
}

function currentWarns(only){
  const now=Date.now();
  return WARN.map((w,i)=>({w,i})).filter(({w,i})=>(!only||only.includes(i))&&new Date(w.expires)>now);
}
function warnItems(only){
  const now=Date.now(), list=currentWarns(only);
  if(!list.length) return `<p class="note">${T().noWarnings}</p>`;
  const byTime=(a,b)=>new Date(a.w.onset)-new Date(b.w.onset)||new Date(a.w.expires)-new Date(b.w.expires);
  const active=list.filter(({w})=>new Date(w.onset)<=now).sort(byTime);
  const later=list.filter(({w})=>new Date(w.onset)>now).sort(byTime);
  const row=({w,i},on)=>`<button class="warn${on?" now":""}" data-i="${i}"><b data-st="${on?T().inForce:T().upcoming}">${ic("tri")}${esc(areaOf(w))}</b>
    <span class="hz">${esc(hazardOf(w))}</span><span class="num">${fmtTime(w.onset)} – ${fmtTime(w.expires)}</span></button>`;
  let html="";
  if(active.length) html+=`<div class="wgrp now"><div class="wgrp-hd"><span class="wdot" aria-hidden="true"></span><span>${T().warnActiveHd}</span><span class="num">${active.length}</span></div>${active.map(x=>row(x,true)).join("")}</div>`;
  if(later.length) html+=`<div class="wgrp later"><div class="wgrp-hd"><span>${T().warnLaterHd}</span><span class="num">${later.length}</span></div>${later.map(x=>row(x,false)).join("")}</div>`;
  return html;
}
function renderWarnings(){
  const el=document.getElementById("warnsec"), n=currentWarns().length;
  el.innerHTML=`<h2><span>${T().warnings}</span><span class="num">${n}</span></h2><p class="note sub">${T().warnSub}</p>`+
   warnItems()+
   "";
  el.classList.toggle("open",warnOpen);
  el.insertAdjacentHTML("afterbegin",`<button class="warnsum" id="warnsum" aria-expanded="${warnOpen}">${ic("tri","tri")}<b>${T().warnings}</b>
    <span class="num">${n}</span><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.6" fill="none"/></svg></button>`);
  el.querySelectorAll(".warn").forEach(b=>b.onclick=()=>openWarn(+b.dataset.i));
  document.getElementById("warnsum").onclick=()=>{
    if(isMobile()) return openWarnList();          // puhelimessa lista alhaalta nousevaan paneeliin
    warnOpen=!warnOpen; el.classList.toggle("open",warnOpen);   // työpöydällä avautuu alaspäin
    document.getElementById("warnsum").setAttribute("aria-expanded",String(warnOpen));
  };
}
// vaaran kuvaus listaan: varoitustekstin ensimmäinen lause ilman "Liikennesää:"-alkua
const hazardOf=w=>{let t=(w.description[LANG]||w.description.fi||"").replace(/^[^:]{0,30}:\s*/,"");
  t=t.split(/(?<=\.)\s/)[0]; return t.length>110?t.slice(0,107).replace(/\s\S*$/,"")+"…":t};
const areaOf=w=>{const h=w.headline[LANG]||w.headline.fi||""; const i=h.indexOf(":"); return (i>0?h.slice(i+1):h).replace(/,\s*[^,]*\d[.:]\d\d.*$/,"").trim()};

/* liukastumassa: nyt luminen/jää ja 6 h sisällä parempi, tai kitka pudonnut ≥0,25 ja nyt < 0,5 */
function worsening(){
  const out=[];
  for(const c of DATA.cameras){
    if(!c.h) continue;
    const f=c.hf||[], cur=histAt(c,24), worse=(a,b)=>ORDER.indexOf(a)<ORDER.indexOf(b);
    let since=null, reason=null;
    if(SLIPPERY.includes(cur)){
      for(let i=23;i>=18;i--){ const k=histAt(c,i); if(k!=="ei mittausta" && worse(cur,k)){ since=24-(i+1); reason={from:k,to:cur}; break; } }
    }
    if(!reason && f[24]!=null && f[24]<0.5){
      const prev=f.slice(18,24).filter(x=>x!=null), mx=prev.length?Math.max(...prev):null;
      if(mx!=null && mx-f[24]>=0.25){ since=24-(18+f.slice(18,24).indexOf(mx))-1; reason={drop:[mx,f[24]],to:cur}; }
    }
    if(reason) out.push({c,since,reason});
  }
  return out.sort((a,b)=>(ORDER.indexOf(a.reason.to)-ORDER.indexOf(b.reason.to))||(a.since-b.since));
}
// rajaus: koko maa, kartan näkyvä alue tai valittu reitti (persoona-arvio: lista koski koko maata)
let worseScope="all";
function renderWorse(all){
  const el=document.getElementById("p-worse"), L=T();
  if(worseScope==="route"&&!ROUTE.geom) worseScope="all";
  const b=ready()&&worseScope==="view"?map.getBounds():null;
  const list=all.filter(({c})=>worseScope==="route"?ROUTE.ids.has(c.id):b?b.contains([c.lon,c.lat]):true);
  const seg=[["all",L.scopeAll],["view",L.scopeView],...(ROUTE.geom?[["route",L.scopeRoute]]:[])];
  el.innerHTML=`<div class="scope"><div class="lang seg" role="group" aria-label="${L.scopeLabel}">${seg.map(([k,n])=>
      `<button type="button" data-s="${k}" aria-pressed="${worseScope===k}">${n}</button>`).join("")}</div>
      ${worseScope!=="all"?`<span class="num">${list.length}/${all.length}</span>`:""}</div>
    <p class="blank" style="padding-bottom:8px;padding-top:8px">${L.worseIntro}</p>`+
   (list.length?`<ul class="list">${list.map(({c,since,reason})=>{const to=reason.to;
     const what=reason.drop?L.frictionDrop(num(reason.drop[0],"",2),num(reason.drop[1],"",2))
       :`${L.cls[reason.from]} → ${L.cls[to]}`;
     return `<li><button class="item" data-id="${esc(c.id)}"><span class="sw" style="background:${COLORS[to]}"></span>
       <span><b>${esc(nameOf(c))}</b><small>${esc(what)}</small></span><span class="ago">${L.ago(Math.max(0,since))}</span></button></li>`}).join("")}</ul>`
     :`<p class="blank">${worseScope==="all"?L.noWorse:L.noWorseHere}</p>`);
  el.querySelectorAll(".scope button").forEach(x=>x.onclick=()=>{worseScope=x.dataset.s; renderWorse(worsening());});
  el.querySelectorAll(".item").forEach(x=>x.onclick=()=>{ if(isMobile()) setCollapsed(true); openCam(x.dataset.id); });
}

function roadsList(){
  const g={};
  DATA.cameras.forEach(c=>{if(c.road!=null)(g[c.road]=g[c.road]||[]).push(c)});
  return Object.entries(g).filter(([,cs])=>cs.length>=3)
    .map(([r,cs])=>({road:+r,cams:cs.sort((a,b)=>(a.sec-b.sec)||(a.dist-b.dist))})).sort((a,b)=>a.road-b.road);
}
function renderRoads(){
  const el=document.getElementById("p-roads"), roads=roadsList();
  const sel=roads.find(r=>r.road===road);
  el.innerHTML=`<div class="roadsel"><label for="roadpick">${T().road}</label>
    <select id="roadpick"><option value="">${T().chooseRoad}</option>${roads.map(r=>`<option value="${r.road}" ${r.road===road?"selected":""}>${r.road} · ${T().cams(r.cams.length)}</option>`).join("")}</select></div>`+
   (sel?(()=>{const cs=sel.cams, worst=cs.filter(c=>clsAt(c)!=="ei mittausta").sort((a,b)=>ORDER.indexOf(clsAt(a))-ORDER.indexOf(clsAt(b)))[0];
     return `<div class="roadstrip"><div class="bars">${cs.map(c=>`<i title="${esc(nameOf(c))}" style="background:${COLORS[clsAt(c)]}"></i>`).join("")}</div>
       <div class="ends"><span>${esc(cs[0].mun||T().roadStart)}</span><span>${esc(cs[cs.length-1].mun||T().roadEnd)}</span></div></div>
       ${worst?`<p class="blank" style="padding-bottom:4px">${T().worst}: <b style="color:var(--text)">${esc(nameOf(worst))}</b> · ${T().cls[clsAt(worst)]}</p>`:""}
       <ul class="list">${cs.map(c=>`<li><button class="item" data-id="${esc(c.id)}"><span class="sw" style="background:${COLORS[clsAt(c)]}"></span>
         <span><b>${esc(nameOf(c))}</b><small>${esc(c.mun||"")}</small></span><span class="ago">${T().cls[clsAt(c)]}</span></button></li>`).join("")}</ul>`})():"");
  el.querySelector("#roadpick").onchange=e=>{
    road=e.target.value?+e.target.value:null; renderRoads(); renderLegend(); applyFilter();
    if(road!=null){const cs=roadsList().find(r=>r.road===road).cams, b=new maplibregl.LngLatBounds();
      cs.forEach(c=>b.extend([c.lon,c.lat])); map.fitBounds(b,{padding:fitPadding(),maxZoom:10});}
  };
  el.querySelectorAll(".item").forEach(b=>b.onclick=()=>{ if(isMobile()) setCollapsed(true); openCam(b.dataset.id); });
}

const keyEl=document.getElementById("key"), foldBtn=document.getElementById("fold");
function setCollapsed(c){
  keyEl.classList.toggle("collapsed",c);
  if(c) keyEl.classList.remove("search-only");
  foldBtn.setAttribute("aria-expanded",String(!c));
  foldBtn.setAttribute("aria-label",c?T().camSearchLabel:T().close);
  if(!map.loaded()) return; if(routeOn) fitRoute(); else if(road==null) lockToFinland();
}
foldBtn.onclick=()=>{
  if(keyEl.classList.contains("collapsed")){
    document.querySelectorAll('[role="tab"]').forEach(x=>{const on=x.id==="tab-map";x.setAttribute("aria-selected",on);
      document.getElementById(x.getAttribute("aria-controls")).hidden=!on});
    syncTabIdx();
    keyEl.classList.add("search-only");
    setCollapsed(false);
    const inp=document.getElementById("camq"); if(inp) inp.focus();
  }else{
    setCollapsed(true);
  }
};
if(isMobile()){ keyEl.classList.add("collapsed"); foldBtn.setAttribute("aria-expanded","false"); }
// Välilehdet: nuolinäppäimet ja kiertävä tabindex (ARIA tabs -malli).
const TABS=[...document.querySelectorAll('[role="tab"]')];
const syncTabIdx=()=>TABS.forEach(x=>x.tabIndex=x.getAttribute("aria-selected")==="true"?0:-1);
TABS.forEach((t,i)=>t.addEventListener("keydown",e=>{
  const j={ArrowRight:i+1,ArrowLeft:i-1,Home:0,End:TABS.length-1}[e.key]; if(j==null) return;
  e.preventDefault(); const n=TABS[(j+TABS.length)%TABS.length]; n.focus(); n.click();}));
document.querySelectorAll('[role="tab"]').forEach(t=>t.onclick=()=>{
  const active=t.getAttribute("aria-selected")==="true";
  const wasSearchOnly=keyEl.classList.contains("search-only");
  keyEl.classList.remove("search-only");
  if(active&&!keyEl.classList.contains("collapsed")&&!wasSearchOnly){ setCollapsed(true); return; }
  if(keyEl.classList.contains("collapsed")) setCollapsed(false);
  document.querySelectorAll('[role="tab"]').forEach(x=>{const on=x===t;x.setAttribute("aria-selected",on);
    document.getElementById(x.getAttribute("aria-controls")).hidden=!on});
  if(t.id!=="tab-roads" && road!=null){ road=null; renderRoads(); renderLegend(); applyFilter(); }
  setRouteVisible(t.id==="tab-route");
  syncTabIdx();
});
document.querySelectorAll(".lang button").forEach(b=>b.onclick=()=>{
  LANG=b.dataset.lang; try{localStorage.setItem("lang",LANG)}catch(e){}
  const u=new URL(location); u.searchParams.set("lang",LANG); history.replaceState(null,"",u);
  renderAll();
});

// Kamerahaku: ainoa tapa päästä kameraan näppäimistöllä ja ruudunlukijalla (karttapisteet eivät ole fokusoitavia).
const norm=s=>(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
(function setupCamSearch(){
  const inp=document.getElementById("camq"), ul=document.getElementById("camres"), clr=document.getElementById("camclr");
  const syncClr=()=>{clr.hidden=!inp.value};
  const cb=createCombobox({
    input:inp, list:ul, minLen:2, activeIdPrefix:"camopt-",
    onInput:syncClr,
    query:raw=>{
      if(!DATA) return null;
      const q=norm(raw), words=q.split(/\s+/);
      return DATA.cameras.map(c=>{const hay=norm(`${nameOf(c)} ${c.name} ${c.mun||""} ${c.road!=null?"tie road vt kt "+c.road:""}`);
          if(!words.every(w=>hay.includes(w))) return null;
          return {c,score:(norm(nameOf(c)).startsWith(q)?0:1)+(c.cls?0:.5)};})
        .filter(Boolean).sort((a,b)=>a.score-b.score||nameOf(a.c).localeCompare(nameOf(b.c))).slice(0,8).map(x=>x.c);
    },
    renderItem:(c,i,sel)=>{const k=clsAt(c);return `<li><button type="button" class="cam" role="option" id="camopt-${i}" aria-selected="${sel}" data-i="${i}">
      <span class="sw" style="background:${COLORS[k]}"></span><span>${esc(nameOf(c))}</span><span class="k">${T().cls[k]}</span>${c.mun?`<small>${esc(c.mun)}</small>`:""}</button></li>`;},
    renderEmpty:()=>`<li><span class="blank" style="display:block;padding:8px 10px">${T().camNone}</span></li>`,
    onPick:c=>{inp.value=""; syncClr(); if(isMobile()) setCollapsed(true); openCam(c.id);}
  });
  clr.onclick=()=>{inp.value=""; syncClr(); cb.clear(); inp.focus();};
})();

// Haitarit: Tietosuoja skrollautuu näkyviin avattaessa; Esc sulkee avoimet haitarit.
document.querySelector(".privacy").addEventListener("toggle",e=>{
  if(e.target.open) e.target.scrollIntoView({behavior:prefersReduced()?"auto":"smooth",block:"end"});
});
addEventListener("keydown",e=>{
  if(e.key!=="Escape") return;
  document.querySelectorAll(".key details[open]").forEach(d=>{
    const hadFocus=d.contains(document.activeElement);
    d.open=false;
    if(hadFocus) d.querySelector("summary").focus({preventScroll:true});
  });
});
