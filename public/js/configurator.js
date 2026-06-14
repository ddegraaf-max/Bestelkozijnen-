/* ============ PRODUCTDATA ============ */
const LIJNEN = {
  kunststof: [
    { id:'IGLO 5', label:'IGLO 5 (standaard)', uw:'0,83', kamers:'5', diepte:'70 mm' },
    { id:'IGLO LIGHT', label:'IGLO LIGHT (slank)', uw:'0,88', kamers:'5', diepte:'70 mm' },
    { id:'IDEAL NEO MD', label:'IDEAL NEO MD (Aluplast)', uw:'0,76', kamers:'6', diepte:'76 mm' },
    { id:'IDEAL 7000 NL', label:'IDEAL 7000 NL (blokprofiel 84 mm)', uw:'—', kamers:'6', diepte:'84 mm' },
    { id:'IDEAL 7000 NL aanslag', label:'IDEAL 7000 NL (met aanslag, ± 20 mm extra)', uw:'—', kamers:'6', diepte:'± 104 mm', aanslag:true },
    { id:'IGLO ENERGY', label:'IGLO ENERGY (energiezuinig)', uw:'0,71', kamers:'7', diepte:'82 mm' },
    { id:'IGLO EDGE', label:'IGLO EDGE (premium)', uw:'0,66', kamers:'7', diepte:'82 mm' },
    { id:'IGLO-HS', label:'IGLO-HS (hefschuif)', uw:'0,71', kamers:'7', diepte:'194 mm', schuif:true },
    { id:'IGLO-HS ALUCOVER', label:'IGLO-HS ALUCOVER (hefschuif)', uw:'0,73', kamers:'7', diepte:'194 mm', schuif:true },
    { id:'IGLO EDGE SLIDE', label:'IGLO EDGE SLIDE (schuif)', uw:'0,65', kamers:'7', diepte:'82 mm', schuif:true },
    { id:'IGLO SLIDE', label:'IGLO SLIDE (voordelig schuif)', uw:'—', kamers:'3', diepte:'82 mm', schuif:true },
    { id:'IGLO ENERGY PSK', label:'IGLO ENERGY PSK (kiep-schuif)', uw:'0,66', kamers:'7', diepte:'82 mm', schuif:true },
    { id:'IGLO 5 PSK', label:'IGLO 5 PSK (kiep-schuif)', uw:'0,81', kamers:'5', diepte:'70 mm', schuif:true },
    { id:'IGLO LIGHT PSK', label:'IGLO LIGHT PSK (kiep-schuif)', uw:'0,84', kamers:'5', diepte:'70 mm', schuif:true }
  ],
  hout: [
    { id:'SOFTLINE 68', label:'SOFTLINE 68 (hout, standaard)', uw:'1,27', kamers:'—', diepte:'68 mm' },
    { id:'SOFTLINE 78', label:'SOFTLINE 78 (hout)', uw:'0,90', kamers:'—', diepte:'78 mm' },
    { id:'SOFTLINE 88', label:'SOFTLINE 88 (hout, premium)', uw:'0,76', kamers:'—', diepte:'88 mm' },
    { id:'DUOLINE 68', label:'DUOLINE 68 (hout-aluminium)', uw:'0,90', kamers:'—', diepte:'82 mm' },
    { id:'DUOLINE 78', label:'DUOLINE 78 (hout-aluminium)', uw:'0,80', kamers:'—', diepte:'92 mm' },
    { id:'DUOLINE 88', label:'DUOLINE 88 (hout-aluminium, premium)', uw:'0,79', kamers:'—', diepte:'102 mm' },
    { id:'SOFTLINE HS', label:'SOFTLINE HS (hefschuif, hout)', uw:'0,79', kamers:'—', diepte:'164/184/204 mm', schuif:true },
    { id:'DUOLINE HS', label:'DUOLINE HS (hefschuif, hout-alu)', uw:'0,75', kamers:'—', diepte:'194/214/234 mm', schuif:true },
    { id:'SOFTLINE 68 VOUW', label:'SOFTLINE 68 vouwwand (hout)', uw:'1,04', kamers:'—', diepte:'68 mm', schuif:true },
    { id:'SOFTLINE PSK', label:'SOFTLINE PSK (kiep-schuif, hout)', uw:'0,73', kamers:'—', diepte:'68/78/88 mm', schuif:true },
    { id:'DUOLINE PSK', label:'DUOLINE PSK (kiep-schuif, hout-alu)', uw:'0,71', kamers:'—', diepte:'82/92 mm', schuif:true }
  ],
  aluminium: [
    { id:'MB-79N', label:'MB-79N (geïsoleerd, voordelig)', uw:'0,79', kamers:'3', diepte:'70 mm' },
    { id:'MB-86N', label:'MB-86N (geïsoleerd, premium)', uw:'0,76', kamers:'3', diepte:'77 mm' },
    { id:'MB-70HI', label:'MB-70HI (geïsoleerd)', uw:'0,96', kamers:'3', diepte:'70 mm' },
    { id:'MB-70', label:'MB-70 (standaard)', uw:'—', kamers:'3', diepte:'70 mm' },
    { id:'MB-45', label:'MB-45 (binnen / zonder isolatie)', uw:'—', kamers:'1', diepte:'45 mm' },
    { id:'MB-77HS', label:'MB-77HS HI (hefschuif)', uw:'1,0', kamers:'3', diepte:'174 mm', schuif:true },
    { id:'MB-77HS MONORAIL', label:'MB-77HS HI Monorail (hefschuif)', uw:'0,75', kamers:'3', diepte:'174 mm', schuif:true },
    { id:'MB-59HS', label:'MB-59HS HI (hefschuif)', uw:'—', kamers:'—', diepte:'—', schuif:true },
    { id:'MB-SLIDE', label:'MB-SLIDE (schuif)', uw:'—', kamers:'—', diepte:'—', schuif:true },
    { id:'COR-VISION', label:'COR-VISION (slank schuif)', uw:'—', kamers:'—', diepte:'—', schuif:true },
    { id:'COR-VISION PLUS', label:'COR-VISION PLUS (hefschuif)', uw:'—', kamers:'—', diepte:'—', schuif:true },
    { id:'MB-86 VOUWLIJN', label:'MB-86 Vouwlijn HD (vouwwand)', uw:'1,1', kamers:'3', diepte:'86 mm', schuif:true },
    { id:'MB-70 PSK', label:'MB-70/70HI PSK (kiep-schuif)', uw:'—', kamers:'—', diepte:'—', schuif:true }
  ]
};
const FUNCTIES = {
  'vast':{label:'Vast (FIX)',sym:'vast'}, 'draaikiep-l':{label:'Draaikiep links',sym:'kiepL'}, 'draaikiep-r':{label:'Draaikiep rechts',sym:'kiepR'},
  'draai-l':{label:'Draai links',sym:'draaiL'}, 'draai-r':{label:'Draai rechts',sym:'draaiR'},
  'deur-l':{label:'Deur (links draaiend)',sym:'deurL',deur:true}, 'deur-r':{label:'Deur (rechts draaiend)',sym:'deurR',deur:true},
  'schuif-l':{label:'Schuivend (naar links)',sym:'schuifL',schuif:true}, 'schuif-r':{label:'Schuivend (naar rechts)',sym:'schuifR',schuif:true}
};
const RAAM_FN=['vast','draaikiep-l','draaikiep-r','draai-l','draai-r'];
const SCHUIF_FN=['vast','schuif-l','schuif-r'];
const SCHUIFSCHEMA=[
  {id:'2A',  label:'2-delig · 1 actief (links schuift)',   delen:['schuif-r','vast']},
  {id:'2Ar', label:'2-delig · 1 actief (rechts schuift)',  delen:['vast','schuif-l']},
  {id:'2C',  label:'2-delig · 2 actief (midden open)',     delen:['schuif-l','schuif-r']},
  {id:'3L',  label:'3-delig · links actief',               delen:['schuif-r','vast','vast']},
  {id:'3R',  label:'3-delig · rechts actief',              delen:['vast','vast','schuif-l']},
  {id:'3G',  label:'3-delig · 2 actief (midden vast)',     delen:['schuif-r','vast','schuif-l']},
  {id:'4K',  label:'4-delig · midden open (2 actief)',     delen:['vast','schuif-l','schuif-r','vast']}
];
const RIJ_VALS=['geen','heel','perVak'], RIJ_LBL=['Geen','Eén vak','Per vleugel'];
const rijTekst=m=>({geen:'geen',heel:'één vak',perVak:'per vleugel'}[m]);

