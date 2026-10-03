import {activeSpendPct} from '../core/helpers.js';
import {$, K, MSHORT, S, clamp, nf, noise, pct, potBoost, qOf, signed} from '../core/state.js';
import {cabGreen, cabMarked} from '../data/cast.js';
import {MEG, MEGA, basket, budgetBook, chan, finCeil, fyReset, fySpend, megaGuarantee} from '../data/mega.js';
import {deliverCheck} from './deliver.js';
import {POL, kOf} from '../data/policies.js';
import {protestCheck} from './protest.js';
import {insureLvl, mediaDamp, pubInflation, vaultMonth} from './vault.js';
import {shutCount} from '../ui/street.js';
import {checkPledges} from './pledges.js';

/* ═══════════════ PARA POLİTİKASI AKTARIMI ═══════════════
   Bu katsayılar hem aylık simülasyonun hem de Para Politikası panelindeki
   önizlemenin tek kaynağı. Burada değişen değer arayüzde de değişir;
   ikisi ayrı yazıldığında panel gerçekleşenden farklı bir tablo gösteriyordu. */
export const API_PT=150;    // 150 mlr ₺ APİ fonlaması ≈ 1 birim gevşeme
export const API_CRED=3.2;  // 1 birim gevşeme → kredi hedefi +3,2 puan
export const ZK_CRED=0.85;  // her puan TL zorunlu karşılık → kredi -0,85 puan
/* ortalama fonlama maliyeti: APİ likiditesi politika faizini efektif olarak aşağı çeker */
export const fundingRate=(rate,api)=>rate-clamp(api/API_PT,-4,12);
/* güvenilirlik faiz aktarımını güçlendirir */
export const credPass=()=>0.55+(S.e.credibility/100)*0.9;

