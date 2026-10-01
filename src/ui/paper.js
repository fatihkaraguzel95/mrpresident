import {$, MONTHS, S, clamp, nf, pct, qOf, signed} from '../core/state.js';
import {basket, megaGuarantee} from '../data/mega.js';
import {mediaDamp, pubInflation} from '../sim/vault.js';

/* ═══════════════ MEYDAN GAZETESİ ═══════════════
   Her ay yeniden dizilen bir gazete. İçerik tamamen o ayın tablosundan
   üretilir: manşet ayın en sert gelişmesini alır, muhalefet en zayıf
   karnenden vurur, dünya sayfası küresel nabzı verir, sokak röportajı
   seçmen gruplarının hâlini anlatır, piyasa köşesi yatırımcının ağzından
   konuşur. Yaptığın her şey ertesi ay buraya yansır.
   ═══════════════════════════════════════════════ */

const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];

/* Ayın en sert gelişmesi — manşet bundan çıkar. */
function leadStory() {
  const e = S.e, p = S.p, inf = pubInflation();
  const C = [];
  if (S.flashLead) C.push({ w: 100, h: S.flashLead, k: 'SON DAKİKA' });
  if (e.usdtry > (S.prev ? S.prev.e.usdtry : e.usdtry) * 1.035)
    C.push({ w: 92, h: 'DOLAR BİR AYDA REKOR TAZELEDİ', k: 'PİYASA',
             s: `Kur ${nf(e.usdtry, 2)} seviyesini gördü. Döviz bürolarında kuyruk, sanayide maliyet paniği.` });
  if (inf > 55)
    C.push({ w: 90, h: 'ENFLASYON KONTROLDEN ÇIKTI', k: 'EKONOMİ',
             s: `Yıllık ${pct(inf)}. Market zincirleri etiketleri haftada iki kez değiştiriyor.` });
  else if (inf > 32)
    C.push({ w: 70, h: 'MUTFAK YANGINI SÜRÜYOR', k: 'EKONOMİ',
             s: `Yıllık enflasyon ${pct(inf)}. Ekmek ${nf(e.px.bread, 2)} ₺, kıyma ${nf(e.px.meat, 0)} ₺.` });
  else if (inf > 20)
    C.push({ w: 56, h: 'ENFLASYON İNATÇI', k: 'EKONOMİ',
             s: `Yıllık ${pct(inf)}. Düşüş var ama hedef hâlâ uzak; ekmek ${nf(e.px.bread, 2)} ₺.` });
  else if (inf < 15)
    C.push({ w: 74, h: 'ENFLASYONDA SOĞUMA İŞARETİ', k: 'EKONOMİ',
             s: `Yıllık ${pct(inf)}. Esnaf "temkinli iyimser" diyor, beklentiler ilk kez gerilemeye başladı.` });
  if (p.unrest > 70)
    C.push({ w: 95, h: 'SOKAK GERİLİYOR', k: 'GÜNDEM',
             s: 'Birçok ilde eş zamanlı gösteri. Valilikler ek güvenlik önlemi aldı.' });
  if (e.reserves < 35)
    C.push({ w: 96, h: 'REZERVLER KRİTİK SEVİYEDE', k: 'FİNANS',
             s: `Brüt rezerv ${nf(e.reserves, 0)} milyar dolara indi. "Kuru savunacak mermi kalmadı."` });
  if (e.unemployment > 12)
    C.push({ w: 80, h: 'İŞSİZLİK ÇİFT HANEDE ÇAKILI', k: 'İSTİHDAM',
             s: `İşsizlik ${pct(e.unemployment)}. Gençlerde oran çok daha yüksek.` });
  if (e.debt > 70)
    C.push({ w: 82, h: 'BORÇ SARMALI TARTIŞILIYOR', k: 'MALİYE',
             s: `Kamu borcu GSYH'nin ${pct(e.debt)}'ine ulaştı. Faiz gideri bütçeyi yiyor.` });
  if (e.growth > 5.5)
    C.push({ w: 68, h: 'EKONOMİ HIZLA BÜYÜYOR', k: 'BÜYÜME',
             s: `Yıllık büyüme ${pct(e.growth)}. Soru şu: bu hız sürdürülebilir mi?` });
  if (p.vote > 56)
    C.push({ w: 58, h: 'ANKETLERDE AÇIK ARA ÖNDE', k: 'SİYASET',
             s: `Son araştırmada destek ${pct(p.vote)}. Muhalefet strateji arıyor.` });
  if (e.px.rent / Math.max(1, e.minWage) > 0.85)
    C.push({ w: 72, h: 'KİRA KRİZİ BÜYÜYOR', k: 'KONUT',
             s: `Ortalama kira ${nf(e.px.rent, 0)} ₺ — asgari ücretin ${pct(e.px.rent / Math.max(1, e.minWage) * 100, 0)}'i.` });
  if (e.credibility < 22)
    C.push({ w: 78, h: 'PİYASA ARTIK İNANMIYOR', k: 'FİNANS',
             s: 'Politika güvenilirliği dip seviyede. Yatırımcı "ne söylense fiyatlamıyoruz" diyor.' });
  if (S.protest && S.protest.on)
    C.push({ w: 88, h: 'MEYDANDA KALABALIK', k: 'GÜNDEM',
             s: 'Eylem sürüyor; esnaf kepenk kapattı, kamu ulaşımı aksadı.' });
  if (S.mega && S.mega.some(m => m.built))
    C.push({ w: 44, h: 'DEV PROJE HİZMETE GİRDİ', k: 'ALTYAPI',
             s: `Garanti ödemeleri bütçeden yılda ${pct(megaGuarantee())} GSYH çıkıyor.` });
  if (e.growth < 1)
    C.push({ w: 84, h: 'EKONOMİ DURMA NOKTASINDA', k: 'BÜYÜME',
             s: `Yıllık büyüme ${pct(e.growth)}. Sanayide kapasite kullanımı geriledi.` });
  if (p.vote < 38)
    C.push({ w: 76, h: 'İKTİDARDA OY KAYBI DERİNLEŞİYOR', k: 'SİYASET',
             s: `Destek ${pct(p.vote)}'e geriledi. Parti içinde tedirginlik konuşuluyor.` });
  if (!C.length)
    C.push({ w: 10, h: 'EKONOMİDE SAKİN BİR AY', k: 'GÜNDEM',
             s: 'Göstergeler yatay seyretti. Piyasalar bir sonraki veri setini bekliyor.' });
  C.sort((a, b) => b.w - a.w);
  return C[0];
}

