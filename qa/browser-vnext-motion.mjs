import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const out='qa/browser-evidence';fs.mkdirSync(out,{recursive:true});
try{
 for(const [w,h] of [[1440,900],[390,844],[320,720]]){
  for(const reducedMotion of ['no-preference','reduce']){
   const page=await browser.newPage({viewport:{width:w,height:h},reducedMotion});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:4173/vnext/?space=quiz',{waitUntil:'domcontentloaded'});
   const quiz=page.locator('.vnext-native-quiz');
   await quiz.locator('#start-btn').waitFor({state:'visible'});
   await quiz.locator('#start-btn').click();
   await quiz.locator('#page-quiz').waitFor({state:'visible'});
   await quiz.locator('#answer-input').fill('test draft');
   await quiz.locator('.image-stage button').click();
   await quiz.locator('#viewer').waitFor({state:'visible'});
   await page.screenshot({path:out+'/motion-'+w+'-'+reducedMotion+'-viewer.png',animations:'disabled'});
   await page.keyboard.press('Escape');
   await quiz.locator('#viewer').waitFor({state:'hidden'});
   assert.equal(await quiz.locator('#answer-input').inputValue(),'test draft','modal must preserve draft');
   if(w<=650){await quiz.locator('.quiz-jump').click();assert.equal(await quiz.locator('#answer-input').evaluate(el=>el.getRootNode().activeElement===el),true)}
   await page.locator('.primary-nav a[data-space=atlas],.mobile-nav a[data-space=atlas]').first().evaluate(el=>el.click());
   const atlas=page.locator('.vnext-native-atlas');
   await atlas.locator('#reader .page-title').waitFor({state:'visible'});
   if(w<=850){
    await page.locator('#moduleTabs [data-tab=directory]').click();
    await atlas.locator('#side.open').waitFor();
    await page.screenshot({path:out+'/motion-'+w+'-'+reducedMotion+'-directory.png',animations:'disabled'});
    await atlas.locator('#scrim').click({position:{x:w-8,y:20}});
    await atlas.locator('#side.open').waitFor({state:'hidden'});
   }
   await page.goBack();
   await quiz.locator('#page-quiz').waitFor({state:'visible'});
   assert.equal(await quiz.locator('#answer-input').inputValue(),'test draft','route must preserve draft');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
   if(reducedMotion==='reduce')assert.equal(await page.locator('#moduleStage').evaluate(el=>el.getAnimations().length),0);
   assert.deepEqual(errors,[]);
   console.log('MOTION PASS '+w+' '+reducedMotion);
   await page.close();
  }
 }
}finally{await browser.close()}
