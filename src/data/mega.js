import {activeSpendPct} from '../core/helpers.js';
import {$, K, S, clamp, nf, pct, supplyPts} from '../core/state.js';
import {POL, kOf, pRef} from './policies.js';
import {save} from '../sim/commit.js';

/* ═══════════════ YAP-İŞLET-DEVRET MEGA PROJELER ═══════════════
   Bütçeden tek kuruş çıkmaz: konsorsiyum yapar, işletir, sonunda devreder.
   Bedeli sonra gelir — işletmeye açıldığı ay başlayan, DÖVİZE ENDEKSLİ
   garanti ödemeleri. Lira değer kaybettikçe garanti bütçeyi yer.
   İnşaat yıllarında istihdam ve talep artar, ithal makine cari açığı büyütür.
   ══════════════════════════════════════════════════════════════ */
export const MEGA=[
 {id:'bridge',ico:'🌉',name:'Boğaz Geçişi ve Kuzey Otoyolu',build:30,gar:0.55,
  d:'Konsorsiyum köprüyü ve bağlantı otoyollarını yapar, 25 yıl işletir. Sözleşmede günlük araç garantisi var.',
  warn:'Açılışta yılda %0,55 GSYH garanti ödemesi başlar — dolara endeksli.',
  during:{demand:.55,unemp:-.020,current:-.030},
  after:{supply:.0026,demand:.10,current:.010},
  seg:{sme:.8,capital:1.6,minwage:.5}},
 {id:'airport',ico:'✈️',name:'Havalimanı ve Kargo Şehri',build:36,gar:0.48,
  d:'Dev terminal ve lojistik merkezi. İşletmeci yolcu garantisi karşılığında yatırımı üstlenir.',
  warn:'Açılışta yılda %0,48 GSYH yolcu garantisi başlar — dolara endeksli.',
  during:{demand:.48,unemp:-.018,current:-.034},
  after:{supply:.0030,current:.030,demand:.08},
  seg:{capital:1.8,sme:.5,youth:.6}},
 {id:'hospital',ico:'🏥',name:'Şehir Hastaneleri Programı',build:24,gar:0.62,
  d:'On iki ilde entegre sağlık kampüsü. Bina ve hizmet özel sektörde; devlet kira ve hizmet bedeli öder.',
  warn:'Açılışta yılda %0,62 GSYH kira + hizmet bedeli başlar — dolara endeksli, en pahalısı.',
  during:{demand:.42,unemp:-.014},
  after:{supply:.0016,nairu:-.0022,demand:.10},
  seg:{retiree:2.0,minwage:1.4,sme:.3}},
 {id:'nuclear',ico:'⚛️',name:'Nükleer Santral ve Enerji Koridoru',build:48,gar:0.50,
  d:'Yabancı ortakla kurulan santral ve iletim hattı. Uzun inşaat, ama enerji ithalatını kalıcı olarak kısar.',
  warn:'Açılışta yılda %0,50 GSYH alım garantisi başlar. İnşaat bu dönem bitmeyebilir.',
  during:{demand:.38,unemp:-.012,current:-.040},
  after:{supply:.0038,current:.055,infl:-.004,insure:.020},
  seg:{capital:1.5,sme:.4}}
];
export const MEG=id=>MEGA.find(x=>x.id===id);
export const megaOf=id=>(S.mega||[]).find(x=>x.id===id);
/* Bir mega proje şu an ihaleye çıkarılabilir mi? Çıkarılamıyorsa NEDEN? */
export function megaBlock(M){
  if(megaOf(M.id))return null;                       // zaten imzalı
  const e=S.e;
  const insaat=(S.mega||[]).filter(m=>!m.built).length;
  if(insaat>=2)return 'Aynı anda en fazla 2 şantiye yürütülebilir — biri bitsin.';
  if(e.cds>700)return `Risk primi ${nf(e.cds,0)} bp. Bu faizle hiçbir konsorsiyum 25 yıllık garanti sözleşmesi imzalamıyor (tavan 700 bp).`;
  if(e.credibility<20)return `Politika güvenilirliği ${nf(e.credibility,0)}/100. Yatırımcı "bu hükümet sözleşmeye sadık kalmaz" diyor (en az 20 gerekir).`;
  const yuk=megaGuarantee()+M.gar*(e.usdtry/42.10);
  if(yuk>2.6)return `Mevcut garanti yükü ${pct(megaGuarantee())} GSYH. Bu proje de eklenirse ${pct(yuk)} olur — Hazine taahhüt tavanını (%2,6) aşıyor.`;
  if(e.debt>85)return `Kamu borcu ${pct(e.debt)} GSYH. Bu borçla yeni koşullu yükümlülük altına girilemiyor.`;
  return null;
}

