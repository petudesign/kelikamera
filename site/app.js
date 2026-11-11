// Kelikamera – karttasivun logiikka (ladataan defer-skriptinä MapLibren jälkeen, globaali näkyvyys säilyy)
/* ===================== tekstit / strings ===================== */
const STR={
 fi:{locale:"fi-FI",title:"Kelikamera · Suomen tiet nyt",mapLabel:"Kelikamerakartta",
  tabMap:"Kartta",tabRoute:"Reitti",tabWorse:"Liukastumassa",tabRoads:"Tiet",
  from:"Mistä",to:"Minne",myLoc:"Oma sijainti",locating:"Haetaan sijaintia…",locFail:"Sijaintia ei saatu.",
  searching:"Haetaan reittiä…",routeFail:"Reittiä ei löytynyt.",clearRoute:"Tyhjennä reitti",placeholderFrom:"esim. Kamppi, Helsinki",placeholderTo:"esim. Levi",
  hm:(h,m)=>h?`n. ${h} h ${m} min`:`n. ${m} min`,onRoute:(n,m)=>`Reitin varrella ${n} kelikameraa, joista ${m} mitattu.`,
  slipN:(parts,km,name)=>`<b>${parts}.</b> Ensimmäinen ${km} km kohdalla: ${name}.`,slipPart:{"jää/kuura":n=>`Jäätä tai kuuraa ${n} kohdassa`,"luminen":n=>`Lunta tai sohjoa ${n} kohdassa`},
  wetN:n=>` Märkää tai kosteaa ${n} kohdassa.`,
  noSlip:"Mitatuilla kohdilla ei lunta eikä jäätä.",warnOnRoute:(n,t)=>`${n===1?"Reitillä on voimassa liikennesäävaroitus":`Reitillä on voimassa ${n} liikennesäävaroitusta`} nyt tai 12 tunnin sisällä.`,warnLater:(n,t)=>`Ei varoituksia seuraavaan 12 tuntiin. ${n===1?"Varoitus":`${n} varoitusta`} alkaa myöhemmin, ensimmäinen ${t}.`,showWarnings:"Näytä varoitukset",
  unmeasured:(p,gap,a,b)=>`${p} % reitin kameroista ilman mittausta.${gap>=30?` Pisin väli ilman mittausta n. ${gap} km (${a}–${b} km).`:""}`,
  disclaimer:"Tilannekuva mitatuista kohdista, ei ajokeliennuste. Tarkista viralliset varoitukset ennen lähtöä.",
  routeSrc:"Reititys: OSRM / FOSSGIS · Haku: Photon / komoot · © OpenStreetMap",fromStart:"lähtö",
  cls:{"kuiva":"Kuiva","kostea":"Kostea","märkä":"Märkä","luminen":"Luminen / sohjo","jää/kuura":"Jää / kuura","ei mittausta":"Ei mittausta"},
  explain:"Värit ovat tiesääaseman mittaama keli alle 5 km päässä kamerasta. Kuudelta kamerasta kymmenestä mittaus puuttuu: niille opetan tekoälyä arvioimaan kelin kuvasta.",
  warnings:"Liikennesäävaroitukset",warnSrc:"Ilmatieteen laitos",warnSub:"Ilmatieteen laitoksen viralliset varoitukset",noWarnings:"Ei voimassa olevia liikennesäävaroituksia.",
  inForce:"VOIMASSA",upcoming:"tulossa",official:"Virallinen varoitus · Ilmatieteen laitos",readMore:"Kaikki varoitukset",
  worseIntro:"Kamerat, joissa keli on muuttunut lumiseksi tai jäiseksi viimeisen 6 tunnin aikana, tai kitka on pudonnut selvästi.",
  noWorse:"Ei huonontuneita kelejä viimeisen 6 tunnin aikana.",ago:h=>h===0?"nyt":`${h} h sitten`,
  frictionDrop:(a,b)=>`kitka ${a} → ${b}`,
  road:"Tie",chooseRoad:"Valitse tie",roadStart:"Tien alku",roadEnd:"Tien loppu",cams:n=>`${n} kameraa`,worst:"Pahin kohta",
  measured:"Mitattu",station:"asema",aiSoon:"Ei anturia lähellä · katso kamerakuva",lastRoute:"Viimeisin reitti",thinIce:mm=>`Anturi näkee ohuen kerroksen (${mm}), mutta kitka on vielä hyvä.`,viewMap:{"Tienpinta":"Tienpinta"},close:"Sulje",
  camNow:"Kamerakuva · Fintraffic",camTaken:t=>`otettu ${t}`,camLatest:"tuorein kuva, ei valitulta hetkeltä",camLoading:"haetaan valitun hetken kuvaa…",noImg:"Kuva ei ole saatavilla",noHist:"Ei mittaushistoriaa",camGap:t=>`${t} valitusta hetkestä`,friction:"Kitka µ",slippery:"Liukas · jää ~0,1",grippy:"Pitävä · kuiva 0,82",
  roadT:"Tien lämpötila",airT:"Ilman lämpötila",water:"Vesi",snow:"Lumi",ice:"Jää",
  noMeasure:"Ei mitattua keliä",far:km=>`Lähin tiesääasema on ${km} päässä, eikä sen mittaus kerro tämän kameran kelistä.`,
  nosensor:"Lähimmällä tiesääasemalla ei ole tienpinnan kelianturia.",aiNote:"Tähän tulee tekoälyn arvio kamerakuvasta.",
  last24:"Viimeiset 24 h",now:"Nyt",ago24:"−24 h",ago12:"−12 h",play:"Toista viimeiset 24 h",pause:"Pysäytä",
  timeAt:"Klo",pastNote:"Kartta näyttää kelin hetkellä",data:"Data",fmi:"Ilmatieteen laitos",
  expand:"Näytä",collapse:"Piilota",causes:{snowOrSleet:"lumi- tai räntäsade",freezingRain:"jäätävä sade",slipperyRoad:"liukkaus",iceOnRoad:"jää"}},
 en:{locale:"en-GB",title:"Kelikamera · Finnish roads now",mapLabel:"Road weather camera map",
  tabMap:"Map",tabRoute:"Route",tabWorse:"Getting slippery",tabRoads:"Roads",
  from:"From",to:"To",myLoc:"My location",locating:"Getting your location…",locFail:"Couldn't get your location.",
  searching:"Finding a route…",routeFail:"No route found.",clearRoute:"Clear route",placeholderFrom:"e.g. Kamppi, Helsinki",placeholderTo:"e.g. Levi",
  hm:(h,m)=>h?`about ${h} h ${m} min`:`about ${m} min`,onRoute:(n,m)=>`${n} road weather cameras along the route, ${m} of them measured.`,
  slipN:(parts,km,name)=>`<b>${parts}.</b> The first at ${km} km: ${name}.`,slipPart:{"jää/kuura":n=>`Ice or frost at ${n} ${n===1?"spot":"spots"}`,"luminen":n=>`Snow or slush at ${n} ${n===1?"spot":"spots"}`},
  wetN:n=>` Wet or moist at ${n} ${n===1?"spot":"spots"}.`,
  noSlip:"No snow or ice at the measured spots.",warnOnRoute:(n,t)=>`${n===1?"A traffic weather warning is":`${n} traffic weather warnings are`} in force on the route now or within 12 hours.`,warnLater:(n,t)=>`No warnings for the next 12 hours. ${n===1?"A warning starts":`${n} warnings start`} later, the first ${t}.`,showWarnings:"Show warnings",
  unmeasured:(p,gap,a,b)=>`${p} % of the route's cameras have no measurement.${gap>=30?` The longest stretch without one is about ${gap} km (km ${a}–${b}).`:""}`,
  disclaimer:"A snapshot of measured spots, not a driving forecast. Check official warnings before you leave.",
  routeSrc:"Routing: OSRM / FOSSGIS · Search: Photon / komoot · © OpenStreetMap",fromStart:"start",
  cls:{"kuiva":"Dry","kostea":"Moist","märkä":"Wet","luminen":"Snow / slush","jää/kuura":"Ice / frost","ei mittausta":"No measurement"},
  explain:"Colours are conditions measured by a road weather station within 5 km of the camera. Six in ten cameras have no measurement: I'm training an AI to estimate their conditions from the image.",
  warnings:"Traffic weather warnings",warnSrc:"Finnish Meteorological Institute",warnSub:"Official warnings from the Finnish Meteorological Institute",noWarnings:"No traffic weather warnings in force.",
  inForce:"IN FORCE",upcoming:"upcoming",official:"Official warning · Finnish Meteorological Institute",readMore:"All warnings",
  worseIntro:"Cameras where the road turned snowy or icy in the last 6 hours, or friction dropped clearly.",
  noWorse:"No worsening conditions in the last 6 hours.",ago:h=>h===0?"now":`${h} h ago`,
  frictionDrop:(a,b)=>`friction ${a} → ${b}`,
  road:"Road",chooseRoad:"Choose a road",roadStart:"Road start",roadEnd:"Road end",cams:n=>`${n} cameras`,worst:"Worst spot",
  measured:"Measured",station:"station",aiSoon:"No sensor nearby · see the camera image",lastRoute:"Last route",thinIce:mm=>`The sensor sees a thin layer (${mm}), but friction is still good.`,viewMap:{"Tienpinta":"Road surface","tienpinta":"Road surface"},close:"Close",
  camNow:"Camera image · Fintraffic",camTaken:t=>`taken ${t}`,camLatest:"latest image, not from the selected time",camLoading:"loading the image from the selected time…",noImg:"Image not available",noHist:"No measurement history",camGap:t=>`${t} from the selected time`,friction:"Friction µ",slippery:"Slippery · ice ~0.1",grippy:"Grippy · dry 0.82",
  roadT:"Road temperature",airT:"Air temperature",water:"Water",snow:"Snow",ice:"Ice",
  noMeasure:"No measured conditions",far:km=>`The nearest road weather station is ${km} away, so its reading doesn't describe this camera's road.`,
  nosensor:"The nearest road weather station has no road surface sensor.",aiNote:"An AI estimate from the camera image will appear here.",
  last24:"Last 24 h",now:"Now",ago24:"−24 h",ago12:"−12 h",play:"Play the last 24 h",pause:"Pause",
  timeAt:"At",pastNote:"Map shows conditions at",data:"Data",fmi:"Finnish Meteorological Institute",
  expand:"Show",collapse:"Hide",causes:{snowOrSleet:"snow or sleet",freezingRain:"freezing rain",slipperyRoad:"slippery road",iceOnRoad:"ice"}}
};
let LANG=(()=>{const q=new URLSearchParams(location.search).get("lang");if(q in STR)return q;
  try{const s=localStorage.getItem("lang");if(s in STR)return s}catch(e){}
  return (navigator.language||"fi").toLowerCase().startsWith("fi")?"fi":"en"})();
