import {$, K, MSHORT, S, TERM_M, arrows, clamp, nf, pct, signed} from '../core/state.js';
import {ADVISORS, AVATARS, FXN, NAMEPOOL, SACK, advLine, advName, advPx, cabOf, pickFree} from '../data/cast.js';
import {budgetBook, finCeil} from '../data/mega.js';
import {POL} from '../data/policies.js';
import {applyFx, save} from '../sim/commit.js';
import {commName, guidName} from '../sim/economy.js';
import {SALARY0, mediaDamp, pubInflation} from '../sim/vault.js';
import {closeModal, modal} from './modal.js';
import {renderAll, renderBasket} from './speech.js';
import {pixPortrait} from './street.js';

/* ═══════════════ PANELLER ═══════════════ */
export function prevE(){
  if(S.prev)return S.prev.e;
  const h=S.hist.length>1?S.hist[S.hist.length-2]:null;
  if(!h)return S.e;
  return{...S.e,inflation:h.inflation,core:h.core,expect:h.expect,growth:h.growth,
    unemployment:h.unemployment,usdtry:h.usdtry,rate:h.rate,credibility:h.cred,
    realIncome:h.realIncome,gap:h.gap};}
export function bar(v,col){return `<div class="bar"><i style="width:${clamp(v,0,100)}%;background:${col}"></i></div>`;}
export const COL=(bad,warn)=>v=>v>bad?'var(--red)':v>warn?'#A9660B':'var(--green)';

