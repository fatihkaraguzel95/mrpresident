import {$, K, MSHORT, S, clamp, nf, rnd} from '../core/state.js';
import {SPR} from '../data/sprites.js';
import {save} from './commit.js';
import {mediaDamp, pubInflation} from './vault.js';
import {closeModal, modal, shake} from '../ui/modal.js';
import {renderAll} from '../ui/speech.js';
import {headline} from './economy.js';

/* ═══════════════ SOKAK EYLEMLERİ ═══════════════
   Kur zıpladığında, enflasyon ısırdığında, zam turunda sendikayı
   küstürdüğünde ya da huzursuzluk biriktiğinde meydan dolar.
   Müdahale ucuz değildir: sokağı boşaltırsın, kurumsal itibarı ve
   gençleri kaybedersin. Hiç dokunmazsan eylem büyür.
   ═══════════════════════════════════════════════ */
export const PROT_KIND={
  fx    :{t:'Kur şoku protestosu',    why:'Lira bir ayda sert değer kaybetti; market etiketleri günlük değişiyor.'},
  price :{t:'Hayat pahalılığı eylemi',why:'Mutfak enflasyonu maaşı yakaladı; esnaf da kepenk kapatıyor.'},
  wage  :{t:'Sendika grevi',          why:'Zam turu sendikanın talebinin altında kaldı; iş bırakma başladı.'},
  jobs  :{t:'İşsizlik yürüyüşü',      why:'İşsizlik çift haneye dayandı, gençler meydanda.'},
  graft :{t:'Yolsuzluk protestosu',   why:'Kamu ihaleleri ve şeffaflık tartışması sokağa taştı.'}
};
export function startProtest(kind,size){
  const cur=S.protest;
  if(cur&&(cur.phase||'live')==='live'){cur.size=clamp(cur.size+size*0.5,1,9);return;}  // süren eylem büyür
  if(cur)return;                                                          // dağıtılmışken yenisi hemen doğmaz
  S.protest={on:true,phase:'live',kind,size:clamp(size,1,9),age:0,police:0,until:0,handled:false};
  headline('Sokakta eylem: '+PROT_KIND[kind].t.toLowerCase());
  S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'event',title:PROT_KIND[kind].t,
    body:PROT_KIND[kind].why});
}
/* koşullar eylem doğurur mu? — her ayın sonunda çalışır */
export function protestCheck(fxC){
  const e=S.e,p=S.p,P=S.protest;
  if(P){
    const ph=P.phase||'live';
    P.age++;
    if(ph==='live'){                      // ilgilenilmeyen eylem büyür ve yıpratır
      P.size=clamp(P.size+0.6,1,9);
      p.unrest=clamp(p.unrest+1.6,3,99);
      e.cds=clamp(e.cds+7,80,1500);
      p.morale=clamp(p.morale-0.7,2,98);
      S.seg.sme=clamp(S.seg.sme-0.5,2,98);            // kepenk kapalı, ciro yok
      if(P.age>=5)S.protest=null;                     // kendiliğinden dağılır
      return;
    }
    if(ph==='contained'){                 // barikat altında: küçülür ama esnaf hâlâ kapalı
      P.size=clamp(P.size-0.5,0,9);
      p.unrest=clamp(p.unrest-0.4,3,99);
      S.seg.sme=clamp(S.seg.sme-0.2,2,98);
      if(P.size<=1||P.age>=P.until){P.phase='cleared';P.police=2;P.age=0;}
      return;
    }
    if(ph==='clearing'){P.phase='cleared';P.police=2;P.age=0;return;}
    if(ph==='cleared'){P.police--;if(P.police<=0)S.protest=null;return;}
    return;
  }
  if(S.t<2)return;
  const pubInf=pubInflation();
  let kind=null,sz=0;
  if(fxC>4.2)                        {kind='fx';   sz=1.5+fxC*0.35;}
  else if(pubInf>28&&e.realIncome<97){kind='price';sz=1.2+(pubInf-28)*0.10;}
  else if(e.unemployment>11.5)       {kind='jobs'; sz=1.2+(e.unemployment-11.5)*0.7;}
  else if(p.integrity<32)            {kind='graft';sz=1.5;}
  else if(p.unrest>66)               {kind='price';sz=1.0+(p.unrest-66)*0.10;}
  if(!kind)return;
  // huzursuzluk düşükken kalabalık toplanmaz; medya kontrolü de bastırır
  const odds=clamp((p.unrest-34)/70,0,0.9)*(1-mediaDamp()*0.5);
  if(rnd()<odds)startProtest(kind,sz);
}
/* ── sokakta çizim ──
   Evreler:  live      → yalnız eylemciler, müdahale butonu yanıp söner
             contained → eylemciler DURUYOR, polis önlerinde barikat kuruyor
             clearing  → polis ilerliyor, eylemciler sağa doğru dağıtılıyor
             cleared   → meydan boş, birkaç ay polis nöbette              */