const T=()=>STR[LANG];

/* ===================== perusasiat ===================== */
const css=getComputedStyle(document.documentElement), v=n=>css.getPropertyValue(n).trim();
const KEYS=["kuiva","kostea","märkä","luminen","jää/kuura"];
const COLORS={"kuiva":v("--kuiva"),"kostea":v("--kostea"),"märkä":v("--marka"),"luminen":v("--luminen"),"jää/kuura":v("--jaa"),"ei mittausta":v("--none")};
const ORDER=["jää/kuura","luminen","märkä","kostea","kuiva","ei mittausta"];
const hidden=new Set();
let warnOpen=false;
let ROUTE={ids:new Set(),cams:[],geom:null,km:0,h:0,from:null,to:null}, routeOn=false;
let DATA, WARN=[], byId={}, slot=24, current=null, road=null, playing=null;

const fmt=(s,o)=>new Date(s).toLocaleString(T().locale,o);
const fmtTime=s=>fmt(s,{weekday:"short",day:"numeric",month:"numeric",hour:"2-digit",minute:"2-digit"});
const fmtClock=s=>fmt(s,{hour:"2-digit",minute:"2-digit"});
const num=(x,u="",d=1)=>x==null?"–":`${x.toLocaleString(T().locale,{minimumFractionDigits:d,maximumFractionDigits:d})}${u}`;
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const nameOf=c=>(c.names&&c.names[LANG])||c.name;
const X='<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.6"/></svg>';
const PLAY='<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>';
const PAUSE='<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" fill="currentColor"/></svg>';

// keli kameralle valitulla hetkellä
function clsAt(c,i=slot){
  if(i===24 || !c.h) return i===24 ? (c.cls||"ei mittausta") : "ei mittausta";
  const x=c.h[i]; return x>=0?KEYS[x]:"ei mittausta";
}

/* ===================== kartta ===================== */
const FINLAND=[[19.0,59.6],[31.7,70.1]];
function fitPadding(){
  const mobile=innerWidth<=720, key=document.getElementById("key");
  return mobile?{top:key.offsetHeight+20,bottom:80,left:12,right:12}:{top:64,bottom:90,left:390,right:24};
}
const map=new maplibregl.Map({container:"map",style:"https://tiles.openfreemap.org/styles/dark",
  bounds:FINLAND,fitBoundsOptions:{padding:fitPadding()},maxZoom:14,attributionControl:false});
map.addControl(new maplibregl.NavigationControl({showCompass:false}),"bottom-right");
function lockToFinland(){
  map.setMaxBounds(null); map.setMinZoom(0);
  map.fitBounds(FINLAND,{padding:fitPadding(),animate:false});
  const b=map.getBounds(), dx=(b.getEast()-b.getWest())*.15, dy=(b.getNorth()-b.getSouth())*.1;
  map.setMinZoom(map.getZoom()-.2);
  map.setMaxBounds([[b.getWest()-dx,b.getSouth()-dy],[b.getEast()+dx,b.getNorth()+dy]]);
}
map.once("load",lockToFinland);
let rz; addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(lockToFinland,150)});

Promise.all([fetch("data/latest.json").then(r=>r.json()),fetch("data/warnings.json").then(r=>r.json()).catch(()=>({warnings:[]}))])
.then(([d,w])=>{
  DATA=d; WARN=w.warnings||[]; d.cameras.forEach(c=>byId[c.id]=c);
  renderAll(); syncTabIdx(); document.getElementById("key").classList.remove("loading");
  map.loaded()?addLayers():map.on("load",addLayers);
});

