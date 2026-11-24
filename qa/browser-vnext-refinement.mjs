import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const out='qa/browser-evidence';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for(const [w,h] of [[1440,900],[768,1024],[390,844],[320,720]]){
  const page=await browser.newPage({viewport:{width:w,height:h},reducedMotion:'reduce'});
  await page.addInitScript(()=>localStorage.setItem('lumen_workspace_guide_v1','done'));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/vnext/',{waitUntil:'domcontentloaded'});
  await page.locator('#experience').waitFor({state:'visible'});
  assert.equal(await page.locator('.mobile-nav a').count(),5);
  assert.equal(await page.locator('.primary-nav .lumen-icon').count(),3);
  await page.screenshot({path:out+'/refinement-'+w+'-home.png',animations:'disabled'});
  await page.locator('.primary-action').click();
  await page.waitForURL(/view=review/);
  await page.locator('#experience').waitFor({state:'hidden'});
  assert.equal(await page.locator('body').getAttribute('data-view'),'review');
  await page.locator('.settings-link').click();
  await page.waitForURL(/view=settings/);
  await page.locator('#experience').waitFor({state:'hidden'});
  assert.equal(await page.locator('.settings-link').getAttribute('aria-current'),'page');
  await page.locator('#themeToggle').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.screenshot({path:out+'/refinement-'+w+'-settings-dark.png',animations:'disabled'});
  await page.locator('.primary-nav a[data-space=quiz],.mobile-nav a[data-space=quiz]').first().evaluate(el=>el.click());
  await page.locator('.vnext-native-quiz #metric-total').waitFor({state:'visible'});
  await page.locator('#moduleTabs button[data-tab=bank]').click();
  await page.locator('.vnext-native-quiz #page-bank').waitFor({state:'visible'});
  assert.equal(await page.locator('#moduleTabs button[data-tab=bank]').getAttribute('aria-current'),'page');
  await page.screenshot({path:out+'/refinement-'+w+'-bank-dark.png',animations:'disabled'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  await page.locator('.primary-nav a[data-space=atlas],.mobile-nav a[data-space=atlas]').first().evaluate(el=>el.click());
  await page.locator('.vnext-native-atlas #reader .page-title').waitFor({state:'visible'});
  await page.locator('#moduleTabs button[data-tab=search]').click();
  if(w<=850) await page.locator('.vnext-native-atlas #side.open').waitFor({state:'visible'});
  await page.locator('.vnext-native-atlas #search').fill('skin');
  await page.screenshot({path:out+'/refinement-'+w+'-atlas-search-dark.png',animations:'disabled'});
  assert.deepEqual(errors,[]);
  console.log('REFINEMENT PASS '+w);await page.close();
 }
}finally{await browser.close()}