/* Muhalefet en zayıf karneden vurur. */
function opposition() {
  const e = S.e, p = S.p, inf = pubInflation();
  const bsk = basket();
  const cand = [
    { w: inf > 25 ? inf : 0, who: 'Ana Muhalefet Lideri',
      q: `"${pct(inf)} enflasyonla milleti mutfakta terk ettiler. Bu tablo yönetim değil, idare bile değil."` },
    { w: e.unemployment > 10 ? e.unemployment * 3 : 0, who: 'Muhalefet Ekonomi Sözcüsü',
      q: `"${pct(e.unemployment)} işsizlik. Gençler diploma alıp kuyruğa giriyor, iktidar rakamlarla oynuyor."` },
    { w: e.minWage / bsk < 1.35 ? 60 : 0, who: 'Sendika Genel Başkanı',
      q: `"Asgari ücret ${nf(e.minWage, 0)} ₺, açlık sınırı ${nf(bsk * 1.25, 0)} ₺. Bu rakam alay etmektir."` },
    { w: p.integrity < 45 ? (60 - p.integrity) * 2 : 0, who: 'Muhalefet Grup Başkanvekili',
      q: '"İhale dosyaları ortada, soruşturma yok. Bu ülkede birileri dokunulmaz mı?"' },
    { w: e.debt > 60 ? e.debt : 0, who: 'Eski Hazine Bakanı',
      q: `"Borcu ${pct(e.debt)}'e çıkardılar. Faturayı çocuklarımız ödeyecek."` },
    { w: megaGuarantee() > 1.2 ? 70 : 0, who: 'Muhalefet Altyapı Komisyonu',
      q: `"Garantili projelere yılda ${pct(megaGuarantee())} GSYH ödüyoruz — hem de dolar üzerinden. Kime çalışıyoruz?"` },
    { w: (e.px.rent / Math.max(1, e.minWage)) > 0.8 ? 65 : 0, who: 'Belediye Başkanı',
      q: `"Ortalama kira ${nf(e.px.rent, 0)} ₺. Genç bir çift bu şehirde nasıl yaşasın?"` },
    { w: e.reserves < 70 ? (90 - e.reserves) : 0, who: 'Muhalefet Ekonomi Kurulu',
      q: `"Rezerv ${nf(e.reserves, 0)} milyar dolar. Kasayı boşalttılar, faturayı millet ödeyecek."` },
    { w: 18, who: 'Muhalefet Sözcüsü',
      q: '"Tabloyu düzeltecek tek şey erken seçimdir. Millet sandıkta hesabını sorar."' },
    /* iyi gidiyorsa muhalefet de tonunu değiştirir */
    { w: (inf < 16 && p.vote > 52) ? 55 : 0, who: 'Muhalefet Genel Başkanı',
      q: '"Enflasyondaki düşüşü görüyoruz; ama bu başarı değil, kaybedilen yılların telafisidir."' },
  ].filter(c => c.w > 0);
  cand.sort((a, b) => b.w - a.w);
  const top = cand.slice(0, 3);
  return pick(top, S.t * 7 + S.month);
}

