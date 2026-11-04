/**
 * End-of-round dialog regression checks.
 * Usage: node qa/validate-round-prompt.mjs
 */
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const first=html.indexOf('function shouldShowRoundPrompt(){');
const last=html.indexOf('function render(){',first);
assert(first>=0&&last>first,'Dialog implementation missing from bundle');
const helpers=html.slice(first,last);
assert(html.includes("guideStep>=0||shouldShowRoundPrompt()?'inert':''"),'Background must become inert while dialog open');
assert(html.includes('shouldShowRoundPrompt()?roundPromptHtml():'),'Dialog must be mounted after the shell');
assert(html.includes('requestAnimationFrame(focusRoundPrompt)'),'Initial focus not managed');
assert(html.includes("if(e.key==='Escape'){e.preventDefault();goto('home');return;}"),'Escape handling missing');
assert(html.includes("if(e.key==='Tab')"),'Tab focus trapping missing');
assert(html.includes('@media(max-width:530px)'), 'Mobile responsive dialog styles missing');
assert(html.includes('prefers-reduced-motion:reduce'), 'Reduced motion support missing');
let starts=[],toasts=[],remaining=9;
const ic=n=>'[icon:'+n+']',safe=s=>String(s);
const source=[
 "let route='study',guideStep=-1,study=null;",
 helpers,
 'return {setState:(v)=>{study=v},setRoute:(v)=>{route=v},setGuide:(v)=>{guideStep=v},shows:shouldShowRoundPrompt,render:roundPromptHtml,advance:advanceRound};'
].join('\n');
const ui=new Function('ic','safe','countNew','startStudy','toast','document',source)(
 ic,safe,()=>remaining,
 (mode,options)=>starts.push({mode,options}),
 msg=>toasts.push(msg),
 {getElementById:()=>null}
);
const base={finished:true,onlyDue:false,singleCard:false,cards:Array.from({length:14},(_,i)=>({id:i})),correct:12,wrong:2};
for(const [mode,label] of [['mixed','混合训练'],['spell','英文拼写'],['choice','四选一辨认']]){
 ui.setState({...base,mode});
 assert(ui.shows(),mode+' should show prompt');
 const body=ui.render();
 assert(body.includes('role="dialog" aria-modal="true"'));
 assert(body.includes('你已完成一轮学习。'));
 assert(body.includes('还要继续学习新单词吗？'));
 assert(body.includes('data-action="round-exit"'));
 assert(body.includes('data-action="round-continue"'));
 assert(body.includes(label));
 assert(body.includes('9</b>'),'Remaining unseen count missing');
 ui.advance();
 const called=starts.at(-1);
 assert.equal(called.mode,mode,'Mode changed when advancing');
 assert.deepEqual(called.options,{onlyNew:true},'Continuation must only draw fresh cards');
}
ui.setState({...base,mode:'mixed',onlyDue:true});
assert.equal(ui.shows(),false,'Due-only review should never trigger prompt');
assert.equal(ui.render(),'');
ui.setState({...base,mode:'spell',singleCard:true});
assert.equal(ui.shows(),false,'Single-term manual practice should not trigger prompt');
ui.setState({...base,mode:'choice',finished:false});
assert.equal(ui.shows(),false,'Prompt must not show before round is completed');
ui.setState({...base,mode:'mixed'});
ui.setRoute('home');assert.equal(ui.shows(),false,'Prompt shown outside study route');
ui.setRoute('study');ui.setGuide(0);assert.equal(ui.shows(),false,'Prompt must not clash with onboarding');
ui.setGuide(-1);remaining=0;
const exhausted=ui.render();
assert(exhausted.includes('disabled aria-disabled="true"'),'No remaining words must disable continuation');
const previous=starts.length;
ui.advance();
assert.equal(starts.length,previous,'No-new continuation must not start a fake round');
assert(toasts.length>0,'No-new continuation should explain why it cannot proceed');
console.log('PASS — all three modes prompt every round; due/manual modes exempt; new words advance within the selected mode and no-new guard works.');
