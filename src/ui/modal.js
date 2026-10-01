import {$, MSHORT, S, SAVE_KEY, TERM_M, clamp, nf, pct, qOf, signed} from '../core/state.js';
import {applyFx, save} from '../sim/commit.js';
import {applyProbe, money, netWorth} from '../sim/vault.js';
import {renderAll} from './speech.js';

/* ═══════════════ EFEKTLER & MODAL ═══════════════ */
export function floatD(x,y,t,col){const d=document.createElement('div');d.className='fl';d.textContent=t;
  d.style.left=x+'px';d.style.top=y+'px';d.style.color=col;
  document.body.appendChild(d);setTimeout(()=>d.remove(),1200);}
export function confetti(n=60){const C=['#E8941A','#2F6B3E','#E8C547','#4A9FD8','#A82F26','#EFDCB4'];
  for(let i=0;i<n;i++){const s=document.createElement('span');s.className='cf';
    s.style.left=Math.random()*100+'vw';s.style.background=C[i%C.length];
    s.style.animation=`cfall ${(1.8+Math.random()*1.4).toFixed(2)}s steps(14) ${(Math.random()*.4).toFixed(2)}s forwards`;
    document.body.appendChild(s);setTimeout(()=>s.remove(),4000);}}
export const shake=()=>{document.body.classList.add('shaking');setTimeout(()=>document.body.classList.remove('shaking'),480);};

export let blocking=false,layReady=false;
export const setLayReady=v=>{layReady=v;};
export function modal(html,dismissible){const r=$('#modalRoot');blocking=(dismissible===false);
  r.innerHTML=`<div class="veil"><div class="dlg" role="dialog" aria-modal="true">${html}</div></div>`;
  r.querySelector('.veil').onclick=e=>{if(e.target.classList.contains('veil')&&!blocking)closeModal();};
  return r.querySelector('.dlg');}
export const closeModal=()=>{$('#modalRoot').innerHTML='';blocking=false;};