const KLEUREN=[
  {label:'Wit',hex:'#F2F2EF'},{label:'Crème (RAL 9001)',hex:'#EFE9DA'},{label:'Grijs (RAL 7040)',hex:'#9CA0A1'},
  {label:'Antraciet (RAL 7016)',hex:'#363B3E'},{label:'Zwart (RAL 9005)',hex:'#17191C'},{label:'Dennengroen (RAL 6009)',hex:'#2F4034'},
  {label:'Staalblauw (RAL 5011)',hex:'#23303B'},{label:'Gouden eiken',hex:'#B5803F'},{label:'Donker eiken',hex:'#5C3D22'},
  {label:'Mahonie',hex:'#6E3326'},{label:'Noten',hex:'#4A3526'},{label:'RAL naar keuze',hex:'#9AA0A6'}
];
const AFDICHTING_MAP={kunststof:['Zwart','Grijs'],hout:['Wit','Bruin','Zwart'],aluminium:['Zwart','Grijs']};
const afdichtingFor=()=>AFDICHTING_MAP[state.materiaal]||AFDICHTING_MAP.kunststof;
const KERN=['Wit','Bruin','Antraciet'];
const GLAZEN=['HR++ dubbel (Ug 1,1)','Triple HR+++ (Ug 0,5)','Geluidwerend','Veiligheid/gelaagd','Zonwerend (Antisol)','Ornament','Gezandstraald','Melkglas (mat, badkamer)'];
const GLASLAT=['Standaard (rond)','Kantig'];
const KRUKKEN=['Aluminium standaard','Secustik','RVS-look','Zwart','Goud-look','Wit'];
const KRUKKLEUR=['#b9bcbe','#9a9da0','#c9cdcf','#1d1d1b','#b8923f','#FBFBF9'];
const DEURBESLAG=['GU Secury Automatic (SKG**)','GU Secury + ABUS-cilinder','Meerpuntssluiting standaard'];
const DORPELS=['Aluminium dorpel','Kaltefein tochtweerder','BUVA Isostone (lage drempel)','BUVA dorpel'];
const ROEDETYPES=['Geen','Opgeplakt (Wienersprosse)','In het glas (aluminium)'];
const ROEDEPATRONEN=['Verticaal 1×','Kruis 2-vaks','Kruis 4-vaks','Georgian 6-vaks'];
const VENTILATIE=['Geen','Aereco zelfregelend','Renson','Maco Ventyl'];
/* voordeur */
const PANEEL_MAT=['PVC (wit)','ABS (houtnerf)'];
const DEUR_DIKTE=['24 mm','28 mm','36 mm','44 mm','48 mm'];
const DEUR_COLLECTIES=['Standard','Modern','Deco','Econo','Glass'];
const _seq=(p,a,b)=>{const r=[];for(let i=a;i<=b;i++)r.push(p+String(i).padStart(2,'0'));return r;};
const DEUR_MODELLEN={
  Standard:['ST-01','ST-01/2','ST-02','ST-02/2','ST-02/2S','ST-02/8','ST-03','ST-03/1','ST-04','ST-04/1','ST-05','ST-05/1','ST-07','ST-07/1','ST-07/3','ST-11','ST-11/1','ST-13','ST-13/1','ST-14','ST-14/1','ST-15','ST-15/1','ST-17','ST-17/6','ST-20','ST-20/1','ST-25','ST-25/1','ST-25/3','ST-26','ST-27','ST-28','ST-28/1','ST-29/1'],
  Modern:_seq('MD-',6,44),
  Deco:_seq('DE-',1,8),
  Econo:['EC-01','EC-02','EC-02S1','EC-02S2','EC-02S3','EC-02S8','EC-03','EC-04','EC-04S4','EC-04S5','EC-04S6','EC-04/6',..._seq('EC-',5,53)],
  Glass:_seq('GS-',1,60)
};
const PANEEL_SITE='https://besteldeurpanelenopmaat.nl/deurpanelen/';
const PANEEL_SLUG={Standard:'standard',Modern:'modern',Deco:'deco',Econo:'econo',Glass:'glass'};
const SCHARNIER=['Links','Rechts'], OPENDRAAI=['Naar binnen','Naar buiten'], ZIJLICHT=['Geen','Links','Rechts','Beide'], BOVENL_DEUR=['Geen','Eén vak'];
const ZIJLICHT_GLAS=['Helder glas','Mat / gezandstraald','Met roede','Dicht paneel'];
// deur-indeling: dt=dubbel?, bl=bovenlicht?, zl=zijlicht(0 geen/1 links/2 rechts/3 beide), dz=dubbel zijlicht?
const DEURSCHEMA=[
  {id:'d1', label:'Enkele deur',                              dt:0,bl:0,zl:0,dz:0},
  {id:'d2', label:'Enkele deur met bovenlicht',               dt:0,bl:1,zl:0,dz:0},
  {id:'d3', label:'Enkele deur · zijlicht rechts',            dt:0,bl:0,zl:2,dz:0},
  {id:'d4', label:'Enkele deur · dubbel zijlicht rechts',     dt:0,bl:0,zl:2,dz:1},
  {id:'d5', label:'Enkele deur · zijlicht links',             dt:0,bl:0,zl:1,dz:0},
  {id:'d6', label:'Enkele deur · dubbel zijlicht links',      dt:0,bl:0,zl:1,dz:1},
  {id:'d7', label:'Dubbele deuren',                           dt:1,bl:0,zl:0,dz:0},
  {id:'d8', label:'Dubbele deuren met bovenlicht',            dt:1,bl:1,zl:0,dz:0},
  {id:'d9', label:'Dubbele deuren · zijlichten beide',        dt:1,bl:0,zl:3,dz:0},
  {id:'d10',label:'Dubbele deuren · dubbel zijlicht beide',   dt:1,bl:0,zl:3,dz:1},
  {id:'d11',label:'Dubbele deur · bovenlicht + zijlicht rechts',dt:1,bl:1,zl:2,dz:0},
  {id:'d12',label:'Dubbele deur · bovenlicht + dubbel zijlicht rechts',dt:1,bl:1,zl:2,dz:1},
  {id:'d13',label:'Dubbele deur · bovenlicht + zijlicht links',dt:1,bl:1,zl:1,dz:0},
  {id:'d14',label:'Dubbele deur · bovenlicht + dubbel zijlicht links',dt:1,bl:1,zl:1,dz:1}
];
const _MFC='#b9bcbe';
function _mc(x,y,w,h){return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e9eff1" stroke="${_MFC}" stroke-width="2"/>`;}
function _sideM(x,y,w,h,dz){ if(!dz) return _mc(x,y,w,h); const hh=(h-2)/2; return _mc(x,y,w,hh)+_mc(x,y+hh+2,w,hh); }
function _leafM(x,y,w,h,hs){ let s=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f4f4f2" stroke="${_MFC}" stroke-width="2"/>`;
  const hx=hs==='r'?x+w-5:x+3; s+=`<rect x="${hx}" y="${y+h*0.5-6}" width="2.5" height="12" rx="1" fill="#3a3a38"/>`;
  s+=`<line x1="${x+2}" y1="${y+h-2}" x2="${x+w-2}" y2="${y+2}" stroke="${_MFC}" stroke-width="1" opacity=".5"/>`; return s;}
function miniDeur(sc){
  const W=120,H=104,P=4; let s=`<svg viewBox="0 0 ${W} ${H}">`; let top=P;
  if(sc.bl){ s+=_mc(P,P,W-2*P,15); top=P+15+3; }
  const rowY=top, rowH=H-top-P, sideW=18, gap=3;
  const hasL=sc.zl===1||sc.zl===3, hasR=sc.zl===2||sc.zl===3, cols=(hasL?1:0)+(hasR?1:0);
  const doorW=(W-2*P)-cols*(sideW+gap); let x=P;
  if(hasL){ s+=_sideM(x,rowY,sideW,rowH,sc.dz); x+=sideW+gap; }
  if(sc.dt){ const lw=(doorW-2)/2; s+=_leafM(x,rowY,lw,rowH,'r')+_leafM(x+lw+2,rowY,lw,rowH,'l'); }
  else s+=_leafM(x,rowY,doorW,rowH,'r');
  x+=doorW+gap;
  if(hasR){ s+=_sideM(x,rowY,sideW,rowH,sc.dz); }
  return s+`</svg>`;
}
const DEUR_GLASSOORT=['Dicht paneel (geen glas)','Sierglas','Glas-in-lood','Gezandstraald'];
const SIERGLAS=['Altdeutsch Bronze','Altdeutsch Clear','Antisol Brown','Brown Chinchilla','Clear Cura','Crepi','Cura','Delta Clear','Delta Matt','Fluttes Sandblasted','Kathedral Clear','Master Carre','Master Linge','Master Point','Mirastar','Niagara','Reflex Brown','Reflex Graphite','Reflex Silver','Sandblasted Glass','Satinato','Thermofloat','VSG Matt','White Chinchilla','Ander (op aanvraag)'];
const GLASINLOOD=['012 Abstract','012 Arcade','012 Classic','012 Hummingbird','012 Raute','012 Twist','021 Butterfly','021 Horizon','021 Kala','021 Toera','211 Diami','Decorglass 012 Leaves','Decorglass 012 Tulip','Decorglass 031 Rose','Decorglass 041 Symphony','Decorglass 091 Wave','Decorglass 151 Harmony','Decorglass 211 Flora','Decorglass 241 Flora','Ander (op aanvraag)'];
const SANDGLAS=['Sand 01','Sand 02','Sand 03','Sand 04','Sand 05','Sand 06','Sand 07','Sand 08','Sand 09','Ander (op aanvraag)'];
const GREEP=['Deurkruk','RVS-trekker recht','RVS-trekker schuin','Greeplijst verticaal','Knop + kruk'];
const SCHUIF_GREEP=['FKS enkele klink','FKS eenzijdig kruk + eenzijdig cilinder','FKS dubbelzijdige klink met inzetstuk','FKS dubbelzijdige handgreep + eenzijdig inzetstuk'];
const SCHUIF_SLOT=['Standaard','ABUS SKG** Klasse D (met noodopening)','ABUS SKG** Klasse D met knop','DOM Plura SKG*** (met noodopening)'];
const _BM={body:'#c7cacc',lite:'#dfe2e3',plate:'#d3d6d8',str:'#8b8e90'};
function icHandle(o={}){let s=`<svg viewBox="0 0 64 60">`;
  s+=`<rect x="28" y="9" width="9" height="19" rx="4" fill="${_BM.plate}" stroke="${_BM.str}"/>`;
  s+=`<g transform="rotate(33 32 25)"><rect x="13" y="21" width="25" height="8" rx="4" fill="${_BM.body}" stroke="${_BM.str}"/></g>`;
  if(o.cyl)s+=`<circle cx="32" cy="41" r="5" fill="${_BM.lite}" stroke="${_BM.str}"/><rect x="31" y="43" width="2" height="8" rx="1" fill="${_BM.str}"/>`;
  if(o.insert)s+=`<rect x="41" y="33" width="12" height="17" rx="2" fill="${_BM.lite}" stroke="${_BM.str}"/><circle cx="47" cy="41" r="2.2" fill="${_BM.str}"/>`;
  return s+`</svg>`;}
function icGrip(o={}){let s=`<svg viewBox="0 0 64 60">`;
  s+=`<rect x="28" y="9" width="7" height="42" rx="3.5" fill="${_BM.body}" stroke="${_BM.str}"/>`;
  s+=`<rect x="25" y="9" width="13" height="6" rx="3" fill="${_BM.plate}" stroke="${_BM.str}"/><rect x="25" y="45" width="13" height="6" rx="3" fill="${_BM.plate}" stroke="${_BM.str}"/>`;
  if(o.insert)s+=`<rect x="42" y="22" width="12" height="17" rx="2" fill="${_BM.lite}" stroke="${_BM.str}"/><circle cx="48" cy="30" r="2.2" fill="${_BM.str}"/>`;
  return s+`</svg>`;}
function icStd(){return `<svg viewBox="0 0 64 60"><rect x="11" y="19" width="42" height="22" rx="4" fill="#eef2f4" stroke="${_BM.str}"/><text x="32" y="35" font-family="JetBrains Mono,monospace" font-size="13" font-weight="700" fill="#5a5d5f" text-anchor="middle">STD</text></svg>`;}
function icCyl(o={}){let s=`<svg viewBox="0 0 64 60">`;
  s+=`<rect x="9" y="26" width="${o.knob?38:46}" height="11" rx="3" fill="${_BM.body}" stroke="${_BM.str}"/>`;
  s+=`<circle cx="28" cy="31" r="9" fill="${_BM.lite}" stroke="${_BM.str}"/><circle cx="28" cy="31" r="2.6" fill="${_BM.str}"/><circle cx="15" cy="31" r="1.8" fill="${_BM.str}"/>`;
  s+= o.knob?`<circle cx="49" cy="31" r="8" fill="${_BM.plate}" stroke="${_BM.str}"/><rect x="48" y="27" width="2" height="8" rx="1" fill="${_BM.str}"/>`:`<circle cx="44" cy="31" r="1.8" fill="${_BM.str}"/>`;
  if(o.stars)s+=`<text x="32" y="50" font-family="JetBrains Mono,monospace" font-size="9" fill="#b8923f" text-anchor="middle">★★★</text>`;
  return s+`</svg>`;}
const SCHUIF_GREEP_IC=[icHandle(),icHandle({cyl:1}),icHandle({insert:1}),icGrip({insert:1})];
const SCHUIF_SLOT_IC=[icStd(),icCyl(),icCyl({knob:1}),icCyl({stars:1})];
function icBar(a){return `<svg viewBox="0 0 64 60"><g transform="rotate(${a||0} 32 30)"><rect x="29" y="9" width="6" height="42" rx="3" fill="${_BM.body}" stroke="${_BM.str}"/><rect x="26" y="10" width="12" height="5" rx="2.5" fill="${_BM.plate}" stroke="${_BM.str}"/><rect x="26" y="46" width="12" height="5" rx="2.5" fill="${_BM.plate}" stroke="${_BM.str}"/></g></svg>`;}
function icStrip(){return `<svg viewBox="0 0 64 60"><rect x="29" y="6" width="6" height="48" rx="3" fill="${_BM.body}" stroke="${_BM.str}"/><circle cx="32" cy="14" r="1.4" fill="${_BM.str}"/><circle cx="32" cy="46" r="1.4" fill="${_BM.str}"/></svg>`;}
function icKnobLever(){return `<svg viewBox="0 0 64 60"><circle cx="32" cy="15" r="8" fill="${_BM.plate}" stroke="${_BM.str}"/><rect x="29" y="22" width="6" height="9" rx="3" fill="${_BM.plate}" stroke="${_BM.str}"/><g transform="rotate(33 32 37)"><rect x="17" y="33" width="22" height="7" rx="3.5" fill="${_BM.body}" stroke="${_BM.str}"/></g></svg>`;}
function icDorpel(o={}){const top=o.low?44:39;const fill=o.stone?'#dcd6c8':_BM.body;let s=`<svg viewBox="0 0 64 60">`;
  s+=`<line x1="6" y1="50" x2="58" y2="50" stroke="${_BM.str}" stroke-width="1" opacity=".35"/>`;
  s+=`<rect x="20" y="13" width="24" height="${top-15}" rx="2" fill="${_BM.lite}" stroke="${_BM.str}"/>`;
  s+=`<rect x="13" y="${top}" width="38" height="${50-top}" rx="2" fill="${fill}" stroke="${_BM.str}"/>`;
  s+=`<line x1="32" y1="${top}" x2="32" y2="50" stroke="${_BM.str}" stroke-width=".7" opacity=".5"/>`;
  if(o.brush){s+=`<rect x="23" y="${top-5}" width="18" height="5" fill="#a7aaac"/>`;for(let x=24;x<41;x+=2)s+=`<line x1="${x}" y1="${top-5}" x2="${x}" y2="${top}" stroke="#6c6f71" stroke-width=".5"/>`;}
  return s+`</svg>`;}
const GREEP_IC=[icHandle(),icBar(0),icBar(20),icStrip(),icKnobLever()];
const DORPEL_IC=[icDorpel(),icDorpel({brush:1}),icDorpel({low:1,stone:1}),icDorpel({low:1})];

const STEPS=['Profiel','Indeling','Kleur','Glas','Beslag','Opties','Inmeten','Overzicht'];

const state={
  positie:'', materiaal:'kunststof', product:'raam', lijn:'IGLO 5',
  bovenlicht:'geen', borstwering:'geen', bovenlichtH:400, borstweringH:400, vakken:[{functie:'draaikiep-r',glas:null}],
  paneelMat:0, dikte:1, collectie:'Standard', model:'ST-01', scharnier:0, opendraai:0, deurType:0, zijlicht:0, zijlichtDubbel:false, zijlichtGlas:0, bovenlichtDeur:false, bovenlichtDeurH:400, zijlichtB:350, glassoort:0, patroon:'', paneelOnly:false,
  kleurBuiten:0, kleurBinnen:0, gelijkeKleur:true, afdichting:0, kern:0,
  glas:1, glaslat:0, warmeRand:true,
  kruk:0, greep:0, sleutel:false, rc2:false, scharnieren:false, deurBeslag:0, dorpel:0,
  roedeType:0, roedePatroon:1, ventilatie:0, rolluik:false, hor:false, screen:false, smartHome:false,
  brievenbus:false, spion:false, huisnummer:false,
  aanzicht:'binnen', veiligheidsglas:false, laagGlas:false,
  breedte:1500, hoogte:1400, breedteBuiten:1500, hoogteBuiten:1400, gelijkeMaat:true, montage:false, aantal:1
};
let step=0, cart=[];
try{ cart=JSON.parse(localStorage.getItem('bko_cart')||'[]'); }catch(e){}

const $=id=>document.getElementById(id);
function saveCart(){ try{ localStorage.setItem('bko_cart',JSON.stringify(cart)); }catch(e){} }
function toast(msg,ok=true){ const t=$('toast'); t.innerHTML=(ok?'<span class="ok">&#10003;</span> ':'')+msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2800); }
const isRaam=()=>state.product==='raam', isSchuif=()=>state.product==='schuif', isVoordeur=()=>state.product==='voordeur';
const isPaneelOnly=()=>isVoordeur()&&state.paneelOnly;
const hasDeur=()=>state.vakken.some(v=>FUNCTIES[v.functie].deur);
const lijnenFor=mat=>LIJNEN[mat].filter(l=>!!l.schuif===isSchuif());
const functiesFor=()=>isSchuif()?SCHUIF_FN:RAAM_FN;
const minVak=()=>isSchuif()?2:1;
const curW=()=>state.aanzicht==='buiten'?(state.gelijkeMaat?state.breedte:state.breedteBuiten):state.breedte;
const curH=()=>state.aanzicht==='buiten'?(state.gelijkeMaat?state.hoogte:state.hoogteBuiten):state.hoogte;

