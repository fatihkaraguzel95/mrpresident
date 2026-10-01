import {S} from './state.js';
import {POL} from '../data/policies.js';
import {save} from '../sim/commit.js';

/* ═══════════════ YARDIMCILAR ═══════════════ */
// yürürlükteki paketlerin aylık ödeneği (mlr ₺) → yıllık % GSYH
export function activeSpendPct(){
  // 'reg' = düzenleme: bütçeden para çıkmaz, sadece kural koyar
  const monthly=S.active.filter(a=>POL(a.id).kind!=='wage'&&POL(a.id).kind!=='reg')
    .reduce((s,a)=>s+a.amt*(POL(a.id).kind==='save'?-1:1),0);
  return (monthly*12/1000)/S.e.gdpNom*100;
}
