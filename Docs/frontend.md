# Ah Bir Başkan Olsam --- Frontend ve Görsel Tasarım Sistemi

## 1. Amaç

Bu doküman oyunun frontend'inin nasıl görünmesi, nasıl kullanılacağı ve
kullanıcıya ekonomik kararları nasıl hissettirmesi gerektiğini tanımlar.

Ana hedef:

> **Basit görünüm + güçlü bilgi + hızlı karar verme + modern ekonomi
> simülasyonu hissi.**

Frontend kullanıcıyı ekonomi tablolarına boğmamalıdır. Oyuncu her
ekranda:

1.  Ekonominin şu anki durumunu,
2.  Neyin kötü/güzel gittiğini,
3.  Hangi kararların mevcut olduğunu,
4.  Bir kararın olası etkilerini,
5.  Karar sonrası ne değiştiğini

çok hızlı anlayabilmelidir.

------------------------------------------------------------------------

# 2. Görsel Kimlik

## Genel stil

Oyun:

-   modern,
-   ciddi,
-   premium,
-   sade,
-   kurumsal,
-   hafif politik simülasyon havasında,
-   fakat sıkıcı bir devlet portalı gibi olmayan

bir görünüme sahip olmalıdır.

Referans hissiyat:

> Modern finans dashboard + strateji oyunu + hükümet yönetim paneli.

## Görsel yaklaşım

### Kullanılmaması gerekenler

-   Aşırı renkli dashboard
-   Her yerde gradient
-   Fazla animasyon
-   3D gereksiz grafikler
-   Çok küçük yazılar
-   Aynı anda 20 grafik
-   Excel görünümü
-   Fazla ikon
-   Her butonda farklı renk
-   Kullanıcıyı korkutan teknik ekonomik terimler

### Kullanılması gerekenler

-   Büyük ve okunabilir KPI kartları
-   Temiz grafikler
-   Bol boşluk
-   Net başlıklar
-   Tutarlı ikonlar
-   Az ama anlamlı renk
-   Kart tabanlı arayüz
-   Açılır detaylar
-   Tooltip
-   Karar öncesi etki önizlemesi

------------------------------------------------------------------------

# 3. Renk Sistemi

Ana renkler:

### Arka plan

Koyu lacivert / gece mavisi.

Öneri:

``` text
#0F172A
```

### Ana yüzey

``` text
#162033
```

### Kart

``` text
#1E293B
```

### Ana vurgu

Soğuk mavi:

``` text
#3B82F6
```

### Pozitif

Yeşil:

``` text
#22C55E
```

### Negatif

Kırmızı:

``` text
#EF4444
```

### Uyarı

Turuncu:

``` text
#F59E0B
```

### Bilgi

Açık mavi:

``` text
#38BDF8
```

### Metin

Ana:

``` text
#F8FAFC
```

İkincil:

``` text
#94A3B8
```

------------------------------------------------------------------------

# 4. Renk Kullanım Kuralı

Renkler dekorasyon için değil **anlam vermek için** kullanılmalıdır.

Örneğin:

``` text
Yeşil = olumlu
Kırmızı = risk / kötüleşme
Turuncu = dikkat
Mavi = bilgi
Gri = nötr
```

Bir KPI kartında değer değişmişse:

``` text
Enflasyon
38.2%
↑ 1.4
```

kırmızı gösterilebilir.

Ancak her başlık kırmızı/yeşil yapılmamalıdır.

------------------------------------------------------------------------

# 5. Font

Önerilen:

> Inter

Alternatif:

> system-ui

Font hiyerarşisi:

``` text
Ana başlık: 28-32 px
Bölüm başlığı: 20-24 px
Kart başlığı: 14-16 px
Ana KPI: 28-36 px
Normal metin: 14-16 px
Yardımcı metin: 12-13 px
```

Mobilde fontlar otomatik küçülmeli ancak ana KPI'lar okunabilir
kalmalıdır.

------------------------------------------------------------------------

# 6. Ana Layout

Desktop:

