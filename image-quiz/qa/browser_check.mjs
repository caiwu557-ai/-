/** Real Chromium smoke / screenshot suite for a *separately approved* staging deployment.
 * Requires Playwright installed in the runner: npm install --no-save playwright@1.56.1
 * Env: LUMEN_IMAGE_BASE_URL=http://127.0.0.1:4173/image-quiz/
 */
import {chromium} from 'playwright';
import fs from 'node:fs';import path from 'node:path';
const BASE=process.env.LUMEN_IMAGE_BASE_URL||'http://127.0.0.1:4173/';
const OUT=process.env.LUMEN_IMAGE_QA_DIR||'qa/browser-evidence';
fs.mkdirSync(OUT,{recursive:true});
const sizes=[['desktop',1440,900,false],['tablet',768,1024,true],['phone',390,844,true],['small-phone',320,720,true]];
const records=[];
const check=(cond,msg)=>{if(!cond)throw Error(msg)};
async function step(name,fn){try{await fn();records.push({name,status:'PASS'});console.log('PASS',name)}catch(err){records.push({name,status:'FAIL',error:String(err?.message||err).slice(0,600)});console.log('FAIL',name,String(err?.message||err).slice(0,220))}}
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const [label,width,height,touch] of sizes){
  const context=await browser.newContext({viewport:{width,height},isMobile:width<=390,hasTouch:touch,deviceScaleFactor:1});
  const page=await context.newPage();page.setDefaultTimeout(10000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const fit=async()=>{const o=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));check(o.scroll<=width+2&&o.inner<=width+2,`${width}px overflows: ${JSON.stringify(o)}`)};
  const shot=async name=>page.screenshot({path:path.join(OUT,label+'-'+name+'.png'),fullPage:true,animations:'disabled'});
  const tap=async sel=>touch?await page.locator(sel).first().tap():await page.locator(sel).first().click();
  await step(label+' / initial home and responsive',async()=>{
   await page.goto(BASE,{waitUntil:'domcontentloaded'});await page.locator('#metric-total').waitFor();
   check((await page.locator('#metric-total').textContent())==='364','bank count !=364');
   check(await page.locator('#start-btn').isEnabled(),'start disabled');
   await fit();await shot('01-home');
  });
  await step(label+' / real image quiz and exact grading',async()=>{
   await page.evaluate(()=>window.LUMEN_IMAGE_TEST.start(['Q0017'],'single'));
   await page.locator('.image-stage img').waitFor({state:'visible'});
   const loaded=await page.locator('.image-stage img').evaluate(el=>el.complete&&el.naturalWidth>0);
   check(loaded,'WebP image not decoded');await shot('02-quiz');
   await page.locator('#answer-input').fill('分泌盐酸');await tap('[data-action="submit"]');
   check((await page.locator('.answer-feedback').innerText()).includes('需要重新辨认'),'cell function was wrongly credited');
   await tap('[data-action="next"]');
   check((await page.locator('.score').innerText()).includes('0'),'wrong answer not scored 0');
   await shot('03-result');await fit();
  });
  await step(label+' / zoom and keyboard Escape',async()=>{
   await tap('[data-action="zoom"]');
   check(await page.locator('#viewer').evaluate(e=>e.open),'viewer did not open');
   await page.keyboard.press('Escape');check(!(await page.locator('#viewer').evaluate(e=>e.open)),'Escape did not close');
  });
  await step(label+' / bank and history responsive',async()=>{
   await tap(width<=870?'.bottom-tabs [data-view="bank"]':'.local-nav [data-view="bank"]');await page.locator('#page-bank .bank-grid').waitFor();await fit();await shot('04-bank');
   await page.locator('#bank-search').fill('壁细胞');check((await page.locator('.bank-tile').count())>=1,'search returned nothing');
   await page.evaluate(()=>window.LUMEN_IMAGE_TEST.go('history'));await page.locator('#page-history .history-panels').waitFor();await fit();await shot('05-history');
  });
  await step(label+' / mode and type filters never fall back to all questions',async()=>{
   await page.evaluate(()=>window.LUMEN_IMAGE_TEST.go('home'));
   await page.evaluate(()=>{const a=window.LUMEN_IMAGE_TEST.getState();a.mode='new';a.groups=new Set(['肌组织']);a.types=new Set(['器官']);window.LUMEN_IMAGE_TEST.go('home')});
   check(!(await page.locator('#start-btn').isEnabled()),'empty filtered pool unexpectedly starts quiz');
  });
  await step(label+' / no JavaScript errors',async()=>{check(errors.length===0,errors.join(' | '))});
  await context.close();
 }
 {
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await ctx.newPage();
  await step('reduced motion preference',async()=>{
   await page.goto(BASE,{waitUntil:'domcontentloaded'});check(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),'motion preference missing');
   await page.evaluate(()=>window.LUMEN_IMAGE_TEST.start(['Q0001'],'single'));
   await page.locator('#page-quiz .image-stage').waitFor();
  });await ctx.close();
 }
}finally{await browser.close()}
const failures=records.filter(r=>r.status==='FAIL');
const summary={base:BASE,pass:records.length-failures.length,fail:failures.length,results:records};
fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify(summary,null,2));
console.log('BROWSER_QA_SUMMARY',JSON.stringify({pass:summary.pass,fail:summary.fail}));
if(failures.length)process.exitCode=1;
