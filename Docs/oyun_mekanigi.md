# AH BİR BAŞKAN OLSAM --- Ekonomik Politika Simülasyonu

## Oyun Mekaniği ve Sistem Tasarım Dokümanı

**Doküman amacı:** Oyunun bütün temel sistemlerini, kararları, ekonomik
etkileri, gecikmeli sonuçları, olayları ve oyun döngüsünü tek bir yerde
tanımlamak.

------------------------------------------------------------------------

# 1. Oyunun Temel Fikri

Oyuncu bir ülkenin ekonomik yönetiminden sorumlu başkan/hükümet
lideridir.

Oyuncunun amacı tek bir göstergeyi maksimum yapmak değildir. Aynı anda:

-   enflasyonu kontrol altında tutmak,
-   ekonomik büyümeyi sürdürmek,
-   işsizliği azaltmak,
-   para biriminin istikrarını korumak,
-   halk desteğini korumak,
-   kamu maliyesini sürdürülebilir tutmak,
-   yatırım ve üretim kapasitesini artırmak,
-   merkez bankası/piyasa güvenilirliğini korumak

zorundadır.

## Temel tasarım ilkesi

Her politika bir şeyi düzeltirken başka bir şeyi bozabilmelidir.

Örnek:

> Faiz artır → enflasyon baskısı azalır → kur desteklenebilir → fakat
> kredi, tüketim ve yatırım yavaşlar → büyüme düşebilir → işsizlik
> artabilir.

Başka örnek:

> Asgari ücret artır → düşük gelirli kesimin geliri ve halk desteği
> artar → tüketim artabilir → fakat şirket maliyetleri ve talep kaynaklı
> enflasyon artabilir.

Oyuncuya "tek doğru karar" verilmez. Oyuncu politika bileşimi ve
zamanlama seçer.

------------------------------------------------------------------------

# 2. Zaman Sistemi

Oyun **çeyrekler** üzerinden ilerler.

-   1 çeyrek = 3 ay
-   1 yıl = 4 çeyrek

Oyuncu kararlarını verir ve ardından:

> **Çeyreği İlerle**

butonuna basar.

Her çeyrekte:

1.  Önceki kararların gecikmeli etkileri uygulanır.
2.  Yeni ekonomik veriler hesaplanır.
3.  Rastgele veya koşullu olaylar gerçekleşebilir.
4.  Yeni hükümet teklifleri/kararları gelir.
5.  Piyasa göstergeleri güncellenir.
6.  Halk tepkisi ve politika güvenilirliği güncellenir.
7.  Yeni çeyrek için danışman raporu oluşturulur.

------------------------------------------------------------------------

# 3. Ana Ekonomik Göstergeler

Ana ekranda sürekli görünmesi gereken göstergeler:

  -----------------------------------------------------------------------
  Gösterge                            Açıklama
  ----------------------------------- -----------------------------------
  Manşet enflasyon                    Genel tüketici fiyat artışı

  Çekirdek enflasyon                  Daha kalıcı fiyat baskısını
                                      gösteren ölçüm

  Enflasyon beklentisi                Halk/piyasanın gelecekteki
                                      enflasyon beklentisi

  GSYH büyümesi                       Ekonomik aktivitenin büyüme oranı

  İşsizlik                            İşgücündeki işsizlerin oranı

  USD/yerel para                      Döviz kuru

  Politika faizi                      Merkez bankasının temel faiz aracı

  Reel faiz                           Nominal faiz - beklenen enflasyon
                                      yaklaşık hesabı

  Rezervler                           Merkez bankası döviz rezervleri

  Cari denge                          Dış ticaret ve gelir hareketlerinin
                                      genel dengesi

  Bütçe dengesi                       Hükümet gelirleri - giderleri

  Kamu borcu/GSYH                     Kamu borcunun ekonomiye oranı

  Halk tepkisi                        Vatandaş memnuniyeti

  Kamuoyu desteği                     Hükümete verilen genel destek

  Politika güvenilirliği              Piyasanın politikaya duyduğu güven

  CDS/risk primi                      Ülke riskinin piyasa algısı

  Kredi büyümesi                      Bankacılık sistemindeki kredi
                                      genişlemesi

  Yatırım                             Özel + kamu yatırım aktivitesi

  Tüketim                             Hanehalkı tüketimi

  Üretim kapasitesi                   Ekonominin uzun vadeli üretim gücü
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 4. Enflasyon Sistemi

## 4.1 Manşet enflasyon

Ekonomideki genel fiyat artışıdır.

Örneğin:

> Manşet enflasyon = %38

## 4.2 Çekirdek enflasyon

Daha oynak bazı kalemlerin etkisini azaltarak temel fiyat baskısını
göstermeye çalışır.

Oyunda çekirdek enflasyon:

-   ücretler,
-   hizmet fiyatları,
-   kira,
-   üretim maliyetleri,
-   talep,
-   enflasyon beklentileri

gibi daha kalıcı faktörlerden etkilenmelidir.

## 4.3 Enflasyon beklentisi

Beklenti, gerçek enflasyondan bağımsız bir değişken olarak tutulmalıdır.

Örnek:

> Gerçekleşen enflasyon %38\
> Beklenti %25

