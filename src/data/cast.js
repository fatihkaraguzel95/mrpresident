import {activeSpendPct} from '../core/helpers.js';
import {$, K, S, clamp, nf, pct, rnd, signed} from '../core/state.js';
import {POL, has} from './policies.js';
import {MARKED} from '../ui/panels.js';
import {fyCap, fyOpen, megaGuarantee, megaOf} from './mega.js';
import {pubInflation} from '../sim/vault.js';

/* ═══════════════ KARAKTERLER ═══════════════ */
export const ADVISORS=[
 {id:'cb',name:'Ayla Görgün',role:'Merkez Bankası',
  px:{skin:'#E0B088',hair:'#3A2E2A',style:'bob',glasses:1,coll:'#2C4A7C'},
  line:s=>{const rr=s.e.rate-s.e.expect;
    if(has('kkm'))return'Kur korumalı mevduat kuru bastırıyor ama faturası hazineye yazılıyor — zaman satın alıyoruz, çözüm üretmiyoruz.';
    if(s.e.guidancePledge&&s.e.guidancePledge.broken)return`Sözümüzü tutmadık. Piyasa artık ilettiğimiz hiçbir mesaja itibar etmiyor.`;
    if(rr<-2)return`Reel faiz ${pct(rr)}. Bu seviyede kimse lira tutmaz; dolarizasyon ${pct(s.e.dollarization,0)}'e çıktı.`;
    if(rr<2)return`Reel faiz ancak ${pct(rr)}. Kredi ${pct(s.e.credit,0)} büyüyor, sıkılaşma yetersiz.`;
    if(rr>9)return`Reel faiz ${pct(rr)}. Kredi büyümesi ${pct(s.e.credit,0)}'e indi; fren fazla sert.`;
    return`Reel faiz ${pct(rr)} ile dengeli. Çıktı açığı ${signed(s.e.gap)} puan, duruşu koruyalım.`;},
  mood:s=>(s.e.rate-s.e.expect)<0?'bad':(s.e.rate-s.e.expect)>9?'warn':'good'},
 {id:'fin',name:'Kenan Soydan',role:'Hazine ve Maliye',
  px:{skin:'#D19B6E',hair:'#4A4340',style:'short',glasses:0,coll:'#1F3A5F',beard:1},
  line:s=>{const sp=activeSpendPct();
    if(has('kkm')&&s.e.usdtry>48)return'Kur korumalı mevduatın kur farkı her ay bütçeden çıkıyor. Lirayı tutamazsak bu kalem patlar.';
    if(s.e.budget<-6)return`Açık millî gelirin ${pct(-s.e.budget)}'ine çıktı; yeni paket tahvil faizini uçurur.`;
    if(sp>1.4)return`Yürürlükteki paketler GSYH'nin ${pct(sp)}'ini yiyor. Bu tempoda borç sarmalı riski var.`;
    if(s.e.debt>45)return`Borç stoku ${pct(s.e.debt)}; üstelik ${pct(s.e.fxDebtShare*100,0)}'i döviz cinsi. Kur her yükseldiğinde borcumuz artıyor.`;
    if(s.e.budget>-3)return`Bütçe disiplini tutuyor. Sınırlı bir paket için alanımız var.`;
    return`Açık ${pct(-s.e.budget)} seviyesinde. Ödenekleri süreye yaymak nakit akışını rahatlatır.`;},
  mood:s=>s.e.budget<-6?'bad':s.e.budget>-3?'good':'warn'},
 {id:'eco',name:'Murat Erten',role:'Sanayi ve Teknoloji',
  px:{skin:'#C08355',hair:'#2B2622',style:'short',glasses:0,coll:'#3E5C3A'},
  line:s=>{
    if(s.e.gap<-2.5)return`Çıktı açığı ${signed(s.e.gap)} puan — kapasite boş duruyor. Teşvik gelmezse kalıcı kaybederiz.`;
    if(s.e.gap>2.5)return`Ekonomi kapasitesinin ${signed(s.e.gap)} puan üstünde. Bu hız enflasyon olarak geri dönüyor.`;
    if(s.e.potGrowth>K.potBase+.6)return`Potansiyel büyüme ${pct(s.e.potGrowth)}'e çıktı. Yatırım programları işe yarıyor.`;
    return`Yatırım iştahı var ama kredi maliyeti yüksek. Süreyi uzun tutarsak yatırımcı plan yapabilir.`;},
  mood:s=>s.e.gap<-2.5?'bad':s.e.gap>2.5?'warn':'good'},
 {id:'lab',name:'Selma Akgün',role:'Çalışma Bakanlığı',
  px:{skin:'#EBC49B',hair:'#6B3A2A',style:'long',glasses:1,coll:'#7C2D4A'},
  line:s=>{
    if(s.e.unemployment>11)return`İşsizlik ${pct(s.e.unemployment)}, yapısal seviye ${pct(s.e.nairu)}. Gençlerde oran iki katı.`;
    if(s.e.realIncome<88)return`Hane alım gücü ${nf(s.e.realIncome,0)}'e düştü. Asgari ücretli ayı çıkaramıyor.`;
    if(s.e.nairu<K.nairuBase-.4)return`Mesleki eğitim tuttu: yapısal işsizlik ${pct(s.e.nairu)}'e indi.`;
    return`İstihdam idare ediyor ama nitelikli işgücü açığı büyüyor.`;},
  mood:s=>s.e.unemployment>11||s.e.realIncome<88?'bad':s.e.unemployment<8?'good':'warn'},
 {id:'pr',name:'Deniz Özmen',role:'Kamuoyu Başdanışmanı',
  px:{skin:'#B07A4E',hair:'#1F1B19',style:'bob',glasses:0,coll:'#4A3B6B'},
  line:s=>{
    if(s.p.vote<44)return`Anketlerde ${pct(s.p.vote)}'e düştük. Bu gidişle seçimi kaybederiz.`;
    if(s.p.unrest>65)return`Sokakta tansiyon yüksek, moral ${nf(s.p.morale,0)}/100. Somut rahatlama görünmeden hava dönmez.`;
    if(s.e.realIncome<92)return`Halkın alım gücü ${nf(s.e.realIncome,0)}. Başka hiçbir başarı konuşulmuyor.`;
    if(s.p.morale>62)return`Moral ${nf(s.p.morale,0)}/100. Bu havayı bozmayalım.`;
    return`Tablo yönetilebilir. Tutarlı mesaj verirsek destek korunur.`;},
  mood:s=>s.p.vote<44?'bad':s.p.vote>53?'good':'warn'}
];

/* ═══════════════ KABİNE TAVSİYELERİ ═══════════════
   Bakanlar artık sadece tablo okumuyor: her biri o ay yapılabilecek
   SOMUT bir hamle öneriyor ve önerinin yanındaki düğme seni doğrudan
   ilgili ekrana götürüyor (paketi açar, faizi ayarlar, ihaleyi gösterir).

   Her tavsiyenin bir ağırlığı var; en yüksek ağırlıklı uygulanabilir
   tavsiye seçilir. Ağırlık 0 ise o tavsiye şu an anlamsızdır.
   act alanları:
     {k:'pol',  id} → paket tasarımcısını açar
     {k:'rate', bp} → politika faizini bu kadar baz puan oynatır (sepete)
     {k:'tool', t, dv} → APİ / zorunlu karşılık ayarı (sepete)
     {k:'guid'/'comm', v} → yönlendirme / iletişim duruşu (sepete)
     {k:'mega', id} → yap-işlet-devret ihalesini açar
     {k:'speech', id} → Başkanın Açıklaması ekranını açar
     {k:'cancel', id} → yürürlükteki paketi erken iptal ekranı
   ═══════════════════════════════════════════════════ */
