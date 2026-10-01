import {$, MONTHS, S, TERM_M, clamp, rnd} from '../core/state.js';
import {EVENTS, PRESS} from '../data/cast.js';
import {commitDraft, save} from './commit.js';
import {stepMonth} from './economy.js';
import {probeEvent} from './vault.js';
import {wageRound} from './wageround.js';
import {modal, shake, showChoice, showElection, showResults} from '../ui/modal.js';
import {bar} from '../ui/panels.js';
import {renderAll} from '../ui/speech.js';
import {renderStreet} from '../ui/street.js';
import {SHOCKS} from '../data/shocks.js';

/* ═══════════════ ZAMAN AKIŞI ═══════════════ */
export let busy=false;
export function advance(months){
  if(busy)return;busy=true;
  commitDraft();
  if(!S.qPrev)S.qPrev=JSON.parse(JSON.stringify({e:S.e,p:S.p,seg:S.seg}));
  S.lastAttr={inflation:[],gap:[],unemployment:[],usdtry:[],vote:[],realIncome:[]};
  const ov=document.createElement('div');ov.className='trans';
  const dur=months>1?1500:1000;
  ov.innerHTML=`<div class="tr-q" id="trq">—</div><div class="tr-s" id="trs"></div>
    <div class="tr-bar"><i id="trbar" style="transition:width ${dur}ms steps(16)"></i></div>`;
  document.body.appendChild(ov);
  requestAnimationFrame(()=>{const b=document.getElementById('trbar');if(b)b.style.width='100%';});
  const steps=months>1
    ? ['Çeyrek kapanıyor…','Ödenekler hazineden çıkıyor…','Piyasalar fiyatlıyor…','TÜİK verileri açıklıyor…']
    : ['Kararlar işleniyor…','Ödenekler aktarılıyor…','Piyasalar fiyatlıyor…'];
  steps.forEach((s,i)=>setTimeout(()=>{const n=document.createElement('div');n.className='tr-i';
    n.textContent='▸ '+s;const c=document.getElementById('trs');if(c)c.appendChild(n);},i*(dur/steps.length)));
  let closed=false;
  const runOne=()=>{
    if(S.t>=(S.termEnd||TERM_M))return;
    if(stepMonth())closed=true;
    const q=document.getElementById('trq');
    if(q)q.textContent=`${MONTHS[S.month-1]} ${S.year}`;};
  for(let i=0;i<months;i++)setTimeout(runOne,(i+1)*(dur/(months+1)));
  setTimeout(()=>{ov.remove();renderAll();save();afterStep(closed);busy=false;},dur+220);
}
/* ── rastgele şok çarkı ──
   Her ay bir zar atılır. Temel ihtimal düşüktür; ekonomi kırılganlaştıkça
   (rezerv erimiş, risk primi yüksek, borç büyük, kredi balonu şişmiş)
   kötü haber ihtimali artar. Bir olaydan sonra birkaç ay sessizlik olur. */
export function rollShock(){
  if(!S.opts.events)return null;
  if(S.t<4)return null;
  if(S.shockCool>0){S.shockCool--;return null;}
  const e=S.e;
  const stress=clamp(
      Math.max(0,(90-e.reserves))/90*0.9
    + Math.max(0,e.cds-320)/700
    + Math.max(0,e.debt-50)/90
    + Math.max(0,e.credit-40)/60
    + Math.max(0,e.inflation-30)/90, 0, 1.6);
  const p=0.085+stress*0.085;                       // ayda ~%8–%22
  if(rnd()>p)return null;
  const pool=SHOCKS.map(x=>({x,w:(x.w?x.w(S):1)*(S.shockSeen&&S.shockSeen[x.id]?0.35:1)}))
                   .filter(o=>o.w>0);
  if(!pool.length)return null;
  let tot=pool.reduce((a,o)=>a+o.w,0), r=rnd()*tot;
  let pick=pool[pool.length-1].x;
  for(const o of pool){ r-=o.w; if(r<=0){pick=o.x;break;} }
  if(!S.shockSeen)S.shockSeen={};
  S.shockSeen[pick.id]=(S.shockSeen[pick.id]||0)+1;
  S.shockCool=4+Math.floor(rnd()*4);                // 4–7 ay sessizlik
  return pick;
}
export function afterStep(quarterClosed){
  const ev=S.opts.events?rollShock():null;
  // her ocak: asgari ücret + emekli aylığı zam turu
  const needWage=(S.month===1&&S.t>0&&S.wageYear!==S.year);
  const fin=()=>{
    if(S.t>=(S.termEnd||TERM_M)){showElection();return;}
    if(quarterClosed){
      const qi=Math.floor((S.t-1)/3);
      if(qi%2===1){runPress(()=>{showResults();S.qPrev=JSON.parse(JSON.stringify({e:S.e,p:S.p,seg:S.seg}));renderAll();save();});return;}
      showResults();S.qPrev=JSON.parse(JSON.stringify({e:S.e,p:S.p,seg:S.seg}));
    }
    renderAll();save();};
  const afterEv=()=>{
    if(needWage){wageRound(()=>{if(S.me&&S.me.probe){probeEvent(fin);return;}fin();});return;}
    if(S.me&&S.me.probe){probeEvent(fin);return;}
    fin();};
  if(ev){ev.apply(S);shake();renderStreet();showChoice({...ev,kind:'event'},afterEv);}
  else afterEv();
}
export function runPress(done){
  /* Gazeteci gündemdekini sorar: ağırlıklar tabloya göre değişir,
     son sorulanlar bir süre tekrar gelmez. */
  if(!S.pressSeen)S.pressSeen={};
  const pool=PRESS.map(q=>({q,w:(q.w?q.w(S):1)*(S.pressSeen[q.id]?0.25:1)})).filter(o=>o.w>0);
  let tot=pool.reduce((a,o)=>a+o.w,0), r=rnd()*tot, pick=pool[pool.length-1].q;
  for(const o of pool){ r-=o.w; if(r<=0){pick=o.q;break;} }
  Object.keys(S.pressSeen).forEach(k=>{if(--S.pressSeen[k]<=0)delete S.pressSeen[k];});
  S.pressSeen[pick.id]=3;
  const title=typeof pick.q==='function'?pick.q(S):pick.q;
  showChoice({ico:'🎙️',kicker:'Basın Toplantısı · '+pick.outlet,
    title,lede:'Gazeteci mikrofonu uzattı. Kameralar canlı yayında.',opts:pick.opts,kind:'press'},done);
}