/* ============ tekening ============ */
function shade(hex,p){ const n=parseInt(hex.slice(1),16); let r=Math.max(0,Math.min(255,(n>>16)+p)),g=Math.max(0,Math.min(255,((n>>8)&255)+p)),b=Math.max(0,Math.min(255,(n&255)+p)); return '#'+((r<<16)|(g<<8)|b).toString(16).padStart(6,'0'); }
const isDark=hex=>['#363B3E','#17191C','#2F4034','#23303B','#5C3D22','#6E3326','#4A3526'].includes(hex);
let GID='g0';
function defs(frameC){ const lo=shade(frameC,20),hi=shade(frameC,-22);
  return `<defs>
  <linearGradient id="gl${GID}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#d9e7ed"/><stop offset=".5" stop-color="#eff5f6"/><stop offset="1" stop-color="#cfdfe3"/></linearGradient>
  <linearGradient id="fr${GID}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lo}"/><stop offset=".55" stop-color="${frameC}"/><stop offset="1" stop-color="${hi}"/></linearGradient>
  <filter id="blur${GID}" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="6"/></filter></defs>`; }
function paneSym(sym,x,y,w,h,c){
  const d=`stroke="${c}" stroke-width="1.3" stroke-dasharray="4 3" fill="none"`; let s=''; const ay=y+h/2;
  if(sym==='draaiL'||sym==='kiepL'||sym==='deurL') s+=`<path d="M${x+w} ${y+4} L${x+4} ${y+h/2} L${x+w} ${y+h-4}" ${d}/>`;
  if(sym==='draaiR'||sym==='kiepR'||sym==='deurR') s+=`<path d="M${x} ${y+4} L${x+w-4} ${y+h/2} L${x} ${y+h-4}" ${d}/>`;
  if(sym==='kiepL'||sym==='kiepR') s+=`<path d="M${x+4} ${y+h-4} L${x+w/2} ${y+4} L${x+w-4} ${y+h-4}" ${d}/>`;
  if(sym==='vast') s+=`<rect x="${x+w/2-7}" y="${y+h/2-7}" width="14" height="14" rx="2" fill="none" stroke="${c}" stroke-width="1" opacity=".5"/>`;
  if(sym==='schuifR') s+=`<line x1="${x+w*0.32}" y1="${ay}" x2="${x+w*0.68}" y2="${ay}" stroke="${c}" stroke-width="1.6"/><path d="M${x+w*0.68} ${ay} l-7 -5 m7 5 l-7 5" stroke="${c}" stroke-width="1.6" fill="none"/>`;
  if(sym==='schuifL') s+=`<line x1="${x+w*0.32}" y1="${ay}" x2="${x+w*0.68}" y2="${ay}" stroke="${c}" stroke-width="1.6"/><path d="M${x+w*0.32} ${ay} l7 -5 m-7 5 l7 5" stroke="${c}" stroke-width="1.6" fill="none"/>`;
  return s;
}
function roedeLines(x,y,w,h,c){
  if(state.roedeType===0||isVoordeur()) return '';
  const p=state.roedePatroon,L=[];
  const vx=n=>{for(let i=1;i<n;i++)L.push(`<line x1="${x+w*i/n}" y1="${y}" x2="${x+w*i/n}" y2="${y+h}" stroke="${c}" stroke-width="2"/>`);};
  const hy=n=>{for(let i=1;i<n;i++)L.push(`<line x1="${x}" y1="${y+h*i/n}" x2="${x+w}" y2="${y+h*i/n}" stroke="${c}" stroke-width="2"/>`);};
  if(p===0){vx(2);}else if(p===1){vx(2);hy(2);}else if(p===2){vx(2);hy(2);}else{vx(2);hy(3);}
  return L.join('');
}
function glassPane(x,y,w,h,stroke){
  let s=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#gl${GID})"/>`;
  s+=`<rect x="${x}" y="${y+h*0.6}" width="${w}" height="${h*0.4}" fill="#b9ad8e" opacity=".05"/>`;
  s+=`<polygon points="${x},${y+h*0.58} ${x+w*0.42},${y} ${x+w*0.6},${y} ${x},${y+h*0.82}" fill="#fff" opacity=".16"/>`;
  s+=`<polygon points="${x+w*0.74},${y+h} ${x+w},${y+h*0.6} ${x+w},${y+h*0.76} ${x+w*0.88},${y+h}" fill="#fff" opacity=".07"/>`;
  s+=`<rect x="${x}" y="${y}" width="${w}" height="3.5" fill="#000" opacity=".05"/>`;
  s+=roedeLines(x,y,w,h,'rgba(110,118,120,.55)');
  s+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${stroke}"/>`;
  return s;
}
function paneFixed(x,y,w,h,frameC,stroke){
  const bd=Math.max(2,Math.min(w,h)*0.03);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#fr${GID})"/>`+glassPane(x+bd,y+bd,w-2*bd,h-2*bd,stroke);
}
function paneSash(x,y,w,h,frameC,stroke,thin){
  const sd=Math.max(3,Math.min(w,h)*(thin?0.04:0.06));
  let s=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#fr${GID})" stroke="${stroke}"/>`;
  s+=`<rect x="${x+0.8}" y="${y+0.8}" width="${w-1.6}" height="${h-1.6}" fill="none" stroke="rgba(255,255,255,.14)"/>`;
  const gx=x+sd,gy=y+sd,gw=w-2*sd,gh=h-2*sd;
  s+=`<rect x="${gx-1.5}" y="${gy-1.5}" width="${gw+3}" height="${gh+3}" fill="#000" opacity=".06"/>`;
  s+=glassPane(gx,gy,gw,gh,stroke);
  return s;
}
function beslagMarks(sym,x,y,w,h){
  if(!/^(kiep|draai|deur)/.test(sym)) return '';
  if(state.aanzicht==='buiten') return ''; // hendel/scharnieren alleen bij binnenaanzicht
  const handleLeft=sym.endsWith('L'), hcol=KRUKKLEUR[state.kruk]; let o='';
  // hendel aan de openingszijde (zijde van het draai/kiep-symbool)
  const hh=Math.max(16,h*0.13), hx=handleLeft?x+4:x+w-7, hy=y+h*0.5-hh/2, hs='stroke="rgba(0,0,0,.28)" stroke-width="0.6"';
  o+=`<rect x="${hx-1.5}" y="${hy+hh-3}" width="7" height="4" rx="1.5" fill="${hcol}" ${hs}/>`;
  o+=`<rect x="${hx}" y="${hy}" width="4" height="${hh}" rx="2" fill="${hcol}" ${hs}/>`;
  o+=`<rect x="${hx-1.5}" y="${hy-3}" width="9" height="4" rx="2" fill="${hcol}" ${hs}/>`;
  // scharnieren aan de overkant (scharnierzijde)
  const hingeRightSide=handleLeft; // scharnieren tegenover de hendel
  const hg=hingeRightSide?x+w-4.5:x+1.5;
  if(state.scharnieren){
    o+=`<line x1="${hingeRightSide?x+w-1.5:x+1.5}" y1="${y+5}" x2="${hingeRightSide?x+w-1.5:x+1.5}" y2="${y+h-5}" stroke="${hcol}" stroke-width="1.6" opacity=".5"/>`;
  } else {
    o+=`<rect x="${hg}" y="${y+h*0.10}" width="3" height="14" rx="1" fill="${hcol}" ${hs}/>`;
    o+=`<rect x="${hg}" y="${y+h*0.82}" width="3" height="14" rx="1" fill="${hcol}" ${hs}/>`;
  }
  return o;
}
function dims(ox,oy,dw,dh,W,H){
  const dc='#8a8579', by=oy+dh+18;
  let s=`<line x1="${ox}" y1="${by}" x2="${ox+dw}" y2="${by}" stroke="${dc}"/><rect x="${ox+dw/2-26}" y="${by-9}" width="52" height="18" fill="var(--panel)"/><text x="${ox+dw/2}" y="${by+4}" font-family="JetBrains Mono,monospace" font-size="11" font-weight="700" fill="#3a382f" text-anchor="middle">${W} mm</text>`;
  const lx=ox-16; s+=`<line x1="${lx}" y1="${oy}" x2="${lx}" y2="${oy+dh}" stroke="${dc}"/><text x="${lx}" y="${oy+dh/2}" font-family="JetBrains Mono,monospace" font-size="11" font-weight="700" fill="#3a382f" text-anchor="middle" transform="rotate(-90 ${lx} ${oy+dh/2})">${H} mm</text>`;
  return s;
}
function drawWindow(){
  const W=curW(),H=curH(),maxBox=330,pad=46,oy=22;
  const ratio=Math.min(maxBox/W,maxBox/H),dw=W*ratio,dh=H*ratio,ox=pad,tW=dw+pad+30,tH=dh+oy+44;
  const frameC=KLEUREN[state.aanzicht==='buiten'?state.kleurBuiten:state.kleurBinnen].hex,dark=isDark(frameC);
  const stroke=dark?'rgba(255,255,255,.22)':'rgba(0,0,0,.25)', symC=dark?'rgba(255,255,255,.6)':'rgba(40,40,40,.55)';
  const curLijn=(lijnenFor(state.materiaal).find(l=>l.id===state.lijn))||{}, aanslag=!!curLijn.aanslag;
  const frame=Math.max(7,Math.min(dw,dh)*0.045),gap=frame*0.7,div=frame*0.8;
  GID='g'+Date.now();
  let g=`<rect x="${ox}" y="${oy}" width="${dw}" height="${dh}" rx="4" fill="url(#fr${GID})" stroke="${stroke}"/>`;
  g+=`<path d="M${ox+1} ${oy+dh-1} L${ox+1} ${oy+1} L${ox+dw-1} ${oy+1}" fill="none" stroke="rgba(255,255,255,${dark?'.10':'.22'})" stroke-width="1.3" stroke-linecap="round"/>`;
  g+=`<path d="M${ox+1} ${oy+dh-1} L${ox+dw-1} ${oy+dh-1} L${ox+dw-1} ${oy+1}" fill="none" stroke="rgba(0,0,0,.22)" stroke-width="1.3" stroke-linecap="round"/>`;
  g+=`<rect x="${ox+frame}" y="${oy+frame}" width="${dw-frame*2}" height="${dh-frame*2}" fill="none" stroke="rgba(0,0,0,.10)"/>`;
  const ix=ox+frame,iw=dw-frame*2,iy0=oy+frame,ih0=dh-frame*2,N=state.vakken.length;
  const topMode=isSchuif()?'geen':state.bovenlicht, botMode=isSchuif()?'geen':state.borstwering;
  const fTop=Math.min(0.6, Math.max(0.04, state.bovenlichtH/H)), fBot=Math.min(0.6, Math.max(0.04, state.borstweringH/H));
  const topH=topMode!=='geen'?ih0*fTop:0, botH=botMode!=='geen'?ih0*fBot:0;
  const midY=iy0+(topH?topH+div:0), midH=ih0-topH-botH-(topH?div:0)-(botH?div:0);
  const rowSplit=(x,y,w,h,parts)=>{let o='';const cw=(w-gap*(parts-1))/parts;for(let i=0;i<parts;i++)o+=paneFixed(x+i*(cw+gap),y,cw,h,frameC,stroke);return o;};
  if(topH) g+=rowSplit(ix,iy0,iw,topH, topMode==='perVak'?N:1);
  const cw=(iw-gap*(N-1))/N;
  state.vakken.forEach((v,k)=>{
    const x=ix+k*(cw+gap),f=FUNCTIES[v.functie];
    if(f.deur){
      g+=paneSash(x,midY,cw,midH,frameC,stroke,true);
      const gw=cw*0.7,gh=midH*0.42,gx=x+(cw-gw)/2,gy=midY+midH*0.12;
      g+=`<rect x="${gx-2}" y="${gy-2}" width="${gw+4}" height="${gh+4}" fill="${shade(frameC,-10)}"/>`+glassPane(gx,gy,gw,gh,stroke);
      g+=`<rect x="${x+3}" y="${midY+midH-7}" width="${cw-6}" height="7" rx="1.5" fill="${shade(frameC,-22)}"/>`+paneSym(f.sym,x,midY,cw,midH,symC)+beslagMarks(f.sym,x,midY,cw,midH);
    } else {
      const opening=(f.sym!=='vast');
      g+= opening ? paneSash(x,midY,cw,midH,frameC,stroke,!!f.schuif) : paneFixed(x,midY,cw,midH,frameC,stroke);
      if(f.schuif) g+=`<rect x="${x+(f.sym==='schuifL'?cw-6:3)}" y="${midY+3}" width="3.5" height="${midH-6}" rx="1.5" fill="${shade(frameC,-20)}"/>`;
      g+=paneSym(f.sym,x,midY,cw,midH,symC)+beslagMarks(f.sym,x,midY,cw,midH);
    }
  });
  if(botH) g+=rowSplit(ix, iy0+ih0-botH, iw, botH, botMode==='perVak'?N:1);
  if(isSchuif()) g+=`<rect x="${ox}" y="${oy+dh-5}" width="${dw}" height="5" fill="${shade(frameC,-22)}"/>`;
  let s=`<svg viewBox="0 0 ${tW} ${tH}" xmlns="http://www.w3.org/2000/svg">${defs(frameC)}`;
  s+=`<rect x="${ox}" y="${oy+6}" width="${dw}" height="${dh}" rx="6" fill="#1B1B1A" opacity=".15" filter="url(#blur${GID})"/>`;
  s+= state.aanzicht==='buiten' ? `<g transform="translate(${2*ox+dw},0) scale(-1,1)">${g}</g>` : g;
  if(aanslag){
    const ov=Math.min(Math.max(5,20*ratio), oy-6);          // px-overlap, met marge bovenin
    const lx=(ox-ov).toFixed(1), ly=(oy-ov).toFixed(1), lw=(dw+2*ov).toFixed(1), lh=(dh+2*ov).toFixed(1);
    s+=`<rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="5" fill="none" stroke="${symC}" stroke-width="1.2" stroke-dasharray="5 4"/>`;
    s+=`<g stroke="${symC}" stroke-width="1" opacity=".75">`+
       `<line x1="${ox}" y1="${ly}" x2="${ox}" y2="${oy}"/>`+
       `<line x1="${ox+dw}" y1="${ly}" x2="${ox+dw}" y2="${oy}"/></g>`;
    s+=`<text x="${(ox+dw/2).toFixed(1)}" y="${Math.max(9,oy-ov-3).toFixed(1)}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="8.5" fill="${symC}">aanslag · +20 mm rondom</text>`;
  }
  s+=dims(ox,oy,dw,dh,W,H)+`</svg>`;
  $('stage').innerHTML=s;
  const eenheid=isSchuif()?'DELEN':'VLEUGEL'+(N>1?'S':'');
  $('previewLabel').textContent=`${state.lijn.toUpperCase()} · ${N} ${eenheid} · ${state.aanzicht==='buiten'?'BUITEN':'BINNEN'}`;
  $('previewSpec').innerHTML=`${KLEUREN[state.kleurBuiten].label}${state.gelijkeKleur?'':' / binnen '+KLEUREN[state.kleurBinnen].label} · ${GLAZEN[state.glas]}${state.rc2?' · RC2':''}${state.montage?' · incl. montage':''}`;
}
function panelSVG(model, door){
  const code=model||'ST-01';
  const t=[...code].reduce((a,c)=>a+c.charCodeAt(0),0)%6;
  const W=100,H=215, gid='pg'+t;
  const inox='#c4c9cb', inoxD='#a4aaac', edge='rgba(0,0,0,.12)', hl='rgba(255,255,255,.10)';
  const glass=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="url(#${gid})" stroke="rgba(0,0,0,.10)" stroke-width="1"/>`;
  const bar=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" fill="${inox}"/><rect x="${x}" y="${y+h-1.4}" width="${w}" height="1.4" fill="${inoxD}"/>`;
  let inner='';
  if(t===0){ inner=glass(18,20,30,177); }                                   // Linea: verticale glasstrook
  else if(t===1){ for(let i=0;i<3;i++) inner+=glass(16+i*15,24,8,167); }      // Trio: 3 smalle stroken
  else if(t===2){ for(let r=0;r<2;r++)for(let c=0;c<2;c++) inner+=glass(18+c*23,22+r*26,19,19); } // Quattro: 2x2
  else if(t===3){ inner=glass(14,14,64,187)+`<line x1="46" y1="16" x2="46" y2="199" stroke="rgba(0,0,0,.14)" stroke-width="1.4"/><line x1="16" y1="107" x2="76" y2="107" stroke="rgba(0,0,0,.14)" stroke-width="1.4"/>`; } // vol glas + roede
  else if(t===4){ inner=glass(14,18,64,20); inner+=bar(14,120,64,5)+bar(14,150,64,5)+bar(14,180,64,5); } // Modern: glasrand boven + RVS-strepen
  else { // Classic dicht: twee verzonken panelen
    const panel=(y,h)=>`<rect x="18" y="${y}" width="64" height="${h}" rx="2" fill="${shade(door,-7)}" stroke="${shade(door,-16)}" stroke-width="1.4"/><rect x="23" y="${y+5}" width="54" height="${h-10}" rx="1.5" fill="none" stroke="${hl}" stroke-width="1.2"/>`;
    inner=panel(18,86)+panel(112,86);
  }
  return `<svg class="dp-img" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`
    +`<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8f0f2"/><stop offset=".5" stop-color="#d3e1e5"/><stop offset="1" stop-color="#e8f0f2"/></linearGradient></defs>`
    +`<rect width="${W}" height="${H}" fill="${door}"/><rect x="3" y="3" width="${W-6}" height="${H-6}" rx="2" fill="none" stroke="${edge}" stroke-width="1.2"/>${inner}</svg>`;
}
function drawDoor(){
  const frameC=KLEUREN[state.aanzicht==='buiten'?state.kleurBuiten:state.kleurBinnen].hex;
  if(state.paneelOnly){
    const code=`${state.collectie} ${state.model||'—'}`, pnl=panelSVG(state.model, frameC);
    const Wt=curW(), Ht=curH(), scale=300/Math.max(300,Ht);
    const pw=Math.round(Math.max(90,Math.min(300, Wt*scale))), ph=Math.round(Math.max(150,Math.min(320, Ht*scale)));
    let h=`<div class="dp-wrap${state.aanzicht==='buiten'?' dp-mirror':''}" style="--fc:${frameC}">`;
    h+=`<div class="dp-panel" data-code="${code}" style="width:${pw}px;height:${ph}px;background:${frameC}">${pnl}`;
    if(state.glassoort>0) h+=`<span class="dp-glasslabel">${(state.patroon||DEUR_GLASSOORT[state.glassoort]).slice(0,18)}</span>`;
    h+=`</div>`;
    h+=`<div class="dp-dims">Paneel ${Wt} × ${Ht} mm · ${KLEUREN[state.aanzicht==='buiten'?state.kleurBuiten:state.kleurBinnen].label}</div>`;
    h+=`<div class="dp-note">Los deurpaneel — op maat gemaakt voor je bestaande PVC-deur.</div>`;
    h+=`</div>`;
    $('stage').innerHTML=h;
    $('previewLabel').textContent=`DEURPANEEL · ${code} · ${state.aanzicht==='buiten'?'BUITEN':'BINNEN'}`;
    $('previewSpec').innerHTML=`Los paneel · ${PANEEL_MAT[state.paneelMat]} · ${KLEUREN[state.kleurBuiten].label} · ${state.glassoort?DEUR_GLASSOORT[state.glassoort]:'dicht'}${state.veiligheidsglas?' · veiligheidsglas':''}`;
    return;
  }
  const slL=state.zijlicht===1||state.zijlicht===3, slR=state.zijlicht===2||state.zijlicht===3, dz=state.zijlichtDubbel, dubbel=state.deurType===1;
  const grRight=state.scharnier===0, code=`${state.collectie} ${state.model||'—'}`, pnl=panelSVG(state.model, frameC);
  const Wt=curW(), Ht=curH(), cols=(slL?1:0)+(slR?1:0);
  const doorWmm=Math.max(300, Wt-cols*state.zijlichtB);
  const doorHmm=Math.max(300, Ht-(state.bovenlichtDeur?state.bovenlichtDeurH:0));
  const scale=300/doorHmm;                                  // px per mm — deurblad ~300px hoog
  const doorPx=Math.round(Math.max(120,Math.min(380, doorWmm*scale)));
  const sidePx=Math.round(Math.max(18,Math.min(170, state.zijlichtB*scale)));
  const blPx=state.bovenlichtDeur?Math.round(Math.max(20,Math.min(220, state.bovenlichtDeurH*scale))):0;
  const rowW=doorPx+cols*(sidePx+5);
  const sideCell=()=>`<div class="dp-side dp-zg${state.zijlichtGlas}" style="width:${sidePx}px"></div>`;
  const sideHtml=()=> dz?`<div class="dp-side-col" style="width:${sidePx}px">${sideCell()}${sideCell()}</div>`:sideCell();
  const leafHtml=(side,m)=>{
    const hingeSide=side==='r'?'l':'r';                 // scharnier tegenover de hendel
    const baseX=hingeSide==='l'?8:92, apexX=hingeSide==='l'?92:8;
    const swing=`<svg class="dp-swing" viewBox="0 0 100 240" preserveAspectRatio="none" aria-hidden="true"><path d="M${baseX} 16 L${apexX} 120 L${baseX} 224" fill="none" stroke="rgba(28,28,25,.5)" stroke-width="1.5" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/></svg>`;
    // scharnieren alleen zichtbaar aan de kant waar de deur naartoe opendraait
    const showHinges=(state.opendraai===0)===(state.aanzicht==='binnen'); // naar binnen→binnen, naar buiten→buiten
    const hinges=showHinges?`<span class="dp-hinge ${hingeSide}" style="top:14%"></span><span class="dp-hinge ${hingeSide}" style="top:86%"></span>`:'';
    return `<div class="dp-leaf${m?' dp-leaf-m':''}" data-code="${code}" style="background:${frameC}">${pnl}${swing}${hinges}<span class="dp-handle ${side}"></span></div>`;
  };
  let h=`<div class="dp-wrap${state.aanzicht==='buiten'?' dp-mirror':''}" style="--fc:${frameC}">`;
  if(state.bovenlichtDeur) h+=`<div class="dp-bovenlicht" style="height:${blPx}px;width:${rowW}px">bovenlicht</div>`;
  h+=`<div class="dp-row">`;
  if(slL) h+=sideHtml();
  h+=`<div class="dp-door${dubbel?' dp-door-2':''}" style="width:${doorPx}px">`;
  h+= dubbel ? leafHtml('r',false)+leafHtml('l',true) : leafHtml(grRight?'r':'l',false);
  if(state.glassoort>0) h+=`<span class="dp-glasslabel">${(state.patroon||DEUR_GLASSOORT[state.glassoort]).slice(0,18)}</span>`;
  h+=`</div>`;
  if(slR) h+=sideHtml();
  h+=`</div>`;
  h+=`<div class="dp-dims">${curW()} × ${curH()} mm · ${KLEUREN[state.aanzicht==='buiten'?state.kleurBuiten:state.kleurBinnen].label}</div>`;
  h+=`</div>`;
  $('stage').innerHTML=h;
  $('previewLabel').textContent=`VOORDEUR · ${code} · ${state.aanzicht==='buiten'?'BUITEN':'BINNEN'}`;
  $('previewSpec').innerHTML=`${PANEEL_MAT[state.paneelMat]} · ${KLEUREN[state.kleurBuiten].label} · ${state.glassoort?DEUR_GLASSOORT[state.glassoort]:'dicht'}${state.veiligheidsglas?' · veiligheidsglas':''}${state.rc2?' · RC2':''}${state.montage?' · incl. montage':''}`;
}
function draw(){ updateVeilig(); isVoordeur()?drawDoor():drawWindow(); }
function setAanzicht(v){ state.aanzicht=v; $('azBinnen').classList.toggle('active',v==='binnen'); $('azBuiten').classList.toggle('active',v==='buiten'); draw(); }
function veiligReq(){ return isVoordeur()||isSchuif()||hasDeur()||state.laagGlas; }
function updateVeilig(){
  const req=veiligReq(); if(req) state.veiligheidsglas=true;
  const t=$('veiligheidsglasToggle'); if(t){ t.checked=state.veiligheidsglas; t.disabled=req; }
  const w=$('veiligWrap'); if(w) w.classList.toggle('locked',req);
  const r=$('veiligReden'); if(r) r.textContent = req ? 'Verplicht (NEN 3569) bij deze keuze.' : 'Aanbevolen bij risico op letsel.';
}

