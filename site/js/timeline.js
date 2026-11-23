// Aikajana: viimeiset 24 tuntia tunneittain, selaus ja toisto.

// liukkaat kamerat tunneittain (jää/kuura + lumi/sohjo, ei ohutta kerrosta), aikajanan pylväät
let SLIP=null;
function slipCounts(){
  if(SLIP) return SLIP;
  SLIP=DATA.times.map((_,i)=>{let ice=0,snow=0,any=0;
    DATA.cameras.forEach(c=>{const k=histAt(c,i); if(k!=="ei mittausta")any++; if(k==="jää/kuura")ice++; else if(k==="luminen")snow++;}); return {ice,snow,any}});
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
function setSlot(i){ slot=i; renderTimeline(); renderFavCams(); renderLegend(); refreshMap(); refreshWarn(); if(road!=null)renderRoads(); if(ROUTE.geom)renderRoute(); if(current&&current.type==="cam")openCam(current.id,true); }
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
