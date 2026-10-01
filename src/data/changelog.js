import {$} from '../core/state.js';

/* ═══════════════ SÜRÜM GÜNLÜĞÜ ═══════════════
   Açılış ekranının solunda duran "Yenilikler" listesi. En yeni sürüm
   en üstte; ilk sıradaki YENİ rozetiyle işaretlenir.
   Yeni bir özellik eklendiğinde buraya da bir madde yazılır. */
export const CHANGELOG=[
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
