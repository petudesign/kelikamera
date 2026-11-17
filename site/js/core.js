// Yhteinen tila, värit, muotoilu ja ikonit.

const css=getComputedStyle(document.documentElement), v=n=>css.getPropertyValue(n).trim();
const KEYS=["kuiva","kostea","märkä","luminen","jää/kuura"];
// "ohut": anturin mukaan lunta tai jäätä, mutta pito hyvä ja kerros alle 0,1 mm (sama sääntö kuin opetusdatassa)
const COLORS={"kuiva":v("--kuiva"),"kostea":v("--kostea"),"märkä":v("--marka"),"ohut":v("--ohut"),"luminen":v("--luminen"),"jää/kuura":v("--jaa"),"ei mittausta":v("--none")};
const ORDER=["jää/kuura","luminen","ohut","märkä","kostea","kuiva","ei mittausta"];
const SLIPPERY=["jää/kuura","luminen"];
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
// Lucide-ikonit (ISC, lucide.dev) upotettuina
const ICON={gauge:'<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',thermo:'<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',thermoSun:'<path d="M12 2v2"/><path d="M12 8a4 4 0 0 0-1.645 7.647"/><path d="M2 12h2"/><path d="M20 14.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z"/><path d="m4.93 4.93 1.41 1.41"/><path d="m6.34 17.66-1.41 1.41"/>',droplet:'<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',cloudSnow:'<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 15h.01"/><path d="M8 19h.01"/><path d="M12 17h.01"/><path d="M12 21h.01"/><path d="M16 15h.01"/><path d="M16 19h.01"/>',snowflake:'<path d="m10 20-1.25-2.5L6 18"/><path d="M10 4 8.75 6.5 6 6"/><path d="m14 20 1.25-2.5L18 18"/><path d="m14 4 1.25 2.5L18 6"/><path d="m17 21-3-6h-4"/><path d="m17 3-3 6 1.5 3"/><path d="M2 12h6.5L10 9"/><path d="m20 10-1.5 2 1.5 2"/><path d="M22 12h-6.5L14 15"/><path d="m4 10 1.5 2L4 14"/><path d="m7 21 3-6-1.5-3"/><path d="m7 3 3 6h4"/>',clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',tower:'<path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9"/><path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5"/><circle cx="12" cy="9" r="2"/><path d="M16.2 4.8c2 2 2.26 5.11.8 7.47"/><path d="M19.1 1.9a9.96 9.96 0 0 1 0 14.1"/><path d="M9.5 18h5"/><path d="m8 22 4-11 4 11"/>',pin:'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',camera:'<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/>',tri:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',dashed:'<path d="M10.1 2.182a10 10 0 0 1 3.8 0"/><path d="M13.9 21.818a10 10 0 0 1-3.8 0"/><path d="M17.609 3.721a10 10 0 0 1 2.69 2.7"/><path d="M2.182 13.9a10 10 0 0 1 0-3.8"/><path d="M20.279 17.609a10 10 0 0 1-2.7 2.69"/><path d="M21.818 10.1a10 10 0 0 1 0 3.8"/><path d="M3.721 6.391a10 10 0 0 1 2.7-2.69"/><path d="M6.391 20.279a10 10 0 0 1-2.69-2.7"/>',history:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',ext:'<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',list:'<path d="m9 18 6-6-6-6"/>'};
const ic=(n,cls="")=>`<svg class="ic${cls?" "+cls:""}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
const X='<svg class="ic" style="width:16px;height:16px" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
const PLAY='<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>';
const PAUSE='<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect fill="currentColor" x="14" y="3" width="5" height="18" rx="1"/><rect fill="currentColor" x="5" y="3" width="5" height="18" rx="1"/></svg>';

// keli kameralle valitulla hetkellä
function clsAt(c,i=slot){
  if(i===24) return c.thin?"ohut":c.cls||"ei mittausta";
  return histAt(c,i);
}
// keli tunnin i historiasta (i=24 on viimeisin tunti, ei välttämättä sama kuin nykyhetken mittaus)
function histAt(c,i){
  const x=c.h?c.h[i]:-1;
  return x<0?"ei mittausta":c.th&&c.th.includes(i)?"ohut":KEYS[x];
}

const isMobile=()=>innerWidth<=720;
const prefersReduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
