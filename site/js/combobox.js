// Yhteinen combobox-ohjain kamerahaulle (sidebar.js) ja reittihaulle (route.js).

function createCombobox({input, list, minLen=2, debounce=0, activeIdPrefix=null, onInput, query, renderItem, renderEmpty, onPick}){
  let items=[], sel=-1, timer, ctrl;
  const close=()=>{
    list.hidden=true;
    input.setAttribute("aria-expanded","false");
    if(activeIdPrefix) input.removeAttribute("aria-activedescendant");
    sel=-1;
  };
  const pick=i=>{
    const item=items[i];
    if(!item) return;
    close();
    onPick(item);
  };
  const draw=()=>{
    if(items.length){
      list.innerHTML=items.map((item,i)=>renderItem(item,i,i===sel)).join("");
      list.hidden=false;
      input.setAttribute("aria-expanded","true");
    }else if(renderEmpty){
      list.innerHTML=renderEmpty();
      list.hidden=false;
      input.setAttribute("aria-expanded","true");
    }else{
      close();
      return;
    }
    if(activeIdPrefix){
      if(sel>=0) input.setAttribute("aria-activedescendant",`${activeIdPrefix}${sel}`);
      else input.removeAttribute("aria-activedescendant");
    }
    list.querySelectorAll("button[data-i]").forEach(b=>b.onmousedown=e=>{e.preventDefault();pick(+b.dataset.i);});
  };
  const apply=res=>{ if(res==null) return; items=res; sel=-1; draw(); };
  const run=q=>{
    if(ctrl) ctrl.abort();
    ctrl=new AbortController();
    try{
      const res=query(q,ctrl.signal);
      if(res&&typeof res.then==="function") res.then(apply,()=>{});
      else apply(res);
    }catch{}
  };
  input.addEventListener("input",()=>{
    if(onInput) onInput();
    clearTimeout(timer);
    const q=input.value.trim();
    if(q.length<minLen){ items=[]; close(); return; }
    if(debounce) timer=setTimeout(()=>run(q),debounce);
    else run(q);
  });
  input.addEventListener("keydown",e=>{
    if(e.key==="ArrowDown"&&items.length){ sel=(sel+1)%items.length; draw(); e.preventDefault(); }
    else if(e.key==="ArrowUp"&&items.length){ sel=(sel-1+items.length)%items.length; draw(); e.preventDefault(); }
    else if(e.key==="Enter"&&items.length){ pick(sel<0?0:sel); e.preventDefault(); }
    else if(e.key==="Escape"){ close(); }
  });
  input.addEventListener("blur",()=>setTimeout(close,150));
  return {close, clear(){ items=[]; close(); }};
}
