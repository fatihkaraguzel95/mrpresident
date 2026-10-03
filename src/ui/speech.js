import {$, K, MONTHS, MSHORT, S, TERM_M, arrows, clamp, nf, pct, qOf, signed, supplyPts} from '../core/state.js';
import {basket, bookMonthly, fundingGap, fyCap, fyCommitted, fyMonthsLeft, fyOpen, monthlyProgram, trn} from '../data/mega.js';
import {countryStatus} from '../sim/status.js';
import {POL, kOf} from '../data/policies.js';
import {layGrips} from '../main.js';
import {applyFx, save} from '../sim/commit.js';
import {commName, draftImpacts, guidName, headline} from '../sim/economy.js';
import {mediaDamp, money, netWorth, renderVault} from '../sim/vault.js';
import {renderCards} from './cards.js';
import {closeModal, modal} from './modal.js';
import {renderAdvisors, renderFx, renderMonetary, renderStats} from './panels.js';
import {renderSociety} from './society.js';
import {renderStreet} from './street.js';
import {FXN} from '../data/cast.js';
import {renderPaper} from './paper.js';
import {activePledges, draftBreaches} from '../sim/pledges.js';
import {uiScale} from './scale.js';
import {logAct} from '../sim/acts.js';

/* ═══════════════ BAŞKANIN AÇIKLAMASI ═══════════════
   Söz bedava değildir. Üç mekanik açıklamayı gerçek bir karar yapar:
   1) YORULMA — aynı kalıbı her tekrarladığında etkisi 1/(1+0,55·n) kadar
      kalır; üçüncüden sonra halk ciddiye almaz, tekrar sokağı geriyor.
   2) GERÇEKLİK — rakamlar söylemi yalanlıyorsa açıklama geri teper
      (real: çarpan negatife döner).
   3) GÜNDEM — açıklama gündemi değiştirdiği için üstündeki şüpheyi
      geçici olarak düşürür; ama şüpheyi gerçekten temizleyen tek seçenek
      hesap verme sözüdür — onun da bedeli oydur.
   Ayda tek açıklama hakkın var. Medya sahipliği etkiyi büyütür.
   Kürsüye her ay çıkmak etkiyi eritir: üst üste yapılan her açıklama bir
   basamak zayıflar, susulan her ay bir basamak geri kazandırır.
   ═══════════════════════════════════════════════════ */
export const SPEECH=[
 {id:'dis',ico:'📣',n:'Dış güçlere seslen',sub:'foreign',
  t:'"Bu millet dışarıdan gelen hiçbir baskıya boyun eğmemiştir."',
  d:'Önce muhatabı seç (ABD · Rusya · Çin · İsrail), sonra tonu: övgü mü, meydan okuma mı? Her bileşimin kendi siyasi getirisi ve kendi ekonomik faturası var.',
  fx:{vote:1.1,unrest:-6,suspicion:-9,credibility:-3,cds:14,segMinwage:2,segRetiree:2,segCapital:-2.5}},
 {id:'cete',ico:'🧱',n:'Çetelere savaş',
  t:'"Devleti bir avuç müteahhit çetesine yedirmeyiz; her ihale millete hesap verecek."',
  d:'Yolsuzluk gündemini kendi lehine çevirir. Esnaf sever, sermaye tehdit olarak okur.',
  fx:{vote:1.0,unrest:-5,suspicion:-12,integrity:3,segSme:3,segCapital:-4,cds:8}},
 {id:'faiz',ico:'📉',n:'Faiz lobisi',
  t:'"Faiz lobisi milletin cebine göz dikti. Biz faizin değil, üretenin yanındayız."',
  d:'Tabanda karşılığı yüksek — ama beklentiyi bozar, kuru ve enflasyonu besler.',
  fx:{vote:1.2,expect:1.3,credibility:-7,usdtry:1.4,unrest:-4,suspicion:-7,segMinwage:2,segCapital:-3}},
 {id:'manevi',ico:'🕌',n:'Manevi değerler',
  t:'"Bu millet ezanına, bayrağına, ailesine ve mukaddesatına sahip çıkmıştır; çıkmaya devam edecek."',
  d:'Ekonomiyi hiç konuşmadan tabanı konsolide eder. Gençlerde karşılığı zayıf.',
  fx:{vote:1.3,unrest:-8,suspicion:-11,segRetiree:3.5,segMinwage:2,segYouth:-2.5,credibility:-1.5}},
 {id:'birlik',ico:'🇹🇷',n:'Milli birlik',
  t:'"Bayrağımızın altında hepimiz kardeşiz. Bu zor günü de birlikte aşacağız."',
  d:'Yumuşak ve kapsayıcı. Etkisi küçük ama kimseyi küstürmez, hızlı da yorulmaz.',
  fx:{vote:.5,unrest:-4,suspicion:-4,morale:2}},
 {id:'sabir',ico:'🤝',n:'Fedakârlık çağrısı',
  t:'"Bir süre daha sabır istiyorum. Programı bozmadan yürürsek meyvesini birlikte toplayacağız."',
  d:'Beklentiyi çıpalar, güvenilirliği artırır — ama sokağa "biraz daha katlanın" demektir.',
  fx:{expect:-.9,credibility:4,vote:-1.0,unrest:5,morale:-3}},
 {id:'hesap',ico:'⚖️',n:'Hesap verebilirlik',
  t:'"Her kuruşun hesabını millete vereceğiz; denetim raporları kamuya açılacak."',
  d:'Şüpheyi gerçekten temizleyen tek seçenek. Risk primi düşer, cebine giden yollar daralır.',
  fx:{integrity:7,credibility:5,suspicion:-18,cds:-14,vote:-.7}},
 {id:'zafer',ico:'🏗️',n:'Başarı turu',
  t:'"Rekor ihracat, rekor istihdam, dev projeler — tablo ortada."',
  d:'Rakamlar tutuyorsa güçlü. Tutmuyorsa halk alay eder, geri teper.',
  fx:{vote:1.0,unrest:-4,suspicion:-5,credibility:-1},
  real:s=>(s.e.inflation<22&&s.p.morale>45&&s.e.realIncome>95)?1.15:-0.8}
];
/* ═══════════════ DIŞ POLİTİKA SESLENİŞİ ═══════════════
   Dört muhatap, iki ton. Övgü diplomatik/ekonomik kapı açar ama tabanda
   bedeli vardır; meydan okuma tabanı toplar ama piyasaya fatura keser.

   İsrail özel bir durumdur: meydan okumanın SİYASİ getirisi hiç yorulmaz
   (taban her seferinde aynı coşkuyla toplanır) — ama EKONOMİK faturası her
   tekrarda büyür. Yani kullanabilirsin, hep işe yarar, ama her kullanımda
   daha pahalıya mal olur.
   ═══════════════════════════════════════════════════════ */
