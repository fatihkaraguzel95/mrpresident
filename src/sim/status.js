import {$, K, S, clamp, nf, pct} from '../core/state.js';

/* ═══════════════ ÜLKE STATÜSÜ ═══════════════
   Gerçek hayatta bir ülkenin "gelişmekte olan" mı "gelişmiş" mi sayıldığı
   tek bir rakama bakmaz: fiyat istikrarı, kurumsal güven, borçluluk, dış
   denge, istihdam, para ikamesi ve refah birlikte değerlendirilir
   (IMF/Dünya Bankası sınıflamaları, Maastricht ölçütleri, yatırım
   yapılabilir not eşikleri bu mantıkla kurulur).

   Burada da öyle: her ölçüt 0–1 arası puanlanır, önem ağırlığıyla
   toplanır. Oyuna "gelişmekte olan ülke" olarak başlarsın; enflasyonu
   kalıcı düşürüp kurumsal güveni ve refahı büyütürsen yukarı çıkarsın,
   kaybedersen aşağı düşersin.
   ═══════════════════════════════════════════ */

const CRIT = [
  { k: 'enf',    w: 3.0, n: 'Fiyat istikrarı',
    f: e => clamp((25 - e.inflation) / 21, 0, 1),
    d: e => `enflasyon ${pct(e.inflation)} · hedef %4 altı` },
  { k: 'bek',    w: 2.0, n: 'Çıpalanmış beklenti',
    f: e => clamp((20 - e.expect) / 14, 0, 1),
    d: e => `beklenen enflasyon ${pct(e.expect)}` },
  { k: 'guven',  w: 2.0, n: 'Politika güvenilirliği',
    f: e => clamp((e.credibility - 25) / 50, 0, 1),
    d: e => `${nf(e.credibility, 0)}/100` },
  { k: 'cds',    w: 2.0, n: 'Yatırım yapılabilir risk primi',
    f: e => clamp((450 - e.cds) / 300, 0, 1),
    d: e => `CDS ${nf(e.cds, 0)} bp · eşik 150 bp` },
  { k: 'borc',   w: 1.5, n: 'Kamu borcu (Maastricht)',
    f: e => clamp((85 - e.debt) / 30, 0, 1),
    d: e => `borç/GSYH ${pct(e.debt)} · eşik %60` },
  { k: 'butce',  w: 1.5, n: 'Bütçe disiplini',
    f: e => clamp((e.budget + 7) / 5, 0, 1),
    d: e => `açık ${pct(-e.budget)} · eşik %3` },
  { k: 'cari',   w: 1.0, n: 'Dış denge',
    f: e => clamp((e.current + 6) / 5, 0, 1),
    d: e => `cari denge ${pct(e.current)}` },
  { k: 'rez',    w: 1.0, n: 'Rezerv yeterliliği',
    f: e => clamp((e.reserves - 30) / 110, 0, 1),
    d: e => `${nf(e.reserves, 0)} mlr $` },
  { k: 'issiz',  w: 1.5, n: 'İstihdam',
    f: e => clamp((13 - e.unemployment) / 7, 0, 1),
    d: e => `işsizlik ${pct(e.unemployment)}` },
  { k: 'dolar',  w: 1.5, n: 'Kendi parasına güven',
    f: e => clamp((55 - e.dollarization) / 35, 0, 1),
    d: e => `dolarizasyon ${pct(e.dollarization, 0)}` },
  { k: 'pot',    w: 1.5, n: 'Üretim kapasitesi',
    f: e => clamp((e.potGrowth - 1.5) / 3, 0, 1),
    d: e => `potansiyel büyüme ${pct(e.potGrowth)}` },
  { k: 'kurum',  w: 1.5, n: 'Kurumsal şeffaflık',
    f: (e, p) => clamp((p.integrity - 30) / 50, 0, 1),
    d: (e, p) => `${nf(p.integrity, 0)}/100` },
  { k: 'ucret',  w: 2.0, n: 'Asgari ücretin dolar karşılığı',
    f: e => clamp((e.minWage / e.usdtry - 350) / 1100, 0, 1),
    d: e => `$${nf(e.minWage / e.usdtry, 0)} · gelişmiş eşiği $1.450` },
  { k: 'alim',   w: 1.0, n: 'Hane alım gücü',
    f: e => clamp((e.realIncome - 85) / 40, 0, 1),
    d: e => `endeks ${nf(e.realIncome, 0)}` },
];

const TIERS = [
  { min: 90, n: 'Gelişmiş ülke',              c: '#1E5A33', s: 'Fiyat istikrarı, güçlü kurumlar ve yüksek refah.' },
  { min: 80, n: 'Gelişmiş ülkeye yakın',      c: '#2F6B3E', s: 'Eşiktesin; kurumsal güven ve refah son adımı belirleyecek.' },
  { min: 68, n: 'Üst-orta gelirli ülke',      c: '#4E7A2E', s: 'Makro tablo oturdu, refah ve kurumlar hâlâ gelişiyor.' },
  { min: 55, n: 'Yükselen piyasa',            c: '#8A6A12', s: 'Yatırımcı radarında; kırılganlıklar sürüyor.' },
  { min: 38, n: 'Gelişmekte olan ülke',       c: '#A9660B', s: 'Büyüme var ama enflasyon ve kurumsal güven sorunlu.' },
  { min: 22, n: 'Kırılgan gelişen ekonomi',   c: '#A8431E', s: 'Dış şoklara açık, finansmanı pahalı.' },
  { min: 0,  n: 'Kriz ekonomisi',             c: '#A82F26', s: 'Fiyat ve finansman istikrarı kaybedildi.' },
];

export function countryStatus() {
  const e = S.e, p = S.p;
  let sum = 0, tot = 0;
  const parts = CRIT.map(c => {
    const v = c.f(e, p);
    sum += v * c.w; tot += c.w;
    return { n: c.n, v, w: c.w, d: c.d(e, p) };
  });
  const score = sum / tot * 100;
  const tier = TIERS.find(t => score >= t.min) || TIERS[TIERS.length - 1];
  const up = TIERS.filter(t => t.min > tier.min).sort((a, b) => a.min - b.min)[0] || null;
  /* Seni en çok geride tutan ölçütler: düşük puanlı ve ağırlığı yüksek olanlar. */
  const weak = parts.slice().sort((a, b) => (a.v * a.w) - (b.v * b.w)).slice(0, 3);
  const strong = parts.slice().sort((a, b) => (b.v * b.w) - (a.v * a.w)).slice(0, 2);
  return { score, tier, up, parts, weak, strong };
}