Beklenti düşük kalıyorsa merkez bankasının güvenilirliği daha yüksek
olabilir.

Beklenti yükselirse:

> ücret talepleri ↑\
> fiyatlama davranışı ↑\
> kur talebi ↑\
> tahvil faizi ↑

gibi etkiler ortaya çıkabilir.

## 4.4 Basitleştirilmiş enflasyon modeli

``` text
Enflasyon(t+1) =
    Enflasyon(t)
    + Talep Baskısı
    + Ücret Baskısı
    + Kur Geçişkenliği
    + Enerji/Emtia Şoku
    + Beklenti Etkisi
    - Para Politikası Etkisi
    - Arz/Kapasite Etkisi
```

------------------------------------------------------------------------

# 5. Reel Faiz

Yaklaşık:

``` text
Reel Faiz = Nominal Faiz - Beklenen Enflasyon
```

Örnek:

``` text
Politika faizi = %20
Enflasyon beklentisi = %25

Reel faiz ≈ -%5
```

Daha hassas hesap:

``` text
Reel Faiz = (1 + Nominal Faiz) / (1 + Beklenen Enflasyon) - 1
```

Oyun içi danışman ekranında hızlı yorum için yaklaşık yöntem
kullanılabilir.

Negatif reel faiz:

-   TL mevduatın cazibesini azaltabilir,
-   döviz talebini artırabilir,
-   varlık fiyatlarını artırabilir,
-   enflasyon beklentilerini yükseltebilir.

Pozitif reel faiz:

-   tasarrufu destekleyebilir,
-   döviz talebini azaltabilir,
-   kredi ve tüketimi yavaşlatabilir.

------------------------------------------------------------------------

# 6. Para Politikası Sistemi

## 6.1 Politika faizi

Ana merkez bankası aracıdır.

### Faiz artırılırsa

``` text
Faiz ↑
→ kredi maliyeti ↑
→ kredi talebi ↓
→ tüketim ↓
→ yatırım ↓
→ toplam talep ↓
→ enflasyon baskısı ↓

Aynı zamanda:
Faiz ↑
→ TL varlıklarının cazibesi ↑
→ döviz talebi ↓
→ kur baskısı ↓
```

Yan etkiler:

``` text
Büyüme ↓
İşsizlik ↑
Halk tepkisi ↓
Kredi riski ↑
```

### Faiz düşürülürse

Tersi etkiler ortaya çıkar.

## 6.2 Faiz değişiminin gecikmesi

Faiz kararının tüm etkisi aynı çeyrekte oluşmaz.

Önerilen etki dağılımı:

-   Aynı çeyrek: %10
-   +1 çeyrek: %30
-   +2 çeyrek: %30
-   +3 çeyrek: %20
-   +4 çeyrek: %10

Bu oranlar oyun dengesi için ayarlanabilir.

------------------------------------------------------------------------

# 7. APİ / Likidite Sistemi

APİ = Açık Piyasa İşlemleri.

Oyundaki APİ fonlaması, bankacılık sistemine verilen TL likiditesini
temsil eder.

## APİ artırılırsa

``` text
APİ ↑
→ bankacılık likiditesi ↑
→ kredi koşulları gevşer
→ tüketim ↑
→ yatırım ↑
→ büyüme ↑
→ işsizlik ↓

Ancak:
→ talep ↑
→ enflasyon baskısı ↑
→ kur baskısı ↑
```

## APİ azaltılırsa

Tersi yönde çalışır.

APİ özellikle faiz sabit tutulurken ekonomiyi ince ayarlamak için
kullanılabilir.

------------------------------------------------------------------------

# 8. Zorunlu Karşılık

## TL ZK

ZK artırılırsa:

``` text
Bankaların serbest likiditesi ↓
→ kredi kapasitesi ↓
→ kredi büyümesi ↓
→ talep ↓
→ enflasyon baskısı ↓
```

Ancak:

``` text
Büyüme ↓
```

ZK azaltılırsa tersi olur.

## Döviz ZK

Döviz likiditesini ve bankaların döviz pozisyonlarını etkiler.

Kur, rezerv ve döviz likiditesi yönetiminde kullanılabilir.

------------------------------------------------------------------------

# 9. İletişim Politikası

Üç temel seçenek:

### Şahin

Mesaj:

> "Enflasyonla mücadelede kararlıyız."

Etkileri:

-   enflasyon beklentisi ↓
-   kur baskısı ↓
-   politika güvenilirliği ↑
-   kısa vadede halk tepkisi biraz ↓ olabilir

### Nötr

Piyasaya belirgin yönlendirme verilmez.

### Güvercin

Mesaj:

> "Büyümeyi desteklemeye hazırız."

Etkileri:

-   büyüme beklentisi ↑
-   yatırım beklentisi ↑
-   ancak enflasyon beklentisi ↑ olabilir

------------------------------------------------------------------------

# 10. İleri Yönlendirme

Seçenekler:

-   Belirsiz
-   Sıkı duruş sürecek
-   Gevşeme gelebilir

Örneğin:

> "Sıkı duruş sürecek"

denildikten sonra kısa sürede faiz indirilirse:

``` text
Güvenilirlik ↓↓↓
```