export const FOREIGN={
 usa:{n:'ABD',fl:'🇺🇸',
  ov:{t:'"Stratejik ortaklığımız köklüdür; müttefikimizle sorunları masada çözeriz."',
      d:'Piyasa rahatlar, yatırımcı döner, risk primi geriler — ama taban "eğildik" der.',
      fx:{credibility:4,cds:-22,usdtry:-1.2,reserves:3,segCapital:4,segSme:1,
          vote:-1.3,unrest:3,segMinwage:-2,segRetiree:-1.5}},
  ok:{t:'"Eyy Washington! Bu millet senin tehdidinle hizaya girmez; tarifeni de yaptırımını da başına yıkarız."',
      d:'Taban coşar, gündem değişir — ama tarife ve yaptırım riski anında fiyatlanır.',
      fx:{vote:1.5,unrest:-6,suspicion:-9,morale:2,segMinwage:2.5,segRetiree:2,
          credibility:-5,cds:34,usdtry:2.4,expect:.8,segCapital:-5.5,current:-.25,riskShock:10}}},
 rus:{n:'Rusya',fl:'🇷🇺',
  ov:{t:'"Komşumuzla enerji ve tahılda iş birliğimiz halkımızın cebine giriyor."',
      d:'Enerji ve gıda faturası hafifler, cari denge rahatlar — Batı sermayesi tedirgin olur.',
      fx:{fuelShock:-6,foodShock:-4,current:.25,vote:.7,segSme:2,segRetiree:1.5,
          cds:16,segCapital:-3,credibility:-2}},
  ok:{t:'"Enerjide kimsenin vanasına mahkûm değiliz; dayatmayı kabul etmeyiz."',
      d:'Bağımsızlık mesajı tabanda karşılık bulur; ama sevkiyat riski fiyatlara girer.',
      fx:{vote:1.0,unrest:-4,suspicion:-6,segMinwage:1.5,
          fuelShock:7,cds:24,usdtry:1.5,credibility:-2,segCapital:-3,current:-.2}}},
 chn:{n:'Çin',fl:'🇨🇳',
  ov:{t:'"Doğu ile stratejik yatırım ortaklığımız yeni fabrikalar ve swap hattı getiriyor."',
      d:'Rezerv ve yatırım girişi; bedeli ucuz ithalatın esnafı ezmesi.',
      fx:{reserves:8,cds:-12,usdtry:-0.9,segCapital:3,vote:.4,
          segSme:-4.5,current:-.3,credibility:1}},
  ok:{t:'"Ucuz ithalat esnafımızı bitiriyor; gerekirse koruma tedbirini koyarız."',
      d:'Esnaf ve sanayici bir anda yanına geçer; ama tedarik zinciri ve finansman daralır.',
      fx:{vote:1.0,segSme:5,unrest:-3,
          cds:18,usdtry:1.3,segCapital:-3.5,current:-.25,credibility:-2}}},
 isr:{n:'İsrail',fl:'🇮🇱',
  ov:{t:'"Bölgede herkesle diyalog kurar, ticareti siyasetin önüne koyarız."',
      d:'Piyasa ve lojistik için teknik olarak rahatlatıcı — ama toplumun büyük bölümü bunu affetmez.',
      fx:{credibility:2,cds:-10,segCapital:3,
          vote:-2.6,unrest:9,morale:-4,segMinwage:-5,segRetiree:-4.5,segYouth:-3}},
  ok:{t:'"Zulme sessiz kalmayız! Bu millet mazlumun yanındadır; ticareti de keseriz, sesimizi de kısmayız."',
      d:'Tabanı HER SEFERİNDE aynı güçle toplar — yorulmaz. Ama her tekrarda ekonomik fatura büyür: risk primi, kur ve lojistik maliyeti.',
      /* Siyasi kalemler yorulmaz (hard), ekonomik kalemler tekrarda AĞIRLAŞIR. */
      hard:{vote:2.1,unrest:-9,suspicion:-12,morale:3,segMinwage:4.5,segRetiree:4,segYouth:2.5},
      fx:{credibility:-6,cds:48,usdtry:3.2,expect:1.2,segCapital:-7,current:-.45,riskShock:15}}}
};
export const SP=id=>SPEECH.find(x=>x.id===id);
export const spUsed=id=>((S.sp&&S.sp.used&&S.sp.used[id])||0);
export const spDone=()=>!!(S.sp&&S.sp.month===S.t);
/* ── SIKLIK YORGUNLUĞU ──
   Her ay kürsüye çıkan başkanı kimse dinlemez. Üst üste yapılan her
   açıklama etkiyi bir basamak düşürür; susulan her ay bir basamak geri
   kazandırır. Bu, hangi açıklama olduğundan bağımsızdır — nakarat
   yorgunluğu (spUsed) ayrı çalışır, bu ise kürsüye çıkma sıklığıdır.

   Sayaç konuşma anında güncellenir: aradaki sessiz aylar S.sp.month'tan
   çıkarılır, böylece ay ilerletme akışına kanca takmaya gerek kalmaz. */