export const shownVote=()=>clamp(S.p.vote+(S.me?S.me.fakePoll:0),0,100);
export function renderKPI(){
  const e=S.e,pv=prevE();
  const dI=e.inflation-pv.inflation,dU=e.usdtry-pv.usdtry;
  const infCol=e.inflation>35?'var(--red)':e.inflation>18?'#A9660B':'var(--green)';
  const credCol=e.credibility<35?'var(--red)':e.credibility<55?'#A9660B':'var(--green)';
  const unrCol=S.p.unrest>65?'var(--red)':S.p.unrest>45?'#A9660B':'var(--green)';
  const sv=shownVote();
  const voteCol=sv<47?'var(--red)':sv<51?'#A9660B':'var(--green)';
  $('#kpis').innerHTML=`
   <div class="kpi"><div class="kpi-l">Manşet enflasyon</div>
     <div class="kpi-v" style="color:${infCol}">${pct(e.inflation)}
       <i class="${dI<0?'grn':dI>0?'red':'mut'}">${dI<0?'▼':dI>0?'▲':'—'}${nf(Math.abs(dI),1)}</i></div>
     <div class="kpi-s">Hedef %5 · beklenti ${pct(e.expect)}</div>
     ${bar(100-clamp((e.inflation-5)/55*100,0,100),infCol)}</div>
   <div class="kpi"><div class="kpi-l">USD / ₺</div>
     <div class="kpi-v">${nf(e.usdtry,2)}
       <i class="${dU>0?'red':dU<0?'grn':'mut'}">${dU>0?'▲':dU<0?'▼':'—'}${nf(Math.abs(dU),2)}</i></div>
     <div class="kpi-s">Rezerv ${nf(e.reserves,0)} mlr $ · CDS ${nf(e.cds,0)} bp</div>
     ${bar(clamp(100-(e.reserves/200*100),0,100),e.reserves<45?'var(--red)':e.reserves<90?'#A9660B':'var(--green)')}</div>
   <div class="kpi"><div class="kpi-l">Politika güvenilirliği</div>
     <div class="kpi-v" style="color:${credCol}">${nf(e.credibility,0)}<i class="mut">/100</i></div>
     <div class="kpi-s">Piyasanın politikaya inancı</div>
     ${bar(e.credibility,credCol)}</div>
   <div class="kpi"><div class="kpi-l">Halk tepkisi</div>
     <div class="kpi-v" style="color:${unrCol}">${nf(S.p.unrest,0)}<i class="mut">/100</i></div>
     ${bar(S.p.unrest,unrCol)}
     <div class="kpi-s" style="margin-top:3px">Oy <b class="m" style="color:${voteCol}">${pct(sv)}</b> · seçime ${(S.termEnd||TERM_M)-S.t} ay</div>
     ${bar(sv,voteCol).replace('class="bar"','class="bar mini"')}</div>`;
}
export function renderStats(){
  const e=S.e,pv=prevE(),pb=S.pub;
  const row=(k,v,d,inv,col)=>{
    const dc=d==null?'':(Math.abs(d)<.005?'mut':((inv?d<0:d>0)?'grn':'red'));
    return `<div class="st"><span>${k}</span><b class="${col||''}">${v}${
      d==null?'':` <span class="${dc}" style="font-size:10px">${Math.abs(d)<.005?'—':(d>0?'▲':'▼')}</span>`}</b></div>`;};
  const colA=
    `<div class="sub-h">Resmî veriler <span>${pb.label}</span></div>`
    +row('Manşet enflasyon',pct(pubInflation()),e.inflation-pv.inflation,true,'red')
    +row('Çekirdek enflasyon',pct(e.core),e.core-pv.core,true,'red')
    +row('GSYH büyümesi',pct(pb.growth),null,false,pb.growth<1?'red':'grn')
    +row('Çıktı açığı',signed(e.gap)+' p',e.gap-pv.gap,false,Math.abs(e.gap)>3?'red':'')
    +row('İşsizlik',pct(pb.unemployment),null,true)
    +row('Cari denge',pct(pb.current),null,false,pb.current<-4?'red':'')
    +row('Bütçe dengesi',pct(e.budget),e.budget-pv.budget,false,e.budget<-6?'red':'')
    +row('Kamu borcu / GSYH',pct(e.debt),e.debt-pv.debt,true,e.debt>55?'red':'')
    +`<div class="sub-h">Üretim kapasitesi</div>`
    +row('Potansiyel büyüme',pct(e.potGrowth),null,false,e.potGrowth>K.potBase+.3?'grn':'')
    +row('Yapısal işsizlik',pct(e.nairu),null,true,e.nairu<K.nairuBase-.3?'grn':'')
    +row('Hane alım gücü',nf(e.realIncome,0),e.realIncome-pv.realIncome,false,e.realIncome<90?'red':'')
    +`<div class="sub-h">Taban gelirler <span>yılbaşında belirlenir</span></div>`
    +row('Asgari ücret',nf(e.minWage,0)+' ₺',null,false,'')
    +row('  → dolar karşılığı','$'+nf(e.minWage/e.usdtry,0),null,false,
         (e.minWage/e.usdtry)<400?'red':'')
    +row('En düşük emekli aylığı',nf(e.pension,0)+' ₺',null,false,'')
    +row('Başkanlık maaşı',nf((S.me&&S.me.salary)||SALARY0,0)+' ₺',null,false,
         ((S.me&&S.me.salary)||SALARY0)/e.minWage>6?'red':'')
    +row('  → dolar karşılığı','$'+nf(e.pension/e.usdtry,0),null,false,
         (e.pension/e.usdtry)<280?'red':'');
  const B=budgetBook(0), cl=finCeil();
  const colB=
    `<div class="sub-h">Merkezî yönetim bütçesi <span>${S.year} · trilyon ₺/yıl</span></div>`
    +row('Bütçe geliri',nf(B.gelir,2),null,false,'')
    +row('Faiz gideri','−'+nf(B.faiz,2),null,false,B.faiz/B.gelir>0.22?'red':'')
    +row('Zorunlu giderler','−'+nf(B.zorunlu,2),null,false,'')
    +row('  → emekli aylıkları','−'+nf(B.emekli,2),null,false,'')
    +row('Program ödeneğin','−'+nf(B.program,2),null,false,B.program>0?'org':'')
    +row('YİD garanti ödemeleri','−'+nf(B.garanti,2),null,false,B.garanti>0.6?'red':B.garanti>0?'org':'')
    +row('BÜTÇE DENGESİ',nf(B.denge,2)+'  ('+pct(B.pct)+')',null,false,B.pct<-6?'red':B.pct<0?'':'grn')
    +row('Finansman tavanı',pct(cl)+' GSYH',null,false,(-B.pct)>cl?'red':'grn')
    +row('Kalan bütçe alanı',nf(Math.max(0,(cl+B.pct)/100*B.gdp),2),null,false,
         (cl+B.pct)<=0?'red':'grn')
    +`<div class="sub-h">Piyasalar <span>aylık</span></div>`
    +row('USD / ₺',nf(e.usdtry,2),e.usdtry-pv.usdtry,true)
    +row('CDS primi',nf(e.cds,0)+' bp',e.cds-pv.cds,true,e.cds>400?'red':'')
    +row('Rezervler',nf(e.reserves,0)+' mlr $',e.reserves-pv.reserves,false)
    +row('Politika faizi',pct(e.rate),e.rate-pv.rate,false,'org')
    +row('Reel faiz',pct(e.rate-e.expect),null,false,(e.rate-e.expect)<0?'red':'grn')
    +row('Beklenen enflasyon',pct(e.expect),e.expect-pv.expect,true)
    +row('Kredi büyümesi',pct(e.credit),null,false,(e.credit<10||e.credit>45)?'red':'')
    +row('Dolarizasyon',pct(e.dollarization,0),null,true,e.dollarization>55?'red':'')
    +`<div class="sub-h">Merkez Bankası araçları</div>`
    +row('APİ fonlaması',nf(e.api,0)+' mlr',null,false,'')
    +row('Ort. fonlama maliyeti',pct(e.fundRate),null,false,(e.rate-e.fundRate)>1.5?'red':'')
    +row('TL / YP zorunlu karşılık',pct(e.zkTL,0)+' / '+pct(e.zkFX,0),null,false,'');
  $('#stats').innerHTML=`<div class="stats2"><div>${colA}</div><div>${colB}</div></div>`
    +(S.active.length?`<div class="sub-h">Yürürlükteki program <span>ayda ${nf(S.active.reduce((a,x)=>a+x.amt,0),0)} mlr ₺</span></div>`
      +`<div class="stats2"><div>`+S.active.filter((_,i)=>i%2===0).map(a=>
        `<div class="st"><span>${POL(a.id).ico} ${a.name}</span><b class="mut">${a.dur-a.age} ay</b></div>`).join('')
      +`</div><div>`+S.active.filter((_,i)=>i%2===1).map(a=>
        `<div class="st"><span>${POL(a.id).ico} ${a.name}</span><b class="mut">${a.dur-a.age} ay</b></div>`).join('')
      +`</div></div>`
      :`<div class="sub-h">Yürürlükteki program</div><div class="st"><span class="mut">Aktif paket yok</span><b></b></div>`);
}
export function renderAdvisors(){
  $('#advList').innerHTML=ADVISORS.map(a=>{const m=a.mood(S),c=cabOf(a.id);
    const tag=c.green>0?`<span class="adv-new">yeni · ${c.green} ay uyum</span>`
             :c.mark>0?`<span class="adv-mark">hedefte · ${c.mark} ay</span>`:'';
    return `<div class="adv"><div class="adv-f ${m}">${pixPortrait(advPx(a),m)}</div>
      <div style="min-width:0"><div class="adv-hd"><span class="adv-n">${advName(a)}</span>
      <span class="adv-r">${a.role}</span>${tag}</div>
      <div class="adv-q">"${advLine(a)}"</div></div>
      <span class="adv-acts">
        <button class="adv-t" data-mark="${a.id}" title="İsim vermeden hedef göster"
          aria-label="${a.role} için hedef göster">🎯</button>
        <button class="adv-x" data-fire="${a.id}" title="Görevinden affını iste"
          aria-label="${a.role} görevinden affını iste">📜</button>
      </span></div>`;}).join('');
  $('#advList').onclick=ev=>{
    const f=ev.target.closest('[data-fire]'); if(f){askSack(f.dataset.fire);return;}
    const mk=ev.target.closest('[data-mark]'); if(mk)askTarget(mk.dataset.mark);};
}
/* ── isim vermeden hedef gösterme ──
   Faturayı bürokrasiye kesersin: gündem değişir, taban toplanır, şüphe dağılır.
   Bedeli kurumsaldır — hedefteki bakan savunmaya çekilir, güvenilirlik her ay erir.
   Zemin hazırlar: hedef gösterilmiş bir bakanın affını istemek %35 daha ucuzdur.        */
