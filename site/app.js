// Kelikamera – karttasivun logiikka (ladataan defer-skriptinä MapLibren jälkeen, globaali näkyvyys säilyy)
/* ===================== tekstit / strings ===================== */
const STR={
 fi:{locale:"fi-FI",title:"Kelikamera · Suomen tiet nyt",mapLabel:"Kelikamerakartta",
  tabMap:"Kartta",tabRoute:"Reitti",tabWorse:"Liukastumassa",tabRoads:"Tiet",
  from:"Mistä",to:"Minne",myLoc:"Oma sijainti",locating:"Haetaan sijaintia…",locFail:"Sijaintia ei saatu.",
  searching:"Haetaan reittiä…",routeFail:"Reittiä ei löytynyt.",clearRoute:"Tyhjennä reitti",editRoute:"Muuta",privacy:"Tietosuoja: ei evästeitä eikä analytiikkaa. Fontti ja karttakirjasto tulevat tältä sivulta. Karttaruudut haetaan OpenFreeMapista ja kamerakuvat Fintrafficilta, jotka näkevät IP-osoitteesi kuten minkä tahansa sivun latauksessa. Reittihaku lähettää hakusanan Photonille (komoot) ja reitin pisteet OSRM:lle (FOSSGIS); oma sijainti vain painettaessa. Kieli ja viimeisin reitti tallentuvat vain omaan selaimeesi.",camSearchLabel:"Hae kameraa",camSearchPh:"Hae kameraa: nimi, tie tai kunta",camNone:"Ei osumia",placeholderFrom:"esim. Kamppi, Helsinki",placeholderTo:"esim. Levi",
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
  noWorse:"Ei huonontuneita kelejä viimeisen 6 tunnin aikana.",noWorseHere:"Ei huonontuneita kelejä tällä alueella.",
  scopeLabel:"Rajaus",scopeAll:"Koko maa",scopeView:"Kartan alue",scopeRoute:"Reitti",ago:h=>h===0?"nyt":`${h} h sitten`,
  frictionDrop:(a,b)=>`kitka ${a} → ${b}`,
  road:"Tie",chooseRoad:"Valitse tie",roadStart:"Tien alku",roadEnd:"Tien loppu",cams:n=>`${n} kameraa`,worst:"Pahin kohta",
  measured:"Mitattu",station:"asema",aiSoon:"Ei anturia lähellä · katso kamerakuva",lastRoute:"Viimeisin reitti",thinIce:mm=>`Anturi näkee ohuen kerroksen (${mm}), mutta kitka on vielä hyvä.`,viewMap:{"Tienpinta":"Tienpinta"},close:"Sulje",
  camNow:"Kamerakuva · Fintraffic",camTaken:t=>`otettu ${t}`,camLatest:"tuorein kuva, ei valitulta hetkeltä",camLoading:"haetaan valitun hetken kuvaa…",noImg:"Kuva ei ole saatavilla",noHist:"Ei mittaushistoriaa",camGap:t=>`${t} valitusta hetkestä`,friction:"Kitka µ",slippery:"Liukas · jää ~0,1",grippy:"Pitävä · kuiva 0,82",
  roadT:"Tien lämpötila",airT:"Ilman lämpötila",water:"Vesi",snow:"Lumi",ice:"Jää",
  noMeasure:"Ei mitattua keliä",far:km=>`Lähin tiesääasema on ${km} päässä, eikä sen mittaus kerro tämän kameran kelistä.`,
  nosensor:"Lähimmällä tiesääasemalla ei ole tienpinnan kelianturia.",aiNote:"Tähän tulee tekoälyn arvio kamerakuvasta.",
  last24:"Viimeiset 24 h",now:"Nyt",slipCount:n=>`lumi/jää ${n}`,ago24:"−24 h",ago12:"−12 h",play:"Toista viimeiset 24 h",pause:"Pysäytä",
  timeAt:"Klo",pastNote:"Kartta näyttää kelin hetkellä",data:"Data",fmi:"Ilmatieteen laitos",
  expand:"Näytä",collapse:"Piilota",causes:{snowOrSleet:"lumi- tai räntäsade",freezingRain:"jäätävä sade",slipperyRoad:"liukkaus",iceOnRoad:"jää"}},
 en:{locale:"en-GB",title:"Kelikamera · Finnish roads now",mapLabel:"Road weather camera map",
  tabMap:"Map",tabRoute:"Route",tabWorse:"Getting slippery",tabRoads:"Roads",
  from:"From",to:"To",myLoc:"My location",locating:"Getting your location…",locFail:"Couldn't get your location.",
  searching:"Finding a route…",routeFail:"No route found.",clearRoute:"Clear route",editRoute:"Change",privacy:"Privacy: no cookies, no analytics. The font and map library are served from this site. Map tiles come from OpenFreeMap and camera images from Fintraffic, who see your IP address as with any page load. Route search sends your query to Photon (komoot) and the route points to OSRM (FOSSGIS); your location only when you press the button. Language and last route are stored only in your own browser.",camSearchLabel:"Find a camera",camSearchPh:"Find a camera: name, road or town",camNone:"No matches",placeholderFrom:"e.g. Kamppi, Helsinki",placeholderTo:"e.g. Levi",
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
  noWorse:"No worsening conditions in the last 6 hours.",noWorseHere:"No worsening conditions in this area.",
  scopeLabel:"Scope",scopeAll:"All Finland",scopeView:"Map area",scopeRoute:"Route",ago:h=>h===0?"now":`${h} h ago`,
  frictionDrop:(a,b)=>`friction ${a} → ${b}`,
  road:"Road",chooseRoad:"Choose a road",roadStart:"Road start",roadEnd:"Road end",cams:n=>`${n} cameras`,worst:"Worst spot",
  measured:"Measured",station:"station",aiSoon:"No sensor nearby · see the camera image",lastRoute:"Last route",thinIce:mm=>`The sensor sees a thin layer (${mm}), but friction is still good.`,viewMap:{"Tienpinta":"Road surface","tienpinta":"Road surface"},close:"Close",
  camNow:"Camera image · Fintraffic",camTaken:t=>`taken ${t}`,camLatest:"latest image, not from the selected time",camLoading:"loading the image from the selected time…",noImg:"Image not available",noHist:"No measurement history",camGap:t=>`${t} from the selected time`,friction:"Friction µ",slippery:"Slippery · ice ~0.1",grippy:"Grippy · dry 0.82",
  roadT:"Road temperature",airT:"Air temperature",water:"Water",snow:"Snow",ice:"Ice",
  noMeasure:"No measured conditions",far:km=>`The nearest road weather station is ${km} away, so its reading doesn't describe this camera's road.`,
  nosensor:"The nearest road weather station has no road surface sensor.",aiNote:"An AI estimate from the camera image will appear here.",
  last24:"Last 24 h",now:"Now",slipCount:n=>`snow/ice ${n}`,ago24:"−24 h",ago12:"−12 h",play:"Play the last 24 h",pause:"Pause",
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
// Lucide-ikonit (ISC-lisenssi, lucide.dev), upotettuna – ei ikonikirjastoa ajonaikana
const ICON={gauge:'<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',thermo:'<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',thermoSun:'<path d="M12 2v2"/><path d="M12 8a4 4 0 0 0-1.645 7.647"/><path d="M2 12h2"/><path d="M20 14.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z"/><path d="m4.93 4.93 1.41 1.41"/><path d="m6.34 17.66-1.41 1.41"/>',droplet:'<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',cloudSnow:'<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 15h.01"/><path d="M8 19h.01"/><path d="M12 17h.01"/><path d="M12 21h.01"/><path d="M16 15h.01"/><path d="M16 19h.01"/>',snowflake:'<path d="m10 20-1.25-2.5L6 18"/><path d="M10 4 8.75 6.5 6 6"/><path d="m14 20 1.25-2.5L18 18"/><path d="m14 4 1.25 2.5L18 6"/><path d="m17 21-3-6h-4"/><path d="m17 3-3 6 1.5 3"/><path d="M2 12h6.5L10 9"/><path d="m20 10-1.5 2 1.5 2"/><path d="M22 12h-6.5L14 15"/><path d="m4 10 1.5 2L4 14"/><path d="m7 21 3-6-1.5-3"/><path d="m7 3 3 6h4"/>',clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',tower:'<path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9"/><path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5"/><circle cx="12" cy="9" r="2"/><path d="M16.2 4.8c2 2 2.26 5.11.8 7.47"/><path d="M19.1 1.9a9.96 9.96 0 0 1 0 14.1"/><path d="M9.5 18h5"/><path d="m8 22 4-11 4 11"/>',pin:'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',camera:'<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/>',tri:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',dashed:'<path d="M10.1 2.182a10 10 0 0 1 3.8 0"/><path d="M13.9 21.818a10 10 0 0 1-3.8 0"/><path d="M17.609 3.721a10 10 0 0 1 2.69 2.7"/><path d="M2.182 13.9a10 10 0 0 1 0-3.8"/><path d="M20.279 17.609a10 10 0 0 1-2.7 2.69"/><path d="M21.818 10.1a10 10 0 0 1 0 3.8"/><path d="M3.721 6.391a10 10 0 0 1 2.7-2.69"/><path d="M6.391 20.279a10 10 0 0 1-2.69-2.7"/>',history:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',ext:'<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',list:'<path d="m9 18 6-6-6-6"/>'};
const ic=(n,cls="")=>`<svg class="ic${cls?" "+cls:""}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
const X='<svg class="ic" style="width:16px;height:16px" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
const PLAY='<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>';
const PAUSE='<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect fill="currentColor" x="14" y="3" width="5" height="18" rx="1"/><rect fill="currentColor" x="5" y="3" width="5" height="18" rx="1"/></svg>';

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
  map.on("moveend",()=>{ if(worseScope==="view"&&!document.getElementById("p-worse").hidden) renderWorse(worsening()); });
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
    paint:{"fill-color":"#0a0a0a","fill-opacity":["interpolate",["linear"],["zoom"],5,.72,7,.5,9,0]}});
  map.addLayer({id:"border",type:"line",source:"fin",filter:["==",["get","role"],"border"],
    paint:{"line-color":"#9fb0c4","line-opacity":["interpolate",["linear"],["zoom"],5,.35,9,0],"line-width":1}});
  map.addSource("warn",{type:"geojson",data:warnGeo()});
  map.addLayer({id:"warn-fill",type:"fill",source:"warn",filter:warnFilter(),paint:{"fill-color":v("--warn"),"fill-opacity":.08}});
  map.addLayer({id:"warn-line",type:"line",source:"warn",filter:warnFilter(),paint:{"line-color":v("--warn"),"line-width":1.2,"line-opacity":.7,"line-dasharray":[3,2]}});
  map.addLayer({id:"warn-sel",type:"line",source:"warn",filter:["==",["get","i"],-1],paint:{"line-color":v("--warn"),"line-width":2.5}});
  map.addSource("route",{type:"geojson",data:{type:"FeatureCollection",features:[]}});
  map.addLayer({id:"route-case",type:"line",source:"route",layout:{"line-join":"round","line-cap":"round"},paint:{"line-color":"#0a0a0a","line-width":7}});
  map.addLayer({id:"route",type:"line",source:"route",layout:{"line-join":"round","line-cap":"round"},paint:{"line-color":"#c9d3df","line-width":3}});
  map.addSource("cams",{type:"geojson",data:geojson()});
  map.addLayer({id:"cams-halo",type:"circle",source:"cams",filter:["==",["get","k"],"jää/kuura"],
    paint:{"circle-radius":["interpolate",["linear"],["zoom"],4,9,10,18],"circle-color":COLORS["jää/kuura"],"circle-opacity":.22,"circle-blur":.6}});
  map.addLayer({id:"cams",type:"circle",source:"cams",layout:{"circle-sort-key":["get","rank"]},
    paint:{
      "circle-radius":["interpolate",["linear"],["zoom"],4,["case",["==",["get","k"],"ei mittausta"],2.2,3.6],10,["case",["==",["get","k"],"ei mittausta"],5,8]],
      "circle-color":["match",["get","k"],...Object.entries(COLORS).flat(),"#888"],
      "circle-stroke-width":["case",["==",["get","k"],"ei mittausta"],0,["==",["get","k"],"jää/kuura"],2,1],
      "circle-stroke-color":["case",["==",["get","k"],"jää/kuura"],"#ffffff","#0a0a0a"],
      "circle-opacity":["case",["==",["get","dim"],1],.12,1],"circle-stroke-opacity":["case",["==",["get","dim"],1],0,1]}});
  map.addLayer({id:"cams-sel",type:"circle",source:"cams",filter:["==",["get","id"],""],
    paint:{"circle-radius":12,"circle-color":"transparent","circle-stroke-width":2,"circle-stroke-color":"#fff"}});

  const tip=new maplibregl.Popup({closeButton:false,closeOnClick:false,offset:10});
  map.on("mouseenter","cams",e=>{map.getCanvas().style.cursor="pointer";const p=e.features[0].properties;
    tip.setLngLat(e.lngLat).setHTML(`<span class="sw" style="background:${COLORS[p.k]}"></span>${esc(nameOf(byId[p.id]))}<span style="color:var(--text-2)">${T().cls[p.k]}</span>`).addTo(map)});
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
    if(w) return openWarn(w.properties.i);   // sama alue uudelleen sulkee (openWarn)
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
  // tekstit päivitetään vain, jos ne muuttuvat: uudelleenpiirto laskettaisiin uudeksi LCP:ksi
  const setTab=(id,txt)=>{const sp=document.querySelector(`#${id}>span`); if(sp.textContent!==txt) sp.textContent=txt;};
  setTab("tab-map",T().tabMap); setTab("tab-route",T().tabRoute);
  document.getElementById("camq").placeholder=T().camSearchPh;
  document.getElementById("from").placeholder=T().placeholderFrom; document.getElementById("to").placeholder=T().placeholderTo;
  document.getElementById("locate").setAttribute("aria-label",T().myLoc); document.getElementById("locate").title=T().myLoc;
  setTab("tab-worse",T().tabWorse); setTab("tab-roads",T().tabRoads);
  const bd=document.querySelector("#tab-worse .badge"); bd.hidden=!worse.length; bd.textContent=worse.length||"";
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
    <span class="share" aria-hidden="true"><i style="width:${(n[k]/total*100).toFixed(1)}%"></i></span><span class="n num">${n[k]}</span></button></li>`).join("");
  el.querySelectorAll(".row").forEach(b=>b.onclick=()=>{
    const k=b.dataset.k; hidden.has(k)?hidden.delete(k):hidden.add(k);
    b.setAttribute("aria-pressed",String(!hidden.has(k))); applyFilter();
  });
}

function warnItems(only){
  const now=Date.now();
  return WARN.length?WARN.map((w,i)=>{if(only&&!only.includes(i))return "";const on=new Date(w.onset)<=now;
     return `<button class="warn${on?" now":""}" data-i="${i}"><b data-st="${on?T().inForce:T().upcoming}">${ic("tri")}${esc(areaOf(w))}</b>
       <span class="hz">${esc(hazardOf(w))}</span><span class="num">${fmtTime(w.onset)} – ${fmtTime(w.expires)}</span></button>`}).join("")
     :`<p class="note">${T().noWarnings}</p>`;
}
function openWarnList(only){
  clearWarnSel(); current={type:"warnlist",only:Array.isArray(only)?only:null}; select(""); refreshWarn(); if(isMobile()) setCollapsed(true);
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
  el.insertAdjacentHTML("afterbegin",`<button class="warnsum" id="warnsum" aria-expanded="${warnOpen}">${ic("tri","tri")}<b>${T().warnings}</b>
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
   (list.length?`<ul class="list">${list.map(({c,since,reason})=>{const to=KEYS[reason.to]||"ei mittausta";
     const what=reason.drop?L.frictionDrop(num(reason.drop[0],"",2),num(reason.drop[1],"",2))
       :`${L.cls[KEYS[reason.from]]} → ${L.cls[to]}`;
     return `<li><button class="item" data-id="${c.id}"><span class="sw" style="background:${COLORS[to]}"></span>
       <span><b>${esc(nameOf(c))}</b><small>${esc(what)}</small></span><span class="ago">${L.ago(Math.max(0,since))}</span></button></li>`}).join("")}</ul>`
     :`<p class="blank">${worseScope==="all"?L.noWorse:L.noWorseHere}</p>`);
  el.querySelectorAll(".scope button").forEach(x=>x.onclick=()=>{worseScope=x.dataset.s; renderWorse(worsening());});
  el.querySelectorAll(".item").forEach(x=>x.onclick=()=>{ if(innerWidth<=720) setCollapsed(true); openCam(x.dataset.id); });
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

/* kamerahaku: ainoa tapa päästä kameraan näppäimistöllä ja ruudunlukijalla (karttapisteet eivät ole fokusoitavia) */
const norm=s=>(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
(function setupCamSearch(){
  const inp=document.getElementById("camq"), ul=document.getElementById("camres"); let items=[], sel=-1;
  const close=()=>{ul.hidden=true;inp.setAttribute("aria-expanded","false");sel=-1};
  const pick=i=>{const c=items[i]; if(!c) return; inp.value=""; close(); if(isMobile()) setCollapsed(true); openCam(c.id);};
  const draw=()=>{
    ul.innerHTML=items.length?items.map((c,i)=>{const k=clsAt(c);return `<li><button type="button" class="cam" role="option" id="camopt-${i}" aria-selected="${i===sel}" data-i="${i}">
      <span class="sw" style="background:${COLORS[k]}"></span><span>${esc(nameOf(c))}</span><span class="k">${T().cls[k]}</span>${c.mun?`<small>${esc(c.mun)}</small>`:""}</button></li>`}).join("")
      :`<li><span class="blank" style="display:block;padding:8px 10px">${T().camNone}</span></li>`;
    ul.hidden=false; inp.setAttribute("aria-expanded","true");
    if(sel>=0) inp.setAttribute("aria-activedescendant",`camopt-${sel}`); else inp.removeAttribute("aria-activedescendant");
    ul.querySelectorAll("button").forEach(b=>b.onmousedown=e=>{e.preventDefault();pick(+b.dataset.i)});
  };
  inp.addEventListener("input",()=>{
    const q=norm(inp.value.trim()); if(q.length<2){items=[];close();return}
    const words=q.split(/\s+/);
    items=DATA.cameras.map(c=>{const hay=norm(`${nameOf(c)} ${c.name} ${c.mun||""} ${c.road!=null?"tie road vt kt "+c.road:""}`);
        if(!words.every(w=>hay.includes(w))) return null;
        return {c,score:(norm(nameOf(c)).startsWith(q)?0:1)+(c.cls?0:.5)};})
      .filter(Boolean).sort((a,b)=>a.score-b.score||nameOf(a.c).localeCompare(nameOf(b.c))).slice(0,8).map(x=>x.c);
    sel=-1; draw();
  });
  inp.addEventListener("keydown",e=>{
    if(e.key==="ArrowDown"&&items.length){sel=(sel+1)%items.length;draw();e.preventDefault()}
    else if(e.key==="ArrowUp"&&items.length){sel=(sel-1+items.length)%items.length;draw();e.preventDefault()}
    else if(e.key==="Enter"&&items.length){pick(sel<0?0:sel);e.preventDefault()}
    else if(e.key==="Escape"){close()}});
  inp.addEventListener("blur",()=>setTimeout(close,150));
})();
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
  if(!ROUTE.geom){ document.getElementById("p-route").classList.remove("has-route","editing"); if(worseScope==="route") renderWorse(worsening()); let last=null; try{last=JSON.parse(localStorage.getItem("route")||"null")}catch(e){}
    el.innerHTML=(last&&last.from&&last.to?`<button class="last" id="lastroute">${ic("history")}<span>${esc(last.from.name)} → ${esc(last.to.name)}<small>${L.lastRoute}</small></span></button>`:"")+
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
      <div class="trip"><span>${esc(ROUTE.from.name)} → ${esc(ROUTE.to.name)}</span><button class="btn ghost editroute" id="editroute" type="button">${L.editRoute}</button></div>
      <div class="meta num">${kmf(ROUTE.km)} km · ${L.hm(h,m)}</div>
      <div class="mix" aria-hidden="true">${KEYS.map(k=>`<i style="width:${meas.length?n[k]/meas.length*100:0}%;background:${COLORS[k]}"></i>`).join("")}</div>
      <div class="meta">${L.onRoute(cams.length,meas.length)}</div>
      <ul>
        ${slip.length?`<li class="alert" style="--c:${COLORS[worstK]}"><span class="dot"></span><span>${L.slipN(slipTxt,kmf(slip[0].at),esc(nameOf(slip[0].c)))}</span></li>`
          :(meas.length?`<li class="ok" style="--c:${COLORS[worstK]}"><span class="dot"></span><span>${L.noSlip}${wet?L.wetN(wet):""}</span></li>`:"")}
        ${ROUTE.warns.length?(()=>{const first=[...ROUTE.warns].sort((a,b)=>new Date(a.w.onset)-new Date(b.w.onset))[0];
          return `<li class="warnl">${ic("tri")}<span>${act.length?L.warnOnRoute(act.length):L.warnLater(ROUTE.warns.length,fmtTime(first.w.onset))}
          <br><button class="btn lnk" id="rwarns">${L.showWarnings}${ic("list")}</button></span></li>`})():""}
        ${pct?`<li class="gray">${ic("dashed")}<span>${L.unmeasured(pct,Math.round(gap/10)*10,kmf(ga),kmf(gb))}</span></li>`:""}
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
  // puhelimessa lomake piiloon, kun reitti on löytynyt: yhteenveto mahtuu korttiin
  const pr=document.getElementById("p-route"); pr.classList.add("has-route"); pr.classList.remove("editing");
  renderWorse(worsening());
  document.getElementById("editroute").onclick=()=>{pr.classList.add("editing"); document.getElementById("from").focus();};
}

/* ===================== aikajana ===================== */
// liukkaat kamerat tunneittain (jää/kuura + lumi/sohjo), aikajanan pylväät
let SLIP=null;
function slipCounts(){
  if(SLIP) return SLIP;
  SLIP=DATA.times.map((_,i)=>{let ice=0,snow=0,any=0;
    DATA.cameras.forEach(c=>{const x=c.h?c.h[i]:-1; if(x>=0)any++; if(x===4)ice++; else if(x===3)snow++;}); return {ice,snow,any}});
  return SLIP;
}
function renderTimeline(){
  const out=document.getElementById("tlabel"), s=document.getElementById("slider");
  const sc=slipCounts(), last=DATA.times.length-1, L=T();
  const none=sc.every(x=>!x.any), max=Math.max(10,...sc.map(x=>x.ice+x.snow));
  document.getElementById("tbars").innerHTML=none?`<span class="tempty">${L.noHist}</span>`:sc.map((x,i)=>{
    const n=x.ice+x.snow, hi=x.ice/max*100, hs=x.snow/max*100;
    return `<div class="col${i===slot?" sel":""}" title="${fmtClock(DATA.times[i])} · ${L.slipCount(n)}">${
      n?`<i style="height:${hi.toFixed(1)}%;background:${COLORS["jää/kuura"]}"></i><i style="height:${hs.toFixed(1)}%;background:${COLORS["luminen"]}"></i>`:""}</div>`}).join("");
  document.getElementById("tticks").innerHTML=none?"":(innerWidth<400?[0,12,24]:[0,6,12,18,24]).map(i=>
    `<span style="left:${((i+.5)/(last+1)*100).toFixed(2)}%">${fmtClock(DATA.times[i])}</span>`).join("");
  const cur=sc[slot]||{ice:0,snow:0};
  s.value=slot; s.setAttribute("aria-valuetext",`${slot===24?L.now:fmtClock(DATA.times[slot])}, ${L.slipCount(cur.ice+cur.snow)}`);
  out.innerHTML=`${slot===24?L.now:fmt(DATA.times[slot],{weekday:"short",hour:"2-digit",minute:"2-digit"})}<small>${L.slipCount(cur.ice+cur.snow)}</small>`;
  out.classList.toggle("past",slot!==24);
  const p=document.getElementById("play"); p.innerHTML=playing?PAUSE:PLAY; p.setAttribute("aria-label",playing?T().pause:T().play);
}
function setSlot(i){ slot=i; renderTimeline(); renderLegend(); refreshMap(); refreshWarn(); if(road!=null)renderRoads(); if(ROUTE.geom)renderRoute(); if(current&&current.type==="cam")openCam(current.id,true); }
document.getElementById("slider").oninput=e=>{stop();setSlot(+e.target.value)};
function stop(){ if(playing){clearTimeout(playing);playing=null;renderTimeline();} }
document.getElementById("play").onclick=()=>{
  if(playing) return stop();
  if(slot===24) setSlot(0);
  // Toisto etenee tunnin kerrallaan. Jos kamera on auki, odotetaan että sen kuva on vaihtunut
  // (enintään 3 s), jotta kuva ehtii mukaan eikä toisto karkaa kuvien edelle.
  const step=prefersReduced()?1200:800; let waited=0;
  const tick=()=>{
    if(slot>=24){stop();return;}
    const loading=current&&current.type==="cam"&&SHOT.seq>SHOT.shown;
    if(loading&&waited<3000){ waited+=100; playing=setTimeout(tick,100); return; }
    waited=0; setSlot(slot+1); playing=setTimeout(tick,step);
  };
  playing=setTimeout(tick,step);
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
// vaihda kuva vasta, kun uusi on ladattu ja purettu (ei tyhjää väliä). Pyynnöt numeroidaan:
// valmistunut kuva näytetään, jos se on uudempi kuin näkyvä, vaikka paneeli olisi välillä piirretty
// uudelleen (toistossa 450 ms välein), joten kuva etenee toiston mukana eikä jää ensimmäiseen.
const SHOT={seq:0,shown:0};
const shotImg=()=>document.querySelector("#panel .shot img");
function swapWhenReady(im,url,camId){
  const my=++SHOT.seq;
  // Ei himmennystä: toistossa se syttyi ja sammui joka askeleella, mikä näytti välkkymiseltä.
  const done=()=>{};
  // ladattu = tavut välimuistissa; purku odotetaan vain lyhyesti, koska taustavälilehdessä decode() ei valmistu
  const pre=new Image();
  new Promise((ok,ko)=>{pre.onload=ok;pre.onerror=ko;pre.src=url;})
    .then(()=>Promise.race([pre.decode?pre.decode().catch(()=>{}):0,new Promise(r=>setTimeout(r,150))])).then(()=>{
    const cur=shotImg();
    if(cur&&current&&current.id===camId&&my>SHOT.shown){ SHOT.shown=my; cur.src=url; }
    done();
  }).catch(done);
}
// toiston ja selauksen sujuvuus: seuraavan tunnin kuva välimuistiin valmiiksi
const PRELOADED=new Set();
function preloadNext(c){
  const nx=slot+1; if(nx>24) return;
  const at=nx===24?Date.now():Date.parse(DATA.times[nx]), s=shotAt(c,at);
  if(s&&s.url&&!PRELOADED.has(s.url)){ PRELOADED.add(s.url); const i=new Image(); i.src=s.url; }
}
function openCam(id,keep){
  const c=byId[id]; if(!c) return; if(current&&current.type==="warn") clearWarnSel(); current={type:"cam",id}; select(id); refreshWarn();
  if(isMobile()&&!keep) setCollapsed(true);
  if(!keep&&ready()) map.flyTo({center:[c.lon,c.lat],zoom:Math.max(map.getZoom(),8),
    offset:isMobile()?[0,-innerHeight*.3]:[-190,0],duration:prefersReduced()?0:800});
  const k=clsAt(c), col=COLORS[k], L=T(), past=slot!==24;
  const fr=past?(c.hf?c.hf[slot]:null):c.friction;
  const at=past?Date.parse(DATA.times[slot]):0, shot=past?shotAt(c,at):null;
  if(past&&(shot===undefined||!HIST[c.id]||Date.now()-HIST[c.id].at>=10*6e4)){
    const s0=slot; loadHist(c).then(()=>{ if(current&&current.id===c.id&&slot===s0&&shotAt(c,at)!==undefined) openCam(c.id,true) }); }
  const want=!past?`${c.img}?t=${Math.floor(Date.now()/6e4)}`:shot?shot.url:shot===null?c.img:"";
  // Sama kamera (aikajanan selaus): edellinen kuva jää näkyviin, kunnes uusi on ladattu ja purettu.
  // Ilman tätä jokainen vaihto näytti hetken mustaa (välkyntä, joka voi olla myös terveysriski).
  const p0=document.getElementById("panel"), oldImg=keep&&p0.querySelector(".shot img[src]"),
        prevH=p0.classList.contains("on")?p0.getBoundingClientRect().height:0,
        prevSrc=oldImg&&p0.dataset.cam===c.id?oldImg.getAttribute("src"):"", scrollTop=keep?(p0.querySelector(".scroll")||{}).scrollTop||0:0;
  const src=prevSrc&&want!==prevSrc?prevSrc:want;
  const gap=shot?Math.abs(shot.t-at):0;
  const cap=!past?"":shot?` · ${L.camTaken(fmtClock(new Date(shot.t).toISOString()))}${gap>20*6e4?` (${L.camGap(fmtGap(gap))})`:""}`
    :shot===null?`<br>${L.camLatest}`:`<br>${L.camLoading}`;
  // anturillinen kamera, jolta puuttuu yksittäinen tunti: tilarivi ja lukemat pysyvät paikallaan (ei nytkähdystä)
  const hourGap=k==="ei mittausta"&&past&&!!c.h;
  const sub=hourGap?`<span>${ic("clock")}<span class="num">${fmtClock(DATA.times[slot])}</span></span><span>${ic("tower")}${L.station} ${c.st}</span><span>${ic("pin")}<span class="num">${num(c.km," km")}</span></span>`
    :k==="ei mittausta"?(c.cls||c.h?"":L.aiSoon)
    :`<span>${ic("clock")}${L.measured} <span class="num">${fmtClock(past?DATA.times[slot]:(c.mt||c.t))}</span></span><span>${ic("tower")}${L.station} ${c.st}</span><span>${ic("pin")}<span class="num">${num(c.km," km")}</span></span>`;
  const p=document.getElementById("panel");
  p.setAttribute("aria-label",nameOf(c));
  p.innerHTML=`<div class="scroll">
    <div class="status" style="--c:${col}"><div><b>${L.cls[k]}</b><small>${sub}</small></div>
      <button class="x" aria-label="${L.close}">${X}</button></div>
    <div class="place"><h2 tabindex="-1">${esc(nameOf(c))}</h2>${placeLine(c)}</div>
    <figure class="shot"><img ${src?`src="${src}" alt="${esc(nameOf(c))}"`:'alt=""'}>
      <figcaption>${ic("camera")}${L.camNow}${c.view?" · "+esc((L.viewMap[c.view])||c.view.replace(/^Tie (\d)/,LANG==="en"?"Road $1":"Tie $1")):""}<span id="camtime"></span>${cap}</figcaption></figure>
    ${k!=="ei mittausta"||hourGap?`<dl class="read">
        <div class="kv joined"><dt>${ic("gauge")}${L.friction}</dt><dd class="num">${num(fr,"",2)}</dd></div>${scale(fr)}
        ${["jää/kuura","luminen"].includes(k)&&fr!=null&&fr>=0.6&&!past&&(c.ice||c.snow)?`<p class="thin">${L.thinIce(num(Math.max(c.ice||0,c.snow||0)," mm",2))}</p>`:""}
        ${past?"":`<div class="kv"><dt>${ic("thermo")}${L.roadT}</dt><dd class="num">${num(c.roadT," °C")}</dd></div>
        <div class="kv"><dt>${ic("thermoSun")}${L.airT}</dt><dd class="num">${num(c.airT," °C")}</dd></div>
        <div class="kv"><dt>${ic("droplet")}${L.water}</dt><dd class="num">${num(c.water," mm",2)}</dd></div>
        <div class="kv"><dt>${ic("cloudSnow")}${L.snow}</dt><dd class="num">${num(c.snow," mm",2)}</dd></div>
        <div class="kv"><dt>${ic("snowflake")}${L.ice}</dt><dd class="num">${num(c.ice," mm",2)}</dd></div>`}
      </dl>`
    :(c.cls?"":`<p class="empty"><strong>${L.noMeasure}</strong>${c.why==="far"?L.far(num(c.km," km")):L.nosensor} ${L.aiNote}</p>`)}
    ${c.h?`<div class="hist"><h3>${L.last24}</h3>
      <div class="strip">${c.h.map((x,i)=>`<i class="${i===slot?"sel":""}" title="${fmtClock(DATA.times[i])}: ${L.cls[x>=0?KEYS[x]:"ei mittausta"]}" style="background:${COLORS[x>=0?KEYS[x]:"ei mittausta"]}"></i>`).join("")}</div>
      <div class="strip-t"><span>${fmtClock(DATA.times[0])}</span><span>${L.now}</span></div></div>`:""}
  </div>`;
  p.classList.add("on"); if(!keep) panelShown(p);
  // puhelimessa alapaneelin korkeus seuraa sisältöä: saman kameran selauksessa se ei saa lyhentyä
  // (toiston alussa paneeli nytkähti alas ja takaisin ylös)
  if(isMobile()&&keep&&p.dataset.cam===c.id){ p.style.minHeight=Math.max(prevH,p.getBoundingClientRect().height)+"px"; }
  else p.style.minHeight="";
  p.dataset.cam=c.id;
  if(scrollTop) p.querySelector(".scroll").scrollTop=scrollTop;
  // Sama kamera: siirretään vanha kuvaelementti uuteen paneeliin. Uusi <img> samalla osoitteella purettaisiin
  // uudelleen ja näyttäisi ruudun tai kaksi tyhjää (välkyntä); siirretty elementti piirtyy heti.
  let im=p.querySelector(".shot img");
  if(im&&prevSrc&&oldImg){ im.replaceWith(oldImg); im=oldImg; }
  if(im) im.onerror=()=>{ if(im.getAttribute("src")===want) im.outerHTML=`<div class="noimg">${L.noImg}</div>`; };
  if(!keep) SHOT.shown=SHOT.seq;   // uusi kamera: vanhat lataukset eivät enää saa vaihtaa kuvaa
  if(im&&want&&src!==want) swapWhenReady(im,want,c.id); else if(im) SHOT.shown=++SHOT.seq;
  if(past) preloadNext(c);
  if(!past) camTime(c);
}
// varoituksen valinta pois: korostus kartalta ja listasta (myös kun avataan kamera tai lista)
function clearWarnSel(){
  if(ready()){ map.setFilter("warn-sel",["==",["get","i"],-1]); }
  document.querySelectorAll(".warn").forEach(b=>b.removeAttribute("aria-current"));
}
function openWarn(i,keep){
  // sama varoitus uudelleen = valinta pois
  if(!keep&&current&&current.type==="warn"&&current.i===i) return closePanel();
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
      <p class="src">${L.warnSrc} · <a class="btn" href="https://www.ilmatieteenlaitos.fi/varoitukset" target="_blank" rel="noopener">${L.readMore}${ic("ext")}</a></p></div>
  </div>`;
  p.classList.add("on"); panelShown(p);
}
function closePanel(){
  const p=document.getElementById("panel"); p.classList.remove("on"); current=null; select(""); delete p.dataset.cam; p.style.minHeight="";
  if(!p.inert){ p.inert=true; if(lastFocus&&document.contains(lastFocus)) lastFocus.focus({preventScroll:true}); lastFocus=null; }
  clearWarnSel(); refreshWarn();
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
