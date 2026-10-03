import {$, S, clamp, mix, nf, pct, signed} from '../core/state.js';
import {CITIZENS} from '../data/cast.js';
import {SPR} from '../data/sprites.js';
import {renderProtest} from '../sim/protest.js';
import {bar} from './panels.js';
import {SEGM} from './society.js';
import {uiScale} from './scale.js';

/* ═══════════════ SOKAK SAHNESİ ═══════════════ */
export function moodScore(){const e=S.e;
  return clamp(46+(e.realIncome-100)*1.1-Math.max(0,e.inflation-8)*0.60
    +e.gap*2.2-Math.max(0,e.unemployment-8)*2.6-(S.p.unrest-40)*0.35,0,100);}
/* ── MEVSİM ──
   Ara-Oca-Şub kış (kar), Mar-Nis-May ilkbahar (parçalı bulutlu),
   Haz-Tem-Ağu yaz (güneşli), Eyl-Eki-Kas sonbahar (yağmurlu).
   Halkın morali gökyüzünü karartır ama mevsimi değiştirmez. */
export const seasonOf=mo=>(mo===12||mo<=2)?'kis':mo<=5?'ilkbahar':mo<=8?'yaz':'sonbahar';
export const SEASON={
  kis      :{sky:'#93A9BC', name:'Kış',       cap:'karlı'},
  ilkbahar :{sky:'#6FB2D6', name:'İlkbahar',  cap:'parçalı bulutlu'},
  yaz      :{sky:'#54B8E8', name:'Yaz',       cap:'güneşli'},
  sonbahar :{sky:'#7E93A6', name:'Sonbahar',  cap:'yağmurlu'}
};
export const SKY=[{m:0,a:'#3A3448'},{m:30,a:'#5E6878'},{m:55,a:'#5FA0C8'},{m:80,a:'#54B4E4'}];
export function skyFor(mood){
  const base=SEASON[seasonOf(S.month)].sky;
  // moral düştükçe gökyüzü kurşuniye çalar (mevsim rengi korunur)
  return mix(base,'#3A3448',clamp((55-mood)/70,0,0.55));
}
export function shutCount(){
  const g=S.e.gap,sme=S.seg.sme,cr=S.e.credit;
  let n=g<-3?3:g<-1.2?2:g<0.2?1:0;
  if(sme<34)n++; if(cr<8)n++; if(sme>62&&g>1)n=Math.max(0,n-1);
  return clamp(n,0,5);
}

