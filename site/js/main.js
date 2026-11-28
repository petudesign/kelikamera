// Käynnistys: data ja ensimmäinen piirto.

const fetchJson=url=>fetch(url).then(r=>r.ok?r.json():Promise.reject(new Error(`${url}: ${r.status}`)));

Promise.all([fetchJson("data/latest.json"),fetchJson("data/warnings.json").catch(()=>({warnings:[]}))])
.then(([d,w])=>{
  if(!d||!Array.isArray(d.cameras)) throw new Error("Virheellinen latest.json");
  DATA=d; WARN=Array.isArray(w.warnings)?w.warnings:[]; d.cameras.forEach(c=>byId[c.id]=c);
  renderAll(); syncTabIdx(); document.getElementById("key").classList.remove("loading");
  mapReady.then(addLayers).then(()=>{
    const cam=new URLSearchParams(location.search).get("cam");
    if(cam&&byId[cam]) openCam(cam);
    startLive();
  });
  map.on("moveend",()=>{ if(worseScope==="view"&&!document.getElementById("p-worse").hidden) renderWorse(worsening()); });
})
.catch(()=>{
  document.getElementById("key").classList.remove("loading");
  document.getElementById("rows").innerHTML=`<li class="blank">${esc(T().loadFail)}</li>`;
});
