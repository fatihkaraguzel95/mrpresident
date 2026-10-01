import {$, MSHORT, S, clamp, nf, noise, pct, rnd} from '../core/state.js';
import {chan} from '../data/mega.js';
import {POL} from '../data/policies.js';
import {save} from './commit.js';
import {modal, showChoice} from '../ui/modal.js';
import {bar} from '../ui/panels.js';
import {renderAll, renderTop} from '../ui/speech.js';

/* ═══════════════════════════════════════════════════════════════
   BAŞKANIN KASASI — kişisel servet, yatırımlar ve gölge işler
   Tasarım ilkesi: kirli hamleler HIZLI ve GÜÇLÜ, ama üç bedeli var —
   şüphe birikir, kurumsal güven erir, yakalanırsan her şeyi kaybedersin.
   Temiz yoldan da para kazanılabilir; ama enflasyonu yönetemezsen
   kendi birikimin de erir. Bu kasıtlı: politikanı cebinde hissedersin.
   ═══════════════════════════════════════════════════════════════ */
export const SALARY0=150000;                       // aylık başkanlık maaşı (ücret endeksiyle artar)
export const money=v=>{
  const a=Math.abs(v);
  if(a>=1e9)return (v<0?'−':'')+nf(a/1e9,2)+' mlr ₺';
  if(a>=1e6)return (v<0?'−':'')+nf(a/1e6,2)+' mn ₺';
  if(a>=1e3)return (v<0?'−':'')+nf(a/1e3,0)+' bin ₺';
  return (v<0?'−':'')+nf(a,0)+' ₺';};
export const pubInflation=()=>clamp(S.e.inflation+(S.e.pubBias||0),0.2,400);
export function mediaDamp(){
  if(!S||!S.me)return 0;
  if(S.me.schemes.some(x=>x.id==='capture'))return 1;
  if(S.me.schemes.some(x=>x.id==='media'))return .6;
  return 0;}
export const netWorth=()=>{const m=S.me;return m.cash+m.tl+m.usd+m.gold+m.stock;};
/* ── gölge işlerin fiyatı sabit değil ──
   Rüşvetin de bir piyasası var: fiyatlar TÜFE ile taşınır, dövize bağlı
   kalemler (offshore yapı, fon, arsa) kurla birlikte zıplar, üstündeki şüphe
   arttıkça aracılar risk primi ister. Kurumlar çürüdükçe (şeffaflık düşük)
   iş ucuzlar — temiz bir sistemde satın alınacak adam bulmak pahalıdır. */
export function schIdx(D){
  const w=D.fxw||0;
  const cpi=Math.pow(S.e.pidx/100,1-w);
  const fx =Math.pow(S.e.usdtry/42.10,w);
  const risk=1
    +(S.me?S.me.suspicion:0)/100*0.55                     // üstü kızgınsa aracı risk primi ister
    +clamp((S.p.integrity-55)/100,-0.35,0.45)*0.90;       // temiz sistem pahalı, çürük sistem ucuz
  return cpi*fx*Math.max(0.55,risk);
}
export const schCost=D=>Math.round(D.cost*schIdx(D));
export const schMin =D=>Math.round(D.min *schIdx(D));
export const insureLvl=()=>clamp(chan('insure')*16,0,0.65);   // afet/şok sigortası

/* ── temiz yatırım araçları ── */
export const INVEST=[
 {k:'tl',  n:'Vadeli mevduat', ic:'🏦', d:s=>{const net=s.e.rate*0.88*0.825;
   return `Net mevduat ${pct(net)} (banka marjı + stopaj sonrası) · reel ${pct(net-s.e.expect)}`;}},
 {k:'usd', n:'Döviz',          ic:'💵', d:s=>`Kur ${nf(s.e.usdtry,2)} — lira değer kaybederse kazanırsın`},
 {k:'gold',n:'Altın',          ic:'🪙', d:s=>`Dolar cinsi fiyatlanır — kur yükselirse kazandırır`},
 {k:'stock',n:'Borsa',         ic:'📈', d:s=>`Büyüme ve güvenilirlikle yükselir, enflasyonla ezilir`}
];

