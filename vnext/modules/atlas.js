const atlasBase=new URL('../../atlas/',import.meta.url);
export async function mountAtlas(parent,opts={}){
 const html=await window.fetch(new URL('../../atlas/index.html',import.meta.url)).then(r=>r.text());
 const rawCSS=await window.fetch(new URL('../../atlas/atlas.css',import.meta.url)).then(r=>r.text());
 const template=new DOMParser().parseFromString(html,'text/html');
 const element=window.document.createElement('div');element.className='vnext-native-atlas';
 element.dataset.theme=window.document.documentElement.dataset.theme||'light';
 element.style.cssText='display:block;min-width:0';
 const shadow=element.attachShadow({mode:'open'});
 const style=window.document.createElement('style');
 style.textContent=rawCSS.replace(/:root\[data-theme=dark\]/g,':host([data-theme=dark])').replace(/:root/g,':host')+`
:host{display:block}
.atlas-root{background:var(--page);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;min-width:0}
.atlas-root .shell{min-height:0!important}
.atlas-root .side .brand,.atlas-root .side .app-nav,.atlas-root .side .nav-group-label,.atlas-root .side .side-footer,.atlas-root .topbar,.atlas-root .workspace-tabs{display:none!important}
.atlas-root .side{background:#f6f7fb!important;color:#3f4961!important;border-right:1px solid #e1e6ef!important}
.atlas-root .side .nav-btn{color:#46516e!important}
.atlas-root .side .nav-btn.active{color:#39316c!important;background:#eae7fb!important}
.atlas-root .side .nav-label{color:#69768e!important}
.atlas-root .reader-wrap{max-width:none!important;padding:20px 25px 68px!important}
.atlas-root .page-title:focus{outline:none}
.atlas-root .article{max-width:none!important;line-height:1.7}
.atlas-root .article>p,.atlas-root .article>ul,.atlas-root .article>ol,.atlas-root .article>blockquote{max-width:75ch}
.atlas-root .article table{display:table!important;width:100%!important;min-width:0!important;max-width:100%!important;table-layout:auto!important;overflow:visible;border-collapse:collapse;line-height:1.7;font-size:14px}
.atlas-root .article table th,.atlas-root .article table td{padding:13px 15px;border-bottom:.5px solid var(--line);overflow-wrap:anywhere}
.atlas-root .term-evidence-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,245px),1fr));gap:14px}
.atlas-root .term-evidence-item{width:100%;max-width:540px;box-shadow:none}
.atlas-root .term-evidence-item .term-image{object-fit:contain}
.atlas-root .chat-gallery-2,.atlas-root .evidence-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,245px),1fr))}
@media(max-width:700px){.atlas-root .article table{font-size:13px}.atlas-root .article table th,.atlas-root .article table td{padding:10px 9px}.atlas-root .term-evidence-list,.atlas-root .chat-gallery-2,.atlas-root .evidence-grid{grid-template-columns:1fr}}

:host([data-theme=dark]) .atlas-root .side{background:#1c2637!important;color:#d2dbed!important;border-color:#3c4961!important}
:host([data-theme=dark]) .atlas-root .side .nav-btn{color:#c8d5ea!important}
:host([data-theme=dark]) .atlas-root .side .nav-btn.active{color:#f2efff!important;background:#373758!important}
@media(max-width:780px){.atlas-root .reader-wrap{padding:17px 14px 48px!important}.atlas-root .side{z-index:300!important}}
`;
 shadow.append(style);
 const body=window.document.createElement('div');body.className='atlas-root atlas-page';body.innerHTML=template.body.innerHTML;shadow.append(body);parent.append(element);
 const document={
  getElementById:id=>shadow.getElementById(id),
  querySelector:s=>shadow.querySelector(s),
  querySelectorAll:s=>shadow.querySelectorAll(s),
  createElement:x=>window.document.createElement(x),
  addEventListener:(type,fn,opt)=>shadow.addEventListener(type,fn,opt),
  get activeElement(){return shadow.activeElement},
  documentElement:element,
  body,
  title:''
 };
 let hash='#'+(opts.section||'overview'),search='';
 const location={
  get pathname(){return atlasBase.pathname},
  get hash(){return hash},
  set hash(v){hash=v},
  get search(){return search}
 };
 const atlasHistory={
  state:null,
  pushState(state,title,url){this.state=state;const u=new URL(url,atlasBase);hash=u.hash;search=u.search;announceSection(false)},
  replaceState(state,title,url){this.state=state;const u=new URL(url,atlasBase);hash=u.hash;search=u.search;announceSection(true)}
 };
 function announceSection(replace){
  element.dispatchEvent(new CustomEvent('lumen:section',{detail:{section:decodeURIComponent(hash.slice(1)),replace},bubbles:true,composed:true}));
 }
 const fetch=(input,init)=>window.fetch(new URL(input,atlasBase),init);
 const bridge=(e)=>{
  const a=e.target.closest?.('a[href]');if(!a)return;
  const u=new URL(a.getAttribute('href'),atlasBase);
  if(u.origin!==locationOrigin)return;
  const appRoot=new URL('../../',import.meta.url);
  const rel=u.pathname.slice(appRoot.pathname.length);
  const next=rel.startsWith('image-quiz/')?{space:'quiz'}:rel===''?{space:'learn',view:u.searchParams.get('view')||'home'}:null;
  if(!next)return;
  e.preventDefault();e.stopImmediatePropagation();
  element.dispatchEvent(new CustomEvent('lumen:navigate',{detail:next,bubbles:true,composed:true}));
 };
 const locationOrigin=window.location.origin;
 shadow.addEventListener('click',bridge,true);
 function initialize(){
'use strict';
(async()=>{
 const [DATA,ATLAS_V7,TERMS_V8,CREDITS]=await Promise.all([
   fetch('./data/manual.json').then(checkJSON),
   fetch('./data/image-map.json').then(checkJSON),
   fetch('./data/term-image-links.json').then(checkJSON),
   fetch('./data/credits.json').then(checkJSON)
 ]);
 for(const m of Object.values(ATLAS_V7.media||{})){
  for(const k of ['src','rel'])if(m[k]&&!/^https?:\/\//i.test(m[k]))m[k]=new URL(m[k],atlasBase).href;
 }
 for(const m of DATA.images||[])if(m.url&&!/^https?:\/\//i.test(m.url))m.url=new URL(m.url,atlasBase).href;
 function checkJSON(r){if(!r.ok)throw new Error(`${r.url}: HTTP ${r.status}`);return r.json()}




function mediaCreditHtml(id, category='media'){
 const c=(category==='chat'?CREDITS.chat:CREDITS.media)[id];
 if(!c)return '';
 return `<div class="image-credit"><span>来源</span><a href="${esc(c.url)}" title="${esc(c.reference||c.name)}" target="_blank" rel="noopener noreferrer">${esc(c.name)}</a></div>`;
}
function setModalCredit(id, category='media'){
 const c=(category==='chat'?CREDITS.chat:CREDITS.media)[id];
 const a=document.getElementById('modalCreditLink');
 if(!a)return;
 a.textContent=c?.name||'图片出处';a.href=c?.url||'#';a.title=c?.reference||c?.name||'';
}

function mediaHtml(mediaId, label, context=''){
 const m=ATLAS_V7.media[mediaId];
 if(!m)return `<figure class="evidence-card missing"><div class="evidence-media">暂无对应图像</div><figcaption class="evidence-body"><div class="evidence-name">${esc(label)}</div></figcaption></figure>`;
 return `<figure class="evidence-card"><button class="media-zoom" type="button" data-evidence="${encodeURIComponent(mediaId)}" aria-label="放大查看 ${esc(label)}"><img class="evidence-media" loading="lazy" src="${esc(m.src)}" alt="${esc(label)}"></button><div class="evidence-body"><div class="evidence-name">${esc(label)}</div>${mediaCreditHtml(mediaId)}<a class="evidence-link" href="${esc(m.src)}" target="_blank" rel="noopener noreferrer">查看图片</a></div></figure>`;
}
function sectionEvidence(id){const arr=ATLAS_V7.section[id]||[];if(!arr.length)return '';
 return `<div class="evidence-heading"><h2>对应切片图像</h2><p>${arr.length} 张</p></div><div class="evidence-grid">${arr.map(x=>mediaHtml(x.media,x.target)).join('')}</div>`;
}
function comparisonEvidence(id){const arr=ATLAS_V7.comparison[id]||[];return `<div class="row-comparison-grid">${arr.map(x=>mediaHtml(x.media,x.display,'')).join('')}</div>`}
function openEvidenceImage(encoded){const id=decodeURIComponent(encoded);const x=ATLAS_V7.media[id];if(!x)return;$('#modalImage').src=x.src;$('#modalImage').alt=x.source;$('#modalTitle').textContent=x.source;$('#modalUrl').href=x.src;$('#modalUrl').textContent='图片文件直达';$('#modalOriginal').href=x.src;setModalCredit(id);presentImageModal()}


/* v8 images are organized ONLY by terms explicitly present in the supplied handout. */

const EXTRA_MEDIA_V8={"WEB8:smear":{"src":"https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Normal_Adult_Blood_Smear.JPG/1200px-Normal_Adult_Blood_Smear.JPG","rel":"https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Normal_Adult_Blood_Smear.JPG/1200px-Normal_Adult_Blood_Smear.JPG","kind":"external","source":"Wikimedia Commons: blood smear","topic":"method"},"WEB8:frozen section":{"src":"https://images.squarespace-cdn.com/content/v1/55959060e4b01787e518c3d0/1436211604164-4UKXAQ41OVWZV8YY59OO/image-asset.jpeg","rel":"https://images.squarespace-cdn.com/content/v1/55959060e4b01787e518c3d0/1436211604164-4UKXAQ41OVWZV8YY59OO/image-asset.jpeg","kind":"external","source":"Pathology Innovations: frozen section with ice artifact","topic":"method"},"WEB8:giemsa stain":{"src":"https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Normal_Adult_Blood_Smear.JPG/1200px-Normal_Adult_Blood_Smear.JPG","rel":"https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Normal_Adult_Blood_Smear.JPG/1200px-Normal_Adult_Blood_Smear.JPG","kind":"external","source":"Wikimedia Commons: Giemsa-stained blood smear","topic":"method"},"WEB8:pas reaction":{"src":"https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Renal_corpuscle.jpg/1280px-Renal_corpuscle.jpg","rel":"https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Renal_corpuscle.jpg/1280px-Renal_corpuscle.jpg","kind":"external","source":"Wikimedia Commons: PAS-stained renal corpuscle","topic":"method"},"WEB8:immunohistochemistry":{"src":"https://www.dakewemedical.com/uploads/upload/images/20250610/42ad3337f39574a64e18951f1b1cc7c5.jpg","rel":"https://www.dakewemedical.com/uploads/upload/images/20250610/42ad3337f39574a64e18951f1b1cc7c5.jpg","kind":"external","source":"IHC example with DAB chromogen","topic":"method"},"WEB8:metachromasia":{"src":"https://ijdvl.com/content/126/2010/76/5/Images/ijdvl_2010_76_5_538_69083_f3.jpg","rel":"https://ijdvl.com/content/126/2010/76/5/Images/ijdvl_2010_76_5_538_69083_f3.jpg","kind":"external","source":"Toluidine-blue metachromasia mast-cell example","topic":"method"},"WEB8:cell culture":{"src":"https://cytion.b-cdn.net/media/32/c3/71/1674043567/HFL1%20P1%20305065-M%2010x01%20301122.jpg","rel":"https://cytion.b-cdn.net/media/32/c3/71/1674043567/HFL1%20P1%20305065-M%2010x01%20301122.jpg","kind":"external","source":"Human fibroblast culture phase contrast image","topic":"method"},"WEB8:transmission electron microscope":{"src":"https://ysm-res.cloudinary.com/image/upload/c_limit%2Cf_auto%2Ch_630%2Cq_auto%2Cw_1200/v1/yms/prod/7b7a46df-aaf9-44d4-b163-cd7f303f4232","rel":"https://ysm-res.cloudinary.com/image/upload/c_limit%2Cf_auto%2Ch_630%2Cq_auto%2Cw_1200/v1/yms/prod/7b7a46df-aaf9-44d4-b163-cd7f303f4232","kind":"external","source":"Yale TEM mitochondria example","topic":"method"},"WEB8:scanning electron microscope":{"src":"https://media.nature.com/lw800/magazine-assets/d42473-019-00127-2/d42473-019-00127-2_16704910.jpg","rel":"https://media.nature.com/lw800/magazine-assets/d42473-019-00127-2/d42473-019-00127-2_16704910.jpg","kind":"external","source":"Nature: SEM rat bronchial epithelium","topic":"method"},"WEB8:toluidine blue":{"src":"https://ijdvl.com/content/126/2010/76/5/Images/ijdvl_2010_76_5_538_69083_f3.jpg","rel":"https://ijdvl.com/content/126/2010/76/5/Images/ijdvl_2010_76_5_538_69083_f3.jpg","kind":"external","source":"Toluidine-blue stained mast cells, microscopy","topic":"method"},"WEB8:osteoprogenitor cell":{"src":"https://www.researchgate.net/publication/283855295/figure/fig5/AS%3A296120455581701%401447612026828/Periosteum-A-Schematic-illustration-of-the-periosteum-during-growth-B-C.png","rel":"https://www.researchgate.net/publication/283855295/figure/fig5/AS%3A296120455581701%401447612026828/Periosteum-A-Schematic-illustration-of-the-periosteum-during-growth-B-C.png","kind":"external","source":"Periosteum research micrograph: osteoprogenitors labeled","topic":"bone"},"WEB8:osteocyte":{"src":"https://m3e.meduniwien.ac.at/vm/histo/bildquiz/block2/roehrenknochen/pics/Bild4d.jpg","rel":"https://m3e.meduniwien.ac.at/vm/histo/bildquiz/block2/roehrenknochen/pics/Bild4d.jpg","kind":"external","source":"Medical University of Vienna: osteocyte in compact bone","topic":"bone"},"WEB8:perimysium":{"src":"https://mmegias.webs2.uvigo.es/02-english/a-iconos/muscular-estriado-vista-general.jpg","rel":"https://mmegias.webs2.uvigo.es/02-english/a-iconos/muscular-estriado-vista-general.jpg","kind":"external","source":"University of Vigo histology: perimysium labeled","topic":"muscle"},"WEB8:override:sec-5-1:tunica intima":{"src":"https://files.mickeymed.com/articles/513657277add98-c449-406c-8329-4e8df0007c35.png","rel":"https://files.mickeymed.com/articles/513657277add98-c449-406c-8329-4e8df0007c35.png","kind":"external","source":"Artery intima/media/adventitia labelled","topic":"circulatory"},"WEB8:override:sec-5-1:tunica media":{"src":"https://files.mickeymed.com/articles/513657277add98-c449-406c-8329-4e8df0007c35.png","rel":"https://files.mickeymed.com/articles/513657277add98-c449-406c-8329-4e8df0007c35.png","kind":"external","source":"Artery intima/media/adventitia labelled","topic":"circulatory"},"WEB8:override:sec-5-1:tunica adventitia":{"src":"https://files.mickeymed.com/articles/513657277add98-c449-406c-8329-4e8df0007c35.png","rel":"https://files.mickeymed.com/articles/513657277add98-c449-406c-8329-4e8df0007c35.png","kind":"external","source":"Artery intima/media/adventitia labelled","topic":"circulatory"},"WEB8:override:sec-7-1:stratum basale":{"src":"https://image.slideserve.com/1039252/slide17-l.jpg","rel":"https://image.slideserve.com/1039252/slide17-l.jpg","kind":"external","source":"Thick skin stratum basale labelled","topic":"integument"},"WEB8:override:sec-7-1:stratum lucidum":{"src":"https://image.slideserve.com/1039252/slide17-l.jpg","rel":"https://image.slideserve.com/1039252/slide17-l.jpg","kind":"external","source":"Thick skin stratum lucidum labelled","topic":"integument"},"WEB8:chromophobe":{"src":"https://slideplayer.com/slide/10700427/37/images/20/Figure%2B17.3d%2BThe%2Bpituitary%2Bgland%2B%28hypophysis%29..jpg","rel":"https://slideplayer.com/slide/10700427/37/images/20/Figure%2B17.3d%2BThe%2Bpituitary%2Bgland%2B%28hypophysis%29..jpg","kind":"external","source":"Pituitary H&E chromophobe labeled","topic":"endocrine"},"WEB8:override:sec-9-1:mucosa":{"src":"https://o.quizlet.com/UdLVpWNqsKbXOIeW-qkabQ.jpg","rel":"https://o.quizlet.com/UdLVpWNqsKbXOIeW-qkabQ.jpg","kind":"external","source":"GI mucosa labelled in wall","topic":"digestive_tube"},"WEB8:override:sec-9-1:submucosa":{"src":"https://o.quizlet.com/UdLVpWNqsKbXOIeW-qkabQ.jpg","rel":"https://o.quizlet.com/UdLVpWNqsKbXOIeW-qkabQ.jpg","kind":"external","source":"GI submucosa labelled in wall","topic":"digestive_tube"},"WEB8:override:sec-9-1:muscularis externa":{"src":"https://o.quizlet.com/UdLVpWNqsKbXOIeW-qkabQ.jpg","rel":"https://o.quizlet.com/UdLVpWNqsKbXOIeW-qkabQ.jpg","kind":"external","source":"GI muscularis externa labelled in wall","topic":"digestive_tube"},"WEB8:override:sec-9-1:serosa":{"src":"https://o.quizlet.com/UdLVpWNqsKbXOIeW-qkabQ.jpg","rel":"https://o.quizlet.com/UdLVpWNqsKbXOIeW-qkabQ.jpg","kind":"external","source":"GI serosa labelled in wall","topic":"digestive_tube"},"WEB8:alveolar duct":{"src":"https://s3.us-east-2.amazonaws.com/yalehistology/respiratory_system/respiratory_airways.jpg","rel":"https://s3.us-east-2.amazonaws.com/yalehistology/respiratory_system/respiratory_airways.jpg","kind":"external","source":"Yale histology: terminal/respiratory bronchioles, alveolar duct and sac","topic":"respiratory"},"WEB8:alveolar sac":{"src":"https://s3.us-east-2.amazonaws.com/yalehistology/respiratory_system/respiratory_airways.jpg","rel":"https://s3.us-east-2.amazonaws.com/yalehistology/respiratory_system/respiratory_airways.jpg","kind":"external","source":"Yale histology: terminal/respiratory bronchioles, alveolar duct and sac","topic":"respiratory"},"WEB8:type i pneumocyte":{"src":"https://s3.us-east-2.amazonaws.com/yalehistology/respiratory_system/air_blood_barrier.jpg","rel":"https://s3.us-east-2.amazonaws.com/yalehistology/respiratory_system/air_blood_barrier.jpg","kind":"external","source":"Yale histology: labelled Type I pneumocyte TEM","topic":"respiratory"},"WEB8:urinary bladder":{"src":"https://medcell.org/systems_cell_biology/urinary_system_lab/images/bladder_labels.jpg","rel":"https://medcell.org/systems_cell_biology/urinary_system_lab/images/bladder_labels.jpg","kind":"external","source":"Medcell urinary bladder labelled histology","topic":"urinary"},"WEB8:uterus":{"src":"https://s3.us-east-2.amazonaws.com/yalehistology/female_reproductive_system/uterus.jpg","rel":"https://s3.us-east-2.amazonaws.com/yalehistology/female_reproductive_system/uterus.jpg","kind":"external","source":"Yale/Medcell: uterus wall endometrium and myometrium","topic":"female"},"WEB8:endometrium":{"src":"https://s3.us-east-2.amazonaws.com/yalehistology/female_reproductive_system/secretory.jpg","rel":"https://s3.us-east-2.amazonaws.com/yalehistology/female_reproductive_system/secretory.jpg","kind":"external","source":"Yale/Medcell: secretory endometrium with uterine glands","topic":"female"},"WEB8:myometrium":{"src":"https://s3.us-east-2.amazonaws.com/yalehistology/female_reproductive_system/uterus.jpg","rel":"https://s3.us-east-2.amazonaws.com/yalehistology/female_reproductive_system/uterus.jpg","kind":"external","source":"Yale/Medcell: uterus wall endometrium and myometrium","topic":"female"},"WEB8:uterus wall":{"src":"https://s3.us-east-2.amazonaws.com/yalehistology/female_reproductive_system/uterus.jpg","rel":"https://s3.us-east-2.amazonaws.com/yalehistology/female_reproductive_system/uterus.jpg","kind":"external","source":"Yale/Medcell: uterus wall endometrium and myometrium","topic":"female"},"WEB8:uterine gland":{"src":"https://embryology.med.unsw.edu.au/embryology/images/0/0a/Uterine_gland_secretory_phase.jpg","rel":"https://embryology.med.unsw.edu.au/embryology/images/0/0a/Uterine_gland_secretory_phase.jpg","kind":"external","source":"UNSW embryology: uterine gland and endometrial stroma","topic":"female"},"WEB8:spiral artery":{"src":"https://o.quizlet.com/tv6pTNj6uc-bbeiVzqrkyw.png","rel":"https://o.quizlet.com/tv6pTNj6uc-bbeiVzqrkyw.png","kind":"external","source":"Annotated endometrium diagram: coiled/spiral arteries","topic":"female"},"WEB8:primary follicle":{"src":"https://medcell.org/histology/female_reproductive_system_lab/images/late_primary_follicle.jpg","rel":"https://medcell.org/histology/female_reproductive_system_lab/images/late_primary_follicle.jpg","kind":"external","source":"Medcell: late primary ovarian follicle","topic":"female"},"WEB8:atretic follicle":{"src":"https://www.medcurriculum.org/systems_cell_biology/female_reproductive_system_lab/images/atretic_follicle_labels.jpg","rel":"https://www.medcurriculum.org/systems_cell_biology/female_reproductive_system_lab/images/atretic_follicle_labels.jpg","kind":"external","source":"Medcurriculum: ovarian atretic follicle","topic":"female"},"WEB8:granulosa lutein cell":{"src":"https://medcell.org/systems_cell_biology/female_reproductive_system_lab/images/lutein_cells_labels.jpg","rel":"https://medcell.org/systems_cell_biology/female_reproductive_system_lab/images/lutein_cells_labels.jpg","kind":"external","source":"Medcell ovarian corpus luteum: granulosa luteal cells labeled","topic":"female"},"WEB8:theca lutein cell":{"src":"https://medcell.org/systems_cell_biology/female_reproductive_system_lab/images/lutein_cells_labels.jpg","rel":"https://medcell.org/systems_cell_biology/female_reproductive_system_lab/images/lutein_cells_labels.jpg","kind":"external","source":"Medcell ovarian corpus luteum: theca luteal cells labeled","topic":"female"},"WEB8:uterine tube":{"src":"https://www.pathologylive.com/practicas-histologia/bandejas/files/t_u_he_04x002.jpg","rel":"https://www.pathologylive.com/practicas-histologia/bandejas/files/t_u_he_04x002.jpg","kind":"external","source":"PathologyLive: uterine tube histology","topic":"female"},"R12:MI-418:c051d76b15ffb78673f4bc3a.webp":{"src":"images/c051d76b15ffb78673f4bc3a.webp","rel":"images/c051d76b15ffb78673f4bc3a.webp","kind":"local","source":"SecondLook-12 Respiratory Tract-Identify the cells in this terminal bronchiole epithelium that (1).webp","topic":"12_Respiratory_Tract"},"R12:MI-243:3615cfa396161c4d0026f95d.webp":{"src":"images/3615cfa396161c4d0026f95d.webp","rel":"images/3615cfa396161c4d0026f95d.webp","kind":"local","source":"SecondLook-04 Connective Tissue-Identify the cells indicated by the green arrows. (1).webp","topic":"04_Connective_Tissue"},"R12:V8-388:21f1875f5d293ada70cbc032.webp":{"src":"images/21f1875f5d293ada70cbc032.webp","rel":"images/21f1875f5d293ada70cbc032.webp","kind":"local","source":"SecondLook-11 Lymphatic System-Slide_ 13 (1).webp","topic":"11_Lymphatic_System"},"R12:R12-013:3eacf8a93a1e0e78923d5400.webp":{"src":"images/3eacf8a93a1e0e78923d5400.webp","rel":"images/3eacf8a93a1e0e78923d5400.webp","kind":"local","source":"SecondLook-20 Digestive System - Small & Large Intestine-Slide_ 8 (1).webp","topic":"20_Digestive_System_Small_Large_Intestine"},"R12:MI-244:3391f27aaaa4d78a2cd4b29b.webp":{"src":"images/3391f27aaaa4d78a2cd4b29b.webp","rel":"images/3391f27aaaa4d78a2cd4b29b.webp","kind":"local","source":"SecondLook-04 Connective Tissue-Identify the cells indicated by the green arrows. (2) (1).webp","topic":"04_Connective_Tissue"},"R12:V10-315-025:9d0645fe019af2902c244c4a.webp":{"src":"images/9d0645fe019af2902c244c4a.webp","rel":"images/9d0645fe019af2902c244c4a.webp","kind":"local","source":"SecondLook-16 Integumentary System-Slide_ 14 (1).webp","topic":"16_Integumentary_System"},"R12:V10-308-018:fd2f455f5887b7e239bec9da.webp":{"src":"images/fd2f455f5887b7e239bec9da.webp","rel":"images/fd2f455f5887b7e239bec9da.webp","kind":"local","source":"SecondLook-16 Integumentary System-Slide_ 7 (1).webp","topic":"16_Integumentary_System"},"R12:V10-254-046:484df6576b6d24df7f8119a9.webp":{"src":"images/484df6576b6d24df7f8119a9.webp","rel":"images/484df6576b6d24df7f8119a9.webp","kind":"local","source":"SecondLook-21 Liver-Slide_ 5 (1).webp","topic":"21_Liver"},"R12:R12-004:cbb3b98c073e02962965f594.webp":{"src":"images/cbb3b98c073e02962965f594.webp","rel":"images/cbb3b98c073e02962965f594.webp","kind":"local","source":"SecondLook-12 Respiratory Tract-Slide_ 9 (1).webp","topic":"12_Respiratory_Tract"},"R12:R12-001:ef3b67dfb12f7f266f830fd9.webp":{"src":"images/ef3b67dfb12f7f266f830fd9.webp","rel":"images/ef3b67dfb12f7f266f830fd9.webp","kind":"local","source":"SecondLook-12 Respiratory Tract-Slide_ 9 (1).webp","topic":"12_Respiratory_Tract"},"R12:V8-386:550a571b28b566c888f44781.webp":{"src":"images/550a571b28b566c888f44781.webp","rel":"images/550a571b28b566c888f44781.webp","kind":"local","source":"SecondLook-11 Lymphatic System-Slide_ 11 (1).webp","topic":"11_Lymphatic_System"},"R12:V10-308-017:fd2f455f5887b7e239bec9da.webp":{"src":"images/fd2f455f5887b7e239bec9da.webp","rel":"images/fd2f455f5887b7e239bec9da.webp","kind":"local","source":"SecondLook-16 Integumentary System-Slide_ 7 (1).webp","topic":"16_Integumentary_System"},"R12:R12-003:0276279c69aabd7ec70a5c00.webp":{"src":"images/0276279c69aabd7ec70a5c00.webp","rel":"images/0276279c69aabd7ec70a5c00.webp","kind":"local","source":"SecondLook-12 Respiratory Tract-Slide_ 9 (1).webp","topic":"12_Respiratory_Tract"},"R12:V9-109-09:4b99440e1b9a62ae345586af.webp":{"src":"images/4b99440e1b9a62ae345586af.webp","rel":"images/4b99440e1b9a62ae345586af.webp","kind":"local","source":"SecondLook-09 Blood and Bone Marrow-Slide_ 3 (1).webp","topic":"09_Blood_and_Bone_Marrow"},"R12:V8-387:fd4c955e218a70fef6ee82c4.webp":{"src":"images/fd4c955e218a70fef6ee82c4.webp","rel":"images/fd4c955e218a70fef6ee82c4.webp","kind":"local","source":"SecondLook-11 Lymphatic System-Slide_ 12 (1).webp","topic":"11_Lymphatic_System"},"R12:V12-031:b2f7ddab2477b39bc2abcf77.webp":{"src":"images/b2f7ddab2477b39bc2abcf77.webp","rel":"images/b2f7ddab2477b39bc2abcf77.webp","kind":"local","source":"SecondLook-12 Respiratory Tract-Slide_ 3 (1).webp","topic":"12_Respiratory_Tract"},"R12:R12-002:f931cc334b6b793810002a4a.webp":{"src":"images/f931cc334b6b793810002a4a.webp","rel":"images/f931cc334b6b793810002a4a.webp","kind":"local","source":"SecondLook-12 Respiratory Tract-Slide_ 9 (1).webp","topic":"12_Respiratory_Tract"},"R12:V8-389:85363c40076ac8a4172f765d.webp":{"src":"images/85363c40076ac8a4172f765d.webp","rel":"images/85363c40076ac8a4172f765d.webp","kind":"local","source":"SecondLook-11 Lymphatic System-Slide_ 14 (1).webp","topic":"11_Lymphatic_System"},"R12:DEEP-551-26:8e8165d5b05658717307ec92.webp":{"src":"images/8e8165d5b05658717307ec92.webp","rel":"images/8e8165d5b05658717307ec92.webp","kind":"local","source":"SecondLook-26 Female Reproductive System-Identify the organ shown in this micrograph. (1).webp","topic":"26_Female_Reproductive_System"}};
for(const media of Object.values(EXTRA_MEDIA_V8)){
 for(const key of ['src','rel'])if(media[key]&&!/^https?:\/\//i.test(media[key]))media[key]=new URL(media[key],atlasBase).href;
}
const TERM_MEDIA_V8=Object.assign({},ATLAS_V7.media,EXTRA_MEDIA_V8);
const _sectionEvidenceV7=sectionEvidence;
function v8MediaCard(item){
 const m=TERM_MEDIA_V8[item.media];if(!m)return '';
 const status=item.match==='technique-visual-example'?'染色／技术示例':
   item.match.includes('context')||item.match.includes('illustration')||item.match==='same-organ-labeled-structure'||item.match==='reused-same-section-target'?'器官／组织定位图':
   item.match==='web-explicit-labelled'?'结构标注图':'结构参考图';
 return `<figure class="term-evidence-item" data-match="${esc(item.match)}"><button class="media-zoom" type="button" data-termimage="${encodeURIComponent(item.media)}" data-termname="${encodeURIComponent(item.name)}" aria-label="放大查看 ${esc(item.name)}"><img class="term-image" loading="lazy" src="${esc(m.src)}" alt="${esc(item.name)}"></button><div class="term-caption"><strong>${esc(item.name)}</strong><small>${status}</small>${mediaCreditHtml(item.media)}<div class="term-links"><a href="${esc(m.src)}" target="_blank" rel="noopener noreferrer">查看图片</a></div></div></figure>`;
}
function openV8TermImage(mid,name){const id=decodeURIComponent(mid),m=TERM_MEDIA_V8[id];if(!m)return;const modal=document.getElementById('imageModal');document.getElementById('modalImage').src=m.src;document.getElementById('modalTitle').textContent=decodeURIComponent(name);document.getElementById('modalImage').alt=decodeURIComponent(name);document.getElementById('modalUrl').href=m.src;document.getElementById('modalUrl').textContent='图片直链';document.getElementById('modalOriginal').href=m.src;setModalCredit(id);presentImageModal()}
sectionEvidence=function(id){
 const terms=TERMS_V8[id];if(!terms||!terms.length)return _sectionEvidenceV7(id);
 const first=terms.slice(0,6),rest=terms.slice(6);
 return `<section class="term-evidence" aria-label="本节逐术语图片"><div class="term-evidence-header"><h2>本节逐术语图像</h2><small>${terms.length} 个 · 图文对照</small></div><div class="term-evidence-list">${first.map(v8MediaCard).join('')}</div>${rest.length?`<details class="term-evidence-more"><summary>展开其余 ${rest.length} 个术语图位</summary><div class="term-evidence-list">${rest.map(v8MediaCard).join('')}</div></details>`:''}<div class="term-evidence-meta">定位图与技术示例用于整体结构辨认。</div></section>`;
};

const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
let modalReturnFocus=null, bodyOverflowBeforeModal='';
function presentImageModal(){
 modalReturnFocus=document.activeElement;bodyOverflowBeforeModal=document.body.style.overflow;
 $('#imageModal').classList.add('open');document.body.style.overflow='hidden';
 requestAnimationFrame(()=>$('#closeModal').focus({preventScroll:true}));
}
function setSideOpen(open){
 const show=Boolean(open);$('#side').classList.toggle('open',show);$('#scrim').classList.toggle('open',show);
 $('#menuBtn').setAttribute('aria-expanded',String(show));
 if(!show && innerWidth<=850 && $('#side').contains(document.activeElement))$('#menuBtn').focus({preventScroll:true});
}

const icon={menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',theme:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z"/>'};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups=DATA.systems;
const groupMap=Object.fromEntries(groups.map(x=>[x.key,x]));
const secs=DATA.sections;
const secMap=Object.fromEntries(secs.map(x=>[x.id,x]));
const imgMap=Object.fromEntries(DATA.images.map(x=>[x.id,x]));
let current='overview',selectedGroup='all',lastQuery='';
function save(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function get(k,def=''){try{return localStorage.getItem(k)||def}catch(e){return def}}
function readHubTheme(){const shared=get('lumen_atlas_theme_v1','');if(['light','dark'].includes(shared))return shared;try{const saved=JSON.parse(localStorage.getItem('lumen_histology_recall_v1')||'null');if(['light','dark'].includes(saved?.prefs?.theme))return saved.prefs.theme}catch(e){}return 'light'}
document.documentElement.dataset.theme=readHubTheme();
window.addEventListener('storage',e=>{if(e.key==='lumen_histology_recall_v1'||e.key==='lumen_atlas_theme_v1')document.documentElement.dataset.theme=readHubTheme()});
function navMark(){const k=current.startsWith('group:')?current.slice(6):secMap[current]?.group;$$('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.target===current || (x.dataset.target==='group:'+k&&k && current!== 'overview')))}
function menuHtml(){let h='<button type="button" data-target="overview" class="nav-btn"><span>目录总览</span></button>';let prev='';for(const g of groups){if(g.area!==prev){h+=`<div class="nav-label">${esc(g.area)}</div>`;prev=g.area}h+=`<button type="button" class="nav-btn" data-target="group:${g.key}"><span>${esc(g.label)}</span><span class="count">${g.key==='comparisons'?45:g.n}</span></button>`}return h}
$('#sideNav').innerHTML=menuHtml();
function titleFor(){if(current==='overview')return '总目录';if(current.startsWith('group:'))return groupMap[current.slice(6)]?.label||'分区';return secMap[current]?.title||'阅读'}
function renderOverview(){const blocks=[];let prev='';for(const g of groups){if(g.area!==prev){blocks.push(`<h2>${esc(g.area)}</h2>`);prev=g.area}blocks.push(`<button class="section-tile" type="button" data-target="group:${g.key}"><span>${esc(g.en)} · ${g.key==='comparisons'?'45组辨析':g.n+'节'}</span><strong>${esc(g.label)}</strong></button>`)}
return `<div class="kicker">切片阅读 · 结构识别</div><h1 class="page-title">组织切片图谱</h1><p class="page-desc">按基础组织与器官系统检索切片，学习形态识别，并通过45组易混辨析巩固判断。</p><div class="stats"><span class="stat"><strong>${DATA.meta.source_sections}</strong> 个细分条目</span><span class="stat"><strong>${DATA.meta.images_occurrences}</strong> 处原图引用</span><span class="stat"><strong>${DATA.meta.images_unique}</strong> 个不同原图链接</span><span class="stat"><strong>45</strong> 组全局辨析</span></div><div class="notice warning"><strong>图像可用性</strong><div>部分图片需联网加载；无法显示时可点击图片来源或原图链接。</div></div><div class="section-index">${blocks.join('')}</div>`}
function renderGroup(k){const g=groupMap[k];if(!g)return '<div class="empty">分区不存在</div>';if(k==='comparisons')return renderComparisons();const ss=secs.filter(s=>s.group===k);return `<div class="kicker">${esc(g.area)} / ${esc(g.en)}</div><h1 class="page-title">${esc(g.label)}</h1><p class="page-desc">按器官和组织定位条目，查看形态特征与易混结构。</p><div class="section-index">${ss.map((s,i)=>`<button class="section-tile" type="button" data-target="${s.id}"><span>${s.section_num||'SOURCE'} · ${esc(s.source.replace(/第\d+章[｜|]/,'').slice(0,22))}</span><strong>${esc(s.title)}</strong></button>`).join('')}</div>`}
function renderSection(id){const s=secMap[id];if(!s)return '<div class="empty">小节不存在</div>';const g=groupMap[s.group];const all=secs.filter(x=>x.group===s.group);const at=all.findIndex(x=>x.id===id);const previous=at>0?all[at-1]:null,next=at+1<all.length?all[at+1]:null;const headings=[...s.html.matchAll(/<h[234]>(.*?)<\/h[234]>/g)].map(x=>x[1].replace(/<[^>]+>/g,'').slice(0,60));return `<div class="kicker">${esc(g.area)} / ${esc(g.label)}</div><h1 class="page-title">${esc(s.title)}</h1><article class="article" id="articleBody">${(s.id==='intro'?s.html.replace('<p>按14章课程顺序编写</p>',''):s.html).replace(/<h1\b[^>]*>/gi,'<h2 class="source-document-title">').replace(/<\/h1\s*>/gi,'</h2>')}</article>${sectionEvidence(id)}<div class="bottom-nav"><button type="button" data-target="${previous?previous.id:'group:'+s.group}">← ${esc(previous?previous.title:'返回本系统')}</button><button type="button" data-target="${next?next.id:'group:'+s.group}">${esc(next?next.title:'返回本系统')} →</button></div>`}
function renderComparisons(){const c=DATA.comparisons;const names=['全部',...new Set(c.map(x=>x.group))];return `<div class="kicker">ATLAS / DIFFERENTIALS</div><h1 class="page-title">全局易混辨析 · G01–G45</h1><p class="page-desc">对照组织形态、关键识别点与常见误判。</p><div class="stats"><span class="stat"><strong>45</strong> 组对照</span><span class="stat">器官级 · 细胞级 · 管腔级</span></div><div class="comp-toolbar">${names.map(x=>`<button type="button" class="comp-filter ${selectedGroup===x?'selected':''}" data-compgroup="${esc(x)}">${esc(x)}</button>`).join('')}</div><div>${c.filter(x=>selectedGroup==='全部'||selectedGroup==='all'||x.group===selectedGroup).map(x=>`<details class="comp-card" id="${x.id}"><summary><span class="comp-tag">${esc(x.id)}</span><span><span class="comp-heading">${esc(x.title)}</span><br><span class="comp-sub">${esc(x.sub)}</span></span></summary><div class="comp-inside">${comparisonEvidence(x.id)}<table><tbody>${x.rows.map(z=>`<tr><td>${esc(z[0])}</td><td>${esc(z[1])}</td></tr>`).join('')}</tbody></table><p><b>考场判断：</b>${esc(x.key)}</p><p><b>易错陷阱：</b>${esc(x.trap)}</p></div></details>`).join('')}</div>`}
function navTo(target,opts={}){
 if(!target)return;
 const update=()=>{
  current=target;
  if(!opts.keepFilter)selectedGroup='all';
  $('#reader').innerHTML=current==='overview'?renderOverview():current.startsWith('group:')?renderGroup(current.slice(6)):renderSection(current);
  $('#crumbTitle').textContent=titleFor();
  navMark();
  if(!opts.silent){
   atlasHistory.pushState({atlas:target},'',location.pathname+'#'+encodeURIComponent(target));
   window.scrollTo({top:0,behavior:'instant'});
   requestAnimationFrame(()=>{const heading=$('#reader h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}});
  }
  if(!opts.preserveSearch)$('#search').value='';
  setSideOpen(false);
  bindImages();
  document.title=`${titleFor()} · LUMEN`;
 };
 const canAnimate=!opts.silent&&!opts.noTransition&&typeof document.startViewTransition==='function'
  &&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(canAnimate){
  try{const transition=document.startViewTransition(update);transition.finished.catch(()=>{});}
  catch(e){update();}
 }else update();
}
function bindImages(){
 for(const im of $$('#reader img')){
  const chat=im.closest('.chat-image');
  if(chat){
   const id=im.dataset.imageId;
   if(id&&!chat.querySelector('.image-credit'))chat.insertAdjacentHTML('beforeend',mediaCreditHtml(id,'chat'));
   im.addEventListener('error',()=>{const el=chat.querySelector('.image-failed');if(el)el.firstElementChild.textContent='图片暂不可加载'},{once:true});
   im.addEventListener('load',()=>chat.querySelector('.image-failed')?.setAttribute('hidden',''),{once:true});
   continue;
  }
  const card=im.closest('.evidence-card,.term-evidence-item');
  if(!card)continue;
  const fail=()=>{
   if(card.querySelector('.image-unavailable'))return;
   const holder=im.closest('.media-zoom');if(holder)holder.hidden=true;
   const note=document.createElement('div');note.className='image-unavailable';note.textContent='图片暂时无法加载，可通过下方来源链接查看';
   card.insertBefore(note,card.querySelector('.evidence-body,.term-caption')||null);
  };
  im.addEventListener('error',fail,{once:true});
  // Rely on the load error event: lazy images may be incomplete until scrolled into view.
 }
}
function openImage(id){let rec=imgMap[id];if(!rec)return;$('#modalImage').src=rec.url;$('#modalImage').alt=rec.label;$('#modalTitle').textContent=`${rec.id} · ${rec.label.slice(0,110)}`;$('#modalUrl').textContent=rec.url;$('#modalUrl').href=rec.url;$('#modalOriginal').href=rec.url;setModalCredit(id,'chat');presentImageModal()}
function closeImage(){
 if(!$('#imageModal').classList.contains('open'))return;
 $('#imageModal').classList.remove('open');document.body.style.overflow=bodyOverflowBeforeModal;
 if(modalReturnFocus?.isConnected)modalReturnFocus.focus({preventScroll:true});
 modalReturnFocus=null;
}
document.addEventListener('click',e=>{const a=e.target.closest('[data-target]');if(a){navTo(a.dataset.target);return}const i=e.target.closest('[data-viewimage]');if(i){openImage(i.dataset.viewimage);return}
 const evidence=e.target.closest('[data-evidence]');if(evidence){openEvidenceImage(evidence.dataset.evidence);return}
 const term=e.target.closest('[data-termimage]');if(term){openV8TermImage(term.dataset.termimage,term.dataset.termname);return}
 const found=e.target.closest('[data-opencomp]');if(found){selectedGroup='all';navTo('group:comparisons',{keepFilter:true});const panel=document.getElementById(found.dataset.opencomp);if(panel){panel.open=true;panel.scrollIntoView({block:'start',behavior:'smooth'})}return}
 const f=e.target.closest('[data-compgroup]');if(f){selectedGroup=f.dataset.compgroup;navTo('group:comparisons',{keepFilter:true});return}if(e.target.matches('#imageModal'))closeImage()});
$('#closeModal').addEventListener('click',closeImage);
$('#themeBtn').addEventListener('click',()=>{const v=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=v;save('lumen_atlas_theme_v1',v);});
$('#menuBtn').setAttribute('aria-expanded','false');
$('#menuBtn').addEventListener('click',()=>setSideOpen(!$('#side').classList.contains('open')));
$('#scrim').addEventListener('click',()=>setSideOpen(false));
$('#topSearchBtn')?.addEventListener('click',()=>{setSideOpen(true);requestAnimationFrame(()=>$('#search').focus())});
const normalizedSearch=(s)=>String(s||'').normalize('NFKC').toLocaleLowerCase();
const sectionIndex=secs.map(s=>({section:s,key:normalizedSearch(s.title+' '+s.html.replace(/<[^>]+>/g,' '))}));
const comparisonIndex=DATA.comparisons.map(c=>({item:c,key:normalizedSearch(c.title+' '+c.sub+' '+c.group+' '+c.rows.map(r=>r.join(' ')).join(' '))}));
function sectionSearchRank(s,q){
 const title=normalizedSearch(s.title), group=normalizedSearch(groupMap[s.group]?.label||'');
 if(title===q)return 120;
 if(title.startsWith(q))return 100;
 if(title.includes(q))return 90;
 if(group.includes(q))return 70;
 return 10;
}
function renderSearchResults(q){
 const needle=normalizedSearch(q);
 const foundSections=sectionIndex.filter(x=>x.key.includes(needle)).map(x=>x.section)
  .sort((a,b)=>sectionSearchRank(b,needle)-sectionSearchRank(a,needle)).slice(0,80);
 const foundComparisons=comparisonIndex.filter(x=>x.key.includes(needle)).map(x=>x.item).slice(0,45);
 const total=foundSections.length+foundComparisons.length;
 $('#crumbTitle').textContent='搜索结果';document.title='搜索结果 · LUMEN';
 $('#reader').innerHTML=`<div class="kicker">图谱检索</div><h1 class="page-title">搜索结果</h1><p class="page-desc">“${esc(q)}” · ${total} 条结果，点击进入对应结构或辨析。</p>
 ${foundSections.length?`<h2 class="search-subheading">组织与器官 · ${foundSections.length}</h2><div class="section-index">${foundSections.map(s=>`<button type="button" class="section-tile" data-target="${esc(s.id)}"><span>${esc(groupMap[s.group]?.label||'组织学')}</span><strong>${esc(s.title)}</strong></button>`).join('')}</div>`:''}
 ${foundComparisons.length?`<h2 class="search-subheading">易混辨析 · ${foundComparisons.length}</h2><div class="section-index">${foundComparisons.map(c=>`<button type="button" class="section-tile" data-opencomp="${esc(c.id)}"><span>${esc(c.id)} · ${esc(c.group)}</span><strong>${esc(c.title)}</strong></button>`).join('')}</div>`:''}
 ${!total?'<div class="empty" role="status">没有匹配项。尝试完整结构名称、器官名称或英文术语。</div>':''}`;
}
let searchReturnTarget='overview';
function showSearch(q){
 const clean=String(q||'').trim();if(!clean){leaveSearch();return;}
 if(current!=='search')searchReturnTarget=current;
 const entering=current!=='search';current='search';
 const url=location.pathname+'?q='+encodeURIComponent(clean)+'#search';
 const state={atlas:'search',from:searchReturnTarget};
 if(entering)atlasHistory.pushState(state,'',url);else atlasHistory.replaceState(state,'',url);
 navMark();renderSearchResults(clean);
}
function leaveSearch(){
 setSideOpen(false);
 const target=searchReturnTarget&&searchReturnTarget!=='search'?searchReturnTarget:'overview';
 atlasHistory.replaceState({atlas:target},'',location.pathname+'#'+encodeURIComponent(target));
 $('#search').value='';navTo(target,{silent:true});
}
$('#search').addEventListener('input',e=>{
 const q=e.target.value.trim();if(!q){leaveSearch();return;}
 showSearch(q);
});
$('#search').addEventListener('keydown',e=>{
 if(e.key==='Enter' && e.target.value.trim()){
  e.preventDefault();setSideOpen(false);
  requestAnimationFrame(()=>{const heading=$('#reader h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}});
 }
});
document.addEventListener('keydown',e=>{
 const modal=$('#imageModal');
 if(modal.classList.contains('open')){
  if(e.key==='Escape'){e.preventDefault();closeImage();return}
  if(e.key==='Tab'){
   const items=Array.from(modal.querySelectorAll('a[href],button:not([disabled])')).filter(x=>x.getClientRects().length);
   if(items.length){const first=items[0],last=items.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
   }
  }
  return;
 }
 if(e.key==='Escape'){
  if($('#side').classList.contains('open'))setSideOpen(false);
  if($('#search').value){leaveSearch()}
 }
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){
  e.preventDefault();if(innerWidth<=850)setSideOpen(true);$('#search').focus();
 }
});
function handleHistoryNavigation(){
 const next=decodeURIComponent(location.hash.slice(1))||'overview';
 if(next==='search'){
  const q=new URLSearchParams(location.search).get('q')||'';
  current='search';searchReturnTarget=atlasHistory.state?.from||searchReturnTarget;
  $('#search').value=q;navMark();renderSearchResults(q);
 }else if(next!==current)navTo(next,{silent:true});
}
window.addEventListener('popstate',handleHistoryNavigation);
window.addEventListener('hashchange',handleHistoryNavigation);
window.openEvidenceImage=openEvidenceImage;
const initialRoute=decodeURIComponent(location.hash.slice(1))||'overview';
const initialSearch=new URLSearchParams(location.search).get('q');
if(initialSearch&&(initialRoute==='overview'||initialRoute==='search')){
 current='search';$('#search').value=initialSearch;
 if(initialRoute!=='search')atlasHistory.replaceState({atlas:'search',from:'overview'},'',location.pathname+'?q='+encodeURIComponent(initialSearch)+'#search');
 navMark();renderSearchResults(initialSearch);
}else navTo(initialRoute,{silent:true});

})().catch(err=>{console.error('Histology Atlas bootstrap failed',err);const el=document.getElementById('reader');if(el)el.innerHTML='<div class="notice warning"><strong>图谱数据载入失败</strong><p>请通过 Web 服务打开本站，确认 data/ 三份 JSON 文件已部署；若在本地直接双击 HTML，浏览器可能阻止读取 JSON。<br>错误：'+String(err.message).replace(/[&<>"']/g,'')+'</p></div>';});
 
}
 initialize();
 const tabs=id=>{
  if(id==='search'){shadow.getElementById('search')?.focus();return}
  const button=shadow.querySelector('[data-target="overview"]');button?.click();
 };
 return {element,tab:tabs,setTheme:t=>{element.dataset.theme=t},getRoot:()=>shadow};
}