const RUN_STEP=0.18, RUN_FLOOR=0.40, RUN_MAX=6;
export function spRun(){
  const sp=S.sp||{};
  const last=(sp.month==null?-99:sp.month);
  const idle=Math.max(0,S.t-last-1);          // araya giren sessiz ay sayısı
  return clamp((sp.run||0)-idle,0,RUN_MAX);
}
export const spRunMul=()=>Math.max(RUN_FLOOR,1-RUN_STEP*spRun());
/** Konuşmanın ardından sayacı bir basamak yukarı taşır. */
export function spBumpRun(){
  const r=spRun();
  if(!S.sp)S.sp={used:{},month:-1};
  S.sp.run=Math.min(RUN_MAX,r+1);
}
export function spRunNote(){
  const r=spRun();
  if(!r)return 'etki tam güçte';
  return `üst üste ${r} ay · etki %${nf(spRunMul()*100,0)}`;
}
// etkili çarpan: nakarat yorgunluğu × sıklık yorgunluğu × gerçeklik × medya gücü
export function spMul(P){
  const fat=1/(1+0.55*spUsed(P.id));
  const real=P.real?P.real(S):1;
  return fat*spRunMul()*real*(1+mediaDamp()*0.5);
}
export function spFx(P){
  const mul=spMul(P),u=spUsed(P.id),fx={};
  Object.entries(P.fx).forEach(([k,v])=>{fx[k]=+(v*mul).toFixed(2);});
  if(u>=2){                                  // aynı nakaratı tekrarlamanın bedeli
    fx.unrest=+((fx.unrest||0)+1.2*(u-1)).toFixed(2);
    fx.credibility=+((fx.credibility||0)-0.4*(u-1)).toFixed(2);}
  Object.keys(fx).forEach(k=>{if(Math.abs(fx[k])<0.01)delete fx[k];});
  return fx;
}
export function renderSpeech(){
  const box=$('#spBox'); if(!box)return;
  const done=spDone();
  const r=$('#spR');
  if(r)r.textContent=(done?'bu ay konuşuldu · ':'')+spRunNote();
  box.innerHTML=SPEECH.map(P=>{
    const u=spUsed(P.id),mul=spMul(P);
    const tag=u?`×${u} · etki %${nf(Math.max(0,mul)*100,0)}`:(P.real&&P.real(S)<0?'geri teper':'yeni');
    return `<button class="sprow" data-sp="${P.id}" ${done?'disabled':''} title="${P.t.replace(/"/g,'')}">
      <span class="sp-i">${P.ico}</span>
      <span><b>${P.n}</b><small>${P.d}</small></span>
      <span class="sp-u ${mul<0?'red':u?'mut':'grn'}">${tag}</span></button>`;}).join('');
  box.onclick=ev=>{const b=ev.target.closest('[data-sp]');
    if(b&&!b.disabled)askSpeech(b.dataset.sp);};
}
/* Dış politika: önce muhatap, sonra ton. */
export function askForeign(){
  const d=modal(`<div class="dlg-t"><span class="ic">📣</span>
      <div><div class="dlg-k">Başkanın açıklaması · dış politika</div><h3>Kime sesleneceksin?</h3></div></div>
    <div class="dlg-b">
      <p class="dlg-l" style="font-size:13px">Muhatabı seçtikten sonra tonu belirleyeceksin: övgü mü,
        meydan okuma mı? Her bileşim farklı bir seçmen grubunu ve farklı bir piyasa kalemini vurur.</p>
      <div id="fch">${Object.entries(FOREIGN).map(([k,C])=>
        `<button class="choice" data-fc="${k}"><span class="choice-no">${C.fl}</span>
          <span><span class="choice-t">${C.n}</span>
          <span class="choice-m">Övgü: ${C.ov.d.split('—')[0].trim()} · Meydan okuma: ${C.ok.d.split('—')[0].trim()}</span>
        </span></button>`).join('')}</div>
    </div>
    <div class="dlg-f"><button class="sbtn alt" style="width:auto;padding:9px 20px;margin:0" id="fNo">VAZGEÇ</button></div>`);
  d.onclick=ev=>{
    if(ev.target.id==='fNo'){closeModal();return;}
    const b=ev.target.closest('[data-fc]'); if(b){closeModal();askForeignTone(b.dataset.fc);}};
}
export function askForeignTone(ck){
  const C=FOREIGN[ck];
  const row=(k)=>{const fxA=foreignFx(ck,k);
    const L={...FXN,unrest:'Toplumsal tepki',morale:'Halkın morali',suspicion:'Üstündeki şüphe',
      reserves:'Rezervler (mlr $)',current:'Cari denge',riskShock:'Küresel risk primi',
      fuelShock:'Enerji fiyat şoku',foodShock:'Gıda fiyat şoku'};
    const goodUp=x=>!['cds','usdtry','expect','unrest','suspicion','riskShock','fuelShock','foodShock'].includes(x);
    return Object.entries(fxA).map(([x,v])=>{const good=goodUp(x)?v>0:v<0;
      return `<div><span>${L[x]||x}</span><b class="${good?'grn':'red'}">${signed(v,x==='cds'?0:1)}</b></div>`;}).join('');};
  const n=spUsed('dis:'+ck+':ok');
  const d=modal(`<div class="dlg-t"><span class="ic">${C.fl}</span>
      <div><div class="dlg-k">Muhatap: ${C.n}</div><h3>Tonu sen belirle</h3></div></div>
    <div class="dlg-b">
      <div class="fgr">
        <div class="fg">
          <div class="fg-h">🤝 ÖV</div>
          <p class="dlg-l" style="font-size:13px;font-style:italic">${C.ov.t}</p>
          <div class="note" style="margin:6px 0">${C.ov.d}</div>
          <div class="comp-fx">${row('ov')}</div>
          <button class="sbtn" style="width:100%;margin:8px 0 0;padding:9px" data-ft="ov">BU TONDA KONUŞ</button>
        </div>
        <div class="fg">
          <div class="fg-h dang">⚔ MEYDAN OKU</div>
          <p class="dlg-l" style="font-size:13px;font-style:italic">${C.ok.t}</p>
          <div class="note" style="margin:6px 0">${C.ok.d}${
            ck==='isr'?`<br><b class="grn">Siyasi getirisi yorulmaz.</b> ${
              n?`<b class="red">Bu ${n+1}. kez — ekonomik fatura %${Math.round(n*45)} daha ağır.</b>`
               :'Ama her tekrarda ekonomik fatura ağırlaşır.'}`:''}</div>
          <div class="comp-fx">${row('ok')}</div>
          <button class="sbtn" style="width:100%;margin:8px 0 0;padding:9px;background:var(--red);border-color:#6E1E18;box-shadow:4px 4px 0 #6E1E18" data-ft="ok">BU TONDA KONUŞ</button>
        </div>
      </div>
    </div>
    <div class="dlg-f">
      <button class="sbtn alt" style="width:auto;padding:9px 20px;margin:0" id="ftBack">◀ BAŞKA ÜLKE</button>
      <button class="sbtn alt" style="width:auto;padding:9px 20px;margin:0" id="ftNo">VAZGEÇ</button>
    </div>`);
  d.onclick=ev=>{
    if(ev.target.id==='ftNo'){closeModal();return;}
    if(ev.target.id==='ftBack'){closeModal();askForeign();return;}
    const b=ev.target.closest('[data-ft]'); if(b){closeModal();doForeign(ck,b.dataset.ft);}};
}
/* Ülke+ton için nihai etki: yorulma, gerçeklik ve medya gücü uygulanır.
   İsrail'e meydan okumada siyasi kalemler yorulmaz, ekonomik kalemler ağırlaşır. */