``` text
┌──────────────────────────────────────────────────────────────┐
│ LOGO       2029 Q3       Ekonomi: Normal       ⚙            │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│  SIDEBAR   │                 MAIN CONTENT                    │
│            │                                                 │
│ 🏠 Genel   │                                                 │
│ 💰 Ekonomi │                                                 │
│ 🏛 Hükümet │                                                 │
│ 🏦 Merkez  │                                                 │
│ 📊 Veriler │                                                 │
│ 📰 Haberler│                                                 │
│            │                                                 │
│            │                                                 │
├────────────┴─────────────────────────────────────────────────┤
│                 ÇEYREĞİ İLERLET                              │
└──────────────────────────────────────────────────────────────┘
```

Desktop'ta sol menü sabit olabilir.

Mobilde sidebar:

> hamburger menü

haline dönüşmelidir.

------------------------------------------------------------------------

# 7. Üst Bar

Üst bar her zaman görünür olmalıdır.

Sol:

> **Ah Bir Başkan Olsam**

Orta:

> **2029 --- 3. Çeyrek**

Yanında:

> Ekonomik durum: **Dengeli / Riskli / Kriz**

Sağ:

-   🔔 Bildirim
-   📜 Karar geçmişi
-   ⚙ Ayarlar
-   👤 Başkan profili

Üst bar gereksiz bilgilerle doldurulmamalıdır.

------------------------------------------------------------------------

# 8. Ana Dashboard

Ana ekran oyunun en önemli ekranıdır.

Oyuncu oyuna girdiğinde başka menüye geçmeden mevcut durumu
anlayabilmelidir.

## İlk satır

6 ana KPI:

``` text
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ ENFLASYON   │ │ BÜYÜME      │ │ İŞSİZLİK    │
│ 38.2%       │ │ 4.0%        │ │ 9.5%        │
│ ↑ 1.2       │ │ ↓ 0.4       │ │ ↑ 0.3       │
└─────────────┘ └─────────────┘ └─────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ USD/TRY     │ │ REEL FAİZ   │ │ REZERV      │
│ 23.44       │ │ -5.0%       │ │ $94.2B      │
│ ↑ 0.6       │ │ ↓ 0.5       │ │ ↓ $2.1B     │
└─────────────┘ └─────────────┘ └─────────────┘
```

Her kart:

-   mevcut değer,
-   önceki çeyreğe göre değişim,
-   küçük trend grafiği

içermelidir.

------------------------------------------------------------------------

# 9. "Ekonominin Nabzı"

KPI'ların altında tek bir özet kartı:

``` text
┌───────────────────────────────────────────────────────────┐
│ ECONOMİNİN NABZI                                          │
│                                                           │
│ 🔴 Enflasyon baskısı yüksek                               │
│ 🟢 Büyüme pozitif                                         │
│ 🟠 İşsizlik yüksek                                        │
│ 🟠 Reel faiz negatif                                      │
│                                                           │
│ En büyük risk: Enflasyon beklentilerinin yükselmesi       │
└───────────────────────────────────────────────────────────┘
```

Bu alan oyuncunun verileri yorumlamasını kolaylaştırır.

Sistem otomatik olarak 3-5 kısa cümle üretir.

------------------------------------------------------------------------

# 10. Ana Grafik

Dashboard'da tek büyük grafik:

> **Ekonomik Görünüm**

Varsayılan:

-   Enflasyon
-   Çekirdek enflasyon
-   Enflasyon beklentisi

aynı grafikte gösterilebilir.

Kullanıcı sekmelerden değiştirebilir:

``` text
[Enflasyon] [Büyüme] [İşsizlik] [Kur] [Faiz]
```

Grafik sade olmalıdır.

Hover yapıldığında:

``` text
2029 Q2

Manşet: %37.4
Çekirdek: %46.1
Beklenti: %24.2
```

görünmelidir.

------------------------------------------------------------------------

# 11. Karar Merkezi

Oyunun asıl oynandığı ekran.

Menü:

> 🏛 Hükümet Kararları

Açıldığında kategoriler:

``` text
Ekonomi
İstihdam
Teknoloji
Sanayi
Enerji
Eğitim
Sağlık
Konut
Turizm
Kültür & Spor
Sosyal Destek
Vergiler
Altyapı
Çevre
```