/* işletmedeki projelerin dövize endeksli garanti yükü (% GSYH, yıllık) */
export function megaGuarantee(){
  return (S.mega||[]).filter(m=>m.built)
    .reduce((a,m)=>a+MEG(m.id).gar*(S.e.usdtry/42.10),0);
}

/* sepetteki (henüz yürürlüğe girmemiş) paketlerin yıllık % GSYH yükü */
export function draftSpendPct(){
  const monthly=S.draft.policies.filter(pl=>POL(pl.id).kind==='spend'||POL(pl.id).kind==='save')
    .reduce((a,pl)=>a+pl.amt*(POL(pl.id).kind==='save'?-1:1),0);
  return (monthly*12/1000)/S.e.gdpNom*100;
}
/* ── MERKEZİ YÖNETİM BÜTÇESİ ──
   Rakamlar trilyon ₺/yıl. Gelir ve zorunlu giderler GSYH'ye oranlı
   yürür; oyuncunun paketleri bunun ÜSTÜNE biner. Açığın tamamı
   finanse edilemez — piyasanın kabul ettiği bir tavan var. */
/* ── GELİRİN TAHSİL ORANI ──
   Yüksek enflasyonda vergi geliri REEL olarak erir: tahakkuk ile tahsilat
   arasındaki gecikme boyunca para değer kaybeder (Tanzi etkisi). Harcama
   tarafı ise maaş ve aylıklarla anında endekslenir. Yani enflasyon
   bütçenin iki ucunu da aleyhine çalıştırır — disenflasyon, bütçeyi
   büyütmenin en güçlü yoludur. Üretken kapasite büyüdükçe (potansiyel
   büyüme) vergi tabanı da genişler. */
export function gelirPay(){
  const e=S.e;
  return 0.2085
    + chan('revenue')*0.11                                  // kayıt dışıyla mücadele, şeffaflık
    + clamp(e.gap,-2,2)*0.0028                              // konjonktür (dar bant: ödenek yıldan yıla zıplamasın)
    + Math.max(0,e.potGrowth-K.potBase)*0.0022              // büyüyen vergi tabanı
    - Math.max(0,e.inflation-10)*0.00078;                   // Tanzi: tahsilat erimesi
}
/* ── GÖREVE BAŞLANGIÇ FOTOĞRAFI ──
   Gelir–gider kalemleri NOMİNAL olarak enflasyonla kendiliğinden şişer;
   "ne değiştirdim" sorusunun cevabı ancak GSYH PAYI üzerinden okunur.
   Bu yüzden ilk ayın payları bir kez saklanır, sonra hep onunla
   karşılaştırılır. Eski kayıtlarda yoksa ilk açılışta kurulur. */