/* ============ UI-bouwers ============ */
function chips(elId,items,current,onpick){
  const el=$(elId); if(!el) return;
  el.innerHTML=items.map((it,i)=>`<button class="chip" data-i="${i}" aria-pressed="${current===i}">${it}</button>`).join('');
  el.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{ el.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed',x===b)); onpick(+b.dataset.i); });
}
function swatches(elId,current,onpick){
  const el=$(elId); if(!el) return;
  el.innerHTML=KLEUREN.map((k,i)=>`<button class="swatch" data-i="${i}" aria-pressed="${current===i}"><div class="sw" style="background:${k.hex}"></div><span>${k.label}</span></button>`).join('');
  el.querySelectorAll('.swatch').forEach(b=>b.onclick=()=>{ el.querySelectorAll('.swatch').forEach(x=>x.setAttribute('aria-pressed',x===b)); onpick(+b.dataset.i); });
}
function soortOpts(){ return state.materiaal==='kunststof' ? [['raam','Raam'],['schuif','Schuif / hef'],['voordeur','Voordeur / los paneel']] : [['raam','Raam'],['schuif','Schuif / hef']]; }
function syncProductUI(){
  $('lijnWrap').hidden=isVoordeur(); $('paneelWrap').hidden=!isVoordeur();
  $('raamIndeling').hidden=isVoordeur(); $('deurIndeling').hidden=!isVoordeur();
  $('rijenWrap').hidden=isSchuif()||isVoordeur();
  $('schuifSchemaWrap').hidden=!isSchuif();
  $('vakManualWrap').hidden=isSchuif();
  $('raamGlas').hidden=isVoordeur(); $('deurGlas').hidden=!isVoordeur();
  $('raamGlasOpties').hidden=isVoordeur(); $('raamKleur').hidden=isVoordeur();
  var _kw=$('kernWrap'); if(_kw) _kw.hidden = (state.materiaal!=='kunststof');
  var _dfo=$('deurFrameOpts'); if(_dfo) _dfo.hidden = isPaneelOnly();
  $('raamBeslag').hidden=!isRaam();
  $('raamOpties').hidden=isVoordeur(); $('deurExtra').hidden=!isVoordeur();
  $('deurWrap').hidden=!(hasDeur()||isSchuif()||isVoordeur())||isPaneelOnly();
  $('dorpelWrap').hidden=isSchuif()||isPaneelOnly();
  $('slotLbl').textContent=isSchuif()?'Slot / cilinder':'Deur-/schuifbeslag';
  buildBeslagChips();
}
function buildProfiel(){
  const mats=Object.keys(LIJNEN);
  chips('matChips', mats.map(k=>k[0].toUpperCase()+k.slice(1)), mats.indexOf(state.materiaal), setMateriaal);
  const so=soortOpts();
  if(so.length>1){ $('soortWrap').hidden=false; chips('soortChips', so.map(x=>x[1]), so.findIndex(x=>x[0]===state.product), i=>setSoort(so[i][0])); }
  else { $('soortWrap').hidden=true; }
  if(isVoordeur()) buildDeurProfiel(); else buildLijn();
  syncProductUI();
}
function buildDeurProfiel(){
  chips('paneelMatChips', PANEEL_MAT, state.paneelMat, i=>{state.paneelMat=i;draw();});
  chips('dikteChips', DEUR_DIKTE, state.dikte, i=>state.dikte=i);
}
function buildLijn(){
  const lijnen=lijnenFor(state.materiaal);
  if(lijnen.findIndex(l=>l.id===state.lijn)<0) state.lijn=lijnen[0].id;
  chips('lijnChips', lijnen.map(l=>l.label), lijnen.findIndex(l=>l.id===state.lijn), i=>{state.lijn=lijnen[i].id;lijnHint();draw();});
  lijnHint();
}
function lijnHint(){
  const l=LIJNEN[state.materiaal].find(x=>x.id===state.lijn)||{},p=[];
  if(l.kamers&&l.kamers!=='—')p.push(`${l.kamers} kamers`); if(l.diepte&&l.diepte!=='—')p.push(`inbouwdiepte ${l.diepte}`); if(l.uw&&l.uw!=='—')p.push(`Uw vanaf ${l.uw} W/m²K`);
  $('lijnHint').textContent=p.length?p.join(' · '):'Volledig op maat.';
}
function buildAfdichting(){ const a=afdichtingFor(); if(state.afdichting>=a.length) state.afdichting=0; chips('afdichtingChips',a,state.afdichting,i=>state.afdichting=i); }
function setMateriaal(i){
  state.materiaal=Object.keys(LIJNEN)[i];
  if(state.materiaal!=='kunststof' && state.product==='voordeur') state.product='raam';
  if(!isVoordeur()) state.lijn=lijnenFor(state.materiaal)[0].id;
  applyProductDefaults(); buildProfiel(); buildAfdichting(); buildIndeling(); draw();
}
function setSoort(p){
  if(state.product===p) return;
  state.product=p;
  if(!isVoordeur()) state.lijn=lijnenFor(state.materiaal)[0].id;
  applyProductDefaults(); buildProfiel(); buildIndeling(); draw();
}
function applyProductDefaults(){
  state.greep=0; state.deurBeslag=0;
  if(isVoordeur()){ state.breedte=1000; state.hoogte=2150; state.dorpel=0; state.collectie='Standard'; state.model='ST-01'; state.glassoort=0; state.patroon=''; state.deurType=0; state.zijlicht=0; state.zijlichtDubbel=false; state.zijlichtGlas=0; state.bovenlichtDeur=false; }
  else if(isSchuif()){ state.breedte=3000; state.hoogte=2200; state.dorpel=2; state.vakken=[{functie:'schuif-r',glas:null},{functie:'vast',glas:null}]; state.bovenlicht='geen'; state.borstwering='geen'; }
  else { state.breedte=1500; state.hoogte=1400; state.vakken=[{functie:'draaikiep-r',glas:null}]; state.bovenlicht='geen'; state.borstwering='geen'; }
  state.breedteBuiten=state.breedte; state.hoogteBuiten=state.hoogte;
  if($('inW')){ $('inW').value=state.breedte; $('inH').value=state.hoogte; }
  if($('inWb')){ $('inWb').value=state.breedteBuiten; $('inHb').value=state.hoogteBuiten; }
}

/* ---- indeling ---- */
function buildIndeling(){
  if(isVoordeur()){ buildDeurIndeling(); syncProductUI(); return; }
  $('vakAantalLbl').textContent=isSchuif()?'Aantal delen (naast elkaar)':'Aantal vleugels (naast elkaar)';
  $('vakEditorLbl').textContent=isSchuif()?'Per deel: vast of schuivend':'Per vleugel: functie';
  buildVakAantal(); buildVakEditor(); buildVakGlas(); buildSchuifSchema();
  if(!isSchuif()){
    chips('bovenlichtChips',RIJ_LBL,RIJ_VALS.indexOf(state.bovenlicht),i=>{state.bovenlicht=RIJ_VALS[i];syncVerdeling();draw();});
    chips('borstweringChips',RIJ_LBL,RIJ_VALS.indexOf(state.borstwering),i=>{state.borstwering=RIJ_VALS[i];syncVerdeling();draw();});
    const bi=$('bovenlichtH'), bw=$('borstweringH');
    if(bi){ bi.value=state.bovenlichtH; bi.oninput=()=>{ state.bovenlichtH=clampVerdeling(+bi.value||0,'boven'); syncVerdeling(); draw(); }; }
    if(bw){ bw.value=state.borstweringH; bw.oninput=()=>{ state.borstweringH=clampVerdeling(+bw.value||0,'borst'); syncVerdeling(); draw(); }; }
    syncVerdeling();
  }
  syncProductUI();
}
// Houd bovenlicht + borstwering samen kleiner dan de totale hoogte (min. 200 mm middenvak)
function clampVerdeling(val,which){
  const H=state.hoogte, other=which==='boven'?state.borstweringH:state.bovenlichtH;
  const otherActive=which==='boven'?(state.borstwering!=='geen'):(state.bovenlicht!=='geen');
  const max=H-(otherActive?other:0)-200;
  return Math.max(100, Math.min(val, Math.max(100,max)));
}
function syncVerdeling(){
  const tW=$('bovenlichtHWrap'), bW=$('borstweringHWrap'), info=$('verdeelInfo');
  const topOn=!isSchuif()&&state.bovenlicht!=='geen', botOn=!isSchuif()&&state.borstwering!=='geen';
  if(tW) tW.hidden=!topOn;
  if(bW) bW.hidden=!botOn;
  // herclamp bij gewijzigde hoogte/mode
  if(topOn) state.bovenlichtH=clampVerdeling(state.bovenlichtH,'boven');
  if(botOn) state.borstweringH=clampVerdeling(state.borstweringH,'borst');
  const bi=$('bovenlichtH'), bw=$('borstweringH');
  if(bi&&topOn) bi.value=state.bovenlichtH;
  if(bw&&botOn) bw.value=state.borstweringH;
  if(info){
    if(!topOn&&!botOn){ info.hidden=true; }
    else{
      const t=topOn?state.bovenlichtH:0, b=botOn?state.borstweringH:0, mid=state.hoogte-t-b;
      const parts=[]; if(topOn)parts.push(`bovenlicht ${t}`); parts.push(`middenvak ${mid}`); if(botOn)parts.push(`borstwering ${b}`);
      info.hidden=false; info.textContent=`Verdeling hoogte: ${parts.join(' · ')} mm (totaal ${state.hoogte})`;
    }
  }
}
function buildVakAantal(){ const opts=isSchuif()?['2','3','4']:['1','2','3','4']; chips('vakAantalChips',opts,state.vakken.length-minVak(),i=>setVakAantal(minVak()+i)); }
function miniSchema(delen){
  const W=128,H=56,n=delen.length,g=2,fw=(W-g*(n-1)-2)/n; let s=`<svg viewBox="0 0 ${W} ${H}">`;
  s+=`<rect x="1" y="1" width="${W-2}" height="${H-2}" rx="3" fill="#fff" stroke="#cfcabc"/>`;
  delen.forEach((fkey,i)=>{ const x=1+i*(fw+g),f=FUNCTIES[fkey];
    s+=`<rect x="${x}" y="4" width="${fw}" height="${H-8}" fill="#eef3f4" stroke="#cfcabc"/>`+paneSym(f.sym,x,4,fw,H-8,'rgba(40,40,40,.6)'); });
  return s+'</svg>';
}
function tileChips(elId,items,icons,current,onpick){
  const host=$(elId); if(!host) return; host.classList.add('tile-chips');
  host.innerHTML=items.map((lbl,i)=>`<button type="button" class="tile-chip${i===current?' sel':''}" data-i="${i}">${icons[i]||''}<span>${lbl}</span></button>`).join('');
  host.querySelectorAll('.tile-chip').forEach(b=>b.onclick=()=>{ onpick(+b.dataset.i); host.querySelectorAll('.tile-chip').forEach(x=>x.classList.toggle('sel',x===b)); });
}
function buildBeslagChips(){
  const g=$('greepChips'), s=$('deurBeslagChips'), d=$('dorpelChips'); if(!g||!s) return;
  if(state.greep>=(isSchuif()?SCHUIF_GREEP:GREEP).length) state.greep=0;
  if(state.deurBeslag>=(isSchuif()?SCHUIF_SLOT:DEURBESLAG).length) state.deurBeslag=0;
  if(state.dorpel>=DORPELS.length) state.dorpel=0;
  if(isSchuif()){
    tileChips('greepChips',SCHUIF_GREEP,SCHUIF_GREEP_IC,state.greep,i=>{state.greep=i;draw();});
    tileChips('deurBeslagChips',SCHUIF_SLOT,SCHUIF_SLOT_IC,state.deurBeslag,i=>state.deurBeslag=i);
  } else if(isVoordeur()){
    tileChips('greepChips',GREEP,GREEP_IC,state.greep,i=>{state.greep=i;draw();});
    s.classList.remove('tile-chips'); chips('deurBeslagChips',DEURBESLAG,state.deurBeslag,i=>state.deurBeslag=i);
    if(d) tileChips('dorpelChips',DORPELS,DORPEL_IC,state.dorpel,i=>{state.dorpel=i;draw();});
  } else {
    g.classList.remove('tile-chips'); s.classList.remove('tile-chips');
    chips('greepChips',GREEP,state.greep,i=>{state.greep=i;draw();});
    chips('deurBeslagChips',DEURBESLAG,state.deurBeslag,i=>state.deurBeslag=i);
  }
}
function sameSchema(delen){ return state.vakken.length===delen.length && state.vakken.every((v,i)=>v.functie===delen[i]); }
function buildSchuifSchema(){
  const host=$('schuifSchemaGallery'); if(!host) return;
  host.innerHTML=SCHUIFSCHEMA.map(sc=>`<button type="button" class="sch-card${sameSchema(sc.delen)?' sel':''}" data-id="${sc.id}">${miniSchema(sc.delen)}<span>${sc.label}</span></button>`).join('');
  host.querySelectorAll('.sch-card').forEach(b=>b.onclick=()=>applySchema(b.dataset.id));
}
function applySchema(id){
  const sc=SCHUIFSCHEMA.find(x=>x.id===id); if(!sc) return;
  const oud=state.vakken;
  state.vakken=sc.delen.map((f,i)=>({functie:f,glas:oud[i]?oud[i].glas:null}));
  buildIndeling(); draw();
}
function buildVakEditor(){
  const host=$('vakEditor'); if(!host) return; const fns=functiesFor();
  host.innerHTML=state.vakken.map((v,i)=>`<div class="vak-row"><span class="vak-no">${isSchuif()?'Deel':'Vleugel'} ${i+1}</span><select data-i="${i}" class="sel vak-fn">${fns.map(k=>`<option value="${k}" ${v.functie===k?'selected':''}>${FUNCTIES[k].label}</option>`).join('')}</select></div>`).join('');
  host.querySelectorAll('.vak-fn').forEach(sel=>sel.onchange=()=>{ state.vakken[+sel.dataset.i].functie=sel.value; syncProductUI(); draw(); });
}
function buildVakGlas(){
  const host=$('vakGlas'); if(!host) return;
  host.innerHTML=state.vakken.map((v,i)=>`<div class="vak-row"><span class="vak-no">${isSchuif()?'Deel':'Vleugel'} ${i+1}</span><select data-i="${i}" class="sel vak-glas"><option value="-1" ${v.glas===null?'selected':''}>— standaard —</option>${GLAZEN.map((g,gi)=>`<option value="${gi}" ${v.glas===gi?'selected':''}>${g}</option>`).join('')}</select></div>`).join('');
  host.querySelectorAll('.vak-glas').forEach(sel=>sel.onchange=()=>{ const val=+sel.value; state.vakken[+sel.dataset.i].glas=val<0?null:val; });
}
function setVakAantal(n){
  n=Math.max(minVak(),n); const cur=state.vakken.length;
  if(n>cur) for(let i=cur;i<n;i++) state.vakken.push({functie:'vast',glas:null}); else state.vakken.length=n;
  buildVakEditor(); buildVakGlas(); syncProductUI(); draw();
}
/* ---- deur-indeling ---- */
function buildDeurIndeling(){
  chips('collectieChips', DEUR_COLLECTIES, DEUR_COLLECTIES.indexOf(state.collectie), i=>{ state.collectie=DEUR_COLLECTIES[i]; state.model=(DEUR_MODELLEN[state.collectie][0]||''); buildModelSelect(); draw(); });
  buildModelSelect();
  chips('scharnierChips', SCHARNIER, state.scharnier, i=>{state.scharnier=i;draw();});
  chips('opendraaiChips', OPENDRAAI, state.opendraai, i=>{state.opendraai=i;draw();});
  chips('zijlichtGlasChips', ZIJLICHT_GLAS, state.zijlichtGlas, i=>{state.zijlichtGlas=i;draw();});
  buildDeurSchema();
  const bh=$('bovenlichtDeurH'), zb=$('zijlichtB');
  if(bh){ bh.value=state.bovenlichtDeurH; bh.oninput=()=>{ state.bovenlichtDeurH=clampDeur(+bh.value||0,'boven'); syncDeurVerdeling(); draw(); }; }
  if(zb){ zb.value=state.zijlichtB; zb.oninput=()=>{ state.zijlichtB=clampDeur(+zb.value||0,'zij'); syncDeurVerdeling(); draw(); }; }
  syncDeurVerdeling();
}
// maatverdeling extra glas bij de voordeur (zelfde idee als borstwering)
function clampDeur(val,which){
  if(which==='boven') return Math.max(100, Math.min(val, Math.max(100, state.hoogte-1000))); // deur min. 1000 mm hoog
  const cols=((state.zijlicht===1||state.zijlicht===3)?1:0)+((state.zijlicht===2||state.zijlicht===3)?1:0);
  const max=cols?Math.max(80,(state.breedte-700)/cols):900;                                  // deur min. 700 mm breed
  return Math.max(80, Math.min(val, max));
}
function syncDeurVerdeling(){
  const wrap=$('deurMaatWrap'); if(!wrap) return;
  const blOn=!!state.bovenlichtDeur, zlOn=state.zijlicht>0;
  wrap.hidden=!(blOn||zlOn);
  const bw=$('bovenlichtDeurHWrap'), zw=$('zijlichtBWrap'), info=$('deurVerdeelInfo');
  if(bw) bw.hidden=!blOn;
  if(zw) zw.hidden=!zlOn;
  if(blOn) state.bovenlichtDeurH=clampDeur(state.bovenlichtDeurH,'boven');
  if(zlOn) state.zijlichtB=clampDeur(state.zijlichtB,'zij');
  const bh=$('bovenlichtDeurH'), zb=$('zijlichtB');
  if(bh&&blOn) bh.value=state.bovenlichtDeurH;
  if(zb&&zlOn) zb.value=state.zijlichtB;
  if(info){
    if(!blOn&&!zlOn){ info.hidden=true; return; }
    const parts=[];
    if(blOn) parts.push(`hoogte: bovenlicht ${state.bovenlichtDeurH} · deur ${state.hoogte-state.bovenlichtDeurH} mm (totaal ${state.hoogte})`);
    if(zlOn){
      const cols=((state.zijlicht===1||state.zijlicht===3)?1:0)+((state.zijlicht===2||state.zijlicht===3)?1:0);
      parts.push(`breedte: ${cols}× zijlicht ${state.zijlichtB} · deur ${state.breedte-cols*state.zijlichtB} mm (totaal ${state.breedte})`);
    }
    info.hidden=false; info.innerHTML='Verdeling — '+parts.join('<br>');
  }
}
function sameDeurSchema(sc){ return state.deurType===sc.dt && state.bovenlichtDeur===!!sc.bl && state.zijlicht===sc.zl && state.zijlichtDubbel===!!sc.dz; }
function buildDeurSchema(){
  const host=$('deurSchemaGallery'); if(!host) return;
  host.innerHTML=DEURSCHEMA.map(sc=>`<button type="button" class="sch-card${sameDeurSchema(sc)?' sel':''}" data-id="${sc.id}">${miniDeur(sc)}<span>${sc.label}</span></button>`).join('');
  host.querySelectorAll('.sch-card').forEach(b=>b.onclick=()=>applyDeurSchema(b.dataset.id));
  const zw=$('zijlichtGlasWrap'); if(zw) zw.hidden=(state.zijlicht===0);
}
function applyDeurSchema(id){
  const sc=DEURSCHEMA.find(x=>x.id===id); if(!sc) return;
  state.deurType=sc.dt; state.bovenlichtDeur=!!sc.bl; state.zijlicht=sc.zl; state.zijlichtDubbel=!!sc.dz;
  buildDeurSchema(); syncDeurVerdeling(); draw();
}
function buildModelSelect(){
  const list=DEUR_MODELLEN[state.collectie]||[], sel=$('modelSelect');
  sel.innerHTML=list.map(m=>`<option value="${m}">${m}</option>`).join('')+`<option value="__vrij">Andere (code invoeren)</option>`;
  if(list.length && list.indexOf(state.model)>=0) sel.value=state.model; else sel.value='__vrij';
  $('modelVrij').hidden=sel.value!=='__vrij'; if(sel.value==='__vrij' && list.indexOf(state.model)<0) $('modelVrij').value=state.model||'';
  sel.onchange=()=>{ if(sel.value==='__vrij'){ $('modelVrij').hidden=false; state.model=$('modelVrij').value||''; } else { $('modelVrij').hidden=true; state.model=sel.value; } draw(); };
  $('modelVrij').oninput=()=>{ state.model=$('modelVrij').value; draw(); };
  const lnk=$('paneelLink'); if(lnk) lnk.href=PANEEL_SITE+(PANEEL_SLUG[state.collectie]||'standard')+'/';
}
/* ---- deur-glas ---- */
function buildDeurGlas(){
  chips('glassoortChips', DEUR_GLASSOORT, state.glassoort, i=>{ state.glassoort=i; buildPatroon(); draw(); });
  buildPatroon();
}
function buildPatroon(){
  const wrap=$('patroonWrap'), sel=$('patroonSelect');
  if(state.glassoort===0){ wrap.hidden=true; state.patroon=''; return; }
  wrap.hidden=false;
  const list = state.glassoort===1?SIERGLAS : state.glassoort===2?GLASINLOOD : SANDGLAS;
  sel.innerHTML=list.map(p=>`<option value="${p}">${p}</option>`).join('');
  if(list.indexOf(state.patroon)<0) state.patroon=list[0];
  sel.value=state.patroon;
  sel.onchange=()=>{ state.patroon=sel.value; draw(); };
}

/* ============ inmeten ============ */
function detail(){
  const v=id=>+($(id).value||0);
  const bs=[v('mb1'),v('mb2'),v('mb3')].filter(x=>x>0), hs=[v('mh1'),v('mh2'),v('mh3')].filter(x=>x>0);
  if(bs.length){ state.breedte=Math.min(...bs); $('inW').value=state.breedte; }
  if(hs.length){ state.hoogte=Math.min(...hs); $('inH').value=state.hoogte; }
  if(state.gelijkeMaat){ state.breedteBuiten=state.breedte; state.hoogteBuiten=state.hoogte; if($('inWb')){$('inWb').value=state.breedteBuiten;$('inHb').value=state.hoogteBuiten;} }
  draw();
}
function meetString(){
  const v=id=>$(id)?$(id).value:''; const p=[];
  if(v('mb1')||v('mb2')||v('mb3')) p.push(`B ${v('mb1')||'-'}/${v('mb2')||'-'}/${v('mb3')||'-'}`);
  if(v('mh1')||v('mh2')||v('mh3')) p.push(`H ${v('mh1')||'-'}/${v('mh2')||'-'}/${v('mh3')||'-'}`);
  if(v('md1')||v('md2')) p.push(`diag ${v('md1')||'-'}/${v('md2')||'-'}`);
  if(v('mmuur')) p.push(`muurdikte ${v('mmuur')}`);
  return p.join(' · ');
}

/* ============ wizard ============ */
function renderSteps(){ $('wsteps').innerHTML=STEPS.map((t,i)=>`<button class="wstep ${i===step?'active':''} ${i<step?'done':''}" onclick="jumpStep(${i})"><b>${i+1}</b>${t}</button>`).join(''); }
function showStep(i){
  step=Math.max(0,Math.min(STEPS.length-1,i));
  document.querySelectorAll('.wpanel').forEach(p=>p.hidden=(+p.dataset.step!==step));
  const pb=$('prevBtn'); pb.style.visibility='visible'; pb.disabled=(step===0);
  $('nextBtn').style.visibility=step===STEPS.length-1?'hidden':'visible';
  if(step===STEPS.length-1) buildOverzicht();
  renderSteps(); window.scrollTo({top:0,behavior:'smooth'});
}
function goStep(d){ showStep(step+d); }
function jumpStep(i){ showStep(i); }

function spec(){
  const kl=state.gelijkeKleur?KLEUREN[state.kleurBuiten].label:`buiten ${KLEUREN[state.kleurBuiten].label}, binnen ${KLEUREN[state.kleurBinnen].label}`;
  const extrasR=[]; if(state.rolluik)extrasR.push('rolluik'); if(state.hor)extrasR.push('hor'); if(state.screen)extrasR.push('screen');
  const extrasD=[]; if(state.brievenbus)extrasD.push('brievenbus'); if(state.spion)extrasD.push('spionoog'); if(state.huisnummer)extrasD.push('huisnummer');
  if(state.smartHome){ extrasR.push('Smart Home'); extrasD.push('Smart Home'); }
  const afm = state.gelijkeMaat ? `${state.breedte} × ${state.hoogte} mm` : `binnen ${state.breedte} × ${state.hoogte} mm · buiten ${state.breedteBuiten} × ${state.hoogteBuiten} mm`;
  const base={ positie:state.positie||'—', kleur:kl, afmetingen:afm, meet:meetString(),
    rc2:state.rc2?'ja':'nee', sleutel:state.sleutel?'ja':'nee', scharnieren:state.scharnieren?'verdekt':'standaard',
    montage:state.montage?'ja':'nee', aantal:state.aantal };
  if(isVoordeur()){
    if(state.paneelOnly){
      return { ...base, materiaal:'kunststof', systeem:`Deurpaneel (los) – ${PANEEL_MAT[state.paneelMat]}`,
        indeling:'Los deurpaneel voor bestaande PVC-deur',
        vakken:[`Model: ${state.collectie} ${state.model||'—'}`, `Paneeldikte: ${DEUR_DIKTE[state.dikte]}`],
        afdichting:null, kern:null, glas: state.glassoort===0?'Dicht paneel (geen glas)':`${DEUR_GLASSOORT[state.glassoort]} – ${state.patroon||'patroon n.t.b.'}${state.veiligheidsglas?' + gelaagd veiligheidsglas':''}`, glaslat:null, warmeRand:null,
        kruk:null, deurBeslag:null, dorpel:null, scharnieren:null,
        roedes:null, ventilatie:null, extras:extrasD.length?extrasD.join(', '):'geen' };
    }
    const cols=((state.zijlicht===1||state.zijlicht===3)?1:0)+((state.zijlicht===2||state.zijlicht===3)?1:0);
    const dvak=[`Model: ${state.collectie} ${state.model||'—'}`, `Draairichting: scharnier ${SCHARNIER[state.scharnier].toLowerCase()}, ${OPENDRAAI[state.opendraai].toLowerCase()}`, `Paneeldikte: ${DEUR_DIKTE[state.dikte]}`];
    if(state.bovenlichtDeur) dvak.push(`Hoogteverdeling: bovenlicht ${state.bovenlichtDeurH} · deur ${state.hoogte-state.bovenlichtDeurH} mm`);
    if(cols) dvak.push(`Breedteverdeling: ${cols}× zijlicht ${state.zijlichtB} · deur ${state.breedte-cols*state.zijlichtB} mm`);
    return { ...base, materiaal:'kunststof', systeem:`Voordeur – ${PANEEL_MAT[state.paneelMat]}`,
      indeling:`${state.deurType?'Dubbele deur':'Enkele deur'}${state.zijlicht?`, ${state.zijlichtDubbel?'dubbel ':''}zijlicht ${ZIJLICHT[state.zijlicht].toLowerCase()} (${state.zijlichtB} mm, ${ZIJLICHT_GLAS[state.zijlichtGlas].toLowerCase()})`:''}${state.bovenlichtDeur?`, met bovenlicht (${state.bovenlichtDeurH} mm)`:''}`,
      vakken:dvak,
      afdichting:null, kern:null, glas: state.glassoort===0?'Dicht paneel (geen glas)':`${DEUR_GLASSOORT[state.glassoort]} – ${state.patroon||'patroon n.t.b.'}${state.veiligheidsglas?' + gelaagd veiligheidsglas':''}`, glaslat:null, warmeRand:null,
      kruk:GREEP[state.greep], deurBeslag:DEURBESLAG[state.deurBeslag], dorpel:DORPELS[state.dorpel],
      roedes:null, ventilatie:null, extras:extrasD.length?extrasD.join(', '):'geen' };
  }
  const eenheid=isSchuif()?'Deel':'Vleugel';
  const vakken=state.vakken.map((v,i)=>`${eenheid} ${i+1}: ${FUNCTIES[v.functie].label}${v.glas!==null?` · ${GLAZEN[v.glas]}`:''}`);
  let indeling;
  if(isSchuif()) indeling=`${state.vakken.length}-delig schuifsysteem`;
  else { indeling=`${state.vakken.length} vleugel${state.vakken.length>1?'s':''}`; if(state.bovenlicht!=='geen')indeling+=`, bovenlicht ${state.bovenlichtH} mm (${rijTekst(state.bovenlicht)})`; if(state.borstwering!=='geen')indeling+=`, borstwering ${state.borstweringH} mm (${rijTekst(state.borstwering)})`; }
  if(!isSchuif() && (state.bovenlicht!=='geen'||state.borstwering!=='geen')){
    const t=state.bovenlicht!=='geen'?state.bovenlichtH:0, b=state.borstwering!=='geen'?state.borstweringH:0;
    const p=[]; if(t)p.push(`bovenlicht ${t}`); p.push(`middenvak ${state.hoogte-t-b}`); if(b)p.push(`borstwering ${b}`);
    vakken.push(`Hoogteverdeling: ${p.join(' · ')} mm`);
  }
  const deur=hasDeur()||isSchuif();
  return { ...base, materiaal:state.materiaal, systeem:state.lijn, indeling, vakken,
    afdichting:afdichtingFor()[state.afdichting], kern:state.materiaal==='kunststof'?KERN[state.kern]:null,
    glas:`${GLAZEN[state.glas]}${state.veiligheidsglas&&state.glas!==3?' + gelaagd veiligheidsglas':''}`, glaslat:GLASLAT[state.glaslat], warmeRand:state.warmeRand?'ja':'nee',
    kruk:isSchuif()?SCHUIF_GREEP[state.greep]:KRUKKEN[state.kruk], deurBeslag:isSchuif()?SCHUIF_SLOT[state.deurBeslag]:null, dorpel:null,
    roedes:state.roedeType===0?'geen':`${ROEDETYPES[state.roedeType]} · ${ROEDEPATRONEN[state.roedePatroon]}`,
    ventilatie:VENTILATIE[state.ventilatie], extras:extrasR.length?extrasR.join(', '):'geen' };
}
function buildOverzicht(){
  const s=spec(), row=(k,v)=>v?`<tr><td>${k}</td><td>${v}</td></tr>`:'';
  const eenheid=isVoordeur()?'Specificatie':(isSchuif()?'Delen':'Vleugels');
  $('overzicht').innerHTML=`<table class="spec-table">
    ${row('Positie',s.positie)}${row('Profiel',s.systeem)}${row('Indeling',s.indeling)}
    <tr><td>${eenheid}</td><td>${s.vakken.join('<br>')}</td></tr>
    ${row('Kleur',s.kleur)}${row('Afdichting',s.afdichting)}${row('Kern',s.kern)}
    ${row(isVoordeur()?'Glas in paneel':'Glas (standaard)',s.glas)}${row('Glaslat',s.glaslat)}${row('Warme rand',s.warmeRand)}
    ${row(isVoordeur()?'Greep':'Kruk',s.kruk)}${row('Met sleutel',s.sleutel)}${row('Inbraakwerend',s.rc2)}${row('Scharnieren',s.scharnieren)}
    ${row('Deur-/schuifbeslag',s.deurBeslag)}${row('Dorpel',s.dorpel)}
    ${row('Roedes',s.roedes)}${row('Ventilatie',s.ventilatie)}${row("Extra's",s.extras)}
    ${row('Afmetingen',s.afmetingen)}${row('Inmeten',s.meet)}${row('Aantal',s.aantal+'×')}
  </table>`;
}

/* ============ aanvraag ============ */
function addElement(){
  const s=spec();
  const lbl = isVoordeur() ? `${s.positie!=='—'?s.positie+' · ':''}Voordeur ${state.collectie} ${state.model||''}` : `${s.positie!=='—'?s.positie+' · ':''}${state.lijn} · ${state.breedte}×${state.hoogte}`;
  cart.push({ ...s, label:lbl });
  saveCart(); renderCart(); openCart(); toast('Toegevoegd aan je aanvraag');
}
function renderCart(){
  $('cartCount').textContent=cart.length;
  if(!cart.length){ $('cartBody').innerHTML='<div class="cart-empty">Nog niets toegevoegd.<br>Stel een kozijn of voordeur samen.</div>'; $('cartFoot').style.display='none'; return; }
  $('cartBody').innerHTML=cart.map((e,i)=>`<div class="cart-item"><div class="ci-top"><h4>${e.label||e.systeem}</h4><span class="ci-price">${e.aantal}×</span></div><div class="ci-spec">${e.indeling} · ${e.kleur} · ${e.glas}${e.rc2==='ja'?' · RC2':''}${e.montage==='ja'?' · incl. montage':''}${e.meet?'<br>'+e.meet:''}</div><div class="ci-bot"><span></span><button class="ci-del" onclick="removeEl(${i})">verwijderen</button></div></div>`).join('');
  $('cartFoot').style.display='block';
}
function removeEl(i){ cart.splice(i,1); saveCart(); renderCart(); }
function openCart(){ $('cartDrawer').classList.add('open'); $('scrimCart').classList.add('open'); }
function closeCart(){ $('cartDrawer').classList.remove('open'); $('scrimCart').classList.remove('open'); }
async function submitAanvraag(){
  if(!cart.length){ toast('Voeg eerst iets toe',false); return; }
  const btn=$('submitBtn'); btn.disabled=true; btn.textContent='Versturen…';
  try{
    const r=await fetch('/api/aanvraag',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({elementen:cart,opmerking:$('aanvraagOpm').value||''})});
    if(r.status===401){ btn.disabled=false; btn.textContent='Aanvraag versturen'; $('loginPrompt').style.display='block'; return; }
    const d=await r.json();
    if(d.ok){ cart=[]; saveCart(); window.location.href='/portaal/aanvraag/'+d.id; }
    else { toast(d.error||'Versturen mislukt',false); btn.disabled=false; btn.textContent='Aanvraag versturen'; }
  }catch(e){ toast('Verbinding mislukt',false); btn.disabled=false; btn.textContent='Aanvraag versturen'; }
}