export function foreignFx(ck,tone){
  const C=FOREIGN[ck],T=C[tone];
  const key='dis:'+ck+':'+tone;
  const u=spUsed(key);
  const fat=1/(1+0.55*u);
  const media=(1+mediaDamp()*0.5)*spRunMul();
  const out={};
  // ekonomik/geri kalan kalemler: yorulur; "hard" varsa fatura tekrarda ağırlaşır
  const costMul=T.hard?(1+0.45*u)*media:fat*media;
  Object.entries(T.fx).forEach(([k,v])=>{out[k]=+(v*costMul).toFixed(2);});
  // yorulmayan siyasi kalemler
  if(T.hard)Object.entries(T.hard).forEach(([k,v])=>{out[k]=+((out[k]||0)+v*media).toFixed(2);});
  Object.keys(out).forEach(k=>{if(Math.abs(out[k])<0.01)delete out[k];});
  return out;
}
export function doForeign(ck,tone){
  if(spDone())return;
  const C=FOREIGN[ck],T=C[tone],fx=foreignFx(ck,tone);
  applyFx(fx);
  if(!S.sp)S.sp={used:{},month:-1};
  if(!S.sp.used)S.sp.used={};
  const key='dis:'+ck+':'+tone;
  S.sp.used[key]=spUsed(key)+1;
  S.sp.used.dis=spUsed('dis')+1;
  spBumpRun();
  S.sp.month=S.t; S.sp.last='dis';
  headline(`Başkan ${C.n}'ye seslendi: ${T.t.replace(/"/g,'')}`);
  {const meydan=tone==='ok', iyi=(fx.vote||0)>0&&(fx.cds||0)<25;
   logAct({ico:C.fl,k:'DIŞ POLİTİKA',w:70,good:iyi,
    t:`${C.n}'ye ${meydan?'meydan okuma':'övgü'}`,
    s:`oy ${signed(fx.vote||0,1)} · risk primi ${signed(fx.cds||0,0)} bp · kur ${signed(fx.usdtry||0,1)}%`,
    h:meydan?`${C.n.toLocaleUpperCase('tr')}'YE SERT ÇIKIŞ`:`${C.n.toLocaleUpperCase('tr')} İLE YUMUŞAMA`,
    ps:`${T.t} ${meydan
      ?`Meydanlarda coşkuyla karşılandı; risk primi ${signed(fx.cds||0,0)} baz puan hareket etti.`
      :'Diplomatik kanallar rahatladı, tabanda ise "eğildik" eleştirisi yükseldi.'}`});}
  S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'event',
    title:`${C.fl} ${C.n}'ye ${tone==='ok'?'meydan okuma':'övgü'}`,
    body:`${T.t} — oy ${signed(fx.vote||0,1)} · tepki ${signed(fx.unrest||0,1)} · `
        +`risk primi ${signed(fx.cds||0,0)} bp · kur ${signed(fx.usdtry||0,1)}%.`});
  renderAll();save();
}

export function askSpeech(id){
  const P=SP(id);
  if(P&&P.sub==='foreign'){askForeign();return;}
  const fx=spFx(P),u=spUsed(id);
  const goodUp=k=>!['cds','usdtry','expect','unrest','suspicion'].includes(k);
  const L={...FXN,unrest:'Toplumsal tepki',morale:'Halkın morali',suspicion:'Üstündeki şüphe'};
  const rows=Object.entries(fx).map(([k,v])=>{
    const good=goodUp(k)?v>0:v<0;
    return `<div><span>${L[k]||k}</span><b class="${good?'grn':'red'}">${signed(v,k==='cds'?0:1)}</b></div>`;}).join('');
  const d=modal(`<div class="dlg-t"><span class="ic">${P.ico}</span>
      <div><div class="dlg-k">Başkanın açıklaması</div><h3>${P.n}</h3></div></div>
    <div class="dlg-b">
      <p class="dlg-l" style="font-size:14px;font-style:italic">${P.t}</p>
      <div class="ctl-l" style="margin:13px 0 4px">Beklenen etki${
        u?` · ${u+1}. kez — halk bu nakaratı ezberledi`:''}${
        spRun()?` · üst üste ${spRun()}. ay — kürsü yoruldu, etki %${nf(spRunMul()*100,0)}`:''}</div>
      <div class="comp-fx">${rows}</div>
      <div class="note">${spRun()?`Bir ay hiç konuşmazsan etki %${nf(RUN_STEP*100,0)} geri gelir. `:''}${P.d}${P.real&&P.real(S)<0
        ?' <b class="red">Şu anki rakamlar bu söylemi yalanlıyor: açıklama geri tepecek.</b>':''}</div>
    </div>
    <div class="dlg-f">
      <button class="sbtn alt" style="width:auto;padding:9px 20px;margin:0" id="spNo">VAZGEÇ</button>
      <button class="sbtn" style="width:auto;padding:9px 20px;margin:0" id="spYes">AÇIKLAMAYI YAP</button>
    </div>`);
  d.onclick=ev=>{
    if(ev.target.id==='spNo'){closeModal();return;}
    if(ev.target.id==='spYes'){closeModal();doSpeech(id);}};
}
export function doSpeech(id){
  if(spDone())return;
  const P=SP(id),fx=spFx(P);
  applyFx(fx);
  if(!S.sp)S.sp={used:{},month:-1};
  if(!S.sp.used)S.sp.used={};
  S.sp.used[id]=spUsed(id)+1;
  spBumpRun();
  S.sp.month=S.t; S.sp.last=id;
  headline(`Başkan: ${P.t.replace(/"/g,'')}`);
  /* Basın açıklamayı sonucuna göre karşılar: oy getiriyorsa "tabanı
     topladı", getirmiyorsa "tutmadı" diye yazılır. */
  {const iyi=(fx.vote||0)>0;
   logAct({ico:P.ico,k:'SİYASET',w:52,good:iyi,
    t:`Açıklama: ${P.n}`,
    s:`oy ${signed(fx.vote||0,1)} · tepki ${signed(fx.unrest||0,1)} · güvenilirlik ${signed(fx.credibility||0,1)}`,
    h:iyi?'BAŞKAN KÜRSÜDE: TABAN TOPLANDI':'BAŞKANIN AÇIKLAMASI TUTMADI',
    ps:`${P.t} ${iyi
      ?'Miting alanında karşılığı yüksek oldu; muhalefet gündemi değiştirmekle suçladı.'
      :'Söylem bu kez karşılık bulmadı; sosyal medyada alaycı paylaşımlar öne çıktı.'}`});}
  S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'event',title:'Başkan konuştu',
    body:`${P.t} — oy ${signed(fx.vote||0,1)} · tepki ${signed(fx.unrest||0,1)} · şüphe ${signed(fx.suspicion||0,1)}`});
  renderAll();save();
}