------------------------------------------------------------------------

# 12. Karar Kartları

Her politika kart şeklinde gösterilmelidir.

Örnek:

``` text
┌──────────────────────────────────────────┐
│ 💻 ULUSAL TEKNOLOJİ YATIRIM PAKETİ       │
│                                          │
│ Yapay zekâ, dijitalleşme ve AR-GE        │
│ yatırımlarına 50 milyar TL ayrılacak.    │
│                                          │
│ Maliyet             50 mlr TL            │
│ Süre                3 yıl                │
│                                          │
│ Kısa vadeli etki                         │
│ Büyüme             ↗                     │
│ Bütçe              ↘                     │
│                                          │
│ Uzun vadeli etki                         │
│ Verimlilik         ↗↗                    │
│ Üretim kapasitesi  ↗↗                    │
│                                          │
│              [ PAKETİ AÇIKLA ]           │
└──────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 13. Karar Vermeden Önce Etki Önizlemesi

Oyuncu karar butonuna basmadan önce:

``` text
Bu kararın tahmini etkisi

Enflasyon       +0.3
Büyüme          +0.5
İşsizlik        -0.2
Bütçe           -50 mlr
Halk desteği    +4
```

görmelidir.

Ancak rakamlar **kesin sonuç** olarak gösterilmemelidir.

Bunun yerine:

``` text
Enflasyon       ↗
Büyüme          ↗
Bütçe           ↘↘
```

ve:

> "Tahmini etki"

ifadesi kullanılabilir.

İleri seviye oyuncu isterse sayısal tahmini açabilir.

------------------------------------------------------------------------

# 14. Basit / Detaylı Mod

Kullanıcı dostu olması için:

## Basit görünüm

Sadece:

``` text
Ekonomi: ↑
Halk: ↑
Bütçe: ↓
```

## Detaylı görünüm

``` text
Enflasyon: +0.3
Çekirdek: +0.1
Büyüme: +0.5
İşsizlik: -0.2
Bütçe: -50 mlr
```

Bu sayede yeni oyuncu boğulmaz.

------------------------------------------------------------------------

# 15. Karar Onay Modalı

Kullanıcı:

> PAKETİ AÇIKLA

dediğinde doğrudan uygulamak yerine küçük bir modal:

``` text
ULUSAL TEKNOLOJİ YATIRIM PAKETİ

50 milyar TL bütçe
3 yıl süre

Bu paketi uygulamak istediğinize emin misiniz?

[ VAZGEÇ ]       [ ONAYLA ]
```

Onaydan sonra:

> ✓ Politika uygulandı.

------------------------------------------------------------------------

# 16. Para Politikası Ekranı

Merkez bankası için ayrı ekran.

``` text
┌───────────────────────────────────────────────┐
│ PARA POLİTİKASI                               │
├───────────────────────────────────────────────┤
│                                               │
│ Politika Faizi                                │
│                                               │
│      −     %20.00     +                       │
│                                               │
│ APİ Fonlaması                                 │
│                                               │
│      −     0 mlr TL    +                      │
│                                               │
│ TL ZK                                          │
│      −     %20        +                       │
│                                               │
│ İletişim                                      │
│ [ ŞAHİN ] [ NÖTR ] [ GÜVERCİN ]              │
│                                               │
│ İleri Yönlendirme                             │
│ [ Belirsiz ]                                  │
│ [ Sıkı duruş sürecek ]                        │
│ [ Gevşeme gelebilir ]                         │
│                                               │
│              [ KARARI UYGULA ]                │
└───────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 17. Faiz Değiştirme UX'i

Faiz için slider kullanılabilir.

``` text
%15 ────────●──────── %30
             %20
```

Slider hareket ettikçe sağ tarafta canlı tahmini etki gösterilir:

``` text
Faiz: %22

Beklenen kısa vadeli etkiler:

Enflasyon      ↘
Kur            ↘
Büyüme         ↘
İşsizlik       ↗
```

Bu, oyuncunun karar vermesini çok kolaylaştırır.

