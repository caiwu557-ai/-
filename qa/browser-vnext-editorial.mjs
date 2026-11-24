import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const out='qa/browser-evidence';fs.mkdirSync(out,{recursive:true});
try{for(const [w,h] of [[1440,900],[1024,768],[768,1024],[390,844],[320,720]]){
 const page=await browser.newPage({viewport:{width:w,height:h},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/vnext/');await page.locator('#workspaceGuide').waitFor({state:'visible'});
 assert.equal(await page.locator('#guideCount').textContent(),'1 / 6');
 for(let i=0;i<5;i++)await page.locator('#guideNext').click();
 assert.equal(await page.locator('#guideCount').textContent(),'6 / 6');
 await page.screenshot({path:out+'/editorial-guide-'+w+'.png',animations:'disabled'});
 await page.locator('#guideNext').click();await page.locator('#workspaceGuide').waitFor({state:'hidden'});
 await page.reload();assert.equal(await page.locator('#workspaceGuide').isVisible(),false);
 await page.locator('#guideToggle').click();await page.locator('#workspaceGuide').waitFor({state:'visible'});await page.keyboard.press('Escape');await page.locator('#workspaceGuide').waitFor({state:'hidden'});
 assert.equal(await page.locator('.brand-mark').count(),1);assert.equal(await page.locator('.glass-sheet').count(),3);
 await page.screenshot({path:out+'/editorial-home-'+w+'.png',animations:'disabled'});
 await page.locator('.specimen-link').click();const atlas=page.locator('.vnext-native-atlas');await atlas.locator('#reader .page-title').waitFor({state:'visible'});
 if(w>850){const r=await atlas.locator('#side').evaluate(side=>{const stage=document.getElementById('moduleStage').getBoundingClientRect(),s=side.getBoundingClientRect();return {stage:stage.height,side:s.height,bottom:s.bottom,stageBottom:stage.bottom,scroll:side.scrollHeight>side.clientHeight}});assert.ok(Math.abs(r.side-r.stage)<=3,JSON.stringify(r));assert.ok(r.bottom<=r.stageBottom+2,JSON.stringify(r));assert.ok(r.scroll);}
 else{await page.locator('#moduleTabs [data-tab=directory]').click();await atlas.locator('#side.open').waitFor();await page.keyboard.press('Escape');}
 await page.screenshot({path:out+'/editorial-atlas-'+w+'.png',animations:'disabled'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));assert.deepEqual(errors,[]);await page.close();console.log('EDITORIAL PASS '+w);
}}finally{await browser.close()}
