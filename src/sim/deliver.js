import {MSHORT, S, clamp, nf, pct, signed} from '../core/state.js';
import {POL} from '../data/policies.js';
import {progScore} from '../data/mega.js';
import {headline} from './economy.js';

/* ═══════════════ PROGRAM KARNESİ ═══════════════
   Şikâyet şuydu: bir teknoloji paketi açıyorsun, sonra hiçbir şey
   olmuyor — para gidiyor ama ekranda bir karşılığı görünmüyor.

   Burada her paketin kendi KİLOMETRE TAŞLARI var. Paket belirli bir yaşa
   geldiğinde somut bir şey olur: fabrika açılır, kurs mezun verir, hat
   devreye girer. Olay manşete düşer, arşive yazılır, küçük ama GERÇEK bir
   etki uygular (potansiyel büyüme, işsizlik, seçmen grubu) ve o paketin
   bugüne kadar ne ürettiği "Program karnesi"nde birikir.

   Kural: kilometre taşı bedava değil — paket o aya kadar gerçekten
   fonlandıysa gelir. Ödeneği kıstıysan taş da küçülür (kOf ile ölçeklenir).
   ═══════════════════════════════════════════════ */

/* at: paketin kaçıncı ayında · t: manşet · b: arşiv notu · fx: kalıcı küçük etki */
export const MILE={
 security:[
  {at:3, t:'Sınır hattında yeni gözetleme sistemi devreye girdi',
   b:'İnsansız hava aracı destekli 24 saat gözetim kuruldu; olay sayısı üç ayda belirgin düştü.',
   fx:{segRetiree:1.8,segMinwage:1.0,unrest:-1.4}},
  {at:9, t:'Güvenlik operasyonları sonuç verdi, asayiş tablosu düzeldi',
   b:'Valilik verilerinde asayiş olayları geriledi; turizm rezervasyonlarında toparlanma başladı.',
   fx:{segRetiree:2.2,segSme:1.2,current:.06,unrest:-2.0}},
  {at:20,t:'Uzayan operasyon ödeneği bütçede ve gençlerde iz bıraktı',
   b:'Program üçüncü yılına girdi. Güvenlik tarafı rahat; ancak genç seçmende "normalleşme ne zaman" sorusu büyüyor.',
   fx:{segYouth:-2.4,cred:-.02}}],
 defense:[
  {at:6, t:'Yerli motor test standında ilk ateşlemeyi yaptı',
   b:'Programın ilk somut çıktısı: yerli turbofan prototipi test sürecine girdi.',
   fx:{supply:.004,segCapital:1.8,segYouth:1.4}},
  {at:18,t:'İHA ihracatında ilk büyük sözleşme imzalandı',
   b:'İki ülkeyle toplu satış anlaşması yapıldı; savunma ihracatı dış ticaret kaleminde ilk kez görünür oldu.',
   fx:{supply:.007,current:.14,segCapital:2.6,segRetiree:1.6}},
  {at:34,t:'Savunma sanayii sivil teknolojiye yayıldı',
   b:'Program kapsamında geliştirilen sensör ve yazılım teknolojileri sivil sanayide kullanılmaya başlandı.',
   fx:{supply:.010,current:.10,segCapital:2.8,segYouth:2.0}}],
 exam:[
  {at:2, t:'Yeni sınav sistemi açıklandı, aileler dershaneye koştu',
   b:'Hazırlandığı sistem bir gecede değişen öğrenciler için takvim yeniden kuruldu; özel ders talebi patladı.',
   fx:{segYouth:-3.2,unrest:1.6}},
  {at:14,t:'İlk kuşak yeni sistemle üniversiteye yerleşti',
   b:'Yerleşme oranları beklenenin üstünde çıktı; tartışma yumuşadı ama güven tam oturmadı.',
   fx:{segYouth:-1.0,nairu:-.004}},
  {at:30,t:'Mezun profili ile işgücü talebi ilk kez örtüştü',
   b:'Nitelikli işgücü açığı daralıyor; işverenler "aradığımız mezunu bulabiliyoruz" diyor.',
   fx:{supply:.006,nairu:-.008,segCapital:2.0,segSme:1.4,unemp:-.06}}],
 industry:[
  {at:4, t:'Organize sanayi bölgesinde ilk teşvikli hat devreye girdi',
   b:'Makine-teçhizat istisnasından yararlanan 240 firma yatırım kararını öne çekti.',
   fx:{supply:.004,segCapital:1.6,segSme:.8}},
  {at:12,t:'Teşvikli yatırımlar kapasiteyi büyüttü',
   b:'Sanayi kapasite kullanımı iki puan arttı; ara malı ithalatı yerine yerli üretim devreye giriyor.',
   fx:{supply:.006,current:.08,segCapital:2.2,unemp:-.05}},
  {at:24,t:'Teşvik programı yeni bir sanayi kuşağı çıkardı',
   b:'Programın başladığı illerde sanayi istihdamı kalıcı olarak arttı.',
   fx:{supply:.008,segCapital:2.6,segSme:1.4}}],
 tech:[
  {at:6, t:'Yapay zekâ araştırma merkezi kapılarını açtı',
   b:'Üç üniversiteyle ortak laboratuvar kuruldu; ilk 400 araştırmacı işe alındı.',
   fx:{supply:.004,segYouth:2.4,segCapital:1.0}},
  {at:18,t:'Yerli çip tasarımı ilk ticari siparişini aldı',
   b:'Tasarım merkezi, bölgesel bir üreticiye lisans sattı. Teknoloji ihracatı ilk kez kalemde göründü.',
   fx:{supply:.009,current:.10,segYouth:3.0,segCapital:2.4,cred:.02}},
  {at:34,t:'Teknoloji programı ülkeyi tedarik zincirine soktu',
   b:'Küresel bir üretici tasarım ofisini buraya taşıdı. Nitelikli istihdam ve patent sayısı rekor kırdı.',
   fx:{supply:.012,segYouth:3.4,segCapital:3.0,nairu:-.05}}],
 edu:[
  {at:8, t:'Mesleki eğitim seferberliği ilk mezunlarını verdi',
   b:'62 bin kursiyer sertifika aldı; işverenle eşleştirme oranı %71.',
   fx:{nairu:-.09,unemp:-.08,segYouth:2.2,segMinwage:1.2}},
  {at:20,t:'Nitelikli işgücü açığı ilk kez daraldı',
   b:'Sanayi odaları "aradığımız kalfayı bulabiliyoruz" diyor. Yapısal işsizlik geriliyor.',
   fx:{nairu:-.14,supply:.005,segYouth:2.6,segSme:1.6}}],
 youth:[
  {at:3, t:'Genç istihdam teşvikiyle ilk 90 bin işe giriş',
   b:'25 yaş altı ilk işe girişlerde SGK primi devlet tarafından karşılanıyor.',
   fx:{unemp:-.14,segYouth:3.2}},
  {at:12,t:'Genç işsizlik oranı bir yılda belirgin geriledi',
   b:'Teşvikten yararlanan gençlerin yarıdan fazlası süre bitiminde aynı işyerinde kaldı.',
   fx:{unemp:-.10,nairu:-.04,segYouth:3.0}}],
 housing:[
  {at:10,t:'İlk sosyal konut bloklarında anahtar teslimi',
   b:'12 bin konut kuraya çıktı. Bölgedeki kira artışı yavaşladı.',
   fx:{rent:-.01,segMinwage:2.4,segYouth:2.0}},
  {at:24,t:'Kamu konut arzı kira piyasasını soğuttu',
   b:'Arz artışı, kira artış hızını enflasyonun altına çekti.',
   fx:{rent:-.014,supply:.003,segMinwage:2.8,segYouth:2.4}}],
 energy:[
  {at:3, t:'Fatura desteği hanelere yansıdı',
   b:'Ortalama hane elektrik-doğalgaz faturası belirgin düştü; esnaf da kapsama alındı.',
   fx:{segMinwage:2.0,segRetiree:1.8,segSme:1.2}}],
 vat:[
  {at:3, t:'Gıdada KDV indirimi raflara yansıdı',
   b:'Denetim ekipleri etiket kontrolü yaptı; temel gıdada fiyatlar geriledi.',
   fx:{segMinwage:2.2,segRetiree:2.0}}],
 pension:[
  {at:2, t:'Emekli aylığına ek destek hesaplara yattı',
   b:'En düşük aylık alanlar ilk ödemeyi aldı.',
   fx:{segRetiree:3.0,morale:1.5}}],
 agri:[
  {at:6, t:'Gübre ve mazot desteği hasada yansıdı',
   b:'Birim maliyet düştü, ekilen alan genişledi. Gıda arzı rahatlıyor.',
   fx:{supply:.003,segSme:1.6,segRetiree:1.0}},
  {at:16,t:'Tarımsal üretimde rekolte artışı',
   b:'Hububat ve yem bitkilerinde üretim arttı; gıda enflasyonu baskısı azaldı.',
   fx:{supply:.004,current:.06,segSme:2.0}}],
 export:[
  {at:7, t:'İhracatta yeni pazar atağı sonuç verdi',
   b:'Eximbank kredisi kullanan firmalar üç yeni pazara giriş yaptı.',
   fx:{current:.12,segCapital:2.2,segSme:1.0}},
  {at:20,t:'Turizm ve ihracat geliri rezervleri besledi',
   b:'Döviz geliri beklentiyi aştı; Merkez Bankası rezerv biriktirdi.',
   fx:{current:.16,reserves:6,segCapital:2.4}}],
 kgf:[
  {at:3, t:'KGF kefaleti kredi musluğunu açtı',
   b:'KOBİ kredilerinde onay oranı iki katına çıktı.',
   fx:{segSme:3.0,unemp:-.06}}],
 corp:[
  {at:9, t:'Kurumlar vergisi indirimi yatırıma döndü',
   b:'Şirketler dağıtılmayan kârı makine yatırımına yönlendirdi.',
   fx:{supply:.005,segCapital:2.6}}],
 audit:[
  {at:10,t:'Kayıt dışıyla mücadele vergi tabanını büyüttü',
   b:'Dijital takip sistemi devreye girdi; kayıtlı istihdam arttı, vergi geliri kalıcı yükseldi.',
   fx:{revenue:.012,cred:.02,integrity:2}}],
 rail:[
  {at:14,t:'İlk yük hattı ve liman bağlantısı tamamlandı',
   b:'Lojistik maliyeti düştü; ihracatçı limanı gün içinde kullanabiliyor.',
   fx:{supply:.006,current:.08,segCapital:2.0}},
  {at:34,t:'Demiryolu ağı kapasiteyi kalıcı büyüttü',
   b:'Yük taşımacılığında demiryolunun payı iki katına çıktı.',
   fx:{supply:.012,current:.12,segCapital:2.8,segSme:1.4}}],
 urban:[
  {at:18,t:'Kentsel dönüşümde ilk etap teslim edildi',
   b:'Riskli yapı stoğunun bir bölümü yenilendi; afet dayanıklılığı arttı.',
   fx:{insure:.012,segMinwage:2.0,segSme:1.2}}],
 energyStore:[
  {at:12,t:'Doğalgaz depolama kapasitesi devreye alındı',
   b:'Kış aylarında spot piyasaya bağımlılık azaldı.',
   fx:{insure:.018,current:.06,segCapital:1.6}}],
 child:[
  {at:12,t:'Kreş ağı kadın istihdamını artırdı',
   b:'Programın yürüdüğü illerde kadın işgücüne katılım belirgin yükseldi.',
   fx:{nairu:-.06,supply:.003,segMinwage:2.4,segYouth:1.6}}],
 natal:[
  {at:6, t:'Üç çocuk desteği hanelere ulaştı',
   b:'Aylık nakit destek ve eğitim ödeneği hesaplara yattı.',
   fx:{segMinwage:2.6,segRetiree:1.2,morale:1.5}}],
 marriage:[
  {at:4, t:'Evlilik primi başvuruları patladı',
   b:'Faizsiz kredi ve ev kurma primi 140 bin çifte ödendi. Konut talebi de hareketlendi.',
   fx:{segYouth:3.4,rent:.006}}],
 transparency:[
  {at:10,t:'İhale verileri kamuya açıldı',
   b:'Kamu alımları açık veri portalında yayımlanmaya başladı; şikâyet mekanizması işliyor.',
   fx:{integrity:4,cred:.03,segCapital:2.0,segYouth:1.6}},
  {at:26,t:'Şeffaflık reformu risk primini düşürdü',
   b:'Uluslararası kuruluşlar yönetişim notunu yükseltti.',
   fx:{integrity:4,cred:.035,cds:-18}}],
 macropru:[
  {at:5, t:'Taksit sınırı tüketici kredisini soğuttu',
   b:'Kredi kartı borç stoğunun büyüme hızı yarıya indi.',
   fx:{segCapital:1.4}}],
 rentcap:[
  {at:6, t:'Kira zam sınırı yenilenen sözleşmelere yansıdı',
   b:'Yenilenen sözleşmelerde zam TÜFE ile sınırlandı; kiracı örgütleri destekliyor.',
   fx:{segMinwage:2.4,segYouth:2.6,segCapital:-1.2}}],
 kkm:[
  {at:6, t:'Kur korumalı mevduat hacmi büyüdü',
   b:'Mevduat sahipleri kur riskini hazineye devretti. Fatura kur arttıkça büyüyor.',
   fx:{segRetiree:1.2,segCapital:1.0}}],
};

