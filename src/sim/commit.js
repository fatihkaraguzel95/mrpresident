import {$, K, MSHORT, S, SAVE_KEY, clamp, nf, pct} from '../core/state.js';
import {newPkgCap} from '../data/mega.js';
import {POL} from '../data/policies.js';
import {commName, guidName} from './economy.js';

/* ═══════════════ KARARLARIN UYGULANMASI ═══════════════ */
export function commitDraft(){
  const d=S.draft,notes=[];
  // ileri yönlendirme sözünü çiğnedin mi?
  if(S.e.guidance==='tight'&&d.rate<S.e.rate-0.1){
    S.e.guidancePledge={broken:true};
    notes.push('⚠ "Sıkı duruş" sözüne rağmen faiz indirildi');
  }
  if(S.e.guidance==='loose'&&d.rate>S.e.rate+0.1){
    S.e.guidancePledge={broken:true};
    notes.push('⚠ "Gevşeme" sinyaline rağmen faiz artırıldı');
  }
  if(Math.abs(d.rate-S.e.rate)>=.05){notes.push(`Politika faizi ${pct(S.e.rate)} → ${pct(d.rate)}`);S.e.rate=d.rate;}
  if(d.api!==S.e.api){notes.push(`APİ fonlaması ${nf(S.e.api,0)} → ${nf(d.api,0)} mlr ₺`);S.e.api=d.api;}
  if(d.zkTL!==S.e.zkTL){notes.push(`TL zorunlu karşılık ${pct(S.e.zkTL,0)} → ${pct(d.zkTL,0)}`);S.e.zkTL=d.zkTL;}
  if(d.zkFX!==S.e.zkFX){notes.push(`YP zorunlu karşılık ${pct(S.e.zkFX,0)} → ${pct(d.zkFX,0)}`);S.e.zkFX=d.zkFX;}
  if(d.comm!==S.e.comm){S.e.comm=d.comm;notes.push('İletişim: '+commName(d.comm));}
  if(d.guidance!==S.e.guidance){S.e.guidance=d.guidance;notes.push('Yönlendirme: '+guidName(d.guidance));}
  if(d.fx){const amt=d.fx;
    /* Müdahalenin gücü güvenilirliğe ve elde kalan mermiye bağlı.
       Güven yoksa piyasa satılan dövizi anında geri alır; bastırılan
       kur baskısı da kaybolmaz, sonraki aylara sarkar. */
    const eff=0.004*(0.30+S.e.credibility/150)*clamp(S.e.reserves/90,0.25,1.15);
    S.e.reserves=clamp(S.e.reserves-Math.abs(amt),5,400);
    S.e.usdtry=clamp(S.e.usdtry*(1-amt*eff),8,900);
    S.e.fxHist.push(-amt*eff*40);
    if(amt>0)S.e.fxPent=(S.e.fxPent||0)+amt*eff*26;     // bastırılan baskı birikir
    notes.push(amt>0?`${amt} mlr $ döviz satışı`:`${-amt} mlr $ döviz alımı`);}

  /* Kapasite modelde de bağlayıcı: arayüz engellese de sepete başka yoldan
     paket girerse burada elenir, kalanı sepette bekler. */
  const cap=newPkgCap();
  let started=0;
  const kept=[];
  d.policies.forEach(pl=>{
    const P=POL(pl.id);
    if(P.kind!=='wage'){
      if(started>=cap){kept.push(pl);return;}
      started++;
    }
    if(P.kind==='wage'){
      // araştırma: %1 asgari ücret → ortalama ücret %0,93; 1 yılda TÜFE +0,09 puan
      S.e.wageIdx*=(1+pl.amt*K.mwSpill/100);
      // Etki ücret-fiyat kanalından gelir (wageHist tohumlu olduğu için şoku görür).
      // K.wagePush, araştırma ölçütüne göre kalibre edildi: %1 zam → 1 yılda TÜFE +0,09 puan.
      S.e.expect+=pl.amt*0.006;
      S.e.nairu=clamp(S.e.nairu+pl.amt*0.030,6,14);      // işgücü maliyeti → istihdam baskısı
      S.e.gap=clamp(S.e.gap-pl.amt*0.012,-10,8);
      S.seg.minwage=clamp(S.seg.minwage+pl.amt*0.62,2,98);
      S.seg.retiree=clamp(S.seg.retiree+pl.amt*0.12,2,98);
      S.seg.sme=clamp(S.seg.sme-pl.amt*0.34,2,98);
      S.seg.capital=clamp(S.seg.capital-pl.amt*0.28,2,98);
      // ara zam taban geliri de yükseltir; emekli aylığı da paralel artırılır
      S.e.minWage=Math.round(S.e.minWage*(1+pl.amt/100));
      S.e.pension=Math.round(S.e.pension*(1+pl.amt*0.75/100));
      // ara zam takvim dışı olduğu için endekslemeye ek olarak biner
      // takvim dışı zam: beklenti çıpası ekstra zedelenir, sendika bir sonraki tura güçlü gelir
      S.e.expect+=pl.amt*0.004;
      S.e.credibility=clamp(S.e.credibility-pl.amt*0.12,3,97);
      S.p.unrest=clamp(S.p.unrest-pl.amt*0.35,3,99);
      S.araZamYear=S.year;
      notes.push(`Asgari ücrete %${pl.amt} ara zam → ${nf(S.e.minWage,0)} ₺`);
    }else{
      S.active.push({id:P.id,name:P.name,amt:pl.amt,dur:pl.dur,age:0});
      notes.push(`${P.name} · ayda ${pl.amt} mlr ₺ · ${pl.dur} ay`);
    }});
  if(kept.length)notes.push(`⚠ kapasite doldu — ${kept.length} paket gelecek aya kaldı`);
  if(notes.length)S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'decision',title:'Alınan kararlar',body:notes.join(' · ')});
  S.draft={policies:kept,rate:S.e.rate,api:S.e.api,zkTL:S.e.zkTL,zkFX:S.e.zkFX,comm:S.e.comm,guidance:S.e.guidance,fx:0};
}
export function applyFx(fx){
  const m={rate:1,inflation:1,expect:1,reserves:1,cds:1,credibility:1,budget:1,gap:1};
  const rate0=S.e.rate;
  Object.entries(fx).forEach(([k,v])=>{
    if(k==='vote')S.p.vote=clamp(S.p.vote+v,3,84);
    else if(k==='integrity')S.p.integrity=clamp(S.p.integrity+v,2,98);
    else if(k==='supply')S.e.supplyStock+=v;
    else if(k.startsWith('seg')){const key=k.slice(3).toLowerCase(); if(S.seg[key]!=null)S.seg[key]=clamp(S.seg[key]+v,2,98);}
    else if(k==='usdtry'){S.e.usdtry=clamp(S.e.usdtry*(1+v/100),8,900);S.e.fxHist.push(v);}
    else if(k==='unrest')S.p.unrest=clamp(S.p.unrest+v,2,98);
    else if(k==='morale')S.p.morale=clamp(S.p.morale+v,2,98);
    else if(k==='suspicion'){if(S.me)S.me.suspicion=clamp(S.me.suspicion+v,0,100);}
    else if(m[k])S.e[k]+=v;});
  /* sepetteki faiz tercihi korunur: yürürlükteki faiz değiştiyse taslak aynı
     kadar kayar, değişmediyse oyuncunun ayarına hiç dokunulmaz. */
  if(S.draft){const dr=S.e.rate-rate0; if(dr)S.draft.rate=clamp(S.draft.rate+dr,0,70);}
}
export const save=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}};
export const load=()=>{try{return JSON.parse(localStorage.getItem(SAVE_KEY));}catch(e){return null;}};