/* ═══════════════ AYLIK SİMÜLASYON ═══════════════ */
export function stepMonth(){
  const e=S.e,p=S.p;
  S.prev=JSON.parse(JSON.stringify({e:S.e,p:S.p,seg:S.seg}));
  S.segPrev={...S.seg};
  const attr=S.lastAttr;
  const add=(k,src,v,note)=>{const a=attr[k];if(!a||!isFinite(v)||Math.abs(v)<1e-4)return;
    const f=a.find(x=>x[0]===src); if(f){f[1]+=v; if(note)f[2]=note;} else a.push([src,v,note||'']);};

  /* ---- 0) yürürlükteki paketlerin yaşı ---- */
  S.active.forEach(a=>a.age++);
  /* şok primleri yavaş sönümlenir: bir kuraklık ya da tarife şoku
     tek ayda geçmez, yıla yayılan bir iz bırakır */
  const sh=e.shock||(e.shock={food:0,fuel:0,risk:0});
  sh.food*=0.935; sh.fuel*=0.930; sh.risk*=0.915;
  const insD=1-insureLvl();                       // stratejik depolama şoku yumuşatır

  /* ---- 1) para politikası duruşu ---- */
  const realRate=e.rate-e.expect;
  const rGap=realRate-K.neutralReal;
  const credF=credPass();                          // güvenilirlik aktarımı güçlendirir

  /* ---- 2) kredi kanalı (faiz → kredi, yavaş) ---- */
  // APİ fonlaması efektif maliyeti düşürür; zorunlu karşılık kredi kapasitesini kısar
  const apiEase=e.api/API_PT;                               // 150 mlr ₺ ≈ 1 birim gevşeme
  const zkDrag=(e.zkTL-12)*ZK_CRED;                         // her puan TL ZK → kredi -0,85 puan
  e.fundRate=fundingRate(e.rate,e.api);                     // ortalama fonlama maliyeti
  const creditTgt=28-rGap*K.creditSens*credF+(e.credibility-45)*0.05+apiEase*API_CRED-zkDrag+chan('credit')*12;
  e.credit=clamp(e.credit+(creditTgt-e.credit)*K.creditAdj,-15,75);

  /* ---- 3) maliye itkisi ---- */
  const fiscal=activeSpendPct()*K.fiscalMult;

  /* ---- 4) çıktı açığı ---- */
  /* Kredi koşullarının talebe aktarımı. 20 puanlık bir kredi duruşu
     eskiden çıktı açığını yalnızca 1,5 puan kısıyordu — gerçek bir
     kredi durmasının etkisinin çok altında. Sıkılaşmanın bedeli de
     getirisi de bu katsayıdan geçer. */
  const gapTgt=clamp((e.credit-28)*0.105+fiscal+chan('demand')
      +(e.realIncome-100)*0.022-(e.cds-250)/380+noise(0.25),-9,7);
  const dGap=(gapTgt-e.gap)*K.gapAdj;
  e.gap=clamp(e.gap+dGap,-10,8);
  add('gap','Kredi koşulları',(e.credit-28)*0.105*K.gapAdj);
  add('gap','Kamu paketleri',(fiscal+chan('demand'))*K.gapAdj);

  /* ---- 5) potansiyel: yatırımın kalıcı birikimi ---- */
  /* Sermaye ve altyapı yıpranır: hiçbir şey yapmazsan potansiyel büyüme
     kendiliğinden düşer. Bir programı ayakta tutmak bile yatırım ister. */
  e.supplyStock=e.supplyStock*K.supplyDecay+chan('supply')-K.supplyWear;
  /* Doyumlu katkı: ilk yatırım programları potansiyeli hızla yükseltir,
     üst üste binen onuncu program neredeyse hiçbir şey eklemez. Böylece
     "her kartı aç" stratejisi artık %7-8 büyüme üretmiyor. */
  e.potGrowth=clamp(K.potBase+potBoost(e.supplyStock),1.2,K.potCap);
  // beceri aşınması: istihdam/eğitim programı yoksa yapısal işsizlik yükselir
  const nairuDrift=K.nairuBase+Math.max(0,S.t-6)*0.0075;
  e.nairu=clamp(e.nairu+((nairuDrift+chan('nairu')*10)-e.nairu)*0.035,6.0,14.0);
  e.potential*=(1+e.potGrowth/100/12);
  e.gdpReal=e.potential*(1+e.gap/100);

  /* ---- 6) kur ---- */
  const dolPress=(e.dollarization-35)*0.020;
  const caPress=Math.max(0,-e.current)*0.075;
  // göreli satın alma gücü paritesi: enflasyon farkı kadar nominal değer kaybı eğilimi
  const ppp=(e.inflation-K.worldInf)/12*0.78;
  // reel faiz cazibesi bunu kısmen dengeler ama tersine çeviremez (sınırlı carry)
  /* ── TAŞIMA GETİRİSİ ──
     Yüksek reel faiz lirayı destekler; bunun üst sınırı, enflasyon
     farkından doğan trend değer kaybını NÖTRLEMEK artı küçük bir marjdır.
     Böylece ciddi bir sıkılaşma kuru gerçekten durdurabilir (eskiden
     duramıyordu), ama kalıcı yüksek faiz lirayı yıllarca nominal olarak
     değerlendirip gerçeklikten kopmaz. */
  /* Pozitif tarafta aktarım güçlüdür: %50 enflasyonda %65 faiz gerçek
     dünyada da kuru durdurur. Üst sınır, trend değer kaybını nötrlemek
     artı küçük bir marj olduğu için düşük enflasyonda lira yıllarca
     nominal olarak değerlenip gerçeklikten kopmaz. Negatif tarafta
     (reel faiz eksi) etki daha yumuşak ama tek yönlüdür: lira kayar. */
  const carryRaw=rGap>0?clamp(rGap,0,26)*0.160*credF:rGap*0.085*credF;
  const carry=carryRaw>0?-Math.min(carryRaw,Math.max(0,ppp)+0.55):-carryRaw;
  const zkFXease=-(e.zkFX-25)*0.013;                        // YP ZK ↑ → döviz likiditesi sıkışır, kur baskısı ↓
  // kur korumalı mevduat gibi paketler kur baskısını doğrudan bastırır (fx kanalı)
  /* Rezerv eridikçe kuru savunacak mermi kalmaz: 30 mlr $ altında
     "ani duruş" primi devreye girer ve kareyle büyür. */
  const resStress=clamp((32-e.reserves)/32,0,1);
  const suddenStop=resStress*resStress*3.4;
  const riskP=(e.cds-250)/1100, polP=chan('fx')*12, shP=sh.risk*0.045;
  const caSur=-Math.max(0,e.current)*0.075;            // cari fazla lirayi destekler
  const fxN=noise(0.5);
  let fxP=clamp(ppp+carry+riskP+dolPress+caPress+caSur+zkFXease+polP
                +shP+suddenStop+fxN,-1.5,9.0);
  // müdahaleyle bastırılan kur baskısı geri gelir (yavaşça boşalır)
  let pentRel=0;
  if(e.fxPent){pentRel=e.fxPent*0.16; fxP+=pentRel; e.fxPent-=pentRel; if(e.fxPent<0.02)e.fxPent=0;}
  const fxOld=e.usdtry;
  e.usdtry=clamp(e.usdtry*(1+fxP/100),8,900);
  const fxC=(e.usdtry/fxOld-1)*100;
  // KKM: kur getirisi mevduat faizini aşarsa aradaki farkı hazine öder (GSYH %'si, yıllıklandırılmış)
  const kkmA=S.active.find(a=>a.id==='kkm');
  // kur getirisi mevduat faizini aşarsa farkı hazine öder — kur uçarsa fatura büyür
  const kkmCost=kkmA?Math.max(0,fxC-e.rate/12)*kOf(POL('kkm'),kkmA.amt)*2.4:0;
  e.fxHist.push(fxC); if(e.fxHist.length>12)e.fxHist.shift();
  /* ── Kurun "Neden?" kirilimi ──
     Buradaki kalemler fxP'nin GERCEK bilesenleridir; toplamlari aylik kur
     degisimine esittir (yalnizca sinirlayiciya takildiginda sapar). */
  add('usdtry','Enflasyon farkı (PPP)',ppp,
      `yıllık enflasyon ${pct(e.inflation)} · dünya ${pct(K.worldInf)} — fark kadar değer kaybı eğilimi`);
  add('usdtry','Reel faiz cazibesi',carry,
      `reel faiz ${pct(realRate)} · nötr ${pct(K.neutralReal)} · aktarım ${nf(credF,2)}×`);
  add('usdtry','Risk primi',riskP,`CDS ${nf(e.cds,0)} bp`);
  add('usdtry','Dolarizasyon',dolPress,`mevduatın ${pct(e.dollarization,0)}'i dövizde`);
  add('usdtry','Cari denge',caPress+caSur,`cari denge ${pct(e.current)} GSYH`);
  add('usdtry','YP zorunlu karşılık',zkFXease,`${pct(e.zkFX,0)}`);
  add('usdtry','Kuru bastıran paketler',polP,'kur korumalı mevduat vb.');
  add('usdtry','Küresel risk dalgası',shP,'');
  add('usdtry','Rezerv yetersizliği',suddenStop,
      e.reserves<32?`rezerv ${nf(e.reserves,0)} mlr $ — "ani duruş" primi devrede`:'');
  add('usdtry','Bastırılmış baskının boşalması',pentRel,'geçmiş müdahalelerin ertelediği değer kaybı');
  add('usdtry','Piyasa gürültüsü',fxN,'');

  /* ---- 7) ücretler (indeksleme + asgari ücret şoku) ---- */
  // yıllık nominal ücret artışı: beklenti + geçmiş enflasyon + verimlilik payı
  // Reel ücret verimlilikten kopamaz: sürdürülemez seviye zamanla geri çekilir.
  const riSustain=100*Math.pow(e.potential/100,0.55);
  /* ── REEL ÜCRET TELAFİSİ, İŞGÜCÜ PİYASASINA BAĞLIDIR ──
     Reel ücret uzun vadede verimlilikten kopamaz; ama telafi ancak
     çalışanın pazarlık gücü varken olur. İşsizlik yapısal seviyenin
     üstündeyse reel ücret yıllarca geride kalabilir — yüksek enflasyondan
     çıkışın gerçek ve acı mekanizması tam olarak budur.

     Eskiden bu terim sınırsızdı: alım gücü eridikçe ücret talebi
     patlıyor, ücret-fiyat sarmalı %46 enflasyonda kendi kendini
     besleyen bir dengeye oturuyor ve HİÇBİR faiz seviyesi onu
     kıramıyordu. Yani kötü başlayan bir oyun kurtarılamıyordu. */
  const slack=clamp(1-(e.unemployment-e.nairu)*0.40,0.15,1.20);
  const riPull=clamp(-(e.realIncome-riSustain)*0.32*slack,-6.0,4.2);
  const wageIdxTgt=e.expect*0.42+e.inflation*0.60+e.potGrowth*0.45+riPull;
  const wageMonthly=wageIdxTgt/12+chan('wage');
  e.wageIdx*=(1+wageMonthly/100);
  // asgari ücret şoku doğrudan wageIdx'e uygulandığı için 12 aylık artışı
  // endeks geçmişinden ölçüyoruz; aksi hâlde şok enflasyon kanalına hiç girmiyordu.
  if(!e.wageHist)e.wageHist=[];
  e.wageHist.push(e.wageIdx); if(e.wageHist.length>13)e.wageHist.shift();

  /* ---- 8) fiyatlar: Phillips + geçişkenlik + ücret ---- */
  const fx12=e.fxHist.reduce((a,b)=>a+b,0);                // son 12 ayın kur değişimi
  // Trend değer kaybı (enflasyon farkı) zaten beklentide fiyatlı; enflasyona ek katkıyı
  // yalnızca TREND ÜSTÜ değer kaybı yapar. Aksi hâlde döngü patlayıcı hâle geliyor.
  // Trendin TAMAMI nötrlenirse sarmal hiç tutuşmuyordu; %55'i fiyatlı sayılır.
  const fxExcess=fx12-(e.inflation-K.worldInf)*0.55;
  const fxPT=fxExcess*K.fxPT;                              // araştırma: %10 → ~2,8 puan
  const wage12=e.wageHist.length>12?(e.wageIdx/e.wageHist[0]-1)*100
                                   :(Math.pow(1+wageMonthly/100,12)-1)*100;
  const wagePush=(wage12-e.inflation-e.potGrowth*0.5)*K.wagePush;
  const rentRelief=chan('rent')*12;
  /* ── GERİYE DÖNÜK ENDEKSLEME GÜVENİLİRLİKLE ÇÖZÜLÜR ──
     Fiyatlayıcılar merkez bankasına inanmıyorsa geçen yılın enflasyonuna
     bakarak zam yapar (endeksleme) ve disenflasyon neredeyse imkânsız olur.
     İnandıklarında ileriye, yani HEDEFE bakmaya başlarlar. Literatürün
     tam da söylediği şey bu: güvenilirlik kazanmak, disenflasyonun
     maliyetini düşüren tek şeydir. Oyunda da öyle: güvenilirliği
     yükselttikçe aynı faizle çok daha hızlı iniyorsun. */
  const piBack=clamp(K.piBack-Math.max(0,(e.credibility-34)/100)*0.52,0.20,0.58);
  const shockPush=(sh.food*0.42+sh.fuel*0.26)*insD;
  const piTgt=(1-piBack)*e.expect+piBack*e.inflation
             +K.phillips*e.gap+fxPT+wagePush+chan('infl')*12+rentRelief+shockPush+noise(0.45);
  /* ── AŞAĞI YÖNLÜ KATILIK ──
     Ücretler ve etiketler nominal olarak kolay kolay düşmez. Çok sıkı
     politika enflasyonu sıfıra yaklaştırabilir, ama eksiye itemez: bu
     bölgede her ek puan sıkılaşma giderek daha az iş görür. Aksi hâlde
     aşırı sıkı bir duruş ekonomiyi deflasyona savuruyordu. */
  const piTgtAdj=piTgt<1.3?1.3-(1.3-piTgt)*0.32:piTgt;
  const dPi=(piTgtAdj-e.inflation)*K.piStick;
  e.inflation=clamp(e.inflation+dPi,0.4,400);
  e.core=clamp(e.core+(e.inflation-e.core)*0.30+chan('infl')*4,0.4,400);
  add('inflation','Çıktı açığı (talep)',K.phillips*e.gap*K.piStick,
      `çıktı açığı ${signed(e.gap)} puan · kredi büyümesi ${pct(e.credit,0)} · reel faiz ${pct(realRate)}`);
  add('inflation','Kur: trend üstü değer kaybı',fxPT*K.piStick,
      fxExcess>=0
        ?`son 12 ayda kur ${pct(fx12)} arttı — enflasyon farkının ${pct(fxExcess)} ÜSTÜNDE, bu enflasyonist`
        :`son 12 ayda kur ${pct(fx12)} arttı ama enflasyon farkının ${pct(-fxExcess)} ALTINDA kaldı; lira reel olarak değer kazandığı için bu kalem enflasyonu DÜŞÜRÜYOR`);
  add('inflation','Ücret baskısı',wagePush*K.piStick);
  add('inflation','Beklenti çıpası',(e.expect-e.inflation)*K.piStick);
  add('inflation','Destek paketleri',(chan('infl')*12+rentRelief)*K.piStick);
  add('inflation','Arz şokları',shockPush*K.piStick);

  // Yayımlanan enflasyon manipüle edilmişse sapma zamanla aşınır:
  // market fiyatları gerçeği gösterdiği için yalan uzun süre tutmaz.
  e.pubBias=(e.pubBias||0)*0.93;
  e.pidx*=(1+e.inflation/100/12);
  e.realIncome=clamp(e.wageIdx/e.pidx*100,40,155);

  /* ---- 8c) vitrin fiyatları: ekmek, et, benzin ----
     Manşet enflasyon taşıyıcı; her kalemin kendi şoku ve kendi destek
     paketi var. Sokaktaki tabela bu yüzden TÜİK'ten farklı davranabilir. */
  const actK=id=>{const a=S.active.find(x=>x.id===id);
    return a?kOf(POL(id),a.amt)*clamp((a.age+1)/3,0,1):0;};
  const foodRelief=actK('agri')*4.6+actK('vat')*5.2;
  const fuelRelief=actK('energy')*5.4+actK('energyStore')*1.5;
  if(!e.px)e.px={bread:15,meat:640,fuel:52};
  const px=e.px, mo=v=>v/1200;          // yıllık yüzde → aylık oran
  px.bread=clamp(px.bread*(1+mo(e.inflation+sh.food-foodRelief*0.55)),1,1e7);
  // et: yem + enerji maliyeti taşır, gıda şokuna daha duyarlı ve daha oynak
  px.meat =clamp(px.meat *(1+mo(e.inflation+sh.food*1.45-foodRelief*0.40+1.1)+noise(0.004)),1,1e8);
  // benzin: ağırlıklı ithal girdi — kur doğrudan pompaya yansır
  px.fuel =clamp(px.fuel *(1+mo(e.inflation*0.30+sh.fuel-fuelRelief)+fxC*0.62/100),1,1e7);
  /* Kira: serbest bırakılırsa konut talebi yüzünden enflasyonun ÜSTÜNDE
     artar. "Kira zam sınırı" yürürlükteyse tam enflasyon kadar artar —
     ne fazla ne eksik; bedeli arz tarafında birikir. */
  if(px.rent==null)px.rent=18000;
  const rentCapOn=S.active.some(a=>a.id==='rentcap');
  // konut arzı: sosyal konut ve kentsel dönüşüm kirayı gerçekten dizginler
  const konut=actK('housing')*3.4+actK('urban')*2.2;
  /* Uzun vadede kira TÜFE ile birlikte yürür; ekonomi ısındığında ve
     konut arzı yetişmediğinde üstüne çıkar. Asgari ücret yılda bir kez
     ayarlandığı için küçük bir sürüklenme bile yıllar içinde birikir. */
  const rentDrift=rentCapOn?0
    :Math.max(-2.0, 1.2+Math.max(0,e.gap)*0.6+Math.max(0,e.inflation-25)*0.05-konut);
  px.rent=clamp(px.rent*(1+mo(e.inflation+rentDrift)),100,1e9);

  /* ---- 9) beklenti: adaptif + çıpa, güvenilirlik ağırlıklı ---- */
  /* Çıpa BEDAVA DEĞİL: hedefe yakınsama ancak gerçek güvenilirlikle olur
     (kareyle ölçülür), ve çıpanın kendisi güven düşükken cari enflasyona kayar. */
  /* Çıpanın gücü güvenilirliğin KENDİSİDİR. Eskiden kareyle ölçülüyordu
     ve en iyi ihtimalle %6-7'de kalıyordu; yani beklenti neredeyse tamamen
     geçmişe bakıyor, enflasyon %17 civarında bir tabana oturuyordu. Artık
     kazanılmış güvenilirlik beklentiyi hedefe doğru gerçekten çekiyor. */
  const anchorW=0.030+Math.pow(clamp(e.credibility,0,100)/100,1.55)*0.30;
  const commFx=(e.comm==='hawkish'?-0.45:e.comm==='dovish'?0.60:0)*(0.5+e.credibility/200);
  const anchorLvl=5+(e.inflation-5)*(1-e.credibility/100)*0.90;
  /* Derin negatif reel faiz beklentiyi doğrudan koparır: kimse liraya
     bağlı kalmaz, fiyatlama dövize ve geçmiş enflasyona geçer. */
  const deAnchor=Math.max(0,-realRate)*0.55;
  /* ── DURUSUN BEKLENTIYE DOGRUDAN ETKISI ──
     Pozitif ve kararli reel faiz beklentiyi asagi ceker; gucu guvenilirlige
     baglidir. Eskiden faizin beklentiye tek etkisi "negatifse kopar" idi,
     bu yuzden sikilasmanin enflasyona etkisi neredeyse gorunmuyordu. */
  const stance=-clamp(rGap,-6,14)*K.rateExp*credF
               -(e.guidance==='tight'?0.35:e.guidance==='loose'?-0.40:0)*credF;
  /* ── BEKLENTİ YÖNE DE BAKAR ──
     Fiyatlayıcılar yalnızca bugünkü seviyeye değil, son aylardaki EĞİME
     bakar: enflasyon aylardır düşüyorsa bunu bir patikaya çevirirler,
     aylardır artıyorsa paniğe. Disenflasyonun kendi kendini hızlandıran
     kısmı budur — ve kötü başlamış bir oyunu toparlanabilir kılan şey de
     budur: ilk birkaç puanı kırdığında gerisi kolaylaşır. Aynı mekanizma
     ters yönde de işler; bırakırsan çöküş de hızlanır. */
  const h6=S.hist.length>=6?S.hist[S.hist.length-6]:null;
  const trend=h6?clamp((e.inflation-h6.inflation)/6,-1.8,1.8):0;
  /* Asimetrik ve sönümlü: panik (yukarı yön) disenflasyon coşkusundan
     daha güçlüdür, ve hedefe yaklaştıkça ekstrapole edilecek bir şey
     kalmaz — aksi hâlde iyi yönetilen bir ekonomi deflasyona savruluyordu. */
  const momentum=clamp(trend*2.2*(0.45+e.credibility/140),-2.0,3.0)
                *clamp((e.inflation-4)/8,0,1);
  const expTgt=(1-anchorW)*e.inflation+anchorW*anchorLvl+deAnchor+stance+momentum;
  e.expect=clamp(e.expect+(expTgt-e.expect)*0.13+commFx/3,0.4,320);
  add('inflation','Beklentinin kopması',deAnchor*0.13*K.piStick,
      realRate<0?`reel faiz ${pct(realRate)} — kimse lirada kalmıyor`:'');
  add('inflation','Enflasyonun yönü (momentum)',momentum*0.13*K.piStick*(1+K.piBack),
      trend<-0.05?`enflasyon son 6 ayda düşüyor — fiyatlayıcılar patikayı izlemeye başladı`
      :trend>0.05?`enflasyon son 6 ayda artıyor — beklentiler yukarı kayıyor`:'');
  add('inflation','Para politikası duruşu',stance*0.13*K.piStick*(1+K.piBack),
      `reel faiz ${pct(realRate)} (nötr ${pct(K.neutralReal)}) · aktarım gücü ${nf(credF,2)}× · ${guidName(e.guidance)}`);

  /* ---- 10) işsizlik: Okun + NAIRU ---- */
  const uTgt=e.nairu-K.okun*e.gap+chan('unemp')*12;
  const dU=(uTgt-e.unemployment)*0.19;
  e.unemployment=clamp(e.unemployment+dU,3.0,30);
  add('unemployment','Çıktı açığı (Okun)',-K.okun*e.gap*0.19);
  add('unemployment','İstihdam paketleri',chan('unemp')*12*0.19);
  add('unemployment','Yapısal seviye',(e.nairu-e.unemployment)*0.19);

  /* ---- 11) dolarizasyon döngüsü ---- */
  const dolTgt=clamp(38-realRate*1.8+(e.cds-250)*0.035-(e.credibility-45)*0.20-(e.zkFX-25)*0.22+chan('dollar')*12,12,82);
  e.dollarization=clamp(e.dollarization+(dolTgt-e.dollarization)*0.09,10,85);

  /* ---- 12) maliye: nominal GSYH, açık, borç ---- */
  e.gdpNom*=(1+(e.potGrowth/100+e.gap/100*0.15)/12)*(1+e.inflation/100/12);
  // borçlanma maliyeti yavaş uyarlanır (ortalama vade ~3 yıl)
  e.effRate=e.effRate+((e.rate*0.85+(e.cds-250)/70)-e.effRate)*0.045;
  /* ── TEK BIR BUTCE RAKAMI ──
     Daha once iki ayri hesap vardi (e.budget ve budgetBook); ekranda
     birbirini tutmayan iki acik gorunuyordu. Artik tek kaynak var:
     merkezi yonetim butce defteri. e.budget dogrudan ondan okunur. */
  e.kkmCost=kkmCost;
  const book=budgetBook(0);
  const interest=book.faiz/book.gdp*100;               // % GSYH, yillik faiz gideri
  e.primary=book.pct+interest;                          // birincil denge
  e.budget=clamp(book.pct,-22,6);
  // borç dinamiği: (r − g)·d + birincil açık + kur etkisi (döviz cinsi borç)
  const rMinusG=(e.effRate-e.inflation-e.potGrowth)/100/12;
  e.debt=clamp(e.debt*(1+rMinusG)-e.primary/12+kkmCost/12+e.debt*e.fxDebtShare*(fxC/100),8,250);

  /* ---- 12b) finansman baskısı ----
     Tavanın üstündeki her puan açık, borçlanmayı pahalılaştırır:
     piyasa fonlamayı kısar, risk primi ve faiz gideri zıplar. */
  /* Kuru rezervle savunmak güven kazandırmaz: piyasa bunu zayıflık okur.
     Müdahale sürdükçe küçük ama kalıcı bir itibar kaybı birikir. */
  if(e.fxPent>0.3){e.credibility=clamp(e.credibility-0.35,3,97);e.fxPentHit=1;}
  const fOver=Math.max(0,-e.budget-finCeil());
  if(fOver>0){
    /* Tavanın aşılması pahalıdır ama sarmala dönmemeli: eskiden her ay
       hem faizi hem güvenilirliği birlikte vuruyor, yüksek enflasyondan
       çıkmaya çalışan bir hükümet maliye tarafından boğuluyordu. */
    e.effRate+=fOver*0.40;                       // ihalede talep yok, faiz yukarı
    e.credibility=clamp(e.credibility-fOver*0.18,3,97);
    e.reserves=clamp(e.reserves-fOver*0.40,5,400);
    add('credibility','Finansman tavanı aşıldı',-fOver*0.18,
        `bütçe açığı ${pct(-e.budget)} · piyasanın razı olduğu tavan ${pct(finCeil())}`);
  }

  /* ---- 13) risk primi ---- */
  const resAdq=clamp(e.reserves/90,0.2,2);
  const resGap=Math.max(0,2-resAdq);                 // konveks: rezerv bitince prim patlar
  /* Kararli pozitif reel faiz risk primini GERCEKTEN dusurur: yabanci
     yatirimci tasima getirisini fiyatlar. Soka faiz artisiyla cevap vermek
     eskiden hicbir seyi degistirmiyordu — artik odulu var. */
  const rT=130+Math.max(0,e.debt-30)*3.2+Math.max(0,-e.budget-3)*15
          +Math.max(0,-realRate)*9+Math.max(0,60-p.integrity)*1.5
          +Math.max(0,55-e.credibility)*1.1+resGap*resGap*58+sh.risk*9+fOver*46
          -clamp(realRate-K.neutralReal,0,12)*5.2*credF;
  e.cds=clamp(e.cds+(rT-e.cds)*0.12+noise(6),80,1500);

  /* ---- 14) güvenilirlik (söz tutma dahil) ---- */
  // güvenilirlik SONUÇLA kazanılır: enflasyon yüksekken tavan düşüktür
  /* ── GUVENILIRLIGIN HESABI ARTIK ACIK ──
     Her kalem adiyla kaydedilir; ceyrek raporundaki "Neden?" dugmesi
     bunlari gosterir. Eskiden guvenilirlik sebepsizce eriyor goruniyordu. */
  /* Son 12 ayda enflasyonu gerçekten düşürdün mü? Güvenilirlik SÖZLE değil
     SİCİLLE kazanılır. Bu kalem, kötü başlayan bir oyunun toparlanmasını
     mümkün kılan şeydir: doğru adımlar sonuç verdikçe güven artar, güven
     arttıkça aynı adımlar daha çok sonuç verir. */
  const h12c=S.hist.length>=12?S.hist[S.hist.length-12]:null;
  const disinf=h12c?clamp(h12c.inflation-e.inflation,-6,12):0;
  const CR=[
    ['Disenflasyon sicili',disinf*1.85,
     disinf>0.5?`son 12 ayda enflasyon ${nf(disinf,1)} puan düştü — piyasa artık izliyor`
     :disinf<-0.5?`son 12 ayda enflasyon ${nf(-disinf,1)} puan ARTTI — verdiğin patika tutmadı`:''],
    ['Reel faizin işareti',realRate>0?13:-8,`reel faiz ${pct(realRate)}`],
    ['Enflasyon beklentiyi tutturuyor mu',clamp(e.expect-e.inflation,-5,7)*1.25,
     `enflasyon ${pct(e.inflation)} · beklenti ${pct(e.expect)}`],
    ['İletişim duruşu',e.comm==='hawkish'?4:e.comm==='dovish'?-5:0,commName(e.comm)],
    /* Seviye cezası hafifletildi. Eskiden %27 enflasyonda tek başına
        −9 puan yazıyor, güvenilirliği 35'in üstüne çıkmak imkânsız
        oluyordu: çıpa hiç kurulmuyor, enflasyon da düşmüyordu. Artık
        güvenilirliği SEVİYE değil, SİCİL belirliyor — düşürdüğün her
        puan sana geri dönüyor. */
    ['Enflasyonun seviyesi',-Math.max(0,e.inflation-12)*0.34,
     `%12 eşiğinin ${nf(Math.max(0,e.inflation-12),1)} puan üstünde`],
    ['Risk primi',-Math.max(0,e.cds-300)*0.02,`CDS ${nf(e.cds,0)} bp`],
    ['Duruş tutarsızlığı (APİ)',-Math.max(0,(e.rate-e.fundRate)-1.5)*3.4,
     `politika faizi ${pct(e.rate)} ama ortalama fonlama ${pct(e.fundRate)} — APİ ${nf(e.api,0)} mlr ₺ ile likidite bol`],
    ['Kredi balonu',-Math.max(0,e.credit-45)*0.22,`kredi büyümesi ${pct(e.credit,0)}`],
    ['Kurumsal paketler',chan('cred')*26,'şeffaflık ve tasarruf programları'],
  ];
  const credTgt=clamp(34+CR.reduce((a,x)=>a+x[1],0),3,92);
  let dC=(credTgt-e.credibility)*0.035;
  /* Kirilim: her kalemin bu AYKI guvenilirlik degisimine katkisi.
     Taban 34 ile bugunku seviye arasindaki fark "yakinsama" satirina yazilir. */
  CR.forEach(([n,v,note])=>add('credibility',n,v*0.035,note));
  add('credibility','Bugünkü seviyeden yakınsama',(34-e.credibility)*0.035,
      `hedef seviye ${nf(credTgt,0)}/100 · bugün ${nf(e.credibility,0)}/100`);
  if(cabGreen()){dC-=0.22*cabGreen();
    add('credibility','Uyum dönemindeki bakanlar',-0.22*cabGreen(),
        `${cabGreen()} bakan göreve yeni başladı — kurumsal hafıza aşınıyor`);}
  if(cabMarked()){dC-=0.18*cabMarked();
    add('credibility','Hedef gösterilen bakanlar',-0.18*cabMarked(),
        `${cabMarked()} bakan kamuoyunda hedefte — kurumunu savunamıyor`);}
  if(e.fxPentHit){add('credibility','Rezervle kur savunması',-0.35,
      'piyasa müdahaleyi zayıflık okuyor');e.fxPentHit=0;}
  if(e.guidancePledge&&e.guidancePledge.broken){dC-=4.0;e.guidancePledge.broken=false;
    add('credibility','İleri yönlendirme sözü çiğnendi',-4.0,'verdiğin patikadan sapıldı');}
  e.credibility=clamp(e.credibility+dC,3,97);

  /* ---- 15) rezerv & cari denge ---- */
  /* Cari denge tek ayda siframaz: ticaret akimlari yavas doner. Hedefe
     dogru kademeli yurur (eskiden her ay yeniden atandigi icin tek
     ceyrekte -%2,4'ten +%0,1'e ziplayabiliyordu). */
  const curTgt=clamp(-1.0-e.gap*0.55+fx12*0.045-Math.max(0,e.credit-30)*0.03+chan('current')*12,-12,6);
  e.current=clamp(e.current+(curTgt-e.current)*0.19,-12,6);
  e.reserves=clamp(e.reserves+(e.current>0?0.9:-0.35)-Math.max(0,fxC)*0.30
                   +(e.cds<300?0.45:-0.25)+(e.zkFX-25)*0.085,5,400);

  /* ---- 16) hanehalkı: reel gelir + moral ---- */
  /* chan('morale'): bazı paketler doğrudan moral üretir ya da yakar
     (savunma sanayii gururu, sınav sistemi kaosu). */
  const moraleTgt=clamp(50+(e.realIncome-100)*1.15-Math.max(0,e.inflation-12)*0.55
                        -Math.max(0,e.unemployment-8)*2.4+e.gap*1.1+chan('morale')*10,2,98);
  p.morale=clamp(p.morale+(moraleTgt-p.morale)*0.16,2,98);

  /* ---- 17) SEÇMEN GRUPLARI ----
     Her grubun memnuniyeti adlandırılmış sürücülerden gelir; hem toplamı
     uygulanır hem de gerekçesi S.segWhy'a yazılır ki Halk panelinde
     "neden mutlu / neden mutsuz" okunabilsin. */
  const pubInf=pubInflation();                 // halkın gördüğü enflasyon
  const bsk=basket();
  const pensR=e.pension/bsk, mwR=e.minWage/bsk;          // aylık / asgari geçim
  const rentPens=e.px.rent/Math.max(1,e.pension);        // kira, aylığın kaçta kaçı
  const rentMw  =e.px.rent/Math.max(1,e.minWage);
  const hastane =(S.mega||[]).some(m=>m.id==='hospital'&&m.built);
  /* Kontrol altındaki medya ekonomiyi düzeltmez, algıyı düzeltir: haberi
     oradan alan kesim tabloyu daha iyi görür. Gençler başka kanallardan
     beslendiği için aynı anlatıya inanmaz, hatta tepki duyar. */
  const medya=mediaDamp();
  const fx0s=(S.hist[0]&&S.hist[0].usdtry)||42.10;
  const fxRealC=(e.usdtry/fx0s)/Math.max(0.2,e.pidx/100);   // reel kur (rekabetçilik)
  const SW={};                                           // gerekçe defteri
  const drv=(k,label,v,note)=>{
    if(!SW[k])SW[k]=[];
    if(Math.abs(v)>0.004)SW[k].push([label,+v.toFixed(3),note]);
    return v;};
  const bump=(k,v)=>{S.seg[k]=clamp(S.seg[k]+v,2,98);};

  /* EMEKLİLER — sabit gelirli, kiracı, enflasyona en açık grup */
  bump('retiree',
      drv('retiree','Emekli aylığının alım gücü',clamp((pensR-1.08)*3.0,-1.7,1.2),
          `aylık ${nf(e.pension,0)} ₺ · asgari geçim sepeti ${nf(bsk,0)} ₺ (${pct(pensR*100,0)} karşılıyor)`)
    + drv('retiree','Mutfak enflasyonu',-Math.max(0,pubInf-12)*0.040,
          `açıklanan enflasyon ${pct(pubInf)} · ekmek ${nf(e.px.bread,2)} ₺ · kıyma ${nf(e.px.meat,0)} ₺`)
    + drv('retiree','Kira yükü',-clamp((rentPens-0.88)*0.70,0,1.2),
          `kira ${nf(e.px.rent,0)} ₺ — aylığının ${pct(rentPens*100,0)}'i`)
    + drv('retiree','Sağlık hizmetine erişim',hastane?0.26:0,
          hastane?'şehir hastaneleri açıldı, sıra ve nakil derdi azaldı':'')
    + drv('retiree','Yönelik destek paketleri',chan('seg_retiree'),'emekli ek desteği, gıda ve enerji yardımı')
    + drv('retiree','Haber gündemi',medya*0.42,
          medya>=1?'havuz medyası: kötü haber ekrana gelmiyor':medya>0?'basın baskı altında, olumsuz haber azaldı':'')
    + drv('retiree','Alışkanlık / taban destek',0.55,'kemik oy: tabloya rağmen yavaş erir'));

  /* ASGARİ ÜCRETLİLER — maaş sepete yetiyor mu, işini koruyor mu */
  bump('minwage',
      drv('minwage','Asgari ücretin alım gücü',clamp((mwR-1.55)*2.2,-1.8,1.2),
          `net ${nf(e.minWage,0)} ₺ · asgari geçim sepeti ${nf(bsk,0)} ₺`)
    + drv('minwage','Mutfak enflasyonu',-Math.max(0,pubInf-12)*0.045,
          `açıklanan enflasyon ${pct(pubInf)}`)
    + drv('minwage','Kira yükü',-clamp((rentMw-0.58)*0.75,0,1.1),
          `kira ${nf(e.px.rent,0)} ₺ — maaşının ${pct(rentMw*100,0)}'i`)
    + drv('minwage','İş güvencesi',-Math.max(0,e.unemployment-9)*0.10,
          `işsizlik ${pct(e.unemployment)}`)
    + drv('minwage','Yönelik destek paketleri',chan('seg_minwage'),'sosyal yardım, enerji ve gıda desteği')
    + drv('minwage','Haber gündemi',medya*0.30,
          medya>0?'ekranda tablo olduğundan iyi görünüyor':'')
    + drv('minwage','Alışkanlık / taban destek',0.42,''));

  /* GENÇLER — iş bulmak, kira ödemek, gelecek görmek */
  bump('youth',
      drv('youth','İş bulma umudu',-Math.max(0,e.unemployment-8)*0.200
          +Math.max(0,8-e.unemployment)*0.12,`işsizlik ${pct(e.unemployment)}`)
    + drv('youth','Kira ve ilk ev',-clamp((rentMw-0.55)*0.85,0,1.2),
          `ortalama kira ${nf(e.px.rent,0)} ₺ · asgari ücretin ${pct(rentMw*100,0)}'i`)
    + drv('youth','Geleceğe dair umut',clamp((e.potGrowth-3)*0.35,-0.7,0.8),
          `potansiyel büyüme ${pct(e.potGrowth)} — eğitim, teknoloji ve altyapı yatırımı`)
    + drv('youth','Hukuk ve şeffaflık',(p.integrity-55)*0.012,
          `şeffaflık ${nf(p.integrity,0)}/100`)
    + drv('youth','Yönelik paketler',chan('seg_youth'),'genç istihdam, mesleki eğitim, teknoloji programı')
    + drv('youth','Basın özgürlüğü',-medya*0.34,
          medya>=1?'medya havuzu: gençler anlatıya inanmıyor':medya>0?'basına baskı gençlerde tepki üretiyor':'')
    + drv('youth','Alışkanlık / taban destek',0.55,''));

  /* ESNAF & KOBİ — kasa dönüyor mu, kredi ve kira ne durumda */
  bump('sme',
      drv('sme','Kasadaki ciro',e.gap*0.120,`çıktı açığı ${signed(e.gap)} puan — talep ${e.gap>0?'canlı':'zayıf'}`)
    + drv('sme','Krediye erişim',(e.credit-20)*0.014,`kredi büyümesi ${pct(e.credit)}`)
    + drv('sme','Finansman maliyeti',-Math.max(0,e.rate-30)*0.020,`politika faizi ${pct(e.rate)}`)
    + drv('sme','Dükkân kirası ve maliyetler',-clamp((e.px.rent/18000/Math.max(0.2,e.pidx/100)-1)*0.9,0,0.9),
          `kira reel olarak ${pct((e.px.rent/18000/Math.max(0.2,e.pidx/100)-1)*100,0)} değişti`)
    + drv('sme','Yönelik paketler',chan('seg_sme'),'KGF, kayıt dışıyla mücadele, tarımsal girdi desteği')
    + drv('sme','Alışkanlık / taban destek',0.26,''));

  /* SANAYİCİ — öngörülebilirlik, finansman, rekabetçi kur */
  bump('capital',
      drv('capital','Öngörülebilirlik',(e.credibility-45)*0.030,
          `politika güvenilirliği ${nf(e.credibility,0)}/100`)
    + drv('capital','Talep ve kapasite kullanımı',e.gap*0.070,`çıktı açığı ${signed(e.gap)} puan`)
    + drv('capital','Finansman / risk primi',-(e.cds-250)*0.0060,`CDS ${nf(e.cds,0)} bp`)
    + drv('capital','Kurun rekabetçiliği',clamp((fxRealC-1)*1.6,-1.2,0.7)
          -Math.max(0,fxRealC-1.35)*3.2,
          `reel kur ${nf(fxRealC,2)} — ${fxRealC>1.35?'kontrolsüz değer kaybı, ithal girdi yakıyor'
            :fxRealC>1.02?'ihracatçı için elverişli':'TL pahalı, ihracat zorlanıyor'}`)
    + drv('capital','İşgücü maliyeti',-clamp((mwR-1.55)*0.9,-0.4,1.0),
          `asgari ücret ${nf(e.minWage,0)} ₺`)
    + drv('capital','Yönelik paketler',chan('seg_capital'),'sanayi teşviki, kurumlar vergisi, teknoloji programı')
    + drv('capital','Alışkanlık / taban destek',0.22,''));

  S.segWhy=SW;

  /* ---- 18) huzursuzluk ---- */
  /* chan('unrest'): güvenlik ödeneği sokağı yatıştırır, sınav reformu
     gibi doğrudan insanı etkileyen düzenlemeler tersine çalışır. */
  const uT=clamp(16+Math.max(0,pubInf-10)*0.62+Math.max(0,e.unemployment-7)*1.8
                 -e.gap*0.9+Math.max(0,60-p.integrity)*0.32-(p.morale-50)*0.25-mediaDamp()*9
                 +chan('unrest')*10,3,99);
  p.unrest=clamp(p.unrest+(uT-p.unrest)*0.11,3,99);

  /* ---- 19) oy: NÜFUS AĞIRLIKLI (önceki sürümde eksikti) ---- */
  const W={retiree:.19,minwage:.31,sme:.22,capital:.09,youth:.19};
  const wAvg=Object.keys(W).reduce((a,k)=>a+S.seg[k]*W[k],0);
  /* ── OY POTANSİYELİ ──
     Halk yedi şeye bakar: mutfak (enflasyon), dolar, maaşın alım gücü,
     iş bulmak (işsizlik), sokağın havası, devletin cebi (rezerv) ve
     büyüme. Taban 50 — ortalama bir tablo seçimi başa baş bitirir.
     Katsayılar dar tutuldu ki oy zıplamasın; ama saçma hamlelerin
     (sıfır faiz, rezervi bitirmek, kuru uçurmak) cezası konveks. */
  const fx0=(S.hist[0]&&S.hist[0].usdtry)||42.10;
  const fxReal=(e.usdtry/fx0)/Math.max(0.2,e.pidx/100);   // 1 = enflasyon kadar değer kaybı
  /* Enflasyon oyun en sert cezası: mutfak herkesi aynı anda vurur.
     Üstelik beklentinin ÜSTÜNE çıkması ayrı bir kırılma — "söz verdiğin
     patika tutmadı" demektir, bunun bedeli ayrıca ödenir. */
  const sInf   = -Math.max(0,pubInf-14)*0.52-Math.pow(Math.max(0,pubInf-35),1.25)*0.13
                 +Math.max(0,20-Math.max(5,pubInf))*0.52   // %5'in altı ek ödül getirmez
                 -Math.max(0,2-pubInf)*2.2                 // deflasyon sınırı: borç yükü ve erteleme
                 -Math.max(0,e.inflation-e.expect)*0.55;
  const sFx    = -Math.pow(Math.max(0,fxReal-1.06),0.85)*30;
  const sWage  = clamp((e.realIncome-100)*0.32,-10,6.5);
  const sJobs  = -Math.max(0,e.unemployment-8.5)*1.6+Math.max(0,8.5-e.unemployment)*0.9;
  const sStreet= -Math.max(0,p.unrest-45)*0.26+(p.morale-50)*0.11;
  const sRes   = -Math.pow(Math.max(0,60-e.reserves)/60,1.4)*13;
  const sGrow  = clamp((e.growth-2.7)*1.20,-4.5,5.5);   // yeni trende göre kıyaslanır
  const sSeg   = (wAvg-46)*0.20;
  /* Faizin kendisi de bir bedel: yüksek faiz kredinin fiyatıdır.
     Konut ve taşıt kredisi pahalanır, esnaf finansman bulamaz, yatırım
     ertelenir. Enflasyonu kalıcı yüksek faizle bastırmak seçim kazandırmaz —
     asıl marifet faizi İNDİREBİLECEK zemini kurmaktır. */
  const sRate  = -Math.max(0,e.rate-20)*0.19-Math.max(0,12-e.credit)*0.30;
  let vTgt=clamp(56+sInf+sFx+sWage+sJobs+sStreet+sRes+sGrow+sSeg+sRate+chan('vote'),8,80);
  S.voteWhy=[['Mutfak / enflasyon',sInf],['Dolar kuru',sFx],['Maaşın alım gücü',sWage],
             ['İşsizlik',sJobs],['Sokağın havası',sStreet],['Rezervler',sRes],
             ['Büyüme',sGrow],['Kredi ve faiz yükü',sRate],['Seçmen grupları',sSeg]];
  /* Golge islerin oya katkisi artik ayri bir satir — digerlerinin icinde
     kaybolmuyor (geri bildirim 35). */
  if(S.me&&S.me.voteBoost>0.001)
    S.voteWhy.push(['Yandaş basın fonu (gölge iş)',S.me.voteBoost/0.045]);
  let dV=clamp((vTgt-p.vote)*0.045,-0.40,0.40);
  add('vote','Seçmen grupları',dV);
  if(e.inflation>80||p.unrest>88||e.reserves<15||e.cds>1000){dV-=0.35;add('vote','Kriz baskısı',-0.35);}
  p.vote=clamp(p.vote+dV,3,84);
  p.integrity=clamp(p.integrity+0.18+chan('integrity')*12,2,98);

  /* ---- 20) büyüme (yıllık) ---- */
  const h12=S.hist.length>=12?S.hist[S.hist.length-12]:null;
  e.growth=h12?clamp((e.gdpReal/h12.gdpReal-1)*100,-12,16):e.potGrowth+e.gap*0.3;

  /* ---- 20b) BAŞKANIN KASASI ---- */
  vaultMonth(fxC);

  /* ---- 20b2) VERİLEN SÖZLER: tutuldu mu, çiğnendi mi? ---- */
  checkPledges();

  /* ---- 20c) MEGA PROJELER: inşaat ilerler, biten işletmeye açılır ---- */
  (S.mega||[]).forEach(m=>{
    if(m.built)return;
    m.age++;
    if(m.age>=MEG(m.id).build){
      m.built=true;
      const M=MEG(m.id);
      Object.entries(M.seg||{}).forEach(([k,v])=>{if(S.seg[k]!=null)S.seg[k]=clamp(S.seg[k]+v,2,98);});
      S.p.vote=clamp(S.p.vote+0.8,3,84);
      headline(M.name+' hizmete açıldı');
      S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'event',title:M.name+' açıldı',
        body:`Tören yapıldı. Bugünden itibaren yılda ${pct(M.gar*(e.usdtry/42.10))} GSYH garanti ödemesi bütçeden çıkacak.`});
    }});

  /* ---- 20d) SOKAK: eylem doğuyor mu, süren eylem ne yapıyor? ---- */
  protestCheck(fxC);

  /* ---- 21) süresi dolan paketler ---- */
  const ended=[];
  S.active=S.active.filter(a=>{
    if(a.age>=a.dur){ended.push(a);return false;} return true;});
  ended.forEach(a=>{
    const P=POL(a.id);
    if(P.fx&&P.fx.rebound){                                 // destek bitince geri tepme
      e.inflation+=kOf(P,a.amt)*P.fx.rebound*12;
      S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'event',title:P.name+' sona erdi',
        body:'Destek kalktı, bastırılan fiyatlar rafa yansıdı.'});
    } else S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'decision',
        title:P.name+' tamamlandı',body:`${a.dur} ay boyunca ayda ${a.amt} mlr ₺ ödenek kullanıldı.`});
  });

  /* ---- 21b) PROGRAM KARNESI: paket ne uretti? ---- */
  deliverCheck();

  /* ---- 21c) YILLIK ODENEK: bu ayin program harcamasi zarftan dusulur ---- */
  fySpend();

  /* ---- takvim ---- */
  S.t++; S.month++; if(S.month>12){S.month=1;S.year++;}
  /* Yillik program odenegi her ocak yeniden kurulur, yil icinde erir. */
  fyReset(false);
  S.hist.push(snapshot());
  makeNews();
  // kabinedeki yeni isimlerin uyum dönemi ve hedefte kalma süresi bir ay azalır
  if(S.cab)Object.values(S.cab).forEach(c=>{if(c.green>0)c.green--;if(c.mark>0)c.mark--;});
  const closed=(S.t%3===0);
  if(closed){
    const pm=S.month-1<1?12:S.month-1, py=S.month-1<1?S.year-1:S.year;
    S.pub={growth:e.growth,unemployment:e.unemployment,current:e.current,label:`${py} ${qOf(pm)}. çeyrek`};
  }
  return closed;
}
export function snapshot(){return{label:`${MSHORT[(S.month-2+12)%12]} ${String(S.month===1?S.year-1:S.year).slice(2)}`,
  inflation:S.e.inflation,core:S.e.core,expect:S.e.expect,growth:S.e.growth,unemployment:S.e.unemployment,
  usdtry:S.e.usdtry,rate:S.e.rate,real:S.e.rate-S.e.expect,vote:S.p.vote,unrest:S.p.unrest,
  cred:S.e.credibility,gdpReal:S.e.gdpReal,gap:S.e.gap,realIncome:S.e.realIncome,morale:S.p.morale};}

