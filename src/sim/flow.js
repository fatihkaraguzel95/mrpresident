import {$, MONTHS, S, TERM_M} from '../core/state.js';
import {EVENTS, PRESS} from '../data/cast.js';
import {commitDraft, save} from './commit.js';
import {stepMonth} from './economy.js';
import {probeEvent} from './vault.js';
import {wageRound} from './wageround.js';
import {modal, shake, showChoice, showElection, showResults} from '../ui/modal.js';
import {bar} from '../ui/panels.js';
import {renderAll} from '../ui/speech.js';
import {renderStreet} from '../ui/street.js';

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
export function afterStep(quarterClosed){
  const ev=S.opts.events?EVENTS.find(x=>x.at===S.t):null;
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
  const q=PRESS[(Math.floor(S.t/3)*3)%PRESS.length];
  showChoice({ico:'🎙️',kicker:'Basın Toplantısı · '+q.outlet,
    title:q.q,lede:'Gazeteci mikrofonu uzattı. Kameralar canlı yayında.',opts:q.opts,kind:'press'},done);
}
