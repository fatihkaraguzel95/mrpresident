import {$, K, MSHORT, S, clamp, nf, pct, signed} from '../core/state.js';
import {MEG, megaOf} from '../data/mega.js';
import {SPR} from '../data/sprites.js';
import {save} from './commit.js';
import {startProtest} from './protest.js';
import {SALARY0} from './vault.js';
import {closeModal, modal} from '../ui/modal.js';
import {renderAll} from '../ui/speech.js';

/* ═══════════════ YILBAŞI ZAM TURU ═══════════════
   Asgari ücret ve en düşük emekli aylığı her ocak masaya gelir.
   Sendikanın talebi enflasyona, erimiş alım gücüne ve sokağın
   sıcaklığına göre şekillenir; hazinenin dayattığı tavan ise
   bütçe açığına. Arada bir yer seçersin — iki taraf da küsebilir. */
export function wageAsk(){
  const e=S.e;
  const geri =Math.max(e.inflation,e.expect);              // en az enflasyon kadar
  const refah=e.potGrowth*0.6;                             // refah payı
  const kayip=Math.max(0,100-e.realIncome)*0.55;           // erimiş alım gücünün telafisi
  const ofke =S.p.unrest>55?4.5:S.p.unrest>40?2.5:1.2;
  return clamp(geri+refah+kayip+ofke,4,180);
}
export function wageOffer(){
  const e=S.e;
  return clamp(Math.min(e.inflation*0.72,e.inflation-4)-Math.max(0,-e.budget-5)*0.9,2,150);
}
export function wageRound(done){
  const e=S.e,ask=Math.round(wageAsk()),off=Math.round(wageOffer());
  const U=SPR.union[0];
  let mw=Math.round((ask+off)/2), pen=Math.round((ask+off)/2), sal=Math.round((ask+off)/2);
  const dolar=v=>'$'+nf(v/e.usdtry,0);
  const d=modal(`<div class="dlg-t"><span class="ic">🤝</span>
      <div><div class="dlg-k">${S.year} zam turu · Ocak</div><h3>Asgari ücret ve emekli aylığı</h3></div></div>
    <div class="dlg-b">
      <div class="wrow">
        <img class="wimg" src="${U.d}" alt="">
        <div>
          <p class="dlg-l" style="margin:0 0 6px"><b>Türk-İş masada:</b> “Açlık sınırı ${
            nf(e.minWage*1.35,0)} ₺. Son bir yılda enflasyon ${pct(e.inflation)}, alım gücümüz
            ${nf(Math.max(0,100-e.realIncome),0)} puan eridi. Talebimiz <b>%${ask}</b>.”</p>
          <p class="dlg-l" style="margin:0;font-size:13px"><b>Hazine:</b> “Bütçe açığı ${pct(e.budget)}.
            Sürdürülebilir tavan <b>%${off}</b>. Fazlası faiz gideri olarak geri döner.”</p>
        </div>
      </div>
      <div class="ctl-l" style="margin:14px 0 2px">Asgari ücret zammı</div>
      <div class="comp-row">
        <button class="sq" id="wDn">−</button>
        <input type="range" id="wRng" min="0" max="${Math.max(ask+25,60)}" step="1" value="${mw}">
        <button class="sq" id="wUp">+</button>
        <span class="comp-val org" id="wVal">%${mw}</span>
      </div>
      <div class="ctl-l" style="margin:10px 0 2px">En düşük emekli aylığı zammı</div>
      <div class="comp-row">
        <button class="sq" id="pDn">−</button>
        <input type="range" id="pRng" min="0" max="${Math.max(ask+25,60)}" step="1" value="${pen}">
        <button class="sq" id="pUp">+</button>
        <span class="comp-val org" id="pVal">%${pen}</span>
      </div>
      <div class="ctl-l" style="margin:10px 0 2px">Başkanlık maaşı zammı <span class="mut"
        style="text-transform:none;letter-spacing:0">— kendi maaşın, kamuoyu bunu izler</span></div>
      <div class="comp-row">
        <button class="sq" id="sDn">−</button>
        <input type="range" id="sRng" min="0" max="${Math.max(ask+25,60)}" step="1" value="${sal}">
        <button class="sq" id="sUp">+</button>
        <span class="comp-val org" id="sVal">%${sal}</span>
      </div>
      <div class="comp-box"><div class="comp-sum" id="wSum"></div></div>
      <div class="note" id="wNote"></div>
    </div>
    <div class="dlg-f"><button class="sbtn" style="width:auto;padding:10px 26px;margin:0" id="wOk">KARARI AÇIKLA</button></div>`);
  const sync=()=>{
    const nw=e.minWage*(1+mw/100), np=e.pension*(1+pen/100);
    const sal0=(S.me&&S.me.salary)||SALARY0, ns=sal0*(1+sal/100);
    d.querySelector('#wVal').textContent='%'+mw;
    d.querySelector('#pVal').textContent='%'+pen;
    d.querySelector('#sVal').textContent='%'+sal;
    const fark=sal-mw;                       // kendine işçiden fazla zam yaptın mı?
    d.querySelector('#wSum').innerHTML=
       `<span>Asgari ücret</span><b>${nf(e.minWage,0)} → ${nf(nw,0)} ₺ <small class="mut">(${dolar(nw)})</small></b>`
      +`<span>En düşük emekli aylığı</span><b>${nf(e.pension,0)} → ${nf(np,0)} ₺ <small class="mut">(${dolar(np)})</small></b>`
      +`<span>Başkanlık maaşı</span><b class="${fark>2?'red':''}">${nf(sal0,0)} → ${nf(ns,0)} ₺ `
      +`<small class="mut">(asgari ücretin ${nf(ns/nw,1)} katı)</small></b>`
      +`<span>Bir yıllık enflasyon etkisi</span><b class="red">+${nf(mw*0.09,2)} puan</b>`;
    const gap=ask-mw;
    const u1=gap>6
      ? '<b class="red">Sendika bu rakamı reddediyor — iş bırakma ve sokak eylemi ihtimali yüksek.</b>'
      : gap>2 ? 'Sendika homurdanıyor ama masayı devirmez.'
      : mw>ask+6 ? '<b>Talebin üstünde:</b> taban coşar, ücret-fiyat sarmalı da hızlanır.'
      : 'Masada uzlaşma sağlandı.';
    const u2=fark>6 ? ' <b class="red">Kendine işçiden çok daha fazla zam yapıyorsun — bu manşet olur.</b>'
      : fark>2 ? ' <span class="red">Kendi maaşın asgari ücretten hızlı artıyor; muhalefet bunu kullanacak.</span>'
      : fark<-2 ? ' <b class="grn">Kendi maaşını geride bıraktın — bu jest karşılık bulur.</b>' : '';
    d.querySelector('#wNote').innerHTML=u1+u2;};
  const step=(el,v)=>{
    if(el==='w'){mw=clamp(mw+v,0,+d.querySelector('#wRng').max);d.querySelector('#wRng').value=mw;}
    else if(el==='p'){pen=clamp(pen+v,0,+d.querySelector('#pRng').max);d.querySelector('#pRng').value=pen;}
    else{sal=clamp(sal+v,0,+d.querySelector('#sRng').max);d.querySelector('#sRng').value=sal;}
    sync();};
  d.querySelector('#wRng').oninput=ev=>{mw=+ev.target.value;sync();};
  d.querySelector('#pRng').oninput=ev=>{pen=+ev.target.value;sync();};
  d.querySelector('#sRng').oninput=ev=>{sal=+ev.target.value;sync();};
  d.querySelector('#wUp').onclick=()=>step('w',1); d.querySelector('#wDn').onclick=()=>step('w',-1);
  d.querySelector('#pUp').onclick=()=>step('p',1); d.querySelector('#pDn').onclick=()=>step('p',-1);
  d.querySelector('#sUp').onclick=()=>step('s',1); d.querySelector('#sDn').onclick=()=>step('s',-1);
  d.querySelector('#wOk').onclick=()=>{closeModal();applyWageRound(mw,pen,ask,sal);if(done)done();};
  sync();
}
export function applyWageRound(mw,pen,ask,sal){
  const e=S.e;
  if(sal==null)sal=mw;
  /* Kendi maaşına işçiden fazla zam yapmak siyaseten pahalıdır:
     manşet olur, sokak kızar, şeffaflık algısı düşer. Az zam yapmak
     ise küçük ama gerçek bir jesttir. */
  if(S.me){
    if(!S.me.salary)S.me.salary=SALARY0;
    S.me.salary=Math.round(S.me.salary*(1+sal/100));
  }
  const fark=sal-mw;
  if(fark>2){
    S.p.unrest=clamp(S.p.unrest+fark*0.55,3,99);
    S.p.vote=clamp(S.p.vote-fark*0.10,3,84);
    S.p.integrity=clamp(S.p.integrity-fark*0.35,2,98);
    S.seg.minwage=clamp(S.seg.minwage-fark*0.40,2,98);
    S.seg.retiree=clamp(S.seg.retiree-fark*0.30,2,98);
    if(S.me)S.me.suspicion=clamp(S.me.suspicion+fark*0.20,0,100);
    S.news.unshift(`Başkanın maaşına %${sal} zam — asgari ücrete %${mw}`);
  }else if(fark<-2){
    S.p.vote=clamp(S.p.vote+Math.min(6,-fark)*0.06,3,84);
    S.p.integrity=clamp(S.p.integrity+Math.min(6,-fark)*0.30,2,98);
    S.seg.minwage=clamp(S.seg.minwage+Math.min(6,-fark)*0.25,2,98);
    S.news.unshift(`Başkan kendi maaşını asgari ücretin altında artırdı`);
  }
  e.minWage=Math.round(e.minWage*(1+mw/100));
  e.pension=Math.round(e.pension*(1+pen/100));
  /* ── ÇİFTE ENDEKSLEME OLMASIN ──
     Aylık ücret denklemi zaten yıl boyunca enflasyon kadar zam dağıtıyor.
     Yılbaşı turunun ücret endeksine katkısı, o zammın ÜSTÜNDE kalan kısımdır;
     aksi hâlde reel ücret her yıl enflasyon kadar sıçrayıp tavana yapışıyordu. */
  const already=(e.wageHist&&e.wageHist.length>12)?(e.wageIdx/e.wageHist[0]-1)*100:e.inflation;
  const net=Math.max(0,mw-already);
  e.wageIdx*=(1+net*K.mwSpill/100);
  e.expect+=net*0.006+Math.max(0,mw-e.expect)*0.010;
  e.nairu=clamp(e.nairu+net*0.030,6,14);
  e.gap=clamp(e.gap-net*0.012,-10,8);
  S.seg.minwage=clamp(S.seg.minwage+(mw-ask)*0.55+mw*0.10,2,98);
  S.seg.retiree=clamp(S.seg.retiree+(pen-ask)*0.50+pen*0.08,2,98);
  S.seg.sme=clamp(S.seg.sme-mw*0.34,2,98);
  S.seg.capital=clamp(S.seg.capital-mw*0.28,2,98);
  e.primary-=pen*0.013;                                   // emekli aylığı doğrudan bütçeden
  S.wageYear=S.year;
  S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'decision',title:`${S.year} zam turu`,
    body:`Asgari ücret %${mw} → ${nf(e.minWage,0)} ₺ · en düşük emekli aylığı %${pen} → ${nf(e.pension,0)} ₺ `
       +`· başkanlık maaşı %${sal} → ${nf((S.me&&S.me.salary)||SALARY0,0)} ₺ (sendika talebi %${ask}).`});
  const shortfall=Math.max(0,ask-mw);
  if(shortfall>6){                                        // masayı devirdin: grev
    S.p.unrest=clamp(S.p.unrest+shortfall*1.15,3,99);
    S.p.morale=clamp(S.p.morale-shortfall*0.5,2,98);
    startProtest('wage',1.5+shortfall*0.22);
  }else if(shortfall>2){
    S.p.unrest=clamp(S.p.unrest+shortfall*0.6,3,99);
  }
}