/* ── gölge işler ──
   cost: tek seferlik ödeme (kendi cebinden)  ·  min: gereken servet
   sus : şüphe artışı  ·  mo: kaç ay sürer (0 = anlık)            */
export const SCHEMES=[
 {id:'poll',ic:'📊',n:'Anket firmasına ödeme',min:300000,cost:240000,fxw:0.1,sus:5,mo:6,
  d:'Kamuoyuna şişirilmiş anket servis edilir. Gerçek oyun değişmez — ama sen de yanlış rakamı görürsün.',
  warn:'Ekranındaki oy potansiyeli artık gerçeği göstermez.'},
 {id:'press',ic:'📰',n:'Lehte basın fonlaması',min:900000,cost:650000,fxw:0.15,sus:9,mo:8,
  d:'Yandaş yayın organlarına reklam bütçesi aktarılır. Gündem senin lehine kurulur.',
  warn:'Oy potansiyeline aylık +0,18 puan.'},
 {id:'tender',ic:'🧱',n:'İhaleden pay al',min:1.8e+06,cost:1.3e+06,fxw:0.05,sus:4,mo:0,ongoing:true,
  d:'Yürürlükteki kamu paketlerinden komisyon akar. Ne kadar çok harcarsan o kadar çok kazanırsın.',
  warn:'Aylık gelir aktif paket ödeneğine bağlıdır. Şüphe her ay birikir.'},
 {id:'land',ic:'🗺️',n:'İmar öncesi arazi al',min:4.5e+06,cost:3.2e+06,fxw:0.3,sus:13,mo:9,
  d:'İmara açılacak bölgeden arsa toplanır. Konut veya altyapı paketi yürürlükteyse değer patlar.',
  warn:'9 ay sonra ödeme yapar. İlgili paket yoksa zarar edersin.'},
 {id:'fund',ic:'💹',n:'Manipüle fona gir',min:9e+06,cost:6.5e+06,fxw:0.35,sus:15,mo:2,
  d:'Faiz kararını önceden bilen bir fona girilir. Gelecek ay faizi indirirsen fon uçar.',
  warn:'Faizi indirirsen +%190, indirmezsen −%45.'},
 {id:'media',ic:'📡',n:'Medyaya baskı uygula',min:2.2e+07,cost:1.5e+07,fxw:0.25,sus:22,mo:12,
  d:'Muhalif yayıncılara vergi incelemesi ve reklam ambargosu. Kötü haber halka ulaşmaz.',
  warn:'Toplumsal tepki bastırılır · şeffaflık −12 · basın toplantısı hasarı yarıya iner.'},
 {id:'tuik',ic:'📉',n:'TÜİK verilerini manipüle et',min:4.5e+07,cost:3e+07,fxw:0.1,sus:28,mo:0,
  d:'Yayımlanan enflasyon olduğundan düşük açıklanır. Halk rakamı görür, market fiyatını da görür.',
  warn:'Yayımlanan enflasyon −6 puan. Sapma her ay %7 aşınır; sokak gerçeği göstermeye devam eder.'},
 {id:'offshore',ic:'🏝️',n:'Offshore yapı kur',min:9e+07,cost:3.6e+07,fxw:0.85,sus:6,mo:0,perm:true,
  d:'Varlıklar denizaşırı bir yapıya taşınır. İz sürmek zorlaşır.',
  warn:'Şüphe aylık aşınması 3 katına çıkar. Kalıcı.'},
 {id:'capture',ic:'🏢',n:'Medya grubu satın al',min:2.6e+08,cost:1.8e+08,fxw:0.45,sus:30,mo:0,perm:true,
  d:'Bir yayın grubu havuza katılır. Artık gündemi tamamen sen kurarsın.',
  warn:'Toplumsal tepki kalıcı bastırılır · şeffaflık −20 · oy tabanına zemin.'}
];
export const SCH=id=>SCHEMES.find(x=>x.id===id);