export const TARGET={
 cb:{q:'"Bazı bürokratlar, faiz masasında bu milletin iradesine ayak diremektedir."',
     fx:{expect:.6,cds:12,usdtry:.8,credibility:-3}},
 fin:{q:'"Bütçeyi masa başında yazan kadrolar, milletin önceliklerini görmüyor."',
     fx:{cds:8,credibility:-1.5,segCapital:-1}},
 eco:{q:'"Yatırımın önünü tıkayan bir bürokratik zihniyet var; kim olduğunu millet biliyor."',
     fx:{segCapital:-2,credibility:-1}},
 lab:{q:'"Çalışanın hakkını masada savunmayan kadrolar bu işi yürütemez."',
     fx:{segMinwage:-1.5,segSme:.8,credibility:-1}},
 pr:{q:'"İletişim kanadımız milletin sesini yeterince duymuyor; bu böyle gitmez."',
     fx:{vote:-.3,credibility:-.5}}
};
export const TBASE={vote:.7,unrest:-4,suspicion:-6,credibility:-2,integrity:-2};
export const MARKED={
 cb:'Kamuoyunda hedef gösterildim. Kurulun kararını savunacak zeminim kalmadı, kısa konuşacağım.',
 fin:'Bakanlığım hedef gösterildikten sonra kimse bize rakam vermiyor. Tahminlerim eksik kalır.',
 eco:'Hedef gösterildik; yatırımcı artık benimle değil, doğrudan sizinle konuşmak istiyor.',
 lab:'Hedef gösterildikten sonra masada muhatap alınmıyorum. Süreci siz yürütmelisiniz.',
 pr:'Hedefte olduğumu ben de öğrendim. Bu haldeyken saha verisini savunamam.'};
