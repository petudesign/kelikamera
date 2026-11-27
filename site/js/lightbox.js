// Koko ruudun lightbox kamerakuville (avataan panel.js:stä).

const lbEl=document.getElementById("lightbox");
let lbLastFocus=null;
const lbOpen=()=>!!(lbEl&&!lbEl.hidden);

function lbConditionHtml(c){
  const L=T(), k=clsAt(c), past=slot!==24;
  const parts=[`<span class="lb-cond"><span class="sw" style="background:${COLORS[k]}"></span>${esc(L.cls[k])}</span>`];
  if(k!=="ei mittausta"){
    const fr=past?(c.hf?c.hf[slot]:null):c.friction;
    if(fr!=null) parts.push(`µ\u00a0${num(fr,"",2)}`);
    if(!past&&c.roadT!=null) parts.push(`${L.roadT.split(" ")[0]} ${num(c.roadT,"\u00a0°C")}`);
    if(!past&&c.airT!=null) parts.push(`${L.airT.split(" ")[0]} ${num(c.airT,"\u00a0°C")}`);
  }
  return parts.join(" · ");
}

function syncLightboxMeta(){
  if(!lbOpen()||!current||current.type!=="cam") return;
  const c=byId[current.id]; if(!c) return;
  const L=T(), list=presetsOf(c), pr=activePreset(c), multi=list.length>1;
  const v=fmtView(pr.name||c.view,0);
  const ct=panelEl.querySelector("#camtime"), sc=panelEl.querySelector("#shotcap");
  const timeTxt=((ct&&ct.textContent)||(sc&&sc.textContent)||"").replace(/^\s*·\s*/,"").trim();
  const sub=[v,timeTxt].filter(Boolean).join(" · ");
  lbEl.querySelector("#lb-title").textContent=nameOf(c);
  lbEl.querySelector("#lb-sub").textContent=sub;
  lbEl.querySelector("#lb-cond").innerHTML=lbConditionHtml(c);
  const im=lbEl.querySelector("#lb-img"), curSrc=shotImg()&&shotImg().getAttribute("src");
  if(im){ im.alt=nameOf(c)+(v?` — ${v}`:""); if(curSrc&&im.getAttribute("src")!==curSrc) im.src=curSrc; }
  const prev=lbEl.querySelector("#lb-prev"), next=lbEl.querySelector("#lb-next");
  if(prev){ prev.hidden=!multi; prev.setAttribute("aria-label",L.prevView); }
  if(next){ next.hidden=!multi; next.setAttribute("aria-label",L.nextView); }
  const foot=lbEl.querySelector("#lb-presets");
  if(foot) foot.innerHTML=presetPillsHtml(c);
  lbEl.querySelector("#lb-close").setAttribute("aria-label",L.close);
}

function openLightbox(){
  if(!current||current.type!=="cam") return;
  const c=byId[current.id]; if(!c) return;
  lbLastFocus=document.activeElement;
  lbEl.hidden=false;
  syncLightboxMeta();
  lbEl.querySelector("#lb-close").focus({preventScroll:true});
}

function closeLightbox(){
  if(!lbOpen()) return;
  lbEl.hidden=true;
  if(lbLastFocus&&document.contains(lbLastFocus)) lbLastFocus.focus({preventScroll:true});
  lbLastFocus=null;
}

if(lbEl){
  lbEl.addEventListener("click",e=>{
    if(e.target===lbEl||e.target.classList.contains("lb-stage")||e.target.closest("#lb-close")) return closeLightbox();
    if(e.target.closest("#lb-prev")) return stepPreset(-1);
    if(e.target.closest("#lb-next")) return stepPreset(1);
    const pill=e.target.closest(".pill[data-pid]");
    if(pill&&current&&current.type==="cam") selectPreset(byId[current.id],pill.dataset.pid);
  });
}