/* ── aylık kasa işlemleri ── */
export function vaultMonth(fxC){
  const m=S.me,e=S.e;
  if(!m)return;
  m.lastNet=netWorth();
  // maaş: artık otomatik endekslenmez — her ocak sen karar verirsin
  if(!m.salary)m.salary=SALARY0;
  m.cash+=m.salary;
  // portföy değerlemesi
  /* Mevduat politika faizini ALMAZ: banka marjı + stopaj düşer. Enflasyon
     yüksekken reel getiri negatiftir — parayı faize koyup katlayamazsın. */
  const depo=e.rate*0.88*0.825;
  m.tl*=(1+depo/100/12);
  m.usd*=(1+fxC/100);
  // altın dolar cinsi fiyatlanır: kur geçişi ağır basar, üstüne küçük küresel trend
  m.gold*=(1+fxC/100*0.86+0.0018+noise(0.020));
  m.stock*=(1+(e.growth+e.credibility/8-e.inflation/3)/100/12+noise(0.035));
  // gölge işler
  m.heat=0; m.income=0;
  const done=[];
  m.schemes.forEach(sc=>{
    const D=SCH(sc.id);
    if(sc.id==='tender'){
      const inc=S.active.reduce((a,x)=>a+(POL(x.id).kind==='save'?0:x.amt),0)*1e9*0.00022;
      m.cash+=inc; m.income+=inc; m.heat+=0.9;
    }
    if(sc.id==='press'){S.p.vote=clamp(S.p.vote+0.18,3,84);m.heat+=0.35;}
    if(sc.id==='media')m.heat+=0.5;
    if(sc.left!=null){sc.left--; if(sc.left<=0)done.push(sc);}
  });
  done.forEach(sc=>{
    if(sc.id==='land'){
      const hot=S.active.some(a=>['housing','urban','rail','industry'].includes(a.id));
      const mult=hot?(4.2+rnd()*2.6):(0.55+rnd()*0.35);
      const pay=sc.stake*mult; m.cash+=pay;
      S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'event',title:'Arazi satışı tamamlandı',
        body:hot?`İmar açıldı — ${money(pay)} tahsil edildi.`:`İmar çıkmadı — ${money(pay)} ile zararına satıldı.`});
    }
    if(sc.id==='fund'){
      const cut=(S.e.rate<sc.rate0-0.2);
      const pay=sc.stake*(cut?2.90:0.55); m.cash+=pay;
      S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'event',title:'Fon pozisyonu kapandı',
        body:cut?`Faiz indirimi fiyatlandı — ${money(pay)}.`:`Beklenen indirim gelmedi — ${money(pay)}.`});
    }
    if(sc.id==='poll')m.fakePoll=0;
  });
  m.schemes=m.schemes.filter(sc=>!done.includes(sc));
  // şüphe
  const decay=m.schemes.some(x=>x.id==='offshore')?1.5:0.5;
  m.suspicion=clamp(m.suspicion+m.heat-decay,0,100);
  // soruşturma riski
  const risk=m.suspicion/100*0.055*(1-mediaDamp()*0.45)*(S.p.integrity<45?1.4:1);
  if(!m.exposed&&m.suspicion>18&&rnd()<risk)m.probe=true;
}

/* ── şema satın alma ── */
export function buyScheme(id){
  const D=SCH(id),m=S.me;
  const cost=schCost(D);
  if(m.cash<cost||netWorth()<schMin(D))return;
  if(m.schemes.some(x=>x.id===id)&&!D.ongoing)return;
  m.cash-=cost;
  m.suspicion=clamp(m.suspicion+D.sus,0,100);
  const sc={id,stake:cost};
  if(D.mo>0)sc.left=D.mo;
  if(id==='fund')sc.rate0=S.draft.rate;
  if(id==='tuik'){S.e.pubBias=(S.e.pubBias||0)-6;}
  if(id==='poll'){m.fakePoll=3.0+rnd()*1.5;}
  if(id==='media'){S.p.integrity=clamp(S.p.integrity-12,2,98);}
  if(id==='capture'){S.p.integrity=clamp(S.p.integrity-20,2,98);}
  if(D.perm||D.ongoing||D.mo>0)m.schemes.push(sc);
  S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'event',title:'⚠ '+D.n,
    body:`${money(cost)} kişisel hesaptan ödendi. Şüphe +${D.sus}.`});
  renderAll();save();
}
export function moveMoney(k,amt){
  const m=S.me;
  if(amt>0){if(m.cash<amt)return; m.cash-=amt; m[k]+=amt;}
  else{const a=Math.min(-amt,m[k]); m[k]-=a; m.cash+=a;}
  renderVault();renderTop();save();
}

