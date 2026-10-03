import {$, K, MSHORT, S, TERM_M, arrows, clamp, nf, pct, signed, supplyPts} from '../core/state.js';
import {MEGA, bookMonthly, budgetBook, finCeil, fyCap, fyCommitted, fyMonthsLeft, fyOpen, megaBlock, megaOf, monthlyProgram, newPkgCap, pkgTotal, trn} from '../data/mega.js';
import {POL, POLICIES, amtLabel, kOf, pDef, pMax, pMin, pRef, pStep, realErosion} from '../data/policies.js';
import {save} from '../sim/commit.js';
import {activePledges} from '../sim/pledges.js';
import {renderAll} from './speech.js';
import {araZamOk, canCallElection, openEarlyElection, openMega} from '../sim/wageround.js';
import {closeModal, floatD, modal} from './modal.js';
import {renderBasket} from './speech.js';
import {uiScale} from './scale.js';
import {logAct} from '../sim/acts.js';

/* ═══════════════ KARAR KARTLARI + PAKET TASARLAYICI ═══════════════ */

/* ── FARE TEKERİYLE YANA KAYDIRMA ──
   Kart şeridi yatay kayıyor ama fare tekeri dikey delta üretir; şerit de
   dikey kaymadığı için tekerlek hiçbir şey yapmıyordu. Dikey deltayı yatay
   kaydırmaya çeviriyoruz.

   İki sınır var: yatay kaydırma imkânı bittiğinde (şerit başına ya da
   sonuna dayandıysa) olayı YUTMUYORUZ — böylece dar ekranda sayfa normal
   şekilde kaymaya devam eder. Trackpad'in kendi yatay deltası (deltaX)
   varsa da karışmıyoruz, tarayıcı zaten doğru yapıyor. */
export function wheelToScrollX(el){
  if(!el||el.dataset.wheelx)return;
  el.dataset.wheelx='1';
  el.addEventListener('wheel',ev=>{
    if(ev.ctrlKey)return;                               // tarayıcı yakınlaştırması
    if(Math.abs(ev.deltaX)>Math.abs(ev.deltaY))return;  // zaten yatay kaydırıyor
    const max=el.scrollWidth-el.clientWidth;
    if(max<=1)return;                                   // kaydıracak yer yok
    // satır/sayfa birimli tekerleri piksele çevir
    const birim=ev.deltaMode===1?16:ev.deltaMode===2?el.clientWidth:1;
    const d=ev.deltaY*birim;
    const hedef=Math.max(0,Math.min(max,el.scrollLeft+d));
    if(hedef===el.scrollLeft)return;                    // uçtayız: olayı sayfaya bırak
    ev.preventDefault();
    el.scrollLeft=hedef;
  },{passive:false});
}

/* ── ORTA TUŞLA KAYDIRMA (autoscroll) ──
   Orta tuşa basınca imleç bir çapa bırakır; fareyi çapadan uzaklaştırdıkça
   şerit o yöne kayar, uzaklık hızı belirler. Tekrar tıklamak, Esc, tekerlek
   ya da pencereden çıkmak modu kapatır. Basılı tutup çekip bırakırsan da
   kapanır — Windows'un alışık olduğun davranışı.

   Tarayıcının kendi autoscroll'u yalnızca yatay kayan bir şeritte güvenilir
   çalışmıyor, bu yüzden mousedown'da varsayılanı iptal edip işi kendimiz
   yapıyoruz. Fare konumu gerçek ekran pikselinde geldiği için çapa işareti
   konumlandırılırken arayüz ölçeğine bölünür. */
