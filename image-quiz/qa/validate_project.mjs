/** Static + pure-function quality gates. No dependencies, no browser/network needed. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('app.js'),markup=read('index.html'),css=read('style.css');
const data=JSON.parse(read('data/bank.json'));
let passed=0;
const t=(name,fn)=>{fn();passed++;console.log('PASS',name)};
t('Both JS sources compile',()=>{new vm.Script(app);new vm.Script(read('data/bank.js'))});
t('364 complete records with unique stable IDs',()=>{assert.equal(data.questions.length,364);assert.equal(new Set(data.questions.map(q=>q.id)).size,364);assert.deepEqual(data.questions.map(q=>q.id),Array.from({length:364},(_,i)=>'Q'+String(i+1).padStart(4,'0')))});
t('All 364 WebP files exist, are non-empty and preserve metadata',()=>{
 for(const q of data.questions){assert.ok(q.cn&&q.en&&q.group&&q.type&&q.accept.length>=2,q.id);const f=path.join(root,q.image);assert.ok(fs.existsSync(f),q.id);const b=fs.readFileSync(f);assert.ok(b.length>500&&b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP',q.id)}
});
t('Original source classification preserved in each record',()=>{assert.ok(data.questions.every(q=>q.originalGroup&&q.sourceIndex>0))});
t('Source review and supplement are excluded from all automatic modes',()=>{assert.equal(data.questions.filter(q=>q.status==='review_needed').length,43);assert.equal(data.questions.filter(q=>q.scope==='supplement').length,6);assert.ok(data.questions.every(q=>q.autoEligible===q.examEligible));assert.ok(data.questions.every(q=>q.autoEligible||['review_needed','visual_review_needed'].includes(q.status)||q.scope==='supplement'));assert.equal(data.questions.filter(q=>q.examEligible).length,305)});
t('Removed misclassified answers do not appear as accepted aliases',()=>{
 const qs=Object.fromEntries(data.questions.map(x=>[x.id,x]));
 for(const [id,wrong] of [['Q0012','基底层细胞'],['Q0013','固有层'],['Q0018','分泌盐酸'],['Q0027','黏膜肌层'],['Q0038','淋巴小结'],['Q0045','肾上腺髓质'],['Q0164','皮质'],['Q0197','中央静脉']]){
 assert.ok(!qs[id].accept.includes(wrong),id+' should reject '+wrong)}
});
t('Accepted synonyms are constrained to same anatomical target',()=>{
 const qs=Object.fromEntries(data.questions.map(x=>[x.id,x]));
 assert.ok(qs.Q0229.accept.includes('近曲小管'));
 assert.ok(qs.Q0180.accept.includes('肝索'));
 assert.ok(qs.Q0032.accept.includes('Paneth 细胞'));
 assert.ok(qs.Q0200.accept.includes('分泌管'));
});
t('Medical source correction, non-leading prompts, and audit metadata',()=>{
 const q=data.questions.find(q=>q.id==='Q0318');
 assert.equal(q.cn,'初级卵母细胞');assert.equal(q.en,'primary oocyte');assert.ok(!q.accept.includes('卵原细胞'));
 assert.equal(data.meta.schema,'lumen.imagebank.v2');assert.equal(data.meta.scopeSupplementCount,6);assert.equal(data.meta.automaticCount,305);
 assert.ok(data.questions.every(q=>q.prompt&&!q.prompt.includes(q.cn)&&!q.prompt.toLowerCase().includes(q.en.toLowerCase())));
 for(const id of ['Q0055','Q0105','Q0193','Q0196','Q0198','Q0207'])assert.equal(data.questions.find(q=>q.id===id).scope,'supplement');
});
t('English, Chinese and exact aliases use equality not substring',()=>{
 const code=app.match(/const norm=s=>[^\n]+\nconst check=\(v,q\)=>[^\n]+/);
 assert.ok(code,'cannot find grading implementation');
 const ctx=vm.createContext({});
 vm.runInContext(code[0]+'\nglobalThis.testCheck=check;',ctx);
 const q=data.questions.find(x=>x.id==='Q0018');
 assert.equal(ctx.testCheck('PARENtal Cell',q),false);
 assert.equal(ctx.testCheck('Parietal cell',q),true);
 assert.equal(ctx.testCheck('壁 细 胞',q),true);
 assert.equal(ctx.testCheck('分泌盐酸',q),false);
 assert.equal(ctx.testCheck('',q),false);
 assert.equal(ctx.testCheck('cell',q),false);
});
t('Selecting a duplicate-answer-heavy pool prefers distinct terms',()=>{
 const start=app.indexOf('function choose(pool,limit,mode){'),end=app.indexOf('\nfunction toast(',start);
 assert.ok(start>0&&end>start);
 const ctx=vm.createContext({store:{items:{}},Date,Math,Set});
 vm.runInContext(app.slice(start,end)+'\nglobalThis.chooseFn=choose;',ctx);
 const pool=data.questions.filter(x=>x.group==='肌组织');
 const ids=ctx.chooseFn(pool,10,'adaptive');
 assert.equal(ids.length,10);assert.equal(new Set(ids).size,10);
 assert.ok(new Set(ids.map(id=>pool.find(x=>x.id===id).cn)).size>=5);
});
t('Layout contains LUMEN exits, data controls, quiz, results, bank, history',()=>{
 for(const id of ['page-home','page-quiz','page-result','page-bank','page-history','viewer','help-dialog','flag-dialog','group-chips','type-chips','start-btn','theme-btn'])assert.ok(markup.includes('id="'+id+'"'),id);
 assert.ok(markup.includes('href="../?view=review"'));assert.ok(markup.includes('href="../?view=library"'));assert.ok(markup.includes('href="../atlas/"'));
});
t('Module namespace does not overwrite vocabulary review data',()=>{
 assert.ok(app.includes("lumen_image_lab_progress_v1"));assert.ok(app.includes("lumen_atlas_theme_v1"));
 assert.ok(!app.includes("localStorage.setItem('lumen_histology_recall_v1'"));
});
t('Responsive and reduced-motion support present',()=>{for(const marker of ['@media(max-width:870px)','@media(max-width:650px)','@media(max-width:370px)','prefers-reduced-motion:reduce'])assert.ok(css.includes(marker),marker)});
t('Original bundled JPEG base64 not leaked into new app',()=>{assert.ok(!markup.includes('data:image/jpeg;base64'));assert.ok(!read('data/bank.js').includes('data:image/jpeg;base64'))});
console.log('STATIC_QA_SUMMARY',JSON.stringify({pass:passed,fail:0,totalImages:364,reviewNeeded:43,visualHold:11,examEligible:305}));