/* Dünya sayfası — küresel nabız. */
function world() {
  const e = S.e, sh = e.shock || {};
  const C = [];
  if (sh.risk > 14) C.push('Gelişmekte olan ülkelerden sermaye çıkışı sürüyor; bölge paraları topluca değer kaybetti.');
  if (sh.fuel > 6) C.push('Brent fiyatı yüksek seyrini koruyor. Enerji ithalatçısı ülkelerde cari açık endişesi büyüyor.');
  if (sh.food > 6) C.push('Küresel gıda endeksi iki yılın zirvesinde. Hububat ihracatçıları kota tartışıyor.');
  if (e.cds > 520) C.push('Yatırım bankaları ülke risk primini "yüksek riskli" kategoride sınıflandırdı.');
  else if (e.cds < 240) C.push('Risk primindeki gerileme yabancı fonların ilgisini yeniden canlandırdı.');
  if (e.current < -5) C.push('Cari açık finansmanı küresel iştaha bağlı; analistler "kırılgan" uyarısı yapıyor.');
  C.push('Fed tutanakları faizde uzun süre yüksek kalma sinyali verdi; dolar endeksi güçlü seyrediyor.');
  C.push('Avrupa\'da sanayi üretimi zayıf; ihracatçılar sipariş defterlerinin inceldiğini söylüyor.');
  C.push('Asya\'da talep toparlanıyor, emtia fiyatları yukarı yönlü baskı altında.');
  C.push('Küresel yatırımcılar seçim takvimi olan ülkelerde pozisyonlarını küçültüyor.');
  return pick(C, S.t * 3 + S.month * 5);
}