export function bookBase(){
  if(S.book0&&isFinite(S.book0.gelir))return S.book0;
  const b=budgetBook(0),g=Math.max(0.001,b.gdp);
  S.book0={gelir:b.gelir/g*100,faiz:b.faiz/g*100,zorunlu:b.zorunlu/g*100,
    emekli:b.emekli/g*100,program:b.program/g*100,garanti:b.garanti/g*100,
    kkm:b.kkm/g*100,denge:b.pct,yil:S.year};
  return S.book0;
}
/* Bugünkü kalemler, GSYH payı + başlangıca göre fark (puan). */
export function bookDelta(){
  const b=budgetBook(0),g=Math.max(0.001,b.gdp),b0=bookBase();
  const pay=k=>(k==='denge'?b.pct:b[k]/g*100);
  const out={};
  ['gelir','faiz','zorunlu','emekli','program','garanti','kkm','denge']
    .forEach(k=>{const v=pay(k);out[k]={v,d:v-(b0[k]||0),trl:k==='denge'?b.denge:b[k]};});
  out.gdp=b.gdp; out.yil=b0.yil;
  return out;
}
/* ── AYLIK GELİR–GİDER ──
   Bütçe yıllık kurulur ama ay ay yürür. Oyunun ekonomisi aylık denge
   üzerinden yönetilir: her kalemin AYLIK karşılığı (mlr ₺/ay) ve ay sonunda
   kasada kalan/eksilen para. extraAy = sepetteki paketlerin aylık yükü.

   serbest = piyasanın razı olduğu aylık açık tavanı eksi mevcut aylık açık.
   Bir paketin aylık maliyeti buna sığıyorsa hazine onu çevirebilir. */
export function bookMonthly(extraAy){
  const extraPct=extraAy?((extraAy*12/1000)/Math.max(0.001,S.e.gdpNom)*100):0;
  const b=budgetBook(extraPct);
  const ay=v=>v*1000/12;                       // trilyon ₺/yıl → mlr ₺/ay
  const m={gelir:ay(b.gelir),faiz:ay(b.faiz),zorunlu:ay(b.zorunlu),emekli:ay(b.emekli),
    program:ay(b.program),garanti:ay(b.garanti),kkm:ay(b.kkm),denge:ay(b.denge),
    gdp:b.gdp,pct:b.pct};
  m.gider=m.faiz+m.zorunlu+m.program+m.garanti+m.kkm;
  m.tavan=ay(finCeil()/100*b.gdp);             // finanse edilebilir aylık açık
  m.serbest=m.tavan+m.denge;                   // denge negatifse tavandan düşer
  return m;
}
/* Yürürlükteki + sepetteki paketlerin aylık yükü (mlr ₺/ay). */
export function monthlyProgram(){
  const akt=S.active.reduce((a,x)=>{const P=POL(x.id);
    return a+((!P||P.kind==='wage'||P.kind==='reg')?0:x.amt*(P.kind==='save'?-1:1));},0);
  const sep=S.draft.policies.reduce((a,pl)=>{const P=POL(pl.id);
    return a+((!P||P.kind==='wage'||P.kind==='reg')?0:pl.amt*(P.kind==='save'?-1:1));},0);
  return {aktif:akt,sepet:sep,toplam:akt+sep};
}
/* Bir paketin toplam bütçesi: aylık ödenek × süre (trilyon ₺). */
export const pkgTotal=(amt,dur)=>Math.max(0,amt)*Math.max(0,dur)/1000;

export function budgetBook(extraPct){
  const e=S.e, gdp=e.gdpNom;
  const gelir   = gdp*gelirPay();
  const faiz    = gdp*(e.debt/100)*(e.effRate/100)*0.35;
  // personel, sağlık, eğitim, savunma + emekli aylığı (zam turunda büyür)
  /* Emekli aylıkları GSYH'nin payı olarak ölçülür: aylık yalnızca
     enflasyon kadar artarsa bu pay sabit kalır. Enflasyon ÜSTÜ zam
     verirsen pay büyür ve bütçeyi kalıcı olarak daraltır. (Eskiden
     nominal aylık hem GSYH'yle hem kendisiyle çarpıldığı için kalem
     yıllar içinde kendiliğinden ikiye katlanıyordu.) */
  const emekli  = gdp*0.0295*clamp((e.pension/20000)/Math.max(0.2,e.pidx/100),0.55,2.4);
  const zorunlu = gdp*0.1789+emekli;
  const program = (activeSpendPct()+(extraPct||0))/100*gdp;
  const garanti = megaGuarantee()/100*gdp;          // YİD garanti ödemeleri
  const kkm     = Math.max(0,e.kkmCost||0)/100*gdp; // kur korumalı mevduat faturası
  const denge   = gelir-faiz-zorunlu-program-garanti-kkm;
  return {gdp,gelir,faiz,emekli,zorunlu,program,garanti,kkm,denge,pct:denge/gdp*100};
}