------------------------------------------------------------------------

# 18. Bütçe Ekranı

Bütçe ayrı ve sade bir ekran olmalıdır.

``` text
DEVLET BÜTÇESİ

Gelir                  1.240 mlr TL
Gider                  1.390 mlr TL
────────────────────────────────
Bütçe dengesi           -150 mlr TL

Borç/GSYH               %72
Faiz gideri             110 mlr TL
```

Altında:

``` text
HARCAMA DAĞILIMI

🏥 Sağlık          18%
🎓 Eğitim          15%
🏗 Altyapı         12%
🛡 Savunma         10%
👴 Emekliler       14%
💰 Sosyal destek    9%
💻 Teknoloji        6%
🎭 Kültür           2%
```

Pasta grafik yerine mümkünse yatay bar kullanılmalıdır.

------------------------------------------------------------------------

# 19. Bütçe Kararı

Oyuncu:

> "Teknolojiye 20 milyar daha ayır"

dediğinde sistem:

``` text
Bütçe açığı

Önce:  -150 mlr
Sonra: -170 mlr

Borç/GSYH
Önce: 72.0%
Sonra:72.4%
```

göstermelidir.

------------------------------------------------------------------------

# 20. Haberler Ekranı

Haberler kart şeklinde:

``` text
┌────────────────────────────────────────────┐
│ 🛢️ PETROL FİYATLARI %18 ARTTI              │
│                                            │
│ Küresel petrol fiyatlarındaki artış...    │
│                                            │
│ Beklenen etkiler:                          │
│ Enflasyon ↗                                │
│ Cari açık ↗                                │
│ Büyüme ↘                                   │
│                                            │
│ 2 saat önce                                │
└────────────────────────────────────────────┘
```

Haberler önem seviyesine göre:

-   Bilgi
-   Dikkat
-   Kritik

olarak işaretlenebilir.

------------------------------------------------------------------------

# 21. Danışman Ekranı

Danışmanlar ayrı karakter kartlarıyla gösterilebilir.

``` text
┌──────────────────────────────────────────┐
│ 🏦 MERKEZ BANKASI BAŞKANI                │
│                                          │
│ "Enflasyon beklentileri hâlâ yüksek.    │
│ 100 baz puanlık faiz artışı düşünülebilir."│
│                                          │
│ [ DETAY ]                                │
└──────────────────────────────────────────┘
```

Diğerleri:

-   Maliye Bakanı
-   Ekonomi Bakanı
-   Çalışma Bakanı
-   Enerji Bakanı
-   Teknoloji Bakanı
-   Halk Danışmanı

Danışman önerileri kesin gerçek olarak değil, **öneri** olarak
sunulmalıdır.

------------------------------------------------------------------------

# 22. "Ne Olur?" Yardım Sistemi

Oyunun en kullanıcı dostu özelliklerinden biri olmalıdır.

Kullanıcı bir kararın üzerine geldiğinde:

> **"Faizi artırırsam ne olur?"**

Tooltip:

``` text
Faizi artırmak genellikle:

Enflasyon       ↓
Kur baskısı     ↓
Kredi           ↓
Büyüme          ↓
İşsizlik        ↑

Etkiler hemen değil,
birkaç çeyrek içinde ortaya çıkar.
```

Başka örnek:

> **"Asgari ücreti artırırsam?"**

``` text
Çalışan geliri  ↑
Tüketim         ↑
Halk desteği    ↑
Şirket maliyeti ↑
Enflasyon       ↗
```

------------------------------------------------------------------------

# 23. Karar Geçmişi

Oyuncu geçmiş kararlarını görebilmeli.

``` text
2029 Q3

✓ Politika faizi %19 → %20
✓ Teknoloji paketi +50 mlr
✓ Asgari ücret +15%
✓ Enerji desteği +20 mlr

Sonuçlar:

Enflasyon      +0.7
Büyüme         +0.3
İşsizlik       -0.1
Bütçe          -70 mlr
```

Bu ekran oyuncunun hangi kararın ne sonuç verdiğini öğrenmesini sağlar.

------------------------------------------------------------------------

# 24. Zaman Çizelgesi