export function midDragScroll(el){
  if(!el||el.dataset.middrag)return;
  el.dataset.middrag='1';
  let on=false,ax=0,ay=0,mx=0,raf=0,mark=null,moved=false,stopTs=0;

  const stop=()=>{
    if(!on)return;
    on=false;moved=false;stopTs=performance.now();
    cancelAnimationFrame(raf);raf=0;
    if(mark){mark.remove();mark=null;}
    document.body.classList.remove('midscroll');
    window.removeEventListener('mousemove',move,true);
    window.removeEventListener('mouseup',up,true);
    window.removeEventListener('mousedown',anyDown,true);
    window.removeEventListener('wheel',stop,true);
    window.removeEventListener('keydown',key,true);
    window.removeEventListener('blur',stop);
  };
  const key=ev=>{if(ev.key==='Escape')stop();};
  const anyDown=ev=>{ev.preventDefault();stop();};
  const up=ev=>{if(ev.button===1&&moved)stop();};   // basılı tutup çektiysen bırakınca biter
  const move=ev=>{mx=ev.clientX;if(Math.abs(mx-ax)>14)moved=true;};
  const tick=()=>{
    if(!on)return;
    const d=(mx-ax)/uiScale();            // CSS pikseli cinsinden çapaya uzaklık
    const olu=14;                         // ölü bant: çapanın etrafında şerit durur
    if(Math.abs(d)>olu){
      const h=Math.min(44,Math.pow((Math.abs(d)-olu)/9,1.35));
      el.scrollLeft+=(d>0?h:-h);
    }
    raf=requestAnimationFrame(tick);
  };

  el.addEventListener('mousedown',ev=>{
    if(ev.button!==1)return;
    ev.preventDefault();                  // tarayıcının kendi autoscroll'u açılmasın
    if(on||performance.now()-stopTs<80)return;   // aynı tıkla kapanıp tekrar açılmasın
    if(el.scrollWidth-el.clientWidth<=1)return;  // kaydıracak yer yok
    on=true;ax=mx=ev.clientX;ay=ev.clientY;
    const k=uiScale();
    mark=document.createElement('div');
    mark.className='midmark';
    mark.style.left=(ax/k)+'px';
    mark.style.top=(ay/k)+'px';
    document.body.appendChild(mark);
    document.body.classList.add('midscroll');
    window.addEventListener('mousemove',move,true);
    window.addEventListener('mouseup',up,true);
    window.addEventListener('wheel',stop,true);
    window.addEventListener('keydown',key,true);
    window.addEventListener('blur',stop);
    setTimeout(()=>window.addEventListener('mousedown',anyDown,true),0);
    raf=requestAnimationFrame(tick);
  });
  // orta tuşun varsayılan yapıştırma/autoscroll davranışı kapalı kalsın
  el.addEventListener('auxclick',ev=>{if(ev.button===1)ev.preventDefault();});
}

