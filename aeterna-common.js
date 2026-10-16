/* Aeterna · utilidades, datos y cliente Supabase compartidos (perfil y admin) */
(function(){
'use strict';
var CFG={url:'https://jnupbjuotrrwqmgrxgsm.supabase.co',key:'sb_publishable_JMHjkEWvKmmQfNAq4UUaoA_W1waVpQF',wa:'584128047465'};
var AE=window.AE={CFG:CFG};
var $=AE.$=function(id){return document.getElementById(id)};

AE.h=function h(tag,props){
  var e=document.createElement(tag);props=props||{};
  Object.keys(props).forEach(function(k){var v=props[k];
    if(k==='class')e.className=v;else if(k==='text')e.textContent=v;
    else if(k.indexOf('on')===0)e.addEventListener(k.slice(2),v);
    else if(v===true)e.setAttribute(k,'');else if(v!==false&&v!=null)e.setAttribute(k,v)});
  for(var i=2;i<arguments.length;i++)[].concat(arguments[i]).forEach(function(c){if(c==null||c===false)return;e.append(c.nodeType?c:document.createTextNode(String(c)))});
  return e;
};
var h=AE.h;
AE.sb=window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:true,autoRefreshToken:true}});

/* ---------- datos ---------- */
AE.money=function(n){return '$'+(Math.round(n*100)/100)};
AE.PRODUCTS=[
 {id:'primavera',name:'Primavera Eterna',cat:'Ramos',price:30,size:'21 tallos',desc:'Ramo floral hecho a mano, envuelto y preparado para regalar.',img:'trabajo 1.jpeg'},
 {id:'vainilla',name:'Ramo Cumpleañero',cat:'Ramos',price:20,size:'15 tallos rosa + banda personalizada y mariposa',desc:'Ramo mediano para cumpleaños y fechas especiales.',img:'trabajo 2.jpeg'},
 {id:'corazon',name:'Ramo Especial',cat:'Ramos',price:25,size:'9 rosas',desc:'Ramo al gusto personal del cliente.',img:'trabajo 3.jpeg'},
 {id:'luna',name:'Caja con Temática',cat:'Cajas',price:16,size:'Peluche + llavero + chucherías + carros Hot Wheels',desc:'Caja grande o mediana al gusto del cliente.',img:'trabajo 4.jpeg'},
 {id:'cupula',name:'Rosa de Dulces',cat:'Ramos Dulces',price:15,size:'Dulces + globos',desc:'Haz un lindo obsequio a tu persona especial. Pregunta para más información.',img:'trabajo 5.jpeg'},
 {id:'aniversario',name:'Rosas Pasión',cat:'Ramos',price:10,size:'5 tallos + 5 mariposas y piedras',desc:'Arreglo para aniversario, noviazgo o dedicatoria.',img:'trabajo 6.jpeg'},
 {id:'nupcial',name:'Ramo de Girasoles',cat:'Ramos',price:17,size:'3 tallos de rosas y girasoles + piedritas',desc:'Ramo personalizado de girasoles con rosas rojas.',img:'trabajo 7.jpeg',from:true},
 {id:'arco',name:'Arreglo de Maquillaje',cat:'Arreglos',price:15,size:'Caja personalizada + maquillaje',desc:'Caja con tu lip combo perfecto.',img:'trabajo 8.jpeg',from:true},
 {id:'centros',name:'Arreglos de Quinceañera',cat:'Quinceaños',price:23,size:'Ramos',desc:'Arreglos para eventos de quinceañeras.',img:'trabajo 9.jpeg'},
 {id:'extra-1',name:'Arreglo de Dulces',cat:'Cajas',price:10,size:'Arreglo + dulces',desc:'Cajas personalizadas de dulces para eventos o fechas especiales.',img:'trabajo 10.jpeg'},
 {id:'extra-2',name:'Ramo de Hot Wheels',cat:'Ramos',price:13,size:'Ramo con carros Hot Wheels',desc:'Ramos de Hot Wheels al gusto del cliente.',img:'trabajo 11.jpeg'},
 {id:'extra-3',name:'Rosas con Chocolate',cat:'Cajas',price:13,size:'Rosas rojas + dulces',desc:'Arreglo de rosas para el disfrute de tu persona especial.',img:'trabajo 12.jpeg'}
];
AE.product=function(id){return AE.PRODUCTS.filter(function(p){return p.id===id})[0]};
AE.ZONES=[
 {id:'retiro',name:'Retiro en taller',price:0},
 {id:'gato-negro',name:'Catia · Gato Negro',price:1},
 {id:'cercana',name:'Zona cercana',price:2},
 {id:'media',name:'Zona media',price:3},
 {id:'lejana',name:'Zona lejana',price:4},
 {id:'otra',name:'Otra zona / ciudad',price:null}
];
AE.zone=function(id){return AE.ZONES.filter(function(z){return z.id===id})[0]};
AE.STATUS=[['recibido','Recibido','📥'],['preparacion','En preparación','🌹'],['diseno','Diseñando ramo','✂️'],['camino','En camino','🛵'],['entregado','Entregado','🎉']];
AE.statusLabel=function(s){if(s==='cancelado')return 'Cancelado';var r=AE.STATUS.filter(function(x){return x[0]===s})[0];return r?r[1]:s};
AE.statusIdx=function(s){for(var i=0;i<AE.STATUS.length;i++)if(AE.STATUS[i][0]===s)return i;return -1};
AE.OCC=[['cumple','🎂','Cumpleaños'],['aniv','💍','Aniversario'],['madres','🌷','Día de las Madres'],['amor','❤️','San Valentín'],['grad','🎓','Graduación'],['otro','✨','Otra fecha']];
AE.occ=function(k){return AE.OCC.filter(function(o){return o[0]===k})[0]||AE.OCC[5]};
AE.SUGGEST={cumple:['vainilla','luna','extra-1'],aniv:['aniversario','corazon','primavera'],madres:['primavera','corazon','nupcial'],amor:['aniversario','extra-3','corazon'],grad:['primavera','nupcial','vainilla'],otro:['primavera','vainilla','luna']};
AE.CHANNELS=[['whatsapp','WhatsApp'],['correo','Correo'],['ambos','Ambos']];

