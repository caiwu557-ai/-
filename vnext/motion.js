/* LUMEN motion contract: semantic, interruptible, reduced-motion safe. */
export const motion={fast:120,standard:200,panel:240,ease:'cubic-bezier(.22,1,.36,1)'};
const running=new WeakMap();
export const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='off';
export function enter(node,{kind='content',duration=motion.standard}={}){
 if(!node?.animate||reduce()||document.hidden)return;
 running.get(node)?.cancel();
 const frames=kind==='content'?[{opacity:.78},{opacity:1}]:[{opacity:0,translate:'0 5px'},{opacity:1,translate:'0 0'}];
 const anim=node.animate(frames,{duration,easing:motion.ease});
 running.set(node,anim);
 anim.finished.catch(()=>{}).finally(()=>{if(running.get(node)===anim)running.delete(node)});
}
export function reveal(node,{block='center',focus=false}={}){
 if(!node)return;
 node.scrollIntoView({block,behavior:reduce()?'instant':'smooth'});
 if(focus)node.focus({preventScroll:true});
 if(!reduce()&&node.animate){running.get(node)?.cancel();const anim=node.animate([{outline:'2px solid transparent',outlineOffset:'3px'},{outline:'2px solid var(--lumen-accent,#615cf6)',outlineOffset:'3px',offset:.3},{outline:'2px solid transparent',outlineOffset:'3px'}],{duration:650,easing:'ease-out'});running.set(node,anim);anim.finished.catch(()=>{}).finally(()=>{if(running.get(node)===anim)running.delete(node)})}
}
export function workspaceTop(){document.getElementById('workspace')?.scrollTo({top:0,behavior:'instant'})}