export const CHARTS=[
  {k:'inflation',t:'Enflasyon',c:'#E8C547',f:v=>pct(v)},
  {k:'growth',t:'Büyüme',c:'#5BA85F',f:v=>pct(v)},
  {k:'rate',t:'Politika faizi',c:'#E8762A',f:v=>pct(v)},
  {k:'usdtry',t:'USD/₺',c:'#4A9FD8',f:v=>nf(v,2)},
  {k:'realIncome',t:'Alım gücü',c:'#68C2B0',f:v=>nf(v,0)},
  {k:'vote',t:'Oy potansiyeli',c:'#D9534F',f:v=>pct(v)}
];
export function renderCharts(){
  /* Panel yeniden çizilirken fare grafiğin üstündeyse mouseleave hiç
     tetiklenmiyor ve ipucu ekranda asılı kalıyordu — aylarca eski bir
     tarih gösteriyordu (geri bildirim 23). Her çizimde kapatıyoruz. */
  const t0=$('#chTip'); if(t0)t0.style.opacity='0';
  const H=S.hist.slice(-18);
  $('#charts').innerHTML=CHARTS.map((C,ci)=>{
    const vals=H.map(h=>h[C.k]).filter(v=>v!=null),last=vals.length?vals[vals.length-1]:0;
    let inner;
    if(vals.length<2)inner=`<div style="height:40px"></div><div class="ch-e">ilk açıklama<br>ay sonunda</div>`;
    else{
      const W=190,Hh=40,P=3;
      let mn=Math.min(...vals),mx=Math.max(...vals);
      const pd=(mx-mn)*.18||1;mn-=pd;mx+=pd;
      const X=i=>P+i*(W-P*2)/(vals.length-1),Y=v=>P+(1-(v-mn)/(mx-mn))*(Hh-P*2);
      const d=vals.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join(' ');
      inner=`<svg viewBox="0 0 ${W} ${Hh}" data-ci="${ci}" preserveAspectRatio="none">
        <line x1="${P}" y1="${(Hh/2).toFixed(1)}" x2="${W-P}" y2="${(Hh/2).toFixed(1)}" stroke="#2E2820" stroke-width="1" vector-effect="non-scaling-stroke"/>
        <path d="${d} L${X(vals.length-1).toFixed(1)} ${Hh-P} L${X(0).toFixed(1)} ${Hh-P} Z" fill="${C.c}" opacity=".13"/>
        <path d="${d}" fill="none" stroke="${C.c}" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
        <rect x="${(X(vals.length-1)-2).toFixed(1)}" y="${(Y(last)-2).toFixed(1)}" width="4" height="4" fill="${C.c}"/>
        <rect x="0" y="0" width="${W}" height="${Hh}" fill="transparent"/></svg>`;}
    return `<div class="ch"><div class="ch-h"><span class="ch-t">${C.t}</span>
      <span class="ch-v" style="color:${C.c==='#E8C547'?'#A9761A':C.c}">${vals.length?C.f(last):'—'}</span></div>
      <div class="ch-b">${inner}</div></div>`;}).join('');
  const tip=$('#chTip');
  $('#charts').querySelectorAll('svg').forEach(svg=>{
    const ci=+svg.dataset.ci,C=CHARTS[ci],vals=H.map(h=>h[C.k]);
    if(vals.length<2)return;
    svg.onmousemove=ev=>{
      const r=svg.getBoundingClientRect();
      const i=clamp(Math.round((ev.clientX-r.left)/r.width*(vals.length-1)),0,vals.length-1);
      tip.style.opacity='1';
      const k=uiScale();
      tip.style.left=Math.min(window.innerWidth/k-170,ev.clientX/k+12)+'px';
      tip.style.top=(ev.clientY/k-34)+'px';
      tip.innerHTML=`${H[i].label} · <span style="color:${C.c}">${C.t}</span> <b>${C.f(vals[i])}</b>`;};
    svg.onmouseleave=()=>{tip.style.opacity='0';};});
}
/* ═══════════════ ÜST BAR — KAYNAKLAR ═══════════════
   Oyunun temel kaynakları her an göz önünde: yılın program ödeneği
   (ne kadar kaldı), bütçe dengesi, enflasyon, kur, faiz, rezerv, oy ve
   ülke statüsü. Bütçeyi görmek için panel aramak zorunda kalmazsın.
   ═══════════════════════════════════════════════════ */
