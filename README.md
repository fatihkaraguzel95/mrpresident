# Mr.President

Tarayıcıda çalışan bir ekonomi yönetim oyunu. Başkan sensin: 48 ay boyunca
faiz, para politikası araçları, bütçe, harcama paketleri ve kamuoyunu
yönetip seçime gidiyorsun.

## Çalıştırma

```bash
npm install
npm run dev        # geliştirme sunucusu (http://localhost:5173)
npm run build      # üretim derlemesi -> dist/
npm run preview    # derlenmiş sürümü yerelde dene
```

Kayıt tarayıcının `localStorage`'ında tutulur; sunucu ya da üyelik yok.

## İçerik

- **Sokak:** ekonomiye göre değişen çarşı. Petrol ofisinde benzin, fırında
  ekmek, kasapta kıyma, apartmanda kira fiyatı her ay güncellenir; mevsime
  göre kar, yağmur veya güneş. Huzursuzluk artınca meydan dolar ve polisle
  müdahale edip etmemeye sen karar verirsin.
- **Para Politikası Kurulu:** politika faizi, APİ fonlaması, TL/YP zorunlu
  karşılık, iletişim duruşu ve ileri yönlendirme.
- **Hükümet Kararları:** aylık ödenek ve süreyle tasarlanan paketler. Bütçe
  sınırsız değil — finansman tavanı ve aylık paket kapasitesi var. Ayrıca
  yap-işlet-devret mega projeler (dövize endeksli garanti ödemeleriyle).
- **Zam turu:** her ocak asgari ücret, en düşük emekli aylığı ve başkanlık
  maaşı sendika ve hazine arasında masaya gelir.
- **Kabine:** danışman görüşleri, hedef gösterme ve görevden af mekanikleri.
- **Halk:** her seçmen grubunun neden memnun ya da küskün olduğu, ekonomik
  verilerle birlikte.
- **Başkanın Kasası:** kişisel portföy, gölge işler, şüphe ve soruşturma riski.

## Yapı

```
index.html            uygulama kabuğu
src/
  main.js             açılış, olay bağlama, panel düzeni
  styles.css          tüm stiller
  core/               durum, kalibrasyon sabitleri, yardımcılar
  data/               politika/kabine/olay/şema katalogları, sprite kayıtları
  sim/                aylık simülasyon, bütçe, eylemler, zam turu, kasa
  ui/                 sokak sahnesi, paneller, kartlar, modal, grafikler
  assets/sprites/     piksel sprite dosyaları
Docs/                 tasarım notları ve sprite kaynakları
```

## Yayına alma

Vercel projeyi Vite olarak algılar: `npm run build` çalışır, `dist/` sunulur.
`vercel.json` bu ayarları açıkça yazar.