/* ── soruşturma olayı ── */
export function probeEvent(done){
  const m=S.me,loss=Math.round(netWorth()*0.55);
  showChoice({ico:'🚨',kicker:'Soruşturma',title:'Mal varlığın hakkında inceleme başlatıldı',
    lede:`Bir savcı, kişisel hesabındaki hareketlerin kaynağını soruyor. Şüphe düzeyi ${nf(m.suspicion,0)}/100. `
        +`Şu an ${money(netWorth())} servetin var ve gazeteler konuyu manşete taşımak üzere.`,
    kind:'event',
    opts:[
      {t:'Yargıya bırak, hesabı dondur.',note:`Servetinin ~%55'ini kaybedersin · şeffaflık ↑ · şüphe sıfırlanır`,
       fx:{},probe:'legal'},
      {t:'Savcıyı görevden aldır, dosyayı kapat.',note:'Para kalır · şeffaflık çöker · risk primi fırlar · şüphe kalıcılaşır',
       fx:{},probe:'block'},
      {t:'Kamuoyuna çık, "iftira" de ve sessizce geri öde.',note:`${money(Math.round(netWorth()*0.22))} gider · şüphe yarılanır`,
       fx:{},probe:'settle'}
    ]},()=>{done&&done();});
}
export function applyProbe(kind){
  const m=S.me;
  if(kind==='legal'){
    const take=0.55;
    ['cash','tl','usd','gold','stock'].forEach(k=>m[k]=Math.round(m[k]*(1-take)));
    m.suspicion=0; S.p.integrity=clamp(S.p.integrity+14,2,98);
    S.e.credibility=clamp(S.e.credibility+5,3,97); S.p.vote=clamp(S.p.vote-1.2,3,84);
    S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'event',title:'Soruşturma: yargı işledi',
      body:'Servetin yarısından fazlası dondu, kurumsal güven onarıldı.'});
  }else if(kind==='block'){
    m.suspicion=clamp(m.suspicion+10,0,100);
    S.p.integrity=clamp(S.p.integrity-22,2,98);
    S.e.credibility=clamp(S.e.credibility-9,3,97);
    S.e.cds=clamp(S.e.cds+55,80,1500); S.p.vote=clamp(S.p.vote+0.4,3,84);
    S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'event',title:'Soruşturma: dosya kapatıldı',
      body:'Para kaldı ama piyasa ve kamuoyu not etti.'});
  }else{
    const take=0.22;
    ['cash','tl','usd','gold','stock'].forEach(k=>m[k]=Math.round(m[k]*(1-take)));
    m.suspicion=clamp(m.suspicion*0.5,0,100);
    S.p.integrity=clamp(S.p.integrity-4,2,98); S.e.credibility=clamp(S.e.credibility-2,3,97);
    S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'event',title:'Soruşturma: sessizce kapandı',
      body:'Bir kısmı geri ödendi, gündem değişti.'});
  }
  S.me.probe=false;renderAll();save();
}