const act = (k, o) => Object.assign({k}, o || {});
const runs = id => S.active.find(a => a.id === id);
/* Bu paket şu an BAŞLATILABİLİR mi? Yürürlükteyse ya da sepetteyse önerme. */
const canStart = id => !runs(id) && !S.draft.policies.some(x => x.id === id);

export const TIPS = {
 cb: [
  {w: s => (s.e.rate - s.e.expect) < -1 ? 100 : 0,
   say: s => `Reel faiz ${pct(s.e.rate - s.e.expect)}. Bu seviyede kimse lira tutmaz; dolarizasyon ${pct(s.e.dollarization, 0)}. En az 500 baz puan artırmadan bu sarmal durmaz.`,
   t: 'Faizi +500 bp artır', a: () => act('rate', {bp: 500})},
  {w: s => (s.e.rate - s.e.expect) < 2 ? 82 : 0,
   say: s => `Reel faiz ancak ${pct(s.e.rate - s.e.expect)}, kredi ${pct(s.e.credit, 0)} büyüyor. Sıkılaşma yetersiz — 250 baz puan daha gerekiyor.`,
   t: 'Faizi +250 bp artır', a: () => act('rate', {bp: 250})},
  {w: s => ((s.e.rate - s.e.fundRate) > 1.5 && s.e.api > 0) ? 95 : 0,
   say: s => `Politika faizi ${pct(s.e.rate)} ama ortalama fonlama ${pct(s.e.fundRate)}. Bir yandan sıkıyız diyoruz, öbür yandan APİ'den ${nf(s.e.api, 0)} mlr ₺ likidite veriyoruz. Piyasa bu tutarsızlığı her ay güvenilirlikten kesiyor.`,
   t: 'APİ fonlamasını kıs', a: () => act('tool', {t: 'api', dv: -Math.min(500, Math.max(250, S.e.api))})},
  {w: s => has('kkm') ? 88 : 0,
   say: s => 'Kur korumalı mevduat kuru bastırıyor ama faturası hazineye yazılıyor; bastırılan baskı da birikiyor. Çıkışı planlamalıyız.',
   t: 'KKM programını erken kapat', a: () => act('cancel', {id: 'kkm'})},
  {w: s => (s.e.dollarization > 52 && s.e.zkFX < 40) ? 70 : 0,
   say: s => `Mevduatın ${pct(s.e.dollarization, 0)}'i dövizde. YP zorunlu karşılığı yükseltirsek döviz tutmanın maliyeti artar, kur baskısı azalır — faize dokunmadan.`,
   t: 'YP zorunlu karşılığı +5 puan', a: () => act('tool', {t: 'zkFX', dv: 5})},
  {w: s => (s.e.credit > 45) ? 72 : 0,
   say: s => `Kredi büyümesi ${pct(s.e.credit, 0)} — balon işareti. Faizi daha fazla yükseltmeden makro ihtiyati tedbirle frene basabiliriz.`,
   t: 'Makro ihtiyati tedbir getir', a: () => act('pol', {id: 'macropru'})},
  {w: s => (s.e.rate - s.e.expect > 7 && s.e.inflation < 20 && s.e.credibility > 45) ? 78 : 0,
   say: s => `Reel faiz ${pct(s.e.rate - s.e.expect)}, enflasyon ${pct(s.e.inflation)}. Zemin hazır: kademeli indirime başlayabiliriz. Önce yönlendirmeyi değiştirin, sonra 250 baz puan.`,
   t: 'Faizi −250 bp indir', a: () => act('rate', {bp: -250})},
  {w: s => (s.e.guidance === 'none' && s.e.inflation > 20) ? 58 : 0,
   say: s => 'Piyasa bize bir patika soruyor. "Sıkı duruş" yönlendirmesi vermezsek beklenti çıpası kurulmuyor — bedava bir güvenilirlik kazancını kaçırıyoruz.',
   t: '"Sıkı duruş" yönlendirmesi ver', a: () => act('guid', {v: 'tight'})},
  {w: s => (s.e.comm !== 'hawkish' && s.e.expect > s.e.inflation) ? 44 : 0,
   say: s => `Beklenen enflasyon ${pct(s.e.expect)}, gerçekleşen ${pct(s.e.inflation)}. Şahin bir iletişimle bu makası kapatabiliriz; maliyeti yok.`,
   t: 'İletişimi ŞAHİN yap', a: () => act('comm', {v: 'hawkish'})},
  {w: s => 10,
   say: s => `Reel faiz ${pct(s.e.rate - s.e.expect)} ile dengeli, çıktı açığı ${signed(s.e.gap)} puan. Duruşu koruyalım; şimdi acele bir adım kazanımı siler.`,
   t: 'Faizi sabit tut', a: () => act('rate', {bp: 0})}],

 fin: [
  {w: s => (s.e.budget < -7) ? 100 : 0,
   say: s => `Açık ${pct(-s.e.budget)}. Bu tempoda tahvil ihalesine alıcı gelmez. Kamuda tasarruf genelgesi en hızlı çözüm — taşıt, temsil, yeni kadro durur.`,
   t: 'Kamuda tasarruf başlat', a: () => act('pol', {id: 'austerity'})},
  {w: s => (fyOpen() < fyCap() * 0.22 && S.month < 11) ? 92 : 0,
   say: s => `Yılın program ödeneğinin neredeyse tamamı kullanıldı; ${13 - S.month} ay daha var. Yeni bir paket açmadan önce ya bir programı kapatmalı ya da gelir tarafını büyütmeliyiz.`,
   t: 'Kayıt dışıyla mücadele', a: () => act('pol', {id: 'audit'})},
  {w: s => (s.e.debt > 55) ? 84 : 0,
   say: s => `Borç stoku ${pct(s.e.debt)} ve ${pct(s.e.fxDebtShare * 100, 0)}'i döviz cinsi — kur her yükseldiğinde borcumuz artıyor. Gelir tarafını büyütmeliyiz.`,
   t: 'Kayıt dışıyla mücadele', a: () => act('pol', {id: 'audit'})},
  {w: s => (megaGuarantee() > 1.3) ? 80 : 0,
   say: s => `Garanti ödemeleri yılda ${pct(megaGuarantee())} GSYH ve dövize endeksli. Yeni ihale açmayın; bu kalem lira değer kaybettikçe kendi başına büyüyor.`,
   t: null, a: null},
  {w: s => (s.p.integrity < 50) ? 68 : 0,
   say: s => `Şeffaflık ${nf(s.p.integrity, 0)}/100. İhale şeffaflığı reformu bütçeye neredeyse bedelsiz ama risk primini ve borçlanma maliyetini kalıcı düşürür.`,
   t: 'İhale şeffaflığı reformu', a: () => act('pol', {id: 'transparency'})},
  {w: s => (s.e.cds > 420) ? 74 : 0,
   say: s => `Risk primi ${nf(s.e.cds, 0)} bp. Her 100 baz puan faiz giderimizi yıllar boyunca büyütüyor. Mali disiplin sinyali vermemiz lazım.`,
   t: 'Kamuda tasarruf başlat', a: () => act('pol', {id: 'austerity'})},
  {w: s => (s.e.budget > -3.5 && fyOpen() > 1.2) ? 46 : 0,
   say: s => `Bütçe disiplini tutuyor, yılın kalan ödeneği ${nf(fyOpen(), 2)} trilyon ₺. Üretken bir programa alanımız var — tüketime değil, kapasiteye harcayalım.`,
   t: 'Sanayi yatırım teşviki', a: () => act('pol', {id: 'industry'})},
  {w: s => (activeSpendPct() > 1.6) ? 62 : 0,
   say: s => `Yürürlükteki paketler GSYH'nin ${pct(activeSpendPct())}'ini yiyor. En az getirisi olanı erken kapatıp alan açalım.`,
   t: 'Bir programı erken kapat', a: () => act('cancel', {})},
  {w: s => 10,
   say: s => `Açık ${pct(-s.e.budget)}, yılın kalan ödeneği ${nf(fyOpen(), 2)} trilyon ₺. Ödenekleri süreye yaymak nakit akışını rahatlatır.`,
   t: null, a: null}],

 eco: [
  {w: s => (s.e.gap < -2.5) ? 96 : 0,
   say: s => `Çıktı açığı ${signed(s.e.gap)} puan — fabrikalar yarı kapasite. Teşvik gelmezse bu kapasiteyi kalıcı kaybederiz; makine yatırımı bir kez durursa geri gelmiyor.`,
   t: 'Sanayi yatırım teşviki', a: () => act('pol', {id: 'industry'})},
  {w: s => (s.e.potGrowth < 3.4 && canStart('tech')) ? 90 : 0,
   say: s => `Potansiyel büyüme ${pct(s.e.potGrowth)} — yani kapasitemiz neredeyse hiç büyümüyor. Teknoloji ve yapay zekâ programı yavaş ama kalıcı tek çıkış yolu; altıncı ayda ilk laboratuvar açılır.`,
   t: 'Teknoloji programı başlat', a: () => act('pol', {id: 'tech'})},
  {w: s => (s.e.current < -4) ? 86 : 0,
   say: s => `Cari açık ${pct(s.e.current)}. Döviz kazanmadan bu açığı kapatamayız — ihracat ve turizm atağı en hızlı dönen kalem.`,
   t: 'İhracat ve turizm atağı', a: () => act('pol', {id: 'export'})},
  {w: s => (s.e.shock && s.e.shock.fuel > 7 && canStart('energyStore')) ? 82 : 0,
   say: s => 'Enerji tarafında şok var ve elimizde tampon yok. Stratejik depolama bugün pahalı görünür, bir sonraki kesintide hayat kurtarır.',
   t: 'Stratejik enerji depolama', a: () => act('pol', {id: 'energyStore'})},
  {w: s => (s.e.gap > 2.5) ? 70 : 0,
   say: s => `Ekonomi kapasitesinin ${signed(s.e.gap)} puan üstünde çalışıyor; bu hız enflasyon olarak geri dönüyor. Yeni talep paketi açmayın, arz tarafına geçin.`,
   t: 'Demiryolu ve liman ağı', a: () => act('mega', {id: 'bridge'})},
  {w: s => (s.e.credibility > 35 && s.e.cds < 600 && !megaOf('airport') && !megaOf('nuclear')) ? 54 : 0,
   say: s => 'Bütçeden peşin para çıkmadan kapasite büyütmenin yolu var: yap-işlet-devret. Bedeli açılışta başlayan dövize endeksli garanti — gözünüz açık imzalayın.',
   t: 'Havalimanı ihalesini incele', a: () => act('mega', {id: 'airport'})},
  {w: s => (s.e.potGrowth > K.potBase + 0.8) ? 40 : 0,
   say: s => `Potansiyel büyüme ${pct(s.e.potGrowth)}'e çıktı — yatırım programları gerçekten işliyor. Süreleri kısaltmayın, birikim süreyle geliyor.`,
   t: null, a: null},
  {w: s => 10,
   say: s => `Yatırım iştahı var ama kredi maliyeti yüksek. Uzun süreli bir program verirsek yatırımcı plan yapabilir.`,
   t: 'Demiryolu ve liman ağı', a: () => act('pol', {id: 'rail'})}],

 lab: [
  {w: s => (s.e.unemployment > 12) ? 98 : 0,
   say: s => `İşsizlik ${pct(s.e.unemployment)}, gençlerde iki katı. Genç istihdam seferberliği en hızlı etki eden araç — üçüncü ayda ilk işe girişler başlar.`,
   t: 'Genç istihdam seferberliği', a: () => act('pol', {id: 'youth'})},
  {w: s => (s.e.nairu > K.nairuBase + 0.3 && canStart('edu')) ? 88 : 0,
   say: s => `Yapısal işsizlik ${pct(s.e.nairu)}'e tırmandı: iş var ama eşleşmiyor. Mesleki eğitim bunu kalıcı düşüren tek kalem; sekizinci ayda ilk mezunlar çıkar.`,
   t: 'Mesleki eğitim seferberliği', a: () => act('pol', {id: 'edu'})},
  {w: s => (s.e.realIncome < 90) ? 92 : 0,
   say: s => `Hane alım gücü ${nf(s.e.realIncome, 0)}. Asgari ücretli ayı çıkaramıyor; ocağı beklersek sokak bizden önce karar verir.`,
   t: 'Asgari ücrete ara zam', a: () => act('pol', {id: 'wage'})},
  {w: s => ((s.e.px.rent / Math.max(1, s.e.minWage)) > 0.75) ? 86 : 0,
   say: s => `Kira asgari ücretin ${pct(s.e.px.rent / Math.max(1, s.e.minWage) * 100, 0)}'i. Bu rakamla ücret zammı buharlaşıyor — kirayı çözmeden maaşı çözemeyiz.`,
   t: 'Kira zam sınırı getir', a: () => act('pol', {id: 'rentcap'})},
  {w: s => (s.p.unrest > 62) ? 80 : 0,
   say: s => `Sokakta tansiyon ${nf(s.p.unrest, 0)}/100. Sendikalar masaya oturmak istiyor; somut bir kalem vermeden bu hava dönmez.`,
   t: 'Enerji fatura desteği', a: () => act('pol', {id: 'energy'})},
  {w: s => (s.seg.youth < 36) ? 66 : 0,
   say: s => `Gençlerin desteği ${nf(s.seg.youth, 0)}/100 — en hızlı kaybettiğimiz grup. Kreş ağı ve çocuk yardımı hem istihdamı hem o grubu toparlıyor.`,
   t: 'Çocuk yardımı ve kreş ağı', a: () => act('pol', {id: 'child'})},
  {w: s => (s.e.unemployment < 8 && s.e.nairu < K.nairuBase - 0.4) ? 38 : 0,
   say: s => `İşsizlik ${pct(s.e.unemployment)}, yapısal seviye ${pct(s.e.nairu)}. İşgücü piyasası iyi durumda; şimdi ücret-fiyat sarmalına dikkat.`,
   t: null, a: null},
  {w: s => 10,
   say: s => 'İstihdam idare ediyor ama nitelikli işgücü açığı büyüyor. Eğitim tarafını ihmal etmeyelim.',
   t: 'Mesleki eğitim seferberliği', a: () => act('pol', {id: 'edu'})}],

 pr: [
  {w: s => (s.me && s.me.suspicion > 55) ? 100 : 0,
   say: s => `Üstünüzdeki şüphe ${nf(s.me.suspicion, 0)}/100 ve bir savcı dosyaya bakıyor. Gündemi değiştirmek yetmez; hesap verebilirlik açıklaması bunu gerçekten temizler.`,
   t: 'Hesap verebilirlik açıklaması', a: () => act('speech', {id: 'hesap'})},
  {w: s => (s.p.vote < 44) ? 94 : 0,
   say: s => `Anketlerde ${pct(s.p.vote)}'e düştük. Emekli ve asgari ücretli aynı anda kayıyor; en düşük aylığa ek destek bu iki grubu birden tutar.`,
   t: 'Emekli aylığına ek destek', a: () => act('pol', {id: 'pension'})},
  {w: s => (pubInflation() > 30) ? 88 : 0,
   say: s => `Halkın gördüğü enflasyon ${pct(pubInflation())}. Mutfakta hissedilen tek şey etiket — gıdada KDV indirimi raflara doğrudan yansıyor, üçüncü ayda görünür.`,
   t: 'Gıdada KDV indirimi', a: () => act('pol', {id: 'vat'})},
  {w: s => (s.p.unrest > 68) ? 90 : 0,
   say: s => `Sokak ${nf(s.p.unrest, 0)}/100. Bu tansiyonda ekonomi konuşmak işe yaramaz; gündemi değiştirip taban toplamamız lazım.`,
   t: 'Milli birlik açıklaması', a: () => act('speech', {id: 'birlik'})},
  {w: s => (s.seg.retiree < 36) ? 76 : 0,
   say: s => `Emeklilerin desteği ${nf(s.seg.retiree, 0)}/100 ve bu grup sandığa en çok giden grup. Doğrudan bir kalem gerekiyor.`,
   t: 'Emekli aylığına ek destek', a: () => act('pol', {id: 'pension'})},
  {w: s => (s.seg.minwage < 36) ? 74 : 0,
   say: s => `Asgari ücretlinin desteği ${nf(s.seg.minwage, 0)}/100 — seçmenin %31'i. Fatura desteği en hızlı hissedilen kalem.`,
   t: 'Enerji fatura desteği', a: () => act('pol', {id: 'energy'})},
  {w: s => (s.e.inflation < 22 && s.p.morale > 45 && s.e.realIncome > 95) ? 72 : 0,
   say: s => `Rakamlar nihayet bizden yana: enflasyon ${pct(s.e.inflation)}, alım gücü ${nf(s.e.realIncome, 0)}. Şimdi başarı turu yapmanın tam zamanı — rakamlar tutarken yapılan övünme tutar.`,
   t: 'Başarı turu yap', a: () => act('speech', {id: 'zafer'})},
  {w: s => (s.seg.youth < 38 && canStart('marriage')) ? 60 : 0,
   say: s => `Gençlerde ${nf(s.seg.youth, 0)}/100'deyiz. Evlilik primi en hızlı karşılık bulan kalem — ama konut talebini ve kirayı şişirdiğini bilin.`,
   t: '25 yaş altı evlilik primi', a: () => act('pol', {id: 'marriage'})},
  {w: s => (s.p.morale > 62) ? 30 : 0,
   say: s => `Moral ${nf(s.p.morale, 0)}/100. Bu havayı bozmayalım; şu an riskli bir hamleye ihtiyaç yok.`,
   t: null, a: null},
  {w: s => 10,
   say: s => 'Tablo yönetilebilir. Tutarlı tek bir mesaj verirsek destek korunur; her ay farklı nakarat tutmuyor.',
   t: 'Milli birlik açıklaması', a: () => act('speech', {id: 'birlik'})}],
};