Söz tutulursa:

``` text
Güvenilirlik ↑
Beklentiler daha iyi çıpalanır
```

Bu sistem oyuncuyu tutarlı olmaya zorlar.

------------------------------------------------------------------------

# 11. Döviz Sistemi

Ana gösterge:

> USD/TRY

## Döviz satışı

``` text
Döviz sat
→ piyasadaki döviz arzı ↑
→ kur baskısı ↓
→ rezervler ↓
```

## Döviz alımı

``` text
Döviz al
→ rezervler ↑
→ piyasaya TL çıkışı ↑
→ kur üzerinde yukarı yönlü baskı
```

Oyuncuya seçenek:

-   1 milyar \$
-   5 milyar \$
-   10 milyar \$

verilebilir.

Rezerv kritik seviyeye düşerse:

> "Merkez bankasının döviz cephanesi sorgulanıyor."

olayı tetiklenebilir.

------------------------------------------------------------------------

# 12. Döviz Mevduatı ve Dolarizasyon

Hanehalkının portföy dağılımı takip edilir:

``` text
TL mevduat %
Döviz mevduatı %
```

Negatif reel faiz uzun süre devam ederse:

``` text
TL mevduatı ↓
Döviz mevduatı ↑
```

Bu durum:

``` text
Döviz talebi ↑
→ USD/TRY ↑
→ ithalat maliyeti ↑
→ enflasyon ↑
```

şeklinde ikinci bir enflasyon döngüsü oluşturabilir.

------------------------------------------------------------------------

# 13. Hükümet Politikaları

Merkez bankası dışında oyuncunun kullanabileceği ana sistem budur.

Politikalar doğrudan "paket" şeklinde sunulmalıdır.

Her politika:

-   maliyet,
-   süre,
-   hedef sektör,
-   kısa vadeli etki,
-   orta vadeli etki,
-   uzun vadeli etki

taşımalıdır.

------------------------------------------------------------------------

# 14. Teknoloji Politikaları

## Teknoloji yatırım paketi

> Kamu teknoloji yatırımlarını artır.

Etkiler:

``` text
Kamu yatırımı ↑
Kısa vadeli büyüme ↑
Uzun vadeli verimlilik ↑
Potansiyel büyüme ↑
```

Maliyeti:

``` text
Bütçe açığı ↑
```

## Yapay zekâ yatırım programı

-   AI araştırma fonu
-   startup desteği
-   üniversite fonu
-   kamu AI altyapısı

Uzun vadede:

``` text
Verimlilik ↑
Üretim kapasitesi ↑
Potansiyel büyüme ↑
```

## Dijital dönüşüm teşviki

Şirketlere dijitalleşme hibesi.

``` text
Verimlilik ↑
Şirket yatırımı ↑
Uzun vadeli üretim ↑
```

------------------------------------------------------------------------

# 15. Sanayi Politikaları

Seçenekler:

-   Sanayi yatırım teşvik paketi
-   Fabrika yatırım hibesi
-   KOBİ destek paketi
-   Makine/ekipman yatırım teşviki
-   Yerli üretim teşviki
-   Stratejik sektör teşviki
-   İhracat teşviki
-   İhracat kredisi desteği

Örnek:

``` text
Sanayi teşviki
→ yatırım ↑
→ istihdam ↑
→ üretim kapasitesi ↑
→ uzun vadeli büyüme ↑
```

Ancak:

``` text
Bütçe maliyeti ↑
```

------------------------------------------------------------------------

# 16. AR-GE ve Bilim

Kararlar:

-   AR-GE bütçesini artır
-   Üniversitelere araştırma fonu ver
-   Yapay zekâ fonu oluştur
-   Yarı iletken/çip programı
-   Biyoteknoloji fonu
-   Tıbbi teknoloji fonu
-   Startup yatırım fonu
-   Patent teşviki

Ana etkisi kısa vadeden çok uzun vadede görülür.

------------------------------------------------------------------------

# 17. Altyapı Politikaları

Seçenekler:

-   Karayolu
-   Demiryolu
-   Liman
-   Havalimanı
-   Şehir içi ulaşım
-   İnternet altyapısı
-   Elektrik şebekesi
-   Su altyapısı

Kısa vadede:

``` text
Kamu harcaması ↑
→ büyüme ↑
→ istihdam ↑
```

Uzun vadede:

``` text
Altyapı ↑
→ verimlilik ↑
→ üretim kapasitesi ↑
→ potansiyel büyüme ↑
```

------------------------------------------------------------------------

# 18. Enerji Politikaları

Seçenekler:

-   Güneş enerjisi teşviki
-   Rüzgâr enerjisi teşviki
-   Nükleer yatırım
-   Enerji depolama yatırımı
-   Elektrik şebekesi yatırımı
-   Enerji verimliliği programı
-   Sanayi enerji desteği
-   Hanehalkı enerji desteği
-   Bina yalıtım teşviki

Enerji yatırımları kısa vadede bütçe maliyeti yaratırken uzun vadede
enerji arzı ve maliyetlerini iyileştirebilir.

------------------------------------------------------------------------

# 19. İstihdam Politikaları

Seçenekler:

-   Genç istihdam paketi
-   İşe alım teşviki
-   Uzun süreli işsizlere destek
-   İşveren SGK desteği
-   Mesleki eğitim
-   Yeniden eğitim
-   Çıraklık programı
-   Kadın istihdamı desteği
-   Nitelikli işçi çekme programı

Ana etkiler:

``` text
İstihdam ↑
İşsizlik ↓
Hane geliri ↑
Tüketim ↑
```

------------------------------------------------------------------------

# 20. Asgari Ücret

Seçenekler:

-   %0
-   %5
-   %10
-   %15
-   %20
-   %30
-   %40
-   %50

Asgari ücret ↑:

``` text
Düşük gelirli çalışan geliri ↑
Tüketim ↑
Halk desteği ↑

Ancak:
Şirket maliyeti ↑
Hizmet fiyatları ↑
Talep enflasyonu ↑
Bazı sektörlerde istihdam baskısı ↑
```

Ekonomik koşullara göre etkinin büyüklüğü değişmelidir.

------------------------------------------------------------------------

# 21. Emekli Maaşı

Seçenekler:

-   %0
-   %10
-   %20
-   %30
-   %40

Etkiler:

``` text
Emekli geliri ↑
→ tüketim ↑
→ halk desteği ↑
→ büyüme ↑

Ancak:
→ kamu harcaması ↑
→ bütçe açığı ↑
→ talep baskısı ↑
```

------------------------------------------------------------------------

# 22. Sosyal Destekler

Seçenekler:

-   Çocuk yardımı
-   Kira yardımı
-   Enerji yardımı
-   Gıda yardımı
-   Öğrenci bursu
-   İşsizlik desteği
-   Dar gelirliye nakit destek

Ana sonuç:

``` text
Halk desteği ↑
Hanehalkı geliri ↑
Tüketim ↑
```

Maliyet:

``` text
Bütçe açığı ↑
```

------------------------------------------------------------------------

# 23. Vergi Politikaları

## KDV

KDV artır:

``` text
Vergi geliri ↑
Tüketim ↓
Ancak fiyat seviyesi kısa vadede ↑
```

KDV azalt:

``` text
Vergi geliri ↓
Tüketim ↑
Halk desteği ↑
```

## Gelir vergisi

Vergi indirimi:

``` text
Harcanabilir gelir ↑
Tüketim ↑
Halk desteği ↑
```

Ancak:

``` text
Bütçe geliri ↓
```

## Kurumlar vergisi

İndirim:

``` text
Şirket kârlılığı ↑
Yatırım ↑
```

Ancak:

``` text
Vergi geliri ↓
```

------------------------------------------------------------------------

# 24. Kamu Harcamaları

Ana karar kategorileri:

-   Eğitim
-   Sağlık
-   Savunma
-   Altyapı
-   Teknoloji
-   Kültür
-   Spor
-   Enerji
-   Konut
-   Ulaşım
-   AR-GE

Her alanın farklı ekonomik etkisi olmalıdır.

Örneğin:

### Kültür ve etkinlik fonu

``` text
Kamu harcaması ↑
Etkinlik sayısı ↑
Hizmet sektörü aktivitesi ↑
Turizm ↑
Halk memnuniyeti ↑
```

Ama:

``` text
Bütçe maliyeti ↑
```

### Spor yatırımı

``` text
Kamu harcaması ↑
İnşaat/istihdam ↑
Halk memnuniyeti ↑
Uzun vadeli sosyal fayda ↑
```

------------------------------------------------------------------------

# 25. Konut Politikaları

Seçenekler:

-   Sosyal konut programı
-   İlk ev desteği
-   Konut kredisi faiz desteği
-   Kentsel dönüşüm
-   İnşaat teşviki
-   Kiracı desteği
-   Konut arzı programı

Konut kredisi desteği:

``` text
Konut talebi ↑
Kısa vadede konut fiyatları ↑
```

İnşaat teşviki:

``` text
Konut arzı ↑
Uzun vadede fiyat baskısı ↓
```

------------------------------------------------------------------------

# 26. Turizm Politikaları

Seçenekler:

-   Turizm tanıtım kampanyası
-   Otel yatırım teşviki
-   Havalimanı yatırımı
-   Kültür turizmi
-   Sağlık turizmi
-   Kongre turizmi
-   Turizm vergisi indirimi

Etkiler:

``` text
Turist sayısı ↑
→ hizmet ihracatı ↑
→ döviz geliri ↑
→ istihdam ↑
→ büyüme ↑
```

------------------------------------------------------------------------

# 27. Kültür, Spor ve Etkinlik Politikaları

Oyuncuya doğrudan karar olarak:

-   Festival fonu
-   Kültür-sanat fonu
-   Film sektörü desteği
-   Müzik sektörü desteği
-   Spor altyapı yatırımı
-   Büyük uluslararası etkinlik
-   Ulusal spor organizasyonu
-   Müze/tarihi alan yatırımı

verilebilir.

Bunların ekonomik etkisi genellikle:

``` text
Kamu harcaması ↑
→ hizmet sektörü ↑
→ istihdam ↑
→ tüketim/turizm ↑
```

------------------------------------------------------------------------

# 28. Yeşil Dönüşüm

