import {chromium} from 'playwright';import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4173/learn-engine.html?embed=1');
assert.equal(await page.locator('.home-mode-card').count(),2);
const entry=page.locator('[data-action=choose-learning]'), modal=page.getByRole('dialog',{name:'选择学习题型'});const before=await page.evaluate(()=>JSON.stringify(window.LUMEN_TEST_API.getState()));
await entry.click();assert.equal(await modal.count(),1);assert.equal(await page.locator('[data-action=learning-mode]').count(),3);assert.equal(await page.locator('.shell').getAttribute('inert'),'');
await page.locator('[data-action=learning-mode][data-mode=spell]').click();await modal.getByRole('button',{name:'关闭学习模式选择'}).click();assert.equal(await modal.count(),0);assert.equal(await page.evaluate(()=>JSON.stringify(window.LUMEN_TEST_API.getState())),before);assert.ok(await entry.evaluate(el=>document.activeElement===el));
await entry.click();await page.keyboard.press('Escape');assert.equal(await modal.count(),0);
await entry.click();await modal.getByRole('heading').click();assert.equal(await modal.count(),1);await page.locator('.learning-modal-backdrop').click({position:{x:4,y:4}});assert.equal(await modal.count(),0);
await entry.click();await modal.getByRole('button',{name:'关闭学习模式选择'}).focus();await page.keyboard.press('Shift+Tab');assert.ok(await modal.locator('[data-action=start]').evaluate(el=>document.activeElement===el));await page.keyboard.press('Tab');assert.ok(await modal.locator('[data-action=close-learning]').evaluate(el=>document.activeElement===el));
await page.setViewportSize({width:320,height:568});assert.ok(await modal.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}));await page.setViewportSize({width:1280,height:900});
await page.locator('[data-action=learning-mode][data-mode=choice]').click();await page.locator('[data-action=start][data-new="1"]').click();
const first=await page.evaluate(()=>{const a=window.LUMEN_TEST_API,w=a.currentCard();a.chooseOption(a.getStudy().options.findIndex(x=>x.id===w.id));return {id:w.id,mode:a.getHistory(w.id).lastMode,scope:a.getHistory(w.id).lastScope,study:a.getStudy().sessionId};});assert.equal(first.mode,'choice');
await page.reload();await page.locator('[data-action=resume-study]').click();assert.equal(await page.evaluate(()=>window.LUMEN_TEST_API.getStudy().sessionId),first.study);assert.equal(await page.evaluate(()=>window.LUMEN_TEST_API.getStudy().graded),true);
await page.evaluate(()=>{const a=window.LUMEN_TEST_API;a.nextCard();});page.on('dialog',d=>d.accept());
const checks=await page.evaluate(()=>{const a=window.LUMEN_TEST_API,s=a.getState();s.prefs.scope='all';const modes=['spell','choice','mixed'].map(mode=>a.pickWords({mode,onlyNew:true}).every(w=>a.conceptKey(w.id)!==a.conceptKey(a.getStudy().cards[0].id)&&!a.getHistory(w.id)));const first=a.getStudy().cards[0],h=a.getHistory(first.id);h.due=Date.now()-1000;s.prefs.scope='01';const due=a.dueWords().map(w=>a.conceptKey(w.id));const review=a.pickWords({mode:'spell',onlyDue:true});return {modes,due:due.includes(a.conceptKey(first.id)),review:review.some(w=>a.conceptKey(w.id)===a.conceptKey(first.id)),profile:a.reviewProfile(first),distinct:new Set(review.map(w=>a.conceptKey(w.id))).size===review.length};});assert.ok(checks.modes.every(Boolean));assert.ok(checks.due&&checks.review&&checks.distinct);assert.equal(checks.profile.mode,'choice');
await page.evaluate(()=>window.LUMEN_TEST_API.startStudy('mixed',{onlyDue:true}));assert.equal(await page.evaluate(()=>window.LUMEN_TEST_API.currentMode()),'choice');
await page.evaluate(()=>{const a=window.LUMEN_TEST_API,w=a.currentCard();a.chooseOption(a.getStudy().options.findIndex(x=>x.id===w.id));a.nextCard()});assert.equal(await page.evaluate(()=>window.LUMEN_TEST_API.dueWords().length),0);
assert.deepEqual(errors,[]);
console.log('PASS learning V7: two entry points, three modes, global review, fixed original mode, reload, unique concepts, no premature repeat');
}finally{await browser.close()}