/* Bakanın bu ayki tavsiyesi: en yüksek ağırlıklı uygulanabilir madde. */
export function advice(a) {
  const c = cabOf(a.id);
  if (c.green > 0 && c.green > (c.green0 || 0) - 2)
    return {say: ROOKIE[a.id], t: null, act: null, rookie: true};
  if (c.mark > 0) return {say: MARKED[a.id], t: null, act: null, marked: true};
  /* Yalancı bakan: tabloyu tersine okur ve hiçbir zaman uygulanabilir bir
     öneri vermez — götüreceği yer yanlış olduğu için düğme de koymuyoruz. */
  if (isLiar(a.id) && LIE[a.id])
    return {say: LIE[a.id](S), t: null, act: null, lying: true};
  const list = (TIPS[a.id] || []).map(x => ({x, w: x.w(S) || 0})).filter(o => o.w > 0);
  if (!list.length) return {say: a.line(S), t: null, act: null};
  list.sort((p, q) => q.w - p.w);
  // Uygulanabilirlik: zaten yürürlükte/sepette olan paketi önermeyelim
  let pick = list[0].x;
  for (const o of list) {
    const A = o.x.a ? o.x.a() : null;
    if (A && A.k === 'pol' && !canStart(A.id)) continue;
    if (A && A.k === 'mega' && megaOf(A.id)) continue;
    if (A && A.k === 'cancel' && A.id && !runs(A.id)) continue;
    if (A && A.k === 'cancel' && !A.id && !S.active.length) continue;
    pick = o.x; break;
  }
  const A = pick.a ? pick.a() : null;
  return {say: pick.say(S), t: pick.t, act: A};
}