Seçenekler:

-   Elektrikli araç teşviki
-   Şarj istasyonu programı
-   Bina yalıtım desteği
-   Yenilenebilir enerji teşviki
-   Sanayi yeşil dönüşüm kredisi
-   Toplu taşıma yatırımı
-   Karbon azaltma programı

Uzun vadeli etkiler:

``` text
Enerji verimliliği ↑
Üretim maliyetleri ↓
Enerji ithalatı ↓
Dış denge ↑
```

------------------------------------------------------------------------

# 29. Bürokrasi ve Yapısal Reformlar

Bunlar bütçeye çok az yük bindiren ama gecikmeli etkileri olan kararlar
olabilir.

Seçenekler:

-   Şirket kurmayı kolaylaştır
-   Ruhsat işlemlerini hızlandır
-   İnşaat izinlerini hızlandır
-   Vergi işlemlerini dijitalleştir
-   Kamu hizmetlerini dijitalleştir
-   Bürokratik prosedürleri azalt
-   Yatırım izinlerini hızlandır
-   Kamu ihale süreçlerini dijitalleştir

Etkiler:

``` text
İş yapma maliyeti ↓
Yatırım ↑
Şirket kuruluşu ↑
Verimlilik ↑
Uzun vadeli büyüme ↑
```

------------------------------------------------------------------------

# 30. Maliye Politikası ve Bütçe

Her hükümet kararının bir maliyeti olmalıdır.

Ana bütçe göstergeleri:

``` text
Vergi gelirleri
Kamu harcamaları
Bütçe dengesi
Kamu borcu
Borç/GSYH
Faiz giderleri
```

Örneğin:

``` text
Yeni destek paketi = 100 milyar TL
```

Eğer gelir yaratmıyorsa:

``` text
Bütçe açığı ↑
```

Açık büyürse:

``` text
Kamu borcu ↑
Risk primi ↑
Devlet tahvil faizi ↑
Borçlanma maliyeti ↑
```

------------------------------------------------------------------------

# 31. Kamu Borcu

Borç/GSYH seviyeleri risk üretmelidir.

Örnek:

-   %40: düşük risk
-   %60: normal
-   %80: artan risk
-   %100+: yüksek risk

Bunlar kesin gerçek eşikler olarak değil, oyun dengesi için
kullanılmalıdır.

Borç yükseldikçe:

``` text
Risk primi ↑
→ devlet borçlanma faizi ↑
→ faiz gideri ↑
→ bütçe açığı ↑
```

Bir "borç sarmalı" oluşabilir.

------------------------------------------------------------------------

# 32. Cari Denge

Ana etkileyenler:

-   İthalat
-   İhracat
-   Enerji ithalatı
-   Turizm
-   Döviz kuru
-   İç talep

Örneğin:

``` text
İç talep ↑
→ ithalat ↑
→ cari açık ↑
```

Turizm artarsa:

``` text
Döviz geliri ↑
→ cari denge iyileşir
```

Enerji fiyatı artarsa:

``` text
Enerji ithalat faturası ↑
→ cari denge kötüleşir
```

------------------------------------------------------------------------

# 33. Üretim Kapasitesi

Uzun vadeli politikaların önemli özelliği:

**hemen büyük sonuç vermemeleri.**

Örneğin:

> AR-GE + eğitim + altyapı + teknoloji yatırımı

başlangıçta:

``` text
Bütçe maliyeti ↑
```

ama birkaç yıl sonra:

``` text
Verimlilik ↑
Üretim kapasitesi ↑
Potansiyel büyüme ↑
Enflasyon baskısı ↓
```

Bu nedenle oyunun 5-10 yıllık oynanışı olmalıdır.

------------------------------------------------------------------------

# 34. Ekonomik Şoklar

Her çeyrekte olay çıkma ihtimali olabilir.

Örnekler:

### Petrol krizi

``` text
Enerji fiyatı ↑
→ enflasyon ↑
→ cari açık ↑
→ büyüme ↓
```

### Küresel resesyon

``` text
İhracat ↓
→ üretim ↓
→ işsizlik ↑
→ büyüme ↓
```

### Küresel faiz artışı

``` text
Yabancı sermaye çekiciliği ↓
→ kur baskısı ↑
→ finansman maliyeti ↑
```

### Büyük yabancı yatırım

``` text
Sermaye girişi ↑
→ kur baskısı ↓
→ yatırım ↑
→ büyüme ↑
```

### Kuraklık

``` text
Gıda üretimi ↓
→ gıda fiyatları ↑
→ enflasyon ↑
```

### Bankacılık krizi

``` text
Kredi ↓
→ yatırım ↓
→ tüketim ↓
→ büyüme ↓
```

------------------------------------------------------------------------

# 35. Haber Sistemi

Her çeyrek ekonomi haberleri üretilmelidir.

Örnek:

> **"Merkez bankasının faiz kararı piyasalarda olumlu karşılandı."**

> **"Yüksek enflasyon nedeniyle hanehalkının satın alma gücü
> geriledi."**

> **"Yeni teknoloji teşvik paketi yatırımcıların ilgisini çekti."**

> **"KOBİ'ler enerji maliyetlerinden şikâyetçi."**