/* ── asgari ücrete ara zam ──
   Yılbaşı turu dışında, yıl ortasında verilen ek zam. Enflasyon
   beklentiyi aştığında halkı rahatlatır; ama takvim dışı zam
   beklentileri bozar ve sendikayı bir sonraki tura güçlü getirir.
   Yılda bir kez, ocak dışında. */
export function araZamOk(){
  return S.month!==1 && S.araZamYear!==S.year;
}
/* ── mega proje ihalesi ── */
export function openMega(id){
  const M=MEG(id),e=S.e;
  if(megaOf(id))return;
  const gar=M.gar*(e.usdtry/42.10);
  const yil=gar/100*e.gdpNom;
  // kur %30 artarsa garanti ne olur?
  const stres=M.gar*(e.usdtry*1.30/42.10);
  const d=modal(`<div class="dlg-t"><span class="ic">${M.ico}</span>
      <div><div class="dlg-k">Yap-İşlet-Devret · ${M.build} ay inşaat</div><h3>${M.name}</h3></div></div>
    <div class="dlg-b">
      <p class="dlg-l" style="font-size:13px">${M.d}</p>
      <div class="comp-box"><div class="comp-sum">
        <span>Bütçeden peşin ödeme</span><b class="grn">yok — konsorsiyum finanse eder</b>
        <span>İnşaat süresi</span><b>${M.build} ay</b>
        <span>Açılınca yıllık garanti</span><b class="red">${pct(gar)} GSYH · ${nf(yil,2)} trilyon ₺</b>
        <span>Kur %30 artarsa garanti</span><b class="red">${pct(stres)} GSYH</b>
      </div></div>
      <div class="ctl-l" style="margin:12px 0 3px">İnşaat döneminde</div>
      <div class="comp-fx">
        <div><span>Talep / büyüme</span><b class="grn">${signed((M.during.demand||0)*12,1)}</b></div>
        <div><span>İşsizlik</span><b class="grn">${signed((M.during.unemp||0)*12,2)}</b></div>
        <div><span>Cari denge</span><b class="red">${signed((M.during.current||0)*12,2)}</b></div>
      </div>
      <div class="ctl-l" style="margin:10px 0 3px">İşletmeye açılınca</div>
      <div class="comp-fx">
        <div><span>Potansiyel büyüme</span><b class="grn">${signed((M.after.supply||0)*2600,2)}</b></div>
        <div><span>Cari denge</span><b class="${(M.after.current||0)>0?'grn':'red'}">${signed((M.after.current||0)*12,2)}</b></div>
        <div><span>Bütçe dengesi</span><b class="red">${signed(-gar,2)}</b></div>
      </div>
      <div class="note"><b class="red">⚠ ${M.warn}</b> Garanti dövize endeksli olduğu için lira değer
        kaybettikçe yükü büyür; sözleşme dönem sonunda da devam eder.</div>
    </div>
    <div class="dlg-f">
      <button class="sbtn alt" style="width:auto;padding:9px 18px;margin:0" id="mNo">VAZGEÇ</button>
      <button class="sbtn" style="width:auto;padding:9px 22px;margin:0" id="mOk">İHALEYİ İMZALA</button>
    </div>`);
  d.querySelector('#mNo').onclick=closeModal;
  d.querySelector('#mOk').onclick=()=>{
    if(!S.mega)S.mega=[];
    S.mega.push({id,age:0,built:false});
    S.p.vote=clamp(S.p.vote+0.5,3,84);
    S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'decision',title:'İhale imzalandı — '+M.name,
      body:`${M.build} ay inşaat. Açılışta yılda ${pct(gar)} GSYH garanti ödemesi başlayacak.`});
    closeModal();renderAll();save();};
}