/* Küçük ve kalıcı etkiler — kilometre taşının gerçek karşılığı. */
function applyMile(fx,k){
  const e=S.e;
  Object.entries(fx).forEach(([key,v])=>{
    const w=v*k;
    if(key==='supply')e.supplyStock+=w;
    else if(key==='nairu')e.nairu=clamp(e.nairu+w,6,14);
    else if(key==='unemp')e.unemployment=clamp(e.unemployment+w,3,30);
    else if(key==='rent')e.px.rent=Math.max(100,e.px.rent*(1+w));
    else if(key==='current')e.current=clamp(e.current+w,-12,6);
    else if(key==='reserves')e.reserves=clamp(e.reserves+w,5,400);
    else if(key==='cds')e.cds=clamp(e.cds+w,80,1500);
    else if(key==='cred')e.credibility=clamp(e.credibility+w*26,3,97);
    else if(key==='revenue')e.primary+=w*12;
    else if(key==='insure')e.supplyStock+=0;           // sigorta chan üstünden işler
    else if(key==='integrity')S.p.integrity=clamp(S.p.integrity+w,2,98);
    else if(key==='morale')S.p.morale=clamp(S.p.morale+w,2,98);
    else if(key==='unrest')S.p.unrest=clamp(S.p.unrest+w,3,99);
    else if(key.startsWith('seg')){const sg=key.slice(3).toLowerCase();
      if(S.seg[sg]!=null)S.seg[sg]=clamp(S.seg[sg]+w,2,98);}
  });
}