/* ═══════════════ YILLIK PROGRAM ÖDENEĞİ ═══════════════
   Gerçek bir bütçe yıllıktır: ocakta meclisten geçer, yıl içinde harcanır,
   bitince biter. Oyunda da öyle: her ocak bir "program ödeneği" kurulur
   (gelirden faiz, zorunlu giderler ve garanti ödemeleri düşüldükten sonra
   kalan + piyasanın finanse etmeye razı olduğu açık). Yürürlükteki her
   paket bu zarftan her ay pay yer. Zarf biterse yeni paket açılmaz —
   bir sonraki ocağı beklersin ya da tasarruf paketiyle yer açarsın.
   ══════════════════════════════════════════════════════ */
export function fyCap(){
  const e=S.e, gdp=e.gdpNom;
  const gelir   = gdp*gelirPay();
  const faiz    = gdp*(e.debt/100)*(e.effRate/100)*0.35;
  const emekli  = gdp*0.0295*clamp((e.pension/20000)/Math.max(0.2,e.pidx/100),0.55,2.4);
  const zorunlu = gdp*0.1789+emekli;
  const garanti = megaGuarantee()/100*gdp;
  const kkm     = Math.max(0,e.kkmCost||0)/100*gdp;
  /* Zorunlu kalemlerden sonra geriye kalan. Göreve başlarken bu NEGATİFTİR:
     gelir faizi ve zorunlu giderleri bile karşılamıyor. */
  const serbest = gelir-faiz-zorunlu-garanti-kkm;
  /* Program ödeneğinin tamamı borçlanmadan gelir; ama borçlanma tavanının
     önce mevcut açığı kapatması gerekir. Geriye kalan ince dilim, yıl
     boyunca başlatabileceğin TÜM programların bütçesidir. */
  return Math.max(0.03, serbest + finCeil()/100*gdp);
}
/* Yürürlükteki paketlerin bu yılın KALAN aylarında yiyeceği ödenek. */
export function fyCommitted(){
  const ay=fyMonthsLeft();
  return S.active.reduce((a,x)=>{const P=POL(x.id);
    if(!P||P.kind==='wage'||P.kind==='reg')return a;
    const kalan=Math.min(Math.max(0,x.dur-x.age),ay);
    return a+Math.max(0,x.amt)*kalan/1000;},0);
}
/* Yılın başında ödeneği kur; force=true ise (yeni oyun / göç) hemen kurar. */
export function fyReset(force){
  if(!S.fy)S.fy={year:0,cap:0,used:0};
  if(force||S.fy.year!==S.year||!S.fy.cap){
    S.fy={year:S.year,cap:fyCap(),used:0};
  }
}
/* Bu ay program kalemine çıkan para (trilyon ₺) ödenekten düşülür. */
export function fySpend(){
  if(!S.fy)fyReset(true);
  const ay=Math.max(0,activeSpendPct())/100*S.e.gdpNom/12;
  S.fy.used=(S.fy.used||0)+ay;
  return ay;
}
/* Yılın GERÇEKTEN serbest ödeneği: zarftan hem bu yıl harcanan hem de
   yürürlükteki paketlerin yıl sonuna kadar yiyeceği pay düşülür. */
export function fyOpen(){
  if(!S.fy)fyReset(true);
  return Math.max(0,(S.fy.cap||0)-(S.fy.used||0)-fyCommitted());
}
/* Yılın kalan ay sayısı */
export const fyMonthsLeft=()=>13-S.month;
/* Sepete eklenmek istenen paket yılın kalan ödeneğine sığıyor mu?
   Paket, yıl sonuna kadar kaç ay yürürse o kadar ödenek tüketir. */