Her önemli olay timeline'a yazılmalı:

``` text
2029 Q1
│
├── Faiz %18 → %19
│
2029 Q2
│
├── Teknoloji paketi başlatıldı
│
2029 Q3
│
├── Petrol krizi
│
└── Faiz %19 → %20
```

Bu özellikle gecikmeli etkileri anlamak için önemlidir.

------------------------------------------------------------------------

# 25. Ekonomi Grafikleri

Ayrı "Veriler" ekranında:

### Grafikler

-   Enflasyon
-   Çekirdek enflasyon
-   Beklentiler
-   Büyüme
-   İşsizlik
-   USD/TRY
-   Politika faizi
-   Reel faiz
-   Rezerv
-   Kamu borcu
-   Bütçe açığı
-   Cari açık
-   Kredi büyümesi

Kullanıcı tarih aralığı seçebilir:

``` text
1Y | 3Y | 5Y | Tümü
```

------------------------------------------------------------------------

# 26. Mobil Tasarım

Mobilde masaüstü dashboard küçültülmemelidir.

Bunun yerine:

``` text
Üst bar
↓
Ana KPI carousel
↓
Ekonominin Nabzı
↓
Ana grafik
↓
Önemli kararlar
↓
Çeyreği İlerle
```

Sidebar:

> hamburger menu

KPI kartları yatay kaydırılabilir.

------------------------------------------------------------------------

# 27. Mobil Karar Kartı

``` text
┌───────────────────────────┐
│ 💻 Teknoloji Paketi       │
│                           │
│ 50 mlr TL                 │
│                           │
│ Büyüme       ↗            │
│ Verimlilik   ↗↗           │
│ Bütçe        ↘↘           │
│                           │
│ [ DETAY ]                 │
│ [ UYGULA ]                │
└───────────────────────────┘
```

------------------------------------------------------------------------

# 28. Responsive Breakpointler

Öneri:

``` text
> 1200px     Desktop
768-1199px   Tablet
< 768px      Mobile
```

Desktop:

> sidebar + geniş dashboard

Tablet:

> dar sidebar + iki kolon

Mobile:

> tek kolon

------------------------------------------------------------------------

# 29. Animasyonlar

Animasyon kullanılmalı ama az.

### Kullanılabilir

-   KPI değişirken sayı animasyonu
-   Kart hover
-   Modal açılışı
-   Çeyrek ilerletme geçişi
-   Grafik güncellemesi
-   Bildirim animasyonu

### Kullanılmamalı

-   Sürekli hareket eden arka plan
-   Aşırı parlayan butonlar
-   Gereksiz bounce
-   Her tıklamada büyük animasyon

Amaç:

> **Premium his, oyun hissi değil; okunabilirlik öncelikli.**

------------------------------------------------------------------------

# 30. Çeyrek İlerletme Ekranı

Oyunun en önemli anlarından biri.

Oyuncu:

> **ÇEYREĞİ İLERLET**

dediğinde kısa bir geçiş:

``` text
2029 Q3
       ↓
Ekonomi hesaplanıyor...
       ↓
Piyasalar güncelleniyor...
       ↓
Yeni veriler hazırlanıyor...
       ↓
2029 Q4
```

Sonra sonuç ekranı.

------------------------------------------------------------------------

# 31. Çeyrek Sonuç Ekranı

``` text
2029 Q4 SONUÇLARI

Enflasyon
38.2% → 36.9%     ↓

Büyüme
4.0% → 3.7%       ↓

İşsizlik
9.5% → 9.7%       ↑

USD/TRY
23.44 → 23.10     ↓

Halk desteği
44 → 47           ↑
```

Altında:

> **Bu çeyrekte ne oldu?**

-   Enflasyon beklentileri geriledi.
-   Faiz artışının kredi üzerindeki etkisi görülmeye başladı.
-   Teknoloji yatırımlarının kısa vadeli bütçe maliyeti arttı.
-   Petrol fiyatları ekonomiyi olumsuz etkiledi.

------------------------------------------------------------------------

# 32. Önemli Sonuçlar İçin "Neden?" Butonu