Haberler sadece dekor olmamalı; bazıları göstergeleri değiştirmeli.

------------------------------------------------------------------------

# 36. Danışman Sistemi

Başkanın farklı danışmanları olabilir:

### Merkez Bankası Başkanı

Para politikası önerir.

> "Reel faiz hâlâ negatif. 100 baz puanlık artış düşünülebilir."

### Maliye Bakanı

Bütçe hakkında öneri verir.

> "Mevcut bütçe açığında yeni 100 milyar TL'lik paket borçlanmayı
> artıracaktır."

### Ekonomi Bakanı

Büyüme/yatırım hakkında öneri verir.

> "Sanayi yatırımlarındaki düşüş nedeniyle teşvik paketi öneriyoruz."

### Çalışma Bakanı

İstihdam/ücret önerir.

> "İşsizlik yükseldiği için genç istihdam teşviki öneriyoruz."

### Halk Danışmanı

Kamuoyu durumunu aktarır.

> "Hayat pahalılığı nedeniyle halk tepkisi artıyor."

Danışmanların önerileri doğru olabilir veya yanlış olabilir. Oyuncu
zamanla hangi önerilerin hangi koşullarda işe yaradığını öğrenmelidir.

------------------------------------------------------------------------

# 37. Halk Tepkisi

Halk tepkisini etkileyen faktörler:

-   Enflasyon
-   İşsizlik
-   Reel gelir
-   Asgari ücret
-   Emekli maaşı
-   Vergiler
-   Kamu hizmetleri
-   Sosyal destekler
-   Ekonomik büyüme

Örneğin:

``` text
Enflasyon ↑↑
→ halk tepkisi ↑

Reel gelir ↑
→ halk tepkisi ↓

İşsizlik ↑
→ halk tepkisi ↑
```

Halk tepkisi yükseldikçe hükümet üzerindeki siyasi baskı artar.

------------------------------------------------------------------------

# 38. Kamuoyu Desteği

Halk tepkisinden farklı bir gösterge olabilir.

Örneğin:

> Halk tepkisi = ekonomik memnuniyetsizlik

> Kamuoyu desteği = hükümetin genel siyasi desteği

Politika başarısına, iletişime ve olaylara göre değişir.

------------------------------------------------------------------------

# 39. Politika Güvenilirliği

Güvenilirlik:

-   verilen sözlerin tutulması,
-   enflasyon performansı,
-   merkez bankası bağımsızlığı,
-   politika tutarlılığı,
-   ani politika değişiklikleri

ile belirlenir.

Güvenilirlik yüksekse aynı faiz seviyesi daha güçlü etki yaratabilir.

Örneğin:

``` text
Politika faizi %20
Güvenilirlik 80

→ piyasa sıkılaşmaya daha fazla inanır.
```

Aynı faiz:

``` text
Güvenilirlik 20

→ piyasa kararın geçici olduğunu düşünebilir.
```

------------------------------------------------------------------------

# 40. Politika Gecikmeleri

Her politika aynı hızda etki etmemelidir.

  Politika                    İlk etki      Tam etki
  ------------------- ---------------- -------------
  Faiz                        1 çeyrek    3-4 çeyrek
  APİ                            Hemen    1-2 çeyrek
  Döviz müdahalesi               Hemen    1-2 çeyrek
  Vergi                       1 çeyrek    1-2 çeyrek
  Asgari ücret          Hemen/1 çeyrek    2-3 çeyrek
  Kamu yatırımı             1-2 çeyrek   4-12 çeyrek
  Eğitim                         Yavaş   8-20 çeyrek
  AR-GE                          Yavaş   8-20 çeyrek
  Altyapı                   2-4 çeyrek   8-20 çeyrek
  Bürokrasi reformu         2-4 çeyrek   8-16 çeyrek

------------------------------------------------------------------------

# 41. Politika Paketleri

Tek tek kararların yanında hazır paketler bulunabilir.

## Ekonomiyi Canlandırma Paketi

İçerik:

-   Kamu yatırımı ↑
-   KOBİ desteği ↑
-   İşe alım teşviki
-   Vergi indirimi

Sonuç:

``` text
Büyüme ↑↑
İşsizlik ↓
Ancak enflasyon ↑
Bütçe açığı ↑
```

## Enflasyonla Mücadele Paketi

-   Faiz ↑
-   APİ ↓
-   ZK ↑
-   Kamu harcamaları ↓
-   Şahin iletişim

Sonuç:

``` text
Enflasyon ↓
Kur baskısı ↓
Ancak büyüme ↓
İşsizlik ↑
```

## Teknoloji Hamlesi

-   AI fonu
-   AR-GE desteği
-   Dijitalleşme hibesi
-   Startup desteği
-   Üniversite araştırma fonu

Sonuç:

``` text
Kısa vadede bütçe maliyeti ↑
Uzun vadede verimlilik ↑
Potansiyel büyüme ↑
```

## Hanehalkı Destek Paketi

-   Asgari ücret ↑
-   Emekli maaşı ↑
-   Enerji desteği
-   Çocuk yardımı

Sonuç:

``` text
Halk desteği ↑↑
Tüketim ↑
Büyüme ↑
Ancak enflasyon ve bütçe baskısı ↑
```