export function showChoice(c,done){
  const d=modal(`<div class="dlg-t"><span class="ic">${c.ico}</span>
      <div><div class="dlg-k">${c.kicker}</div><h3>${c.title}</h3></div></div>
    <div class="dlg-b"><p class="dlg-l">${c.lede}</p>
      <div class="ctl-l" style="margin:14px 0 8px">Seçeneğini belirle</div>
      <div id="ch">${c.opts.map((o,i)=>
        `<button class="choice" data-i="${i}"><span class="choice-no">${i+1}</span>
          <span><span class="choice-t">${o.t}</span><span class="choice-m">${o.note}</span></span></button>`).join('')}</div></div>`,false);
  d.querySelector('#ch').onclick=ev=>{
    const b=ev.target.closest('[data-i]');if(!b)return;
    const o=c.opts[+b.dataset.i];applyFx(o.fx);
    if(o.probe)applyProbe(o.probe);
    S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:c.kind,title:c.title,body:'Tercih: '+o.t.replace(/^"|"$/g,'')});
    closeModal();done&&done();};
}
export function showResults(){
  const p=S.qPrev,e=S.e;
  const rows=[['Enflasyon','inflation',v=>pct(v),true],['Çıktı açığı','gap',v=>signed(v)+' p',false],
    ['İşsizlik','unemployment',v=>pct(v),true],['Alım gücü','realIncome',v=>nf(v,0),false],
    ['USD/₺','usdtry',v=>nf(v,2),true]];
  const html=rows.map(([n,k,f,inv],i)=>{
    const ov=p.e[k],nv=e[k],dd=nv-ov,good=inv?dd<0:dd>0;
    const cls=Math.abs(dd)<.005?'mut':good?'grn':'red';
    const at=(S.lastAttr[k]||[]).filter(x=>Math.abs(x[1])>.01).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,5);
    return `<div class="res-r"><span class="res-n">${n}</span>
      <span class="res-m"><span class="o">${f(ov)}</span> → <b>${f(nv)}</b> <span class="${cls}">${dd>0?'▲':dd<0?'▼':'—'}</span></span>
      ${at.length?`<button class="whyb" data-w="${i}">Neden?</button>`:'<span></span>'}
      ${at.length?`<div class="why" id="w${i}">${at.map(([s,v])=>
        `<div><span>${v>0?'▲':'▼'} ${s}</span><b class="${(inv?v<0:v>0)?'grn':'red'}">${signed(v,2)}</b></div>`).join('')}</div>`:''}
    </div>`;}).join('');
  const dv=S.p.vote-p.p.vote,dc=e.credibility-p.e.credibility;
  const pm=S.month-1<1?12:S.month-1, py=S.month-1<1?S.year-1:S.year;
  const d=modal(`<div class="dlg-t"><span class="ic">📊</span>
      <div><div class="dlg-k">Çeyrek Raporu</div><h3>${py} · ${qOf(pm)}. çeyrek sonuçları</h3></div></div>
    <div class="dlg-b">${html}
      <div class="stat2">
        <div><span>Oy potansiyeli</span><b>${pct(S.p.vote)} <span style="font-size:14px" class="${dv>0?'grn':dv<0?'red':'mut'}">${signed(dv,2)}</span></b></div>
        <div><span>Güvenilirlik</span><b>${nf(e.credibility,0)} <span style="font-size:14px" class="${dc>0?'grn':'red'}">${signed(dc,1)}</span></b></div>
        <div><span>Potansiyel büyüme</span><b>${pct(e.potGrowth)}</b></div>
      </div></div>
    <div class="dlg-f"><button class="sbtn" style="width:auto;padding:10px 28px;font-size:15px;margin:0" id="ok">DEVAM</button></div>`,false);
  d.onclick=ev=>{const w=ev.target.closest('[data-w]');
    if(w){d.querySelector('#w'+w.dataset.w).classList.toggle('on');return;}
    if(ev.target.id==='ok')closeModal();};
  if(dv>.4)confetti(45);
}
export function showElection(){
  const win=S.p.vote>=50;
  const donem=(S.term||1);
  if(win)confetti(140);else shake();
  modal(`<div class="dlg-t"><span class="ic">${win?'🎉':'🗳️'}</span>
      <div><div class="dlg-k">Genel Seçim · ${S.year} · ${donem}. dönem sonu</div>
      <h3>${win?'Yeniden seçildin':'İktidar el değiştirdi'}</h3></div></div>
    <div class="dlg-b"><p class="dlg-l">Sandıktan <b>${pct(S.p.vote)}</b> oy çıktı.
      ${win?`Dört yıl daha ekonomiyi sen yöneteceksin — <b>ama devraldığın tablo kendi bıraktığın tablo.</b>
            Borç, rezervler, yürürlükteki paketler ve garanti ödemeleri aynen devam ediyor.`
           :'Seçmen dört yılın sonunda başka bir tercihte bulundu.'}</p>
      <div style="margin-top:12px">
        ${[['Enflasyon',pct(S.e.inflation)],['Büyüme',pct(S.e.growth)],['İşsizlik',pct(S.e.unemployment)],
           ['Hane alım gücü',nf(S.e.realIncome,0)],['Potansiyel büyüme',pct(S.e.potGrowth)],
           ['Borç/GSYH',pct(S.e.debt)],['Güvenilirlik',nf(S.e.credibility,0)+'/100'],
           ['Asgari ücret',nf(S.e.minWage,0)+' ₺'],['Kişisel servetin',money(netWorth())]]
          .map(([k,v])=>`<div class="res-r"><span class="res-n">${k}</span><span class="res-m"><b>${v}</b></span><span></span></div>`).join('')}</div>
      ${win?'':'<div class="note">Dönem burada bitti. Yeni bir oyun başlatabilirsin.</div>'}</div>
    <div class="dlg-f"><button class="sbtn" style="width:auto;padding:10px 28px;font-size:15px;margin:0" id="nw">${
      win?`${donem+1}. DÖNEME BAŞLA ▶`:'YENİ OYUN'}</button></div>`,false);
  $('#nw').onclick=()=>{
    if(!win){try{localStorage.removeItem(SAVE_KEY);}catch(e){}location.reload();return;}
    /* Yeni dönem: ekonomi, borç, kasa ve yürürlükteki her şey devam eder.
       Sadece takvim uzar ve seçim galibiyetinin kısa bir balayısı olur. */
    S.term=donem+1; S.wins=(S.wins||0)+1;
    S.termEnd=(S.termEnd||TERM_M)+TERM_M;
    S.p.morale=clamp(S.p.morale+4,2,98);
    S.p.unrest=clamp(S.p.unrest-6,3,99);
    S.e.credibility=clamp(S.e.credibility+2,3,97);
    S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'event',
      title:`${S.year} seçimi kazanıldı`,
      body:`Sandıktan ${pct(S.p.vote)} çıktı. ${S.term}. dönem başlıyor — devraldığın tablo kendi bıraktığın tablo.`});
    closeModal(); renderAll(); save();
  };
}
export function showArchive(){
  const body=S.log.length
    ? `<div class="tl">${S.log.slice(0,40).map(l=>`<div class="e">
        <div class="q">${l.q}</div><div class="t">${l.title}</div><div class="d">${l.body}</div></div>`).join('')}</div>`
    : `<div class="empty">Henüz karar alınmadı.<br>İlk ayı ilerlettiğinde kararların burada birikecek.</div>`;
  modal(`<div class="dlg-t"><span class="ic">🗂️</span>
    <div><div class="dlg-k">Dönem Arşivi</div><h3>Ne yaptın, ne oldu?</h3></div></div>
    <div class="dlg-b">${body}</div>
    <div class="dlg-f"><button class="sbtn alt" style="width:auto;padding:9px 22px;margin:0" onclick="closeModal()">KAPAT</button></div>`);
}