function geojson(){
  return {type:"FeatureCollection",features:DATA.cameras.map(c=>{const k=clsAt(c);return {type:"Feature",
    geometry:{type:"Point",coordinates:[c.lon,c.lat]},
    properties:{id:c.id,k,road:c.road??-1,rank:ORDER.length-ORDER.indexOf(k),dim:routeOn&&!ROUTE.ids.has(c.id)?1:0}}})};
}
// kartalla vain kartan hetkellä voimassa olevat varoitukset (+ valittu)
function activeWarn(){const at=slot===24?Date.now():new Date(DATA.times[slot]).getTime();
  return WARN.map((w,i)=>new Date(w.onset)<=at&&new Date(w.expires)>at?i:-1).filter(i=>i>=0)}
function warnFilter(){const sel=current&&current.type==="warn"?[current.i]:[];return ["in",["get","i"],["literal",[...activeWarn(),...sel]]]}
function warnGeo(){
  return {type:"FeatureCollection",features:WARN.map((w,i)=>({type:"Feature",
    geometry:{type:"MultiPolygon",coordinates:w.polygons.map(r=>[r])},properties:{i,color:w.color}}))};
}
function addLayers(){
  map.addSource("fin",{type:"geojson",data:"data/finland.geojson"});
  map.addLayer({id:"outside",type:"fill",source:"fin",filter:["==",["get","role"],"mask"],
    paint:{"fill-color":"#0b0d10","fill-opacity":["interpolate",["linear"],["zoom"],5,.72,7,.5,9,0]}});
  map.addLayer({id:"border",type:"line",source:"fin",filter:["==",["get","role"],"border"],
    paint:{"line-color":"#9fb0c4","line-opacity":["interpolate",["linear"],["zoom"],5,.35,9,0],"line-width":1}});
  map.addSource("warn",{type:"geojson",data:warnGeo()});
  map.addLayer({id:"warn-fill",type:"fill",source:"warn",filter:warnFilter(),paint:{"fill-color":v("--warn"),"fill-opacity":.08}});
  map.addLayer({id:"warn-line",type:"line",source:"warn",filter:warnFilter(),paint:{"line-color":v("--warn"),"line-width":1.2,"line-opacity":.7,"line-dasharray":[3,2]}});
  map.addLayer({id:"warn-sel",type:"line",source:"warn",filter:["==",["get","i"],-1],paint:{"line-color":v("--warn"),"line-width":2.5}});
  map.addSource("route",{type:"geojson",data:{type:"FeatureCollection",features:[]}});
  map.addLayer({id:"route-case",type:"line",source:"route",layout:{"line-join":"round","line-cap":"round"},paint:{"line-color":"#0b0d10","line-width":7}});
  map.addLayer({id:"route",type:"line",source:"route",layout:{"line-join":"round","line-cap":"round"},paint:{"line-color":"#c9d3df","line-width":3}});
  map.addSource("cams",{type:"geojson",data:geojson()});
  map.addLayer({id:"cams-halo",type:"circle",source:"cams",filter:["==",["get","k"],"jää/kuura"],
    paint:{"circle-radius":["interpolate",["linear"],["zoom"],4,9,10,18],"circle-color":COLORS["jää/kuura"],"circle-opacity":.22,"circle-blur":.6}});
  map.addLayer({id:"cams",type:"circle",source:"cams",layout:{"circle-sort-key":["get","rank"]},
    paint:{
      "circle-radius":["interpolate",["linear"],["zoom"],4,["case",["==",["get","k"],"ei mittausta"],2.2,3.6],10,["case",["==",["get","k"],"ei mittausta"],5,8]],
      "circle-color":["match",["get","k"],...Object.entries(COLORS).flat(),"#888"],
      "circle-stroke-width":["case",["==",["get","k"],"ei mittausta"],0,["==",["get","k"],"jää/kuura"],2,1],
      "circle-stroke-color":["case",["==",["get","k"],"jää/kuura"],"#ffffff","#0b0d10"],
      "circle-opacity":["case",["==",["get","dim"],1],.12,1],"circle-stroke-opacity":["case",["==",["get","dim"],1],0,1]}});
  map.addLayer({id:"cams-sel",type:"circle",source:"cams",filter:["==",["get","id"],""],
    paint:{"circle-radius":12,"circle-color":"transparent","circle-stroke-width":2,"circle-stroke-color":"#fff"}});

  const tip=new maplibregl.Popup({closeButton:false,closeOnClick:false,offset:10});
  map.on("mouseenter","cams",e=>{map.getCanvas().style.cursor="pointer";const p=e.features[0].properties;
    tip.setLngLat(e.lngLat).setHTML(`${esc(nameOf(byId[p.id]))} · ${T().cls[p.k]}`).addTo(map)});
  map.on("mouseleave","cams",()=>{map.getCanvas().style.cursor="";tip.remove()});
  map.on("click",e=>{
    // kosketuksessa 22 px säde (44 px kosketusalue), hiirellä 8 px; lähin piste voittaa
    const r=matchMedia("(pointer: coarse)").matches?22:8, {x,y}=e.point;
    const hits=map.queryRenderedFeatures([[x-r,y-r],[x+r,y+r]],{layers:["cams"]}).filter(f=>f.properties.dim!==1);
    if(hits.length){
      const d=f=>{const p=map.project(f.geometry.coordinates);return (p.x-x)**2+(p.y-y)**2};
      const best=hits.reduce((a,b)=>d(b)<d(a)?b:a);
      if(d(best)<=r*r) return openCam(best.properties.id);
    }
    const w=map.queryRenderedFeatures(e.point,{layers:["warn-fill"]})[0];
    if(w) return openWarn(w.properties.i);
    closePanel();
  });
  applyFilter();
}
const ready=()=>!!map.getLayer("cams");
function refreshMap(){ if(!ready())return; map.getSource("cams").setData(geojson()); applyFilter(); }
function refreshWarn(){ if(!ready())return; ["warn-fill","warn-line"].forEach(l=>map.setFilter(l,warnFilter())); }
function applyFilter(){
  if(!ready()) return;
  const f=["all"];
  if(hidden.size) f.push(["!",["in",["get","k"],["literal",[...hidden]]]]);
  if(road!=null) f.push(["==",["get","road"],road]);
  map.setFilter("cams",f.length>1?f:null);
  map.setFilter("cams-halo",["all",["==",["get","k"],"jää/kuura"],["==",["get","dim"],0],...(road!=null?[["==",["get","road"],road]]:[]),...(hidden.has("jää/kuura")?[["==",1,0]]:[])]);
}
const select=id=>{if(ready())map.setFilter("cams-sel",["==",["get","id"],id])};

