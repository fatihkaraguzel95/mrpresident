import {$, K, MSHORT, S, SAVE_KEY, clamp, nf, pct} from '../core/state.js';
import {newPkgCap} from '../data/mega.js';
import {POL} from '../data/policies.js';
import {commName, guidName} from './economy.js';
import {logAct} from './acts.js';
import {ADVISORS} from '../data/cast.js';

/* ═══════════════ KARARLARIN UYGULANMASI ═══════════════ */
/* Basın her kararı bir yere oturtur: doğru zamanda atılmış adım övgü,
   yanlış zamanda atılmış aynı adım eleştiri alır. Hüküm o anki tabloya
   bakarak verilir — enflasyon, reel faiz, rezerv ve bütçe. */
export function commitDraft(){
  const d=S.draft,notes=[];
  const e0={inf:S.e.inflation,real:S.e.rate-S.e.expect,res:S.e.reserves,cred:S.e.credibility};
  // ileri yönlendirme sözünü çiğnedin mi?
  if(S.e.guidance==='tight'&&d.rate<S.e.rate-0.1){
    S.e.guidancePledge={broken:true};
    notes.push('⚠ "Sıkı duruş" sözüne rağmen faiz indirildi');
    logAct({ico:'⚠',k:'GÜVENİLİRLİK',w:93,good:false,t:'Verilen söz çiğnendi',
      s:'"Sıkı duruş" taahhüdüne rağmen faiz indirildi',
      h:'KURUL KENDİ SÖZÜNÜ ÇİĞNEDİ',
      ps:'"Gerektiği kadar sıkı" diyen kurul, bir ay sonra faizi indirdi. Piyasa artık taahhütleri fiyatlamıyor.'});
  }
  if(S.e.guidance==='loose'&&d.rate>S.e.rate+0.1){
    S.e.guidancePledge={broken:true};
    notes.push('⚠ "Gevşeme" sinyaline rağmen faiz artırıldı');
    logAct({ico:'⚠',k:'GÜVENİLİRLİK',w:88,good:false,t:'Verilen söz çiğnendi',
      s:'"Gevşeme" sinyaline rağmen faiz artırıldı',
      h:'SİNYAL BİR YANA, KARAR BİR YANA',
      ps:'Gevşeme sinyali veren kurul faizi artırdı. Yatırımcı "yönlendirmenin anlamı kalmadı" diyor.'});
  }
  if(Math.abs(d.rate-S.e.rate)>=.05){
    const dr=d.rate-S.e.rate;
    notes.push(`Politika faizi ${pct(S.e.rate)} → ${pct(d.rate)}`);
    /* Sıkılaştırma, reel faiz negatifken ya da enflasyon yüksekken alkış alır;
       zaten sıkıyken yapılan ek artış "ekonomiyi boğuyor" diye yazılır. */
    const iyi=dr>0?(e0.real<2||e0.inf>25):(e0.real>6&&e0.inf<22);
    logAct({ico:dr>0?'📈':'📉',k:'PARA POLİTİKASI',w:dr>0?62:66,good:iyi,
      t:`Politika faizi ${pct(e0.real+S.e.expect)} → ${pct(d.rate)}`,
      s:`${dr>0?'+':''}${nf(dr,2)} puan · reel faiz ${pct(d.rate-S.e.expect)}`,
      h:dr>0?(iyi?'MERKEZ BANKASI FRENE BASTI':'FAİZ ŞOKU: SANAYİ "BU EKONOMİYİ BOĞAR" DİYOR')
            :(iyi?'FAİZ İNDİRİMİ: "DİSENFLASYONUN MEYVESİ"':'FAİZ İNDİRİLDİ, PİYASA TEDİRGİN'),
      ps:dr>0
        ?(iyi?`Politika faizi ${pct(d.rate)}'e çekildi. Ekonomistler "gecikmiş ama doğru" yorumunu yaptı.`
             :`Faiz ${pct(d.rate)}. Reel faiz zaten ${pct(e0.real)} iken gelen artış kredi kanalını kilitledi.`)
        :(iyi?`Faiz ${pct(d.rate)}'e indirildi. Enflasyon ${pct(e0.inf)} seviyesinde; piyasa adımı "ölçülü" buldu.`
             :`Faiz ${pct(d.rate)}'e indirildi. Enflasyon ${pct(e0.inf)} iken gelen indirim beklentileri bozdu.`)});
    S.e.rate=d.rate;}
  if(d.api!==S.e.api){
    const da=d.api-S.e.api;
    notes.push(`APİ fonlaması ${nf(S.e.api,0)} → ${nf(d.api,0)} mlr ₺`);
    const iyi=da>0?e0.inf<18:e0.inf>22;      // bol likidite ancak enflasyon düşükken iyi karşılanır
    logAct({ico:'🏦',k:'FİNANS',w:34,good:iyi,
      t:`APİ fonlaması ${nf(d.api,0)} mlr ₺`,s:`yürürlükteki ${nf(S.e.api,0)} mlr ₺'den ${da>0?'+':''}${nf(da,0)}`,
      h:da>0?'MERKEZ BANKASI MUSLUĞU AÇTI':'FONLAMA KISILDI, PİYASADA LİKİDİTE DARALDI',
      ps:da>0?`Haftalık fonlama ${nf(d.api,0)} milyar ₺'ye çıktı. ${iyi?'Bankalar "nefes aldık" diyor.':'"Faizi yükseltip arka kapıdan gevşetmek" eleştirisi büyüyor.'}`
             :`Fonlama ${nf(d.api,0)} milyar ₺'ye indi. ${iyi?'Duruşun tutarlılığı piyasada olumlu karşılandı.':'KOBİ’ler kredi bulmakta zorlanacağını söylüyor.'}`});
    S.e.api=d.api;}
  if(d.zkTL!==S.e.zkTL){
    const dz=d.zkTL-S.e.zkTL;
    notes.push(`TL zorunlu karşılık ${pct(S.e.zkTL,0)} → ${pct(d.zkTL,0)}`);
    logAct({ico:'🧮',k:'FİNANS',w:26,good:dz>0?e0.inf>22:e0.inf<18,
      t:`TL zorunlu karşılık ${pct(d.zkTL,0)}`,s:`${dz>0?'+':''}${nf(dz,0)} puan`,
      h:dz>0?'ZORUNLU KARŞILIK ARTTI: KREDİYE EK FREN':'ZORUNLU KARŞILIK İNDİRİLDİ',
      ps:`TL zorunlu karşılık oranı ${pct(d.zkTL,0)}'e ${dz>0?'çıkarıldı':'indirildi'}. Bankacılık sektörü etkiyi hesaplıyor.`});
    S.e.zkTL=d.zkTL;}
  if(d.zkFX!==S.e.zkFX){
    const dz=d.zkFX-S.e.zkFX;
    notes.push(`YP zorunlu karşılık ${pct(S.e.zkFX,0)} → ${pct(d.zkFX,0)}`);
    logAct({ico:'🧮',k:'FİNANS',w:24,good:dz>0?S.e.dollarization>45:S.e.dollarization<35,
      t:`YP zorunlu karşılık ${pct(d.zkFX,0)}`,s:`${dz>0?'+':''}${nf(dz,0)} puan`,
      h:dz>0?'DÖVİZ MEVDUATINA EK KARŞILIK':'YP KARŞILIK ORANI GEVŞETİLDİ',
      ps:`Döviz mevduatında karşılık ${pct(d.zkFX,0)}. Lirasızlaşma tartışması yeniden masada.`});
    S.e.zkFX=d.zkFX;}
  if(d.comm!==S.e.comm){
    const sert=d.comm==='hawkish';
    notes.push('İletişim: '+commName(d.comm));
    logAct({ico:'🗣',k:'PARA POLİTİKASI',w:22,good:sert?e0.inf>20:e0.inf<16,
      t:`İletişim duruşu: ${commName(d.comm)}`,s:`önceki duruş ${commName(S.e.comm)}`,
      h:sert?'KURULDAN SERT MESAJ':d.comm==='dovish'?'KURULUN DİLİ YUMUŞADI':'KURUL TEMKİNLİ DİLE DÖNDÜ',
      ps:`Kurul metninde ton ${commName(d.comm).toLocaleLowerCase('tr')}. Analistler her kelimeyi tartıyor.`});
    S.e.comm=d.comm;}
  if(d.guidance!==S.e.guidance){
    notes.push('Yönlendirme: '+guidName(d.guidance));
    logAct({ico:'🧭',k:'PARA POLİTİKASI',w:28,good:d.guidance==='tight'?e0.inf>20:d.guidance==='loose'?e0.inf<16:null,
      t:`İleri yönlendirme: ${guidName(d.guidance)}`,s:`önceki ${guidName(S.e.guidance)}`,
      h:d.guidance==='tight'?'KURUL SÖZ VERDİ: "GEREKTİĞİ KADAR SIKI"'
        :d.guidance==='loose'?'KURULDAN GEVŞEME SİNYALİ':'KURUL ELİNİ SERBEST BIRAKTI',
      ps:d.guidance==='none'?'Kurul bağlayıcı bir taahhütte bulunmadı; piyasa "her toplantı canlı" diyor.'
        :`Kurul önümüzdeki dönem için ${guidName(d.guidance).toLocaleLowerCase('tr')} taahhüdü verdi. Söz tutulmazsa faturası ağır olacak.`});
    S.e.guidance=d.guidance;}
  if(d.fx){const amt=d.fx;
    /* Müdahalenin gücü güvenilirliğe ve elde kalan mermiye bağlı.
       Güven yoksa piyasa satılan dövizi anında geri alır; bastırılan
       kur baskısı da kaybolmaz, sonraki aylara sarkar. */
    const eff=0.004*(0.30+S.e.credibility/150)*clamp(S.e.reserves/90,0.25,1.15);
    if(amt>0)S.fxSold=(S.fxSold||0)+amt;        // "rezerv harcamayacağız" sözü için
    S.e.reserves=clamp(S.e.reserves-Math.abs(amt),5,400);
    S.e.usdtry=clamp(S.e.usdtry*(1-amt*eff),8,900);
    S.e.fxHist.push(-amt*eff*40);
    if(amt>0)S.e.fxPent=(S.e.fxPent||0)+amt*eff*26;     // bastırılan baskı birikir
    notes.push(amt>0?`${amt} mlr $ döviz satışı`:`${-amt} mlr $ döviz alımı`);
    /* Satış kısa vadede kuru tutar ama rezerv eriyorsa basın bunu
       "mermiyi harcamak" diye yazar; güven yoksa zaten işe yaramaz. */
    const iyi=amt>0?(e0.res>90&&e0.cred>45):true;
    logAct({ico:'💵',k:'PİYASA',w:amt>0?58:30,good:iyi,
      t:amt>0?`${amt} mlr $ döviz satıldı`:`${-amt} mlr $ döviz alındı`,
      s:`rezerv ${nf(e0.res,0)} → ${nf(S.e.reserves,0)} mlr $ · kur ${nf(S.e.usdtry,2)}`,
      h:amt>0?(iyi?'MERKEZ BANKASI KURA MÜDAHALE ETTİ':'REZERVLER ERİYOR: "MERMİ BİTİYOR"')
             :'MERKEZ BANKASI REZERV BİRİKTİRİYOR',
      ps:amt>0
        ?(iyi?`Piyasaya ${amt} milyar dolar verildi, kur ${nf(S.e.usdtry,2)} seviyesine çekildi.`
             :`${amt} milyar dolar satıldı; brüt rezerv ${nf(S.e.reserves,0)} milyar dolara indi. Ekonomistler "bastırılan baskı geri gelir" diyor.`)
        :`${-amt} milyar dolar alındı. Rezerv tamponu güçleniyor, kısa vadede kura yukarı baskı var.`});}

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
      logAct({ico:'🧾',k:'ÇALIŞMA HAYATI',w:74,good:e0.inf<25,
        t:`Asgari ücrete %${pl.amt} ara zam`,s:`yeni taban ${nf(S.e.minWage,0)} ₺ · en düşük aylık ${nf(S.e.pension,0)} ₺`,
        h:e0.inf<25?'ARA ZAM GELDİ: TABAN ÜCRET YÜKSELDİ':'ARA ZAM: "CEBE GİRİYOR, ETİKETE ÇIKIYOR"',
        ps:`Asgari ücret ${nf(S.e.minWage,0)} ₺ oldu. ${e0.inf<25
          ?'Sendikalar kararı "geç ama yerinde" diye karşıladı.'
          :`Enflasyon ${pct(e0.inf)} iken yapılan takvim dışı zam, beklentileri yeniden kurdu; esnaf maliyet artışından şikâyetçi.`}`});
    }else{
      if(S.active.some(a=>a.id===P.id))return;        // aynı paket iki kez yürümez
      S.active.push({id:P.id,name:P.name,amt:pl.amt,dur:pl.dur,age:0});
      notes.push(`${P.name} · ayda ${pl.amt} mlr ₺ · ${pl.dur} ay`);
      /* Soruşturma yürürlüğe girdiği ay kabinedeki yalancıyı açığa çıkarır. */
      if(P.id==='feto'&&!S.liarOut&&S.liar){
        S.liarOut=true;
        const A=ADVISORS.find(x=>x.id===S.liar);
        const ad=A?((S.cab&&S.cab[S.liar]&&S.cab[S.liar].name)||A.name):'bir bakan';
        const gorev=A?A.role:'kabine';
        notes.push(`🕵 Soruşturma: ${gorev} yanlış veri sunuyormuş`);
        logAct({ico:'🕵',k:'KABİNE',w:92,good:true,
          t:`Yalancı ortaya çıktı: ${gorev}`,
          s:`${ad} göreve geldiğinden beri tabloyu tersine raporluyormuş`,
          h:'SORUŞTURMA KABİNEDEN ÇIKTI',
          ps:`Arşiv taraması, ${gorev} biriminden Başkanlığa sunulan verilerin sistematik biçimde `
            +`çarpıtıldığını ortaya koydu. ${ad} hakkında idari soruşturma başlatıldı; `
            +`görevde kalıp kalmayacağına Başkan karar verecek.`});
      }
      const bedava=P.kind==='reg';
      logAct({ico:P.ico,k:bedava?'DÜZENLEME':'BÜTÇE',w:48,good:bedava?true:(e0.inf<28&&S.e.budget>-7),
        t:P.name,s:bedava?`bütçesiz düzenleme · ${pl.dur} ay`
          :`ayda ${nf(pl.amt,0)} mlr ₺ × ${pl.dur} ay · toplam ${nf(pl.amt*pl.dur/1000,2)} trl ₺`,
        h:`${P.name.toLocaleUpperCase('tr')} YÜRÜRLÜKTE`,
        ps:bedava?`${P.name} bütçeye yük bindirmeden devreye girdi; etkisi kademeli görülecek.`
          :`${P.name} için aylık ${nf(pl.amt,0)} milyar ₺ ayrıldı. ${e0.inf<28&&S.e.budget>-7
            ?'Kaynak var, program zamanında geldi.'
            :`Enflasyon ${pct(e0.inf)}, bütçe açığı ${pct(-S.e.budget)} iken açılan kalem "nereden finanse edilecek?" sorusunu doğurdu.`}`});
    }});
  if(kept.length){
    notes.push(`⚠ kapasite doldu — ${kept.length} paket gelecek aya kaldı`);
    logAct({ico:'⏳',k:'BÜTÇE',w:20,good:false,t:'Kapasite doldu',
      s:`${kept.length} paket gelecek aya kaldı`,
      h:'HAZİNE FREN KOYDU: PAKETLER SIRAYA GİRDİ',
      ps:`Yılın program ödeneği ve aylık paket kapasitesi dolduğu için ${kept.length} kalem gelecek aya ertelendi.`});}
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
    else if(k==='current')S.e.current=clamp(S.e.current+v,-12,6);
    else if(k==='riskShock'){if(!S.e.shock)S.e.shock={food:0,fuel:0,risk:0};S.e.shock.risk=Math.max(0,S.e.shock.risk+v);}
    else if(k==='fuelShock'){if(!S.e.shock)S.e.shock={food:0,fuel:0,risk:0};S.e.shock.fuel=Math.max(0,S.e.shock.fuel+v);}
    else if(k==='foodShock'){if(!S.e.shock)S.e.shock={food:0,fuel:0,risk:0};S.e.shock.food=Math.max(0,S.e.shock.food+v);}
    else if(m[k])S.e[k]+=v;});
  /* sepetteki faiz tercihi korunur: yürürlükteki faiz değiştiyse taslak aynı
     kadar kayar, değişmediyse oyuncunun ayarına hiç dokunulmaz. */
  if(S.draft){const dr=S.e.rate-rate0; if(dr)S.draft.rate=clamp(S.draft.rate+dr,0,70);}
}
export const save=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}};
export const load=()=>{try{return JSON.parse(localStorage.getItem(SAVE_KEY));}catch(e){return null;}};
