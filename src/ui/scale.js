/* ═══════════════ ARAYÜZ ÖLÇEĞİ ═══════════════
   Düzen 1600×900 için çizildi. 2K/4K ekranda arayüz minicik kalıyor,
   1366×768'de ise panolar dikey taşıyordu. Kök elemana tek bir katsayı
   uygulayıp bütün px ölçülerini (grid, yazı, kenarlık, boşluk) aynı oranda
   büyütüp küçültüyoruz.

   Neden `zoom`, neden `transform:scale` değil: scale düzeni yeniden akıtmaz,
   kaydırma yüksekliğini ve tıklama alanlarını kaydırır. `zoom` ise ölçüleri
   düzen hesabına katar — grid yeniden akar, 100vh gerçekten ekran boyu kalır.

   Bir de şu var: `zoom` medya sorgularını etkilemez. Ekran 1280px olup ölçek
   0.8 ise düzen aslında 1600px'lik alana akıyordur, ama `@media
   (max-width:1320px)` yine tetiklenirdi. Bu yüzden kırılma noktaları medya
   sorgusu değil, buradan yazılan `data-bp` imleri üzerinden çalışıyor.

   Son olarak: fare konumu (clientX, getBoundingClientRect) gerçek ekran
   pikselinde gelir, bizim yazdığımız CSS px ise ölçeklenmiş uzaydadır.
   Arasındaki çeviri `toCss()`.                                              */

export const BASE_W = 1600, BASE_H = 1106;  // panoların kaydırmasız sığdığı ölçü
const NARROW = 1120;        // bunun altında küçültme yok: duyarlı düzen devralır
const MIN = 0.8, MAX = 2;
const STEPS = [0.8, 0.85, 0.9, 1, 1.1, 1.25, 1.4, 1.6, 1.8, 2];
const BPS = [1560, 1320, 1100, 980, 900, 620];   // styles.css'teki eşikler
export const SCALE_KEY = 'mrp_scale_v1';

let manual = null;          // kullanıcı elle ayarladıysa otomatik devre dışı
let scale = 1;
const listeners = [];

/** Yürürlükteki ölçek katsayısı. */
export const uiScale = () => scale;
/** Gerçek ekran pikselini CSS pikseline çevirir. */
export const toCss = px => px / scale;
/** Ölçek değiştiğinde haber verilecek geri çağrı. */
export const onScale = fn => { listeners.push(fn); };

export const scaleAuto = () => manual == null;

function fit(w, h){
  if(w < NARROW) return 1;
  return Math.min(MAX, Math.max(MIN, Math.min(w / BASE_W, h / BASE_H)));
}

export function applyScale(){
  const w = window.innerWidth, h = window.innerHeight;
  const next = Math.round((manual == null ? fit(w, h) : manual) * 100) / 100;
  const r = document.documentElement;
  scale = next;
  r.style.setProperty('--ui-scale', String(scale));
  /* zoom altında vw/vh ekran ölçüsüne bölünmez; ekran boyu gereken yerler
     bu iki değişkeni kullanır (ölçeklenmiş uzayda CSS pikseli). */
  r.style.setProperty('--vw', (w / scale) + 'px');
  r.style.setProperty('--vh', (h / scale) + 'px');
  // Kırılma noktaları ölçeklenmiş (etkin) genişliğe göre
  const ew = w / scale;
  /* Öznitelik adı bilerek 'data-vp': kök elemandaki 'data-bp' faiz hızlı adım
     düğmelerinin data-bp'siyle çakışıyor, closest('[data-bp]') <html>'i yakalayıp
     Para Politikası panelindeki her tıklamayı yutuyordu. */
  r.setAttribute('data-vp', BPS.filter(b => ew <= b).map(b => 'lt' + b).join(' '));
  r.setAttribute('data-scale', manual == null ? 'auto' : 'manual');
  listeners.forEach(fn => { try{ fn(scale); }catch(e){} });
  return scale;
}

function store(){
  try{
    if(manual == null) localStorage.removeItem(SCALE_KEY);
    else localStorage.setItem(SCALE_KEY, String(manual));
  }catch(e){}
}

/** dir>0 büyüt, dir<0 küçült. Elle ayar otomatiği kapatır. */
export function stepScale(dir){
  let i;
  if(dir > 0){
    i = STEPS.findIndex(s => s > scale + 0.001);
    if(i < 0) i = STEPS.length - 1;
  }else{
    const below = STEPS.filter(s => s < scale - 0.001);
    i = below.length ? STEPS.indexOf(below[below.length - 1]) : 0;
  }
  manual = STEPS[i];
  store(); applyScale();
}

/** Otomatik ölçeğe dön. */
export function resetScale(){ manual = null; store(); applyScale(); }

export function initScale(){
  try{
    const v = parseFloat(localStorage.getItem(SCALE_KEY));
    if(isFinite(v) && v >= MIN && v <= MAX) manual = v;
  }catch(e){}
  applyScale();
  let raf = 0;
  window.addEventListener('resize', () => {
    if(raf) return;
    raf = requestAnimationFrame(() => { raf = 0; applyScale(); });
  });
}