/* Sokak röportajı — en mutsuz (ya da en mutlu) kesim konuşur. */
function street() {
  const g = [
    ['retiree', 'Emekli', `Aylığım ${nf(S.e.pension, 0)} ₺. Kira ${nf(S.e.px.rent, 0)} ₺. Hesabı siz yapın.`,
     'Aylığa gelen zam bu sefer yüzümüzü güldürdü, uzun zamandır ilk.'],
    ['minwage', 'Asgari ücretli', `${nf(S.e.minWage, 0)} ₺ ile ayı çıkaramıyorum, mesaiye kalıyorum.`,
     'Maaş bu ay ilk kez markete yetti, ay sonunu beklemedim.'],
    ['youth', 'Üniversite mezunu', 'İki yıldır iş arıyorum, kirayı ailem ödüyor. Buradan bir yere varamayacağım.',
     'Sonunda işe girdim. Arkadaşlarım da çağrı almaya başladı.'],
    ['sme', 'Esnaf', 'Ciro yarıya düştü, kirayı zor veriyorum. Çırağı çıkarmak zorunda kaldım.',
     'Dükkâna giren çıkan arttı, bu sene ilk kez stok yeniledim.'],
    ['capital', 'Sanayici', 'Kur belirsiz, kredi pahalı. Yatırım kararını bir çeyrek daha erteledik.',
     'Öngörülebilirlik arttı; yeni hat için düğmeye bastık.'],
  ];
  let worst = g[0], worstV = 101, best = g[0], bestV = -1;
  for (const row of g) {
    const v = S.seg[row[0]];
    if (v < worstV) { worstV = v; worst = row; }
    if (v > bestV) { bestV = v; best = row; }
  }
  const useBest = bestV > 62 && (S.t + S.month) % 3 === 0;
  const row = useBest ? best : worst;
  return { who: row[1], q: useBest ? row[3] : row[2], good: useBest };
}

/* Piyasa köşesi. */
function market() {
  const e = S.e, real = e.rate - e.expect;
  const C = [];
  if (real < -4) C.push(`Reel faiz ${pct(real)}. "Lirada kalmanın bir karşılığı yok" diyor fon yöneticileri.`);
  else if (real > 8) C.push(`Reel faiz ${pct(real)}. Mevduat cazip, ama şirketler kredi maliyetinden şikâyetçi.`);
  if (e.credibility < 25) C.push('Yabancı yatırımcı anketinde "politika öngörülebilirliği" tarihi dipte.');
  else if (e.credibility > 62) C.push('Para politikasına güven göstergesi iki yılın en yükseğinde.');
  if (e.credit > 45) C.push('Kredi büyümesi hızlandı; düzenleyici kurum "balon" uyarısı yapanları dinliyor.');
  if (e.dollarization > 55) C.push(`Mevduatın ${pct(e.dollarization, 0)}'i dövizde. Lirasızlaşma tartışması yeniden açıldı.`);
  C.push(`Borsa, ${e.growth > 3.5 ? 'büyüme verisiyle alıcılı' : 'zayıf veriyle satıcılı'} seyretti.`);
  C.push(`Gösterge tahvil faizi ${pct(e.effRate)} seviyesinde yatay.`);
  return pick(C, S.t * 11 + S.month * 3);
}

/* ── MEDYA KONTROLÜ ──
   Gölge işlerden "medyaya baskı" ya da "medya grubu satın alma" aktifse
   gazete gerçeği eğip bükmeye başlar: kötü manşet yumuşar, muhalefetin sesi
   kısılır, sokak röportajı hep memnun kesimden seçilir. Ekonomiyi
   değiştirmez — sadece tabanın gördüğü tabloyu değiştirir. */
const SOFT = {
  'ENFLASYON KONTROLDEN ÇIKTI': 'FİYATLARDA KÜRESEL DALGALANMA',
  'MUTFAK YANGINI SÜRÜYOR': 'MARKET FİYATLARI MERCEK ALTINDA',
  'ENFLASYON İNATÇI': 'ENFLASYONDA KADEMELİ NORMALLEŞME',
  'DOLAR BİR AYDA REKOR TAZELEDİ': 'KURDA KÜRESEL KAYNAKLI HAREKET',
  'SOKAK GERİLİYOR': 'BİRKAÇ İLDE SINIRLI GÖSTERİ',
  'MEYDANDA KALABALIK': 'MEYDANDA KÜÇÜK BİR GRUP TOPLANDI',
  'REZERVLER KRİTİK SEVİYEDE': 'REZERV YÖNETİMİNDE YENİ DÖNEM',
  'İŞSİZLİK ÇİFT HANEDE ÇAKILI': 'İSTİHDAMDA YAPISAL DÖNÜŞÜM SÜRÜYOR',
  'BORÇ SARMALI TARTIŞILIYOR': 'KAMU MALİYESİNDE YENİDEN YAPILANMA',
  'İKTİDARDA OY KAYBI DERİNLEŞİYOR': 'ANKETLERDE DALGALI SEYİR',
  'KİRA KRİZİ BÜYÜYOR': 'KONUT PİYASASINDA HAREKETLİLİK',
  'PİYASA ARTIK İNANMIYOR': 'PİYASALARDA TEMKİNLİ BEKLEYİŞ',
  'EKONOMİ DURMA NOKTASINDA': 'EKONOMİDE YUMUŞAK İNİŞ',
};
const LOYAL = [
  { who: 'Ekonomi Yorumcusu', q: '"Küresel konjonktüre rağmen ülkemiz dik duruyor. Bu tablo yönetimin başarısıdır."' },
  { who: 'Strateji Uzmanı', q: '"Muhalefetin kriz anlatısı sahadaki gerçekle örtüşmüyor; vatandaş bunu görüyor."' },
  { who: 'Köşe Yazarı', q: '"Rakamlara takılanlar büyük resmi kaçırıyor. Ülke tarihi bir dönüşümden geçiyor."' },
  { who: 'Akademisyen', q: '"Alınan kararlar orta vadede meyvesini verecek. Sabırsızlık en büyük düşmanımız."' },
];

