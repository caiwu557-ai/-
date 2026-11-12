/** Dependency-free DOM shim for actual app state transitions.
 * Not a substitute for screenshot/real-browser interaction tests.
 */
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
class MockElement {
 constructor(id=''){this.id=id;this.textContent='';this.innerHTML='';this.value='';this.hidden=false;this.disabled=false;this.dataset={};this.style={};this.listeners={};this.attributes={};this.classList={toggle:()=>{},remove:()=>{},add:()=>{},contains:()=>false};}
 addEventListener(type,fn){this.listeners[type]=fn}
 querySelector(){return null}querySelectorAll(){return []}
 setAttribute(k,v){this.attributes[k]=v}removeAttribute(k){delete this.attributes[k]}
 focus(){}before(){}remove(){}click(){}showModal(){}close(){}
}
const elements=new Map(),get=s=>{if(!elements.has(s))elements.set(s,new MockElement(s));return elements.get(s)};
const document={documentElement:{dataset:{theme:'light'}},body:{appendChild:()=>{}},
 querySelector:get,querySelectorAll:()=>[],getElementById:id=>get('#'+id),
 createElement:tag=>new MockElement(tag),addEventListener:()=>{}};
const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
const win={LUMEN_IMAGE_BANK:JSON.parse(fs.readFileSync(path.join(root,'data/bank.json'),'utf8')),
 innerWidth:1440,scrollTo:()=>{},addEventListener:()=>{}};
const ctx=vm.createContext({window:win,document,localStorage:storage,Image:class Image{set src(s){this._src=s}},
 requestAnimationFrame:fn=>fn(),setTimeout:()=>1,clearTimeout:()=>{},confirm:()=>true,
 navigator:{},Date,Math,console,Blob,URL});
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),ctx,{filename:'app.js'});
const api=win.LUMEN_IMAGE_TEST;
assert.ok(api,'test API missing');
let pass=0;
const t=(name,fn)=>{fn();pass++;console.log('PASS',name)};
t('The actual app initializes home with 364 questions',()=>{assert.equal(get('#metric-total').textContent,364);assert.equal(api.getState().view,'home');assert.equal(api.eligiblePool('adaptive').length,305)});
t('Supplement and image-ambiguous items are never auto-graded',()=>{
 for(const id of ['Q0055','Q0105','Q0193','Q0196','Q0198','Q0207','Q0039'])
 assert.ok(!api.eligiblePool('adaptive').some(q=>q.id===id));
});
t('A single correct Chinese response advances through saved results',()=>{
 api.start(['Q0001'],'single');assert.equal(api.getState().view,'quiz');
 assert.ok(get('#page-quiz').innerHTML.includes('根据整幅切片的组织布局'));
 get('#answer-input').value='食管';api.submit();
 assert.ok(get('#page-quiz').innerHTML.includes('回答正确'));
 api.next();assert.equal(api.getState().view,'result');
 assert.ok(get('#page-result').innerHTML.includes('100'));
 assert.equal(api.currentStats().attempts,1);
});
t('Wrong cell function cannot be credited as cell identity',()=>{
 api.start(['Q0017'],'single');get('#answer-input').value='分泌盐酸';api.submit();
 assert.ok(get('#page-quiz').innerHTML.includes('需要重新辨认'));
 api.next();assert.ok(get('#page-result').innerHTML.includes('0'));
 assert.equal(api.getStore().items.Q0017.wrong,1);
});
t('Correct English answer accepted',()=>{
 api.start(['Q0017'],'single');get('#answer-input').value='Parietal Cell';api.submit();
 assert.ok(get('#page-quiz').innerHTML.includes('回答正确'));
});
t('No empty-filter fallback into unrelated questions',()=>{
 api.getState().mode='new';
 api.getState().groups=new Set(['肌组织']);api.getState().types=new Set(['器官']);
 assert.equal(api.eligiblePool('new').length,0);
});
t('Exam records submissions without revealing answers until completion',()=>{
 api.getState().groups.clear();api.getState().types.clear();
 api.start(['Q0001','Q0017'],'exam');get('#answer-input').value='not the term';api.submit();
 assert.ok(get('#page-quiz').innerHTML.includes('模拟考试结束后统一显示答案'));
 assert.ok(!get('#page-quiz').innerHTML.includes('正确答案：'));
 api.next();get('#answer-input').value='parietal cell';api.submit();
 api.next();assert.equal(api.getState().view,'result');
 assert.equal(api.currentStats().attempts,5); // 1 correct, 1 wrong, 1 correct, + exam's two answers
});
t('Skipped card does not count against recall accuracy',()=>{
 const before=api.currentStats().attempts;
 api.start(['Q0032'],'single');api.submit(true);api.next();
 assert.equal(api.currentStats().attempts,before);assert.equal(api.getState().view,'result');
});
t('Session restored to home has new and due counts grounded in real attempts',()=>{
 api.go('home');const stats=api.currentStats();assert.equal(stats.newCount,305-2);assert.equal(get('#metric-new').textContent,stats.newCount);
});
console.log('RUNTIME_SMOKE_SUMMARY',JSON.stringify({pass,fail:0}));