export function renderProtest(){
  const sv=$('#street');if(!sv)return;
  const gP=sv.querySelector('#prot'),gL=sv.querySelector('#pol');
  if(!gP||!gL)return;
  const P=S.protest,PH=15.5,Y=(72-PH).toFixed(1);
  const ph=P?(P.phase||'live'):null;
  const showProt=!!P&&(ph==='live'||ph==='contained'||ph==='clearing');
  const showPol =!!P&&(ph==='contained'||ph==='clearing'||ph==='cleared');

  if(showProt){
    const n=clamp(3+Math.round(P.size),3,9);
    // dağıtılırken kalabalık sağa savrulup söner; tutulurken yerinde durur
    const wrap=ph==='clearing'?'animation:flee 1.6s ease-in forwards'
              :ph==='contained'?'animation:hold 1.5s ease-in-out infinite':'';
    gP.innerHTML=`<g style="${wrap}">`+Array.from({length:n},(_,i)=>{
      const W=SPR.protest[i%SPR.protest.length],w=W.w*PH/W.h;
      const x=(132+i*17+((i%2)?4:0)).toFixed(1);
      const inner=ph==='clearing'?''
        :`animation:chant ${(0.85+(i%4)*0.15).toFixed(2)}s ease-in-out infinite;animation-delay:${(i*0.13).toFixed(2)}s`;
      return `<g style="${inner}"><image href="${W.d}" x="${x}" y="${Y}" width="${w.toFixed(1)}" height="${PH}"/></g>`;
    }).join('')+`</g>`;
  } else gP.innerHTML='';

  if(showPol&&(ph==='clearing'||P.police>0)){
    // dağıtmada polis hattı kalabalığın içine yürür; nöbette yerinde bekler
    const wrap=ph==='clearing'?'animation:push 1.6s ease-in forwards'
              :ph==='contained'?'animation:march .9s ease-out 1':'animation:march .9s ease-out 1';
    const n=ph==='cleared'?4:5;
    gL.innerHTML=`<g style="${wrap}">`+Array.from({length:n},(_,i)=>{
      const W=SPR.riot[i%SPR.riot.length],w=W.w*PH/W.h;
      const x=(ph==='cleared'?128+i*17:86+i*15).toFixed(1);
      return `<image href="${W.d}" x="${x}" y="${Y}" width="${w.toFixed(1)}" height="${PH}"/>`;
    }).join('')+`</g>`;
  } else gL.innerHTML='';

  const btn=$('#protBtn');
  if(btn){
    const live=!!(P&&ph==='live');
    btn.style.display=live?'block':'none';
    if(live)btn.textContent='⚠ '+PROT_KIND[P.kind].t.toLocaleUpperCase('tr')+' — MÜDAHALE';}
}
/* ── müdahale seçenekleri ── */
export function protestModal(){
  const P=S.protest;if(!P||!P.on||P.handled)return;
  const K=PROT_KIND[P.kind],kal=Math.round(3+P.size*1.4);
  const OPT=[
    ['hard','🚨 Sert müdahale et','Çevik kuvvet meydanı boşaltır. Sokak susar — görüntüler dünyaya düşer.',
     'Tepki −− · şeffaflık − · gençler −− · risk primi +'],
    ['soft','🛡️ Kontrol altında tut','Barikat ve diyalog. Kalabalık dağılana kadar beklenir.',
     'Tepki − · küçük kurumsal maliyet'],
    ['none','🤝 Dokunma, kendi dağılsın','Meydan boş bırakılır. Hukuken temiz, siyaseten riskli.',
     'Eylem sürer · şeffaflık + · gençler +']];
  const d=modal(`<div class="dlg-t"><span class="ic">📣</span>
      <div><div class="dlg-k">Sokak · yaklaşık ${nf(kal,0)} bin kişi</div><h3>${K.t}</h3></div></div>
    <div class="dlg-b">
      <p class="dlg-l">${K.why} Valilik talimat bekliyor, canlı yayın açık.</p>
      <div class="ctl-l" style="margin:14px 0 8px">Ne yapılsın?</div>
      <div id="ch">${OPT.map(([k,t,l,n2],i)=>
        `<button class="choice" data-k="${k}"><span class="choice-no">${i+1}</span>
          <span><b>${t}</b><small style="display:block;margin-top:3px">${l}</small>
          <small class="mut" style="display:block;margin-top:3px">${n2}</small></span></button>`).join('')}</div>
    </div>`);
  d.onclick=ev=>{const b=ev.target.closest('[data-k]');if(!b)return;closeModal();resolveProtest(b.dataset.k);};
}
export function resolveProtest(mode){
  const P=S.protest,p=S.p,e=S.e,sz=P.size;
  const stamp=`${MSHORT[S.month-1]} ${S.year}`;
  if(mode==='hard'){
    p.unrest=clamp(p.unrest-14-sz*1.6,3,99);
    p.integrity=clamp(p.integrity-7-sz*0.5,2,98);
    e.credibility=clamp(e.credibility-3,3,97);
    e.cds=clamp(e.cds+22+sz*4,80,1500);
    S.seg.youth=clamp(S.seg.youth-4-sz*0.6,2,98);
    S.seg.minwage=clamp(S.seg.minwage-2-sz*0.3,2,98);
    S.seg.capital=clamp(S.seg.capital+1.5,2,98);            // "istikrar" okuması
    p.morale=clamp(p.morale-3,2,98);
    S.hardCrack=(S.hardCrack||0)+1;             // "orantısız güce izin yok" sözü için
    P.handled=true;P.phase='clearing';P.police=3;P.age=0;
    headline('Meydan çevik kuvvetle boşaltıldı');
    S.log.unshift({q:stamp,kind:'event',title:'Sert müdahale',
      body:'Eylem polis marifetiyle dağıtıldı. Tepki bastırıldı; kurumsal itibar ve genç desteği bedel oldu.'});
  }else if(mode==='soft'){
    p.unrest=clamp(p.unrest-7-sz*0.8,3,99);
    p.integrity=clamp(p.integrity-1.5,2,98);
    e.cds=clamp(e.cds+7,80,1500);
    S.seg.youth=clamp(S.seg.youth-0.8,2,98);
    P.handled=true;P.phase='contained';P.police=3;P.age=0;P.until=3;
    headline('Eylem barikat altına alındı, polis meydanda');
    S.log.unshift({q:stamp,kind:'event',title:'Kontrollü dağıtma',
      body:'Barikat ve diyalog. Sokak yavaş yavaş boşaldı, ağır bir görüntü çıkmadı.'});
  }else{
    p.integrity=clamp(p.integrity+3,2,98);
    S.seg.youth=clamp(S.seg.youth+2.2,2,98);
    e.cds=clamp(e.cds+10,80,1500);
    P.handled=true;P.phase='contained';P.until=5;P.police=0;P.age=0;  // meydan dolu, polis yok
    S.log.unshift({q:stamp,kind:'event',title:'Müdahale edilmedi',
      body:'Meydana dokunulmadı. Hukuki tablo temiz kaldı, kalabalık kendi ritmiyle dağılacak.'});
  }
  renderAll();save();
  // dağıtma sekansı: 1,7 sn sonra meydan boşalmış görünsün
  if(mode==='hard'){
    shake();
    setTimeout(()=>{if(S.protest&&S.protest.phase==='clearing'){S.protest.phase='cleared';S.protest.age=0;renderProtest();}},1700);
  }
}
