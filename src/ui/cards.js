import {$, K, S, arrows, clamp, nf, pct, signed} from '../core/state.js';
import {MEGA, budgetBook, finCeil, megaBlock, megaOf, newPkgCap, trn} from '../data/mega.js';
import {POL, POLICIES, kOf} from '../data/policies.js';
import {save} from '../sim/commit.js';
import {araZamOk, openMega} from '../sim/wageround.js';
import {closeModal, floatD, modal} from './modal.js';
import {renderBasket} from './speech.js';

/* ═══════════════ KARAR KARTLARI + PAKET TASARLAYICI ═══════════════ */
export function renderCards(){
  const simple=S.opts.simple;
  $('#cards').innerHTML=POLICIES.filter(P=>P.kind!=='wage'||araZamOk()).map(P=>{
    const picked=S.draft.policies.find(x=>x.id===P.id);
    const run=S.active.find(a=>a.id===P.id);
    const amt=picked?picked.amt:P.def, k=P.kind==='wage'?1:kOf(P,amt);
    const rows=P.kind==='wage'
      ? [['Alım gücü',+0.9],['Enflasyon',+0.09*amt],['Esnaf maliyeti',-0.5]]
      : [['Büyüme',(P.fx.demand||0)*k*40],['Verimlilik',(P.fx.supply||0)*k*260],
         ['Enflasyon',((P.fx.infl||0)+(P.fx.rent||0))*k*40]];
    const fx=rows.map(([kk,v])=>{
      const good=/Enflasyon|Esnaf maliyeti/.test(kk)?v<0:v>0;
      return `<div><span>${kk}</span><b class="${Math.abs(v)<.04?'mut':good?'grn':'red'}">${
        simple?arrows(v):signed(v,1)}</b></div>`;}).join('');
    return `<article class="pc ${picked?'on':''}" title="${P.desc}">
      <div class="pc-h"><div class="pc-i">${P.ico}</div><h4 class="pc-n">${P.name}</h4></div>
      ${run?`<div class="pc-run">▶ yürürlükte · ${run.dur-run.age} ay · ${run.amt} ${P.unit||'mlr ₺/ay'}</div>`:''}
      <div class="pc-meta2">
        <span class="${picked?(P.kind==='save'||P.kind==='reg'?'grn':'red'):'mut'}">${
          P.kind==='wage'?`%${amt}`:P.kind==='reg'?'bütçesiz düzenleme':`${amt} mlr ₺/ay`}</span>
        <span class="mut">${P.kind==='wage'?P.cat:(picked?picked.dur:P.defDur)+' ay'}</span>
        ${picked?'':'<span class="mut" style="font-size:10px">önerilen</span>'}</div>
      <div class="pc-fx">${fx}</div>
      <button class="pc-b ${picked?'on':''}" data-p="${P.id}">${picked?'✓ SEPETTE — DÜZENLE':'AYARLA VE EKLE'}</button>
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
          <div><span>Potansiyel büyüme</span><b class="grn">${signed((M.after.supply||0)*2600,1)}</b></div>
          <div><span>İnşaatta istihdam</span><b class="grn">${signed(-(M.during.unemp||0)*140,1)}</b></div>
          <div><span>Bütçe (açılınca)</span><b class="red">${signed(-M.gar,2)}</b></div>
        </div>`}
        <button class="pc-b ${m?'on':''}" data-mega="${M.id}" ${m||blk?'disabled':''}>${
          m?(m.built?'İŞLETMEDE':'İNŞAAT SÜRÜYOR'):blk?'ŞU AN OLMAZ':'İHALEYİ AÇ'}</button>
      </article>`;}).join('');
  $('#cards').onclick=ev=>{
    const mg=ev.target.closest('[data-mega]');
    if(mg){if(!mg.disabled)openMega(mg.dataset.mega);return;}
    const b=ev.target.closest('[data-p]');if(!b)return;
    openComposer(b.dataset.p);};
}

/* paket tasarlayıcı modalı */
export function openComposer(id){
  const P=POL(id);
  const ex=S.draft.policies.find(x=>x.id===id);
  let amt=ex?ex.amt:P.def, dur=ex?ex.dur:P.defDur;
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
         ['Potansiyel büyüme',(P.fx.supply||0)*k*dur*1.9],
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

  const valHTML=()=>`${P.kind==='wage'?'%'+amt:amt}<small> ${P.kind==='wage'?'':unit}</small>`;
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
      <div class="ctl-l" style="margin:14px 0 2px">${P.kind==='wage'?'Zam oranı':'Aylık ödenek'}</div>
      <div class="comp-row">
        <button class="sq" id="cDn">−</button>
        <input type="range" id="cAmt" min="${P.min}" max="${P.max}" step="${P.kind==='wage'?1:5}" value="${amt}">
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
    const blocked=over>0||capFull;
    okBtn.disabled=blocked;
    okBtn.classList.toggle('off',blocked);
    okBtn.textContent=capFull?'KAPASİTE DOLU':over>0?'HAZİNE FİNANSE EDEMİYOR':(ex?'SEPETİ GÜNCELLE':'SEPETE EKLE');
    d.querySelector('#cFin').innerHTML=
      `<span>Bütçe dengesi</span><b class="${bk.pct<-6?'red':''}">${trn(bk.denge)} · ${pct(bk.pct)} GSYH</b>`
     +`<span>Finansman tavanı</span><b class="${over>0?'red':'grn'}">${pct(ceil)} GSYH</b>`
     +`<span>Bu ay yeni paket hakkı</span><b class="${capFull?'red':''}">${used}/${cap}</b>`;
    d.querySelector('#cFinNote').innerHTML=over>0
      ? '<b class="red">Bu ödenekle açık finanse edilemiyor.</b> Tutarı düşür, süreyi kısalt ya da '
        +'bir tasarruf paketiyle (Kamuda Tasarruf, Kayıt Dışıyla Mücadele) alan aç.'
      : capFull
      ? '<b class="red">Bu ay kapasite doldu.</b> Hükümet aynı anda '+cap+' yeni programı yürütebilir; '
        +'güvenilirlik arttıkça kapasite de artar.'
      : 'Tavanın altındasın — Hazine bu programı borçlanarak fonlayabilir.';
  };
  const step=P.kind==='wage'?1:5;
  if(rng){
    rng.oninput=e=>{amt=+e.target.value;sync();};
    d.querySelector('#cUp').onclick=()=>{amt=clamp(amt+step,P.min,P.max);sync();};
    d.querySelector('#cDn').onclick=()=>{amt=clamp(amt-step,P.min,P.max);sync();};
  }
  d.onclick=e=>{const b=e.target.closest('[data-d]');if(b){dur=+b.dataset.d;sync();}};
  d.querySelector('#cNo').onclick=closeModal;
  if(ex)d.querySelector('#cRm').onclick=()=>{
    S.draft.policies=S.draft.policies.filter(x=>x.id!==id);closeModal();renderCards();renderBasket();};
  d.querySelector('#cOk').onclick=()=>{
    S.draft.policies=S.draft.policies.filter(x=>x.id!==id);
    S.draft.policies.push({id,amt,dur:P.kind==='wage'?1:dur});
    closeModal();renderCards();renderBasket();
    const r=$('#cards').getBoundingClientRect();
    floatD(r.left+r.width/2,r.top+20,'+1 KARAR','#2F6B3E');};
  sync();                      // açılışta hazine defteri ve kapasite hemen dolsun
}
