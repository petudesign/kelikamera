// Reittihaku: paikat Photonista (komoot), reitti OSRM:stä (FOSSGIS); reitin kamerat ja varoitukset.
// Palvelut ovat maksuttomia kohtuukäyttöön, joten haku odottaa kirjoittamisen loppua ja reitti haetaan kerran.
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
  if(!ROUTE.geom){ document.getElementById("p-route").classList.remove("has-route","editing"); if(worseScope==="route") renderWorse(worsening()); let last=null; try{last=JSON.parse(localStorage.getItem("route")||"null")}catch(e){}
    el.innerHTML=(last&&last.from&&last.to?`<button class="last" id="lastroute">${ic("history")}<span>${esc(last.from.name)} → ${esc(last.to.name)}<small>${L.lastRoute}</small></span></button>`:"")+
      `<p class="blank credits" style="border:0">${L.routeSrc}</p>`;
    const lb=document.getElementById("lastroute"); if(lb) lb.onclick=()=>{ROUTE.from=last.from;ROUTE.to=last.to;
      document.getElementById("from").value=last.from.name; document.getElementById("to").value=last.to.name; maybeRoute();};
    return; }
  const cams=ROUTE.cams, meas=cams.filter(x=>clsAt(x.c)!=="ei mittausta");
  const n=Object.fromEntries(ORDER.map(k=>[k,0])); meas.forEach(x=>n[clsAt(x.c)]++);
  const slip=meas.filter(x=>SLIPPERY.includes(clsAt(x.c)));
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
      <div class="mix" aria-hidden="true">${ORDER.slice(0,-1).reverse().map(k=>`<i style="width:${meas.length?n[k]/meas.length*100:0}%;background:${COLORS[k]}"></i>`).join("")}</div>
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
