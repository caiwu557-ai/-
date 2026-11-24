import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const out='qa/browser-evidence';fs.mkdirSync(out,{recursive:true});
try{for(const [w,h] of [[1440,900],[1024,768],[768,1024],[390,844],[320,720]]){
 const page=await browser.newPage({viewport:{width:w,height:h},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/');await page.waitForURL(/\/vnext\//);await page.locator('#workspaceGuide').waitFor({state:'visible'});
 await page.locator('iframe[data-space=learn]').contentFrame().locator('#app .shell').waitFor();
 assert.equal(await page.locator('#guideCount').textContent(),'1 / 6');
 for(let i=0;i<5;i++){await page.locator('#guideNext').click();await page.locator('#guideSpotlight[data-positioned=true]').waitFor();if(i===0||i===2)await page.screenshot({path:out+'/guide-spotlight-'+w+'-'+i+'.png',animations:'disabled'});}
 assert.equal(await page.locator('#guideCount').textContent(),'6 / 6');
 if(w>850){const box=await page.locator('#guideNext').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);assert.equal(await page.locator('#glassCursor').evaluate(el=>el.matches(':popover-open')),true,'cursor must be in modal top layer');}
 await page.screenshot({path:out+'/editorial-guide-'+w+'.png',animations:'disabled'});
 await page.locator('#guideNext').click();await page.locator('#workspaceGuide').waitFor({state:'hidden'});
 await page.reload();assert.equal(await page.locator('#workspaceGuide').isVisible(),false);
 await page.locator('#guideToggle').click();await page.locator('#workspaceGuide').waitFor({state:'visible'});await page.keyboard.press('Escape');await page.locator('#workspaceGuide').waitFor({state:'hidden'});
 assert.equal(await page.locator('.global-rail .brand-mark').count(),1);await page.locator('#microHero #scene').waitFor();assert.equal(await page.locator('#microHero .feature-header').count(),0);
 assert.equal(await page.locator('#microHero').evaluate(el=>el.motion.state().running),false);
 await page.locator('#microHero').evaluate(el=>el.motion.seek(0));
 await page.screenshot({path:out+'/editorial-slide-'+w+'.png',animations:'disabled'});
 await page.locator('#microHero').evaluate(el=>el.motion.seek(10600));
 assert.equal(await page.locator('#microHero #callout0 .term-en').textContent(),'Goblet cell');
 await page.locator('#themeToggle').click();await page.waitForFunction(()=>document.querySelector('#microHero').dataset.theme==='dark');
 assert.equal(await page.locator('#microHero').evaluate(el=>getComputedStyle(el).getPropertyValue('--scene-b').trim()),'#202b3b','dark frame must change theme');
 await page.screenshot({path:out+'/editorial-dark-'+w+'.png',animations:'disabled'});
 await page.locator('#microHero').evaluate(el=>el.motion.seek(15000));
 assert.equal(await page.locator('#microHero #brandFinale').evaluate(el=>Number(getComputedStyle(el).opacity)),1);
 assert.equal(await page.locator('#microHero .finale-lockup strong').textContent(),'HISTODONE');
 assert.equal(await page.locator('#microHero .finale-tagline').textContent(),'Get Histology Done.');
 await page.screenshot({path:out+'/editorial-finale-dark-'+w+'.png',animations:'disabled'});
 await page.locator('#themeToggle').click();
 if(w>850){await page.mouse.move(500,120);const light=await page.locator('#glassCursor .lens').evaluate(el=>getComputedStyle(el).backgroundColor);assert.equal(light,'rgba(51, 65, 85, 0.52)');await page.locator('#themeToggle').click();const dark=await page.locator('#glassCursor .lens').evaluate(el=>getComputedStyle(el).backgroundColor);assert.equal(dark,'rgba(227, 247, 255, 0.2)');await page.locator('#themeToggle').click();}
 assert.equal(await page.locator('#microHero').evaluate(el=>el.shadowRoot.textContent.includes('非真实显微照片')),false);
 await page.screenshot({path:out+'/editorial-finale-light-'+w+'.png',animations:'disabled'});
 await page.locator('#microHero').evaluate(el=>el.motion.seek(10600));
 await page.screenshot({path:out+'/editorial-home-'+w+'.png',animations:'disabled'});
 await page.locator('.primary-nav a[data-space=atlas],.mobile-nav a[data-space=atlas]').filter({visible:true}).first().click();const atlas=page.locator('.vnext-native-atlas');await atlas.locator('#reader .page-title').waitFor({state:'visible'});
 if(w>850){const r=await atlas.locator('#side').evaluate(side=>{const stage=document.getElementById('moduleStage').getBoundingClientRect(),s=side.getBoundingClientRect();return {stage:stage.height,side:s.height,bottom:s.bottom,stageBottom:stage.bottom,scroll:side.scrollHeight>side.clientHeight}});assert.ok(Math.abs(r.side-r.stage)<=3,JSON.stringify(r));assert.ok(r.bottom<=r.stageBottom+2,JSON.stringify(r));assert.ok(r.scroll);}
 else{await page.locator('#moduleTabs [data-tab=directory]').click();await atlas.locator('#side.open').waitFor();await page.keyboard.press('Escape');}
 await page.screenshot({path:out+'/editorial-atlas-'+w+'.png',animations:'disabled'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));assert.deepEqual(errors,[]);await page.close();console.log('EDITORIAL PASS '+w);
}}finally{await browser.close()}
