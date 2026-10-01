import {$, MONTHS, MSHORT, S, TERM_M, clamp, nf, pct, qOf, signed} from '../core/state.js';
import {basket, fundingGap, trn} from '../data/mega.js';
import {POL} from '../data/policies.js';
import {layGrips} from '../main.js';
import {applyFx, save} from '../sim/commit.js';
import {commName, guidName, makeNews} from '../sim/economy.js';
import {mediaDamp, money, netWorth, renderVault} from '../sim/vault.js';
import {renderCards} from './cards.js';
import {closeModal, modal} from './modal.js';
import {renderAdvisors, renderFx, renderKPI, renderMonetary, renderStats} from './panels.js';
import {renderSociety} from './society.js';
import {renderStreet} from './street.js';

/* ═══════════════ BAŞKANIN AÇIKLAMASI ═══════════════
   Söz bedava değildir. Üç mekanik açıklamayı gerçek bir karar yapar:
   1) YORULMA — aynı kalıbı her tekrarladığında etkisi 1/(1+0,55·n) kadar
      kalır; üçüncüden sonra halk ciddiye almaz, tekrar sokağı geriyor.
   2) GERÇEKLİK — rakamlar söylemi yalanlıyorsa açıklama geri teper
      (real: çarpan negatife döner).
   3) GÜNDEM — açıklama gündemi değiştirdiği için üstündeki şüpheyi
      geçici olarak düşürür; ama şüpheyi gerçekten temizleyen tek seçenek
      hesap verme sözüdür — onun da bedeli oydur.
   Ayda tek açıklama hakkın var. Medya sahipliği etkiyi büyütür.
   ═══════════════════════════════════════════════════ */