Örneğin:

``` text
Enflasyon: %36.9 ↓

[NEDEN?]
```

Tıklanınca:

``` text
Enflasyonun düşmesinin başlıca nedenleri:

✓ Talep baskısı azaldı
✓ Reel faiz yükseldi
✓ Kur istikrar kazandı

Enflasyonu artıran faktör:
⚠️ Enerji fiyatları
```

Bu özellik oyunu öğretici hale getirir.

------------------------------------------------------------------------

# 33. Bildirim Sistemi

Oyuncuya sadece önemli bildirim gönderilmeli.

Örnek:

> 🔴 **Kritik:** Reel faiz -%8'e düştü.

> 🟠 **Dikkat:** Rezervler kritik seviyeye yaklaşıyor.

> 🟢 **Olumlu:** Enflasyon beklentisi üçüncü çeyrektir düşüyor.

> 🔵 **Bilgi:** Teknoloji teşvik paketinin ilk etkileri görülmeye
> başladı.

------------------------------------------------------------------------

# 34. Karar Önceliği

Karar ekranlarında:

``` text
ÖNERİLEN
ACİL
UZUN VADELİ
İSTEĞE BAĞLI
```

etiketleri olabilir.

Örneğin:

> 🔴 ACİL --- Enflasyon beklentileri yükseliyor.

> 🔵 UZUN VADELİ --- Yapay zekâ yatırım programı.

Bu etiketler oyuncuya karar dayatmamalıdır; sadece bilgi vermelidir.

------------------------------------------------------------------------

# 35. Tooltips

Ekonomik terimler kullanıcıya açıklanmalı.

Örneğin:

> **Çekirdek Enflasyon ⓘ**

Tooltip:

> "Daha kalıcı fiyat baskısını anlamaya yardımcı olan enflasyon
> ölçüsüdür."

> **Reel Faiz ⓘ**

> "Faiz ile beklenen enflasyon arasındaki yaklaşık farktır."

> **APİ ⓘ**

> "Merkez bankasının piyasadaki TL likiditesini yönetmek için kullandığı
> işlemlerdir."

------------------------------------------------------------------------

# 36. Basit Dil

Frontend'de mümkün olduğunca:

❌ "Konjonktürel parasal aktarım mekanizması"

yerine:

✅ "Faiz artışının ekonomiye etkisi"

❌ "Mali genişleme"

yerine:

✅ "Kamu harcamalarını artır"

❌ "Sterilizasyon"

yerine:

✅ "Piyasadaki fazla TL'yi çek"

Teknik terim gerekiyorsa yanında açıklama bulunmalıdır.

------------------------------------------------------------------------

# 37. Kullanıcıya Her Zaman 3 Soru Cevabı

Her karar ekranı şu üç soruyu cevaplamalıdır:

### 1. Ne yapıyorum?

> "Teknoloji yatırımlarına 50 milyar TL ayırıyorum."

### 2. Bana neye mal oluyor?

> "Bütçeye 50 milyar TL."

### 3. Ne değişebilir?

> "Kısa vadede büyüme ve kamu harcaması artar; uzun vadede verimlilik
> artabilir."

------------------------------------------------------------------------

# 38. UI Bileşenleri

Frontend component yapısı örnek olarak:

``` text
App
├── Layout
│   ├── TopBar
│   ├── Sidebar
│   └── MainContent
│
├── Dashboard
│   ├── KPIGrid
│   ├── EconomyPulse
│   ├── MainChart
│   ├── Alerts
│   └── QuarterButton
│
├── MonetaryPolicy
│   ├── InterestRateControl
│   ├── ApiControl
│   ├── ReserveRatioControl
│   ├── CommunicationControl
│   └── ForwardGuidance
│
├── Government
│   ├── PolicyCategories
│   ├── PolicyCard
│   ├── PolicyPreview
│   └── PolicyConfirmModal
│
├── Budget
│   ├── Revenue
│   ├── Spending
│   ├── Debt
│   └── BudgetChart
│
├── News
│   ├── NewsCard
│   └── NewsDetail
│
├── Advisors
│   ├── AdvisorCard
│   └── AdvisorRecommendation
│
├── Analytics
│   ├── ChartSelector
│   └── HistoricalChart
│
└── Results
    ├── QuarterTransition
    ├── QuarterSummary
    └── WhyPanel
```

