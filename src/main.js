import './styles.css';

import {$, INTRO_KEY, MONTHS, MSHORT, RNG, S, SAVE_KEY, clamp, freshState, pct, setRNG, setS} from './core/state.js';
import {ADVISORS, AVATARS, PRESS} from './data/cast.js';
import {renderChangelog} from './data/changelog.js';
import {commitDraft, load, save} from './sim/commit.js';
import {makeNews, snapshot, stepMonth} from './sim/economy.js';
import {advance, rollShock} from './sim/flow.js';
import {protestModal, resolveProtest, startProtest} from './sim/protest.js';
import {SCH, netWorth, schCost, schMin, showVault} from './sim/vault.js';
import {coach} from './ui/coach.js';
import {blocking, closeModal, layReady, modal, setLayReady, showArchive} from './ui/modal.js';
import {doSpeech, renderAll} from './ui/speech.js';
import {bubPed, bubTO, closeBub, paintBub, pixPortrait, renderStreet, seasonOf, setBubPed, setBubTO} from './ui/street.js';
import {MEG, MEGA, basket, budgetBook, finCeil, megaGuarantee, newPkgCap} from './data/mega.js';
import {POL, POLICIES} from './data/policies.js';
import {applyWageRound, openMega, wageAsk, wageOffer} from './sim/wageround.js';
import {openComposer} from './ui/cards.js';
import {renderSociety} from './ui/society.js';
import {SHOCKS} from './data/shocks.js';
import {PLEDGE, addPledge, checkPledges, draftBreaches} from './sim/pledges.js';
import {countryStatus} from './sim/status.js';