/* ---------- utilidades ---------- */
AE.toast=function(t){var el=$('toast');if(!el){el=h('div',{class:'toast',id:'toast',role:'status'});document.body.append(el)}el.textContent=t;el.classList.add('on');clearTimeout(AE.toast.t);AE.toast.t=setTimeout(function(){el.classList.remove('on')},3000)};
AE.ago=function(d){var s=(Date.now()-new Date(d).getTime())/1000;
  if(s<60)return 'ahora';if(s<3600)return 'hace '+Math.floor(s/60)+' min';
  if(s<86400)return 'hace '+Math.floor(s/3600)+' h';if(s<604800)return 'hace '+Math.floor(s/86400)+' d';
  return new Date(d).toLocaleDateString('es',{day:'numeric',month:'short'})};
AE.hhmm=function(d){return new Date(d).toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'})};
AE.dayLabel=function(d){var x=new Date(d),t=new Date(),y=new Date();y.setDate(t.getDate()-1);
  if(x.toDateString()===t.toDateString())return 'Hoy';if(x.toDateString()===y.toDateString())return 'Ayer';
  return x.toLocaleDateString('es',{day:'numeric',month:'long'})};
AE.first=function(n){return String(n||'').split(' ')[0]};
AE.fillAv=function(el,p){el.replaceChildren();var name=(p&&p.display_name)||'A';
  if(p&&p.avatar_url){var im=h('img',{src:p.avatar_url+(p._bust?'?v='+p._bust:''),alt:name});im.onerror=function(){im.remove();el.textContent=name.charAt(0).toUpperCase()};el.append(im)}
  else el.textContent=name.charAt(0).toUpperCase()};
AE.avatar=function(p,size){var el=h('span',{class:'av'});if(size)el.style.cssText='width:'+size+'px;height:'+size+'px;font-size:'+Math.round(size*.42)+'px';AE.fillAv(el,p);return el};
AE.waNumber=function(raw){var d=String(raw||'').replace(/\D/g,'');if(!d)return '';if(d.charAt(0)==='0')d='58'+d.slice(1);return d};
AE.shortId=function(id){return String(id||'').slice(0,6).toUpperCase()};

/* fechas */
AE.todayD=function(){var t=new Date();t.setHours(0,0,0,0);return t};
AE.parseD=function(s){var p=String(s).split('-');return new Date(+p[0],+p[1]-1,+p[2])};
AE.isoD=function(o){return o.getFullYear()+'-'+String(o.getMonth()+1).padStart(2,'0')+'-'+String(o.getDate()).padStart(2,'0')};
AE.nextOcc=function(d){var t=AE.todayD(),o=AE.parseD(d.event_date);if(d.repeat_yearly!==false){o.setFullYear(t.getFullYear());if(o<t)o.setFullYear(t.getFullYear()+1)}return o};
AE.dleft=function(d){return Math.round((AE.nextOcc(d)-AE.todayD())/864e5)};
AE.cd=function(n){return n<0?'Ya pasó':n===0?'¡Es hoy!':n===1?'Mañana':'Faltan '+n+' días'};
AE.longDate=function(o){return o.toLocaleDateString('es',{weekday:'short',day:'numeric',month:'long'})};

/* iconos */
AE.ico={
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
  share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  bag:'<path d="M6 7h12l1 13H5z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  box:'<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9z"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'
};
AE.icon=function(path){var s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');s.innerHTML=path;return s};

/* imágenes */
AE.shrink=function(file,max,q){return new Promise(function(res,rej){
  var url=URL.createObjectURL(file),im=new Image();
  im.onload=function(){var r=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');
    c.width=Math.round(im.width*r);c.height=Math.round(im.height*r);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);
    c.toBlob(function(b){b?res(b):rej(new Error('blob'))},'image/jpeg',q)};
  im.onerror=function(){URL.revokeObjectURL(url);rej(new Error('img'))};im.src=url})};
AE.squareCrop=function(file,size){return new Promise(function(res,rej){
  var url=URL.createObjectURL(file),im=new Image();
  im.onload=function(){var s=Math.min(im.width,im.height),c=document.createElement('canvas');c.width=c.height=size;
    c.getContext('2d').drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,size,size);URL.revokeObjectURL(url);
    c.toBlob(function(b){b?res(b):rej(new Error('blob'))},'image/jpeg',.88)};
  im.onerror=function(){rej(new Error('img'))};im.src=url})};