export function renderCards(){
  const simple=S.opts.simple;
  /* "Ara zam yapacağız" sözü verildiyse o kartı listenin başına al —
     tester kartı bulamadığı için sözünü tutamamıştı (geri bildirim 31). */
  const sozVar=activePledges().some(x=>x.t==='ara zam sözü');
  const liste=POLICIES.filter(P=>P.kind!=='wage'||araZamOk())
    .sort((a,b)=>(sozVar?((b.kind==='wage')-(a.kind==='wage')):0));
  $('#cards').innerHTML=liste.map(P=>{
    const picked=S.draft.policies.find(x=>x.id===P.id);
    const run=S.active.find(a=>a.id===P.id);
    const amt=picked?picked.amt:pDef(P), k=P.kind==='wage'?1:kOf(P,amt);
    const erime=run?realErosion(run):0;
    const sure=picked?picked.dur:P.defDur;
    const rows=P.kind==='wage'
      ? [['Alım gücü',+0.9],['Enflasyon',+0.09*amt],['Esnaf maliyeti',-0.5]]
      : [['Talep',(P.fx.demand||0)*k*12*K.fiscalMult],
         ['Potansiyel büyüme',supplyPts((P.fx.supply||0)*k,sure)],
         ['Enflasyon',((P.fx.infl||0)+(P.fx.rent||0))*k*12]];
    const fx=rows.map(([kk,v])=>{
      const good=/Enflasyon|Esnaf maliyeti/.test(kk)?v<0:v>0;
      return `<div><span>${kk}</span><b class="${Math.abs(v)<.04?'mut':good?'grn':'red'}">${
        simple?arrows(v):signed(v,1)}</b></div>`;}).join('');
    const soz=sozVar&&P.kind==='wage';
    return `<article class="pc ${picked?'on':''} ${soz?'vow':''}" title="${P.desc}">
      <div class="pc-h"><div class="pc-i">${P.ico}</div><h4 class="pc-n">${P.name}</h4></div>
      ${soz?'<div class="pc-vow">⚠ VERDİĞİN SÖZ — ara zam taahhüdünü bu kartla tutarsın</div>':''}
      ${run?`<div class="pc-run">▶ ${run.dur-run.age} ay kaldı · ${nf(run.amt,0)} ${P.unit||'mlr ₺/ay'}${
        erime>0.08?`<span class="pc-er" title="Ödenek sabit kaldı ama fiyatlar arttı: aynı parayla daha az iş yapılıyor. Bugünkü referans ödenek ${nf(pRef(P),0)} mlr ₺.">reel −${pct(erime*100,0)}</span>`:''}
        <button class="pc-cx" data-cx="${P.id}" title="Bu programı bedelini ödeyerek erken kapat">ERKEN KAPAT</button></div>`:''}
      <div class="pc-meta2">
        <span class="${picked?(P.kind==='save'||P.kind==='reg'?'grn':'red'):'mut'}">${
          P.kind==='wage'?`%${amt}`
          :P.kind==='reg'?(P.min===P.max?'bütçesiz düzenleme':`bütçesiz · sıkılık ${amt}/${P.max}`)
          :`${nf(amt,0)} mlr ₺/ay`}</span>
        <span class="mut">${P.kind==='wage'?P.cat:(picked?picked.dur:P.defDur)+' ay'}</span>
        ${picked?'':'<span class="mut" style="font-size:10px">önerilen</span>'}</div>
      ${/* Yönetim aylık maliyet üzerinden yürür; toplam bütçe de görünsün. */''}
      ${(P.kind==='wage'||P.kind==='reg')?'':`<div class="pc-tot">toplam bütçe
        <b>${nf(pkgTotal(amt,picked?picked.dur:P.defDur),2)} trl ₺</b></div>`}
      <div class="pc-fx">${fx}</div>
      <button class="pc-b ${picked?'on':''}" data-p="${P.id}" ${run?'disabled':''}>${
        run?`YÜRÜRLÜKTE · ${run.dur-run.age} AY KALDI`:picked?'✓ SEPETTE — DÜZENLE':'AYARLA VE EKLE'}</button>
    </article>`;}).join('')
  + MEGA.map(M=>{
      const m=megaOf(M.id);
      const kalan=m&&!m.built?M.build-m.age:0;
      const blk=megaBlock(M);
      return `<article class="pc mega ${m?'on':''}" title="${blk||M.d}">
        <div class="pc-h"><div class="pc-i">${M.ico}</div><h4 class="pc-n">${M.name}</h4></div>
        <div class="pc-run mega">${m?(m.built?'✔ işletmede · garanti ödeniyor':`🏗 inşaat · ${kalan} ay kaldı`)
                                    :`yap-işlet-devret · ${M.build} ay inşaat`}</div>
        <div class="pc-meta2">
          <span class="${m&&m.built?'red':'mut'}">garanti ${pct(M.gar*(S.e.usdtry/42.10))} GSYH/yıl</span>
          <span class="grn">peşin ödeme yok</span></div>
        ${blk?`<div class="pc-blk">⛔ ${blk}</div>`
             :`<div class="pc-fx">
          <div><span>Potansiyel büyüme <small>(açıldıktan 4 yıl sonra)</small></span>
            <b class="grn">${signed(supplyPts(M.after.supply||0,48),2)}</b></div>
          <div><span>İnşaatta istihdam</span><b class="grn">${signed((M.during.unemp||0)*12,2)}</b></div>
          <div><span>Bütçe (açılınca)</span><b class="red">${signed(-M.gar,2)}</b></div>
        </div>`}
        <button class="pc-b ${m?'on':''}" data-mega="${M.id}" ${m||blk?'disabled':''}>${
          m?(m.built?'İŞLETMEDE':'İNŞAAT SÜRÜYOR'):blk?'ŞU AN OLMAZ':'İHALEYİ AÇ'}</button>
      </article>`;}).join('')
  + (()=>{ const blk=canCallElection();
      return `<article class="pc erken ${S.earlyCall?'on':''}" title="${blk||'Sandığı öne çek'}">
        <div class="pc-h"><div class="pc-i">🗳️</div><h4 class="pc-n">Erken Seçim</h4></div>
        <div class="pc-run erken">${S.earlyCall?'✔ karar alındı · kampanya sürüyor'
          :`anayasal yetki · seçime ${(S.termEnd||TERM_M)-S.t} ay`}</div>
        <div class="pc-meta2"><span class="red">bütçe ve itibar bedeli ağır</span>
          <span class="mut">2 ay kampanya</span></div>
        ${blk?`<div class="pc-blk">⛔ ${blk}</div>`
             :`<div class="pc-fx">
          <div><span>Risk primi</span><b class="red">+140 bp</b></div>
          <div><span>Kur</span><b class="red">+%5</b></div>
          <div><span>Güvenilirlik</span><b class="red">−12</b></div>
        </div>`}
        <button class="pc-b" data-early="1" ${blk?'disabled':''}>${blk?'ŞU AN OLMAZ':'SANDIĞA GİT'}</button>
      </article>`;})();
  wheelToScrollX($('#cards'));          // tekerlek şeridi yana kaydırsın
  midDragScroll($('#cards'));           // orta tuş: çapa bırak, fareyle kaydır
  $('#cards').onclick=ev=>{
    const eb=ev.target.closest('[data-early]');
    if(eb){if(!eb.disabled)openEarlyElection();return;}
    const cx=ev.target.closest('[data-cx]');
    if(cx){askCancel(cx.dataset.cx);return;}
    const mg=ev.target.closest('[data-mega]');
    if(mg){if(!mg.disabled)openMega(mg.dataset.mega);return;}
    const b=ev.target.closest('[data-p]');if(!b||b.disabled)return;
    openComposer(b.dataset.p);};
}