/* Her ay çalışır: yaşı kilometre taşına denk gelen paketler sonuç üretir. */
export function deliverCheck(){
  if(!S.deliver)S.deliver={};
  S.active.forEach(a=>{
    const list=MILE[a.id]; if(!list)return;
    const P=POL(a.id); if(!P)return;
    const key=a.id+'@';
    list.forEach((m,i)=>{
      if(a.age!==m.at)return;
      if(S.deliver[key+i])return;
      S.deliver[key+i]=1;
      // ödeneği kıstıysan taş da küçülür
      const k=clamp(Math.pow(a.amt/P.ref,0.75),0.35,1.6);
      applyMile(m.fx,k);
      headline(m.t);
      S.log.unshift({q:`${MSHORT[S.month-1]} ${S.year}`,kind:'event',
        title:`${P.ico} ${m.t}`,
        body:`${m.b} — ${P.name} programının ${m.at}. ayı. `
            +(k<0.9?`Ödenek referansın altında olduğu için etki ${pct(k*100,0)} düzeyinde.`
             :k>1.1?`Yüksek ödenek sayesinde etki ${pct(k*100,0)} düzeyinde.`:'')});
    });
  });
}

/* Yürürlükteki her paketin bugüne kadar ürettikleri — karne ekranı. */
export function report(){
  return S.active.map(a=>{
    const P=POL(a.id), sc=progScore(a);
    const list=MILE[a.id]||[];
    const done=list.filter((m,i)=>S.deliver&&S.deliver[a.id+'@'+i]);
    const next=list.find((m,i)=>!(S.deliver&&S.deliver[a.id+'@'+i]));
    return {a,P,sc,done,next};
  });
}
export function reportHTML(){
  const R=report();
  if(!R.length)return '<div class="empty">Yürürlükte program yok.<br>Hükümet Kararları panelinden bir paket başlat; karnesi burada tutulacak.</div>';
  return `<div class="karne">`+R.map(({a,P,sc,done,next})=>{
    const rows=[
      ['Potansiyel büyüme',sc.pot,'puan',false],
      ['Talep / çıktı açığı',sc.gap,'puan',false],
      ['Enflasyon',sc.inf,'puan',true],
      ['İşsizlik',sc.un,'puan',true]
    ].filter(r=>Math.abs(r[1])>0.004);
    return `<div class="kr">
      <div class="kr-h"><span class="kr-i">${P.ico}</span>
        <b>${P.name}</b>
        <span class="kr-m">${sc.months}. ay · ${a.dur-a.age} ay kaldı</span></div>
      <div class="kr-s">${P.kind==='reg'?'bütçesiz düzenleme'
        :`bugüne kadar ${nf(Math.abs(sc.spend),0)} mlr ₺ ${sc.spend<0?'tasarruf':'ödenek'}`}</div>
      <div class="kr-fx">${rows.map(([n,v,u,inv])=>
        `<div><span>${n}</span><b class="${(inv?v<0:v>0)?'grn':'red'}">${signed(v,2)}</b></div>`).join('')
        ||'<div><span class="mut">Etkisi henüz ölçülebilir değil</span><b></b></div>'}</div>
      ${done.length?`<div class="kr-d"><b>Teslim edilenler</b>${done.map(m=>
        `<span>✔ ${m.t}</span>`).join('')}</div>`:''}
      ${next?`<div class="kr-n">⏳ Sıradaki: <b>${next.t}</b> — ${next.at}. ayda (${Math.max(0,next.at-a.age)} ay sonra)</div>`
        :'<div class="kr-n mut">Bu programın tüm kilometre taşları tamamlandı.</div>'}
    </div>`;}).join('')+`</div>`;
}
