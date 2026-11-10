import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.LUMEN_BASE_URL || 'http://127.0.0.1:4173/';
const OUT = process.env.LUMEN_QA_DIR || 'qa/browser-evidence';
const sizes = [
  ['desktop',1440,900,false],
  ['tablet',768,1024,true],
  ['phone',390,844,true],
  ['small-phone',320,720,true]
];
fs.mkdirSync(OUT,{recursive:true});
const report = {target:BASE,startedAt:new Date().toISOString(),results:[],screenshots:[],failures:[]};
function record(test,ok,detail=''){
  const x={test,status:ok?'PASS':'FAIL',detail};
  report.results.push(x); console.log((ok?'PASS ':'FAIL ')+test+(detail?' — '+detail:''));
  if(!ok)report.failures.push(x);
}
async function attempt(test,fn){
  try{await fn();record(test,true)}catch(e){record(test,false,String(e?.message||e).slice(0,800))}
}
async function screenshot(page,name){
  await page.screenshot({path:path.join(OUT,name),animations:'disabled',fullPage:true});
  report.screenshots.push(name);
}
async function assertReady(page,match){
  await page.locator(match).first().waitFor({state:'visible',timeout:20000});
  const body=await page.locator('body').innerText();
  if(body.includes('图谱数据载入失败'))throw new Error('Atlas JSON loading failed');
}
async function noOverflow(page){
  return page.evaluate(() => ({
    viewport:innerWidth,
    scroll:document.documentElement.scrollWidth,
    pass:document.documentElement.scrollWidth <= innerWidth + 2
  }));
}
async function assert(condition,message){
  if(!condition)throw new Error(message);
}
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const [label,width,height,touch] of sizes){
  const context=await browser.newContext({
    viewport:{width,height},deviceScaleFactor:1,
    isMobile:width<=390,hasTouch:touch,reducedMotion:'no-preference'
  });
  const page=await context.newPage();
  page.setDefaultTimeout(12000);
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  // Prefer deterministic offline-friendly screenshots. Atlas fallback/source links must survive blocked third-party images.
  await page.route('**/*',route=>{
    try{const u=new URL(route.request().url());const base=new URL(BASE);
      if(u.origin!==base.origin)return route.abort('blockedbyclient');
    }catch{}
    return route.continue();
  });
  await attempt(label+' / root overview renders',async()=>{
    await page.goto(BASE,{waitUntil:'domcontentloaded'});
    await assertReady(page,'#app .shell');
    await page.locator('text=学习工作台').first().waitFor({state:'visible',timeout:20000});
    await screenshot(page,label+'-01-overview.png');
    const o=await noOverflow(page); await assert(o.pass,JSON.stringify(o));
  });
  await attempt(label+' / Atlas navigation',async()=>{
    const selector=width<=850?'.mobile-nav .atlas-bottom-link':'.atlas-home-link';
    await page.locator(selector).first().click();
    await page.waitForURL(/\/atlas\//,{timeout:12000});
    await assertReady(page,'#reader .page-title');
    const title=await page.locator('#reader .page-title').first().innerText();
    await assert(title.includes('组织切片图谱'),'wrong Atlas title: '+title);
    await assert(await page.locator('.app-route').count()===6,'Atlas desktop route inventory !=6');
    const o=await noOverflow(page);await assert(o.pass,JSON.stringify(o));
    await screenshot(page,label+'-02-atlas.png');
  });
  await attempt(label+' / Atlas group and section',async()=>{
    const first=page.locator('#reader .section-tile').first();
    await first.click();
    await page.locator('#reader .section-tile').first().waitFor({state:'visible'});
    await page.locator('#reader .section-tile').first().click();
    await assertReady(page,'#reader h1');
    const h=await page.locator('#reader h1').first().innerText();
    await assert(h.length>1,'empty article heading');
    await screenshot(page,label+'-03-section.png');
    const o=await noOverflow(page);await assert(o.pass,JSON.stringify(o));
  });
  await attempt(label+' / image source credit availability',async()=>{
    // Source attribution must not disappear if remote image delivery fails.
    const anchors=await page.locator('.image-credit a,.term-links a,.modal-source a').count();
    await assert(anchors>0,'no image-source references in this section');
  });
  await attempt(label+' / Atlas local search',async()=>{
    if(width<=850)await page.locator('#topSearchBtn').click();
    await page.locator('#search').fill('上皮');
    await page.locator('#reader .page-title').first().waitFor({state:'visible'});
    const h=await page.locator('#reader .page-title').first().innerText();
    await assert(h.includes('搜索结果'),'search did not enter results');
    await screenshot(page,label+'-04-search.png');
    await page.locator('#search').press('Escape');
  });
  await attempt(label+' / Atlas -> review deep link',async()=>{
    if(width<=850){await page.locator('.workspace-tabs a[href="../?view=review"]').click()}
    else {await page.locator('.app-route[href="../?view=review"]').click()}
    await page.waitForURL(/\?view=review/,{timeout:12000});
    await assertReady(page,'#app .shell');
    await page.locator('h1:has-text("今日复习")').first().waitFor({state:'visible'});
    await screenshot(page,label+'-05-review.png');
    const o=await noOverflow(page);await assert(o.pass,JSON.stringify(o));
  });
  await attempt(label+' / theme across modules',async()=>{
    const btn=page.locator('[data-action="toggle-theme"]').first();
    await btn.click();
    const theme=await page.locator('html').getAttribute('data-theme');
    await assert(theme==='dark','expected dark, got '+theme);
    const target=width<=850?'.mobile-nav .atlas-bottom-link':'.atlas-hub-link';
    await page.locator(target).first().click();
    await page.waitForURL(/\/atlas\//,{timeout:12000});
    await assert((await page.locator('html').getAttribute('data-theme'))==='dark','dark theme lost during navigation');
    await screenshot(page,label+'-06-atlas-dark.png');
  });
  await attempt(label+' / Atlas keyboard and focus',async()=>{
    const search=page.locator('#search');
    if(width<=850)await page.locator('#topSearchBtn').click();
    await search.focus();
    const name=await page.evaluate(()=>document.activeElement?.id);
    await assert(name==='search','search cannot receive keyboard focus');
    await page.keyboard.type('骨');
    await page.keyboard.press('Escape');
    await page.locator('#reader .page-title').first().waitFor({state:'visible'});
  });
  await attempt(label+' / errors',async()=>{
    await assert(pageErrors.length===0,pageErrors.join(' | '));
  });
  await context.close();
 }
 {
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await ctx.newPage();
  await attempt('reduced motion / root -> Atlas -> section',async()=>{
    await page.goto(BASE,{waitUntil:'domcontentloaded'});
    await assertReady(page,'#app .shell');
    await page.locator('.mobile-nav .atlas-bottom-link').click();
    await assertReady(page,'#reader .section-tile');
    const reduced=await page.evaluate(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    await assert(reduced,'reduced motion media preference not enabled');
    await page.locator('#reader .section-tile').first().click();
    await assertReady(page,'#reader h1');
    await screenshot(page,'phone-reduced-motion.png');
  });
  await ctx.close();
 }
} finally {await browser.close();}
report.finishedAt=new Date().toISOString();
report.passCount=report.results.filter(x=>x.status==='PASS').length;
report.failCount=report.failures.length;
fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify(report,null,2));
console.log('BROWSER_QA_SUMMARY '+JSON.stringify({
  pass:report.passCount,fail:report.failCount,failures:report.failures,screenshots:report.screenshots.length
}));
if(report.failCount)process.exitCode=1;