## Sanayi Hamlesi

-   Yatırım teşviki
-   Kredi desteği
-   İhracat teşviki
-   Enerji desteği

Sonuç:

``` text
Yatırım ↑
Üretim ↑
İhracat ↑
İstihdam ↑
```

------------------------------------------------------------------------

# 42. Politika Sinerjileri

Bazı kararlar birlikte daha güçlü olmalıdır.

Örnek:

``` text
Mesleki eğitim + sanayi teşviki
```

→ şirketlerin nitelikli işçi bulması kolaylaşır.

``` text
AR-GE + teknoloji teşviki + üniversite fonu
```

→ teknoloji sektöründe daha güçlü uzun vadeli etki.

``` text
Konut arzı + altyapı + kentsel dönüşüm
```

→ konut piyasasında daha dengeli sonuç.

``` text
Yenilenebilir enerji + şebeke yatırımı + enerji depolama
```

→ enerji politikasının etkinliği artar.

------------------------------------------------------------------------

# 43. Politika Çatışmaları

Bazı politikalar birbirinin etkisini azaltmalıdır.

Örnek:

``` text
Faiz ↑
```

ile ekonomiyi soğuturken aynı anda:

``` text
Büyük kamu harcaması ↑
+ Asgari ücret ↑
+ Vergi indirimi
```

yapılırsa maliye politikası para politikasının talep azaltıcı etkisini
kısmen dengelemelidir.

Bu, oyunun en önemli mekaniklerinden biridir.

------------------------------------------------------------------------

# 44. Oyun Sonuçları

Oyun tek bir "kazandın/kaybettin" sistemine bağlı olmamalıdır.

Oyuncu farklı ekonomik profiller oluşturabilir.

Örnek sonuçlar:

### Dengeli ekonomi

``` text
Enflasyon düşük
Büyüme istikrarlı
İşsizlik düşük
Borç sürdürülebilir
Güven yüksek
```

### Aşırı büyüme

``` text
Büyüme çok yüksek
Enflasyon çok yüksek
Cari açık yüksek
Kur baskısı yüksek
```

### Aşırı sıkı politika

``` text
Enflasyon düşüyor
Büyüme düşük
İşsizlik yüksek
Halk tepkisi yüksek
```

### Borçla büyüme

``` text
Büyüme yüksek
Kamu yatırımı yüksek
Ancak borç ve faiz giderleri hızla yükseliyor
```

### Teknoloji dönüşümü

``` text
Kısa vadede bütçe maliyeti
Uzun vadede verimlilik ve potansiyel büyüme yüksek
```

------------------------------------------------------------------------

# 45. Oyunun Temel Karar Döngüsü

Her çeyrekte:

``` text
1. Ekonomiyi incele
        ↓
2. Danışman raporlarını oku
        ↓
3. Haberleri oku
        ↓
4. Para politikası kararlarını ver
        ↓
5. Hükümet politikalarını seç
        ↓
6. Bütçeyi kontrol et
        ↓
7. Döviz/rezerv kararlarını ver
        ↓
8. İletişim ve ileri yönlendirme seç
        ↓
9. Çeyreği ilerlet
        ↓
10. Gecikmeli etkiler uygulanır
        ↓
11. Yeni göstergeler hesaplanır
        ↓
12. Sonuçları analiz et
        ↓
13. Yeni çeyrek
```

------------------------------------------------------------------------

# 46. Önerilen Ana Ekran

Üst bölüm:

``` text
ENFLASYON     %38,2
BÜYÜME         %4,0
İŞSİZLİK       %9,5
USD/TRY       23,44
REZERV        94,2 mlr $
```

Sağ bölüm:

``` text
HALK DESTEĞİ        44/100
GÜVENİLİRLİK        23/100
REEL FAİZ           -%5
KAMU BORCU          %72
BÜTÇE DENGESİ       -%4,5
```

Orta bölüm:

``` text
PARA POLİTİKASI

Politika faizi       %20
APİ                  0 mlr TL
TL ZK                %20
YP ZK                %30

İletişim             ŞAHİN
İleri yönlendirme    SIKI DURUŞ
```

Alt bölüm:

``` text
HÜKÜMET KARARLARI

[ Teknoloji Paketi ]
[ Sanayi Teşviki ]
[ Asgari Ücret ]
[ Konut Programı ]
[ Eğitim Yatırımı ]
[ Kültür / Etkinlik Fonu ]
[ Enerji Paketi ]
```

Son:

``` text
[ AYI İLERLET ]       [ ÇEYREK SONUNA ]
```

------------------------------------------------------------------------

# 47. Oyun İçin Temel Denge Kuralı

Oyuncunun hiçbir zaman:

> "Bu butona basınca her şey düzeliyor."

dememesi gerekir.

Her kararın:

-   faydası,
-   maliyeti,
-   gecikmesi,
-   yan etkisi,
-   başka politikalarla etkileşimi

olmalıdır.

Örneğin:

``` text
Teknoloji teşviki
```

hemen enflasyonu düşürmemeli.

Ama:

``` text
2-5 yıl sonra
verimlilik ↑
üretim kapasitesi ↑
potansiyel büyüme ↑
```

