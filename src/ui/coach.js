import {$, INTRO_KEY} from '../core/state.js';

/* ═══════════════ REHBER ═══════════════ */
export const COACH=[
  {ic:'📋',t:'Paketi sen tasarlarsın',d:'Kartlara tıkladığında aylık ödeneği ve süreyi sen belirlersin. 20 mlr ₺ × 36 ay ile 60 mlr ₺ × 12 ay aynı parayı harcar ama bambaşka sonuç verir: uzun süre kalıcı üretim kapasitesi biriktirir, kısa ve yüklü paket anında talep yaratır.'},
  {ic:'🏪',t:'Sokak senin aynan',d:'Çarşı ekonomiye göre değişir: işler kötüleşince dükkânlar kepenk indirip "KİRALIK" olur, İŞKUR önünde kuyruk uzar. Bakkalın camındaki ekmek fiyatı enflasyonla artar, bankanın tabelası faizi gösterir.'},
  {ic:'🗓️',t:'Ay ay ya da çeyrek çeyrek',d:'Alt ortadaki iki butondan birini seç. Çeyrek kapanınca TÜİK resmî büyüme ve işsizlik verisini açıklar — ay ortasında gerçek rakamı bilemezsin, tıpkı gerçek hayattaki gibi.'}
];
export function coach(i=0){
  if(i>=COACH.length){document.getElementById('coachRoot')?.remove();try{localStorage.setItem(INTRO_KEY,'1');}catch(e){}return;}
  const c=COACH[i];
  let root=document.getElementById('coachRoot');
  if(!root){root=document.createElement('div');root.id='coachRoot';document.body.appendChild(root);}
  root.innerHTML=`<div class="coach"><div class="coach-c">
    <div class="ic">${c.ic}</div><h3>${c.t}</h3><p>${c.d}</p>
    <div class="dots">${COACH.map((_,j)=>`<i class="${j===i?'on':''}"></i>`).join('')}</div>
    <button class="sbtn" id="cn" style="margin:0">${i===COACH.length-1?'HADİ BAŞLAYALIM':'DEVAM'}</button></div></div>`;
  root.querySelector('#cn').onclick=()=>coach(i+1);
}