export const SHOPS=[
  {n:'PETROL OFİSİ',c:'#3E5A6E',aw:'#C9433A',kind:'fuel'},{n:'FIRIN',c:'#8A6438',aw:'#D8A23C'},
  {n:'APARTMAN',c:'#6E6A5C',aw:'#8A8272',kind:'home'},{n:'KASAP',c:'#7A3A3A',aw:'#A8433C'},
  {n:'BANKA',c:'#3E4A66',aw:'#4E6C96'},{n:'TERZİ',c:'#6B4468',aw:'#8A5A86'}
];
export const RX=(x,y,w,h,f,cls,extra)=>`<rect ${cls?`class="${cls}" `:''}x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${extra||''}/>`;
export let streetBuilt=false;
export function buildStreet(){
  const sv=$('#street');let shops='';
  SHOPS.forEach((sh,i)=>{const x=6+i*79,w=72;
    if(sh.kind==='home'){
      // konut bloğu: balkonlu cepheli apartman — dükkân değil, ev
      const win=(wx,wy)=>RX(wx,wy,8,7,'#3E4A56')+RX(wx+1,wy+1,6,5,'#8FC4D8','glass');
      shops+=`<g class="shop" data-i="${i}">
        ${RX(x,14,w,10,'#4A463C')}${RX(x+1,15,w-2,8,sh.c)}
        <g class="open">
          ${RX(x,24,w,38,sh.c)}${RX(x,24,w,2,'#3A362E')}
          ${[0,1,2].map(r=>[0,1,2,3].map(cc=>win(x+7+cc*15,28+r*11)).join('')).join('')}
          ${RX(x+4,40,w-8,1,'#5A564A')}${RX(x+4,51,w-8,1,'#5A564A')}
          ${RX(x+26,52,20,10,'#4A4438')}${RX(x+29,54,14,8,'#6E6656')}
          ${RX(x+2,24,2,38,'#57534733')}
        </g>
        <g class="shut" opacity="0">
          ${RX(x,24,w,38,'#6E6A5C')}
          ${[0,1,2].map(r=>[0,1,2,3].map(cc=>RX(x+7+cc*15,28+r*11,8,7,'#2E2A24')).join('')).join('')}
        </g></g>`;
      return;}
    if(sh.kind==='fuel'){
      // akaryakıt istasyonu: kanopi + direkler + pompa + büfe
      const pump=(px0)=>
        RX(px0,45,9,17,'#D7D2C6')          // gövde
        +RX(px0,45,9,2,'#B4AEA0')
        +RX(px0+1,48,7,6,'#22313E')        // ekran
        +RX(px0+2,49,5,2,'#7FD4A8')
        +RX(px0+1,56,7,2,sh.aw)            // kırmızı bant
        +RX(px0+9,50,2,7,'#6E655A')        // hortum kolu
        +RX(px0+10,56,3,1,'#6E655A');
      shops+=`<g class="shop" data-i="${i}">
        ${RX(x,14,w,10,'#22313E')}${RX(x+1,15,w-2,8,sh.c)}
        <g class="open">
          ${RX(x+1,27,w-2,6,sh.aw)}${RX(x+1,33,w-2,2,'#EFE6D2')}
          ${Array.from({length:6},(_,k)=>RX(x+4+k*12,27,6,6,'#EFE6D2')).join('')}
          ${RX(x+4,35,3,27,'#9A9184')}${RX(x+65,35,3,27,'#9A9184')}
          ${RX(x+46,38,24,24,sh.c)}${RX(x+49,41,18,13,'#8FC4D8','glass')}${RX(x+49,56,18,4,'#C9B088')}
          ${pump(x+12)}${pump(x+26)}
          ${RX(x+37,49,2,13,'#6E655A')}
          ${RX(x+2,62,68,2,'#8E8578')}
        </g>
        <g class="shut" opacity="0">${RX(x+3,34,66,28,'#8A8073')}</g></g>`;
      return;}
    shops+=`<g class="shop" data-i="${i}">
      ${RX(x,14,w,10,'#3A2A1C')}${RX(x+1,15,w-2,8,sh.c)}
      ${RX(x,24,w,38,sh.c)}${RX(x,24,w,2,'#2E2016')}
      ${Array.from({length:Math.floor(w/8)},(_,k)=>RX(x+k*8,26,4,5,sh.aw)+RX(x+k*8+4,26,4,5,'#EFE0C4')).join('')}
      ${RX(x,31,w,1,'#2E2016')}
      <g class="open">
        ${RX(x+5,36,40,20,'#8FC4D8','glass')}${RX(x+7,50,36,4,'#C9B088')}
        ${RX(x+9,44,6,6,'#D86B4A')}${RX(x+18,45,6,5,'#E0C05A')}${RX(x+27,43,7,7,'#6E9E5E')}
        ${RX(x+51,38,16,24,'#4A3426')}${RX(x+53,40,12,20,'#5E4433')}${RX(x+62,49,2,2,'#D8C49C')}
      </g>
      <g class="shut" opacity="0">
        ${RX(x+3,34,66,28,'#8A8073')}
        ${Array.from({length:11},(_,k)=>RX(x+4+k*6,34,3,28,'#6E655A')).join('')}
        ${RX(x+3,34,66,2,'#5A5248')}
      </g></g>`;});
  sv.innerHTML=`
  <rect id="ssky" x="-10" y="0" width="500" height="14" fill="#5FA0C8"/>
  <g id="srain" opacity="0"></g>
  <g id="ssnow" opacity="0"></g>
  <g id="scloud" opacity="0"></g>
  <g id="ssun" opacity="0"></g>
  ${RX(-10,12,500,3,'#2E2016')}
  <g>${shops}</g>
  ${RX(-10,62,500,10,'#A89877')}
  ${Array.from({length:26},(_,i)=>RX(i*19-8,62,9,1,'#94846A')).join('')}
  ${RX(-10,72,500,2,'#6E6455')}${RX(-10,74,500,12,'#2E3040')}
  <g>${Array.from({length:18},(_,i)=>RX(i*28-10,79,12,2,'#4E5068')).join('')}</g>
  <!-- sıra: yayalar kaldırımda arkada, araçlar yolda önde çizilir -->
  <g id="queue"></g><g id="walk"></g><g id="prot"></g><g id="pol"></g><g id="scars"></g>
  <style>
    @keyframes wk{from{transform:translateX(-24px)}to{transform:translateX(500px)}}
    @keyframes wkb{from{transform:translateX(500px)}to{transform:translateX(-24px)}}
    @keyframes cr{from{transform:translateX(-40px)}to{transform:translateX(520px)}}
    @keyframes bob2{0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)}}
    @keyframes wk4{to{transform:translateX(calc(-1 * var(--fw)))}}
    @keyframes rn2{from{transform:translateY(-10px)}to{transform:translateY(90px)}}
    @keyframes snw{from{transform:translateY(-8px) translateX(0)}
                   50%{transform:translateY(40px) translateX(3px)}
                   to{transform:translateY(92px) translateX(0)}}
    @keyframes drift{from{transform:translateX(-70px)}to{transform:translateX(500px)}}
    @keyframes shine{0%,100%{opacity:.92}50%{opacity:1}}
    @keyframes march{from{transform:translateX(-110px);opacity:0}12%{opacity:1}to{transform:translateX(0);opacity:1}}
    @keyframes hold{0%,100%{transform:translateY(0)}50%{transform:translateY(-.7px)}}
    @keyframes push{from{transform:translateX(0)}to{transform:translateX(46px)}}
    @keyframes flee{0%{transform:translateX(0);opacity:1}
                    55%{opacity:1}
                    100%{transform:translateX(150px);opacity:0}}
    @keyframes chant{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.6px)}}
  </style>`;
  // araç sprite'ları (sprite.png'den kesildi)
  sv.querySelector('#scars').innerHTML=Array.from({length:SPR.cars.length},(_,i)=>{
    const C=SPR.cars[i%SPR.cars.length];
    // ortak ölçek: araba h34 -> 13,5 birim; kamyon h40 -> ~15,9 birim (daha iri)
    const h=C.h*13.5/34, w=C.w*13.5/34;
    const big=C.h>34;                              // kamyonlar daha ağır/yavaş
    const dur=(big?21:14)+((i*3)%9), dl=-(i*2.3);
    return `<g style="animation:cr ${dur}s linear infinite;animation-delay:${dl}s">
      <image href="${C.d}" x="0" y="${(84-h).toFixed(1)}" width="${w.toFixed(1)}" height="${h}"/></g>`;}).join('');
  sv.querySelector('#srain').innerHTML=Array.from({length:60},(_,i)=>{const x=(i*17)%500-10,d=(i%6)*.12;
    return `<rect x="${x}" y="0" width="1" height="5" fill="#BFD4E8" opacity=".55" style="animation:rn2 .65s linear infinite;animation-delay:${d}s"/>`;}).join('');
  // kar: iri, yavaş, savrularak düşen taneler
  sv.querySelector('#ssnow').innerHTML=Array.from({length:52},(_,i)=>{
    const x=(i*23)%500-10, d=-(i%9)*0.7, dur=(3.4+(i%5)*0.5).toFixed(1), sz=i%4===0?2:1;
    return `<rect x="${x}" y="0" width="${sz}" height="${sz}" fill="#F2F6FA" opacity=".9"
      style="animation:snw ${dur}s linear infinite;animation-delay:${d}s"/>`;}).join('');
  // bulutlar: gökyüzü şeridinde yavaşça sürüklenir
  const cloud=(cx,cy,sc)=>`<g transform="translate(${cx},${cy}) scale(${sc})">
    ${RX(0,2,18,4,'#EFF4F8')}${RX(3,0,10,3,'#EFF4F8')}${RX(-3,4,24,2,'#DCE6EE')}</g>`;
  sv.querySelector('#scloud').innerHTML=[[0,2,1],[0,5,.75],[0,1,1.15],[0,6,.9]].map((c,i)=>
    `<g style="animation:drift ${58+i*17}s linear infinite;animation-delay:${-i*15}s">${cloud(i*120-60,c[1],c[2])}</g>`).join('');
  // güneş: sağ üstte, hafifçe nefes alır
  sv.querySelector('#ssun').innerHTML=`<g style="animation:shine 4s ease-in-out infinite">
    ${RX(392,2,9,9,'#FFE47A')}${RX(390,4,13,5,'#FFE47A')}${RX(394,0,5,13,'#FFE47A')}
    ${RX(394,4,5,5,'#FFF4C2')}</g>`;
  // İŞKUR kuyruğu — işsizlik arttıkça uzar
  sv.querySelector('#queue').innerHTML=Array.from({length:9},(_,i)=>
    `<g class="q" data-i="${i}" opacity="0" transform="translate(${330+i*9},0)">
      ${RX(0,58,4,4,'#D9B08C')}<rect x="-1" y="62" width="6" height="8" fill="#7A6A8A"/></g>`).join('');
  // yaya sprite'ları: 4 kareli yürüyüş şeridi, steps(4) ile oynatılıyor
  const PH=15.5;
  let defs='';
  sv.querySelector('#walk').innerHTML=Array.from({length:14},(_,i)=>{
    const W=SPR.walk[i%SPR.walk.length];
    const fw=W.w*PH/W.h, back=i%2===0, dur=26+((i*5)%18), dl=-(i*2.3);
    const cid='pc'+i;
    defs+=`<clipPath id="${cid}"><rect x="0" y="${72-PH}" width="${fw.toFixed(2)}" height="${PH}"/></clipPath>`;
    // sağa yürüyen normal, sola yürüyen aynalanır (yüzü gittiği yöne dönük)
    const flip=back?'':`transform="translate(${fw.toFixed(2)},0) scale(-1,1)"`;
    return `<g class="ped" data-i="${i}" style="animation:${back?'wk':'wkb'} ${dur}s linear infinite;animation-delay:${dl}s">
      <g ${flip}><g clip-path="url(#${cid})">
        <image class="pimg" href="${W.d}" x="0" y="${72-PH}" width="${(fw*4).toFixed(2)}" height="${PH}"
          style="animation:wk4 ${(0.62+(i%3)*0.09).toFixed(2)}s steps(4) infinite;--fw:${(fw*4).toFixed(2)}px"/>
      </g></g>
      </g>`;}).join('');
  sv.insertAdjacentHTML('afterbegin','<defs>'+defs+'</defs>');
  streetBuilt=true;
}
export function renderStreet(){
  if(!streetBuilt)buildStreet();
  const sv=$('#street'),m=moodScore();
  sv.querySelector('#ssky').setAttribute('fill',skyFor(m));
  /* Hava mevsime bağlı; moral yalnızca yoğunluğu değiştirir.
     Kötü giden bir sonbaharda yağmur daha sert yağar. */
  const sez=seasonOf(S.month), moody=clamp((55-m)/60,0,1);
  const set=(id,op)=>sv.querySelector(id).setAttribute('opacity',op.toFixed(2));
  set('#srain', sez==='sonbahar'?0.45+moody*0.45 : (sez==='ilkbahar'&&m<30?0.28:0));
  set('#ssnow', sez==='kis'?0.70+moody*0.30:0);
  set('#scloud',sez==='ilkbahar'?0.85 : sez==='sonbahar'?0.55 : sez==='kis'?0.35:0);
  set('#ssun',  sez==='yaz'?1 : sez==='ilkbahar'?0.35:0);
  const shut=shutCount();
  sv.querySelectorAll('.shop').forEach((g,i)=>{
    const closed=i>=SHOPS.length-shut;
    g.querySelector('.open').setAttribute('opacity',closed?'0':'1');
    g.querySelector('.shut').setAttribute('opacity',closed?'1':'0');
    const gl=g.querySelector('.glass');
    if(gl)gl.setAttribute('fill',m>55?'#9ED0E4':m>32?'#7FA8BC':'#5E7686');});
  // kuyruk: işsizlik 8'in üstünde her puan için ~2 kişi
  const qn=clamp(Math.round((S.e.unemployment-8)*2),0,9);
  sv.querySelectorAll('.q').forEach((g,i)=>g.setAttribute('opacity',i<qn?'1':'0'));
  const angry=clamp(S.p.unrest/100,0,1),bags=clamp((S.e.realIncome-84)/26,0,1);
  const dense=clamp(.35+(S.e.gap+4)/9,.25,1);
  sv.querySelectorAll('.ped').forEach((g,i)=>{
    const vis=(i/14<dense);
    g.setAttribute('opacity',vis?'1':'0');
    g.style.pointerEvents=vis?'auto':'none';   // görünmeyen yaya tıklamayı yutmasın
    const bad=(((i*7)%14)/14)<angry;
    const img=g.querySelector('.pimg');
    // moral düşükken yayalar soluk ve yavaş; pankart açanlar öfkeli
    if(img)img.style.filter=bad?'saturate(.45) brightness(.82)':'none';
    });
  const wrap=$('#streetWrap');
  wrap.querySelectorAll('.sign,.tagp').forEach(n=>n.remove());
  const px=S.e.px||{bread:15,meat:640,fuel:52};
  // etiket: 0 petrol (pompanın yanında), 1 fırın, 3 kasap, 4 banka
  const capOn=S.active.some(a=>a.id==='rentcap');
  const TAG={0:['⛽ BENZİN ₺'+nf(px.fuel,2),'58%'],
             1:['EKMEK ₺'+nf(px.bread,2),'44%'],
             2:[(capOn?'🔒 ':'')+'KİRA ₺'+nf(px.rent||18000,0),'52%'],
             3:['KIYMA ₺'+nf(px.meat,0),'44%'],
             4:['FAİZ '+pct(S.e.rate,0),'44%']};
  SHOPS.forEach((sh,i)=>{
    const closed=i>=SHOPS.length-shut, cx=((6+i*79+36)/480)*100;
    const d=document.createElement('div');
    d.className='sign'+(closed?' off':'');
    d.style.left=cx+'%'; d.style.top='6%';
    d.textContent=closed?'KİRALIK':sh.n;
    wrap.appendChild(d);
    if(!closed&&TAG[i]){
      const t=document.createElement('div');t.className='tagp';
      t.style.left=cx+'%'; t.style.top=TAG[i][1];
      t.textContent=TAG[i][0];
      wrap.appendChild(t);}});
  $('#capH').textContent=sceneCaption(m);
  if(bubPed)paintBub();                       // açık baloncuk yeni ayın repliğini göstersin
  $('#moodB').innerHTML=pixFace(m,18)+`<b style="font-weight:600;color:#2E1B0C">${
    m>72?'Halk memnun':m>50?'İdare eder':m>30?'Huzursuz':'Öfkeli'}</b>`;
  renderProtest();
}
/* ── sokaktaki vatandaş baloncuğu ──
   Kaldırılan "Halk" panelinin kıraathane işlevi buraya taşındı: yayaya
   tıklarsın, durur, o ayki hâlini anlatır ve kendi kesiminin desteğini gösterir. */