export function targetFx(id){
  const T=TARGET[id],c=cabOf(id),n=(c.marks||0);
  const fat=1/(1+0.5*n), amp=1+mediaDamp()*0.5, fx={};
  Object.entries({...TBASE,...{}}).forEach(([k,v])=>{fx[k]=+(v*fat*amp).toFixed(2);});
  Object.entries(T.fx).forEach(([k,v])=>{fx[k]=+(((fx[k]||0)+v)).toFixed(2);});
  if(n>=2){fx.unrest=+((fx.unrest||0)+1.5*(n-1)).toFixed(2);
           fx.integrity=+((fx.integrity||0)-1.5*(n-1)).toFixed(2);}
  Object.keys(fx).forEach(k=>{if(Math.abs(fx[k])<.01)delete fx[k];});
  return fx;
}
export function askTarget(id){
  const a=ADVISORS.find(x=>x.id===id),T=TARGET[id],fx=targetFx(id),c=cabOf(id),n=(c.marks||0);
  const goodUp=k=>!['cds','usdtry','expect','unrest','suspicion'].includes(k);
  const L={...FXN,unrest:'Toplumsal tepki',suspicion:'Üstündeki şüphe'};
  const rows=Object.entries(fx).map(([k,v])=>{
    const good=goodUp(k)?v>0:v<0;
    return `<div><span>${L[k]||k}</span><b class="${good?'grn':'red'}">${signed(v,k==='cds'?0:1)}</b></div>`;}).join('');
  const d=modal(`<div class="dlg-t"><span class="ic">🎯</span>
      <div><div class="dlg-k">${a.role} · isim verilmeden</div><h3>Hedef gösterilsin mi?</h3></div></div>
    <div class="dlg-b">
      <p class="dlg-l" style="font-size:14px;font-style:italic">${T.q}</p>
      <div class="ctl-l" style="margin:13px 0 4px">Anında etki${n?` · ${n+1}. kez — aynı kadroyu tekrar hedef göstermek yıpratıyor`:''}</div>
      <div class="comp-fx">${rows}</div>
      <div class="note">İsim vermezsin ama herkes kimi kastettiğini anlar. ${advName(a)} <b>4 ay</b> hedefte kalır:
        bu sürede savunmaya çekilir, güvenilirlik her ay biraz daha erir — buna karşılık
        <b>affını istemenin bedeli %35 azalır</b>. Zemini hazırlamak, faturayı ucuzlatır.</div>
    </div>
    <div class="dlg-f">
      <button class="sbtn alt" style="width:auto;padding:9px 20px;margin:0" id="tgNo">VAZGEÇ</button>
      <button class="sbtn" style="width:auto;padding:9px 20px;margin:0" id="tgYes">HEDEF GÖSTER</button>
    </div>`);
  d.onclick=ev=>{
    if(ev.target.id==='tgNo'){closeModal();return;}
    if(ev.target.id==='tgYes'){closeModal();doTarget(id);}};
}
export function doTarget(id){
  const a=ADVISORS.find(x=>x.id===id),T=TARGET[id],fx=targetFx(id);
  applyFx(fx);
  if(!S.cab)S.cab={};
  const c=S.cab[id]||(S.cab[id]={});
  c.mark=4; c.marks=(c.marks||0)+1;
  S.news.unshift(`Başkan: ${T.q.replace(/"/g,'')}`);
  S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'event',title:'Başkan hedef gösterdi',
    body:`${a.role} isim verilmeden hedef gösterildi. Oy ${signed(fx.vote||0,1)} · şüphe ${signed(fx.suspicion||0,1)} · güvenilirlik ${signed(fx.credibility||0,1)}.`});
  renderAll();save();
}
/* ── görevden alma: önce bedelini göster, sonra uygula ── */
export function sackFx(id){
  const D=SACK[id],c=cabOf(id);
  // zemin hazırlanmışsa (hedef gösterilmiş) fatura hafifler; her af bir sonrakini pahalılaştırır
  const mult=(1+0.5*(S.cabFires||0))*(c.mark>0?0.65:1),fx={};
  Object.entries(D.fx).forEach(([k,v])=>{fx[k]=(k==='vote')?v:+(v*mult).toFixed(3);});
  return fx;
}
export function askSack(id){
  const a=ADVISORS.find(x=>x.id===id),D=SACK[id],fx=sackFx(id);
  const goodUp=k=>!['cds','usdtry','expect'].includes(k);
  const rows=Object.entries(fx).map(([k,v])=>{
    const good=goodUp(k)?v>0:v<0;
    return `<div><span>${FXN[k]||k}</span><b class="${Math.abs(v)<.01?'mut':good?'grn':'red'}">${
      signed(v,k==='cds'?0:1)}</b></div>`;}).join('');
  const d=modal(`<div class="dlg-t"><span class="ic">⛔</span>
      <div><div class="dlg-k">Kabine değişikliği</div><h3>${advName(a)} görevinden affını istesin mi?</h3></div></div>
    <div class="dlg-b">
      <p class="dlg-l" style="font-size:13px">${D.lede}</p>
      <div class="ctl-l" style="margin:13px 0 4px">Anında etki${(S.cabFires||0)?` · ${(S.cabFires||0)+1}. af, bedel %${(S.cabFires||0)*50} daha ağır`:''}${cabOf(id).mark>0?' · hedef gösterildiği için %35 hafif':''}</div>
      <div class="comp-fx">${rows}</div>
      <div class="note">Yerine gelen isim <b>${D.months} ay</b> uyum döneminde kalır: bu sürede
        güvenilirlik her ay biraz daha erir ve kurul ilk iki ay net konuşamaz.</div>
    </div>
    <div class="dlg-f">
      <button class="sbtn alt" style="width:auto;padding:9px 20px;margin:0" id="skNo">VAZGEÇ</button>
      <button class="sbtn" style="width:auto;padding:9px 20px;margin:0;background:var(--red);border-color:#6E1E18;box-shadow:4px 4px 0 #6E1E18" id="skYes">AFFINI İSTE</button>
    </div>`);
  d.onclick=ev=>{
    if(ev.target.id==='skNo'){closeModal();return;}
    if(ev.target.id==='skYes'){closeModal();sackAdvisor(id);}};
}
export function sackAdvisor(id){
  const a=ADVISORS.find(x=>x.id===id),D=SACK[id],fx=sackFx(id);
  const old=advName(a),wasMarked=cabOf(id).mark>0;
  applyFx(fx);
  const name=pickFree(NAMEPOOL,ADVISORS.map(x=>advName(x)));
  const av=pickFree(AVATARS.map((_,i)=>i),ADVISORS.map(x=>cabOf(x.id).av).filter(v=>v!=null));
  if(!S.cab)S.cab={};
  S.cab[id]={name,av,green:D.months,green0:D.months};
  S.cabFires=(S.cabFires||0)+1;
  S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'decision',title:'Kabine değişikliği',
    body:`${a.role}: ${old} görevinden affını istedi${wasMarked?' (kamuoyunda hedef gösterildikten sonra)':''}, yerine ${name} atandı. `
        +`Güvenilirlik ${signed(fx.credibility||0,1)} · oy ${signed(fx.vote||0,1)} puan.`});
  renderAll();save();
}
export function pendingRate(){
  // faiz kararının kredi kanalına yansımamış kısmı
  const tgt=28-((S.e.rate-S.e.expect)-K.neutralReal)*K.creditSens;
  return clamp(Math.abs(tgt-S.e.credit)/Math.max(4,Math.abs(tgt-28)+4),0,1);
}
export function taylor(){const e=S.e;  // Taylor ilkesi: enflasyon hedefin üstündeyse reel faiz artmalı
  return clamp(Math.round((e.expect+K.neutralReal+0.75*(e.inflation-5)+0.5*e.gap)*4)/4,0,70);}