AE.uploadAvatar=async function(uid,file){
  var blob=await AE.squareCrop(file,512);
  var path=uid+'/avatar-'+Date.now()+'.jpg';

  var up=await AE.sb.storage
    .from('avatars')
    .upload(path,blob,{
      upsert:false,
      contentType:'image/jpeg',
      cacheControl:'3600'
    });

  if(up.error)throw up.error;

  var url=AE.sb.storage
    .from('avatars')
    .getPublicUrl(path).data.publicUrl;

  var r=await AE.sb
    .from('profiles')
    .update({avatar_url:url})
    .eq('id',uid);

  if(r.error)throw r.error;

  return url;
};

/* hojas y visor */
var sheetEl=null;
AE.closeSheet=function(){if(sheetEl){sheetEl.remove();sheetEl=null;document.body.classList.remove('lock')}};
AE.openSheet=function(node){AE.closeSheet();sheetEl=h('div',{class:'sheet-bg',onclick:function(e){if(e.target===sheetEl)AE.closeSheet()}},node);document.body.append(sheetEl);document.body.classList.add('lock')};
AE.sheet=function(title,body,label){return h('div',{class:'sheet',role:'dialog','aria-label':label||title},
  h('div',{class:'sheet-h'},h('h3',{text:title}),h('button',{class:'x',type:'button','aria-label':'Cerrar',onclick:AE.closeSheet},'×')),
  h('div',{class:'sheet-b'},body))};
document.addEventListener('keydown',function(e){if(e.key==='Escape')AE.closeSheet()});
AE.zoom=function(u){var lb=h('div',{class:'lightbox',onclick:function(){lb.remove()}},h('img',{src:u,alt:'Foto ampliada'}));document.body.append(lb)};

/* pétalos */
AE.petals=function(box,n){
  var cols=['#F9D5DE','#E39BB0','#F9EEC4','#D9A0AB','#FFF5E8'],P='M0 0C-.62 -.12 -.78 -.78 -.3 -1.02Q0 -1.12 .3 -1.02C.78 -.78 .62 -.12 0 0Z';
  for(var i=0;i<(n||11);i++){
    var s=14+Math.random()*18,d=9+Math.random()*8;
    var el=h('span',{class:'fp',style:'--x:'+(Math.random()*96).toFixed(1)+'%;--s:'+s.toFixed(0)+'px;--dur:'+d.toFixed(1)+'s;--dl:-'+(Math.random()*d).toFixed(1)+'s;--sp:'+(2.6+Math.random()*2).toFixed(1)+'s'});
    el.innerHTML='<svg viewBox="-.9 -1.2 1.8 1.3" aria-hidden="true"><path d="'+P+'" fill="'+cols[i%cols.length]+'" stroke="rgba(110,40,58,.2)" stroke-width=".03"/></svg>';
    box.append(el);
  }
};

/* navegación por secciones (compartida) */
AE.setCurrent=function(k){document.querySelectorAll('[data-go]').forEach(function(b){if(b.getAttribute('data-go')===k)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')})};
AE.setBadge=function(key,n){document.querySelectorAll('[data-bdg="'+key+'"]').forEach(function(b){b.hidden=!n;b.textContent=n>99?'99+':n})};
AE.buildNav=function(cfg){
  /* cfg: {secs:[[key,label]], tabs:[keys], bn:[[key,label,icon]], go:fn, badges:{key:bdgKey}} */
  var nav=$('nav'),pt=$('ptabs'),bn=$('bnav');
  function bdg(k){return cfg.badges&&cfg.badges[k]?h('span',{class:'nb','data-bdg':cfg.badges[k],hidden:true}):null}
  cfg.secs.forEach(function(s){nav.append(h('button',{type:'button','data-go':s[0],onclick:function(){cfg.go(s[0])}},s[1],bdg(s[0])))});
  cfg.tabs.forEach(function(k){var s=cfg.secs.filter(function(x){return x[0]===k})[0];pt.append(h('button',{class:'chip',type:'button','data-go':k,onclick:function(){cfg.go(k)}},s[1],bdg(k)))});
  cfg.bn.forEach(function(b){bn.append(h('button',{type:'button','data-go':b[0],onclick:function(){cfg.go(b[0])}},AE.icon(AE.ico[b[2]]),b[1],bdg(b[0])))});
};
})();
