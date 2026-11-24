import {icon} from './icons.js';
// Only the overview is expanded into the outer page. Other views have one bounded
// inner scrolling viewport, preserving the engine's fixed drawers and round dialogs.
const KEY='histodone_progress_panel_collapsed_v1';
export function bridgeLearnLayout(frame,doc,{workspace,onMode,onView}){
 const root=doc.documentElement,win=doc.defaultView,app=doc.getElementById('app');
 if(!app)return;
 let collapsed=false;try{collapsed=localStorage.getItem(KEY)==='1'}catch{}
 let raf=0,mode='',lastView='';
 const style=doc.createElement('style');style.textContent=`
 html[data-embed-flow=home],html[data-embed-flow=home] body{height:auto!important;min-height:0!important;overflow:hidden!important;background:transparent!important}
 html[data-embed-flow=home] #app{min-height:0!important;height:auto!important}
 html[data-embed-flow=home] #app .shell,html[data-embed-flow=home] #app .workspace{min-height:0!important;height:auto!important;overflow:visible!important}
 html[data-embed-flow=home] #app .main-content{padding:0 0 24px!important;background:transparent!important;max-width:none!important}
 html[data-embed-flow=home] #app .home-dashboard{padding:0!important;gap:18px!important}
 .home-toolbar,.home-tool-actions{display:none!important}
 .home-work-grid{transition:grid-template-columns 200ms cubic-bezier(.22,1,.36,1)}
 .home-today-panel{align-self:start;min-width:0!important}
 .progress-panel-toggle{display:flex;align-items:center;justify-content:center;gap:6px;min-height:40px;padding:5px 9px;border:1px solid var(--stroke);border-radius:8px;background:var(--surface-2);color:var(--ink-2);font:inherit;font-size:12px;font-weight:650;align-self:flex-end;margin:0 0 12px;cursor:pointer}
 .progress-panel-toggle svg{flex:none}
 .home-work-grid[data-progress-collapsed=true]{grid-template-columns:minmax(0,1fr) 48px!important}
 .home-today-panel[data-collapsed=true]{padding:3px!important;border-radius:10px;box-shadow:none;min-height:48px}
 .home-today-panel[data-collapsed=true]>:not(.progress-panel-toggle){display:none!important}
 .home-today-panel[data-collapsed=true] .progress-panel-toggle{width:40px;min-width:40px;padding:0;margin:0;align-self:center}
 .home-today-panel[data-collapsed=true] .progress-panel-toggle span{display:none}
 .home-today-panel[data-collapsed=true] .progress-panel-toggle svg{transform:rotate(180deg)}
 @media(max-width:740px){.home-work-grid[data-progress-collapsed=true]{grid-template-columns:1fr!important}.home-today-panel[data-collapsed=true]{padding:5px!important}.home-today-panel[data-collapsed=true] .progress-panel-toggle{width:100%;margin:0}.home-today-panel[data-collapsed=true] .progress-panel-toggle span{display:inline}.home-today-panel[data-collapsed=true] .progress-panel-toggle svg{transform:rotate(90deg)}}
 @media(prefers-reduced-motion:reduce){.home-work-grid{transition:none}}
 `;doc.head.append(style);
 function progress(){
  const panel=app.querySelector('.home-today-panel'),grid=app.querySelector('.home-work-grid');if(!panel||!grid)return;
  panel.id='homeProgressPanel';let button=panel.querySelector('.progress-panel-toggle');
  if(!button){button=doc.createElement('button');button.type='button';button.className='progress-panel-toggle';button.setAttribute('aria-controls','homeProgressPanel');button.addEventListener('click',()=>{collapsed=!collapsed;try{localStorage.setItem(KEY,collapsed?'1':'0')}catch{}progress();schedule()});panel.prepend(button)}
  panel.dataset.collapsed=String(collapsed);grid.dataset.progressCollapsed=String(collapsed);button.setAttribute('aria-expanded',String(!collapsed));const label=collapsed?'展开进度':'收起进度';button.title=label;button.setAttribute('aria-label',label);
  if(button.dataset.label!==label){button.dataset.label=label;button.innerHTML=icon('chevron-right','lumen-icon',16)+'<span>'+label+'</span>'}
 }
 function sync(){
  raf=0;if(frame.hidden||!frame.isConnected)return;
  const home=Boolean(app.querySelector('.home-dashboard')),study=Boolean(app.querySelector('.practice-layout,.round-prompt-backdrop,.practice-result,.finished-page'))||!home&&lastView==='study'&&!app.querySelector('.page-heading,.settings-grid');
  const overlay=Boolean(app.querySelector('.drawer-backdrop,.round-prompt-backdrop,.tour-layer,.learning-modal-backdrop'));
  const view=home?'home':study?'study':new URL(win.location.href).searchParams.get('view')||'home';
  const flow=home&&!overlay?'home':'frame';
  if(home)progress();
  if(root.dataset.embedFlow!==flow)root.dataset.embedFlow=flow;
  if(mode!==flow){mode=flow;frame.dataset.flow=flow;if(flow!=='home')frame.style.removeProperty('height')}
  onMode(flow,study);
  if(view!==lastView){lastView=view;onView(view)}
  if(flow==='home'){const main=app.querySelector('.main-content');if(main){const height=Math.ceil(main.getBoundingClientRect().bottom+win.scrollY);if(height>0&&Math.abs(frame.getBoundingClientRect().height-height)>1)frame.style.height=height+'px'}}
 }
 function schedule(){if(!raf)raf=requestAnimationFrame(sync)}
 const observer=new win.ResizeObserver(schedule);observer.observe(app);
 const mutation=new win.MutationObserver(schedule);mutation.observe(app,{childList:true,subtree:true});
 win.addEventListener('resize',schedule);doc.fonts?.ready.then(schedule);
 doc.addEventListener('wheel',e=>{if(mode!=='home'||e.ctrlKey||e.defaultPrevented||Math.abs(e.deltaY)<Math.abs(e.deltaX)||!e.cancelable)return;if(e.target.closest?.('select,input[type=number]'))return;const scale=e.deltaMode===1?16:e.deltaMode===2?workspace.clientHeight:1;e.preventDefault();workspace.scrollBy({top:e.deltaY*scale,behavior:'instant'})},{passive:false});
 frame._syncLayout=schedule;schedule();
}