export function renderMonetary(){
  const auto=S.opts.advisor,d=S.draft;
  $('#mpHint').textContent=auto?'DANIŞMAN MODU':'ay ilerleyince yürürlüğe girer';
  const rr=d.rate-S.e.expect,delta=d.rate-S.e.rate;
  const rrCol=rr<0?'var(--red)':rr<2?'#A9660B':'var(--green)';
  const fund=d.rate-clamp(d.api/420,-2,6);
  const gapWarn=(d.rate-fund)>1.5?'· duruş tutarsız: faiz yüksek, likidite bol':'';
  const simple=S.opts.simple;
  // ── her aracın ve kombinasyonun 12 aylık tahmini etkisi ──
  const dRate=d.rate-S.e.rate, dApi=d.api-S.e.api, dZkTL=d.zkTL-S.e.zkTL, dZkFX=d.zkFX-S.e.zkFX;
  const cW=c=>c==='hawkish'?-1:c==='dovish'?1:0, gW=g=>g==='tight'?-1:g==='loose'?1:0;
  const dComm=cW(d.comm)-cW(S.e.comm), dGuid=gW(d.guidance)-gW(S.e.guidance), dFxI=d.fx||0;
  const IMP=[];
  const imp=(lab,on,v)=>{if(on)IMP.push([lab,v]);};
  imp(`Politika faizi ${signed(dRate,2)} p`,Math.abs(dRate)>=.05,
    {inf:-dRate*.075, cr:-dRate*K.creditSens/10, fx:-dRate*.10, un:dRate*.045});
  imp(`APİ fonlaması ${signed(dApi,0)} mlr ₺`,Math.abs(dApi)>=1,
    {inf:dApi/260*.145, cr:dApi/260*2.4, fx:dApi/260*.35, un:-dApi/260*.25});
  imp(`TL zorunlu karşılık ${signed(dZkTL,0)} p`,Math.abs(dZkTL)>=.5,
    {inf:-dZkTL*.05, cr:-dZkTL*.85, fx:-dZkTL*.04, un:dZkTL*.05});
  imp(`YP zorunlu karşılık ${signed(dZkFX,0)} p`,Math.abs(dZkFX)>=.5,
    {inf:-dZkFX*.044, cr:0, fx:-dZkFX*.156, un:0});
  imp(`İletişim: ${commName(d.comm)}`,dComm!==0,
    {inf:dComm*.30, cr:dComm*.15, fx:dComm*.42, un:-dComm*.05});
  imp(`Yönlendirme: ${guidName(d.guidance)}`,dGuid!==0,
    {inf:dGuid*.18, cr:dGuid*.20, fx:dGuid*.25, un:-dGuid*.04});
  imp(`Döviz ${dFxI>0?'satışı':'alımı'} ${Math.abs(dFxI)} mlr $`,!!dFxI,
    {inf:-dFxI*.11, cr:0, fx:-dFxI*.40, un:0});
  const TOT=IMP.reduce((a,[,v])=>({inf:a.inf+v.inf,cr:a.cr+v.cr,fx:a.fx+v.fx,un:a.un+v.un}),
    {inf:0,cr:0,fx:0,un:0});
  const cell=(v,kind)=>{
    if(Math.abs(v)<.02)return '<b class="mut">—</b>';
    const good=kind==='cr'?null:v<0;                 // kredide "iyi/kötü" yok, yön var
    const cls=good===null?'':good?'grn':'red';
    return `<b class="m ${cls}">${simple?arrows(v*2.4):signed(v,2)}</b>`;};
  const impRow=(lab,v,extra)=>`<span class="mpfx-l ${extra||''}">${lab}</span>${cell(v.inf)}${
    cell(v.cr,'cr')}${cell(v.fx)}${cell(v.un)}`;
  const fxTable=`<div class="mpfx">
      <span class="mpfx-h">Ayarladığın araç</span><span class="mpfx-h">Enflasyon</span>
      <span class="mpfx-h">Kredi</span><span class="mpfx-h">Kur</span><span class="mpfx-h">İşsizlik</span>
      ${IMP.length?IMP.map(([lab,v])=>impRow(lab,v)).join('')
        :'<span class="mpfx-l mut" style="grid-column:1/-1">Henüz ayar yapmadın — araçlardan birini değiştir, etkisi burada çıksın.</span>'}
      ${IMP.length>1?impRow('<b>KOMBİNE ETKİ</b>',TOT,'tot'):''}
    </div>`;
  const steps=[-500,-250,-100,100,250,500];
  const warn=(S.e.guidance==='tight'&&delta<-0.1)?'⚠ "Sıkı duruş" sözünü çiğniyorsun — güvenilirlik çöker'
           :(S.e.guidance==='loose'&&delta>0.1)?'⚠ "Gevşeme" sinyalinin tersine gidiyorsun':'';
  const body=auto
   ?`<div class="row" style="justify-content:space-between;gap:10px">
       <div><div class="ctl-l">Merkez Bankası'nın kararı</div><div class="bignum org">${pct(d.rate)}</div></div>
       <div class="hint" style="max-width:58%">${ADVISORS[0].line(S)}</div></div>`
   :`<div class="row" style="justify-content:space-between;margin-bottom:5px">
       <span class="ctl-l">Politika faizi</span>
       <span class="bignum org">${pct(d.rate)}</span></div>
     <div class="row">
       <button class="sq" data-step="-0.25">−</button>
       <input type="range" id="rng" min="0" max="70" step="0.25" value="${d.rate}">
       <button class="sq" data-step="0.25">+</button></div>
     <div class="row" style="gap:4px;margin-top:5px;flex-wrap:wrap">
       <span class="ctl-l">Hızlı adım</span>
       ${steps.map(s=>`<button class="pbtn sm num" data-bp="${s}"
          title="${s>0?'+':'−'}${Math.abs(s)} baz puan = ${nf(Math.abs(s)/100,2)} puan">${s>0?'+':'−'}${Math.abs(s)} bp</button>`).join('')}
       <button class="pbtn sm" data-bp="0">SABİT</button>
       <span class="hint" style="margin-left:auto">şu an ${pct(S.e.rate)}${delta?` · ${signed(delta,2)} puan`:''}</span></div>
     <div class="row tools" style="gap:7px;margin-top:5px;flex-wrap:wrap">
       ${[['api','APİ fonlaması',d.api,250,-500,3000,'mlr ₺'],
          ['zkTL','TL zorunlu karşılık',d.zkTL,1,0,40,'%'],
          ['zkFX','YP zorunlu karşılık',d.zkFX,1,0,50,'%']].map(([k,lab,v,stp,mn,mx,un])=>`
         <div class="tool">
           <div class="ctl-l">${lab}</div>
           <div class="row" style="gap:4px">
             <button class="sq s2" data-tool="${k}" data-dv="${-stp}">−</button>
             <span class="toolv m">${un==='%'?pct(v,0):nf(v,0)+' '+un}</span>
             <button class="sq s2" data-tool="${k}" data-dv="${stp}">+</button>
             
           </div>
         </div>`).join('')}
     </div>
     <div class="row" style="gap:12px;margin-top:5px;align-items:flex-start;flex-wrap:wrap">
       <div><div class="ctl-l" style="margin-bottom:4px">İletişim duruşu</div>
         <div class="row" style="gap:5px" id="cBtns">${['hawkish','neutral','dovish'].map(c=>
           `<button class="pbtn ${d.comm===c?'on':''}" data-c="${c}">${commName(c)}</button>`).join('')}</div></div>
       <div><div class="ctl-l" style="margin-bottom:4px">İleri yönlendirme</div>
         <div class="row" style="gap:5px" id="gBtns">${['none','tight','loose'].map(g=>
           `<button class="pbtn ${d.guidance===g?'on':''}" data-g="${g}">${guidName(g)}</button>`).join('')}</div></div>
     </div>
     ${warn?`<div class="hint" style="color:var(--red);font-weight:600;margin-top:5px">${warn}</div>`:''}`;
  $('#mpBox').innerHTML=body+`
    <div class="row" style="gap:7px;margin-top:5px;padding-top:4px;border-top:2px solid var(--paper3);flex-wrap:wrap">
      <span class="ctl-l">Reel faiz</span>
      <span class="m" style="font-size:18px;font-weight:700;color:${rrCol}">${pct(rr)}</span>
      <span class="hint">${rr<0?'negatif — dolarizasyon körükleniyor':rr<2?'sınırda':'pozitif'}
        · kredi ${pct(S.e.credit,0)} · fonlama ${pct(fund,1)}${gapWarn?` <b class="red">${gapWarn}</b>`:''}</span>
    </div>`+fxTable;
  if(auto){d.rate=taylor();return;}
  const rng=$('#rng');
  rng.oninput=ev=>{d.rate=+ev.target.value;
    ev.target.closest('.pnl-b').querySelector('.bignum').textContent=pct(d.rate);};
  rng.onchange=()=>{renderMonetary();renderBasket();};
  $('#mpBox').onclick=ev=>{
    const st=ev.target.closest('[data-step]'),bp=ev.target.closest('[data-bp]');
    const c=ev.target.closest('[data-c]'),g=ev.target.closest('[data-g]');
    const tl=ev.target.closest('[data-tool]');
    if(tl){const k=tl.dataset.tool;
      const LIM={api:[-500,3000],zkTL:[0,40],zkFX:[0,50]};
      if(tl.dataset.set==='reset')d[k]=S.e[k];
      else d[k]=clamp(d[k]+parseFloat(tl.dataset.dv),LIM[k][0],LIM[k][1]);
      renderMonetary();renderBasket();return;}
    if(st)d.rate=clamp(Math.round((d.rate+parseFloat(st.dataset.step))*4)/4,0,70);
    else if(bp){const b=+bp.dataset.bp;d.rate=b===0?S.e.rate:clamp(S.e.rate+b/100,0,70);}
    else if(c)d.comm=c.dataset.c;
    else if(g)d.guidance=g.dataset.g;
    else return;
    renderMonetary();renderBasket();};
}
export function renderFx(){
  const d=S.draft;
  $('#fxHint').textContent=`rezerv ${nf(S.e.reserves,0)} mlr $`;
  const sel=Math.abs(d.fx),newRes=S.e.reserves-d.fx,newFx=S.e.usdtry*(1-d.fx*0.004);
  $('#fxBox').innerHTML=`
    <div class="row" style="gap:5px;flex-wrap:wrap">
      <span class="ctl-l">Tutar</span>
      ${[1,5,10].map(v=>`<button class="pbtn num ${sel===v?'on':''}" data-amt="${v}">${v} mlr $</button>`).join('')}
      <span style="width:8px"></span>
      <button class="pbtn ${d.fx>0?'on':''}" data-dir="1" ${sel?'':'disabled'}>DÖVİZ SAT</button>
      <button class="pbtn ${d.fx<0?'on':''}" data-dir="-1" ${sel?'':'disabled'}>DÖVİZ AL</button>
      <button class="pbtn sm" data-dir="0">GERİ AL</button>
    </div>
    <div class="hint" style="margin-top:4px">${d.fx
      ? `Rezerv <b class="m">${nf(S.e.reserves,0)} → ${nf(newRes,0)}</b> mlr $ · kur <b class="m">${nf(S.e.usdtry,2)} → ${nf(newFx,2)}</b>`
      : 'Satış kuru bastırır ama rezervi eritir; alım tersi.'}</div>`;
  $('#fxBox').onclick=ev=>{
    const a=ev.target.closest('[data-amt]'),dr=ev.target.closest('[data-dir]');
    if(a){const v=+a.dataset.amt;d.fx=d.fx===0?v:(d.fx>0?v:-v);}
    else if(dr){const sg=+dr.dataset.dir;
      if(sg===0)d.fx=0;else{const mag=Math.abs(d.fx)||1;d.fx=sg*mag;}}
    else return;
    if(d.fx>S.e.reserves-10)d.fx=Math.max(0,Math.floor(S.e.reserves-10));
    renderFx();renderMonetary();renderBasket();};
}
