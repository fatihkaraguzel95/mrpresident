import {MSHORT, S} from '../core/state.js';
import {headline} from './economy.js';

/* ═══════════════ BU AY YAPILANLAR ═══════════════
   Oyuncunun ay içinde yaptığı her hamle buraya düşer: faiz kararından
   açıklamaya, hedef göstermekten af istemeye kadar. Üç yerde okunur:

   1) Karar Sepeti — "bu ay yapılanlar" listesi, ayı kapatmadan ne yaptığını
      görürsün (sepetteki bekleyen kararların altında).
   2) Meydan gazetesi — basın her hamleyi olumlu ya da olumsuz karşılar;
      yeterince ağır bir hamle manşete de çıkabilir.
   3) Bant yazısı — hamle anında ekranın altından geçer ("hemen" tepki).

   Gizli işler (gölge portföy) basına düşmez: paper:false ile kaydedilir.

   Ay ilerlerken liste gazeteye devredilir (actsRoll), sepet boşalır.
   ═══════════════════════════════════════════════ */

/** a = {ico, t, s, good, k, h, ps, w, paper} */
export function logAct(a){
  if(!S)return;
  if(!Array.isArray(S.acts))S.acts=[];
  const rec={ico:a.ico||'•', t:a.t, s:a.s||'', good:a.good===undefined?null:a.good,
    k:a.k||'GÜNDEM', h:a.h||null, ps:a.ps||'', w:a.w||0,
    paper:a.paper===false?false:true, q:`${MSHORT[S.month-1]} ${S.year}`};
  S.acts.unshift(rec);
  if(S.acts.length>20)S.acts.length=20;
  if(rec.paper&&rec.h)headline(rec.h);      // bant yazısına anında düşsün
  return rec;
}

/** Ay ilerlerken: sepetteki liste gazeteye devredilir, sepet boşalır. */
export function actsRoll(){
  S.actsPaper=Array.isArray(S.acts)?S.acts.slice():[];
  S.acts=[];
}

/** Gazeteye düşecek hamleler (en ağırı başta). */
export function paperActs(){
  const a=Array.isArray(S.actsPaper)?S.actsPaper:[];
  return a.filter(x=>x.paper!==false);
}

/** Manşete çıkmaya aday en ağır hamle. */
export function leadAct(){
  const a=paperActs().filter(x=>x.h&&x.w>0);
  if(!a.length)return null;
  return a.reduce((b,x)=>x.w>b.w?x:b,a[0]);
}
