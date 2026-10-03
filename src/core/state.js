import {makeNews} from '../sim/economy.js';
/* ═══════════════════════════════════════════════════════════════
   AH BİR BAŞKAN OLSAM — ekonomi motoru v7
   Kalibrasyon kaynakları (bkz. sohbet):
   · Kur geçişkenliği: %10 devalüasyon → TÜFE'ye ~2,8 puan, 12 aya yayılı
     (kısa vadede ilk ay <%9'u). TCMB / literatür.
   · Asgari ücret: nominal %1 artış → 1 yılda TÜFE +0,06…0,12 puan
     (orta nokta 0,09). Ayrıca %1 asgari ücret → ortalama ücret %0,93.
   · Okun: Türkiye katsayısı gelişmiş ülkelerden büyük; çıktı açığı
     1 puan → işsizlik ~0,3 puan ters yönde.
   ═══════════════════════════════════════════════════════════════ */
export const SAVE_KEY='abbo_save_v8', INTRO_KEY='abbo_intro_v8';
export const TERM_M=48;
export const MONTHS=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
export const MSHORT=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];


/* ── kalibrasyon sabitleri ── */
export const K={
  neutralReal : 2.0,    // nötr reel faiz (%)
  potBase     : 3.0,    // temel potansiyel büyüme (%)
  nairuBase   : 9.2,    // yapısal işsizlik (%)
  fxPT        : 0.36,   // kümülatif kur geçişkenliği (12 ayda)
  okun        : 0.42,   // çıktı açığı 1 puan → işsizlik 0,42 puan
  phillips    : 0.50,   // çıktı açığı 1 puan → enflasyon 0,50 puan
  piStick     : 0.18,   // enflasyonun hedefe aylık yakınsama hızı (yapışkan)
  piBack      : 0.52,   // geriye dönük endeksleme payı (hibrit Phillips)
  worldInf    : 2.2,    // dünya enflasyonu — PPP trendi için
  wagePush    : 0.085,  // ücret-fiyat aktarımı (asgari ücret ölçütüne kalibre)
  mwSpill     : 0.93,   // asgari ücret → ortalama ücret geçişi
  creditSens  : 3.0,    // reel faiz 1 puan → kredi büyümesi -3,0 puan
  creditAdj   : 0.26,   // kredi kanalının aylık uyarlanma hızı
  rateExp     : 0.26,   /* reel faiz duruşunun beklentiye doğrudan etkisi (güven ağırlıklı).
                           Doyumlu: aşırı yüksek reel faiz orantılı ek kazanç getirmez. */
  fiscalMult  : 0.62,   // kamu harcaması 1 puan GSYH → çıktı açığı +0,62
  gapAdj      : 0.21,   // çıktı açığının aylık uyarlanması
  gdpNom0     : 78,     // başlangıç nominal GSYH (trilyon ₺/yıl)
  /* ── üretim kapasitesi ──
     supplyStock her ay chan('supply') kadar birikir, supplyDecay ile erir,
     supplyWear kadar kendiliğinden aşınır. Potansiyel büyümeye katkısı
     DOYUMLU bir eğriyle girer: iyi yürütülen bir yatırım programı
     potansiyeli %3,0'tan ~%5,2'ye çıkarır — daha fazlası değil. */
  supplyDecay : 0.9975,
  supplyWear  : 0.0050,
  supplyMax   : 2.45,   // potansiyel büyümeye yapılabilecek azami kalıcı katkı (puan)
  supplyHalf  : 0.95,   // bu stokta katkının yarısına ulaşılır
  potCap      : 5.6     // potansiyel büyüme tavanı (%)
};
/* supplyStock → potansiyel büyüme katkısı (puan). Doyumlu: ilk yatırımlar
   çok, üst üste binen onuncu program az getirir. Negatif stok (yıpranma)
   doğrusal cezalandırılır — bakımsızlık hızlı vurur. */
export const potBoost=s=>s>=0?K.supplyMax*s/(K.supplyHalf+s):Math.max(-2.6,s*1.9);
/* Bir programın N ay sürdürülmesi potansiyel büyümeye kaç puan katar?
   Kartlardaki ve tasarımcıdaki rakamlar bu fonksiyondan gelir — ekranda
   yazan sayı motorun gerçekten ürettiği sayıdır. */
export function supplyPts(perMonth,months){
  if(!perMonth)return 0;
  const n=Math.max(0,months||0);
  const stock=perMonth*(1-Math.pow(K.supplyDecay,n))/(1-K.supplyDecay);
  return potBoost(stock);
}

export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const nf=(v,d=1)=>Number(v).toLocaleString('tr-TR',{minimumFractionDigits:d,maximumFractionDigits:d});
export const pct=(v,d=1)=>'%'+nf(v,d);
export const signed=(v,d=1)=>(v>0?'+':v<0?'−':'')+nf(Math.abs(v),d);
export const arrows=v=>{const a=Math.abs(v),s=v>0?'↑':'↓';return a<.04?'—':a>.9?s+s:s;};
export const $=s=>document.querySelector(s);
export const lerp=(a,b,t)=>a+(b-a)*t;
export function mix(c1,c2,t){const h=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
  const[r1,g1,b1]=h(c1),[r2,g2,b2]=h(c2);
  return `rgb(${Math.round(lerp(r1,r2,t))},${Math.round(lerp(g1,g2,t))},${Math.round(lerp(b1,b2,t))})`;}
