import { icon } from './icons.js';
import { enter } from './motion.js';
export const GUIDE_KEY='lumen_workspace_guide_v1';
const steps=[
 ['欢迎来到 LUMEN','在这里，术语、切片与识图训练共享同一个工作区。第一次使用，快速了解操作；以后可在顶部问号重看。','house'],
 ['选择训练范围','概览中的课程范围支持 R10 核心、综合范围或单独章节；统计和训练随范围更新。','book-open',{space:'learn',view:'home'}],
 ['选择训练方式','新词学习只抽未接触词，到期复习只抽应复习词；英文拼写与四选一辨认可单独训练。','refresh-cw',{space:'learn',view:'home'}],
 ['切片图谱与识图','先在图谱中观察结构、辨析易混点，再在看图填空中独立作答。两者可随时切换。','layers',{space:'atlas'}],
 ['读懂学习记录','七日图表显示真实作答次数，点按柱形可查看当天数据。学习记录可随时从侧栏打开。','chart-no-axes-column',{space:'learn',view:'stats'}],
 ['备份你的学习记录','学习数据仅保存在当前浏览器。设置与备份可导出 JSON，也可在新设备导入；识图记录请在识图模块单独备份。','shield-check',{space:'learn',view:'settings'}]
];
export function installGuide({navigate}){
 const $=s=>document.querySelector(s),dlg=$('#workspaceGuide');
 let step=0,restore=null;
 const seen=()=>{try{return localStorage.getItem(GUIDE_KEY)==='done'}catch{return false}};
 function paint(){const [title,body,name,target]=steps[step];$('#guideTitle').textContent=title;$('#guideText').textContent=body;$('#guideIcon').innerHTML=icon(name);$('#guideCount').textContent=(step+1)+' / '+steps.length;$('#guideBack').hidden=step===0;$('#guideVisit').hidden=!target;$('#guideNext').textContent=step===steps.length-1?'完成导览':step===0?'开始导览':'下一步';const progress=$('#guideProgress');progress.setAttribute('aria-valuemax',steps.length);progress.setAttribute('aria-valuenow',step+1);progress.replaceChildren(...steps.map((_,i)=>Object.assign(document.createElement('span'),{className:i<=step?'on':''})));enter($('.guide-content'));$('#guideNext').focus({preventScroll:true})}
 function open(){if(dlg.open)return;restore=document.activeElement;step=0;dlg.showModal();paint()}
 function finish(target){try{localStorage.setItem(GUIDE_KEY,'done')}catch{}if(dlg.open)dlg.close();if(target)navigate(target);else restore?.focus?.({preventScroll:true})}
 $('#guideClose').innerHTML=icon('x');$('#guideClose').onclick=()=>finish();$('#guideSkip').onclick=()=>finish();$('#guideBack').onclick=()=>{step=Math.max(0,step-1);paint()};$('#guideNext').onclick=()=>{if(++step>=steps.length)finish();else paint()};$('#guideVisit').onclick=()=>finish(steps[step][3]);dlg.addEventListener('cancel',e=>{e.preventDefault();finish()});
 return {open,maybeOpen(route){if(!seen()&&route.space==='learn'&&route.view==='home')open()}};
}