/* ═══════════════ KABİNE: AVATAR, İSİM, GÖREVDEN ALMA ═══════════════
   İsim ve avatar tamamen kozmetiktir. Görevden almanın bedeli gerçektir:
   kurumsal hafıza kaybı → güvenilirlik düşer, yeni bakan uyum döneminde
   her ay güvenilirliği biraz daha aşındırır. Her görevden alma bir
   sonrakini %50 daha pahalı yapar — "bakan değiştirme" bir strateji değil.
   ═══════════════════════════════════════════════════════════════════ */
export const AVATARS=[
 {skin:'#E0B088',hair:'#3A2E2A',style:'bob',glasses:1,coll:'#2C4A7C'},
 {skin:'#D19B6E',hair:'#4A4340',style:'short',glasses:0,coll:'#1F3A5F',beard:1},
 {skin:'#C08355',hair:'#2B2622',style:'short',glasses:0,coll:'#3E5C3A'},
 {skin:'#EBC49B',hair:'#6B3A2A',style:'long',glasses:1,coll:'#7C2D4A'},
 {skin:'#B07A4E',hair:'#1F1B19',style:'bob',glasses:0,coll:'#4A3B6B'},
 {skin:'#F0D2AE',hair:'#C9C4BC',style:'short',glasses:1,coll:'#5A5248',beard:1},
 {skin:'#9C6B43',hair:'#241C18',style:'long',glasses:0,coll:'#2F6B3E'},
 {skin:'#D9A87C',hair:'#7A4A22',style:'bob',glasses:0,coll:'#A82F26'},
 {skin:'#8A5C36',hair:'#14100E',style:'short',glasses:1,coll:'#6B4226',beard:1},
 {skin:'#EFD8B8',hair:'#E0C05A',style:'long',glasses:0,coll:'#2F6C91'},
 {skin:'#C98E63',hair:'#3A332E',style:'short',glasses:0,coll:'#57356B'},
 {skin:'#E8C39E',hair:'#5A3A6B',style:'bob',glasses:1,coll:'#3A5C6B'}
];
export const NAMEPOOL=['Serkan Aydın','Neslihan Tok','Bülent Kaya','Ferda Ulaş','Okan Demirtaş',
 'Sevil Arıkan','Mert Özkul','Gülay Şen','Tuncay Bilir','Derya Kavaklı','Hakan Uysal',
 'Pınar Eken','Kerem Doğan','Zeynep Altun','Volkan Sarıoğlu','Esra Barut'];
