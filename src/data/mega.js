import {activeSpendPct} from '../core/helpers.js';
import {$, S, clamp, nf, pct} from '../core/state.js';
import {POL, kOf} from './policies.js';
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
export function budgetBook(extraPct){
  const e=S.e, gdp=e.gdpNom;
  const gelir   = gdp*(0.2085+chan('revenue')*0.11+e.gap*0.0038);
  const faiz    = gdp*(e.debt/100)*(e.effRate/100)*0.35;
  // personel, sağlık, eğitim, savunma + emekli aylığı (zam turunda büyür)
  const emekli  = gdp*0.0295*(e.pension/20000);
  const zorunlu = gdp*0.1655+emekli;
  const program = (activeSpendPct()+(extraPct||0))/100*gdp;
  const garanti = megaGuarantee()/100*gdp;          // YİD garanti ödemeleri
  const denge   = gelir-faiz-zorunlu-program-garanti;
  return {gdp,gelir,faiz,emekli,zorunlu,program,garanti,denge,pct:denge/gdp*100};
}
/* piyasanın finanse etmeye razı olduğu açık (% GSYH) */
export function finCeil(){
  const e=S.e;
  return clamp(6.4-Math.max(0,e.debt-45)*0.105-Math.max(0,e.cds-350)*0.0045
               +(e.credibility-45)*0.022+(e.reserves-120)*0.004,1.2,9);
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
