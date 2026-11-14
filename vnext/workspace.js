const base=new URL('../',window.location.href);
const spaces={
 learn:{title:'学习概览',eyebrow:'Your learning desk',url:new URL('./?embed=1',base).href},
 atlas:{title:'切片图谱',eyebrow:'Histology atlas',url:new URL('./atlas/',base).href},
 quiz:{title:'看图填空',eyebrow:'Image recognition',url:new URL('./image-quiz/',base).href}
};
const localViews={home:'概览',review:'复习',library:'词库',stats:'记录',settings:'设置'};
const frameCache=new Map();
let useNativeQuiz=new URLSearchParams(location.search).has('native');
let nativeQuiz=null,nativeQuizPending=null;
let useNativeAtlas=new URLSearchParams(location.search).has('nativeAtlas');
let nativeAtlas=null,nativeAtlasPending=null;
const stage=document.querySelector('#moduleStage');
const shell=document.querySelector('#shell');
const scrollRegion=document.querySelector('#workspace');
const status=document.querySelector('#frameStatus');
const scene=document.querySelector('.sculpture-frame');
const sculpture=document.querySelector('#sculpture');
const layerToggle=document.querySelector('#layerToggle');
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let current={space:'learn',view:'home',section:''},expanded=false,tx=0,ty=0,rx=0,ry=0,velocityX=0,velocityY=0,raf=0;
const prefersLight=()=>{try{return localStorage.getItem('lumen_atlas_theme_v1')!=='dark'}catch{return true}};
function theme(next){
 const t=next|| (prefersLight()?'light':'dark');
 document.documentElement.dataset.theme=t;
 document.querySelector('#themeToggle').textContent=t==='dark'?'☼':'◐';
 for(const frame of frameCache.values()){
  try{frame.contentDocument.documentElement.dataset.theme=t;}catch{}
 }
 nativeQuiz?.setTheme(t);
 nativeAtlas?.setTheme(t);
 try{localStorage.setItem('lumen_atlas_theme_v1',t)}catch{}
}
theme();
function parseRoute(){
 const u=new URL(location.href);
 const space=spaces[u.searchParams.get('space')]?u.searchParams.get('space'):'learn';
 const view=localViews[u.searchParams.get('view')]?u.searchParams.get('view'):'home';
 return {space,view,section:(u.searchParams.get('section')||'').replace(/[^a-zA-Z0-9-]/g,'').slice(0,80)};
}
function updateUrl(next,replace=false){
 const u=new URL(location.href);
 u.searchParams.set('space',next.space);
 if(next.space==='learn'&&next.view!=='home')u.searchParams.set('view',next.view);
 else u.searchParams.delete('view');
 if(next.space==='atlas'&&next.section)u.searchParams.set('section',next.section);
 else u.searchParams.delete('section');
 history[replace?'replaceState':'pushState']({lumen:true},'',u.pathname+u.search+u.hash);
}
function route(target,{replace=false,historyChange=true}={}){
 const next={space:spaces[target.space]?target.space:'learn',view:localViews[target.view]?target.view:'home',section:target.section||''};
 if(historyChange)updateUrl(next,replace);
 const old=current;
 current=next;
 document.body.dataset.space=next.space;
 document.querySelector('#currentSpace').textContent=spaces[next.space].title;
 document.querySelector('#currentView').textContent=next.space==='learn'&&next.view!=='home'?' / '+localViews[next.view]:'';
 document.querySelector('#moduleTitle').textContent=next.space==='learn'&&next.view!=='home'?localViews[next.view]:spaces[next.space].title;
 document.querySelector('#moduleEyebrow').textContent=spaces[next.space].eyebrow;
 document.title=spaces[next.space].title+' · LUMEN';
 document.querySelectorAll('[data-space]').forEach(node=>{
  const active=node.dataset.space===next.space&&(!node.dataset.view||next.view===node.dataset.view);
  node.classList.toggle('active',active);
  if(active)node.setAttribute('aria-current','page');else node.removeAttribute('aria-current');
 });
 for(const [name,frame] of frameCache)frame.hidden=name!==next.space;
 if(nativeQuiz){nativeQuiz.element.hidden=next.space!=='quiz';nativeQuiz.element.style.display=next.space==='quiz'?'block':'none'}
 if(nativeAtlas){nativeAtlas.element.hidden=next.space!=='atlas';nativeAtlas.element.style.display=next.space==='atlas'?'block':'none'}
 buildModuleTabs();
 activateFrame(next);
 if(old.space!==next.space||old.view!==next.view){scrollRegion.scrollTo({top:0,behavior:'instant'})}
}
function buildModuleTabs(){
 const target=document.querySelector('#moduleTabs');
 const options=current.space==='learn'
  ?[['home','概览'],['review','复习'],['library','词库'],['stats','记录']]
  :current.space==='quiz'
   ?[['home','训练设置'],['bank','全部题库'],['history','学习记录']]
   :[['index','章节目录'],['search','搜索图谱']];
 target.replaceChildren(...options.map(([id,label])=>{
  const b=document.createElement('button');b.type='button';b.dataset.tab=id;b.textContent=label;
  b.className=(current.space==='learn'&&current.view===id)||(current.space!=='learn'&&id==='home')?'active':'';
  b.addEventListener('click',()=>moduleTab(id));return b;
 }));
}
function moduleTab(id){
 if(current.space==='learn')return route({space:'learn',view:id});
 const frame=frameCache.get(current.space);
 if(!frame?.contentDocument&&!(current.space==='quiz'&&useNativeQuiz&&nativeQuiz)&&!(current.space==='atlas'&&useNativeAtlas&&nativeAtlas))return;
 const doc=frame?.contentDocument;
 if(current.space==='quiz'){
  if(useNativeQuiz&&nativeQuiz){nativeQuiz.tab(id);document.querySelectorAll('#moduleTabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));return}
  const node=doc.querySelector('.local-nav [data-view="'+id+'"],.bottom-tabs [data-view="'+id+'"]');
  if(node){node.click();document.querySelectorAll('#moduleTabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===id))}
 }else if(current.space==='atlas'&&useNativeAtlas&&nativeAtlas){nativeAtlas.tab(id);return}
 else if(id==='search'){
  const input=doc.getElementById('search');
  const menu=doc.getElementById('menuBtn');
  if(menu && innerWidth<=780)menu.click();
  input?.focus();
 }else{
  const overview=doc.querySelector('[data-target="overview"]');overview?.click();
 }
}
function activateFrame(target){
 if(target.space==='atlas'&&useNativeAtlas){
  if(nativeAtlas){nativeAtlas.element.hidden=false;nativeAtlas.element.style.display='block';status.hidden=true;return}
  if(nativeAtlasPending)return;
  status.hidden=false;status.textContent='正在接入原生切片图谱…';
  nativeAtlasPending=import('./modules/atlas.js').then(m=>m.mountAtlas(stage,{section:target.section})).then(instance=>{
   nativeAtlas=instance;
   instance.element.hidden=current.space!=='atlas';
   instance.element.style.display=current.space==='atlas'?'block':'none';
   instance.setTheme(document.documentElement.dataset.theme);
   instance.element.addEventListener('lumen:navigate',ev=>route(ev.detail));
   instance.element.addEventListener('lumen:section',ev=>{
    if(current.space!=='atlas')return;
    current.section=ev.detail.section;
    updateUrl(current,ev.detail.replace);
   });
   status.hidden=true;
  }).catch(e=>{console.error('Native Atlas failed; legacy fallback enabled',e);status.textContent='原生图谱加载异常，正在恢复兼容入口';useNativeAtlas=false;nativeAtlasPending=null;const u=new URL(location.href);u.searchParams.delete('nativeAtlas');history.replaceState(history.state,'',u);activateFrame(target)});
  return;
 }
 if(target.space==='quiz'&&useNativeQuiz){
  if(nativeQuiz){nativeQuiz.element.hidden=false;status.hidden=true;return}
  if(nativeQuizPending)return;
  status.hidden=false;status.textContent='正在接入原生识图引擎…';
  nativeQuizPending=import('./modules/quiz.js').then(m=>m.mountQuiz(stage)).then(instance=>{
   nativeQuiz=instance;
   instance.element.hidden=current.space!=='quiz';
   instance.setTheme(document.documentElement.dataset.theme);
   instance.element.addEventListener('lumen:navigate',ev=>route(ev.detail));
   status.hidden=true;
  }).catch(e=>{console.error('Native quiz failed; legacy fallback enabled',e);status.textContent='原生模块加载异常，正在恢复兼容入口';useNativeQuiz=false;nativeQuizPending=null;const u=new URL(location.href);u.searchParams.delete('native');history.replaceState(history.state,'',u);activateFrame(target)});
  return;
 }
 let frame=frameCache.get(target.space);
 if(!frame){
  frame=document.createElement('iframe');
  frame.className='module-frame';
  frame.title=spaces[target.space].title+'学习内容';
  frame.dataset.space=target.space;
  frame.loading='eager';
  frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
  const learnRoute=new URL(spaces.learn.url);if(target.view!=='home')learnRoute.searchParams.set('view',target.view);
  frame.src=target.space==='learn'?learnRoute.href:target.space==='atlas'&&target.section?spaces.atlas.url+'#'+target.section:spaces[target.space].url;
  frameCache.set(target.space,frame);
  stage.appendChild(frame);
  frame.addEventListener('load',()=>bridgeFrame(frame));
  status.hidden=false;status.textContent='正在载入'+spaces[target.space].title+'…';
 }else if(target.space==='learn'&&target.view!==lastLearnView(frame)){
  const node=frame.contentDocument?.querySelector('[data-action="nav"][data-view="'+target.view+'"]');
  if(node)node.click();else{const u=new URL(spaces.learn.url);if(target.view!=='home')u.searchParams.set('view',target.view);frame.src=u.href;}
 }
 else if(target.space==='atlas'&&target.section){
  try{frame.contentWindow.location.hash=target.section}catch{}
 }
 for(const [key,el] of frameCache)el.hidden=key!==target.space;
}
function lastLearnView(frame){
 try{return new URL(frame.contentWindow.location.href).searchParams.get('view')||'home'}catch{return 'home'}
}
function bridgeFrame(frame){
 let doc;try{doc=frame.contentDocument}catch{return}
 if(!doc||!doc.body)return;
 const space=frame.dataset.space;
 const stylesheet=document.createElement('style');stylesheet.id='lumen-vnext-adapter';
 const common='html{scroll-behavior:smooth!important}a,button{scroll-margin-top:16px}';
 const learnCSS=common+`
.sidebar,.topbar,.mobile-nav,.bottom-nav,.workspace-tabs,.nav-mobile{display:none!important}
#app .shell{display:block!important;min-height:0!important}
#app .workspace{width:100%!important;min-width:0!important;padding:0!important;margin:0!important}
#app .main-content{width:100%!important;min-width:0!important;padding:20px 22px 55px!important;margin:0!important;max-width:none!important}
#app .home-dashboard .home-hero,#app #hero-masthead{display:none!important}
#app .home-dashboard{gap:20px!important}
@media(max-width:650px){#app .main-content{padding:17px 13px 38px!important}}
`;
 const atlasCSS=common+`
body.atlas-page{margin:0!important;min-height:0!important}
.atlas-page .shell{min-height:0!important}
.atlas-page .side .brand,.atlas-page .app-nav,.atlas-page .nav-group-label,.atlas-page .side-footer{display:none!important}
.atlas-page .side{background:#f6f7fb!important;border-right:1px solid #e2e6ee;padding-top:22px!important;color:#303b52!important}
.atlas-page .side .nav-btn{color:#46516e!important}
.atlas-page .side .nav-btn .count{color:#74829a!important}
.atlas-page .side .nav-btn:hover{background:#e9ebf5!important;color:#332e5b!important}
.atlas-page .side .nav-btn.active{background:#eae7fb!important;color:#332e5b!important}
.atlas-page .side .nav-label,.atlas-page .side .atlas-nav-heading{color:#66718d!important}
:root[data-theme=dark] .atlas-page .side{background:#1c2637!important;color:#d3dfef!important;border-color:#36445b}
:root[data-theme=dark] .atlas-page .side .nav-btn{color:#c8d5ea!important}
:root[data-theme=dark] .atlas-page .side .nav-btn.active{background:#373758!important;color:#f2efff!important}
:root[data-theme=dark] .atlas-page .side .nav-label{color:#a6b3c9!important}
.atlas-page .topbar,.atlas-page .workspace-tabs,.atlas-page .site-return{display:none!important}
.atlas-page .main{min-width:0!important;max-width:none!important}
.atlas-page .reader-wrap{min-width:0!important;max-width:none!important;padding:22px 25px 70px!important}
@media(max-width:750px){.atlas-page .side{z-index:500!important}.atlas-page .reader-wrap{padding:15px 13px 50px!important}}
`;
 const quizCSS=common+`
body{margin:0!important}
.shell{display:block!important;min-height:0!important}
.sidebar,.topbar,.bottom-tabs,.scrim{display:none!important}
.content-area{width:100%!important;max-width:none!important;min-width:0!important;margin:0!important}
.main{width:100%!important;max-width:none!important;padding:22px 27px 70px!important}
.page-head h1{font-size:30px!important}
@media(max-width:650px){.main{padding:17px 14px 40px!important}}
`;
 stylesheet.textContent=space==='learn'?learnCSS:space==='atlas'?atlasCSS:quizCSS;
 doc.getElementById(stylesheet.id)?.remove();
 doc.head.append(stylesheet);
 doc.documentElement.dataset.theme=document.documentElement.dataset.theme;
 doc.addEventListener('click',e=>{
  const a=e.target.closest?.('a[href]');if(!a||e.defaultPrevented)return;
  const href=a.getAttribute('href');
  if(!href||href.startsWith('#')||a.hasAttribute('download'))return;
  let u;try{u=new URL(href,frame.contentWindow.location.href)}catch{return}
  if(u.origin!==base.origin)return;
  const relative=u.pathname.slice(base.pathname.length).replace(/^\/+/,'');
  let next=null;
  if(relative===''||relative==='index.html'){next={space:'learn',view:localViews[u.searchParams.get('view')]?u.searchParams.get('view'):'home'}}
  if(relative==='atlas/'||relative==='atlas/index.html'){next={space:'atlas',section:u.hash.slice(1)}}
  if(relative==='image-quiz/'||relative==='image-quiz/index.html'){next={space:'quiz'}}
  if(!next)return;
  e.preventDefault();e.stopImmediatePropagation();route(next);
 },true);
 if(space==='atlas'){
  frame.contentWindow.addEventListener('hashchange',()=>{
   if(current.space!=='atlas')return;
   const section=frame.contentWindow.location.hash.slice(1);
   if(section!==current.section){current.section=section;updateUrl(current,true)}
  });
 }
 frame.addEventListener('focus',()=>{doc.documentElement.dataset.theme=document.documentElement.dataset.theme});
 if(space==='learn'&&current.space==='learn'&&current.view!==lastLearnView(frame)){
  const node=doc.querySelector('[data-action="nav"][data-view="'+current.view+'"]');node?.click();
 }
 status.hidden=true;
}
document.addEventListener('click',e=>{
 const anchor=e.target.closest?.('a[data-space]');if(anchor){e.preventDefault();route({space:anchor.dataset.space,view:anchor.dataset.view||'home'});return}
 const button=e.target.closest?.('[data-go]');if(button)route({space:button.dataset.go});
});
window.addEventListener('popstate',()=>route(parseRoute(),{historyChange:false}));
document.querySelector('#themeToggle').addEventListener('click',()=>theme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
function setExploded(next){
 expanded=Boolean(next);
 scene.classList.toggle('is-expanded',expanded);
 sculpture.setAttribute('aria-pressed',String(expanded));
 sculpture.setAttribute('aria-label',expanded?'收起显微层片':'展开显微层片');
 layerToggle.setAttribute('aria-pressed',String(expanded));
 layerToggle.innerHTML=expanded?'收拢层片 <span aria-hidden="true">×</span>':'探索内部结构 <span aria-hidden="true">+</span>';
}
layerToggle.addEventListener('click',()=>setExploded(!expanded));
sculpture.addEventListener('click',()=>setExploded(!expanded));
sculpture.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setExploded(!expanded)}});
function pointerMove(e){
 if(reduced())return;
 const r=scene.getBoundingClientRect();
 tx=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width/2)));
 ty=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/(r.height/2)));
 ensureMotion();
}
scene.addEventListener('pointermove',pointerMove,{passive:true});
scene.addEventListener('pointerleave',()=>{tx=0;ty=0;ensureMotion()});
function ensureMotion(){if(!raf&&!reduced())raf=requestAnimationFrame(tick)}
function tick(){
 const targetX=ty*-7,targetY=tx*9;
 velocityX=(velocityX+(targetX-rx)*.075)*.79;
 velocityY=(velocityY+(targetY-ry)*.075)*.79;
 rx+=velocityX;ry+=velocityY;
 sculpture.style.setProperty('--rx',rx.toFixed(3)+'deg');
 sculpture.style.setProperty('--ry',ry.toFixed(3)+'deg');
 if(Math.abs(rx-targetX)+Math.abs(ry-targetY)+Math.abs(velocityX)+Math.abs(velocityY)>.05){
  raf=requestAnimationFrame(tick);
 }else{raf=0}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0}else if(!document.hidden)ensureMotion()});
route(parseRoute(),{historyChange:false});
