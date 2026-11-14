import { chromium } from 'playwright';
import fs from 'node:fs';
const base='http://127.0.0.1:4173/vnext/';
const out='qa/browser-evidence';
fs.mkdirSync(out,{recursive:true});
const tests=[];
const run=async(name,fn)=>{try{await fn();tests.push({name,ok:true});console.log('VNEXT PASS '+name)}catch(e){tests.push({name,ok:false,reason:String(e?.message||e)});console.error('VNEXT FAIL '+name+' '+e?.message)}};
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const [label,width,height] of [['desktop',1440,900],['tablet',768,1024],['phone',390,844],['small-phone',320,720]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await run(label+' shared workspace and 2.5D hero',async()=>{
   const response=await page.goto(base,{waitUntil:'domcontentloaded'});
   if(response.status()!==200)throw Error('VNext route not served');
   await page.locator('#sculpture .slice').first().waitFor();
   if((await page.locator('#sculpture .slice').count())!==3)throw Error('2.5D slice geometry missing');
   await page.locator('#layerToggle').click();
   if((await page.locator('#layerToggle').getAttribute('aria-pressed'))!=='true')throw Error('Explode does not expose pressed state');
   if(!await page.locator('.sculpture-frame.is-expanded').count())throw Error('Exploded visual state not mounted');
   await page.screenshot({path:out+'/vnext-'+label+'-hero-expanded.png',animations:'disabled'});
   await page.locator('#layerToggle').click();
   if((await page.locator('#layerToggle').getAttribute('aria-pressed'))!=='false')throw Error('Reassembly did not settle');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   if(overflow>3)throw Error('horizontal layout overflow '+overflow);
  });
  await run(label+' atlas within persistent workspace',async()=>{
   await page.locator('.primary-nav [data-space="atlas"],.mobile-nav [data-space="atlas"]').first().evaluate(el=>el.click());
   const iframe=page.locator('iframe[data-space="atlas"]');
   await iframe.waitFor();
   const atlas=iframe.contentFrame();
   await atlas.locator('#reader .page-title').first().waitFor({timeout:25000});
   if(await page.locator('.global-topbar').isHidden())throw Error('global chrome disappeared');
   const chrome=await atlas.locator('.app-nav').evaluate(el=>getComputedStyle(el).display);
   if(chrome!=='none')throw Error('duplicate Atlas navigation still visible');
   if(!page.url().includes('space=atlas'))throw Error('Atlas route not represented by same URL');
   await page.screenshot({path:out+'/vnext-'+label+'-atlas.png',animations:'disabled'});
  });
  await run(label+' quiz without navigation reload',async()=>{
   await page.locator('.primary-nav [data-space="quiz"],.mobile-nav [data-space="quiz"]').first().evaluate(el=>el.click());
   const quiz=page.locator('iframe[data-space="quiz"]').contentFrame();
   await quiz.locator('#metric-total').waitFor({timeout:20000});
   if((await quiz.locator('#metric-total').innerText()).trim()!=='364')throw Error('quiz dataset does not match 364');
   if(await quiz.locator('.global-nav').isVisible())throw Error('quiz legacy global navigation still visible');
   await page.locator('#moduleTabs button[data-tab="bank"]').click();
   await quiz.locator('#page-bank').waitFor({state:'visible'});
   await page.locator('#moduleTabs button[data-tab="home"]').click();
   await quiz.locator('#page-home').waitFor({state:'visible'});
   await page.screenshot({path:out+'/vnext-'+label+'-quiz.png',animations:'disabled'});
   const el=await quiz.locator('.page-head a[href="../atlas/"]').first();
   await el.evaluate(n=>n.click());
   if(!page.url().includes('space=atlas'))throw Error('intra-module navigation opened another site');
   await page.goBack({waitUntil:'domcontentloaded'});
   if(!page.url().includes('space=quiz'))throw Error('browser back failed to restore quiz state');
   const frameCount=await page.locator('iframe[data-space="quiz"]').count();
   if(frameCount!==1)throw Error('quiz iframe was duplicated during route switch');
  });
  await run(label+' theme sync and zero JavaScript errors',async()=>{
   await page.locator('#themeToggle').click();
   const rootTheme=await page.locator('html').getAttribute('data-theme');
   const quizTheme=await page.locator('iframe[data-space="quiz"]').contentFrame().locator('html').getAttribute('data-theme');
   if(rootTheme!==quizTheme)throw Error('theme differs across unified views');
   if(errors.length)throw Error(errors.join(' | '));
  });
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',hasTouch:true});
 const page=await context.newPage();
 await run('reduced motion remains functional',async()=>{
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('#sculpture').press('Enter');
  if((await page.locator('#layerToggle').getAttribute('aria-pressed'))!=='true')throw Error('keyboard reveal did not work with reduced motion');
  const transition=await page.locator('.slice').first().evaluate(el=>getComputedStyle(el).transitionDuration);
  if(transition.split(',').some(x=>parseFloat(x)>0.02))throw Error('reduced motion still animates');
 });
 await context.close();
}finally{await browser.close()}
const fail=tests.filter(t=>!t.ok);
console.log('VNEXT_BROWSER_QA_SUMMARY '+JSON.stringify({pass:tests.length-fail.length,fail:fail.length,failures:fail}));
if(fail.length)process.exitCode=1;
