import {$} from '../core/state.js';

/* ═══════════════ SÜRÜM GÜNLÜĞÜ ═══════════════
   Açılış ekranının solunda duran "Yenilikler" listesi. En yeni sürüm
   en üstte; ilk sıradaki YENİ rozetiyle işaretlenir.
   Yeni bir özellik eklendiğinde buraya da bir madde yazılır. */
export const CHANGELOG=[
 {d:'2026-10-01',t:'Ülke statüsü ve enflasyonun gerçek bedeli',
  li:['Göstergelere <b>ülke statüsü</b> eklendi: gelişmekte olan ülkeden gelişmiş ülkeye uzanan 7 kademe',
      'Statü gerçek sınıflandırma ölçütleriyle hesaplanıyor — fiyat istikrarı, beklenti çıpası, risk primi, Maastricht borç ve bütçe eşikleri, dış denge, rezerv, istihdam, dolarizasyon, kurumsal şeffaflık, asgari ücretin dolar karşılığı',
      'Panelde seni hangi ölçütlerin geride tuttuğu ve bir üst kademe için kaç puan gerektiği yazıyor',
      'Yüksek enflasyonun oya etkisi sertleştirildi; enflasyonun beklentiyi aşması ayrıca cezalandırılıyor',
      'Hiçbir şey yapmamak artık net biçimde kaybettiriyor']},

 {d:'2026-10-01',t:'Meydan gazetesi, erken seçim ve gerçekçi para politikası',
  li:['Başkanın Kasası ikiye bölündü: sağ tarafta her ay yeniden dizilen <b>Meydan gazetesi</b>',
      'Gazetede manşet, muhalefetin sözü, sokak röportajı, dünya ve piyasa köşesi — hepsi senin tablona göre yazılıyor',
      'Medyaya baskı ya da medya grubu satın alırsan gazete gerçeği yumuşatmaya başlıyor: kötü manşet kayboluyor, muhalefetin yerini yandaş yorumcu alıyor. Ekonomiyi düzeltmiyor, sadece tabanın gördüğü tabloyu değiştiriyor — gençlerde ise ters tepiyor',
      'Hükümet kararlarına <b>erken seçim</b> eklendi: sandığı öne çekebilirsin ama risk primi +140 bp, kur +%5, güvenilirlik −12 ve iki aylık kampanya dönemi bedeli var',
      'Oyunun ana hedefi netleşti: faizi İNDİREBİLMEK. Kalıcı yüksek faiz artık kazandırmıyor — krediyi kurutuyor, esnafı ve sanayiciyi bitiriyor. Kazanan yol: önce sık, enflasyonu kır, sonra faizi indir',
      'Para politikası araçları gerçekçileştirildi: faiz artışı artık resesyon yapıyor, APİ gerçek bir gevşetme aracı oldu, rezerv yakarak kuru savunmak güven kazandırmıyor',
      'İşsizlik şoklara daha hızlı tepki veriyor (Okun katsayısı gerçekçi seviyeye çekildi)',
      'Sözüne aykırı bir karar sepete girdiğinde, uygulamadan önce kırmızı uyarı çıkıyor',
      'Yürürlükteki bir paket süresi dolmadan yeniden ayarlanamıyor']},

 {d:'2026-10-01',t:'Sürpriz şoklar, bağlayıcı sözler ve canlı gündem',
  li:['Rastgele ulusal/küresel şoklar geri geldi: petrol krizi, resesyon, deprem, banka paniği, sermaye çıkışı, keşif, turizm rekoru — 14 farklı olay',
      'Şoklar sabit takvimde değil; ekonomi kırılganlaştıkça (rezerv erimiş, risk primi yüksek, borç büyük) kötü haber ihtimali artıyor',
      'Basın soruları artık gündeme göre seçiliyor ve rakamlarını içeriyor; 4 soru yerine 11 soru var',
      'Verdiğin sözler bağlayıcı: "faizi indirmeyeceğiz" deyip indirirsen güvenilirlik düşüyor, manşet oluyor — tutulan söz ise güven kazandırıyor',
      'Ay içinde olan önemli şeyler artık haber şeridinde görünüyor (eskiden ay sonunda siliniyordu)',
      'Karar sepeti büyütüldü ve dolu olduğunda belirginleşiyor',
      'Başkanın Açıklaması paneline tıklayınca açılmama hatası giderildi']},

 {d:'2026-10-01',t:'Modüler altyapı, zorlaşan ekonomi ve ikinci dönem',
  li:['Seçimi kazanınca oyun bitmiyor — yeni dönem, kendi bıraktığın borç ve paketlerle devam ediyor',
      'Hiçbir şey yapmamak artık işe yaramıyor: yatırım olmazsa sermaye aşınıyor, potansiyel büyüme ve istihdam geriliyor',
      'Politikaların gücü yeniden ölçüldü — Kur Korumalı Mevduat gibi bedava görünen seçenekler zayıflatıldı, bedelleri büyütüldü',
      'Harcama paketlerinin enflasyon maliyeti arttı; artık her kararın bir karşılığı var',
      'Oyun modüler bir yapıya taşındı (Vite); daha hızlı açılıyor']},
 {d:'2026-10-01',t:'Bütçe, sokak eylemleri ve yeniden dengelenen ekonomi',
  li:['Açılış ekranında bu "Yenilikler" listesi — eklenen her özellik buraya yazılıyor',
      'Açılış ekranına ve üst bara Mr.President logosu',
      'Merkezî yönetim bütçesi: gelir, faiz gideri, zorunlu giderler ve finansman tavanı',
      'Harcama artık sınırsız değil — tavan aşılırsa Hazine fonlamayı keser, aylık paket kapasitesi var',
      'Yap-işlet-devret mega projeler: peşin ödeme yok, dövize endeksli garanti ödemesi var',
      'Sokakta eylemler ve polis müdahalesi: sert müdahale, kontrol altında tutma ya da dokunmama',
      'Her ocak zam turu: asgari ücret, en düşük emekli aylığı ve başkanlık maaşı sendikayla masada',
      'Halk panelinde her seçmen grubunun neden memnun/küskün olduğu rakamlarıyla açılıyor',
      'Sokakta Petrol Ofisi, fırın, kasap ve apartman: benzin, ekmek, kıyma ve kira her ay güncelleniyor',
      'Kira zam sınırı, sosyal konut ve kentsel dönüşüm kirayı gerçekten etkiliyor',
      'Mevsimler: kışın kar, ilkbaharda parçalı bulut, yazın güneş, sonbaharda yağmur',
      'Trafiğe TIR ve kamyon eklendi',
      'Ekonomi yeniden dengelendi: bedava dezenflasyon bitti, sıfır faiz ve rezerv yakmak artık kriz çıkarıyor',
      'Başkanın Kasası: 100 bin ₺ başlangıç, 150 bin ₺ maaş, gölge iş bedelleri enflasyon ve kura endeksli',
      'Safari\'de sokak animasyonlarının bozulması ve açıklama yapınca karar sepetinin sıfırlanması giderildi']},
 {d:'2026-09-30',t:'Panel düzeni ve kabine',
  li:['Yeniden boyutlandırılabilir panel düzeni ve PPK etki tablosu',
      'Başkanın Açıklaması paneli: yorulma, gerçeklik ve gündem mekanikleri',
      'Kabine: hedef gösterme, görevden alma ve uyum dönemi maliyetleri']},
 {d:'2026-09-30',t:'İlk sürüm',
  li:['48 aylık görev süresi, para politikası, harcama paketleri ve seçim',
      'Ekonomiye göre değişen sokak sahnesi ve seçmen grupları']}
];
export function renderChangelog(){
  const host=$('#newsList'); if(!host)return;
  const tr=d=>{const [y,m,dd]=d.split('-');
    return `${+dd} ${['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'][+m-1]} ${y}`;};
  host.innerHTML=CHANGELOG.map((r,i)=>`<div class="nl-rel">
    <div class="nl-d">${tr(r.d)}${i===0?'<span class="nl-new">YENİ</span>':''}</div>
    <div class="nl-t">${r.t}</div>
    <ul>${r.li.map(x=>`<li>${x}</li>`).join('')}</ul>
  </div>`).join('');
}