------------------------------------------------------------------------

# 39. State Mantığı

Frontend'de ekonomik değerler tek bir merkezi state üzerinden
yönetilmelidir.

Örnek:

``` javascript
gameState = {
    quarter: "2029-Q3",

    economy: {
        inflation: 38.2,
        coreInflation: 47.3,
        inflationExpectation: 25.0,
        growth: 4.0,
        unemployment: 9.5,
        exchangeRate: 23.44
    },

    monetaryPolicy: {
        policyRate: 20,
        apiFunding: 0,
        tlReserveRatio: 20,
        fxReserveRatio: 30,
        communication: "hawkish",
        forwardGuidance: "tight"
    },

    government: {
        publicSpending: 1390,
        taxRevenue: 1240,
        debtToGdp: 72
    },

    publicOpinion: {
        approval: 44,
        trust: 23
    }
}
```

Frontend doğrudan ekonomik hesaplama yapmamalıdır.

Ekonomik hesaplamalar ayrı bir simulation/game-engine katmanında
olmalıdır.

Frontend:

> **State'i gösterir + kullanıcı kararını engine'e gönderir.**

------------------------------------------------------------------------

# 40. Frontend / Simulation Ayrımı

Kesinlikle:

``` text
Frontend
     ↓
Action
     ↓
Game Engine
     ↓
Simulation
     ↓
New State
     ↓
Frontend
```

olmalıdır.

Örneğin frontend:

``` javascript
applyPolicy("minimum_wage", 20)
```

gönderir.

Simulation engine:

``` text
Asgari ücret +20%

→ tüketim +X
→ ücret maliyeti +Y
→ enflasyon +Z
→ halk desteği +N
```

hesaplar.

Sonra yeni state frontend'e gelir.

Bu ayrım ileride oyun dengesini değiştirmeyi çok kolaylaştırır.

------------------------------------------------------------------------

# 41. API Tasarımı

Frontend için örnek endpointler:

``` text
GET /game/state

POST /game/monetary-policy

POST /game/government-policy

POST /game/quarter/advance

GET /game/news

GET /game/history

GET /game/advisors
```

Örneğin:

``` json
POST /game/government-policy

{
    "policy": "technology_investment",
    "amount": 50
}
```

Response:

``` json
{
    "success": true,
    "estimatedEffects": {
        "growth": 0.4,
        "budget": -50,
        "publicApproval": 2
    }
}
```

------------------------------------------------------------------------

# 42. Hata Durumları

Frontend ekonomik kararları sessizce başarısız yapmamalıdır.

Örnek:

``` text
⚠️ Yeterli bütçe yok.

Mevcut kullanılabilir bütçe:
20 milyar TL

Paket maliyeti:
50 milyar TL

Seçenekler:

[ Daha küçük paket seç ]
[ Başka harcamayı azalt ]
[ Vazgeç ]
```

------------------------------------------------------------------------

# 43. Onay Gerektiren Kritik Kararlar

Bazı kararlar ekstra onay ister:

-   Çok büyük bütçe paketi
-   Büyük vergi değişikliği
-   Büyük faiz değişikliği
-   Rezervin büyük kısmını kullanma
-   Olağanüstü kriz paketi

Ancak kullanıcıyı gereksiz popup'larla boğmamak gerekir.

------------------------------------------------------------------------

# 44. Tasarımda Öncelik Sırası

Her ekranda bilgi önceliği:

``` text
1. Şu an ne oluyor?
2. Sorun ne?
3. Hangi kararlar mevcut?
4. Kararın tahmini etkisi ne?
5. Karar ne kadar maliyetli?
6. Sonuç ne zaman ortaya çıkar?
7. Detaylar
```

Detaylar varsayılan olarak kapalı olabilir.

------------------------------------------------------------------------

# 45. Erişilebilirlik