/* ===================== vasen kortti ===================== */
function renderAll(){
  document.documentElement.lang=LANG; document.title=T().title;
  document.getElementById("map").setAttribute("aria-label",T().mapLabel);
  document.getElementById("slider").setAttribute("aria-label",LANG==="en"?"Timeline, last 24 hours":"Aikajana, viimeiset 24 tuntia");
  if(!foldBtn.getAttribute("aria-label")||!keyEl.classList.contains("collapsed")) foldBtn.setAttribute("aria-label",keyEl.classList.contains("collapsed")?T().expand:T().collapse);
  document.querySelectorAll("[data-t]").forEach(el=>el.textContent=T()[el.dataset.t]);
  document.querySelectorAll(".lang button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.lang===LANG)));
  const u=document.getElementById("updated"); const today=new Date(DATA.run).toDateString()===new Date().toDateString();
  u.textContent=isMobile()&&today?fmtClock(DATA.run):fmt(DATA.run,{day:"numeric",month:"numeric",hour:"2-digit",minute:"2-digit"}); u.dateTime=DATA.run;
  const worse=worsening();
  document.getElementById("tab-map").textContent=T().tabMap;
  document.getElementById("tab-route").textContent=T().tabRoute;
  document.getElementById("from").placeholder=T().placeholderFrom; document.getElementById("to").placeholder=T().placeholderTo;
  document.getElementById("locate").setAttribute("aria-label",T().myLoc); document.getElementById("locate").title=T().myLoc;
  document.getElementById("tab-worse").innerHTML=`${T().tabWorse}${worse.length?`<span class="badge num">${worse.length}</span>`:""}`;
  document.getElementById("tab-roads").textContent=T().tabRoads;
  renderLegend(); renderWarnings(); renderWorse(worse); renderRoads(); renderTimeline(); renderRoute();
  if(current) current.type==="cam"?openCam(current.id,true):current.type==="warnlist"?openWarnList(current.only):openWarn(current.i,true);
}

function counts(){
  const n=Object.fromEntries(ORDER.map(k=>[k,0]));
  DATA.cameras.forEach(c=>{if(road==null||c.road===road)n[clsAt(c)]++});
  return n;
}
function renderLegend(){
  const n=counts(), total=Object.values(n).reduce((a,b)=>a+b,0)||1;
  const el=document.getElementById("rows");
  el.innerHTML=ORDER.map(k=>`<li><button class="row" aria-pressed="${!hidden.has(k)}" data-k="${k}" style="color:${COLORS[k]}">
    <span class="sw" style="background:${COLORS[k]}"></span><span class="lbl" style="color:var(--text)">${T().cls[k]}</span>
    <span class="n num">${n[k]}</span><span class="share" aria-hidden="true"><i style="width:${(n[k]/total*100).toFixed(1)}%"></i></span></button></li>`).join("");
  el.querySelectorAll(".row").forEach(b=>b.onclick=()=>{
    const k=b.dataset.k; hidden.has(k)?hidden.delete(k):hidden.add(k);
    b.setAttribute("aria-pressed",String(!hidden.has(k))); applyFilter();
  });
}

function warnItems(only){
  const now=Date.now();
  return WARN.length?WARN.map((w,i)=>{if(only&&!only.includes(i))return "";const on=new Date(w.onset)<=now;
     return `<button class="warn${on?" now":""}" data-i="${i}"><b data-st="${on?T().inForce:T().upcoming}"><i></i>${esc(areaOf(w))}</b>
       <span class="hz">${esc(hazardOf(w))}</span><span class="num">${fmtTime(w.onset)} – ${fmtTime(w.expires)}</span></button>`}).join("")
     :`<p class="note">${T().noWarnings}</p>`;
}
function openWarnList(only){
  current={type:"warnlist",only:Array.isArray(only)?only:null}; select(""); if(isMobile()) setCollapsed(true);
  const L=T(), p=document.getElementById("panel");
  p.setAttribute("aria-label",L.warnings);
  p.innerHTML=`<div class="scroll">
    <div class="status" style="--c:var(--warn)"><div><b>${L.warnings}</b><small>${L.warnSub}</small></div>
      <button class="x" aria-label="${L.close}">${X}</button></div>
    <div class="wlist">${warnItems(current.only)}</div></div>`;
  p.querySelectorAll(".warn").forEach(b=>b.onclick=()=>openWarn(+b.dataset.i));
  p.classList.add("on"); panelShown(p);
}
function renderWarnings(){
  const el=document.getElementById("warnsec");
  el.innerHTML=`<h2><span>${T().warnings}</span><span class="num">${WARN.length}</span></h2><p class="note sub">${T().warnSub}</p>`+
   warnItems()+
   "";
  el.classList.toggle("open",warnOpen);
  el.insertAdjacentHTML("afterbegin",`<button class="warnsum" id="warnsum" aria-expanded="${warnOpen}"><i></i><b>${T().warnings}</b>
    <span class="num">${WARN.length}</span><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.6" fill="none"/></svg></button>`);
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
    const h=c.h, f=c.hf||[], cur=h[24];
    let since=null, reason=null;
    if(cur>=3){
      for(let i=23;i>=18;i--){ if(h[i]>=0 && h[i]<cur){ since=24-(i+1); reason={from:h[i],to:cur}; break; } }
    }
    if(!reason && f[24]!=null && f[24]<0.5){
      const prev=f.slice(18,24).filter(x=>x!=null), mx=prev.length?Math.max(...prev):null;
      if(mx!=null && mx-f[24]>=0.25){ since=24-(18+f.slice(18,24).indexOf(mx))-1; reason={drop:[mx,f[24]],to:cur}; }
    }
    if(reason) out.push({c,since,reason});
  }
  return out.sort((a,b)=>(b.reason.to-a.reason.to)||(a.since-b.since));
}
function renderWorse(list){
  const el=document.getElementById("p-worse");
  el.innerHTML=`<p class="blank" style="padding-bottom:8px">${T().worseIntro}</p>`+
   (list.length?`<ul class="list">${list.map(({c,since,reason})=>{const to=KEYS[reason.to]||"ei mittausta";
     const what=reason.drop?T().frictionDrop(num(reason.drop[0],"",2),num(reason.drop[1],"",2))
       :`${T().cls[KEYS[reason.from]]} → ${T().cls[to]}`;
     return `<li><button class="item" data-id="${c.id}"><span class="sw" style="background:${COLORS[to]}"></span>
       <span><b>${esc(nameOf(c))}</b><small>${esc(what)}</small></span><span class="ago">${T().ago(Math.max(0,since))}</span></button></li>`}).join("")}</ul>`
     :`<p class="blank">${T().noWorse}</p>`);
  el.querySelectorAll(".item").forEach(b=>b.onclick=()=>{const c=byId[b.dataset.id];
    if(innerWidth<=720) setCollapsed(true);
    map.flyTo({center:[c.lon,c.lat],zoom:Math.max(map.getZoom(),8),offset:innerWidth<=720?[0,-innerHeight*.28]:[-180,0]}); openCam(c.id)});
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
       <ul class="list">${cs.map(c=>`<li><button class="item" data-id="${c.id}"><span class="sw" style="background:${COLORS[clsAt(c)]}"></span>
         <span><b>${esc(nameOf(c))}</b><small>${esc(c.mun||"")}</small></span><span class="ago">${T().cls[clsAt(c)]}</span></button></li>`).join("")}</ul>`})():"");
  el.querySelector("#roadpick").onchange=e=>{
    road=e.target.value?+e.target.value:null; renderRoads(); renderLegend(); applyFilter();
    if(road!=null){const cs=roadsList().find(r=>r.road===road).cams, b=new maplibregl.LngLatBounds();
      cs.forEach(c=>b.extend([c.lon,c.lat])); map.fitBounds(b,{padding:fitPadding(),maxZoom:10});}
  };
  el.querySelectorAll(".item").forEach(b=>b.onclick=()=>{ if(innerWidth<=720) setCollapsed(true); openCam(b.dataset.id); });
}

/* välilehdet */
const keyEl=document.getElementById("key"), foldBtn=document.getElementById("fold");
function setCollapsed(c){ keyEl.classList.toggle("collapsed",c); foldBtn.setAttribute("aria-expanded",String(!c));
  foldBtn.setAttribute("aria-label",c?T().expand:T().collapse);
  if(!map.loaded()) return; if(routeOn) fitRoute(); else if(road==null) lockToFinland(); }
foldBtn.onclick=()=>setCollapsed(!keyEl.classList.contains("collapsed"));
if(matchMedia("(max-width:720px)").matches) keyEl.classList.add("collapsed");
// välilehdet: nuolinäppäimet ja kiertävä tabindex (ARIA tabs -malli)
const TABS=[...document.querySelectorAll('[role="tab"]')];
const syncTabIdx=()=>TABS.forEach(x=>x.tabIndex=x.getAttribute("aria-selected")==="true"?0:-1);
TABS.forEach((t,i)=>t.addEventListener("keydown",e=>{
  const j={ArrowRight:i+1,ArrowLeft:i-1,Home:0,End:TABS.length-1}[e.key]; if(j==null) return;
  e.preventDefault(); const n=TABS[(j+TABS.length)%TABS.length]; n.focus(); n.click();}));
document.querySelectorAll('[role="tab"]').forEach(t=>t.onclick=()=>{
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


/* ===================== reitti ===================== */
// Paikkahaku: Photon (komoot, OSM-data). Reititys: OSRM FOSSGISin palvelimella. Molemmat maksuttomia
// kohtuukäyttöön, joten haku viivästetään kirjoittamisen loppuun ja reitti haetaan kerran per valinta.
const PHOTON="https://photon.komoot.io/api/", OSRM="https://routing.openstreetmap.de/routed-car/route/v1/driving/";
const FI_BBOX="19.0,59.6,31.7,70.1", NEAR_KM=0.6;
const placeLabel=p=>{const n=p.name||[p.street,p.housenumber].filter(Boolean).join(" ");
  const sub=[p.name&&p.street?[p.street,p.housenumber].filter(Boolean).join(" "):null,p.city||p.county||p.state].filter(Boolean).join(", ");
  return {n:n||sub,sub:n?sub:""}};
function setupField(id){
  const inp=document.getElementById(id), ul=document.getElementById("sugg-"+id); let timer, items=[], sel=-1, ctrl;
  const close=()=>{ul.hidden=true;inp.setAttribute("aria-expanded","false");sel=-1};
  const pick=i=>{const f=items[i]; if(!f)return; const L=placeLabel(f.properties);
    inp.value=L.n+(L.sub?", "+L.sub:""); ROUTE[id]={lon:f.geometry.coordinates[0],lat:f.geometry.coordinates[1],name:L.n}; close(); maybeRoute();};
  const draw=()=>{ul.innerHTML=items.map((f,i)=>{const L=placeLabel(f.properties);
      return `<li><button type="button" role="option" aria-selected="${i===sel}" data-i="${i}">${esc(L.n)}${L.sub?`<small>${esc(L.sub)}</small>`:""}</button></li>`}).join("");
    ul.hidden=!items.length; inp.setAttribute("aria-expanded",String(!!items.length));
    ul.querySelectorAll("button").forEach(b=>b.onmousedown=e=>{e.preventDefault();pick(+b.dataset.i)});};
  inp.addEventListener("input",()=>{ROUTE[id]=null; clearTimeout(timer); const q=inp.value.trim();
    if(q.length<3){items=[];draw();return}
    timer=setTimeout(async()=>{ctrl&&ctrl.abort(); ctrl=new AbortController();
      try{const r=await fetch(`${PHOTON}?q=${encodeURIComponent(q)}&limit=6&bbox=${FI_BBOX}${LANG==="en"?"&lang=en":""}`,{signal:ctrl.signal});
        items=((await r.json()).features||[]).filter(f=>(f.properties.countrycode||"FI")==="FI"); sel=-1; draw();}catch(e){}
    },350)});
  inp.addEventListener("keydown",e=>{
    if(e.key==="ArrowDown"&&items.length){sel=(sel+1)%items.length;draw();e.preventDefault()}
    else if(e.key==="ArrowUp"&&items.length){sel=(sel-1+items.length)%items.length;draw();e.preventDefault()}
    else if(e.key==="Enter"&&items.length){pick(sel<0?0:sel);e.preventDefault()}
    else if(e.key==="Escape"){close()}});
  inp.addEventListener("blur",()=>setTimeout(close,150));
}
setupField("from"); setupField("to");
const rstatus=t=>{document.getElementById("rstatus").textContent=t||""};
document.getElementById("locate").onclick=()=>{
  if(!navigator.geolocation) return rstatus(T().locFail);
  rstatus(T().locating);
  navigator.geolocation.getCurrentPosition(p=>{ROUTE.from={lon:p.coords.longitude,lat:p.coords.latitude,name:T().myLoc};
      document.getElementById("from").value=T().myLoc; rstatus(""); maybeRoute();},
    ()=>rstatus(T().locFail),{timeout:10000,maximumAge:300000});
};
document.getElementById("rclear").onclick=()=>{ROUTE={ids:new Set(),cams:[],geom:null,km:0,h:0,from:null,to:null};
  document.getElementById("from").value=""; document.getElementById("to").value=""; rstatus(""); renderRoute(); setRouteVisible(true);};

// pisteen etäisyys reittiin (km) ja kohta reitillä (km lähdöstä), tasoprojektio riittää tähän mittakaavaan
function project(geom,cum,lon,lat){
  const kx=111.32*Math.cos(lat*Math.PI/180), ky=110.57; let best=[1e9,0];
  for(let i=0;i<geom.length-1;i++){const [x1,y1]=geom[i],[x2,y2]=geom[i+1];
    if(Math.abs(y1-lat)>0.2&&Math.abs(y2-lat)>0.2) continue;
    const ax=(x2-x1)*kx, ay=(y2-y1)*ky, bx=(lon-x1)*kx, by=(lat-y1)*ky, L=ax*ax+ay*ay;
    const t=L?Math.max(0,Math.min(1,(ax*bx+ay*by)/L)):0, dx=bx-t*ax, dy=by-t*ay, d=Math.hypot(dx,dy);
    if(d<best[0]) best=[d,cum[i]+t*(cum[i+1]-cum[i])];}
  return best;
}
const inPoly=(x,y,ring)=>{let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [xi,yi]=ring[i],[xj,yj]=ring[j];
  if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c}return c};

async function maybeRoute(){
  if(!ROUTE.from||!ROUTE.to) return;
  rstatus(T().searching);
  try{
    const r=await fetch(`${OSRM}${ROUTE.from.lon},${ROUTE.from.lat};${ROUTE.to.lon},${ROUTE.to.lat}?overview=full&geometries=geojson&steps=true`);
    const d=await r.json(); if(d.code!=="Ok"||!d.routes.length) throw 0;
    const rt=d.routes[0], g=rt.geometry.coordinates, cum=[0];
    for(let i=1;i<g.length;i++){const la=(g[i][1]+g[i-1][1])/2;
      cum.push(cum[i-1]+Math.hypot((g[i][0]-g[i-1][0])*111.32*Math.cos(la*Math.PI/180),(g[i][1]-g[i-1][1])*110.57));}
    // reitin tienumerot (esim. "4; 77" → 4, 77): risteävien teiden kamerat eivät kuulu reitille
    const refs=new Set(rt.legs.flatMap(l=>l.steps).flatMap(st=>(st.ref||"").split(/[;,]/)).map(x=>parseInt(x,10)).filter(Number.isFinite));
    const cams=[];
    for(const c of DATA.cameras){
      if(refs.size&&c.road!=null&&!refs.has(c.road)) continue;
      const [dist,at]=project(g,cum,c.lon,c.lat); if(dist<=NEAR_KM) cams.push({c,at});}
    cams.sort((a,b)=>a.at-b.at);
    const scale=rt.distance/1000/cum[cum.length-1];   // reitin oma pituus tarkemmaksi
    cams.forEach(x=>x.at*=scale);
    const samples=g.filter((_,i)=>i%25===0);
    const warns=WARN.map((w,i)=>({w,i})).filter(({w})=>w.polygons.some(ring=>samples.some(([x,y])=>inPoly(x,y,ring))));
    ROUTE={...ROUTE,geom:g,km:rt.distance/1000,h:rt.duration/3600,cams,ids:new Set(cams.map(x=>x.c.id)),warns};
    try{if(ROUTE.from.name!==T().myLoc) localStorage.setItem("route",JSON.stringify({from:ROUTE.from,to:ROUTE.to}))}catch(e){}
    rstatus(""); renderRoute(); setRouteVisible(true); fitRoute();
  }catch(e){ rstatus(T().routeFail); }
}
function fitRoute(){ if(!ROUTE.geom) return; const b=new maplibregl.LngLatBounds(); ROUTE.geom.forEach(p=>b.extend(p));
  map.setMaxBounds(null); map.fitBounds(b,{padding:fitPadding(),maxZoom:11,duration:400}); }
function setRouteVisible(on){
  routeOn=on&&!!ROUTE.geom;
  if(!ready()) return;
  map.getSource("route").setData(routeOn?{type:"Feature",geometry:{type:"LineString",coordinates:ROUTE.geom}}:{type:"FeatureCollection",features:[]});
  refreshMap();
}
function renderRoute(){
  const el=document.getElementById("rresult"), L=T();
  document.getElementById("rclear").hidden=!ROUTE.geom;
  if(!ROUTE.geom){ let last=null; try{last=JSON.parse(localStorage.getItem("route")||"null")}catch(e){}
    el.innerHTML=(last&&last.from&&last.to?`<button class="last" id="lastroute">${esc(last.from.name)} → ${esc(last.to.name)}<small>${L.lastRoute}</small></button>`:"")+
      `<p class="blank credits" style="border:0">${L.routeSrc}</p>`;
    const lb=document.getElementById("lastroute"); if(lb) lb.onclick=()=>{ROUTE.from=last.from;ROUTE.to=last.to;
      document.getElementById("from").value=last.from.name; document.getElementById("to").value=last.to.name; maybeRoute();};
    return; }
  const cams=ROUTE.cams, meas=cams.filter(x=>clsAt(x.c)!=="ei mittausta");
  const n=Object.fromEntries(KEYS.map(k=>[k,0])); meas.forEach(x=>n[clsAt(x.c)]++);
  const slip=meas.filter(x=>["luminen","jää/kuura"].includes(clsAt(x.c)));
  const worstK=meas.map(x=>clsAt(x.c)).sort((a,b)=>ORDER.indexOf(a)-ORDER.indexOf(b))[0];
  const slipTxt=["jää/kuura","luminen"].filter(k=>n[k]).map(k=>L.slipPart[k](n[k])).join(", ");
  const wet=n["märkä"]+n["kostea"];
  // pisin mittaamaton väli (km) reitin alusta loppuun
  const marks=[0,...meas.map(x=>x.at),ROUTE.km]; let gap=0,ga=0,gb=0;
  for(let i=1;i<marks.length;i++) if(marks[i]-marks[i-1]>gap){gap=marks[i]-marks[i-1];ga=marks[i-1];gb=marks[i]}
  const soon=Date.now()+12*36e5, act=ROUTE.warns.filter(x=>new Date(x.w.onset)<=soon&&new Date(x.w.expires)>Date.now());
  const h=Math.floor(ROUTE.h), m=Math.round((ROUTE.h-h)*60);
  const pct=cams.length?Math.round((cams.length-meas.length)/cams.length*100):0;
  const kmf=v=>Math.round(v).toLocaleString(L.locale);
  el.innerHTML=`<div class="rsum">
      <div class="trip">${esc(ROUTE.from.name)} → ${esc(ROUTE.to.name)}</div>
      <div class="meta num">${kmf(ROUTE.km)} km · ${L.hm(h,m)}</div>
      <div class="mix" aria-hidden="true">${KEYS.map(k=>`<i style="width:${meas.length?n[k]/meas.length*100:0}%;background:${COLORS[k]}"></i>`).join("")}</div>
      <div class="meta">${L.onRoute(cams.length,meas.length)}</div>
      <ul>
        ${slip.length?`<li class="alert" style="--c:${COLORS[worstK]}"><span class="dot"></span><span>${L.slipN(slipTxt,kmf(slip[0].at),esc(nameOf(slip[0].c)))}</span></li>`
          :(meas.length?`<li class="ok" style="--c:${COLORS[worstK]}"><span class="dot"></span><span>${L.noSlip}${wet?L.wetN(wet):""}</span></li>`:"")}
        ${ROUTE.warns.length?(()=>{const first=[...ROUTE.warns].sort((a,b)=>new Date(a.w.onset)-new Date(b.w.onset))[0];
          return `<li class="warnl"><span class="dot"></span><span>${act.length?L.warnOnRoute(act.length):L.warnLater(ROUTE.warns.length,fmtTime(first.w.onset))}
          <button class="lnk" id="rwarns">${L.showWarnings}</button></span></li>`})():""}
        ${pct?`<li class="gray"><span class="dot"></span><span>${L.unmeasured(pct,Math.round(gap/10)*10,kmf(ga),kmf(gb))}</span></li>`:""}
      </ul>
      <p class="disc">${L.disclaimer}</p>
    </div>
    <div class="rstrip"><div class="bars" aria-hidden="true">${cams.map(x=>`<i style="left:${(x.at/ROUTE.km*100).toFixed(2)}%;background:${COLORS[clsAt(x.c)]}"></i>`).join("")}</div>
      <div class="ends num"><span>0 km</span><span>${kmf(ROUTE.km)} km</span></div></div>
    <ul class="list">${cams.map(x=>{const k=clsAt(x.c);return `<li><button class="item" data-id="${x.c.id}"><span class="sw" style="background:${COLORS[k]}"></span>
      <span><b>${esc(nameOf(x.c))}</b><small>${L.cls[k]}</small></span><span class="km">${kmf(x.at)} km</span></button></li>`}).join("")}</ul>
    <p class="credits">${L.routeSrc}</p>`;
  el.querySelectorAll(".item").forEach(b=>b.onclick=()=>{const c=byId[b.dataset.id]; if(isMobile()) setCollapsed(true);
    map.flyTo({center:[c.lon,c.lat],zoom:Math.max(map.getZoom(),9),offset:isMobile()?[0,-innerHeight*.28]:[-180,0]}); openCam(c.id)});
  const rw=document.getElementById("rwarns"); if(rw) rw.onclick=()=>openWarnList(ROUTE.warns.map(x=>x.i));
}

/* ===================== aikajana ===================== */
// osuus kameroista kussakin kelissä, tunneittain (vain mitatut)
let SHARES=null;
function shares(){
  if(SHARES) return SHARES;
  SHARES=DATA.times.map((_,i)=>{const n=[0,0,0,0,0];let tot=0;
    DATA.cameras.forEach(c=>{const x=c.h?c.h[i]:-1;if(x>=0){n[x]++;tot++}}); return n.map(v=>tot?v/tot:0)});
  return SHARES;
}
function renderTimeline(){
  const out=document.getElementById("tlabel"), s=document.getElementById("slider");
  const sh=shares(), last=DATA.times.length-1;
  const none=sh.every(p=>p.every(v=>!v));
  document.getElementById("tbars").innerHTML=none?`<span class="tempty">${T().noHist}</span>`:sh.map((p,i)=>`<div class="col${i===slot?" sel":(i<slot?" past":"")}">${
    p.map((v,k)=>`<i style="height:${(v*100).toFixed(1)}%;background:${COLORS[KEYS[k]]}"></i>`).join("")}</div>`).join("");
  document.getElementById("tticks").innerHTML=none?"":(innerWidth<400?[0,12,24]:[0,6,12,18,24]).map(i=>
    `<span style="left:${((i+.5)/(last+1)*100).toFixed(2)}%">${fmtClock(DATA.times[i])}</span>`).join("");
  s.value=slot; s.setAttribute("aria-valuetext",slot===24?T().now:fmtClock(DATA.times[slot]));
  out.textContent=slot===24?T().now:fmt(DATA.times[slot],{weekday:"short",hour:"2-digit",minute:"2-digit"});
  out.classList.toggle("past",slot!==24);
  const p=document.getElementById("play"); p.innerHTML=playing?PAUSE:PLAY; p.setAttribute("aria-label",playing?T().pause:T().play);
}
function setSlot(i){ slot=i; renderTimeline(); renderLegend(); refreshMap(); refreshWarn(); if(road!=null)renderRoads(); if(ROUTE.geom)renderRoute(); if(current&&current.type==="cam")openCam(current.id,true); }
document.getElementById("slider").oninput=e=>{stop();setSlot(+e.target.value)};
function stop(){ if(playing){clearInterval(playing);playing=null;renderTimeline();} }
document.getElementById("play").onclick=()=>{
  if(playing) return stop();
  if(slot===24) setSlot(0);
  playing=setInterval(()=>{ if(slot>=24){stop();return;} setSlot(slot+1); }, matchMedia("(prefers-reduced-motion: reduce)").matches?900:450);
  renderTimeline();
};

/* ===================== tietopaneeli ===================== */
function scale(fr){
  const MAX=0.82;
  return `<div class="scale" aria-hidden="true"><div class="bar">
    ${fr!=null?`<i class="mark" style="left:${Math.max(0,Math.min(fr,MAX))/MAX*100}%"></i>`:""}</div>
    <div class="ends"><span>${T().slippery}</span><span>${T().grippy}</span></div></div>`;
}
const isMobile=()=>innerWidth<=720;
// kuvan oikea ottoaika Fintrafficin kamerarajapinnasta (kuvapalvelin ei salli aikaleiman lukemista)
async function camTime(c){
  const preset=c.img.split("/").pop().replace(".jpg","");
  try{
    const d=await (await fetch(`https://tie.digitraffic.fi/api/weathercam/v1/stations/${c.id}/data`)).json();
    const p=(d.presets||[]).find(x=>x.id===preset), el=document.getElementById("camtime");
    if(p&&p.measuredTime&&el&&current&&current.id===c.id){
      const mins=Math.round((Date.now()-new Date(p.measuredTime))/6e4);
      el.textContent=` · ${T().camTaken(fmtClock(p.measuredTime))}${mins>=1?` (${mins}\u00a0min)`:""}`;
    }
  }catch(e){}
}
// valitun hetken kuva kameran 24 h kuvahistoriasta (Digitraffic, ~10 min välein)
const HIST={};  // {kamera: {at: haettu ms, list: [{t, url}] | null}}
const presetOf=c=>c.img.split("/").pop().replace(".jpg","");
function loadHist(c){
  const h=HIST[c.id];
  if(h&&(h.p||Date.now()-h.at<10*6e4)) return h.p||Promise.resolve();
  const rec={at:Date.now(),list:h?h.list:undefined};
  rec.p=fetch(`https://tie.digitraffic.fi/api/weathercam/v1/stations/${c.id}/history`)
    .then(r=>r.ok?r.json():Promise.reject(r.status))
    .then(d=>{const pr=(d.presets||[]).find(x=>x.id===presetOf(c));
      rec.list=(pr&&pr.history||[]).map(x=>({t:Date.parse(x.lastModified),url:x.imageUrl})).filter(x=>x.t)})
    .catch(()=>{rec.list=rec.list||null})
    .finally(()=>{rec.at=Date.now();delete rec.p});
  HIST[c.id]=rec; return rec.p;
}
function shotAt(c,at){
  const l=HIST[c.id]&&HIST[c.id].list; if(!l||!l.length) return l===undefined?undefined:null;
  return l.reduce((a,b)=>Math.abs(b.t-at)<Math.abs(a.t-at)?b:a);
}
const fmtGap=ms=>{const m=Math.round(ms/6e4);return m<90?`${m}\u00a0min`:`${Math.round(m/60)}\u00a0h`};
const prefersReduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
function placeLine(c){
  const nm=nameOf(c)||"", parts=[];
  if(c.road!=null&&!new RegExp(`\\b${c.road}\\b`).test(nm)) parts.push(`${T().road} ${c.road}`);
  if(c.mun&&!nm.includes(c.mun)) parts.push(esc(c.mun));
  return parts.length?`<p>${parts.join(" · ")}</p>`:"";
}
let lastFocus=null;
function panelShown(p){
  if(p.inert){ lastFocus=document.activeElement; p.inert=false; }
  const h=p.querySelector("h2,[tabindex='-1']"); if(h&&!p.contains(document.activeElement)) h.focus({preventScroll:true});
}
function openCam(id,keep){
  const c=byId[id]; if(!c) return; current={type:"cam",id}; select(id);
  if(isMobile()&&!keep) setCollapsed(true);
  if(!keep&&ready()) map.flyTo({center:[c.lon,c.lat],zoom:Math.max(map.getZoom(),8),
    offset:isMobile()?[0,-innerHeight*.3]:[-190,0],duration:prefersReduced()?0:800});
  const k=clsAt(c), col=COLORS[k], L=T(), past=slot!==24;
  const fr=past?(c.hf?c.hf[slot]:null):c.friction;
  const at=past?Date.parse(DATA.times[slot]):0, shot=past?shotAt(c,at):null;
  if(past&&(shot===undefined||!HIST[c.id]||Date.now()-HIST[c.id].at>=10*6e4)){
    const s0=slot; loadHist(c).then(()=>{ if(current&&current.id===c.id&&slot===s0&&shotAt(c,at)!==undefined) openCam(c.id,true) }); }
  const src=!past?`${c.img}?t=${Math.floor(Date.now()/6e4)}`:shot?shot.url:shot===null?c.img:"";
  const gap=shot?Math.abs(shot.t-at):0;
  const cap=!past?"":shot?` · ${L.camTaken(fmtClock(new Date(shot.t).toISOString()))}${gap>20*6e4?` (${L.camGap(fmtGap(gap))})`:""}`
    :shot===null?`<br>${L.camLatest}`:`<br>${L.camLoading}`;
  const sub=k==="ei mittausta"?(c.cls||c.h?"":L.aiSoon)
    :`${L.measured} <span class="num">${fmtClock(past?DATA.times[slot]:(c.mt||c.t))}</span> · ${L.station} ${c.st} · <span class="num">${num(c.km," km")}</span>`;
  const p=document.getElementById("panel");
  p.setAttribute("aria-label",nameOf(c));
  p.innerHTML=`<div class="scroll">
    <div class="status" style="--c:${col}"><div><b>${L.cls[k]}</b><small>${sub}</small></div>
      <button class="x" aria-label="${L.close}">${X}</button></div>
    <div class="place"><h2 tabindex="-1">${esc(nameOf(c))}</h2>${placeLine(c)}</div>
    <figure class="shot"><img ${src?`src="${src}" alt="${esc(nameOf(c))}"`:'alt=""'}>
      <figcaption>${L.camNow}${c.view?" · "+esc((L.viewMap[c.view])||c.view.replace(/^Tie (\d)/,LANG==="en"?"Road $1":"Tie $1")):""}<span id="camtime"></span>${cap}</figcaption></figure>
    ${k!=="ei mittausta"?`<dl class="read">
        <div class="kv joined"><dt>${L.friction}</dt><dd class="num">${num(fr,"",2)}</dd></div>${scale(fr)}
        ${["jää/kuura","luminen"].includes(k)&&fr!=null&&fr>=0.6&&!past&&(c.ice||c.snow)?`<p class="thin">${L.thinIce(num(Math.max(c.ice||0,c.snow||0)," mm",2))}</p>`:""}
        ${past?"":`<div class="kv"><dt>${L.roadT}</dt><dd class="num">${num(c.roadT," °C")}</dd></div>
        <div class="kv"><dt>${L.airT}</dt><dd class="num">${num(c.airT," °C")}</dd></div>
        <div class="kv"><dt>${L.water}</dt><dd class="num">${num(c.water," mm",2)}</dd></div>
        <div class="kv"><dt>${L.snow}</dt><dd class="num">${num(c.snow," mm",2)}</dd></div>
        <div class="kv"><dt>${L.ice}</dt><dd class="num">${num(c.ice," mm",2)}</dd></div>`}
      </dl>`
    :(c.cls?"":`<p class="empty"><strong>${L.noMeasure}</strong>${c.why==="far"?L.far(num(c.km," km")):L.nosensor} ${L.aiNote}</p>`)}
    ${c.h?`<div class="hist"><h3>${L.last24}</h3>
      <div class="strip">${c.h.map((x,i)=>`<i class="${i===slot?"sel":""}" title="${fmtClock(DATA.times[i])}: ${L.cls[x>=0?KEYS[x]:"ei mittausta"]}" style="background:${COLORS[x>=0?KEYS[x]:"ei mittausta"]}"></i>`).join("")}</div>
      <div class="strip-t"><span>${fmtClock(DATA.times[0])}</span><span>${L.now}</span></div></div>`:""}
  </div>`;
  p.classList.add("on"); if(!keep) panelShown(p);
  const im=p.querySelector(".shot img");
  if(im) im.onerror=()=>{im.outerHTML=`<div class="noimg">${L.noImg}</div>`};
  if(!past) camTime(c);
}
function openWarn(i,keep){
  const w=WARN[i]; if(!w) return; current={type:"warn",i}; select("");
  if(isMobile()&&!keep) setCollapsed(true);
  if(ready()){ map.setFilter("warn-sel",["==",["get","i"],i]); refreshWarn(); }
  document.querySelectorAll(".warn").forEach(b=>b.setAttribute("aria-current",String(+b.dataset.i===i)));
  const L=T(), p=document.getElementById("panel");
  if(!keep){const b=new maplibregl.LngLatBounds(); w.polygons.flat().forEach(pt=>b.extend(pt)); map.fitBounds(b,{padding:fitPadding(),maxZoom:8});}
  p.setAttribute("aria-label",L.warnings);
  p.innerHTML=`<div class="scroll">
    <div class="status" style="--c:var(--warn)"><div><b${areaOf(w).length>40?' class="long"':""}>${esc(areaOf(w))}</b><small>${L.official}</small></div>
      <button class="x" aria-label="${L.close}">${X}</button></div>
    <div class="wpanel"><p class="num">${fmtTime(w.onset)} – ${fmtTime(w.expires)}</p>
      <p>${esc(w.description[LANG]||w.description.fi||"")}</p>
      <p class="src">${L.warnSrc} · <a href="https://www.ilmatieteenlaitos.fi/varoitukset" target="_blank" rel="noopener">${L.readMore} ↗</a></p></div>
  </div>`;
  p.classList.add("on"); panelShown(p);
}
function closePanel(){
  const p=document.getElementById("panel"); p.classList.remove("on"); current=null; select("");
  if(!p.inert){ p.inert=true; if(lastFocus&&document.contains(lastFocus)) lastFocus.focus({preventScroll:true}); lastFocus=null; }
  if(ready()){ map.setFilter("warn-sel",["==",["get","i"],-1]); refreshWarn(); }
  document.querySelectorAll(".warn").forEach(b=>b.removeAttribute("aria-current"));
}
addEventListener("keydown",e=>{if(e.key==="Escape")closePanel()});
const panelEl=document.getElementById("panel");
panelEl.addEventListener("click",e=>{ if(e.target.closest(".x")) closePanel(); });
// mobiili: pyyhkäisy alas kahvasta tai otsikosta sulkee paneelin
// Seuraa sormea 1:1 (ei siirtymää vedon aikana), ylöspäin vain kuminauhamainen vastus,
// sulkeutuu joko matkasta (> 80 px) tai nopeasta näpäytyksestä alas (> 0,5 px/ms).
let sy=null, last=null, vel=0;
panelEl.addEventListener("touchstart",e=>{ const top=panelEl.getBoundingClientRect().top, y=e.touches[0].clientY;
  sy=(y-top<90 && panelEl.querySelector(".scroll").scrollTop===0)?y:null; last={y,t:e.timeStamp}; vel=0; },{passive:true});
panelEl.addEventListener("touchmove",e=>{ if(sy==null)return; const y=e.touches[0].clientY, raw=y-sy;
  const dt=e.timeStamp-last.t; if(dt>0) vel=(y-last.y)/dt; last={y,t:e.timeStamp};
  const dy=raw<0?raw*0.15:raw;
  panelEl.style.transition="none"; panelEl.style.transform=`translateY(${dy}px)`; },{passive:true});
panelEl.addEventListener("touchend",e=>{ if(sy==null)return; const dy=e.changedTouches[0].clientY-sy; sy=null;
  panelEl.style.transition=""; panelEl.style.transform="";
  if(dy>80 || (dy>24 && vel>0.5)) closePanel(); });
