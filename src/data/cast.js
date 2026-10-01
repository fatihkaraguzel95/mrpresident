import {activeSpendPct} from '../core/helpers.js';
import {$, K, S, nf, pct, rnd, signed} from '../core/state.js';
import {has} from './policies.js';
import {MARKED} from '../ui/panels.js';

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
export const FXN={credibility:'Politika güvenilirliği',expect:'Enflasyon beklentisi',cds:'Risk primi (bp)',
 usdtry:'USD/₺ (%)',vote:'Oy potansiyeli',integrity:'Şeffaflık',budget:'Bütçe dengesi',
 segCapital:'Sanayici desteği',segMinwage:'Asgari ücretli desteği',segYouth:'Genç desteği',
 segSme:'Esnaf desteği',segRetiree:'Emekli desteği'};
export const cabOf=id=>((S&&S.cab&&S.cab[id])||{});
export const advName=a=>cabOf(a.id).name||a.name;
export const advPx=a=>{const c=cabOf(a.id);return (c.av!=null&&AVATARS[c.av])?AVATARS[c.av]:a.px;};
export const advLine=a=>{const c=cabOf(a.id);
  if(c.green>0&&c.green>(c.green0||0)-2)return ROOKIE[a.id];
  if(c.mark>0)return MARKED[a.id];
  return a.line(S);};
export const cabGreen=()=>ADVISORS.reduce((n,a)=>n+(cabOf(a.id).green>0?1:0),0);
export const cabMarked=()=>ADVISORS.reduce((n,a)=>n+(cabOf(a.id).mark>0?1:0),0);
export const pickFree=(list,used)=>{const f=list.filter(x=>!used.includes(x));
  const p=f.length?f:list; return p[Math.floor(rnd()*p.length)];};

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
 {outlet:'Piyasa Gündemi',q:'Merkez Bankası\'nın bağımsızlığı konusunda hükümetin tavrı ne?',
  opts:[{t:'"Merkez Bankası kararlarını tamamen bağımsız alır."',fx:{credibility:6,expect:-.8,vote:-.3},note:'Piyasa güveni ↑ · kısa vadede popülerlik ↓'},
        {t:'"Faiz sebeptir, enflasyon sonuçtur. Gerekirse indiririz."',fx:{credibility:-9,expect:2.2,usdtry:2.5,vote:.6},note:'Tabanı memnun eder · kur ve beklenti sert tepki verir'},
        {t:'"Öncelik enflasyon; araç tercihini teknik kadrolar yapar."',fx:{credibility:2,expect:-.3},note:'Güvenli ama etkisi sınırlı'}]},
 {outlet:'Kanal Ekonomi',q:'Asgari ücretliler ara zam bekliyor. Söz veriyor musunuz?',
  opts:[{t:'"Temmuz\'da ara zam yapacağız, bu bir taahhüttür."',fx:{vote:1.2,expect:1.2,credibility:-3,segMinwage:7},note:'Destek ↑ · beklentiler bozulur'},
        {t:'"Enflasyon düşerse gerek kalmaz; önce fiyat istikrarı."',fx:{vote:-.8,credibility:5,expect:-.6,segMinwage:-5},note:'Tutarlılık ↑ · dar gelirli tepkisi ↑'},
        {t:'"Değerlendiriyoruz, verileri görelim."',fx:{vote:-.2,credibility:-1},note:'Kaçamak cevap kimseyi memnun etmez'}]},
 {outlet:'Anadolu İktisat',q:'Kuru savunmak için müdahaleye devam edecek misiniz?',
  opts:[{t:'"Kur piyasada belirlenir; rezervi savunmaya harcamayız."',fx:{credibility:5,usdtry:1.5,expect:.3},note:'Rezerv korunur · kur serbest kalır'},
        {t:'"Spekülatif hareketlere karşı her aracı kullanırız."',fx:{credibility:-2,usdtry:-2,reserves:-9},note:'Kur sakinleşir · cephane erir'},
        {t:'"Rezervlerimiz güçlü, endişeye mahal yok."',fx:{credibility:-4,vote:.2},note:'Piyasa bu cevaba inanmaz'}]},
 {outlet:'Başkent Hattı',q:'Bakanlık ihalelerine ilişkin iddialar var. Soruşturma açılacak mı?',
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