export const commName=c=>({hawkish:'ŞAHİN',neutral:'NÖTR',dovish:'GÜVERCİN'}[c]);
export const guidName=g=>({none:'BELİRSİZ',tight:'SIKI DURUŞ',loose:'GEVŞEME'}[g]);

/* Ay içinde olan önemli bir şeyi manşete taşır — makeNews bunları siler,
   bu yüzden ayrı bir kuyrukta beklerler. */
export function headline(t){ if(!S.flash)S.flash=[]; S.flash.unshift(t); }
export function makeNews(){
  const e=S.e,p=S.p,n=[],pv=S.prev?S.prev.e:e;
  if(e.inflation>45)n.push('Market zincirleri etiketleri haftada iki kez güncelliyor.');
  else if(e.inflation>25)n.push(`TÜİK: yıllık enflasyon ${pct(e.inflation)} olarak açıklandı.`);
  else n.push('Enflasyon tek haneye yaklaşıyor, esnaf temkinli iyimser.');
  n.push(e.usdtry>pv.usdtry*1.004?'Döviz bürolarında yoğunluk arttı.'
    :e.usdtry<pv.usdtry*0.996?'Lira ayı değer kazanarak kapattı.'
    :`Kur ${nf(e.usdtry,2)} seviyesinde yatay seyrediyor.`);
  if(e.realIncome<88)n.push(`Hanehalkı alım gücü endeksi ${nf(e.realIncome,0)}'e geriledi.`);
  else if(e.realIncome>108)n.push('Alım gücü üç yılın zirvesinde.');
  if(e.dollarization>55)n.push(`Döviz mevduatının payı ${pct(e.dollarization,0)}'e çıktı.`);
  if(e.credit<10)n.push('Bankalar kredi musluğunu kıstı, KOBİ finansmanı zorlaşıyor.');
  else if(e.credit>45)n.push('Kredi büyümesi hızlandı, makro ihtiyati tedbir tartışılıyor.');
  if(e.unemployment>11)n.push('İŞKUR başvurularında rekor artış bildirildi.');
  if(e.rate>pv.rate)n.push('Bankalar kredi faizlerini yukarı çekti.');
  else if(e.rate<pv.rate)n.push('Konut kredisi başvuruları faiz indirimiyle hareketlendi.');
  if(e.credibility<30)n.push('Yabancı fon yöneticileri: "Politika öngörülebilirliği zayıf."');
  else if(e.credibility>65)n.push('Derecelendirme kuruluşu görünümü "pozitif"e çevirdi.');
  if(p.unrest>65)n.push('Meydanlarda hayat pahalılığı protestoları sürüyor.');
  if(e.potGrowth>K.potBase+.5)n.push(`Potansiyel büyüme tahmini ${pct(e.potGrowth)}'e yükseltildi.`);
  if(e.gap<-3)n.push('Sanayide kapasite kullanımı geriledi.');
  if(shutCount()>0)n.push(`Çarşıda ${shutCount()} dükkân daha kepenk indirdi.`);
  if(S.active.length)n.push(`${S.active[S.active.length-1].name}: ayda ${S.active[S.active.length-1].amt} mlr ₺ ödenek akıyor.`);
  n.push('Öğrenciler iktisat sınavında "parasal aktarım mekanizması" sorusuyla karşılaştı.');
  const fl=(S.flash||[]); S.flash=[];
  S.flashLead=fl.length?fl[0].toLocaleUpperCase('tr'):null;   // gazetenin manşeti
  S.news=[...fl,...n].slice(0,8);
}

