"""Savutesti: karttasivun päätoiminnot selaimessa ilman ikkunaa.

  python tools/smoke_test.py [http://localhost:8765/?lang=fi]

Avaa sivun ja tarkistaa: data latautuu, kamera aukeaa, aikajanan selaus vaihtaa kuvaa ilman uutta
kuvaelementtiä, kielen vaihto, varoituksen valinta ja poisto, kamerahaku, eikä JS-virheitä. Exit 1, jos jokin pettää.
"""
from __future__ import annotations

import json
import sys
import time

from chrome import Chrome

CHECKS = r"""(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms)), out={};
out.data=!!DATA&&DATA.cameras.length>500&&!!map.getLayer('cams');
const cam=DATA.cameras.find(c=>c.cls&&c.h);
openCam(cam.id); await wait(1500);
const img1=document.querySelector('#panel .shot img');
out.camOpen=document.getElementById('panel').classList.contains('on')&&!!img1;
setSlot(12); await wait(4000); setSlot(13); await wait(2500);
const img2=document.querySelector('#panel .shot img');
out.sameImageElement=img1===img2;
out.pastImage=!!img2.getAttribute('src')&&img2.getAttribute('src').includes('versionId');
setSlot(24); await wait(800);
document.querySelector('.lang button[data-lang="en"]').click(); await wait(500);
out.english=document.querySelector('#panel figcaption').textContent.includes('Camera image');
document.querySelector('.lang button[data-lang="fi"]').click(); await wait(300);
if(WARN.length){ openWarn(0); await wait(300); const on=current&&current.type==='warn';
  openWarn(0); await wait(300); out.warningToggle=on&&!current; } else out.warningToggle='ei varoituksia';
const q=document.getElementById('camq'); q.value=nameOf(cam).slice(0,6); q.dispatchEvent(new Event('input'));
out.search=document.querySelectorAll('#camres button').length>0;
out.errors=(window.__errors||[]);
return JSON.stringify(out)})()"""


def main(url: str) -> int:
    with Chrome(width=1440, height=900) as c:
        c.open(url, settle=1)
        r = json.loads(c.eval(CHECKS))
    failed = [k for k, v in r.items() if k != "errors" and v is False] + (["errors"] if r["errors"] else [])
    for k, v in r.items():
        print(f"  {'OK ' if k not in failed else 'VIRHE'}  {k}: {v}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8765/?lang=fi"))