export const qOf=m=>Math.floor((m-1)/3)+1;
/* tohumlu rastgelelik — aynı oyun aynı şoklar */
export let RNG=1;
export const rnd=()=>((RNG=RNG*1103515245+12345&0x7fffffff)/0x7fffffff);
export const noise=a=>(rnd()-0.5)*2*a;

export function freshState(opts){
  RNG=Math.floor(Math.random()*1e9)||7;
  return{
  v:8,t:0,year:2026,month:1,opts,speaker:0,seed:RNG,cab:{},cabFires:0,sp:{used:{},month:-1,last:null,run:0},acts:[],actsPaper:[],book0:null,
  /* Kabineden biri baştan beri yanlış bilgi verir; kim olduğu her oyunda
     rastgele değişir. liarOut, kimliği açığa çıktıktan sonra true olur. */
  liar:['cb','fin','eco','lab','pr'][Math.floor(Math.random()*5)], liarOut:false,
  e:{ // fiyatlar & ücretler
      inflation:32.0,core:34.2,expect:26.5,pidx:100,wageIdx:100,realIncome:100,
      // reel ekonomi
      potential:100,gdpReal:100.4,gap:0.4,growth:3.4,potGrowth:3.0,supplyStock:0,
      unemployment:8.9,nairu:9.2,
      // para & finans
      rate:35.0,credit:28,api:0,zkTL:12,zkFX:25,fundRate:35.0,
      comm:'neutral',guidance:'none',guidancePledge:null,
      usdtry:42.10,reserves:148,cds:265,credibility:42,dollarization:38,
      // maliye
      pubBias:0,gdpNom:K.gdpNom0,budget:-5.2,primary:-1.6,effRate:33,debt:31.5,fxDebtShare:0.35,current:-2.4,
      kkmCost:0,
      // kur geçişkenliği kuyruğu (son 12 ayın kur değişimi)
      fxHist:[],wageHist:[],mwQ:[],
      /* Şok primleri: olaylar artık tek seferlik sıçrama değil, aylarca
         sönümlenen bir prim bırakır — enflasyon hedefine ve kura girer. */
      shock:{food:0,fuel:0,risk:0},
      /* Vitrin fiyatları — sokaktaki tabelalar bunları gösterir. */
      px:{bread:15,meat:640,fuel:52,rent:18000},
      /* Yılbaşı zam turunda belirlenen taban gelirler (₺/ay, net) */
      minWage:30000, pension:20000},
  wageYear:2026, araZamYear:0, protest:null, mega:[],
  /* Yıllık program ödeneği: her ocak yeniden kurulur, yıl içinde harcadıkça erir. */
  fy:{year:2026,cap:0,used:0,open:0},
  /* Programların bugüne kadar ne ürettiği — "Program karnesi" bunu okur. */
  deliver:{},
  /* Seçimi kazanırsan görev süresi uzar: termEnd bir dönem daha ileri gider. */
  term:1, termEnd:TERM_M, wins:0,
  shockCool:0, shockSeen:{}, pressSeen:{},
  /* Verilen sözler burada tutulur; fxSold ve hardCrack söz ihlalini ölçer. */
  pledges:[], fxSold:0, hardCrack:0, earlyCall:0,
  /* Ay içinde oluşan manşetler: makeNews listeyi baştan kurduğu için
     bunlar ayrı tutulur ve ayın haberlerinin başına eklenir. */
  flash:[],
  pub:{growth:3.4,unemployment:8.9,current:-2.4,label:'2025 4. çeyrek'},
  me:{cash:100000,salary:150000,tl:0,usd:0,gold:0,stock:0,usdPx:42.10,goldPx:100,stockPx:100,
      suspicion:0,heat:0,schemes:[],income:0,lastNet:100000,exposed:false,fakePoll:0,
      voteBoost:0,stockRet:0},
  p:{vote:51.0,unrest:34,integrity:62,morale:46},
  seg:{retiree:44,minwage:41,sme:52,capital:57,youth:39},
  segPrev:{retiree:44,minwage:41,sme:52,capital:57,youth:39},
  prev:null,qPrev:null,active:[],hist:[],log:[],news:[],
  draft:{policies:[],rate:35.0,api:0,zkTL:12,zkFX:25,comm:'neutral',guidance:'none',fx:0},lastAttr:{}};}
export let S=null;
/* ESM'de import edilen bağlantıya dışarıdan atama yapılamaz; durumu
   değiştiren tek kapı bu setter'lardır. */
export const setS=v=>{S=v;};
export const setRNG=v=>{RNG=v;};