export const SPEECH=[
 {id:'dis',ico:'📣',n:'Dış güçler',
  t:'"Eyy dış mihraklar! Bu millet baskıya boyun eğmez, oyununuzu başınıza yıkarız."',
  d:'Gündemi dışarıya çevirir: taban kenetlenir, iç tartışma söner — piyasa ürker.',
  fx:{vote:1.1,unrest:-6,suspicion:-9,credibility:-3,cds:14,segMinwage:2,segRetiree:2,segCapital:-2.5}},
 {id:'cete',ico:'🧱',n:'Çetelere savaş',
  t:'"Devleti bir avuç müteahhit çetesine yedirmeyiz; her ihale millete hesap verecek."',
  d:'Yolsuzluk gündemini kendi lehine çevirir. Esnaf sever, sermaye tehdit olarak okur.',
  fx:{vote:1.0,unrest:-5,suspicion:-12,integrity:3,segSme:3,segCapital:-4,cds:8}},
 {id:'faiz',ico:'📉',n:'Faiz lobisi',
  t:'"Faiz lobisi milletin cebine göz dikti. Biz faizin değil, üretenin yanındayız."',
  d:'Tabanda karşılığı yüksek — ama beklentiyi bozar, kuru ve enflasyonu besler.',
  fx:{vote:1.2,expect:1.3,credibility:-7,usdtry:1.4,unrest:-4,suspicion:-7,segMinwage:2,segCapital:-3}},
 {id:'manevi',ico:'🕌',n:'Manevi değerler',
  t:'"Bu millet ezanına, bayrağına, ailesine ve mukaddesatına sahip çıkmıştır; çıkmaya devam edecek."',
  d:'Ekonomiyi hiç konuşmadan tabanı konsolide eder. Gençlerde karşılığı zayıf.',
  fx:{vote:1.3,unrest:-8,suspicion:-11,segRetiree:3.5,segMinwage:2,segYouth:-2.5,credibility:-1.5}},
 {id:'birlik',ico:'🇹🇷',n:'Milli birlik',
  t:'"Bayrağımızın altında hepimiz kardeşiz. Bu zor günü de birlikte aşacağız."',
  d:'Yumuşak ve kapsayıcı. Etkisi küçük ama kimseyi küstürmez, hızlı da yorulmaz.',
  fx:{vote:.5,unrest:-4,suspicion:-4,morale:2}},
 {id:'sabir',ico:'🤝',n:'Fedakârlık çağrısı',
  t:'"Bir süre daha sabır istiyorum. Programı bozmadan yürürsek meyvesini birlikte toplayacağız."',
  d:'Beklentiyi çıpalar, güvenilirliği artırır — ama sokağa "biraz daha katlanın" demektir.',
  fx:{expect:-.9,credibility:4,vote:-1.0,unrest:5,morale:-3}},
 {id:'hesap',ico:'⚖️',n:'Hesap verebilirlik',
  t:'"Her kuruşun hesabını millete vereceğiz; denetim raporları kamuya açılacak."',
  d:'Şüpheyi gerçekten temizleyen tek seçenek. Risk primi düşer, cebine giden yollar daralır.',
  fx:{integrity:7,credibility:5,suspicion:-18,cds:-14,vote:-.7}},
 {id:'zafer',ico:'🏗️',n:'Başarı turu',
  t:'"Rekor ihracat, rekor istihdam, dev projeler — tablo ortada."',
  d:'Rakamlar tutuyorsa güçlü. Tutmuyorsa halk alay eder, geri teper.',
  fx:{vote:1.0,unrest:-4,suspicion:-5,credibility:-1},
  real:s=>(s.e.inflation<22&&s.p.morale>45&&s.e.realIncome>95)?1.15:-0.8}
];
export const SP=id=>SPEECH.find(x=>x.id===id);
export const spUsed=id=>((S.sp&&S.sp.used&&S.sp.used[id])||0);
export const spDone=()=>!!(S.sp&&S.sp.month===S.t);
// etkili çarpan: yorulma × gerçeklik × medya gücü
export function spMul(P){
  const fat=1/(1+0.55*spUsed(P.id));
  const real=P.real?P.real(S):1;
  return fat*real*(1+mediaDamp()*0.5);
}
export function spFx(P){
  const mul=spMul(P),u=spUsed(P.id),fx={};
  Object.entries(P.fx).forEach(([k,v])=>{fx[k]=+(v*mul).toFixed(2);});
  if(u>=2){                                  // aynı nakaratı tekrarlamanın bedeli
    fx.unrest=+((fx.unrest||0)+1.2*(u-1)).toFixed(2);
    fx.credibility=+((fx.credibility||0)-0.4*(u-1)).toFixed(2);}
  Object.keys(fx).forEach(k=>{if(Math.abs(fx[k])<0.01)delete fx[k];});
  return fx;
}
export function renderSpeech(){
  const box=$('#spBox'); if(!box)return;
  const done=spDone();
  const r=$('#spR');
  if(r)r.textContent=done?'bu ay konuşuldu':'ayda bir açıklama hakkın var';
  box.innerHTML=SPEECH.map(P=>{
    const u=spUsed(P.id),mul=spMul(P);
    const tag=u?`×${u} · etki %${nf(Math.max(0,mul)*100,0)}`:(P.real&&P.real(S)<0?'geri teper':'yeni');
    return `<button class="sprow" data-sp="${P.id}" ${done?'disabled':''} title="${P.t.replace(/"/g,'')}">
      <span class="sp-i">${P.ico}</span>
      <span><b>${P.n}</b><small>${P.d}</small></span>
      <span class="sp-u ${mul<0?'red':u?'mut':'grn'}">${tag}</span></button>`;}).join('');
  box.onclick=ev=>{const b=ev.target.closest('[data-sp]');
    if(b&&!b.disabled)askSpeech(b.dataset.sp);};
}
export function askSpeech(id){
  const P=SP(id),fx=spFx(P),u=spUsed(id);
  const goodUp=k=>!['cds','usdtry','expect','unrest','suspicion'].includes(k);
  const L={...FXN,unrest:'Toplumsal tepki',morale:'Halkın morali',suspicion:'Üstündeki şüphe'};
  const rows=Object.entries(fx).map(([k,v])=>{
    const good=goodUp(k)?v>0:v<0;
    return `<div><span>${L[k]||k}</span><b class="${good?'grn':'red'}">${signed(v,k==='cds'?0:1)}</b></div>`;}).join('');
  const d=modal(`<div class="dlg-t"><span class="ic">${P.ico}</span>
      <div><div class="dlg-k">Başkanın açıklaması</div><h3>${P.n}</h3></div></div>
    <div class="dlg-b">
      <p class="dlg-l" style="font-size:14px;font-style:italic">${P.t}</p>
      <div class="ctl-l" style="margin:13px 0 4px">Beklenen etki${
        u?` · ${u+1}. kez — halk bu nakaratı ezberledi`:''}</div>
      <div class="comp-fx">${rows}</div>
      <div class="note">${P.d}${P.real&&P.real(S)<0
        ?' <b class="red">Şu anki rakamlar bu söylemi yalanlıyor: açıklama geri tepecek.</b>':''}</div>
    </div>
    <div class="dlg-f">
      <button class="sbtn alt" style="width:auto;padding:9px 20px;margin:0" id="spNo">VAZGEÇ</button>
      <button class="sbtn" style="width:auto;padding:9px 20px;margin:0" id="spYes">AÇIKLAMAYI YAP</button>
    </div>`);
  d.onclick=ev=>{
    if(ev.target.id==='spNo'){closeModal();return;}
    if(ev.target.id==='spYes'){closeModal();doSpeech(id);}};
}
export function doSpeech(id){
  if(spDone())return;
  const P=SP(id),fx=spFx(P);
  applyFx(fx);
  if(!S.sp)S.sp={used:{},month:-1};
  if(!S.sp.used)S.sp.used={};
  S.sp.used[id]=spUsed(id)+1;
  S.sp.month=S.t; S.sp.last=id;
  S.news.unshift(`Başkan: ${P.t.replace(/"/g,'')}`);
  S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'event',title:'Başkan konuştu',
    body:`${P.t} — oy ${signed(fx.vote||0,1)} · tepki ${signed(fx.unrest||0,1)} · şüphe ${signed(fx.suspicion||0,1)}`});
  renderAll();save();
}