/* ============ assistent ============ */
const ASSIST_ON = (typeof window!=='undefined' && window.__assistantOn === true);
const chatMsgs = ASSIST_ON
  ? [{role:'assistant',content:'Hoi! Ik help je inmeten. Gaat het om een raam, een schuifpui of een voordeur — en is het een nieuwe opening (dagmaat) of vervanging?'}]
  : [{role:'assistant',content:'De inmeet-assistent is nog niet geactiveerd (er ontbreekt een API-sleutel). Meet ondertussen de breedte op drie hoogtes (boven, midden, onder) en de hoogte op drie breedtes (links, midden, rechts), en noteer telkens de kleinste maat. De volledige uitleg vind je op de Werkwijze-pagina.'}];
function initAssistant(){
  renderChat();
  if(!ASSIST_ON){
    const inp=$('chatInput'); if(inp){ inp.disabled=true; inp.placeholder='Assistent nog niet geactiveerd'; }
    const b=document.querySelector('.assistant .a-input button'); if(b) b.disabled=true;
  }
}
function renderChat(){ const b=$('chatBody'); if(!b)return; b.innerHTML=chatMsgs.map(m=>`<div class="msg ${m.role==='assistant'?'bot':'user'}">${m.content.replace(/</g,'&lt;')}</div>`).join(''); b.scrollTop=b.scrollHeight; }
async function sendChat(){
  if(!ASSIST_ON) return;
  const inp=$('chatInput'),txt=inp.value.trim(); if(!txt)return;
  chatMsgs.push({role:'user',content:txt}); inp.value=''; chatMsgs.push({role:'assistant',content:'…'}); renderChat();
  try{ const r=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:chatMsgs.filter(m=>m.content!=='…')})}); const d=await r.json(); chatMsgs.pop(); chatMsgs.push({role:'assistant',content:d.ok?d.reply:(d.error||'Sorry, dat lukte niet.')}); }
  catch(e){ chatMsgs.pop(); chatMsgs.push({role:'assistant',content:'De assistent is even niet bereikbaar.'}); }
  renderChat();
}