export let bubPed=null,bubTO=null;
export const setBubPed=v=>{bubPed=v;};
export const setBubTO=v=>{bubTO=v;};
export function closeBub(){
  if(bubPed){bubPed.style.animationPlayState='';
    const im=bubPed.querySelector('.pimg'); if(im)im.style.animationPlayState='';}
  bubPed=null; clearTimeout(bubTO);
  const b=$('#sbub'); if(b)b.style.display='none';
}
export function paintBub(){
  const g=bubPed,b=$('#sbub'); if(!g||!b)return;
  if(g.getAttribute('opacity')==='0'){closeBub();return;}
  const c=CITIZENS[(+g.dataset.i)%CITIZENS.length],sg=SEGM[c.k];
  const v=S.seg[c.k],d=v-((S.segPrev&&S.segPrev[c.k]!=null)?S.segPrev[c.k]:v);
  const col=v<35?'var(--red)':v<50?'#A9660B':'var(--green)';
  const dc=Math.abs(d)<.05?'mut':d>0?'grn':'red';
  b.innerHTML=`<b>${c.name} · ${c.tag}</b>"${c.line(S)}"
    <span class="sbub-f"><span>${sg.ic} ${sg.n}</span>
      <span class="bar mini" style="margin:0;flex:1"><i style="width:${v}%;background:${col}"></i></span>
      <span class="m" style="font-weight:700;color:${col}">${nf(v,0)}</span>
      <span class="${dc}" style="font-size:10px">${Math.abs(d)<.05?'—':signed(d,1)}</span></span>`;
  b.style.display='block';
  /* Ölçüler gerçek ekran pikselinde geliyor, yazdığımız px ise ölçeklenmiş
     uzayda: ikisini aynı birime indirmek için ölçeğe bölüyoruz. */
  const k=uiScale();
  const wrap=$('#streetWrap'),wr=wrap.getBoundingClientRect(),r=g.getBoundingClientRect();
  const bb=b.getBoundingClientRect(),bw=bb.width/k,bh=bb.height/k;
  const ww=wr.width/k,wh=wr.height/k;
  b.style.left=clamp((r.left-wr.left)/k+r.width/k/2-bw/2,3,Math.max(3,ww-bw-3))+'px';
  b.style.top='auto';
  b.style.bottom=clamp((wr.bottom-r.top)/k+3,3,Math.max(3,wh-bh-2))+'px';
}
export function sceneCaption(m){const e=S.e,sh=shutCount();
  if(e.inflation>60)return 'Etiketler haftada iki kez değişiyor';
  if(S.p.unrest>72)return 'Sokakta tansiyon yüksek';
  if(sh>=3)return `Çarşıda ${sh} dükkân kepenk indirdi`;
  if(e.unemployment>12)return 'İŞKUR önünde kuyruk uzuyor';
  if(e.realIncome<86)return 'Alım gücü eridi, sepet küçüldü';
  if(m>76)return 'Vitrinler dolu, çarşı hareketli';
  if(m>55)return 'Çarşı toparlanıyor';
  if(m>32)return 'Zor ama yönetilebilir';
  return 'Alım gücü eriyor, çarşı durgun';}