export function fyFits(monthlyMlr){
  const ay=Math.max(0,monthlyMlr)/1000;                 // mlr ₺ → trilyon ₺
  return ay*fyMonthsLeft()<=fyOpen()+1e-9;
}
/* piyasanın finanse etmeye razı olduğu açık (% GSYH) */
export function finCeil(){
  const e=S.e;
  /* Piyasanın finanse etmeye razı olduğu açık. Taban Maastricht'in bir
     miktar üstünde; borç ve risk primi büyüdükçe daralır, güvenilirlik ve
     rezerv büyüdükçe genişler. İyi yönetim burada doğrudan ödenek kazandırır. */
  return clamp(5.72-Math.max(0,e.debt-45)*0.105-Math.max(0,e.cds-350)*0.0045
               +(e.credibility-45)*0.022+(e.reserves-120)*0.004,0.8,8);
}
/* Programların bugüne kadar getirdikleri — kart ve karne ekranı için.
   Motorun gerçekten kullandığı birikim fonksiyonuyla hesaplanır. */
export function progScore(a){
  const P=POL(a.id); if(!P)return null;
  const k=kOf(P,a.amt), n=a.age+1;   // kOf güncel fiyatlarla ölçer: reel erime dahil
  const rD=(P.ramp&&P.ramp.demand)||3, rS=(P.ramp&&P.ramp.supply)||3;
  const avg=(r)=>{let t=0;for(let i=0;i<n;i++)t+=clamp((i+1)/r,0,1);return t/n;};
  return {
    pot : supplyPts(k*(P.fx.supply||0)*avg(rS),n),
    gap : (P.fx.demand||0)*k*clamp(n/rD,0,1)*K.fiscalMult,
    inf : ((P.fx.infl||0)+(P.fx.rent||0))*k*clamp(n/rD,0,1)*12,
    un  : (P.fx.unemp||0)*k*clamp(n/rD,0,1)*12,
    spend:(P.kind==='wage'||P.kind==='reg')?0:a.amt*n*(P.kind==='save'?-1:1),
    months:n
  };
}

/* bir ayda kaç YENİ paket başlatılabilir — hükümetin idari kapasitesi */
export function newPkgCap(){
  const e=S.e;
  return e.credibility>62?3:e.credibility<28?1:2;
}
/* sepetteki hâliyle açık tavanı aşıyor mu? */
export function fundingGap(extraPct){
  const b=budgetBook((extraPct||0)+draftSpendPct());
  return {book:b, ceil:finCeil(), over:Math.max(0,-b.pct-finCeil())};
}
export const trn=v=>nf(v,2)+' trilyon ₺';

// tüm aktif paketlerin bir kanaldaki toplam katkısı (rampa dahil)
export function chan(key){
  let v=0;
  S.active.forEach(a=>{const P=POL(a.id);if(!P.fx||!P.fx[key])return;
    const r=P.ramp&&P.ramp[key==='supply'||key==='nairu'?'supply':'demand'] || 3;
    const ramp=clamp((a.age+1)/r,0,1);
    v+=kOf(P,a.amt)*P.fx[key]*ramp;});
  // mega projeler: inşaat hâlindeyken 'during', açıldıktan sonra 'after'
  (S.mega||[]).forEach(m=>{const M=MEG(m.id);if(!M)return;
    const src=m.built?M.after:M.during;
    if(!src||!src[key])return;
    const ramp=m.built?1:clamp((m.age+1)/6,0,1);
    v+=src[key]*ramp;});
  return v;
}

/* Asgari geçim sepeti (₺/ay) — sokaktaki gerçek fiyatlardan kurulur.
   Kira ağırlıklı, üstüne mutfak ve ulaşım. Emekli aylığı ve asgari
   ücret bu sepete göre "yetiyor / yetmiyor" oluyor. */
export function basket(){
  const x=(S.e&&S.e.px)||{};
  return (x.rent||18000)*0.80 + 30*(x.bread||15) + 3*(x.meat||640) + 45*(x.fuel||52);
}