export const SACK={
 cb:{months:8,
   lede:'Merkez Bankası başkanını görevden almak teknik bir kadro değişikliği değildir: piyasa bunu bağımsızlığın bittiği anda okur. Kur, risk primi ve beklentiler aynı gün fiyatlanır.',
   fx:{credibility:-15,expect:1.4,cds:45,usdtry:3.0,integrity:-4,vote:0.8}},
 fin:{months:6,
   lede:'Hazine ve Maliye bakanını değiştirmek borçlanma programını belirsizliğe sokar. Tahvil alıcısı bir sonraki ihaleye kadar bekler.',
   fx:{credibility:-7,cds:22,budget:-0.3,integrity:-2,vote:0.5}},
 eco:{months:6,
   lede:'Sanayi ve Teknoloji bakanının gitmesi yatırım takvimini bozar. Devam eden teşvik dosyaları yeniden masaya yatırılır.',
   fx:{credibility:-3,cds:8,segCapital:-4,vote:0.3}},
 lab:{months:6,
   lede:'Çalışma bakanını göndermek toplu sözleşme masasını dağıtır. Sendikalar yeni muhatabı tanıyana kadar süreç donar.',
   fx:{credibility:-2,segMinwage:-3,segSme:1,vote:0.4}},
 pr:{months:4,
   lede:'Kamuoyu başdanışmanını göndermek iletişim kanadını kapatır. Gündemi bir süre başkaları kurar.',
   fx:{credibility:1,vote:-1.4,segYouth:-2}}
};
export const ROOKIE={
 cb:'Göreve yeni geldim; kurulun önceki kararlarını gözden geçiriyorum. Bir süre temkinli konuşacağız.',
 fin:'Bakanlığı yeni devraldım. Bütçe kalemlerini çıkarıyoruz, net rakamı önümüzdeki ay veririm.',
 eco:'Dosyaları yeni inceliyorum. Sanayiyle ilk toplantıları bu ay yapacağız.',
 lab:'Sosyal tarafla yeni tanışıyorum; masaya oturmam biraz zaman alacak.',
 pr:'Ekibi yeni kuruyorum. Şu anda sahadan sağlıklı veri gelmiyor, tahmin yürütmeyeyim.'};
/* ═══════════════ KABİNEDEKİ YALANCI ═══════════════
   Her oyunda kabineden BİR bakan baştan beri yanlış bilgi verir: rakamı
   tersine okur, tabloyu olduğundan iyi ya da kötü gösterir ve seni yanlış
   karara iter. Kim olduğu her yeni oyunda rastgele değişir (S.liar).

   Yalanı doğrulamanın tek yolu kendi gözünle bakmaktır: Göstergeler paneli
   ve grafikler hep gerçeği söyler — bakanla çeliştiği an kuşkulanırsın.
   "Paralel Yapıyla Mücadele" kararı yürürlüğe girdiğinde kimliği açığa
   çıkar (S.liarOut) ve panelde kırmızı rozetle işaretlenir; sonrasında ne
   yapacağın sana kalmış — susturmak için affını istemen gerekir.
   ═══════════════════════════════════════════════════ */
export const isLiar=id=>!!S&&S.liar===id;
export const liarOut=()=>!!S&&!!S.liarOut;
/* Yalan, gerçeğin tersidir: aynı veriye bakıp ters sonucu söyler. */
export const LIE={
 cb:S=>{const r=S.e.rate-S.e.expect;
   return r<2
     ? `Reel faiz rahat bir pozitif bölgede, çıpa sağlam. Bu noktadan indirim yapabiliriz.`
     : `Reel faiz hâlâ negatif, sıkılaşma yetersiz. Faizi buradan artırmamız şart.`;},
 fin:S=>{const b=S.e.budget;
   return b<-4
     ? `Bütçe dengesi beklentimizin üstünde seyrediyor, ödenekte alan var. Yeni paket açabiliriz.`
     : `Bütçe sıkışıyor, ödenek kalmadı. Yeni bir kalem açmayı düşünmeyin.`;},
 eco:S=>{const g=S.e.growth;
   return g<1.5
     ? `Sanayide kapasite kullanımı güçlü, üretim tarafı canlı. Teşvike ihtiyaç yok.`
     : `Üretim duruyor, sanayi yatırımı durdu. Acil teşvik paketi gerekiyor.`;},
 lab:S=>{const u=S.e.unemployment;
   return u>10
     ? `İşgücü piyasası sıkı, istihdam tablosu iyi. Ücret tarafını zorlayabiliriz.`
     : `İşsizlik tırmanıyor, istihdam çöküyor. Ücret artışını kesmeliyiz.`;},
 pr:S=>{const v=S.p.vote;
   return v<48
     ? `Sahadan gelen rakamlar iyi, taban sapasağlam. Sert kararları şimdi alın.`
     : `Sahada ciddi kayıp var, taban dağılıyor. Popüler olmayan hiçbir karara girmeyin.`;}};

export const FXN={credibility:'Politika güvenilirliği',expect:'Enflasyon beklentisi',cds:'Risk primi (bp)',
 usdtry:'USD/₺ (%)',vote:'Oy potansiyeli',integrity:'Şeffaflık',budget:'Bütçe dengesi',
 segCapital:'Sanayici desteği',segMinwage:'Asgari ücretli desteği',segYouth:'Genç desteği',
 segSme:'Esnaf desteği',segRetiree:'Emekli desteği'};
export const cabOf=id=>((S&&S.cab&&S.cab[id])||{});
export const advName=a=>cabOf(a.id).name||a.name;
export const advPx=a=>{const c=cabOf(a.id);return (c.av!=null&&AVATARS[c.av])?AVATARS[c.av]:a.px;};
export const advLine=a=>advice(a).say;
export const cabGreen=()=>ADVISORS.reduce((n,a)=>n+(cabOf(a.id).green>0?1:0),0);
export const cabMarked=()=>ADVISORS.reduce((n,a)=>n+(cabOf(a.id).mark>0?1:0),0);
export const pickFree=(list,used)=>{const f=list.filter(x=>!used.includes(x));
  const p=f.length?f:list; return p[Math.floor(rnd()*p.length)];};

