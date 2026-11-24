import { icon } from './icons.js';
import { enter, reduce } from './motion.js';
export const GUIDE_KEY='lumen_workspace_guide_v1';
const steps=[
 {title:'从这里开始',body:'首页是你的学习工作台。先定范围，再选择适合自己的训练方式。',icon:'house',outer:'#heroTitle',fallback:'.primary-nav [data-space=learn],.mobile-nav [data-space=learn][data-view=home]'},
 {title:'先选学习范围',body:'点击词单选择器，选择考试重点、R10 或具体课程。下方的训练与统计随范围更新。',icon:'book-open',inner:'.scope-chooser',target:{space:'learn',view:'home'}},
 {title:'选择训练方式',body:'先进入新词学习，再选填空、选择或混合。复习自动沿用每个已学术语的题型。',icon:'refresh-cw',inner:'.home-mode-card',target:{space:'learn',view:'home'}},
 {title:'看见真实结构',body:'切片图谱和看图填空都从全局导航进入。先观察结构，再独立辨认。',icon:'layers',outer:'.primary-nav [data-space=atlas],.mobile-nav [data-space=atlas]',target:{space:'atlas'}},
 {title:'看懂学习进度',body:'右侧记录今日作答与最近七天的练习量。可随时收起，给训练腾出空间。',icon:'chart-no-axes-column',inner:'.home-today-panel .progress-panel-toggle',target:{space:'learn',view:'stats'}},
 {title:'备份学习记录',body:'数据只保存在当前浏览器。通过设置与备份导出 JSON，换设备时再导入。识图记录请单独备份。',icon:'shield-check',outer:'.settings-link',target:{space:'learn',view:'settings'}}
];
export function installGuide({navigate}){
 const $=s=>document.querySelector(s),dlg=$('#workspaceGuide'),spot=$('#guideSpotlight'),card=$('#guideCard'),workspace=$('#workspace');
 let step=0,restore=null,raf=0,scrollStart=0,scrollTarget=null,last=null;
 const seen=()=>{try{return localStorage.getItem(GUIDE_KEY)==='done'}catch{return false}};
 const visible=el=>el&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
 const outer=selector=>selector?[...document.querySelectorAll(selector)].find(visible):null;
 function target(){
  const s=steps[step],frame=document.querySelector('iframe[data-space=learn]:not([hidden])');
  if(s.inner&&frame?.contentDocument){const el=frame.contentDocument.querySelector(s.inner);if(el&&el.getClientRects().length)return {el,frame}}
  const el=outer(s.outer)||outer(s.fallback)||outer('.primary-nav [data-space=learn],.mobile-nav [data-space=learn][data-view=home]')||$('#currentSpace');return {el,frame:null};
 }
 function rect({el,frame}){const r=el.getBoundingClientRect(),f=frame?.getBoundingClientRect();return {x:r.left+(f?.left||0),y:r.top+(f?.top||0),width:r.width,height:r.height}}
 function follow(){
  if(!dlg.open)return;
  const t=target(),r=rect(t),w=innerWidth,h=innerHeight,wr=workspace.getBoundingClientRect(),inside=t.frame||workspace.contains(t.el);
  if(last!==t.el){last=t.el;if(inside){const dest=workspace.scrollTop+r.y-wr.top-Math.max(16,(workspace.clientHeight-Math.min(r.height,140))*.29);workspace.scrollTo({top:Math.max(0,dest),behavior:reduce()?'instant':'smooth'})}}
  const left=Math.max(7,r.x-6),top=Math.max(7,inside?wr.top+3:0,r.y-6),right=Math.min(w-7,r.x+r.width+6),bottom=Math.min(h-7,inside?wr.bottom-3:h,r.y+r.height+6);
  const sw=Math.max(0,right-left),sh=Math.max(0,bottom-top);
  Object.assign(spot.style,{left:left+'px',top:top+'px',width:sw+'px',height:sh+'px'});spot.dataset.target=steps[step].inner||steps[step].outer;spot.dataset.positioned=String(sw>0&&sh>0);
  const cw=card.offsetWidth,ch=card.offsetHeight,gap=14;let x,y;
  if(right+gap+cw<=w-12){x=right+gap;y=Math.min(top,h-ch-12)}
  else if(left-cw-gap>=12){x=left-cw-gap;y=Math.min(top,h-ch-12)}
  else if(bottom+gap+ch<=h-12){x=Math.max(12,Math.min(left,w-cw-12));y=bottom+gap}
  else if(top-ch-gap>=12){x=Math.max(12,Math.min(left,w-cw-12));y=top-ch-gap}
  else{x=Math.max(12,Math.min(left,w-cw-12));y=top>h/2?12:h-ch-12}
  card.style.left=Math.max(12,x)+'px';card.style.top=Math.max(12,y)+'px';
  raf=requestAnimationFrame(follow);
 }
 function paint(){const s=steps[step];$('#guideTitle').textContent=s.title;$('#guideText').textContent=s.body;$('#guideIcon').innerHTML=icon(s.icon);$('#guideCount').textContent=(step+1)+' / '+steps.length;$('#guideBack').hidden=step===0;$('#guideVisit').hidden=!s.target;$('#guideNext').textContent=step===steps.length-1?'完成导览':step===0?'开始导览':'下一步';const progress=$('#guideProgress');progress.setAttribute('aria-valuemax',steps.length);progress.setAttribute('aria-valuenow',step+1);progress.replaceChildren(...steps.map((_,i)=>Object.assign(document.createElement('span'),{className:i<=step?'on':''})));last=null;enter($('.guide-content'));$('#guideNext').focus({preventScroll:true});cancelAnimationFrame(raf);follow()}
 function open(){if(dlg.open)return;restore=document.activeElement;scrollStart=workspace.scrollTop;step=0;last=null;dlg.showModal();paint()}
 function finish(destination){try{localStorage.setItem(GUIDE_KEY,'done')}catch{}cancelAnimationFrame(raf);if(dlg.open)dlg.close();if(destination)navigate(destination);else{workspace.scrollTop=scrollStart;restore?.focus?.({preventScroll:true})}}
 $('#guideClose').innerHTML=icon('x');$('#guideClose').onclick=()=>finish();$('#guideSkip').onclick=()=>finish();$('#guideBack').onclick=()=>{step=Math.max(0,step-1);paint()};$('#guideNext').onclick=()=>{if(++step>=steps.length)finish();else paint()};$('#guideVisit').onclick=()=>finish(steps[step].target);dlg.addEventListener('cancel',e=>{e.preventDefault();finish()});
 return {open,maybeOpen(route){if(!seen()&&route.space==='learn'&&route.view==='home')open()}};
}
