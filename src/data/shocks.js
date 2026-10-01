/* ═══════════════ RASTGELE ŞOKLAR ═══════════════
   Sabit takvimli olaylar yerine koşullu ve rastgele dalga.
   Her ayın sonunda bir zar atılır: temel olasılık düşüktür, ama
   ekonomi kırılganlaştıkça (rezerv erimiş, risk primi yüksek, borç
   büyük, kredi balonu şişmiş) kötü haber ihtimali artar. Bir olaydan
   sonra birkaç ay sessizlik olur ki üst üste gelmesin.

   Agirlik alani 0 ise o an olamaz; buyudukce cekilme sansi artar.
   ═══════════════════════════════════════════════ */
export const SHOCKS=[
 /* ── dış dünya ── */
 {id:'oil',ico:'🛢️',kicker:'Küresel Arz Şoku',title:'Petrol fiyatı bir haftada %24 fırladı',
  w:s=>1.0,
  lede:'Üretici ülkeler kotayı kıstı. Brent 24 saatte çift haneli yükseldi; pompaya yansıması birkaç hafta sürecek ama kaçınılmaz.',
  apply:s=>{s.e.shock.fuel+=11;s.e.current-=0.5;s.e.cds+=25;},
  opts:[{t:'ÖTV\'yi geçici olarak indir, pompayı sabitle.',fx:{budget:-.7,inflation:-.9,vote:.7},note:'Vatandaş rahatlar · bütçe deliği büyür'},
        {t:'Stratejik stoktan piyasaya ver.',fx:{inflation:-.5,reserves:-4,cds:5},note:'Kısmi fayda · stok erir'},
        {t:'Piyasa fiyatı geçsin, müdahale etme.',fx:{inflation:.6,vote:-.9,credibility:3},note:'Bütçe korunur · zam sokağa yansır'}]},

 {id:'recession',ico:'🌍',kicker:'Küresel Resesyon',title:'Avrupa\'da talep çöktü, siparişler iptal',
  w:s=>0.8,
  lede:'En büyük ihracat pazarında sanayi siparişleri iki çeyrektir düşüyor. İhracatçı fabrikalar vardiya azaltmaya başladı.',
  apply:s=>{s.e.gap-=1.3;s.e.current-=0.8;s.e.shock.risk+=10;},
  opts:[{t:'İhracatçıya kur ve kredi desteği paketi.',fx:{budget:-.8,gap:.6,vote:.5,segCapital:5},note:'İstihdam korunur · maliyet hazineye'},
        {t:'İç talebi canlandır: kamu yatırımını öne çek.',fx:{gap:.8,inflation:.5,budget:-.9,vote:.6},note:'Büyüme desteklenir · enflasyon ve açık artar'},
        {t:'Bekle, şok geçici.',fx:{gap:-.3,vote:-.6,credibility:2},note:'Maliye korunur · işsizlik yükselir'}]},

 {id:'fedhike',ico:'🏦',kicker:'Küresel Finansal Koşullar',title:'Fed beklenmedik şekilde faiz artırdı',
  w:s=>0.9,
  lede:'Gelişmekte olan ülkelerden sermaye çıkışı hızlandı. Gecelik piyasada TL\'ye talep düştü.',
  apply:s=>{s.e.shock.risk+=20;s.e.usdtry*=1.035;s.e.fxHist.push(3.5);},
  opts:[{t:'Politika faizini 400 baz puan artır.',fx:{rate:4,credibility:6,usdtry:-2.5,gap:-.5},note:'Kur korunur · büyüme feda edilir'},
        {t:'Zorunlu karşılıkla likiditeyi kıs.',fx:{usdtry:-1,credibility:-1,gap:-.3},note:'Kısmi fayda, piyasa yeterli bulmaz'},
        {t:'Tepki verme, dalga geçer.',fx:{usdtry:2.8,expect:1.1,credibility:-5},note:'Kur baskısı birikerek sürer'}]},

 /* ── iç kırılganlık ── */
 {id:'bankrun',ico:'🏧',kicker:'Finansal İstikrar',title:'Orta ölçekli bir bankada mevduat çıkışı',
  w:s=>s.e.credit>42||s.e.cds>480?1.6:0,
  lede:'Kredi portföyü hızlı şişen bir bankanın takipteki alacakları sızdı. Şubelerde kuyruk oluştu, mevduat sahipleri paniğe yakın.',
  apply:s=>{s.e.cds+=55;s.e.credit-=6;s.e.shock.risk+=14;},
  opts:[{t:'Mevduat garantisini sınırsız ilan et, bankayı devral.',fx:{credibility:4,budget:-1.4,cds:-35,vote:-.3},note:'Panik durur · faturayı hazine öder'},
        {t:'Likidite penceresini aç, bankayı ayakta tut.',fx:{cds:-15,inflation:.4,credibility:-2},note:'Zaman kazanılır · para basmış olursun'},
        {t:'Batsın, piyasa disiplini işlesin.',fx:{cds:30,gap:-.8,credibility:6,vote:-1.1},note:'Ahlaki tehlike önlenir · kredi kanalı donar'}]},

 {id:'capflight',ico:'💸',kicker:'Sermaye Çıkışı',title:'Yabancı yatırımcı tahvilden çıkıyor',
  w:s=>s.e.reserves<70||s.e.cds>520?1.8:0,
  lede:'İki büyük fon TL cinsi tahvil pozisyonunu kapattı. Rezervlerin ithalatı karşılama süresi konuşulmaya başlandı.',
  apply:s=>{s.e.shock.risk+=26;s.e.usdtry*=1.05;s.e.fxHist.push(5);s.e.reserves-=5;},
  opts:[{t:'Sert faiz artışıyla pozisyonu savun.',fx:{rate:6,credibility:8,usdtry:-3.5,gap:-1.0},note:'Çıkış durur · ekonomi frene basar'},
        {t:'Sermaye hareketlerine geçici kısıt getir.',fx:{usdtry:-1.5,credibility:-12,cds:40,segCapital:-8},note:'Kanama yavaşlar · itibar yıllarca sürer'},
        {t:'Rezervden sat, dalgayı karşıla.',fx:{reserves:-14,usdtry:-2},note:'Cephane erir, sorun ertelenir'}]},

 {id:'downgrade',ico:'📉',kicker:'Kredi Notu',title:'Derecelendirme kuruluşu notu indirdi',
  w:s=>s.e.debt>58||s.e.budget<-7?1.5:0,
  lede:'Not bir kademe düşürüldü, görünüm negatif. Gerekçe: bütçe açığı ve kamu borcunun seyri.',
  apply:s=>{s.e.cds+=45;s.e.shock.risk+=12;},
  opts:[{t:'Orta vadeli mali program açıkla, harcamayı kıs.',fx:{budget:1.2,gap:-.7,credibility:7,cds:-30,vote:-1.0},note:'Piyasa inanır · seçmen sıkışır'},
        {t:'"Siyasi karar" de, görmezden gel.',fx:{credibility:-6,cds:25,vote:.4},note:'Taban memnun · borçlanma pahalılaşır'},
        {t:'Kuruluşla teknik görüşme başlat.',fx:{cds:-8,credibility:1},note:'Zaman kazanırsın, not dönmez'}]},

 /* ── afet ve arz ── */
 {id:'quake',ico:'🏚️',kicker:'Afet',title:'Büyük deprem: üç ilde ağır hasar',
  w:s=>0.5,
  lede:'Sanayi bölgesini de kapsayan geniş bir alan etkilendi. Barınma, lojistik ve üretim aynı anda durdu.',
  apply:s=>{s.e.gap-=1.0;s.e.shock.food+=5;s.p.morale-=8;s.e.potential*=0.994;},
  opts:[{t:'Büyük yeniden inşa seferberliği ilan et.',fx:{budget:-2.2,gap:1.2,supply:.03,vote:1.4,segSme:6},note:'Toparlanma hızlanır · bütçe ağır yara alır'},
        {t:'Hedefli konut ve işyeri desteği ver.',fx:{budget:-1.0,gap:.5,vote:.6},note:'Dengeli · tam çözmez'},
        {t:'Mevcut bütçeyle idare et.',fx:{vote:-1.6,unrest:8,credibility:1},note:'Maliye korunur · halk affetmez'}]},

 {id:'drought2',ico:'🌾',kicker:'Arz Şoku',title:'Kuraklık hasadı vurdu',
  w:s=>0.9,
  lede:'Hububat ve yem bitkilerinde rekolte sert düştü. Market raflarına yansıması birkaç ay sürecek.',
  apply:s=>{s.e.shock.food+=13;},
  opts:[{t:'Gümrüksüz ithalat kapısını aç.',fx:{inflation:-1.1,current:-.4,segSme:-5},note:'Fiyat düşer · çiftçi tepkili'},
        {t:'Üreticiye doğrudan destek ödemesi.',fx:{budget:-.8,vote:.7,inflation:.3},note:'Kırsal destek ↑ · bütçe yükü'},
        {t:'Piyasa dengelesin.',fx:{inflation:.7,vote:-.9},note:'Bütçe korunur · mutfak yanar'}]},

 {id:'gascut',ico:'🔥',kicker:'Enerji Arzı',title:'Doğalgaz sevkiyatında kesinti',
  w:s=>0.7,
  lede:'Tedarikçi ülke teknik gerekçeyle akışı azalttı. Sanayi için kısıtlı tedarik planı masada.',
  apply:s=>{s.e.shock.fuel+=9;s.e.current-=0.4;},
  opts:[{t:'Sanayiye kısıtlı gaz, haneye öncelik.',fx:{gap:-.7,vote:.6,segCapital:-6},note:'Ev sıcak kalır · üretim durur'},
        {t:'Spot piyasadan pahalı gaz al.',fx:{budget:-1.1,current:-.5,inflation:.4},note:'Üretim sürer · fatura kabarır'},
        {t:'Fiyatı serbest bırak, talep kendi ayarlasın.',fx:{inflation:1.0,vote:-1.0,budget:.4},note:'Bütçe rahatlar · enflasyon sıçrar'}]},

 /* ── olumlu sürprizler ── */
 {id:'gasfind',ico:'⛏️',kicker:'Keşif',title:'Denizde büyük doğalgaz rezervi bulundu',
  w:s=>0.45,
  lede:'Sondajda ticari büyüklükte rezerv doğrulandı. Üretime geçmesi yıllar alacak ama piyasa bugünden fiyatlıyor.',
  apply:s=>{s.e.cds-=28;s.e.usdtry*=0.985;s.p.morale+=5;},
  opts:[{t:'Hemen üretim yatırımı programı başlat.',fx:{budget:-1.0,supply:.04,current:.3,vote:1.0},note:'Uzun vadeli kazanç · peşin maliyet'},
        {t:'Uluslararası ortakla paylaşımlı geliştir.',fx:{supply:.025,current:.25,segCapital:4,vote:.4},note:'Risk paylaşılır · pay küçülür'},
        {t:'Sadece duyur, acele etme.',fx:{vote:.6,credibility:-2},note:'Moral etkisi · somut kazanç yok'}]},

 {id:'tourism',ico:'🏖️',kicker:'Dış Denge',title:'Turizmde rekor sezon',
  w:s=>0.6,
  lede:'Rezervasyonlar geçen yılı üçte bir aştı. Döviz girişi beklentinin üzerinde.',
  apply:s=>{s.e.current+=0.9;s.e.reserves+=7;s.e.cds-=15;},
  opts:[{t:'Kazancı rezerv biriktirmekte kullan.',fx:{reserves:10,credibility:4,usdtry:.5},note:'Cephane artar · kur biraz yukarı'},
        {t:'Turizm altyapısına yatırım yap.',fx:{budget:-.7,supply:.02,segSme:5},note:'Kalıcı kapasite · bütçe maliyeti'},
        {t:'Dövizi piyasaya ver, kuru bastır.',fx:{usdtry:-2,reserves:-3,inflation:-.4},note:'Kur rahatlar · fırsat kaçar'}]},

 {id:'fdi2',ico:'🏭',kicker:'Sermaye Girişi',title:'Dev üretici yatırım kararı açıkladı',
  w:s=>s.e.credibility>45?1.1:0.3,
  lede:'Küresel bir üretici bölgedeki en büyük fabrikasını burada kurma niyetini açıkladı. Şartlar müzakere ediliyor.',
  apply:s=>{s.e.usdtry*=0.978;s.e.cds-=25;},
  opts:[{t:'Teşviki genişlet, izinleri hızlandır.',fx:{gap:.5,supply:.035,budget:-.5,vote:.8,segCapital:6},note:'Kapasite ↑ · teşvik maliyeti'},
        {t:'Standart teşvik, özel muamele yok.',fx:{gap:.2,supply:.015,credibility:3},note:'Dengeli ve kurallı'},
        {t:'Yerli ortaklık ve teknoloji transferi şart koş.',fx:{supply:.02,segSme:6,segCapital:-4,cds:8},note:'Uzun vadede değerli · yatırımcı çekimser'}]},

 /* ── siyasi ── */
 {id:'leak',ico:'📂',kicker:'İç Politika',title:'Kamu ihalesine dair belgeler sızdı',
  w:s=>s.p.integrity<58?1.4:0.5,
  lede:'Bir müteahhit grubuyla yazışmalar basına ulaştı. Muhalefet meclis soruşturması istiyor.',
  apply:s=>{s.p.integrity-=7;s.e.shock.risk+=8;},
  opts:[{t:'Bağımsız komisyon kur, her şeyi aç.',fx:{integrity:15,credibility:6,cds:-18,vote:-.8},note:'Hukuk işler · siyasi bedel'},
        {t:'Kumpas de, karşı dava aç.',fx:{integrity:-12,credibility:-6,cds:20,vote:.5,segYouth:-5},note:'Taban kenetlenir · kurumlar yıpranır'},
        {t:'İlgili bürokratı görevden al, konuyu kapat.',fx:{integrity:4,credibility:1,vote:-.2},note:'Orta yol · iz bırakır'}]},

 {id:'strike',ico:'✊',kicker:'Çalışma Hayatı',title:'Metal ve tekstilde genel grev kararı',
  w:s=>s.p.unrest>52?1.5:0.3,
  lede:'İki büyük konfederasyon aynı gün iş bırakma ilan etti. Limanlarda ve fabrikalarda üretim duracak.',
  apply:s=>{s.p.unrest+=9;s.e.gap-=0.5;},
  opts:[{t:'Masaya otur, ek zam ve iyileştirme ver.',fx:{vote:.9,inflation:.6,segMinwage:8,segCapital:-5,budget:-.5},note:'Grev biter · ücret-fiyat baskısı'},
        {t:'Grevi erteleyen karar çıkar.',fx:{unrest:10,integrity:-8,vote:-.4,segMinwage:-7},note:'Üretim sürer · sokak gerilir'},
        {t:'Taraflar kendi anlaşsın, devlet karışmasın.',fx:{gap:-.6,credibility:3,vote:-.5},note:'Tarafsız duruş · süreç uzar'}]},
];