/* ═══════════════ SEPETTEKİ PARA POLİTİKASI ARAÇLARI ═══════════════
   Ayarlanan her aracın 12 aylık tahmini etkisi. Hem Para Politikası
   Kurulu panelindeki etki tablosu hem karar sepetindeki satırlar buradan
   beslenir; ikisi ayrı yazıldığında aynı karar iki farklı sayı gösteriyordu.
   ═══════════════════════════════════════════════════════════════════ */
export function draftImpacts(){
  const d=S.draft;
  const dRate=d.rate-S.e.rate, dApi=d.api-S.e.api;
  const dZkTL=d.zkTL-S.e.zkTL, dZkFX=d.zkFX-S.e.zkFX;
  const cW=c=>c==='hawkish'?-1:c==='dovish'?1:0, gW=g=>g==='tight'?-1:g==='loose'?1:0;
  const dComm=cW(d.comm)-cW(S.e.comm), dGuid=gW(d.guidance)-gW(S.e.guidance), dFx=d.fx||0;
  const out=[];
  const add=(key,lab,on,v)=>{if(on)out.push({key,lab,v});};
  add('rate',`Politika faizi ${signed(dRate,2)} p`,Math.abs(dRate)>=.05,
    {inf:-dRate*.075, cr:-dRate*K.creditSens*credPass(), fx:-dRate*.10, un:dRate*.045});
  add('api',`APİ fonlaması ${signed(dApi,0)} mlr ₺`,Math.abs(dApi)>=1,
    {inf:dApi/260*.145, cr:dApi/API_PT*API_CRED, fx:dApi/260*.35, un:-dApi/260*.25});
  add('zkTL',`TL zorunlu karşılık ${signed(dZkTL,0)} p`,Math.abs(dZkTL)>=.5,
    {inf:-dZkTL*.05, cr:-dZkTL*ZK_CRED, fx:-dZkTL*.04, un:dZkTL*.05});
  add('zkFX',`YP zorunlu karşılık ${signed(dZkFX,0)} p`,Math.abs(dZkFX)>=.5,
    {inf:-dZkFX*.044, cr:0, fx:-dZkFX*.156, un:0});
  add('comm',`İletişim: ${commName(d.comm)}`,dComm!==0,
    {inf:dComm*.30, cr:dComm*.15, fx:dComm*.42, un:-dComm*.05});
  add('guid',`Yönlendirme: ${guidName(d.guidance)}`,dGuid!==0,
    {inf:dGuid*.18, cr:dGuid*.20, fx:dGuid*.25, un:-dGuid*.04});
  add('fx',`Döviz ${dFx>0?'satışı':'alımı'} ${Math.abs(dFx)} mlr $`,!!dFx,
    {inf:-dFx*.11, cr:0, fx:-dFx*.40, un:0});
  return out;
}
/* Birden fazla aracın toplamı. */
export const impTotal=list=>list.reduce((a,{v})=>
  ({inf:a.inf+v.inf, cr:a.cr+v.cr, fx:a.fx+v.fx, un:a.un+v.un}),{inf:0,cr:0,fx:0,un:0});