/* ═══════════════ PROGRAMI ERKEN KAPATMA ═══════════════
   Yürürlükteki bir paketi süresi dolmadan durdurabilirsin. Bedava değil:
   fesih tazminatı bir aylık ödeneğin iki katıdır, yarım kalan iş
   güvenilirlik ve ilgili seçmen grubu üstünde iz bırakır, destek
   paketlerinde bastırılan fiyatlar aynı anda rafa yansır.
   Karşılığında yıllık ödeneğin geri kalanı serbest kalır.
   ══════════════════════════════════════════════════════ */
export function cancelCost(a){
  const P=POL(a.id);
  const kalan=Math.max(0,a.dur-a.age);
  const tazminat=(P.kind==='wage'||P.kind==='reg')?0:a.amt*2;          // mlr ₺, tek seferlik
  const serbest=(P.kind==='wage'||P.kind==='reg')?0
    :Math.max(0,a.amt)*Math.min(kalan,fyMonthsLeft())/1000;            // trilyon ₺
  const cred=-1.6-Math.min(3.2,kalan*0.06);
  const geriTep=(P.fx&&P.fx.rebound)?kOf(P,a.amt)*P.fx.rebound*12:0;
  return {kalan,tazminat,serbest,cred,geriTep,P};
}
export function askCancel(id){
  const liste=S.active.filter(a=>!id||a.id===id);
  if(!liste.length)return;
  if(liste.length>1){
    const d0=modal(`<div class="dlg-t"><span class="ic">🛑</span>
        <div><div class="dlg-k">Yürürlükteki programlar</div><h3>Hangisini erken kapatacaksın?</h3></div></div>
      <div class="dlg-b"><div id="cxl">${liste.map(a=>{const c=cancelCost(a);
        return `<button class="choice" data-cx2="${a.id}"><span class="choice-no">${c.P.ico}</span>
          <span><span class="choice-t">${c.P.name}</span>
          <span class="choice-m">${a.amt} ${c.P.unit||'mlr ₺/ay'} · ${c.kalan} ay kaldı ·
            fesih bedeli ${nf(c.tazminat,0)} mlr ₺ · ${S.year} ödeneğinden ${trn(c.serbest)} serbest kalır</span>
          </span></button>`;}).join('')}</div></div>
      <div class="dlg-f"><button class="sbtn alt" style="width:auto;padding:9px 20px;margin:0" id="cxNo">VAZGEÇ</button></div>`);
    d0.onclick=ev=>{
      if(ev.target.id==='cxNo'){closeModal();return;}
      const b=ev.target.closest('[data-cx2]'); if(b){closeModal();askCancel(b.dataset.cx2);}};
    return;
  }
  const a=liste[0], c=cancelCost(a), P=c.P;
  const d=modal(`<div class="dlg-t"><span class="ic">🛑</span>
      <div><div class="dlg-k">${P.cat} · erken fesih</div><h3>${P.name} kapatılsın mı?</h3></div></div>
    <div class="dlg-b">
      <p class="dlg-l" style="font-size:13px">Program ${a.age}. ayında ve <b>${c.kalan} ay</b> daha sürecekti.
        Sözleşmeleri bugün feshedersen yüklenicilere tazminat ödenir, yarım kalan iş siyasi olarak sahipsiz kalır.</p>
      <div class="comp-box"><div class="comp-sum">
        <span>Fesih tazminatı (tek seferlik)</span><b class="red">−${nf(c.tazminat,0)} mlr ₺</b>
        <span>${S.year} ödeneğinden serbest kalan</span><b class="grn">+${trn(c.serbest)}</b>
        <span>Aylık ödenek yükü biter</span><b class="grn">+${nf(a.amt,0)} mlr ₺/ay</b>
        <span>Politika güvenilirliği</span><b class="red">${signed(c.cred,1)}</b>
        ${c.geriTep?`<span>Bastırılan fiyatların geri tepmesi</span><b class="red">+${nf(c.geriTep,2)} puan enflasyon</b>`:''}
      </div></div>
      <div class="note">Erken kapatma, yıl içinde ödenek sıkıştığında gerçek bir seçenektir —
        ama her fesih "başladığını bitiremeyen hükümet" algısı bırakır.</div>
    </div>
    <div class="dlg-f">
      <button class="sbtn alt" style="width:auto;padding:9px 18px;margin:0" id="cxN">VAZGEÇ</button>
      <button class="sbtn" style="width:auto;padding:9px 22px;margin:0;background:var(--red);border-color:#6E1E18;box-shadow:4px 4px 0 #6E1E18" id="cxY">PROGRAMI KAPAT</button>
    </div>`);
  d.querySelector('#cxN').onclick=closeModal;
  d.querySelector('#cxY').onclick=()=>{
    S.active=S.active.filter(x=>x!==a);
    S.e.primary-=c.tazminat*12/1000/S.e.gdpNom*100;         // tek seferlik gider
    S.e.credibility=clamp(S.e.credibility+c.cred,3,97);
    if(c.geriTep)S.e.inflation=clamp(S.e.inflation+c.geriTep,0.4,400);
    Object.entries(P.seg||{}).forEach(([sg,v])=>{
      if(S.seg[sg]!=null)S.seg[sg]=clamp(S.seg[sg]-v*4,2,98);});
    if(S.fy)S.fy.used=Math.max(0,S.fy.used);
    logAct({ico:P.ico,k:'BÜTÇE',w:60,good:false,
      t:`${P.name} erken kapatıldı`,
      s:`${c.kalan} ay kala fesih · ${nf(c.tazminat,0)} mlr ₺ tazminat · ${trn(c.serbest)} serbest kaldı`,
      h:`${P.name.toLocaleUpperCase('tr')} YARIDA KALDI`,
      ps:`Program ${c.kalan} ay kala feshedildi. Hazine ${nf(c.tazminat,0)} milyar ₺ tazminat ödedi. `
        +`Muhalefet "başladığını bitiremeyen hükümet" diyor; yüklenici tarafında hukuki süreç konuşuluyor.`});
    S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'decision',title:P.name+' erken kapatıldı',
      body:`${c.kalan} ay kala fesih. ${nf(c.tazminat,0)} mlr ₺ tazminat ödendi; `
         +`${S.year} ödeneğinden ${trn(c.serbest)} serbest kaldı. Güvenilirlik ${signed(c.cred,1)}.`});
    closeModal();renderAll();save();};
}

