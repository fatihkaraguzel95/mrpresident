import {$, MSHORT, S, clamp} from '../core/state.js';
import {headline} from './economy.js';

/* ═══════════════ VERİLEN SÖZLER ═══════════════
   Basın toplantısında ya da bir olayda verdiğin cevap kayda geçer.
   "Faizi indirmeyeceğiz" dedikten bir ay sonra indirirsen bu tutulmamış
   bir sözdür: güvenilirlik düşer, beklenti bozulur, manşet olur.
   Tuttuğun söz ise süresi dolunca küçük bir güven getirisi bırakır.

   kind alanları:
     snap(S)   → söz verilirken ölçülen referans (varsa)
     broke(p)  → şu an ihlal edildi mi? (yapmama sözleri)
     kept(p)   → süre dolarken yerine getirilmiş mi? (yapma sözleri)
   ═══════════════════════════════════════════════ */
export const PLEDGE={
  noCut:{t:'faizi indirmeme sözü', mo:3,
    snap:S=>({rate:S.e.rate}),
    broke:(p,S)=>S.e.rate<p.ref.rate-0.1,
    draft:(p,S)=>S.draft.rate<p.ref.rate-0.1,
    msg:'Faiz indirilmeyecek denmişti, indirildi'},
  noHike:{t:'faizi artırmama sözü', mo:3,
    snap:S=>({rate:S.e.rate}),
    broke:(p,S)=>S.e.rate>p.ref.rate+0.1,
    draft:(p,S)=>S.draft.rate>p.ref.rate+0.1,
    msg:'Faiz artırılmayacak denmişti, artırıldı'},
  noFxSale:{t:'rezerv harcamama sözü', mo:6,
    snap:S=>({sold:S.fxSold||0}),
    broke:(p,S)=>(S.fxSold||0)>p.ref.sold+0.01,
    draft:(p,S)=>S.draft.fx>0,
    msg:'Rezerv savunmaya harcanmayacak denmişti, döviz satıldı'},
  noArazam:{t:'ara zam yapmama sözü', mo:9,
    snap:S=>({y:S.araZamYear||0}),
    broke:(p,S)=>(S.araZamYear||0)!==p.ref.y,
    draft:(p,S)=>S.draft.policies.some(x=>x.id==='wage'),
    msg:'Ara zam yapılmayacak denmişti, yapıldı'},
  doArazam:{t:'ara zam sözü', mo:7,
    snap:S=>({y:S.araZamYear||0}),
    kept:(p,S)=>(S.araZamYear||0)!==p.ref.y,
    msg:'Söz verilen ara zam gelmedi'},
  doRentcap:{t:'kira zam sınırı sözü', mo:7,
    snap:S=>({}),
    kept:(p,S)=>S.active.some(a=>a.id==='rentcap'),
    msg:'Söz verilen kira zam sınırı çıkmadı'},
  freezeSalary:{t:'maaşını dondurma sözü', mo:14,
    snap:S=>({sal:(S.me&&S.me.salary)||0}),
    broke:(p,S)=>((S.me&&S.me.salary)||0)>p.ref.sal+1,
    msg:'Maaşım donduruldu denmişti, zam yapıldı'},
  noCrackdown:{t:'orantısız güce izin vermeme sözü', mo:12,
    snap:S=>({h:S.hardCrack||0}),
    broke:(p,S)=>(S.hardCrack||0)>p.ref.h,
    msg:'Orantısız güce tolerans yok denmişti, meydan zorla boşaltıldı'},
  cutDeficit:{t:'açığı daraltma sözü', mo:12,
    snap:S=>({b:S.e.budget}),
    kept:(p,S)=>S.e.budget>p.ref.b+0.4,
    msg:'Harcama kısılacak denmişti, açık daralmadı'},
  disinflation:{t:'enflasyonu düşürme sözü', mo:12,
    snap:S=>({i:S.e.inflation}),
    kept:(p,S)=>S.e.inflation<p.ref.i-3,
    msg:'Enflasyon düşecek denmişti, düşmedi'},
};

/* Söz ver (seçenek seçildiğinde çağrılır) */
export function addPledge(kind){
  const D=PLEDGE[kind]; if(!D)return;
  if(!S.pledges)S.pledges=[];
  S.pledges=S.pledges.filter(p=>p.k!==kind);          // aynı konuda tek söz
  S.pledges.push({k:kind,left:D.mo,ref:D.snap?D.snap(S):{}});
}

/* Her ay kontrol: ihlal edildi mi, süresi dolarken tutuldu mu? */
export function checkPledges(){
  if(!S.pledges||!S.pledges.length)return;
  const kalan=[];
  for(const p of S.pledges){
    const D=PLEDGE[p.k]; if(!D)continue;
    p.left--;
    const stamp=`${MSHORT[S.month-1]} ${S.year}`;
    if(D.broke&&D.broke(p,S)){
      S.e.credibility=clamp(S.e.credibility-7,3,97);
      S.e.expect+=0.8;
      S.p.vote=clamp(S.p.vote-0.6,3,84);
      S.p.integrity=clamp(S.p.integrity-4,2,98);
      headline('Sözünden döndü: '+D.msg.toLowerCase());
      S.log.unshift({q:stamp,kind:'event',title:'⚠ Tutulmayan söz',
        body:`${D.msg}. Güvenilirlik −7 · beklenti bozuldu · şeffaflık −4.`});
      continue;                                        // söz düştü
    }
    if(p.left<=0){
      if(D.kept&&!D.kept(p,S)){
        S.e.credibility=clamp(S.e.credibility-6,3,97);
        S.e.expect+=0.6;
        S.p.vote=clamp(S.p.vote-0.5,3,84);
        headline('Söz tutulmadı: '+D.msg.toLowerCase());
        S.log.unshift({q:stamp,kind:'event',title:'⚠ Tutulmayan söz',body:`${D.msg}. Güvenilirlik −6.`});
      }else{
        S.e.credibility=clamp(S.e.credibility+3,3,97);
        S.e.expect-=0.3;
        S.log.unshift({q:stamp,kind:'event',title:'✔ Tutulan söz',
          body:`${D.t[0].toLocaleUpperCase('tr')+D.t.slice(1)} yerine getirildi. Güvenilirlik +3.`});
      }
      continue;
    }
    kalan.push(p);
  }
  S.pledges=kalan;
}

/* Sepetteki karar hangi sözü çiğniyor? Uygulanmadan ÖNCE uyarmak için. */
export function draftBreaches(){
  const out=[];
  for(const p of (S.pledges||[])){
    const D=PLEDGE[p.k];
    if(D&&D.draft&&D.draft(p,S))out.push({t:D.t,left:p.left});
  }
  return out;
}
/* Yürürlükteki tüm sözler — panelde göstermek için. */
export function activePledges(){
  return (S.pledges||[]).map(p=>({t:PLEDGE[p.k]?PLEDGE[p.k].t:p.k,left:p.left}));
}