/* Ara zam bu yıl hâlâ yapılabilir mi? (basın sözü boşa düşmesin) */
const araZamFree=()=>S.araZamYear!==S.year;

export const CITIZENS=[
 {k:'retiree',name:'Nazmi Amca',tag:'Emekli, 68',px:{skin:'#D9B08C',hair:'#C9C4BC',hat:'#5A5248'},
  line:s=>{
    if(has('pension'))return'Ek destek cebime girdi girmesine de, market fiyatı yarısını çoktan yemiş.';
    if(s.e.realIncome<88)return'Maaşı alıyorum, ayın onunda bitiyor. Eskiden ay sonunu getirirdik.';
    if(s.seg.retiree<35)return'Torunuma harçlık veremiyorum artık. Bu ne biçim emeklilik?';
    if(s.seg.retiree>60)return'Valla bu sene rahatız. Zam enflasyonun üstünde geldi.';
    return'İdare ediyoruz işte. Çayı da kısarsam sohbet kalmaz.';}},
 {k:'minwage',name:'Hatice Hanım',tag:'Asgari ücretli, 34',px:{skin:'#E8C39E',hair:'#4A3428',scarf:'#A82F26'},
  line:s=>{
    if(has('natal'))return'Üç çocuk desteği yattı, iyi oldu. Ama market bir haftada yarısını geri aldı.';
    if(has('vat'))return'Gıdada KDV indi, sepette gerçekten fark ettim. Devam etsin yeter.';
    if(has('energy'))return'Fatura desteği gelmese kışı nasıl çıkarırdık bilmiyorum.';
    if(s.e.realIncome<85)return'Sabah aldığım ekmek akşam başka fiyat. Böyle ev geçinmez.';
    if(s.seg.minwage<32)return'İki iş yapıyorum, yine yetmiyor. Çocuğun servis parasını veremedim.';
    if(s.seg.minwage>58)return'Bu yıl ilk defa birikim yapabildim. Umarım bozulmaz.';
    return'Zam geldi ama kira da geldi. Denk getirmeye çalışıyoruz.';}},
 {k:'sme',name:'Kadir Usta',tag:'Esnaf, 47',px:{skin:'#C98E63',hair:'#2E2622',apron:'#3E5C3A'},
  line:s=>{
    if(s.e.credit<12)return'Banka kredi musluğunu kapattı. Tezgâh yenilemeyi unut, maaş zor ödüyorum.';
    if(has('energy'))return'Fatura desteği olmasa kepenk kapatacaktım, onu söyleyeyim.';
    if(has('industry'))return'Teşvik iyi de kâğıt işi bitmiyor. Küçük esnafa da sıra gelsin.';
    if(s.e.gap<-2)return'Dükkâna giren yok. Vitrin bakan çok, alan yok.';
    if(s.seg.sme>62)return'Bu ay ciro fena değil. İnşallah devamı gelir.';
    return'Maliyetler artıyor, fiyatı yansıtamıyorum; müşteri kaçıyor.';}},
 {k:'capital',name:'Sinan Bey',tag:'Sanayici, 52',px:{skin:'#D9A87C',hair:'#3A332E',tie:'#2C4A7C'},
  line:s=>{
    if(s.e.credibility<30)return'Kur nereye gider belli değilken yeni hat kuramam. Öngörülebilirlik lazım.';
    if(s.e.cds>420)return`Risk primi ${nf(s.e.cds,0)} baz puan. Yurt dışı borçlanma kapandı, yatırımı erteledik.`;
    if(s.e.potGrowth>K.potBase+.5)return'Uzun vadeli programlar tuttu; üçüncü fabrikanın yerini seçtik bile.';
    if(has('tech'))return'Teknoloji programı doğru adım ama meyvesi beş yıl sonra gelir, süreyi kısa tutmayın.';
    return'İhracat fena değil ama girdi maliyeti canımızı yakıyor.';}},
 {k:'youth',name:'Elif',tag:'Üniversiteli, 23',px:{skin:'#EBC49B',hair:'#241C18',phone:1},
  line:s=>{
    if(has('marriage'))return'Evlilik primi çıkınca arkadaşlar sıraya girdi. Ben önce iş bulayım dedim, kira zaten uçmuş.';
    if(has('youth'))return'İstihdam teşvikiyle ilk işime girdim. En azından bir başlangıç.';
    if(has('edu'))return'Mesleki kursa yazıldım, sertifika sonrası iş sözü var. Umutluyum.';
    if(s.e.unemployment>11)return'Yüz elli başvuru yaptım, üç dönüş aldım. Arkadaşlar yurt dışına bakıyor.';
    if(has('housing'))return'Sosyal konut kurasına girdim. Kira vermekten maaşa sıra gelmiyordu.';
    if(s.seg.youth<32)return'Burada geleceğimi göremiyorum açıkçası. Dil kursuna yazıldım.';
    if(s.seg.youth>58)return'Staj buldum, kirayı da bölüştük. Şimdilik umutluyum.';
    return'Diploma var, iş yok. Bir de kira var, o hep var.';}}
];