/* Medya kontrolündeyken röportaj hep en memnun kesimden seçilir. */
function bestStreet() {
  const g = [
    ['retiree','Emekli','Aylığa gelen zam bu sefer yüzümüzü güldürdü, uzun zamandır ilk.'],
    ['minwage','Asgari ücretli','Maaş bu ay ilk kez markete yetti, ay sonunu beklemedim.'],
    ['youth','Genç girişimci','Devletin desteğiyle kendi işimi kurdum, arkadaşlarıma da tavsiye ediyorum.'],
    ['sme','Esnaf','Dükkâna giren çıkan arttı, bu sene ilk kez stok yeniledim.'],
    ['capital','Sanayici','Öngörülebilirlik arttı; yeni hat için düğmeye bastık.'],
  ];
  let best = null, v = -1;
  for (const r of g) { if (S.seg[r[0]] > v) { v = S.seg[r[0]]; best = r; } }
  return best ? { who: best[1], q: best[2], good: true } : null;
}

export function renderPaper() {
  const host = $('#paperBody');
  if (!host || !S) return;
  const grip = mediaDamp();                 // 0 = özgür, .6 = baskı, 1 = havuz
  let lead = leadStory(), op = opposition(), st = street();
  if (grip > 0) {
    if (SOFT[lead.h]) { lead = { ...lead, h: SOFT[lead.h], s: grip >= 1 ? '' : lead.s, k: 'GÜNDEM' }; }
    if (grip >= 1 || (S.t + S.month) % 2 === 0) op = pick(LOYAL, S.t * 5 + S.month);
    const best = bestStreet();
    if (best && (grip >= 1 || (S.t + S.month) % 2 === 0)) st = best;
  }
  const say = S.hist.length;
  host.innerHTML = `
    <div class="np">
      <div class="np-mast">
        <span class="np-l">MEYDAN</span>
        <span class="np-d">${MONTHS[S.month - 1]} ${S.year} · ${qOf(S.month)}. çeyrek · sayı ${say}${
          grip >= 1 ? '<br><b class="np-own">HAVUZ MEDYASI</b>' : grip > 0 ? '<br><b class="np-own">BASKI ALTINDA</b>' : ''}</span>
      </div>
      <div class="np-k">${lead.k}</div>
      <h4 class="np-h">${lead.h}</h4>
      ${lead.s ? `<p class="np-s">${lead.s}</p>` : ''}
      <div class="np-rule"></div>

      <div class="np-sec">Muhalefet</div>
      <p class="np-q">${op.q}</p>
      <div class="np-by">— ${op.who}</div>

      <div class="np-sec">Sokaktan</div>
      <p class="np-q ${st.good ? 'ok' : ''}">“${st.q}”</p>
      <div class="np-by">— ${st.who}</div>

      <div class="np-sec">Dünya</div>
      <p class="np-t">${world()}</p>

      <div class="np-sec">Piyasa</div>
      <p class="np-t">${market()}</p>
    </div>`;
}
