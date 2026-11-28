// Kartta: MapLibre, kameratasot, varoitusalueet ja suodatus.

const FINLAND=[[19.0,59.6],[31.7,70.1]];
function fitPadding(){
  const key=document.getElementById("key");
  return isMobile()?{top:key.offsetHeight+20,bottom:80,left:12,right:12}:{top:64,bottom:90,left:390,right:24};
}
const map=new maplibregl.Map({container:"map",style:"https://tiles.openfreemap.org/styles/dark",
  bounds:FINLAND,fitBoundsOptions:{padding:fitPadding()},maxZoom:14,maxTileCacheZoomLevels:10,attributionControl:false});
map.addControl(new maplibregl.NavigationControl({showCompass:false}),"bottom-right");
// MapLibren oma ScrollZoomHandler viivyttää ensimmäistä rullausta 40 ms (wheel/trackpad-tunnistus)
// ja vaihtaa kesken eleen nopeutta sekä 200 ms easingia. Korvataan kevyellä, viiveettömällä rullazoomilla.
(function setupSmoothZoom(){
  map.scrollZoom.disable();
  const el=map.getCanvasContainer(), easeOut=t=>1-(1-t)**3;
  let target=null, anchor=null, ax=NaN, ay=NaN;
  const reset=()=>{target=null;anchor=null};
  map.on("zoomend",reset);
  map.on("dragstart",reset);
  el.addEventListener("wheel",e=>{
    e.preventDefault();
    if(!e.deltaY) return;
    let dy=e.deltaMode===1?e.deltaY*33:e.deltaMode===2?e.deltaY*120:e.deltaY;
    if(e.shiftKey) dy/=4;
    const pinch=e.ctrlKey, discrete=e.deltaMode!==0||Math.abs(dy)>=50;
    const step=pinch?-Math.max(-80,Math.min(80,dy))*.012:-Math.max(-240,Math.min(240,dy))*.0045;
    const cur=map.getZoom(), next=Math.min(map.getMaxZoom(),Math.max(map.getMinZoom(),(target??cur)+step));
    if(Math.abs(next-cur)<1e-4&&target===null) return;
    target=next;
    if(!anchor||Math.abs(e.clientX-ax)>2||Math.abs(e.clientY-ay)>2){
      const r=el.getBoundingClientRect();
      ax=e.clientX; ay=e.clientY;
      anchor=map.unproject([ax-r.left,ay-r.top]);
    }
    map.easeTo({zoom:target,around:anchor,duration:pinch?45:discrete?140:75,easing:easeOut,easeId:"wheel"});
  },{passive:false});
})();
function lockToFinland(){
  map.setMaxBounds(null); map.setMinZoom(0);
  map.fitBounds(FINLAND,{padding:fitPadding(),animate:false});
  const b=map.getBounds(), dx=(b.getEast()-b.getWest())*.15, dy=(b.getNorth()-b.getSouth())*.1;
  map.setMinZoom(map.getZoom()-.2);
  map.setMaxBounds([[b.getWest()-dx,b.getSouth()-dy],[b.getEast()+dx,b.getNorth()+dy]]);
}
// map.loaded() on false aina kun ruutuja latautuu, joten load-tapahtuma talteen lupauksena
const mapReady=new Promise(r=>map.once("load",r));
// Tummennus Suomen ulkopuolelle heti, ja kartta näkyviin vasta sen jälkeen (muuten pohjakartta välähtää)
function addMask(){
  map.addSource("fin",{type:"geojson",data:"data/finland.geojson",maxzoom:8});
  map.addLayer({id:"outside",type:"fill",source:"fin",maxzoom:9,filter:["==",["get","role"],"mask"],
    paint:{"fill-color":"#0a0a0a","fill-opacity":["interpolate",["linear"],["zoom"],5,.72,7,.5,9,0]}});
  map.addLayer({id:"border",type:"line",source:"fin",maxzoom:9,filter:["==",["get","role"],"border"],
    paint:{"line-color":"#9fb0c4","line-opacity":["interpolate",["linear"],["zoom"],5,.35,9,0],"line-width":1}});
}
function reveal(){document.getElementById("map").classList.add("shown")}
map.on("sourcedata",function masked(e){if(e.sourceId==="fin"&&e.isSourceLoaded){map.off("sourcedata",masked);reveal()}});
let mapLoaded=false;
map.on("error",()=>{
  if(mapLoaded||document.getElementById("map-err")) return;
  const msg=document.createElement("div");
  msg.id="map-err"; msg.className="map-err"; msg.setAttribute("role","status");
  msg.textContent=T().mapFail;
  document.body.appendChild(msg);
  reveal();
});
setTimeout(reveal,4000);
mapReady.then(()=>{mapLoaded=true; const e=document.getElementById("map-err"); if(e) e.remove(); lockToFinland();addMask()});
let rz; addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(lockToFinland,150)});

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
  map.addSource("warn",{type:"geojson",data:warnGeo(),maxzoom:9});
  map.addLayer({id:"warn-fill",type:"fill",source:"warn",filter:warnFilter(),paint:{"fill-color":v("--warn"),"fill-opacity":.08}});
  map.addLayer({id:"warn-line",type:"line",source:"warn",filter:warnFilter(),paint:{"line-color":v("--warn"),"line-width":1.2,"line-opacity":.7,"line-dasharray":[3,2]}});
  map.addLayer({id:"warn-sel",type:"line",source:"warn",filter:["==",["get","i"],-1],paint:{"line-color":v("--warn"),"line-width":2.5}});
  map.addSource("route",{type:"geojson",data:{type:"FeatureCollection",features:[]},maxzoom:12});
  map.addLayer({id:"route-case",type:"line",source:"route",layout:{"line-join":"round","line-cap":"round"},paint:{"line-color":"#0a0a0a","line-width":7}});
  map.addLayer({id:"route",type:"line",source:"route",layout:{"line-join":"round","line-cap":"round"},paint:{"line-color":"#c9d3df","line-width":3}});
  map.addSource("cams",{type:"geojson",data:geojson(),maxzoom:11,buffer:32});
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
  elevateLabels();

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
// Nosta kaupunkinimet ja päätienumerot kamerapisteiden yläpuolelle ja paranna luettavuutta hienovaraisella halolla.
function elevateLabels(){
  const styles={
    highway_name_motorway:{color:"rgba(198,205,214,0.8)",halo:"rgba(10,10,10,0.95)",width:2,blur:0.5},
    place_town:{color:"rgba(186,192,200,0.78)",halo:"rgba(10,10,10,0.92)",width:1.6,blur:0.6},
    place_city:{color:"rgba(220,224,230,0.86)",halo:"rgba(10,10,10,0.94)",width:1.8,blur:0.6},
    place_city_large:{color:"rgba(240,242,245,0.92)",halo:"rgba(10,10,10,0.95)",width:2,blur:0.6}
  };
  for(const [id,st] of Object.entries(styles)){
    if(!map.getLayer(id)) continue;
    map.setPaintProperty(id,"text-color",st.color);
    map.setPaintProperty(id,"text-halo-color",st.halo);
    map.setPaintProperty(id,"text-halo-width",st.width);
    map.setPaintProperty(id,"text-halo-blur",st.blur);
    map.moveLayer(id);
  }
  if(map.getLayer("highway_name_other")){
    map.setPaintProperty("highway_name_other","text-color","rgba(155,162,170,0.72)");
    map.setPaintProperty("highway_name_other","text-halo-color","rgba(10,10,10,0.9)");
    map.setPaintProperty("highway_name_other","text-halo-width",1.5);
  }
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
  map.setFilter("cams-halo",hidden.has("jää/kuura")?["==",["get","k"],""]
    :["all",["==",["get","k"],"jää/kuura"],["==",["get","dim"],0],...(road!=null?[["==",["get","road"],road]]:[])]);
}
const select=id=>{if(ready())map.setFilter("cams-sel",["==",["get","id"],id])};
