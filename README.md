# Mr.President

Tarayıcıda çalışan, tek dosyalık bir ekonomi yönetim oyunu. Başkan sensin:
48 ay boyunca faiz, para politikası araçları, harcama paketleri ve kamuoyu
yönetimiyle seçime gidiyorsun.

## Çalıştırma

`demo/index.html` dosyasını tarayıcıda aç. Kurulum, sunucu, üyelik yok —
kayıt tarayıcının `localStorage`'ında tutulur.

## İçerik

- **Sokak:** ekonomiye göre değişen çarşı sahnesi; ekmek, benzin ve faiz
  tabelaları, kepenk indiren dükkânlar, İŞKUR kuyruğu. Yayalara tıklayınca
  o kesimin vatandaşı konuşur ve kendi seçmen desteğini gösterir.
- **Para Politikası Kurulu:** politika faizi, APİ fonlaması, TL/YP zorunlu
  karşılık, iletişim duruşu ve ileri yönlendirme.
- **Hükümet Kararları:** aylık ödenek ve süreyle tasarlanan harcama/tasarruf
  paketleri (üç çocuk teşviki, evlilik primi, kur korumalı mevduat dâhil).
- **Kabine:** danışman görüşleri; isim vermeden hedef gösterme ve görevden
  af isteme mekanikleri, uyum dönemi maliyetleriyle.
- **Başkanın Açıklaması:** gündem değiştiren söylemler — yorulma, gerçeklik
  kontrolü ve şüphe mekanikleriyle.
- **Başkanın Kasası:** kişisel portföy, gölge işler, şüphe ve soruşturma riski.

## Yapı

```
demo/index.html   tüm oyun (HTML + CSS + JS + gömülü sprite'lar)
Docs/             tasarım notları ve sprite kaynakları
```

## Yayına alma (Vercel / statik hosting)

Oyun `demo/index.html` içinde. Repo kökünde `index.html` olmadığı için statik
hosting kök adreste 404 verir; `vercel.json` bunun için `/` adresini
`/demo/index.html` dosyasına yönlendirir. Build komutu ya da output directory
ayarı gerekmez — Vercel'de framework preset **Other**, build command boş,
root directory repo kökü olmalı.

Alternatif: Vercel proje ayarlarında **Root Directory**'yi `demo` yaparsan
`vercel.json`'a gerek kalmaz.
