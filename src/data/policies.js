import {S, clamp} from '../core/state.js';
import {save} from '../sim/commit.js';

/* ═══════════════ POLİTİKA KATALOĞU ═══════════════
   Her politika artık AYLIK ÖDENEK + SÜRE ile tasarlanır.
   fx alanları "referans ödenekte, aylık" katkılardır; oyuncunun
   seçtiği ödenekle azalan verimli ölçeklenir: k = (ödenek/ref)^0.75
   ramp: etkinin tam güce ulaşması için geçen ay sayısı (gecikme)
   ══════════════════════════════════════════════════ */
export const POLICIES=[
 {id:'industry',ico:'🏭',name:'Sanayi Yatırım Teşviki',cat:'Üretim',kind:'spend',
  desc:'Makine-teçhizat yatırımında vergi istisnası, organize sanayi bölgelerine enerji desteği.',
  ref:30,min:5,max:80,def:30,dur:[12,24,36,48],defDur:24,
  fx:{demand:.115,supply:.0058,infl:.02,unemp:-.030,wage:0},ramp:{demand:3,supply:10},
  seg:{sme:.30,capital:.42,youth:.10}},

 {id:'tech',ico:'💻',name:'Teknoloji ve Yapay Zekâ Programı',cat:'Üretim',kind:'spend',
  desc:'Yapay zekâ araştırma fonu, çip tasarım merkezi, üniversite laboratuvarları. Meyvesi geç gelir.',
  ref:25,min:5,max:70,def:25,dur:[24,36,48],defDur:36,
  fx:{demand:.060,supply:.0112,infl:.01,unemp:-.012,wage:0},ramp:{demand:4,supply:18},
  seg:{capital:.26,youth:.34}},

 {id:'edu',ico:'🎓',name:'Mesleki Eğitim Seferberliği',cat:'İstihdam',kind:'spend',
  desc:'Nitelikli işgücü açığını kapatmak için beceri kursları. Yapısal işsizliği kalıcı düşürür.',
  ref:18,min:5,max:50,def:18,dur:[24,36,48],defDur:36,
  fx:{demand:.045,supply:.0075,infl:.007,unemp:-.020,wage:.010,nairu:-.014},ramp:{demand:5,supply:16},
  seg:{youth:.36,sme:.18,minwage:.16}},

 {id:'youth',ico:'👷',name:'Genç İstihdam Seferberliği',cat:'İstihdam',kind:'spend',
  desc:'25 yaş altı ilk işe girişte SGK primi devletten. Etkisi hızlı ama kalıcılığı düşük.',
  ref:15,min:5,max:45,def:15,dur:[6,12,24,36],defDur:24,
  fx:{demand:.070,supply:.002,infl:.014,unemp:-.055,wage:.006},ramp:{demand:2,supply:9},
  seg:{youth:.52,sme:.20}},

 {id:'housing',ico:'🏠',name:'Sosyal Konut Hamlesi',cat:'Konut',kind:'spend',
  desc:'Kamu konut arzı. Kısa vadede inşaat talebi yaratır, uzun vadede kira enflasyonunu düşürür.',
  ref:40,min:10,max:100,def:40,dur:[24,36,48],defDur:36,
  fx:{demand:.130,supply:.0041,infl:.034,unemp:-.036,wage:0,rent:-.030},ramp:{demand:3,supply:14},
  seg:{minwage:.34,youth:.26,sme:.16}},

 {id:'energy',ico:'⚡',name:'Enerji Fatura Desteği',cat:'Destek',kind:'spend',
  desc:'Hane ve küçük işletme faturalarına doğrudan destek. Fiyatı anında bastırır, bitince geri teper.',
  ref:25,min:5,max:70,def:25,dur:[6,12,24],defDur:12,
  fx:{demand:.055,supply:0,infl:-.055,unemp:-.008,wage:0,rebound:.035},ramp:{demand:1,supply:6},
  seg:{minwage:.40,retiree:.34,sme:.26}},

 {id:'vat',ico:'🧾',name:'Temel Gıdada KDV İndirimi',cat:'Destek',kind:'spend',
  desc:'Gıdada KDV iki puan düşer; etiketlere doğrudan yansır. Vergi geliri kaybı sürer.',
  ref:20,min:5,max:55,def:20,dur:[12,24,36,48],defDur:24,
  fx:{demand:.050,supply:0,infl:-.048,unemp:-.006,wage:0},ramp:{demand:1,supply:6},
  seg:{minwage:.40,retiree:.38,sme:.10}},

 {id:'pension',ico:'👴',name:'Emekli Aylığına Ek Destek',cat:'Destek',kind:'spend',
  desc:'En düşük emekli aylığına enflasyon üstü ilave. Talebi ve memnuniyeti artırır.',
  ref:30,min:5,max:80,def:30,dur:[6,12,24,36],defDur:12,
  fx:{demand:.105,supply:0,infl:.042,unemp:-.010,wage:.008},ramp:{demand:1,supply:6},
  seg:{retiree:.85,minwage:.14,capital:-.10}},

 {id:'austerity',ico:'✂️',name:'Kamuda Tasarruf Genelgesi',cat:'Maliye',kind:'save',
  desc:'Taşıt alımı, temsil-ağırlama ve yeni kadrolar durur. Bütçeyi rahatlatır, talebi soğutur.',
  ref:25,min:5,max:70,def:25,dur:[12,24,36,48],defDur:24,
  fx:{demand:-.085,supply:0,infl:-.012,unemp:.020,wage:0,cred:.085},ramp:{demand:2,supply:6},
  seg:{capital:.30,minwage:-.14,retiree:-.12}},

 {id:'agri',ico:'🌾',name:'Tarımsal Girdi Desteği',cat:'Gıda',kind:'spend',
  desc:'Gübre, mazot ve sulama desteği. Gıda arzını artırıp manşet enflasyonu doğrudan aşağı çeker.',
  ref:22,min:5,max:60,def:22,dur:[12,24,36,48],defDur:24,
  fx:{demand:.055,supply:.0037,infl:-.042,unemp:-.010},ramp:{demand:3,supply:12},
  seg:{sme:.26,minwage:.30,retiree:.24}},

 {id:'export',ico:'🚢',name:'İhracat ve Turizm Atağı',cat:'Dış Denge',kind:'spend',
  desc:'Eximbank kredisi, fuar ve tanıtım desteği. Döviz geliri getirir, cari açığı kapatır, rezervi besler.',
  ref:26,min:5,max:70,def:26,dur:[12,24,36,48],defDur:24,
  fx:{demand:.075,supply:.0048,infl:.014,unemp:-.026,current:.055},ramp:{demand:3,supply:11},
  seg:{capital:.46,sme:.24,youth:.12}},

 {id:'kgf',ico:'🏦',name:'Kredi Garanti Fonu',cat:'Finansman',kind:'spend',
  desc:'Devlet KOBİ kredilerine kefil olur. Faize dokunmadan kredi musluğunu açar — ama riski hazine taşır.',
  ref:20,min:5,max:60,def:20,dur:[6,12,24,36],defDur:12,
  fx:{demand:.060,supply:.0024,infl:.033,unemp:-.028,credit:.55},ramp:{demand:2,supply:9},
  seg:{sme:.62,capital:.22}},

 {id:'corp',ico:'🏢',name:'Kurumlar Vergisi İndirimi',cat:'Vergi',kind:'spend',
  desc:'Şirket kârlılığı artar, yatırım iştahı canlanır. Bedeli doğrudan vergi geliri kaybıdır.',
  ref:25,min:5,max:70,def:25,dur:[24,36,48],defDur:36,
  fx:{demand:.055,supply:.0071,infl:.011,unemp:-.020,revenue:-.020},ramp:{demand:4,supply:13},
  seg:{capital:.60,sme:.22,minwage:-.12}},

 {id:'audit',ico:'🔍',name:'Kayıt Dışıyla Mücadele',cat:'Vergi',kind:'save',
  desc:'Vergi denetimi ve dijital takip. Bütçeyi kalıcı düzeltir ama esnaf üstünde ciddi baskı yaratır.',
  ref:18,min:5,max:50,def:18,dur:[24,36,48],defDur:36,
  fx:{demand:-.030,supply:.0027,infl:-.006,unemp:.008,revenue:.055,cred:.060},ramp:{demand:3,supply:10},
  seg:{sme:-.54,capital:.20,minwage:.10}},

 {id:'rail',ico:'🚄',name:'Demiryolu ve Liman Ağı',cat:'Altyapı',kind:'spend',
  desc:'Yük taşımacılığı ve liman kapasitesi. Rampası çok uzun ama tamamlanınca kapasiteye kalıcı sıçrama.',
  ref:45,min:10,max:120,def:45,dur:[36,48],defDur:48,
  fx:{demand:.105,supply:.014,infl:.024,unemp:-.034,current:.030},ramp:{demand:5,supply:26},
  seg:{capital:.34,sme:.20,youth:.14}},

 {id:'urban',ico:'🏗️',name:'Kentsel Dönüşüm ve Güçlendirme',cat:'Konut',kind:'spend',
  desc:'Riskli yapı stokunu yeniler. Pahalı ve yavaş; ama bir afet gelirse hasarı yarıya indirir.',
  ref:50,min:10,max:120,def:50,dur:[36,48],defDur:48,
  fx:{demand:.120,supply:.0051,infl:.036,unemp:-.032,rent:-.018,insure:.020},ramp:{demand:4,supply:18},
  seg:{sme:.24,minwage:.26,youth:.14}},

 {id:'energyStore',ico:'🛢️',name:'Stratejik Enerji Depolama',cat:'Enerji',kind:'spend',
  desc:'Doğalgaz depolama ve uzun vadeli tedarik anlaşması. Şok gelmezse boşa para; gelirse hayat kurtarır.',
  ref:28,min:5,max:70,def:28,dur:[24,36,48],defDur:36,
  fx:{demand:.045,supply:.0041,infl:-.010,current:.025,insure:.035},ramp:{demand:3,supply:12},
  seg:{capital:.24,sme:.18}},

 {id:'child',ico:'👶',name:'Çocuk Yardımı ve Kreş Ağı',cat:'Sosyal',kind:'spend',
  desc:'Hane gelirini destekler, kadın istihdamını artırır. Demografik getirisini sen görmeyeceksin.',
  ref:32,min:5,max:80,def:32,dur:[24,36,48],defDur:36,
  fx:{demand:.090,supply:.0058,infl:.027,unemp:-.026,nairu:-.008},ramp:{demand:2,supply:22},
  seg:{minwage:.48,youth:.30,retiree:.10}},

 {id:'natal',ico:'👨‍👩‍👧‍👦',name:'Üç Çocuk Teşviki',cat:'Sosyal',kind:'spend',
  desc:'Üç ve üzeri çocuklu haneye aylık nakit destek, doğum yardımı ve eğitim ödeneği. Para doğrudan cebe girer — nüfus getirisini senden sonraki başkan görür.',
  ref:35,min:5,max:90,def:35,dur:[12,24,36,48],defDur:36,
  fx:{demand:.100,supply:.002,infl:.035,unemp:-.012,wage:.004,nairu:.006},ramp:{demand:2,supply:30},
  seg:{minwage:.44,retiree:.20,sme:.16,youth:.08}},

 {id:'marriage',ico:'💍',name:'25 Yaş Altı Evlilik Primi',cat:'Sosyal',kind:'spend',
  desc:'25 yaşından önce evlenen çifte faizsiz kredi ve tek seferlik ev kurma primi. Genç desteğini en hızlı toplayan paket — ama konut talebini ve kirayı bir anda şişirir.',
  ref:18,min:5,max:50,def:18,dur:[6,12,24,36],defDur:12,
  fx:{demand:.125,supply:-.002,infl:.04,unemp:-.008,rent:.018,nairu:.010,rebound:.018},ramp:{demand:1,supply:10},
  seg:{youth:.58,minwage:.22,sme:.18,capital:-.08}},

 {id:'kkm',ico:'🛡️',name:'Kur Korumalı Mevduat',cat:'Finansman',kind:'spend',
  desc:'Mevduat sahibine kur farkı garantisi. Kuru kısa vadede bastırır — ama fark hazineden ödenir ve bastırılan baskı biriktikçe çıkışı pahalıya patlar.',
  ref:30,min:10,max:80,def:30,dur:[12,24,36],defDur:24,
  fx:{demand:.030,supply:0,infl:.010,fx:-.014,rebound:.030},ramp:{demand:2,supply:6},
  seg:{retiree:.16,capital:.20,sme:.10}},

 {id:'macropru',ico:'💳',name:'Makro İhtiyati Tedbir',cat:'Finansman',kind:'save',
  desc:'Kredi kartı taksit sınırı ve tüketici kredisi vadesi kısıtı. Bütçeye tek kuruş yük bindirmez.',
  ref:8,min:2,max:20,def:8,dur:[6,12,24,36],defDur:12,
  fx:{demand:-.180,supply:0,infl:-.026,unemp:.030,credit:-.85,current:.035},ramp:{demand:2,supply:6},
  seg:{sme:-.40,minwage:-.22,capital:.14}},

 {id:'transparency',ico:'⚖️',name:'İhale Şeffaflığı Reformu',cat:'Kurumsal',kind:'save',
  desc:'Kamu alımlarında açık veri ve denetim. Bütçeye neredeyse bedelsiz, ama parti içinde bedeli ağır.',
  ref:6,min:2,max:18,def:6,dur:[24,36,48],defDur:36,
  fx:{demand:-.015,supply:.0037,infl:-.004,revenue:.030,cred:.115,integrity:.085},ramp:{demand:3,supply:10},
  seg:{capital:.34,youth:.22,sme:.10}},

 {id:'rentcap',ico:'🔑',name:'Kira Zam Sınırı',cat:'Konut',kind:'reg',
  desc:'Yenilenen kira sözleşmelerinde zam yıllık TÜFE ile sınırlanır. Bütçeden para çıkmaz — bedeli konut arzında ve ev sahiplerinin desteğinde ödenir.',
  ref:1,min:1,max:1,def:1,dur:[12,24,36,48],defDur:24,
  fx:{demand:.020,supply:-.0022,infl:-.026,unemp:0,rebound:.030},ramp:{demand:1,supply:6},
  seg:{minwage:.46,youth:.52,retiree:.30,sme:-.18,capital:-.34}},

 {id:'wage',ico:'💰',name:'Asgari Ücrete Ara Zam',cat:'Ücret',kind:'wage',
  desc:'Takvim dışı ek zam. Sokağı hızla rahatlatır; ama beklenti çıpasını bozar ve bir sonraki yılbaşı turunda sendikayı güçlendirir. Yılda bir kez, ocak ayı dışında.',
  ref:12,min:0,max:40,def:12,dur:[1],defDur:1,unit:'%',
  fx:{},seg:{}}
];
export const POL=id=>POLICIES.find(p=>p.id===id);
export const has=id=>S.active.some(a=>a.id===id);
/* ödenek ölçeği: azalan verim */
export const kOf=(P,amt)=>P.kind==='reg'?1:Math.pow(clamp(amt,0.001,999)/P.ref,0.75);