/* ============ init ============ */
function setQty(d){ state.aantal=Math.max(1,state.aantal+d); $('qtyInput').value=state.aantal; }
function bind(){
  $('inPositie').addEventListener('input',e=>state.positie=e.target.value);
  $('gelijkeKleurToggle').addEventListener('change',e=>{ state.gelijkeKleur=e.target.checked; $('kleurBinnenWrap').hidden=state.gelijkeKleur; $('kleurBuitenLbl').textContent=state.gelijkeKleur?'Kleur (buiten & binnen)':'Kleur buiten'; if(state.gelijkeKleur)state.kleurBinnen=state.kleurBuiten; draw(); });
  $('warmeRandToggle').addEventListener('change',e=>state.warmeRand=e.target.checked);
  $('sleutelToggle').addEventListener('change',e=>state.sleutel=e.target.checked);
  $('rc2Toggle').addEventListener('change',e=>{state.rc2=e.target.checked;draw();});
  $('scharnierToggle').addEventListener('change',e=>{state.scharnieren=e.target.checked;draw();});
  ['rolluik','hor','screen','smart'].forEach(k=>$(k+'Toggle').addEventListener('change',e=>state[k==='smart'?'smartHome':k]=e.target.checked));
  ['brievenbus','spion','huisnummer'].forEach(k=>$(k+'Toggle').addEventListener('change',e=>{state[k]=e.target.checked;draw();}));
  $('veiligheidsglasToggle').addEventListener('change',e=>{ if(!e.target.disabled){ state.veiligheidsglas=e.target.checked; draw(); } });
  if($('paneelOnlyToggle')) $('paneelOnlyToggle').addEventListener('change',e=>{ state.paneelOnly=e.target.checked; syncProductUI(); draw(); });
  $('laagGlasToggle').addEventListener('change',e=>{ state.laagGlas=e.target.checked; draw(); });
  $('montageToggle').addEventListener('change',e=>{state.montage=e.target.checked;draw();});
  $('inW').addEventListener('input',()=>{ state.breedte=+$('inW').value||0; if(state.gelijkeMaat){state.breedteBuiten=state.breedte;$('inWb').value=state.breedte;} syncDeurVerdeling(); draw(); });
  $('inH').addEventListener('input',()=>{ state.hoogte=+$('inH').value||0; if(state.gelijkeMaat){state.hoogteBuiten=state.hoogte;$('inHb').value=state.hoogte;} syncVerdeling(); syncDeurVerdeling(); draw(); });
  $('inWb').addEventListener('input',()=>{ state.breedteBuiten=+$('inWb').value||0; draw(); });
  $('inHb').addEventListener('input',()=>{ state.hoogteBuiten=+$('inHb').value||0; draw(); });
  $('gelijkeMaatToggle').addEventListener('change',e=>{ state.gelijkeMaat=e.target.checked; $('buitenMaatWrap').hidden=state.gelijkeMaat; if(state.gelijkeMaat){ state.breedteBuiten=state.breedte; state.hoogteBuiten=state.hoogte; $('inWb').value=state.breedte; $('inHb').value=state.hoogte; } draw(); });
  $('qtyInput').addEventListener('input',()=>state.aantal=Math.max(1,+$('qtyInput').value||1));
  $('hintW').textContent='400–6000 mm'; $('hintH').textContent='300–3000 mm';
}
function init(){
  bind(); buildProfiel();
  swatches('kleurBuiten',state.kleurBuiten,i=>{state.kleurBuiten=i; if(state.gelijkeKleur)state.kleurBinnen=i; draw();});
  swatches('kleurBinnen',state.kleurBinnen,i=>{state.kleurBinnen=i;draw();});
  buildAfdichting();
  chips('kernChips',KERN,state.kern,i=>state.kern=i);
  chips('glasChips',GLAZEN,state.glas,i=>{state.glas=i;draw();});
  chips('glaslatChips',GLASLAT,state.glaslat,i=>state.glaslat=i);
  chips('krukChips',KRUKKEN,state.kruk,i=>{state.kruk=i;draw();});
  buildBeslagChips();
  chips('roedeTypeChips',ROEDETYPES,state.roedeType,i=>{state.roedeType=i;$('roedeOpties').hidden=(i===0);draw();});
  chips('roedePatroonChips',ROEDEPATRONEN,state.roedePatroon,i=>{state.roedePatroon=i;draw();});
  chips('ventilatieChips',VENTILATIE,state.ventilatie,i=>state.ventilatie=i);
  buildDeurIndeling(); buildDeurGlas();
  buildIndeling(); initAssistant(); renderCart();
  showStep(0); draw();
}
init();
