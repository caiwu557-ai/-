import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const out='qa/browser-evidence';fs.mkdirSync(out,{recursive:true});
try{for(const [w,h] of [[1440,900],[768,1024],[390,844],[320,720]]){
 const page=await browser.newPage({viewport:{width:w,height:h},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('lumen_workspace_guide_v1','done'));
 await page.goto('http://127.0.0.1:4173/vnext/');const frame=page.locator('iframe[data-space=learn]');const learn=frame.contentFrame();await page.locator('iframe[data-flow=home]').waitFor();await learn.locator('.progress-panel-toggle').waitFor();
 await page.waitForFunction(()=>{const f=document.querySelector('iframe[data-space=learn]');return f&&f.getBoundingClientRect().height>=f.contentDocument.querySelector('.main-content').getBoundingClientRect().bottom-2});
 assert.equal(await learn.locator('.home-tool-actions').isVisible(),false);
 assert.equal(await page.locator('#experience [data-go=quiz]').count(),0);
 assert.equal(await page.locator('#moduleStage').evaluate(el=>getComputedStyle(el).borderTopWidth),'0px');
 const inner=await frame.evaluate(f=>{const d=f.contentDocument;return {height:f.clientHeight,content:d.querySelector('.main-content').getBoundingClientRect().bottom,overflow:getComputedStyle(d.documentElement).overflowY}});
 assert.equal(inner.overflow,'hidden');assert.ok(inner.height>=inner.content-2,JSON.stringify(inner));
 await page.locator('#workspace').evaluate(e=>e.scrollTop=0);
 const box=await frame.boundingBox();await page.mouse.move(Math.max(20,box.x+box.width/2),Math.max(80,Math.min(h-100,box.y+40)));await page.mouse.wheel(0,500);
 await page.waitForFunction(()=>document.querySelector('#workspace').scrollTop>10);
 assert.equal(await frame.evaluate(f=>f.contentWindow.scrollY),0);
 await learn.locator('.progress-panel-toggle').click();assert.equal(await learn.locator('.home-today-panel').getAttribute('data-collapsed'),'true');assert.equal(await learn.locator('.home-weekly').isVisible(),false);
 await page.screenshot({path:out+'/scroll-collapsed-'+w+'.png',animations:'disabled'});
 await learn.locator('.progress-panel-toggle').click();assert.equal(await learn.locator('.home-weekly').isVisible(),true);
 await page.locator('.primary-nav a[data-view=review],.secondary-nav a[data-view=review],.mobile-nav a[data-view=review]').filter({visible:true}).first().click();await page.waitForFunction(()=>document.body.dataset.scrollOwner==='frame');
 assert.equal(await page.locator('#workspace').evaluate(e=>getComputedStyle(e).overflowY),'hidden');
 await learn.locator('.page-heading').waitFor();
 await page.locator('.primary-nav a[data-space=atlas],.mobile-nav a[data-space=atlas]').filter({visible:true}).first().click();const atlas=page.locator('.vnext-native-atlas');await atlas.locator('#reader .page-title').waitFor();
 if(w>850){await page.locator('#moduleTabs [data-tab=directory]').click();assert.equal(await atlas.getAttribute('data-directory-collapsed'),'true');await page.locator('#moduleTabs [data-tab=search]').click();assert.equal(await atlas.getAttribute('data-directory-collapsed'),'false')}
 else{await page.locator('#moduleTabs [data-tab=directory]').click();await atlas.locator('#side.open').waitFor();await page.keyboard.press('Escape')}
 await page.locator('.primary-nav a[data-space=quiz],.mobile-nav a[data-space=quiz]').filter({visible:true}).first().click();await page.locator('.vnext-native-quiz #metric-total').waitFor();await page.waitForFunction(()=>document.body.dataset.scrollOwner==='page');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));assert.deepEqual(errors,[]);await page.close();console.log('SCROLL PASS '+w)
}}finally{await browser.close()}
