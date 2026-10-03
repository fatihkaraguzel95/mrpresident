import {$, S, clamp, nf, pct, signed} from '../core/state.js';
import {bar, prevE, shownVote} from './panels.js';
import {closeModal, modal} from './modal.js';

/* ═══════════════ HALK & SEÇMEN ═══════════════ */
export const SEGM={retiree:{n:'Emekliler',ic:'👴',w:'%19'},minwage:{n:'Asgari ücretliler',ic:'👷',w:'%31'},
  sme:{n:'Esnaf & KOBİ',ic:'🏪',w:'%22'},capital:{n:'Sanayici',ic:'🏛️',w:'%9'},youth:{n:'Gençler',ic:'🎓',w:'%19'}};
export function renderSociety(){
  if(!$('#segBox'))return;
  $('#voteR').textContent=`oy potansiyeli ${pct(shownVote())}`;
  const e=S.e,pv=prevE();
  const ri=e.realIncome,dri=ri-pv.realIncome;
  const mo=S.p.morale,dmo=mo-(S.prev?S.prev.p.morale:mo);
  const riCol=ri<90?'var(--red)':ri<100?'#A9660B':'var(--green)';
  const moCol=mo<35?'var(--red)':mo<55?'#A9660B':'var(--green)';
  $('#hhBox').innerHTML=`
    <div><span>Hane alım gücü</span><b style="color:${riCol}">${nf(ri,0)}
      <span style="font-size:11px" class="${dri>0?'grn':dri<0?'red':'mut'}">${dri>0?'▲':dri<0?'▼':'—'}</span></b>
      ${bar(clamp((ri-70)/60*100,0,100),riCol).replace('class="bar"','class="bar mini"')}</div>
    <div><span>Halkın morali</span><b style="color:${moCol}">${nf(mo,0)}<span style="font-size:11px" class="mut">/100</span>
      <span style="font-size:11px" class="${dmo>0?'grn':dmo<0?'red':'mut'}">${dmo>0?'▲':dmo<0?'▼':'—'}</span></b>
      ${bar(mo,moCol).replace('class="bar"','class="bar mini"')}</div>`;
  $('#segBox').innerHTML=Object.entries(SEGM).map(([k,m])=>{
    const v=S.seg[k],d=v-(S.segPrev[k]??v);
    const c=v<35?'var(--red)':v<50?'#A9660B':'var(--green)';
    const dc=Math.abs(d)<.05?'mut':d>0?'grn':'red';
    const rows=(S.segWhy&&S.segWhy[k])||[];
    const tot=rows.reduce((a,x)=>a+x[1],0);
    return `<div class="seg" data-seg="${k}" title="Seçmenin ${m.w}'u — gerekçeleri için tıkla">
      <span class="seg-i">${m.ic}</span><span class="seg-n">${m.n}</span>
      <span class="bar mini" style="margin:0"><i style="width:${v}%;background:${c}"></i></span>
      <span style="display:flex;gap:4px;align-items:baseline;justify-content:flex-end">
        <b class="seg-v">${nf(v,0)}</b><span class="seg-d ${dc}">${Math.abs(d)<.05?'—':signed(d,1)}</span></span>
      <span class="seg-c" title="Gerekçeleri aç">▸</span>
    </div>`;}).join('');
  $('#segBox').onclick=ev=>{
    const r=ev.target.closest('[data-seg]'); if(!r)return;
    openSegment(r.dataset.seg);};
}

/* ── GRUBUN GEREKÇELERİ ──
   Eskiden satırın altına açılıyordu; Halk paneli dar olduğu için uzun
   gerekçeler iki satıra kırılıp okunmaz hâle geliyordu. Artık geniş bir
   pencerede, iki sütun hâlinde açılıyor: solda neden memnunlar, sağda
   neden küskünler. */
export function openSegment(k){
  const m=SEGM[k]; if(!m)return;
  const v=S.seg[k], d=v-(S.segPrev[k]??v);
  const c=v<35?'var(--red)':v<50?'#A9660B':'var(--green)';
  const rows=((S.segWhy&&S.segWhy[k])||[]).slice().sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]));
  const tot=rows.reduce((a,x)=>a+x[1],0);
  const sut=(baslik,liste,iyi)=>`<div class="sgc">
      <div class="sgc-h ${iyi?'ok':'no'}">${baslik}<span>${liste.length}</span></div>
      ${liste.length?liste.map(([n2,val,note])=>`<div class="sw-r">
          <span class="sw-n">${val>0?'▲':'▼'} ${n2}${note?`<span class="sw-d">${note}</span>`:''}</span>
          <b class="${val>0?'grn':'red'}">${signed(val,2)}</b></div>`).join('')
        :'<div class="sw-d" style="padding:6px 0">Bu ay bu yönde kayda değer bir hareket yok.</div>'}
    </div>`;
  const dlg=modal(`<div class="dlg-t"><span class="ic">${m.ic}</span>
      <div><div class="dlg-k">Halk · seçmenin ${m.w}'u</div><h3>${m.n}</h3></div></div>
    <div class="dlg-b">
      <div class="sg-top">
        <div class="sg-big" style="color:${c}">${nf(v,0)}<small>/100</small></div>
        <div class="sg-bar">
          <div class="bar"><i style="width:${v}%;background:${c}"></i></div>
          <div class="sg-s">${v>=60?'Memnunlar':v>=42?'Kararsızlar':'Küskünler'} ·
            bu ay <b class="${Math.abs(d)<.05?'mut':d>0?'grn':'red'}">${Math.abs(d)<.05?'değişmedi':signed(d,1)+' puan'}</b></div>
        </div>
      </div>
      ${rows.length?`<div class="sg-grid">
          ${sut('Neden memnunlar',rows.filter(r=>r[1]>0),true)}
          ${sut('Neden küskünler',rows.filter(r=>r[1]<=0),false)}
        </div>
        <div class="sw-sum"><span>Bu ayki net değişim</span>
          <b class="${tot>0?'grn':'red'}">${signed(tot,2)} puan</b></div>`
        :'<div class="note">İlk ayı ilerlettiğinde bu grubun gerekçeleri burada çıkacak.</div>'}
    </div>
    <div class="dlg-f">
      <button class="sbtn" style="width:auto;padding:9px 24px;margin:0" id="sgOk">KAPAT</button>
    </div>`);
  dlg.classList.add('seg-dlg');
  dlg.querySelector('#sgOk').onclick=closeModal;
}