/* ═══════════════ PİKSEL YÜZLER ═══════════════ */
export function pixFace(m,size){
  const c=m>66?'#2F6B3E':m>40?'#C98A12':'#A82F26';
  const eye=m>40?`<rect x="4" y="5" width="2" height="2" fill="#F2E5C4"/><rect x="10" y="5" width="2" height="2" fill="#F2E5C4"/>`
    :`<rect x="3" y="4" width="3" height="1" fill="#F2E5C4"/><rect x="10" y="4" width="3" height="1" fill="#F2E5C4"/>
      <rect x="4" y="6" width="2" height="2" fill="#F2E5C4"/><rect x="10" y="6" width="2" height="2" fill="#F2E5C4"/>`;
  const mouth=m>66?`<rect x="5" y="10" width="6" height="1" fill="#F2E5C4"/><rect x="4" y="9" width="1" height="1" fill="#F2E5C4"/><rect x="11" y="9" width="1" height="1" fill="#F2E5C4"/>`
    :m>40?`<rect x="5" y="10" width="6" height="1" fill="#F2E5C4"/>`
    :`<rect x="5" y="10" width="6" height="1" fill="#F2E5C4"/><rect x="4" y="11" width="1" height="1" fill="#F2E5C4"/><rect x="11" y="11" width="1" height="1" fill="#F2E5C4"/>`;
  return `<svg viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="2" y="1" width="12" height="14" fill="${c}"/><rect x="1" y="2" width="14" height="12" fill="${c}"/>
    ${eye}${mouth}</svg>`;}