export const PRESS=[
 {id:'enflasyon',outlet:'Ekonomi Masası',w:s=>s.e.inflation>22?1.9:0.4,
  q:s=>`TÜİK enflasyonu ${pct(pubInflation())} açıkladı ama market etiketi başka söylüyor. Hedefe ne zaman döneceğiz?`,
  opts:[{t:'"Takvimi veriyorum: iki yıl içinde tek haneye ineceğiz."',pledge:'disinflation',fx:{credibility:5,expect:-1.4,vote:.3},note:'Çıpa güçlenir · tutturamazsan bedeli ağır'},
        {t:'"Enflasyon küresel bir olgu, bize özgü değil."',fx:{credibility:-6,expect:.9,vote:-.4},note:'Sorumluluk dışarı atılır · kimse inanmaz'},
        {t:'"Önce istihdam ve büyüme, enflasyon sırada."',fx:{credibility:-4,expect:1.3,vote:.7,segCapital:-3},note:'Taban memnun · beklenti bozulur'}]},

 {id:'issizlik',outlet:'Çalışma Gündemi',w:s=>s.e.unemployment>10?1.8:0.4,
  q:s=>`İşsizlik ${pct(s.e.unemployment)}, gençlerde çok daha yüksek. İstihdam için somut planınız var mı?`,
  opts:[{t:'"Genç istihdam seferberliği başlatıyoruz."',fx:{budget:-.6,unemp:-.3,vote:.8,segYouth:7},note:'Gençler umutlanır · bütçe yükü'},
        {t:'"İşveren üzerindeki yükü azaltacağız."',fx:{budget:-.5,segCapital:6,segMinwage:-3,vote:.2},note:'Sermaye memnun · çalışan şüpheli'},
        {t:'"İşsizlik küresel konjonktürün sonucu."',fx:{vote:-.9,unrest:4,credibility:-2},note:'Kaçamak · sokak sertleşir'}]},

 {id:'borc',outlet:'Mali Bülten',w:s=>s.e.debt>52||s.e.budget<-6?1.8:0.4,
  q:s=>`Kamu borcu GSYH'nin ${pct(s.e.debt)}'ine, bütçe açığı ${pct(-s.e.budget)}'e çıktı. Sürdürülebilir mi?`,
  opts:[{t:'"Orta vadeli mali program açıklıyoruz, harcamayı kısıyoruz."',pledge:'cutDeficit',fx:{budget:.9,credibility:7,cds:-25,vote:-1.0,gap:-.4},note:'Piyasa inanır · seçmen sıkılır'},
        {t:'"Borç oranımız gelişmiş ülkelerin çok altında."',fx:{credibility:-3,cds:12,vote:.3},note:'Teknik olarak doğru · piyasa ikna olmaz'},
        {t:'"Büyüyerek küçültürüz, kemer sıkmak çözüm değil."',fx:{credibility:-5,cds:20,vote:.6,expect:.6},note:'Popüler · faiz gideri büyür'}]},

 {id:'kira',outlet:'Kent Postası',w:s=>(s.e.px.rent/Math.max(1,s.e.minWage))>0.72?1.7:0.3,
  q:s=>`Ortalama kira ${nf(s.e.px.rent,0)} ₺ — asgari ücretin ${pct(s.e.px.rent/Math.max(1,s.e.minWage)*100,0)}'i. Kiracı ne yapsın?`,
  opts:[{t:'"Kira artışına TÜFE sınırı getiriyoruz."',pledge:'doRentcap',fx:{vote:1.0,segYouth:6,segMinwage:5,segCapital:-6,inflation:-.4},note:'Kiracı rahatlar · arz daralır'},
        {t:'"Çözüm arz: sosyal konut hamlesi geliyor."',fx:{budget:-.9,vote:.7,supply:.02,segSme:3},note:'Kalıcı çözüm · yavaş ve pahalı'},
        {t:'"Fiyatı piyasa belirler, müdahale sorunu büyütür."',fx:{vote:-1.0,segCapital:5,credibility:3,unrest:4},note:'Tutarlı duruş · kiracı küser'}]},

 {id:'eylem',outlet:'Haber Merkezi',w:s=>(s.protest&&s.protest.on)||s.p.unrest>58?2.0:0,
  q:s=>'Meydanlardaki kalabalığa müdahale görüntüleri tartışılıyor. Sınır nerede?',
  opts:[{t:'"Barışçıl gösteri haktır, orantısız güce tolerans yok."',pledge:'noCrackdown',fx:{integrity:10,credibility:4,unrest:-6,segYouth:6,vote:-.3},note:'Hukuk devleti algısı ↑'},
        {t:'"Kamu düzeni her şeyin önünde gelir."',fx:{integrity:-9,unrest:-3,segYouth:-7,segCapital:4,cds:12},note:'Sokak susar · gençler ve itibar gider'},
        {t:'"Görüntüler münferit, inceleme başlatıldı."',fx:{integrity:-2,credibility:-1},note:'Konu kapanmaz'}]},

 {id:'yid',outlet:'Altyapı Raporu',w:s=>(s.mega&&s.mega.some(m=>m.built))?1.5:0,
  q:s=>`Yap-işlet-devret garantileri bütçeden yılda ${pct(megaGuarantee())} GSYH götürüyor ve dövize endeksli. Bu sözleşmeler yeniden görüşülecek mi?`,
  opts:[{t:'"Sözleşmeye sadığız, hukuk güvenliği esastır."',fx:{credibility:6,cds:-15,segCapital:6,vote:-.6},note:'Yatırımcı güveni ↑ · fatura devam'},
        {t:'"Garantileri yeniden müzakere edeceğiz."',fx:{budget:.5,credibility:-8,cds:30,segCapital:-10,vote:.7},note:'Bütçe rahatlar · imza değeri düşer'},
        {t:'"Detaylar ticari sır, paylaşamayız."',fx:{integrity:-7,credibility:-3,vote:-.2},note:'Şeffaflık tartışması büyür'}]},

 {id:'maas',outlet:'Kamuoyu Kanalı',w:s=>((s.me&&s.me.salary)||150000)/Math.max(1,s.e.minWage)>5?1.5:0.6,
  q:s=>`Başkanlık maaşı ${nf((s.me&&s.me.salary)||150000,0)} ₺ — asgari ücretin ${nf(((s.me&&s.me.salary)||150000)/Math.max(1,s.e.minWage),1)} katı. Bu makul mü?`,
  opts:[{t:'"Maaşımı dondurdum, kriz bitene kadar artmayacak."',pledge:'freezeSalary',fx:{vote:.9,integrity:8,segMinwage:5,credibility:3},note:'Jest karşılık bulur'},
        {t:'"Görevin ağırlığıyla orantılı bir ücret."',fx:{vote:-.7,integrity:-4,segMinwage:-5},note:'Dürüst ama soğuk'},
        {t:'"Bu tartışma gündem saptırmaktan ibaret."',fx:{vote:-1.0,integrity:-7,unrest:4},note:'Savunmacı cevap konuyu büyütür'}]},
 {id:'cbi',outlet:'Piyasa Gündemi',w:s=>0.9,
  q:s=>`Politika faizi ${pct(s.e.rate)}, beklenen enflasyon ${pct(s.e.expect)}. Merkez Bankası'nın bağımsızlığı konusunda tavrınız ne?`,
  opts:[{t:'"Merkez Bankası kararlarını tamamen bağımsız alır."',pledge:'noCut',fx:{credibility:6,expect:-.8,vote:-.3},note:'Piyasa güveni ↑ · kısa vadede popülerlik ↓'},
        {t:'"Faiz sebeptir, enflasyon sonuçtur. Gerekirse indiririz."',pledge:'noHike',fx:{credibility:-9,expect:2.2,usdtry:2.5,vote:.6},note:'Tabanı memnun eder · kur ve beklenti sert tepki verir'},
        {t:'"Öncelik enflasyon; araç tercihini teknik kadrolar yapar."',fx:{credibility:2,expect:-.3},note:'Güvenli ama etkisi sınırlı'}]},
 {id:'arazam',outlet:'Kanal Ekonomi',w:s=>(s.month===1||!araZamFree())?0:(s.e.realIncome<102?1.7:0.5),
  q:s=>`Asgari ücret ${nf(s.e.minWage,0)} ₺, ortalama kira ${nf(s.e.px.rent,0)} ₺. Ara zam gelecek mi?`,
  opts:[{t:'"Yıl bitmeden ara zam yapacağız, bu bir taahhüttür."',pledge:'doArazam',fx:{vote:1.2,expect:1.2,credibility:-3,segMinwage:7},note:'Destek ↑ · beklentiler bozulur · Hükümet Kararları\'nda "Asgari Ücrete Ara Zam" kartıyla tutulur'},
        {t:'"Enflasyon düşerse gerek kalmaz; önce fiyat istikrarı."',pledge:'noArazam',fx:{vote:-.8,credibility:5,expect:-.6,segMinwage:-5},note:'Tutarlılık ↑ · dar gelirli tepkisi ↑'},
        {t:'"Değerlendiriyoruz, verileri görelim."',fx:{vote:-.2,credibility:-1},note:'Kaçamak cevap kimseyi memnun etmez'}]},
 {id:'fx',outlet:'Anadolu İktisat',w:s=>s.e.reserves<110?1.8:0.7,
  q:s=>(s.fxSold||0)>0
    ? `Bugüne kadar ${nf(s.fxSold,0)} milyar dolar sattınız, rezerv ${nf(s.e.reserves,0)} milyar dolara indi ve kur ${nf(s.e.usdtry,2)}. Müdahaleye devam edecek misiniz?`
    : `Rezervler ${nf(s.e.reserves,0)} milyar dolar, kur ${nf(s.e.usdtry,2)}. Kuru savunmak için rezerv satmayı düşünüyor musunuz?`,
  opts:[{t:'"Kur piyasada belirlenir; rezervi savunmaya harcamayız."',pledge:'noFxSale',fx:{credibility:5,usdtry:1.5,expect:.3},note:'Rezerv korunur · kur serbest kalır'},
        {t:'"Spekülatif hareketlere karşı her aracı kullanırız."',fx:{credibility:-2,usdtry:-2,reserves:-9},note:'Kur sakinleşir · cephane erir'},
        {t:'"Rezervlerimiz güçlü, endişeye mahal yok."',fx:{credibility:-4,vote:.2},note:'Piyasa bu cevaba inanmaz'}]},
 {id:'graft',outlet:'Başkent Hattı',w:s=>s.p.integrity<55?1.6:0.35,
  q:s=>'Bakanlık ihalelerine ilişkin iddialar var. Soruşturma açılacak mı?',
  opts:[{t:'"Dosya savcılığa gönderildi, ilgili isim görevden alındı."',fx:{credibility:7,integrity:12,vote:-.5,cds:-18},note:'Kurumsal güven ↑ · parti içi maliyet'},
        {t:'"İddialar asılsız, arkadaşımıza güveniyoruz."',fx:{credibility:-7,integrity:-14,vote:.3,cds:22},note:'Risk primi ↑ · uzun vadede daha pahalı'},
        {t:'"Yargı süreci işliyor, yorum yapmam doğru olmaz."',fx:{credibility:-1,integrity:-4},note:'Konu kapanmaz, tekrar gündeme gelir'}]}
];