export function renderRes(){
  const host=$('#resBar'); if(!host)return;
  const e=S.e, cap=(S.fy&&S.fy.cap)||fyCap(), open=fyOpen();
  const oran=clamp(open/Math.max(0.01,cap)*100,0,100);
  const oCol=oran<12?'var(--red)':oran<30?'#A9660B':'var(--green)';
  const bCol=e.budget<-7?'var(--red)':e.budget<-4?'#A9660B':'var(--green)';
  const iCol=e.inflation>35?'var(--red)':e.inflation>18?'#A9660B':'var(--green)';
  const rr=e.rate-e.expect;
  const rCol=rr<0?'var(--red)':rr<2?'#A9660B':'var(--green)';
  const sv=clamp(S.p.vote+((S.me&&S.me.fakePoll)||0),0,100);
  const vCol=sv<47?'var(--red)':sv<51?'#A9660B':'var(--green)';
  const ST=countryStatus();
  const chip=(ic,lab,val,sub,col)=>`<div class="rs" title="${sub}">
      <span class="rs-i">${ic}</span>
      <span class="rs-b"><span class="rs-l">${lab}</span>
        <span class="rs-v" style="color:${col||'inherit'}">${val}</span></span></div>`;
  host.innerHTML=
    `<div class="rs wide" title="${S.year} program ödeneği — yılın TÜM yeni paketlerinin bütçesi. Her ocak yeniden kurulur.&#10;&#10;Büyüten: düşük enflasyon (tahsilat erimez), büyüyen üretim kapasitesi, kayıt dışıyla mücadele ve şeffaflık, düşük borç, düşük risk primi, yüksek güvenilirlik.&#10;Küçülten: yüksek enflasyon, faiz gideri, YİD garantileri, kur korumalı mevduat faturası, enflasyon üstü emekli zammı.&#10;&#10;Harcanan ${nf((S.fy&&S.fy.used)||0,2)} + bağlanan ${nf(fyCommitted(),2)} trilyon ₺.">
      <span class="rs-i">💰</span>
      <span class="rs-b"><span class="rs-l">${S.year} ödeneği · kalan ${fyMonthsLeft()} ay</span>
        <span class="rs-v" style="color:${oCol}">${nf(open,2)}<small> / ${nf(cap,2)} trl ₺</small></span>
        <span class="rs-bar"><i style="width:${oran}%;background:${oCol}"></i></span></span></div>`
   +chip('🏛','Bütçe dengesi',pct(e.budget),`Finansman tavanı ${pct(fundingGap(0).ceil)} GSYH`,bCol)
   +(()=>{const A=bookMonthly(0),P2=monthlyProgram();
      return chip('📆','Aylık denge',(A.denge<0?'−':'+')+nf(Math.abs(A.denge),0)+' mlr ₺',
        `Bu ay kasaya giren ${nf(A.gelir,0)} mlr ₺; çıkan ${nf(A.gider,0)} mlr ₺ `
       +`(faiz ${nf(A.faiz,0)} · zorunlu ${nf(A.zorunlu,0)} · program ${nf(P2.toplam,0)}). `
       +`Aylık serbest alan ${nf(A.serbest,0)} mlr ₺.`,
        A.denge<0?(A.serbest<0?'var(--red)':'#A9660B'):'var(--green)');})()
   +chip('📈','Enflasyon',pct(e.inflation),`Beklenti ${pct(e.expect)} · hedef %5`,iCol)
   +chip('💵','USD / ₺',nf(e.usdtry,2),`Rezerv ${nf(e.reserves,0)} mlr $ · CDS ${nf(e.cds,0)} bp`)
   +chip('🏦','Faiz',pct(e.rate),`Reel faiz ${pct(rr)} · kredi ${pct(e.credit,0)}`,rCol)
   +chip('🛟','Rezerv',nf(e.reserves,0)+' mlr $',`CDS ${nf(e.cds,0)} bp`,
         e.reserves<45?'var(--red)':e.reserves<90?'#A9660B':'var(--green)')
   +chip('🎯','Güvenilirlik',nf(e.credibility,0)+'/100','Piyasanın politikaya inancı',
         e.credibility<35?'var(--red)':e.credibility<55?'#A9660B':'var(--green)')
   +chip('🧾','Asgari ücret',nf(e.minWage,0)+' ₺',
         `Dolar karşılığı $${nf(e.minWage/e.usdtry,0)} · asgari geçim sepeti ${nf(basket(),0)} ₺ · `
        +`ortalama kira ${nf(e.px.rent,0)} ₺ (maaşın ${pct(e.px.rent/Math.max(1,e.minWage)*100,0)}'i)`,
         e.minWage/Math.max(1,basket())<1.25?'var(--red)':
         e.minWage/Math.max(1,basket())<1.6?'#A9660B':'var(--green)')
   +chip('👴','En düşük aylık',nf(e.pension,0)+' ₺',
         `Dolar karşılığı $${nf(e.pension/e.usdtry,0)} · sepetin ${pct(e.pension/Math.max(1,basket())*100,0)}'ini karşılıyor`,
         e.pension/Math.max(1,basket())<0.95?'var(--red)':
         e.pension/Math.max(1,basket())<1.15?'#A9660B':'var(--green)')
   +chip('🗳','Oy',pct(sv),`Seçime ${(S.termEnd||TERM_M)-S.t} ay`,vCol)
   +chip('🌍','Ülke statüsü',nf(ST.score,0)+'/100',ST.tier.n,ST.tier.c);
}
export function renderTop(){
  $('#topDate').textContent=`${MONTHS[S.month-1]} ${S.year} · ${qOf(S.month)}. Çeyrek`;
  /* Seçim 48. ayın sonunda yapılır; sayaç 49/48 göstermemeli (geri bildirim 27). */
  const sonu=S.termEnd||TERM_M;
  $('#topOf').textContent=`${Math.min(S.t+1,sonu)}/${sonu}. AY`+((S.term||1)>1?` · ${S.term}. DÖNEM`:'');
  renderRes();
  const va=$('#vaultAmt'); if(va&&S.me){va.textContent=money(netWorth());
    va.parentElement.style.background=S.me.suspicion>55?'#E4A79A':S.me.suspicion>28?'#F0CE94':'#F0D9A4';}
  const rem=3-(S.t%3);
  $('#monthSub').textContent=MONTHS[S.month-1];
  $('#qSub').textContent=rem===1?'son ay':`${rem} ay birden`;
}
/* ═══════════════ KARAR SEPETİ ═══════════════
   Ayı kapatmadan önce o ay ne yaptığın tek listede durur: her karar bir
   satır, altında o kararın tahmini on iki aylık etkisi. Para politikası
   araçlarının etkisi sim/economy.js · draftImpacts'ten gelir — Para
   Politikası Kurulu panelindeki tabloyla aynı kaynak. Harcama paketlerinin
   etkisi karttaki hesabın aynısıdır (ui/cards.js).
   ═════════════════════════════════════════════ */
