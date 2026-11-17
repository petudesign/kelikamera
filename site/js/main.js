// Käynnistys: data ja ensimmäinen piirto.

Promise.all([fetch("data/latest.json").then(r=>r.json()),fetch("data/warnings.json").then(r=>r.json()).catch(()=>({warnings:[]}))])
.then(([d,w])=>{
  DATA=d; WARN=w.warnings||[]; d.cameras.forEach(c=>byId[c.id]=c);
  renderAll(); syncTabIdx(); document.getElementById("key").classList.remove("loading");
  mapReady.then(addLayers);
  map.on("moveend",()=>{ if(worseScope==="view"&&!document.getElementById("p-worse").hidden) renderWorse(worsening()); });
});