export const CHARTS=[
  {k:'inflation',t:'Enflasyon',c:'#E8C547',f:v=>pct(v)},
  {k:'growth',t:'Büyüme',c:'#5BA85F',f:v=>pct(v)},
  {k:'rate',t:'Politika faizi',c:'#E8762A',f:v=>pct(v)},
  {k:'usdtry',t:'USD/₺',c:'#4A9FD8',f:v=>nf(v,2)},
  {k:'realIncome',t:'Alım gücü',c:'#68C2B0',f:v=>nf(v,0)},
  {k:'vote',t:'Oy potansiyeli',c:'#D9534F',f:v=>pct(v)}
];
export function renderCharts(){
  const H=S.hist.slice(-18);
  $('#charts').innerHTML=CHARTS.map((C,ci)=>{
    const vals=H.map(h=>h[C.k]).filter(v=>v!=null),last=vals.length?vals[vals.length-1]:0;
    let inner;
    if(vals.length<2)inner=`<div style="height:40px"></div><div class="ch-e">ilk açıklama<br>ay sonunda</div>`;
    else{
      const W=190,Hh=40,P=3;
      let mn=Math.min(...vals),mx=Math.max(...vals);
      const pd=(mx-mn)*.18||1;mn-=pd;mx+=pd;
      const X=i=>P+i*(W-P*2)/(vals.length-1),Y=v=>P+(1-(v-mn)/(mx-mn))*(Hh-P*2);
      const d=vals.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join(' ');
      inner=`<svg viewBox="0 0 ${W} ${Hh}" data-ci="${ci}" preserveAspectRatio="none">
        <line x1="${P}" y1="${(Hh/2).toFixed(1)}" x2="${W-P}" y2="${(Hh/2).toFixed(1)}" stroke="#2E2820" stroke-width="1" vector-effect="non-scaling-stroke"/>
        <path d="${d} L${X(vals.length-1).toFixed(1)} ${Hh-P} L${X(0).toFixed(1)} ${Hh-P} Z" fill="${C.c}" opacity=".13"/>
        <path d="${d}" fill="none" stroke="${C.c}" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
        <rect x="${(X(vals.length-1)-2).toFixed(1)}" y="${(Y(last)-2).toFixed(1)}" width="4" height="4" fill="${C.c}"/>
        <rect x="0" y="0" width="${W}" height="${Hh}" fill="transparent"/></svg>`;}
    return `<div class="ch"><div class="ch-h"><span class="ch-t">${C.t}</span>
      <span class="ch-v" style="color:${C.c==='#E8C547'?'#A9761A':C.c}">${vals.length?C.f(last):'—'}</span></div>
      <div class="ch-b">${inner}</div></div>`;}).join('');
  const tip=$('#chTip');
  $('#charts').querySelectorAll('svg').forEach(svg=>{
    const ci=+svg.dataset.ci,C=CHARTS[ci],vals=H.map(h=>h[C.k]);
    if(vals.length<2)return;
    svg.onmousemove=ev=>{
      const r=svg.getBoundingClientRect();
      const i=clamp(Math.round((ev.clientX-r.left)/r.width*(vals.length-1)),0,vals.length-1);
      tip.style.opacity='1';
      tip.style.left=Math.min(window.innerWidth-170,ev.clientX+12)+'px';
      tip.style.top=(ev.clientY-34)+'px';
      tip.innerHTML=`${H[i].label} · <span style="color:${C.c}">${C.t}</span> <b>${C.f(vals[i])}</b>`;};
    svg.onmouseleave=()=>{tip.style.opacity='0';};});
}
export function renderTop(){
  $('#topDate').textContent=`${MONTHS[S.month-1]} ${S.year} · ${qOf(S.month)}. Çeyrek`;
  $('#topOf').textContent=`${S.t+1}/${S.termEnd||TERM_M}. AY`+((S.term||1)>1?` · ${S.term}. DÖNEM`:'');
  const va=$('#vaultAmt'); if(va&&S.me){va.textContent=money(netWorth());
    va.parentElement.style.background=S.me.suspicion>55?'#E4A79A':S.me.suspicion>28?'#F0CE94':'#F0D9A4';}
  const rem=3-(S.t%3);
  $('#monthSub').textContent=MONTHS[S.month-1];
  $('#qSub').textContent=rem===1?'son ay':`${rem} ay birden`;
}
export function renderBasket(){
  const d=S.draft,c=[];
  if(Math.abs(d.rate-S.e.rate)>=.05)c.push(['rate',`Faiz → ${pct(d.rate)}`]);
  if(d.comm!==S.e.comm)c.push(['comm',commName(d.comm)]);
  if(d.guidance!==S.e.guidance)c.push(['guid',guidName(d.guidance)]);
  if(d.api!==S.e.api)c.push(['api',`APİ → ${nf(d.api,0)} mlr ₺`]);
  if(d.zkTL!==S.e.zkTL)c.push(['zkTL',`TL ZK → ${pct(d.zkTL,0)}`]);
  if(d.zkFX!==S.e.zkFX)c.push(['zkFX',`YP ZK → ${pct(d.zkFX,0)}`]);
  if(d.fx)c.push(['fx',d.fx>0?`${d.fx} mlr $ SAT`:`${-d.fx} mlr $ AL`]);
  d.policies.forEach(pl=>{const P=POL(pl.id);
    c.push(['pol:'+pl.id,`${P.ico} ${P.name} · ${P.kind==='wage'?'%'+pl.amt
      :P.kind==='reg'?pl.dur+' ay':pl.amt+' mlr/ay × '+pl.dur+' ay'}`]);});
  const monthly=d.policies.reduce((a,pl)=>{const P=POL(pl.id);
    return a+(P.kind==='wage'||P.kind==='reg'?0:pl.amt*(P.kind==='save'?-1:1));},0);
  const F=fundingGap(0), room=(F.ceil+F.book.pct)/100*F.book.gdp;
  const b=$('#basket');
  b.innerHTML=`<span class="bk-l">Karar sepeti${monthly?` · aylık ödenek <b class="m ${monthly>0?'red':'grn'}">${(monthly>0?'−':'+')+nf(Math.abs(monthly),0)} mlr ₺</b>`:''}`
    +`<br><small class="${F.over>0?'red':'mut'}" style="font-weight:600">Bütçe açığı ${pct(-F.book.pct)} GSYH `
    +`· finansman tavanı ${pct(F.ceil)}${F.over>0?` · <b>TAVAN AŞILDI</b>`:` · kalan alan ${trn(Math.max(0,room))}`}</small></span>
    <div class="bk-s">${c.length?c.map(([k,t])=>
      `<span class="bchip">${t}<button data-r="${k}" aria-label="Çıkar">×</button></span>`).join('')
      :`<span class="bk-e">Karar yok — ayı boş da geçebilirsin.</span>`}</div>`;
  b.onclick=ev=>{const btn=ev.target.closest('[data-r]');if(!btn)return;const k=btn.dataset.r;
    if(k==='rate')d.rate=S.e.rate;else if(k==='comm')d.comm=S.e.comm;
    else if(k==='guid')d.guidance=S.e.guidance;else if(k==='fx')d.fx=0;
    else if(k==='api'||k==='zkTL'||k==='zkFX')d[k]=S.e[k];
    else{d.policies=d.policies.filter(x=>x.id!==k.split(':')[1]);renderCards();}
    renderMonetary();renderFx();renderBasket();};
}
export function renderTicker(){
  if(!S.news.length)makeNews();
  const items=S.news.map(n=>`<span class="tk">${n}</span>`).join('');
  $('#tkTrack').innerHTML=items+items;
}
export function renderAll(){renderTop();renderStreet();renderKPI();renderStats();renderAdvisors();
  renderMonetary();renderFx();renderCards();renderSociety();renderSpeech();renderCharts();renderVault();renderBasket();renderTicker();layGrips();}