export function pixPortrait(p,mood){
  const R=RX;
  const hair={bob:R(3,1,10,4,p.hair)+R(2,3,2,7,p.hair)+R(12,3,2,7,p.hair),
    short:R(3,1,10,3,p.hair)+R(2,3,1,3,p.hair)+R(13,3,1,3,p.hair),
    long:R(3,1,10,4,p.hair)+R(2,3,2,10,p.hair)+R(12,3,2,10,p.hair)}[p.style];
  const brow=mood==='bad'?R(4,5,3,1,'#2B2320')+R(9,5,3,1,'#2B2320')
    :mood==='warn'?R(4,5,3,1,'#3A302A')+R(9,5,3,1,'#3A302A')
    :R(4,4,3,1,'#3A302A')+R(9,4,3,1,'#3A302A');
  const mouth=mood==='bad'?R(6,11,4,1,'#8A4038')+R(5,12,1,1,'#8A4038')+R(10,12,1,1,'#8A4038')
    :mood==='warn'?R(6,11,4,1,'#8A4038')
    :R(6,11,4,1,'#8A4038')+R(5,10,1,1,'#8A4038')+R(10,10,1,1,'#8A4038');
  const gl=p.glasses?R(3,6,4,3,'#2B2320')+R(9,6,4,3,'#2B2320')+R(7,7,2,1,'#2B2320')
      +R(4,7,2,1,'#CDE3F0')+R(10,7,2,1,'#CDE3F0'):'';
  const beard=p.beard?R(4,10,8,3,p.hair):'';
  return `<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" style="width:100%;height:100%">
    ${R(0,0,16,16,'#D8C49B')}${R(3,13,10,3,p.coll)}${R(7,13,2,3,'#EFE3C8')}
    ${R(3,3,10,10,p.skin)}${R(2,5,1,4,p.skin)}${R(13,5,1,4,p.skin)}
    ${beard}${hair}${brow}${R(4,7,2,2,'#2B2320')}${R(10,7,2,2,'#2B2320')}${gl}${mouth}</svg>`;}