yaratmalıdır.

Aynı şekilde:

``` text
Asgari ücret +30%
```

hemen:

``` text
Halk desteği ↑
```

yaratabilirken:

``` text
Ücret maliyeti ↑
Hizmet fiyatları ↑
Enflasyon ↑
```

gibi yan etkiler oluşturmalıdır.

------------------------------------------------------------------------

# 48. En Önemli Tasarım İlkesi

Oyuncuya ekonomi kitabındaki bütün teknik araçları göstermek yerine,
**"Başkan olsaydın ne yapardın?"** hissi verilmelidir.

Bu nedenle kararlar şu dilde sunulmalıdır:

> **"Teknoloji yatırımlarını artır."**

> **"KOBİ'lere 50 milyar TL'lik destek paketi açıkla."**

> **"Asgari ücreti %20 artır."**

> **"Genç istihdam programı başlat."**

> **"Enerji faturalarına destek ver."**

> **"Kamu yatırımlarını artır."**

> **"Kültür ve etkinliklere 10 milyar TL fon ayır."**

> **"Yenilenebilir enerji yatırım paketi açıkla."**

> **"Vergileri düşür."**

> **"Kamu harcamalarını azalt."**

> **"Enflasyonla mücadele paketi açıkla."**

> **"Ekonomiyi canlandırma paketi açıkla."**

Oyuncu bunların arkasındaki ekonomik mekanizmayı oyun içinde sonuçlardan
öğrenmelidir.

------------------------------------------------------------------------

# 49. Minimum Uygulanabilir Sürüm (MVP)

İlk sürümde bütün sistemlerin yapılmasına gerek yoktur.

Öncelik sırası:

## Aşama 1 --- Mevcut sistem

-   Enflasyon
-   Çekirdek enflasyon
-   Büyüme
-   İşsizlik
-   USD/TRY
-   Faiz
-   APİ
-   ZK
-   Rezerv
-   Halk tepkisi
-   Güvenilirlik
-   Çeyrek sistemi

## Aşama 2 --- Hükümet

-   Asgari ücret
-   Emekli maaşı
-   Vergi indirimi
-   Kamu yatırımı
-   Sosyal destek
-   Teknoloji yatırımı
-   Sanayi teşviki
-   Eğitim
-   Sağlık
-   Kültür/etkinlik fonu
-   Enerji teşviki
-   Konut programı

## Aşama 3 --- Derin ekonomi

-   Bankalar
-   Kredi
-   Tahvil
-   Kamu borcu
-   Bütçe
-   Cari açık
-   Döviz mevduatı
-   Yabancı sermaye

## Aşama 4 --- Dünya

-   Küresel faiz
-   Petrol
-   Küresel resesyon
-   Ticaret şokları
-   Jeopolitik olaylar
-   Yabancı yatırım

## Aşama 5 --- Uzun vadeli ekonomi

-   Eğitim kalitesi
-   Verimlilik
-   AR-GE
-   Teknoloji
-   Demografi
-   Üretim kapasitesi
-   Yapısal reformlar

------------------------------------------------------------------------

# 50. Tasarımın Özeti

Oyunun ana mantığı:

``` text
                         DIŞ DÜNYA
                            ↓
                    ┌───────────────┐
                    │   EKONOMİ     │
                    └───────────────┘
                     ↑      ↑     ↑
                     │      │     │
                 HÜKÜMET   │  MERKEZ BANKASI
                     │      │     │
                     ↓      ↓     ↓
                 BÜTÇE   BEKLENTİ FAİZ/APİ
                     │      │     │
                     └──────┼─────┘
                            ↓
                  ┌─────────────────┐
                  │  EKONOMİK SONUÇ │
                  └─────────────────┘
                    ↓    ↓    ↓
                 Halk  Büyüme Enflasyon
                    ↓
                Yeni kararlar
                    ↓
                 Yeni çeyrek
```

Oyuncunun sürekli çözmeye çalıştığı temel denklem:

> **Enflasyon + büyüme + işsizlik + kur + bütçe + halk desteği + uzun
> vadeli üretim kapasitesi**

arasındaki dengeyi yönetmektir.

------------------------------------------------------------------------

# 51. Nihai Tasarım Hedefi

İyi bir oyunda oyuncu çeyreği ilerletmeden önce şöyle düşünmelidir:

> "Enflasyon çok yüksek. Faizi artırabilirim ama işsizlik zaten yüksek."

> "Asgari ücreti artırırsam halk rahatlar ama enflasyon baskısı
> oluşabilir."

> "Teknoloji paketinin bugün faydası az ama 5 yıl sonra üretkenliği
> artırabilir."

> "Kamu yatırımı ekonomiyi canlandırabilir ama bütçe açığını büyütür."

> "Döviz satarsam kuru sakinleştirebilirim ama rezerv kaybederim."

> "Faizi düşürürsem büyüme hızlanabilir ama negatif reel faiz nedeniyle
> dolarizasyon başlayabilir."

Bu karar çatışmaları oyunun ana eğlence unsurudur.

**Oyuncunun görevi ekonomiyi mükemmel yapmak değil; farklı sorunlar
arasında sürdürülebilir bir denge kurmaktır.**