const BKI={rate:'🏦',comm:'🗣',guid:'🧭',api:'💧',zkTL:'🏛',zkFX:'💱',fx:'💵'};
export function renderBasket(){
  const d=S.draft,simple=S.opts.simple;
  const IMP=draftImpacts();
  const impOf=k=>{const x=IMP.find(i=>i.key===k);return x?x.v:null;};
  /* Etki hücresi: sade gösterimde yön okları, ayrıntılı gösterimde sayı.
     Kredide "iyi/kötü" yoktur, yalnızca yön vardır. */
  const cell=(lab,v,kind)=>{
    if(!isFinite(v)||Math.abs(v)<.02)return '';
    const good=kind==='n'?null:kind==='up'?v>0:v<0;
    return `<span>${lab}<b class="m ${good===null?'':good?'grn':'red'}">${
      simple?arrows(v*(kind==='pts'?1:2.4)):signed(v,kind==='pts'?1:2)}</b></span>`;};
  const mfx=v=>v?`<div class="bkr-fx">${cell('Enflasyon',v.inf)}${cell('Kredi',v.cr,'n')}${
    cell('Kur',v.fx)}${cell('İşsizlik',v.un)}</div>`:'';
  const rows=[];
  const row=(key,ico,ttl,sub,fx)=>rows.push(`<div class="bkr">
      <span class="bkr-i">${ico}</span>
      <div class="bkr-b"><b>${ttl}</b>${sub?`<small>${sub}</small>`:''}${fx||''}</div>
      <button class="bkr-x" data-r="${key}" title="Bu kararı geri al — ayarı yürürlükteki değerine döndürür"
        aria-label="${ttl} kararını geri al">↶ Geri al</button>
    </div>`);

  // ── para politikası ──
  const dr=d.rate-S.e.rate;
  if(Math.abs(dr)>=.05)row('rate',BKI.rate,`Politika faizi → ${pct(d.rate)}`,
    `yürürlükte ${pct(S.e.rate)} · ${signed(dr,2)} puan`,mfx(impOf('rate')));
  if(d.comm!==S.e.comm)row('comm',BKI.comm,`İletişim duruşu → ${commName(d.comm)}`,
    `yürürlükte ${commName(S.e.comm)}`,mfx(impOf('comm')));
  if(d.guidance!==S.e.guidance)row('guid',BKI.guid,`İleri yönlendirme → ${guidName(d.guidance)}`,
    `yürürlükte ${guidName(S.e.guidance)}`,mfx(impOf('guid')));
  if(d.api!==S.e.api)row('api',BKI.api,`APİ fonlaması → ${nf(d.api,0)} mlr ₺`,
    `yürürlükte ${nf(S.e.api,0)} mlr ₺`,mfx(impOf('api')));
  if(d.zkTL!==S.e.zkTL)row('zkTL',BKI.zkTL,`TL zorunlu karşılık → ${pct(d.zkTL,0)}`,
    `yürürlükte ${pct(S.e.zkTL,0)}`,mfx(impOf('zkTL')));
  if(d.zkFX!==S.e.zkFX)row('zkFX',BKI.zkFX,`YP zorunlu karşılık → ${pct(d.zkFX,0)}`,
    `yürürlükte ${pct(S.e.zkFX,0)}`,mfx(impOf('zkFX')));
  if(d.fx)row('fx',BKI.fx,d.fx>0?`${d.fx} mlr $ döviz satışı`:`${-d.fx} mlr $ döviz alımı`,
    `rezerv ${nf(S.e.reserves,0)} → ${nf(S.e.reserves-d.fx,0)} mlr $`,mfx(impOf('fx')));

  // ── harcama paketleri ve düzenlemeler ──
  d.policies.forEach(pl=>{
    const P=POL(pl.id), k=P.kind==='wage'?1:kOf(P,pl.amt);
    const fxr=P.kind==='wage'
      ? [['Alım gücü',+0.9,'up'],['Enflasyon',+0.09*pl.amt,'dn'],['Esnaf maliyeti',-0.5,'up']]
      : [['Talep',(P.fx.demand||0)*k*12*K.fiscalMult,'up'],
         ['Potansiyel büyüme',supplyPts((P.fx.supply||0)*k,pl.dur),'up'],
         ['Enflasyon',((P.fx.infl||0)+(P.fx.rent||0))*k*12,'dn']];
    row('pol:'+pl.id,P.ico,P.name,
      P.kind==='wage'?`ara zam %${pl.amt}`
      :P.kind==='reg'?`bütçesiz düzenleme · ${pl.dur} ay`
      :`${nf(pl.amt,0)} mlr ₺/ay × ${pl.dur} ay · toplam ${nf(pl.amt*pl.dur/1000,2)} trl ₺`,
      `<div class="bkr-fx">${fxr.map(([lab,v,kind])=>cell(lab,v,kind==='up'?'up':'pts')).join('')}</div>`);
  });

  const monthly=d.policies.reduce((a,pl)=>{const P=POL(pl.id);
    return a+(P.kind==='wage'||P.kind==='reg'?0:pl.amt*(P.kind==='save'?-1:1));},0);
  const F=fundingGap(0), room=(F.ceil+F.book.pct)/100*F.book.gdp;
  /* ── AYLIK DENGE ──
     Oyunun ekonomisi aylık yürür: sepetteki paketlerin aylık yükü dahil,
     bu ay kasaya ne giriyor, ne çıkıyor, ne kalıyor. */
  const AY=bookMonthly(monthly), PR=monthlyProgram();
  const br=draftBreaches(), act=activePledges();   // verilen sözler
  const done=Array.isArray(S.acts)?S.acts:[];
  const b=$('#basket');
  b.classList.toggle('full',rows.length>0||done.length>0);
  const hdr=$('#bkR');
  if(hdr)hdr.textContent=rows.length
    ?`${rows.length} karar bekliyor${done.length?` · ${done.length} yapıldı`:''}`
    :(done.length?`${done.length} hamle yapıldı`:'boş');
  const mAy=v=>nf(v,0)+' mlr ₺';
  b.innerHTML=`<div class="bk-sum ay">
      <div class="bk-sh">Bu ayın kasası<span>mlr ₺/ay</span></div>
      <div class="bk-sr"><span>Gelir</span><b class="m grn">+${mAy(AY.gelir)}</b></div>
      <div class="bk-sr"><span>Faiz gideri</span><b class="m red">−${mAy(AY.faiz)}</b></div>
      <div class="bk-sr"><span>Zorunlu giderler</span><b class="m red">−${mAy(AY.zorunlu)}</b></div>
      <div class="bk-sr" title="Yürürlükteki paketler ${nf(PR.aktif,0)} + sepettekiler ${nf(PR.sepet,0)} mlr ₺/ay"><span>Program gideri</span><b class="m ${PR.toplam>0?'org':'mut'}">${
        PR.toplam?'−'+mAy(PR.toplam):'—'}${PR.sepet?`<small class="mut"> (sepet ${nf(PR.sepet,0)})</small>`:''}</b></div>
      ${AY.garanti>0.5?`<div class="bk-sr"><span>YİD garantileri</span><b class="m red">−${mAy(AY.garanti)}</b></div>`:''}
      ${AY.kkm>0.5?`<div class="bk-sr"><span>Kur korumalı mevduat</span><b class="m red">−${mAy(AY.kkm)}</b></div>`:''}
      <div class="bk-sr tot"><span>AYLIK DENGE</span><b class="m ${AY.denge<0?'red':'grn'}">${
        AY.denge<0?'−':'+'}${mAy(Math.abs(AY.denge))}</b></div>
      <div class="bk-sr" title="Piyasanın finanse etmeye razı olduğu aylık açık, mevcut açık düşüldükten sonra. Yeni bir paketin aylık maliyeti buna sığmalı."><span>${
        AY.serbest<0?'Tavan aşıldı':'Aylık serbest alan'}</span><b class="m ${AY.serbest<0?'red':AY.serbest<AY.gelir*0.03?'org':'grn'}">${
        AY.serbest<0?'−'+mAy(-AY.serbest):mAy(AY.serbest)}</b></div>
    </div>`
    +(br.length
      ? `<div class="bk-pl">⚠ VERDİĞİN SÖZE AYKIRI — ${br.map(x=>`${x.t} (${x.left} ay kaldı)`).join(' · ')}:
          uygularsan güvenilirlik düşer, manşet olur</div>`
      : act.length
      ? `<div class="bk-vow">Yürürlükteki taahhüt: ${act.map(x=>`${x.t} (${x.left} ay)`).join(' · ')}</div>`
      : '')
    +(rows.length?`<div class="bk-undo">
        <span>${rows.length} karar bekliyor</span>
        <button class="bk-all" data-r="all" title="Sepetteki tüm kararları geri al: ayarlar yürürlükteki değerlerine döner, paketler çıkar">↶ TÜMÜNÜ GERİ AL</button>
      </div>`:'')
    +`<div class="bk-list">${rows.length?rows.join('')
      :`<div class="bk-e">Karar yok — ayı boş da geçebilirsin.<br>
         Soldaki panellerden faiz, paket ya da açıklama ekle; burada etkileriyle listelenir.</div>`}</div>`
    /* ── BU AY YAPILANLAR ──
       Sepettekiler henüz uygulanmadı; bunlar ise anında işledi (açıklama,
       hedef gösterme, af isteme, meydana müdahale…). Geri alınamaz, o yüzden
       × düğmesi yok — ay ilerleyince gazeteye düşerler. */
    +(done.length?`<div class="bk-done">
        <div class="bk-dh">Bu ay yapılanlar<span>${done.length}</span></div>
        ${done.map(x=>`<div class="bkd ${x.good===true?'ok':x.good===false?'no':''}">
          <span class="bkd-i">${x.ico}</span>
          <div class="bkd-b"><b>${x.t}</b>${x.s?`<small>${x.s}</small>`:''}</div>
        </div>`).join('')}
      </div>`:'');
  b.onclick=ev=>{const btn=ev.target.closest('[data-r]');if(!btn)return;const k=btn.dataset.r;
    /* Tümünü geri al: her ayar yürürlükteki değerine döner, paketler çıkar.
       Uygulanmış hamleler (Bu ay yapılanlar) geri alınamaz, onlara dokunmaz. */
    if(k==='all'){
      d.rate=S.e.rate;d.comm=S.e.comm;d.guidance=S.e.guidance;d.fx=0;
      d.api=S.e.api;d.zkTL=S.e.zkTL;d.zkFX=S.e.zkFX;d.policies=[];
      renderCards();renderMonetary();renderFx();renderBasket();return;}
    if(k==='rate')d.rate=S.e.rate;else if(k==='comm')d.comm=S.e.comm;
    else if(k==='guid')d.guidance=S.e.guidance;else if(k==='fx')d.fx=0;
    else if(k==='api'||k==='zkTL'||k==='zkFX')d[k]=S.e[k];
    else{d.policies=d.policies.filter(x=>x.id!==k.split(':')[1]);renderCards();}
    renderMonetary();renderFx();renderBasket();};
}
export function renderAll(){renderTop();renderStreet();renderStats();renderAdvisors();
  renderMonetary();renderFx();renderCards();renderSociety();renderSpeech();renderCharts();renderVault();renderPaper();renderBasket();layGrips();}