/* ── kasa arayüzü (sağ alt panel) ── */
export let vaultTab='inv';
export function renderVault(){
  const host=$('#vaultBody'); if(!host||!S.me)return;
  const m=S.me,e=S.e,nw=netWorth();
  const susCol=m.suspicion>60?'var(--red)':m.suspicion>30?'#A9660B':'var(--green)';
  const r=$('#vaultR'); if(r)r.textContent=money(nw);
  const inv=INVEST.map(I=>`<div class="vrow">
      <span class="vic">${I.ic}</span>
      <span><b>${I.n}</b><small>${I.d(S)}</small></span>
      <span class="vval">${money(m[I.k])}</span>
      <span class="row" style="gap:3px">
        <button class="pbtn s3" data-inv="${I.k}" data-a="-1">çek</button>
        <button class="pbtn s3 num" data-inv="${I.k}" data-a="0.25">%25</button>
        <button class="pbtn s3 num" data-inv="${I.k}" data-a="1">tümü</button>
      </span></div>`).join('');
  const sch=SCHEMES.map(D=>{
    const owned=m.schemes.find(x=>x.id===D.id);
    const cost=schCost(D), need=schMin(D);
    const lock=nw<need, poor=m.cash<cost;
    const st=owned?(owned.left!=null?`${owned.left} ay`:'aktif'):'';
    return `<div class="srow ${owned?'own':''} ${lock?'lock':''}">
      <span class="vic">${D.ic}</span>
      <span><b>${D.n}</b><small>${D.d}</small><small class="warn2">⚠ ${D.warn}</small></span>
      <span style="text-align:right"><b class="m red">${money(cost)}</b>
        <small class="mut">şüphe +${D.sus} · servet ${money(need)}</small></span>
      <span>${owned&&!D.ongoing?`<span class="pbtn s3" style="cursor:default;box-shadow:none">${st}</span>`
        :`<button class="pbtn s3 ${lock||poor?'':'dang'}" data-sch="${D.id}" ${lock||poor?'disabled':''}>${
           lock?'servet az':poor?'nakit yok':'YAP'}</button>`}</span></div>`;}).join('');
  host.innerHTML=`
    <div class="vhead">
      <div><span>Servet</span><b class="m">${money(nw)}</b></div>
      <div><span>Nakit</span><b class="m">${money(m.cash)}</b></div>
      <div><span>Şüphe</span><b class="m" style="color:${susCol}">${nf(m.suspicion,0)}</b>
        <div class="bar mini"><i style="width:${m.suspicion}%;background:${susCol}"></i></div>
        <small>${m.heat>0?`bu ay +${nf(m.heat,1)} · `:''}ayda −${nf(m.schemes.some(x=>x.id==='offshore')?1.5:0.5,1)} erir</small></div>
    </div>
    <div class="hint" style="margin:-2px 0 6px">Şüphe kendiliğinden yavaş erir. Hızlı düşürmenin yolu sağdaki
      <b>Başkanın Açıklaması</b> panelidir — gündemi değiştirirsin; "hesap verebilirlik" sözü ise şüpheyi
      gerçekten temizler, bedeli oydur.</div>
    ${m.fakePoll?`<div class="vnote">📊 Anket manipüle — ekrandaki oy ${nf(m.fakePoll,1)} puan şişik.</div>`:''}
    ${(e.pubBias||0)<-0.5?`<div class="vnote">📉 Yayımlanan enflasyon gerçeğin ${nf(-e.pubBias,1)} puan altında.</div>`:''}
    <div class="row" style="gap:5px;margin:6px 0 5px">
      <button class="pbtn sm ${vaultTab==='inv'?'on':''}" data-vt="inv">YATIRIM</button>
      <button class="pbtn sm ${vaultTab==='sch'?'on':''}" data-vt="sch">GÖLGE İŞLER</button>
      <span class="hint" style="margin-left:auto">maaş ${money(m.salary||SALARY0)}/ay</span>
    </div>
    <div class="vlist">${vaultTab==='inv'?inv:sch}</div>
    ${vaultTab==='sch'?`<div class="note">Yakalanırsan servetinin yarısından fazlasını kaybedersin.</div>`:''}`;
  host.onclick=ev=>{
    const vt=ev.target.closest('[data-vt]'),iv=ev.target.closest('[data-inv]'),sc=ev.target.closest('[data-sch]');
    if(vt){vaultTab=vt.dataset.vt;renderVault();return;}
    if(iv){const k=iv.dataset.inv,a=parseFloat(iv.dataset.a);
      if(a<0)moveMoney(k,-S.me[k]); else moveMoney(k,Math.floor(S.me.cash*a)); return;}
    if(sc&&!sc.disabled)buyScheme(sc.dataset.sch);};
}
export const showVault=()=>{const el=$('#vaultBody');if(el){el.scrollIntoView({behavior:'smooth',block:'center'});
  el.parentElement.style.outline='3px solid var(--orange)';
  setTimeout(()=>el.parentElement.style.outline='',900);}};