/* paket tasarlayıcı modalı */
export function openComposer(id){
  const P=POL(id);
  // Yürürlükteki bir paket süresi bitmeden yeniden tasarlanamaz.
  if(S.active.some(a=>a.id===id))return;
  const ex=S.draft.policies.find(x=>x.id===id);
  const MIN=pMin(P), MAX=pMax(P), STEP=P.kind==='wage'?1:pStep(P);
  let amt=ex?ex.amt:pDef(P), dur=ex?ex.dur:P.defDur;
  const unit=P.unit||'mlr ₺/ay';
  const SN={retiree:'Emekli',minwage:'Asgari ücretli',sme:'Esnaf',capital:'Sanayici',youth:'Genç'};
  /* Sepetteki segment listesi ödeneğe göre DEĞİŞMEMELİ: kart hep aynı
     satırları göstersin ki + / − basınca kutunun boyu oynamasın. */
  const segKeys=P.kind==='wage'
    ? ['minwage','retiree','sme','capital']
    : Object.entries(P.seg||{}).filter(([,w])=>w).map(([sg])=>sg);

  const calc=()=>{
    const k=P.kind==='wage'?1:kOf(P,amt);
    const total=P.kind==='wage'?0:amt*dur;
    const gdpPct=P.kind==='wage'?0:(amt*12/1000)/S.e.gdpNom*100*(P.kind==='save'?-1:1);
    const rows=P.kind==='wage'
      ? [['Hane alım gücü',+amt*K.mwSpill*0.9],['Enflasyon (1 yıl)',+amt*0.09],
         ['Beklenti',+amt*0.03],['Esnaf memnuniyeti',-amt*0.34]]
      : [['Çıktı açığı (talep)',(P.fx.demand||0)*k*12],
         ['Potansiyel büyüme',supplyPts((P.fx.supply||0)*k,dur)],
         ['Enflasyon',((P.fx.infl||0)+(P.fx.rent||0))*k*12],
         ['İşsizlik',(P.fx.unemp||0)*k*12],
         ...(P.fx.nairu?[['Yapısal işsizlik',(P.fx.nairu)*k*10]]:[]),
         ...(P.fx.cred?[['Güvenilirlik',(P.fx.cred)*k*12]]:[]),
         ...(P.fx.dollar?[['Dolarizasyon',(P.fx.dollar)*k*12]]:[]),
         ...(P.fx.fx?[['Kur baskısı (yıllık)',(P.fx.fx)*k*144]]:[]),
         ...(P.fx.rebound?[['Bitince geri tepme',(P.fx.rebound)*k*12]]:[])];
    const segAll=P.kind==='wage'
      ? {minwage:amt*0.62,retiree:amt*0.12,sme:-amt*0.34,capital:-amt*0.28}
      : Object.fromEntries(Object.entries(P.seg||{}).map(([sg,v])=>[sg,v*k*dur*0.25]));
    return {total,gdpPct,newBudget:S.e.budget-gdpPct,rows,segAll};
  };

  const valHTML=()=>`${P.kind==='wage'?'%'+amt:nf(amt,0)}<small> ${P.kind==='wage'?'':unit}</small>`;
  const sumHTML=c=>P.kind==='reg'
    ? `<span>Bütçe maliyeti</span><b class="grn">yok</b>
       <span>Kira zam tavanı</span><b>yıllık TÜFE (${pct(S.e.inflation)})</b>
       <span>Süre</span><b>${dur} ay</b>`
    : P.kind==='wage'
    ? `<span>Ortalama ücrete geçiş</span><b>%${nf(amt*K.mwSpill,1)}</b>
       <span>Bir yıllık enflasyon etkisi</span><b class="red">+${nf(amt*0.09,2)} puan</b>`
    : `<span>Toplam maliyet</span><b class="${P.kind==='save'?'grn':'red'}">${P.kind==='save'?'+':'−'}${
         c.total>=1000?nf(c.total/1000,2)+' trilyon ₺':nf(c.total,0)+' mlr ₺'}</b>
       <span>Yıllık GSYH yükü</span><b class="${c.gdpPct>0?'red':'grn'}">${signed(c.gdpPct,2)} puan</b>
       <span>Bütçe dengesi</span><b class="${c.newBudget<-6?'red':''}">${pct(S.e.budget)} → ${pct(c.newBudget)}</b>`;
  const fxHTML=c=>c.rows.map(([kk,v])=>{
    const good=/Enflasyon|İşsizlik|geri tepme|Esnaf|Dolarizasyon|Kur baskısı/.test(kk)?v<0:v>0;
    return `<div><span>${kk}</span><b class="${Math.abs(v)<.03?'mut':good?'grn':'red'}">${
      S.opts.simple?arrows(v*1.6):signed(v,2)}</b></div>`;}).join('');
  const segHTML=c=>segKeys.map(sg=>{const v=c.segAll[sg]||0;
    return `<span>${SN[sg]} <b class="m ${Math.abs(v)<.15?'mut':v>0?'grn':'red'}">${signed(v,1)}</b></span>`;}).join('');

  const c0=calc();
  const d=modal(`<div class="dlg-t"><span class="ic">${P.ico}</span>
      <div><div class="dlg-k">${P.cat} · paket tasarımı</div><h3>${P.name}</h3></div></div>
    <div class="dlg-b">
      <p class="dlg-l" style="font-size:13px">${P.desc}</p>

      ${P.kind==='reg'?`
      <div class="note" style="margin:12px 0 4px"><b>Bütçeden para çıkmaz.</b> Bu bir düzenleme:
        kirada zam tavanı TÜFE olur. Kiracı rahatlar, ev sahibi ve müteahhit küser;
        sürdükçe konut arzı yavaşlar, sınır kalkınca birikmiş zam bir anda yansır.</div>
      <span class="comp-val org" style="display:none">${valHTML()}</span>`:`
      <div class="ctl-l" style="margin:14px 0 2px">${amtLabel(P)}</div>
      <div class="comp-row">
        <button class="sq" id="cDn">−</button>
        <input type="range" id="cAmt" min="${MIN}" max="${MAX}" step="${STEP}" value="${amt}">
        <button class="sq" id="cUp">+</button>
        <span class="comp-val org">${valHTML()}</span>
      </div>`}

      ${P.kind==='wage'?'':`
      <div class="ctl-l" style="margin-bottom:4px">Süre — ne kadar sürdürecek?</div>
      <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px">
        ${P.dur.map(x=>`<button class="pbtn num ${dur===x?'on':''}" data-d="${x}">${x} ay</button>`).join('')}
      </div>`}

      <div class="comp-box">
        <div class="comp-sum" id="cSum">${sumHTML(c0)}</div>
      </div>

      <div class="ctl-l" style="margin:11px 0 3px">Hazine defteri</div>
      <div class="comp-box"><div class="comp-sum" id="cFin"></div></div>
      <div class="note" id="cFinNote"></div>

      <div class="ctl-l" style="margin-bottom:3px">Tahmini etki</div>
      <div class="comp-fx">${fxHTML(c0)}</div>
      <div class="comp-seg">${segHTML(c0)}</div>
      ${(P.kind!=='wage'&&pRef(P)>P.ref*1.08)?`<div class="note" style="border-top:none;margin-top:4px">
        <b>Fiyatlar arttı:</b> bu programın referans ödeneği 2026'da ${nf(P.ref,0)} mlr ₺ idi,
        bugün <b>${nf(pRef(P),0)} mlr ₺</b>. Aynı işi yaptırmak ${pct((pRef(P)/P.ref-1)*100,0)} daha pahalı —
        enflasyon her kararın maliyetini büyütüyor.</div>`:''}
      <div class="note">Etkiler ödenekle azalan verimle ölçeklenir: iki katı para, iki katı sonuç vermez.
        ${P.kind==='wage'?'':'Verimlilik etkisi süre boyunca birikir — uzun süre, kalıcı kapasite demek.'}</div>
    </div>
    <div class="dlg-f">
      ${ex?`<button class="sbtn alt" style="width:auto;padding:9px 18px;margin:0" id="cRm">SEPETTEN ÇIKAR</button>`:''}
      <button class="sbtn alt" style="width:auto;padding:9px 18px;margin:0" id="cNo">VAZGEÇ</button>
      <button class="sbtn" style="width:auto;padding:9px 26px;margin:0" id="cOk">SEPETE EKLE</button>
    </div>`);

  const rng=d.querySelector('#cAmt');          // 'reg' politikalarda yok
  const okBtn=d.querySelector('#cOk');
  /* Modal bir kez kuruluyor; + / − ve süre yalnızca değişen alanları tazeliyor.
     Baştan kurulsaydı "pop" animasyonu her tıkta yeniden oynar, kutu zıplardı. */
  const sync=()=>{
    const c=calc();
    if(rng&&+rng.value!==amt)rng.value=amt;
    d.querySelector('.comp-val').innerHTML=valHTML();
    d.querySelector('#cSum').innerHTML=sumHTML(c);
    d.querySelector('.comp-fx').innerHTML=fxHTML(c);
    d.querySelector('.comp-seg').innerHTML=segHTML(c);
    d.querySelectorAll('[data-d]').forEach(b=>b.classList.toggle('on',+b.dataset.d===dur));

    /* ── Hazine ve kapasite kontrolü ──
       Bu paketi de eklersen açık finansman tavanını aşıyor mu?
       Ve bu ay kaç yeni paket başlatma hakkın kaldı? */
    const others=S.draft.policies.filter(x=>x.id!==id)
      .reduce((a,pl)=>{const O=POL(pl.id);
        return a+((O.kind==='wage'||O.kind==='reg')?0:pl.amt*(O.kind==='save'?-1:1));},0);
    const mine=(P.kind==='wage'||P.kind==='reg')?0:amt*(P.kind==='save'?-1:1);
    const extra=((others+mine)*12/1000)/S.e.gdpNom*100;
    const bk=budgetBook(extra), ceil=finCeil(), over=Math.max(0,-bk.pct-ceil);
    const cap=newPkgCap(), used=S.draft.policies.filter(x=>x.id!==id).length;
    const capFull=used>=cap && !ex;
    /* ── YILLIK PROGRAM ÖDENEĞİ ──
       Gerçek bütçe yıllıktır. Bu paket yıl sonuna kadar kaç ay yürürse
       o kadar ödenek yer; zarfta o kadar yer yoksa başlatılamaz. */
    const kalanAy=Math.min(dur,fyMonthsLeft());
    const digerleri=S.draft.policies.filter(x=>x.id!==id).reduce((a,pl)=>{const O=POL(pl.id);
      return a+((O.kind==='wage'||O.kind==='reg')?0:Math.max(0,pl.amt)*Math.min(pl.dur,fyMonthsLeft())/1000);},0);
    const benim=(P.kind==='wage'||P.kind==='reg')?0:Math.max(0,mine)*kalanAy/1000;
    const zarf=fyOpen(), zarfKalan=zarf-digerleri-benim;
    const fyFull=zarfKalan<-1e-9;
    const blocked=over>0||capFull||fyFull;
    okBtn.disabled=blocked;
    okBtn.classList.toggle('off',blocked);
    okBtn.textContent=fyFull?'YILLIK ÖDENEK YETMİYOR':capFull?'KAPASİTE DOLU'
      :over>0?'HAZİNE FİNANSE EDEMİYOR':(ex?'SEPETİ GÜNCELLE':'SEPETE EKLE');
    /* ── AYLIK TABLO ──
       Kararı aylık maliyetiyle yönetiyoruz: bu paket kasadan her ay ne
       götürüyor, ay sonunda ne kalıyor. Toplam bütçe bunun süreyle çarpımı. */
    const AY=bookMonthly(others+mine), PR=monthlyProgram();
    const benimAy=(P.kind==='wage'||P.kind==='reg')?0:mine;
    const mAy=v=>nf(v,0)+' mlr ₺/ay';
    d.querySelector('#cFin').innerHTML=
      `<span>Bu paketin aylık maliyeti</span><b class="${benimAy>0?'red':benimAy<0?'grn':'mut'}">${
         benimAy?(benimAy>0?'−':'+')+mAy(Math.abs(benimAy)):'bütçesiz'}</b>`
     +`<span>Toplam bütçesi (aylık × süre)</span><b class="${benimAy>0?'org':'mut'}">${
         benimAy>0?trn(pkgTotal(amt,dur)):'—'}</b>`
     +`<span>Aylık program gideri (hepsi)</span><b class="org">−${mAy(PR.aktif+others+mine)}</b>`
     +`<span>AYLIK DENGE</span><b class="${AY.denge<0?'red':'grn'}">${
         (AY.denge<0?'−':'+')+mAy(Math.abs(AY.denge))}</b>`
     +`<span>İşlem sonrası aylık serbest alan</span><b class="${AY.serbest<0?'red':'grn'}">${
         (AY.serbest<0?'−':'')+mAy(Math.abs(AY.serbest))}</b>`
     +`<span class="cfin-sep">${S.year} ödeneği · toplam</span><b class="cfin-sep">${trn((S.fy&&S.fy.cap)||fyCap())}</b>`
     +`<span>Harcanan + bağlanan</span><b class="org">−${trn(((S.fy&&S.fy.used)||0)+fyCommitted())}</b>`
     +`<span>SERBEST ÖDENEK</span><b class="${zarf<0.12?'red':'grn'}">${trn(zarf)}</b>`
     +`<span>Bu paket yıl sonuna kadar</span><b class="${fyFull?'red':''}">${
         benim>0?'−'+trn(benim)+' ('+kalanAy+' ay)':'bütçesiz'}</b>`
     +`<span>İşlem sonrası kalan</span><b class="${fyFull?'red':'grn'}">${trn(Math.max(0,zarfKalan))}</b>`
     +`<span>Bütçe dengesi</span><b class="${bk.pct<-6?'red':''}">${trn(bk.denge)} · ${pct(bk.pct)} GSYH</b>`
     +`<span>Finansman tavanı</span><b class="${over>0?'red':'grn'}">${pct(ceil)} GSYH</b>`
     +`<span>Bu ay yeni paket hakkı</span><b class="${capFull?'red':''}">${used}/${cap}</b>`;
    d.querySelector('#cFinNote').innerHTML=fyFull
      ? `<b class="red">${S.year} program ödeneği yetmiyor.</b> Yılın zarfı ${trn(zarf)}; `
        +`bu paket yıl sonuna kadar ${trn(benim)} yer. Ödeneği düşür, bir programı erken kapat, `
        +`tasarruf paketiyle yer aç — ya da ocağı bekle: ödenek her yılbaşında yenilenir.`
      : over>0
      ? '<b class="red">Bu ödenekle açık finanse edilemiyor.</b> Tutarı düşür, süreyi kısalt ya da '
        +'bir tasarruf paketiyle (Kamuda Tasarruf, Kayıt Dışıyla Mücadele) alan aç.'
      : capFull
      ? '<b class="red">Bu ay kapasite doldu.</b> Hükümet aynı anda '+cap+' yeni programı yürütebilir; '
        +'güvenilirlik arttıkça kapasite de artar.'
      : `Tavanın altındasın. Bu paket ${S.year} ödeneğinden ${trn(benim)} yer; geriye ${trn(Math.max(0,zarfKalan))} kalır.`;
  };
  if(rng){
    rng.oninput=e=>{amt=+e.target.value;sync();};
    d.querySelector('#cUp').onclick=()=>{amt=clamp(amt+STEP,MIN,MAX);sync();};
    d.querySelector('#cDn').onclick=()=>{amt=clamp(amt-STEP,MIN,MAX);sync();};
  }
  d.onclick=e=>{const b=e.target.closest('[data-d]');if(b){dur=+b.dataset.d;sync();}};
  d.querySelector('#cNo').onclick=closeModal;
  if(ex)d.querySelector('#cRm').onclick=()=>{
    S.draft.policies=S.draft.policies.filter(x=>x.id!==id);closeModal();renderCards();renderBasket();};
  d.querySelector('#cOk').onclick=()=>{
    S.draft.policies=S.draft.policies.filter(x=>x.id!==id);
    S.draft.policies.push({id,amt,dur:P.kind==='wage'?1:dur});
    closeModal();renderCards();renderBasket();
    const r=$('#cards').getBoundingClientRect(),k=uiScale();
    floatD((r.left+r.width/2)/k,r.top/k+20,'+1 KARAR','#2F6B3E');};
  sync();                      // açılışta hazine defteri ve kapasite hemen dolsun
}