/* ═══════════════ BAŞLAT ═══════════════ */
export function seedHistory(){
  const raw=[[7,2025,44.8,48.2,36.0,4.6,8.5,36.90,47.0,57,28,51,104,1.2,50],
   [8,2025,42.9,46.4,34.6,4.4,8.5,37.60,46.0,56,29,50,103,1.0,50],
   [9,2025,41.5,45.1,33.8,4.2,8.6,38.20,45.0,55,30,49,102,0.9,49],
   [10,2025,40.1,43.6,32.7,4.1,8.7,38.90,44.0,54,31,48,102,0.8,48],
   [11,2025,38.8,42.1,31.7,4.0,8.7,39.60,43.0,53,32,47,101,0.7,48],
   [12,2025,37.9,40.8,30.9,3.9,8.8,40.20,42.5,52,33,46,101,0.6,47],
   [1,2026,36.8,39.6,30.1,3.8,8.8,40.60,41.0,51,33,45,100,0.6,47],
   [2,2026,35.7,38.3,29.2,3.7,8.9,41.00,40.0,50,34,45,100,0.5,46],
   [3,2026,34.6,37.0,28.4,3.6,8.9,41.40,38.0,49,35,44,100,0.5,46],
   [4,2026,33.9,36.2,27.9,3.6,8.9,41.60,37.0,48,35,44,100,0.4,46],
   [5,2026,33.4,35.7,27.5,3.5,8.9,41.90,36.5,47,34,43,100,0.4,46],
   [6,2026,33.1,35.4,27.2,3.5,8.9,42.00,36.0,45,34,43,100,0.4,46]];
  let g=92;
  return raw.map(([mo,yr,inf,core,exp,gr,u,fx,r,vt,un,cr,ri,gp,mrl])=>{
    g*=1+gr/100/12;
    return{label:`${MSHORT[mo-1]} ${String(yr).slice(2)}`,inflation:inf,core,expect:exp,growth:gr,
      unemployment:u,usdtry:fx,rate:r,real:r-exp,vote:vt,unrest:un,cred:cr,
      gdpReal:g,gap:gp,realIncome:ri,morale:mrl};});
}
export function boot(st,fresh){
  setS(st);
  // ── eski kayıtları göç ettir: eksik alan kalırsa tüm göstergeler NaN oluyordu
  const D=freshState(S.opts||{});
  const fill=(dst,src)=>{for(const k in src){
    if(dst[k]===undefined||dst[k]===null)dst[k]=JSON.parse(JSON.stringify(src[k]));
    else if(typeof src[k]==='object'&&!Array.isArray(src[k])&&typeof dst[k]==='object')fill(dst[k],src[k]);}};
  fill(S,D);
  ['inflation','expect','usdtry','rate','credit','api','zkTL','zkFX','gdpNom','debt','budget',
   'primary','effRate','potential','gdpReal','gap','potGrowth','nairu','wageIdx','pidx',
   'realIncome','dollarization','cds','credibility','reserves','fundRate','pubBias','supplyStock']
    .forEach(k=>{if(!isFinite(S.e[k]))S.e[k]=D.e[k];});
  if(!Array.isArray(S.e.fxHist))S.e.fxHist=[];
  if(!Array.isArray(S.e.wageHist))S.e.wageHist=[];
  if(!Array.isArray(S.active))S.active=[];
  if(!S.me||!isFinite(S.me.cash))S.me=D.me;
  if(!Array.isArray(S.me.schemes))S.me.schemes=[];
  if(!S.hist.length){S.hist=seedHistory();S.hist.push(snapshot());}
  if(!S.e.wageHist||!S.e.wageHist.length){S.e.wageHist=[];
    for(let i=12;i>=0;i--)S.e.wageHist.push(S.e.wageIdx/Math.pow(1+0.30/12,i));}
  if(!S.e.mwQ)S.e.mwQ=[];
  if(!S.lastAttr||!S.lastAttr.inflation)S.lastAttr={inflation:[],gap:[],unemployment:[],usdtry:[],vote:[],realIncome:[]};
  if(!S.news||!S.news.length)makeNews();
  if(!S.qPrev)S.qPrev=JSON.parse(JSON.stringify({e:S.e,p:S.p,seg:S.seg}));
  if(S.seed)setRNG(S.seed);
  S.draft.rate=S.e.rate;S.draft.api=S.e.api;S.draft.zkTL=S.e.zkTL;S.draft.zkFX=S.e.zkFX;
  S.draft.comm=S.e.comm;S.draft.guidance=S.e.guidance;S.draft.fx=0;S.draft.policies=[];
  $('#startScreen').style.display='none';$('#game').style.display='flex';
  if(!layReady){layInit();setLayReady(true);}
  renderAll();save();
  let seen=false;try{seen=!!localStorage.getItem(INTRO_KEY);}catch(e){}
  if(fresh&&!seen)setTimeout(()=>coach(0),380);
}
/* ── açılış: kabine kişiselleştirme — tamamen kozmetik, dengeyi etkilemez ── */
export const startCab={};
export function renderCabPick(){
  const el=$('#cabPick'); if(!el)return;
  el.innerHTML=`<div class="ctl-l" style="margin-bottom:5px">Kabineni tanı<span class="hint"
      style="text-transform:none;font-weight:400;letter-spacing:0"> — isim ve avatar kozmetiktir, oyunu etkilemez</span></div>`
    +ADVISORS.map(a=>{const c=startCab[a.id]||{};
      const px=(c.av!=null&&AVATARS[c.av])?AVATARS[c.av]:a.px;
      const nm=(c.name!=null?c.name:a.name).replace(/"/g,'&quot;');
      return `<div class="cp">
        <button type="button" class="cp-f" data-av="${a.id}" title="Avatarı değiştir">${pixPortrait(px,'good')}</button>
        <span class="cp-r">${a.role}</span>
        <input class="cp-n" data-nm="${a.id}" value="${nm}" maxlength="24" aria-label="${a.role} ismi">
      </div>`;}).join('');
}
if($('#cabPick')){
  $('#cabPick').addEventListener('click',ev=>{
    const b=ev.target.closest('[data-av]'); if(!b)return;
    const c=startCab[b.dataset.av]||(startCab[b.dataset.av]={});
    c.av=((c.av==null?-1:c.av)+1)%AVATARS.length;
    renderCabPick();});
  $('#cabPick').addEventListener('input',ev=>{
    const i=ev.target.closest('[data-nm]'); if(!i)return;
    (startCab[i.dataset.nm]||(startCab[i.dataset.nm]={})).name=i.value;});
  renderCabPick();
}
renderChangelog();
$('#btnNew').onclick=()=>{
  const o={advisor:$('#optAdvisor').checked,simple:$('#optSimple').checked,events:$('#optEvents').checked};
  try{localStorage.removeItem(SAVE_KEY);}catch(e){}
  const st=freshState(o);
  ADVISORS.forEach(a=>{const c=startCab[a.id]; if(!c)return;
    const nm=(c.name||'').trim();
    const named=nm&&nm!==a.name;
    if(named||c.av!=null)st.cab[a.id]={name:named?nm:null,av:(c.av!=null?c.av:null),green:0,green0:0};});
  boot(st,true);};
export const sv0=load();
if(sv0&&sv0.v===8){
  const b=$('#btnContinue');b.style.display='block';
  b.textContent=`▶ DEVAM ET — ${MONTHS[sv0.month-1]} ${sv0.year} · OY ${pct(sv0.p.vote)}`;
  b.onclick=()=>boot(sv0,false);
  const n=$('#btnNew');n.className='sbtn alt';n.textContent='YENİ OYUN (kaydı siler)';
}
$('#btnMonth').onclick=()=>advance(1);
$('#btnQuarter').onclick=()=>advance(3-(S.t%3));

$('#btnArchive').onclick=showArchive;
// sokaktaki vatandaşa tıkla → konuşsun
$('#streetWrap').addEventListener('click',ev=>{
  const g=ev.target.closest('.ped');
  if(!g||g.getAttribute('opacity')==='0'){closeBub();return;}
  if(bubPed===g){closeBub();return;}           // aynı kişiye tekrar tıkla → kapat
  closeBub();
  setBubPed(g);
  g.style.animationPlayState='paused';          // konuşurken durur
  const im=g.querySelector('.pimg'); if(im)im.style.animationPlayState='paused';
  paintBub();
  setBubTO(setTimeout(closeBub,9000));
});
/* ═══ PANEL BOYUTLANDIRMA ═══
   Her panelin alt kenarında bir tutamak var: sürükle, boyutlansın.
   Kolonlar arasındaki dikey tutamaklar genişliği ayarlar. Çift tıklarsan
   o panel varsayılana döner; üstteki "⤢ DÜZEN" hepsini sıfırlar.
   Ölçüler tarayıcıda saklanır.                                        */
export const LAY_KEY='mrp_layout_v1';
export let LAY={col:{},pnl:{},fold:{}};
export const layRoot=document.documentElement;
export function layLoad(){try{const o=JSON.parse(localStorage.getItem(LAY_KEY));
  if(o&&typeof o==='object')LAY={col:o.col||{},pnl:o.pnl||{},fold:o.fold||{}};}catch(e){}}
export function laySave(){try{localStorage.setItem(LAY_KEY,JSON.stringify(LAY));}catch(e){}}
export function layApply(){
  if(LAY.col.l)layRoot.style.setProperty('--colL',LAY.col.l+'px');
  if(LAY.col.r)layRoot.style.setProperty('--colR',LAY.col.r+'px');
  document.querySelectorAll('[data-pnl]').forEach(el=>{
    const h=LAY.pnl[el.dataset.pnl];
    if(h){el.style.flex='none';el.style.height=h+'px';el.style.maxHeight='none';}});
}
export function layReset(el){
  if(el){el.setAttribute('style',el.dataset.style0||'');delete LAY.pnl[el.dataset.pnl];}
  else{document.querySelectorAll('[data-pnl]').forEach(x=>x.setAttribute('style',x.dataset.style0||''));
    document.querySelectorAll('.pnl.fold').forEach(x=>layFold(x,false));
    LAY={col:{},pnl:{},fold:{}};
    layRoot.style.removeProperty('--colL');layRoot.style.removeProperty('--colR');}
  laySave();
}
export function layDrag(grip,onMove){
  grip.addEventListener('pointerdown',ev=>{
    ev.preventDefault();grip.classList.add('on');document.body.classList.add('rsz');
    const x0=ev.clientX,y0=ev.clientY,start=onMove(null);
    const mv=e=>onMove({dx:e.clientX-x0,dy:e.clientY-y0,start});
    const up=()=>{document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);
      grip.classList.remove('on');document.body.classList.remove('rsz');laySave();};
    document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);});
}
export function layGrip(el){
  if(el.querySelector(':scope > .grip-v'))return;        // innerHTML sonrası yeniden eklenir
  if(el.dataset.style0===undefined)el.dataset.style0=el.getAttribute('style')||'';
  const g=document.createElement('div');
  g.className='grip-v';
  g.title='Sürükle: boyutlandır · çift tıkla: varsayılana dön';
  el.appendChild(g);
  layDrag(g,d=>{
    if(!d)return el.getBoundingClientRect().height;
    const h=clamp(d.start+d.dy,72,1400);
    el.style.flex='none';el.style.height=h+'px';el.style.maxHeight='none';
    LAY.pnl[el.dataset.pnl]=Math.round(h);});
  g.addEventListener('dblclick',()=>layReset(el));
}
export const layGrips=()=>{if(layReady)document.querySelectorAll('[data-pnl]').forEach(layGrip);};
/* ── paneli başlığa indir / geri aç ── */
export function layFold(el,on){
  el.classList.toggle('fold',!!on);
  const b=el.querySelector(':scope > .pnl-t > .pnl-c');
  if(b){b.textContent=on?'▸':'▾';b.title=on?'Geri aç':'Başlığa indir';}
  if(on)LAY.fold[el.dataset.fold]=1; else delete LAY.fold[el.dataset.fold];
  laySave();
}
export function layFoldBtn(el){
  const h=el.querySelector(':scope > .pnl-t');
  if(!h||h.querySelector('.pnl-c'))return;
  const b=document.createElement('button');
  b.type='button'; b.className='pnl-c'; b.textContent='▾'; b.title='Başlığa indir';
  b.addEventListener('click',ev=>{ev.stopPropagation();layFold(el,!el.classList.contains('fold'));});
  h.insertBefore(b,h.firstChild);
}
export function layInit(){
  layLoad();
  document.querySelectorAll('#game .pnl').forEach((el,i)=>{
    if(!el.dataset.fold)el.dataset.fold=el.dataset.pnl||('p'+i);
    layFoldBtn(el);
    if(LAY.fold[el.dataset.fold])layFold(el,true);});
  document.querySelectorAll('[data-pnl]').forEach(layGrip);
  const main=document.querySelector('.main');
  [['gl','l',1],['gr','r',-1]].forEach(([cls,key,sign])=>{
    const vr=(key==='l')?'--colL':'--colR';
    const g=document.createElement('div');
    g.className='grip-h '+cls;
    g.title='Sürükle: kolon genişliği · çift tıkla: varsayılana dön';
    main.appendChild(g);
    layDrag(g,d=>{
      if(!d)return parseFloat(getComputedStyle(layRoot).getPropertyValue(vr))||0;
      const w=clamp(d.start+sign*d.dx,240,760);
      layRoot.style.setProperty(vr,w+'px');
      LAY.col[key]=Math.round(w);});
    g.addEventListener('dblclick',()=>{delete LAY.col[key];layRoot.style.removeProperty(vr);laySave();});});
  layApply();
}
$('#btnLayout').onclick=()=>layReset(null);
$('#btnHelp').onclick=()=>coach(0);
$('#btnVault').onclick=showVault;
$('#protBtn').onclick=protestModal;
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!blocking){closeModal();closeBub();}
  if(e.key===' '&&!blocking&&S&&e.target===document.body){e.preventDefault();advance(1);}});


/* ── geliştirme/test kancası ──
   import.meta.env.DEV yalnızca dev sunucusunda true; üretim derlemesinde
   bu blok tamamen elenir, yani canlıda içeriye açılan bir kapı kalmaz. */
if (import.meta.env && import.meta.env.DEV) {
  window.__T = {
    get S(){ return S; }, setS, setRNG, freshState,
    stepMonth, commitDraft, budgetBook, finCeil, newPkgCap, megaGuarantee,
    wageAsk, wageOffer, applyWageRound, startProtest, resolveProtest, protestModal,
    openComposer, openMega, doSpeech, renderAll, renderStreet, renderSociety,
    seasonOf, basket, POLICIES, POL, MEGA, MEG, SCH, schCost, schMin, netWorth, clamp,
    rollShock, SHOCKS, PRESS, addPledge, checkPledges, PLEDGE, countryStatus, draftBreaches,
  };
}
