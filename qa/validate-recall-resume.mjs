import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const BASE=process.env.LUMEN_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const cases=[];let expectedCard=null;
async function test(name,fn){
 try{await fn();cases.push({name,result:'PASS'});console.log('PASS',name);}
 catch(e){cases.push({name,result:'FAIL',error:String(e?.message||e)});console.log('FAIL',name,String(e?.message||e));}
}
try{
 const context=await browser.newContext({viewport:{width:1280,height:850}});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',err=>errors.push(String(err)));
 await page.goto(BASE,{waitUntil:'domcontentloaded'});
 if(await page.locator('[data-action="tour-skip"]').count())await page.locator('[data-action="tour-skip"]').click();
 await test('No Latin term leaks from Leydig Chinese prompt',async()=>{
  const value=await page.evaluate(()=>{
   const api=window.LUMEN_TEST_API;
   const w=api.WORDS.find(w=>w.en==='Leydig cell');
   return {cn:api.questionCn(w),forms:api.acceptedEnglish(w),variant:api.hasVariableSpelling(w)};
  });
  assert.ok(!/Leydig/i.test(value.cn),JSON.stringify(value));
  assert.ok(value.cn.includes('睾丸间质细胞'),JSON.stringify(value));
  assert.ok(value.forms.includes('testicular interstitial cell'));
  assert.ok(value.variant);
 });
 await test('First new-word round grades 14 sequential fresh cards',async()=>{
  const stats=await page.evaluate(()=>{
   const api=window.LUMEN_TEST_API;
   api.startStudy('choice',{onlyNew:true});
   let first=[];
   for(let i=0;i<14;i++){
    const card=api.currentCard();
    if(!card)throw new Error('missing card '+i);
    first.push(card.id);
    const k=api.getStudy().options.findIndex(w=>w.id===card.id);
    api.chooseOption(k);if(api.getStudy().result!=='correct')throw new Error('grading mismatch on '+i);
    api.nextCard();
   }
   return {ids:first,finished:api.getStudy().finished,correct:api.getStudy().correct,events:api.getState().events.length};
  });
  assert.equal(stats.ids.length,14);assert.equal(new Set(stats.ids).size,14);
  assert.equal(stats.correct,14);assert.equal(stats.finished,true);
 });
 await test('Continue next round, answer 4, then pause at card 19',async()=>{
  const info=await page.evaluate(()=>{
   const api=window.LUMEN_TEST_API;
   api.advanceRound();const second=[];
   for(let i=0;i<4;i++){
    const card=api.currentCard();second.push(card.id);
    const k=api.getStudy().options.findIndex(w=>w.id===card.id);
    api.chooseOption(k);api.nextCard();
   }
   return {index:api.getStudy().index,correct:api.getStudy().correct,
     remaining:api.currentCard().id,done:api.getState().events.length,second};
  });
  assert.equal(info.index,4);assert.equal(info.correct,4);
  assert.equal(info.done,18);
  expectedCard=info.remaining;
  page.once('dialog',dialog=>dialog.accept());
  await page.evaluate(()=>window.LUMEN_TEST_API.goto('home'));
  await page.locator('[data-action="resume-study"]').waitFor();
  const snap=await page.evaluate(()=>window.LUMEN_TEST_API.readStudySnapshot());
  assert.equal(snap.index,4);assert.equal(snap.cards[4].id,expectedCard);
 });
 await page.reload({waitUntil:'domcontentloaded'});
 await test('A full reload restores the exact unfinished card and cursor',async()=>{
  await page.locator('[data-action="resume-study"]').click();
  const current=await page.evaluate(()=>{
   const a=window.LUMEN_TEST_API;return {index:a.getStudy().index,id:a.currentCard().id,correct:a.getStudy().correct};
  });
  assert.equal(current.index,4);assert.equal(current.id,expectedCard);
  assert.equal(current.correct,4);
  assert.match(await page.locator('.card-step').innerText(),/05\s*\/\s*14/);
 });
 await test('Curated noncanonical academic term is graded correctly without spelling length leak',async()=>{
  page.once('dialog',dialog=>dialog.accept());
  await page.evaluate(()=>{
   const a=window.LUMEN_TEST_API;
   const target=a.WORDS.find(w=>w.en==='Leydig cell');
   a.startStudy('spell',{specificId:target.id});
  });
  await page.locator('#typing-input').fill('testicular interstitial cell');
  assert.equal(await page.locator('.typing-free').count(),1);
  assert.ok(!/Leydig/i.test(await page.locator('.question-cn').innerText()));
  await page.evaluate(()=>window.LUMEN_TEST_API.submitAnswer());
  const s=await page.evaluate(()=>window.LUMEN_TEST_API.getStudy());
  assert.equal(s.result,'correct');
  assert.ok((await page.locator('.accepted-variants').innerText()).includes('testicular interstitial cell'));
 });
 await test('No runtime exceptions',async()=>assert.deepEqual(errors,[]));
 await context.close();
}finally{await browser.close();}
const summary={total:cases.length,passed:cases.filter(x=>x.result==='PASS').length,failed:cases.filter(x=>x.result==='FAIL').length,cases};
fs.mkdirSync('qa/browser-evidence',{recursive:true});
fs.writeFileSync('qa/browser-evidence/recall-resume-alias.json',JSON.stringify(summary,null,2));
console.log('RECALL_RESUME_QA_SUMMARY '+JSON.stringify({pass:summary.passed,fail:summary.failed,total:summary.total}));
if(summary.failed)process.exitCode=1;