-   Yeterli kontrast
-   Klavye ile kullanım
-   Tooltip'lerin erişilebilir olması
-   Renk dışında ↑ ↓ gibi işaretler kullanılması
-   Mobilde yeterli buton boyutu
-   Font boyutunun okunabilir olması

Örneğin sadece:

> 🔴 kırmızı

kullanılmamalı.

Bunun yerine:

> 🔴 ↑ Enflasyon

kullanılmalı.

------------------------------------------------------------------------

# 46. Loading State

Ekonomi hesaplanırken:

``` text
Ekonomi simüle ediliyor...

████████░░░░

Piyasalar
Güncelleniyor
```

kısa bir animasyon gösterilebilir.

Ama kullanıcıyı uzun süre bekletmemelidir.

------------------------------------------------------------------------

# 47. Empty State

Örneğin geçmiş veri yoksa:

``` text
Henüz yeterli veri yok.

Oyunu birkaç çeyrek oynadıktan sonra
burada ekonomik trendleri görebileceksiniz.
```

------------------------------------------------------------------------

# 48. Dark / Light Mode

Ana tema:

> Dark mode

olmalıdır.

İsteğe bağlı:

> Light mode

Ancak oyunun varsayılanı koyu tema olmalı.

Dark tema ekonomik dashboard görünümünü daha premium hale getirir.

------------------------------------------------------------------------

# 49. Görsel Hiyerarşi

Ekranın en önemli alanı:

> **Ekonominin mevcut durumu**

İkinci:

> **Oyuncunun kararları**

Üçüncü:

> **Detaylar**

Oyuncu ilk bakışta onlarca sayı görmemelidir.

Önce:

``` text
Enflasyon yüksek.
İşsizlik yüksek.
Büyüme pozitif.
Reel faiz negatif.
```

sonra detaylara inmelidir.

------------------------------------------------------------------------

# 50. Ana UX Prensibi

Frontend kullanıcıya hiçbir zaman:

> "Ekonomi bilgisine sahip değilsen oynayamazsın."

hissi vermemeli.

Yeni oyuncu sadece kartlara bakarak:

> "Faiz artırırsam ekonomi soğuyacak."

> "Teknolojiye yatırım yaparsam bugün para harcayacağım ama uzun vadede
> üretkenlik artacak."

> "Asgari ücret artırırsam halk rahatlayacak ama şirket maliyetleri
> artacak."

anlayabilmelidir.

------------------------------------------------------------------------

# 51. Nihai Görsel Hedef

Oyuncu oyunu açtığında ekran şu hissi vermelidir:

``` text
        AH BİR BAŞKAN OLSAM

2029 Q3                         Ekonomi: ⚠️ Dikkat

┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│Enflasyon│ │ Büyüme  │ │İşsizlik │ │ USD/TRY │
│ 38.2% ↑ │ │  4.0% → │ │  9.5% ↑ │ │ 23.44 ↑ │
└─────────┘ └─────────┘ └─────────┘ └─────────┘

┌────────────────────────────────────────────────┐
│                EKONOMİNİN NABZI                │
│ 🔴 Enflasyon baskısı yüksek                    │
│ 🟠 İşsizlik yüksek                             │
│ 🟢 Büyüme devam ediyor                         │
└────────────────────────────────────────────────┘

┌───────────────────────┐ ┌──────────────────────┐
│ EKONOMİK TREND        │ │ ÖNEMLİ KARARLAR      │
│                       │ │                      │
│     ╱╲                │ │ 💻 Teknoloji Paketi │
│  ╱──  ╲               │ │ 🏭 Sanayi Teşviki   │
│ ╱      ───            │ │ 👷 İstihdam Paketi  │
│                       │ │ 🏠 Konut Programı   │
└───────────────────────┘ └──────────────────────┘

                 [ ÇEYREĞİ İLERLET ]
```

Frontend'in genel felsefesi:

> **"Bir bakışta anla, bir tıkta karar ver, çeyreği ilerlet, sonucu
> gör."**

Oyunun karmaşık ekonomik motoru arka planda çalışmalı; frontend ise bunu
**çok basit, modern ve görsel olarak anlaşılır** hale getirmelidir.