export const EVENTS=[
 {id:'tweet',at:5,ico:'🇺🇸',kicker:'Dış Politika Şoku',title:'ABD Başkanı\'ndan gümrük tarifesi paylaşımı',
  lede:'ABD Başkanı sosyal medyadan çelik ve alüminyum tarifelerinin iki katına çıkacağını duyurdu. Açılışta kur %6 yukarıda, risk primi 80 puan arttı.',
  apply:s=>{s.e.usdtry*=1.06;s.e.fxHist.push(6);s.e.cds+=80;s.e.expect+=1.2;s.e.shock.risk+=16;s.e.shock.fuel+=3.5;},
  opts:[{t:'Sert karşılık ver: misilleme tarifesi açıkla.',fx:{vote:1,usdtry:1.5,cds:15,gap:-.4},note:'Milli tepki ↑ · piyasa daha da ürker'},
        {t:'Sessiz diplomasi: heyet gönder, açıklama yapma.',fx:{vote:-.6,usdtry:-1.5,cds:-25,credibility:3},note:'Piyasa sakinleşir · zayıflık algısı'},
        {t:'Koordineli müdahale: 8 milyar dolar sat.',fx:{usdtry:-3.5,reserves:-8,credibility:1},note:'Kur hızla geriler · rezerv erir'}]},
 {id:'graft',at:14,ico:'⚖️',kicker:'İç Politika',title:'Bakanlıkta ihale soruşturması',
  lede:'Bir bakanlığın altyapı ihalelerinde usulsüzlük iddiaları belgelerle gündeme geldi. Muhalefet istifa istiyor, sermaye çevreleri kuralların herkese eşit uygulandığı mesajını bekliyor.',
  apply:s=>{s.p.integrity-=8;s.e.shock.risk+=9;},
  opts:[{t:'Bakanı görevden al, dosyayı savcılığa gönder.',fx:{integrity:16,credibility:6,cds:-20,vote:-.9},note:'Hukuk işler · parti içi kriz'},
        {t:'Sahip çık: "kumpas" açıklaması yap.',fx:{integrity:-16,credibility:-8,cds:30,vote:.5,segCapital:-6},note:'Taban memnun · yatırımcı kaçar'},
        {t:'İdari soruşturma başlat, sonucu bekle.',fx:{integrity:-2,credibility:-2,cds:6},note:'Zaman kazanırsın, konu kapanmaz'}]},
 {id:'globalrate',at:23,ico:'🌐',kicker:'Küresel Piyasalar',title:'Fed 75 baz puan artırdı',
  lede:'Küresel finansal koşullar sıkılaştı. Gelişmekte olan ülkelerden sermaye çıkışı hızlandı.',
  apply:s=>{s.e.usdtry*=1.04;s.e.fxHist.push(4);s.e.cds+=45;s.e.shock.risk+=22;},
  opts:[{t:'Politika faizini 300 baz puan artır.',fx:{rate:3,credibility:5,usdtry:-2},note:'Kur korunur · büyüme feda'},
        {t:'Bekle ve gör.',fx:{usdtry:2.5,expect:.8},note:'Kur baskısı sürer'},
        {t:'Makro ihtiyati tedbirler al.',fx:{usdtry:-1,credibility:-3,gap:-.3},note:'Kısmi fayda · piyasa hoşlanmaz'}]},
 {id:'drought',at:32,ico:'🌾',kicker:'Arz Şoku',title:'Kuraklık gıda fiyatlarını vurdu',
  lede:'Hububat rekoltesi %22 düştü. Gıda enflasyonu çift haneli sıçradı.',
  apply:s=>{s.e.inflation+=1.0;s.e.core+=.4;s.e.shock.food+=14;},
  opts:[{t:'Gümrüksüz buğday ithalatı aç.',fx:{inflation:-1.4,budget:-.3,segSme:-4},note:'Fiyat düşer · çiftçi tepkisi'},
        {t:'Üreticiye doğrudan destek ödemesi.',fx:{budget:-.6,vote:.6,inflation:.2},note:'Kırsal destek ↑ · bütçe yükü'},
        {t:'Müdahale etme, piyasa dengelesin.',fx:{inflation:.8,vote:-.8},note:'Bütçe korunur · halk tepkisi'}]},
 {id:'fdi',at:40,ico:'🏗️',kicker:'Sermaye Girişi',title:'Dev batarya fabrikası yatırımı',
  lede:'Asyalı bir üretici 4,5 milyar dolarlık batarya fabrikası için niyet mektubu imzaladı.',
  apply:s=>{s.e.usdtry*=.975;s.e.cds-=30;s.e.shock.risk=Math.max(0,s.e.shock.risk-8);},
  opts:[{t:'Teşvik paketini genişlet, hızlı izin ver.',fx:{gap:.5,supply:.05,budget:-.4,vote:.7,segCapital:5},note:'Potansiyel büyüme ↑ · bütçe maliyeti'},
        {t:'Standart teşvik uygula.',fx:{gap:.2,supply:.02,vote:.2},note:'Dengeli'},
        {t:'Yerli üretici koruması için şart koş.',fx:{segSme:5,segCapital:-3,cds:8},note:'KOBİ memnun · yatırımcı çekimser'}]}
];
