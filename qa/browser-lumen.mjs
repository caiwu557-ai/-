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
  const expected=page.viewportSize().width;
  return page.evaluate(expected => ({
    expected,
    viewport:innerWidth,
    clientWidth:document.documentElement.clientWidth,
    visualViewport:window.visualViewport?.width,
    scroll:document.documentElement.scrollWidth,
    pass:document.documentElement.scrollWidth<=expected+2 && innerWidth<=expected+2
  }),expected);
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
    const dismiss=page.locator('[data-action="tour-skip"]');
    if(await dismiss.count()){
      await screenshot(page,label+'-00-onboarding.png');
      const rect=await dismiss.boundingBox();
      await assert(rect && rect.y>=0 && rect.y+rect.height<=height+2,'first-run tutorial dismiss button outside viewport: '+JSON.stringify(rect));
      if(touch)await dismiss.tap();else await dismiss.click();
      await assert(await page.locator('.tour-panel').count()===0,'tutorial remains after dismiss');
    }
    await screenshot(page,label+'-01-overview.png');
    const o=await noOverflow(page); await assert(o.pass,JSON.stringify(o));
  });
  await attempt(label+' / Atlas navigation',async()=>{
    const selector=width<=850?'.mobile-nav .atlas-bottom-link':'.atlas-home-link';
    if(touch)await page.locator(selector).first().tap();else await page.locator(selector).first().click();
    await page.waitForURL(/\/atlas\//,{timeout:12000});
    await assertReady(page,'#reader .page-title');
    const title=await page.locator('#reader .page-title').first().innerText();
    await assert(title.includes('组织切片图谱'),'wrong Atlas title: '+title);
    await assert(await page.locator('.app-route').count()===7,'Atlas desktop route inventory !=7');
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
  await attempt(label+' / image sources and section deep link',async()=>{
    await page.goto(new URL('atlas/#sec-1-1',BASE).href,{waitUntil:'domcontentloaded'});
    await assertReady(page,'#reader .page-title');
    const heading=await page.locator('#reader .page-title').innerText();
    await assert(heading.includes('HE染色'),'deep-link failed to resolve HE section: '+heading);
    const count=await page.locator('.image-credit a,.term-links a').count();
    await assert(count>0,'HE section has microscopy images but lacks image credit links');
    const response=await page.request.get(new URL('atlas/data/credits.json',BASE).href);
    await assert(response.ok(),'credit registry unreachable');
    const credits=await response.json();
    await assert(Object.keys(credits.media||{}).length>0,'image credit registry empty');
    await screenshot(page,label+'-03b-image-credits.png');
  });
  await attempt(label+' / animation frame and settled state',async()=>{
    const next=page.locator('#reader .bottom-nav [data-target]').last();
    await next.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const diagnosis=await page.evaluate(()=>{
      const button=document.querySelector('#reader .bottom-nav button:last-child');
      const nav=button?.closest('.bottom-nav');
      const b=button?.getBoundingClientRect();
      const hit=b?document.elementFromPoint(b.left+b.width/2,b.top+b.height/2):null;
      const evidence=document.querySelector('#reader .term-evidence');
      const er=evidence?.getBoundingClientRect();
      const tabs=document.querySelector('.workspace-tabs');
      const rect=x=>x?({x:Math.round(x.x),y:Math.round(x.y),width:Math.round(x.width),height:Math.round(x.height),bottom:Math.round(x.bottom)}):null;
      return {viewport:{w:innerWidth,h:innerHeight,scrollY},button:rect(b),
        nav:rect(nav?.getBoundingClientRect()),evidence:rect(er),
        elementAtClick:hit?.outerHTML.slice(0,300),navZ:nav&&getComputedStyle(nav).zIndex,
        navPosition:nav&&getComputedStyle(nav).position,
        tabs:rect(tabs?.getBoundingClientRect()),sideOpen:document.querySelector('#side')?.classList.contains('open'),
        imageCount:document.querySelectorAll('#reader img').length};
    });
    console.log('LUMEN_HIT_DIAG '+label+' '+JSON.stringify(diagnosis));
    const hitName=label+'-03b-hit-test.png';
    await page.screenshot({path:path.join(OUT,hitName),animations:'allow',fullPage:false});
    report.screenshots.push(hitName);
    await next.click({noWaitAfter:true});
    await page.waitForTimeout(65);
    const name=label+'-03c-motion-frame.png';
    await page.screenshot({path:path.join(OUT,name),animations:'allow',fullPage:false});
    report.screenshots.push(name);
    await page.waitForTimeout(250);
    await assertReady(page,'#reader h1');
    await screenshot(page,label+'-03d-motion-settled.png');
    const o=await noOverflow(page);await assert(o.pass,JSON.stringify(o));
  });
  await attempt(label+' / Atlas local search',async()=>{
    if(width<=850){if(touch)await page.locator('#topSearchBtn').tap();else await page.locator('#topSearchBtn').click();}
    await page.locator('#search').fill('上皮');
    await page.locator('#reader .page-title').first().waitFor({state:'visible'});
    const h=await page.locator('#reader .page-title').first().innerText();
    await assert(h.includes('搜索结果'),'search did not enter results');
    await screenshot(page,label+'-04-search.png');
    await page.locator('#search').press('Escape');
    await page.waitForTimeout(240);
    const drawerOpen=await page.locator('#side').evaluate(el=>el.classList.contains('open'));
    await assert(!drawerOpen,'Atlas drawer remained open after Escape/search exit');
  });
  await attempt(label+' / Atlas -> review deep link',async()=>{
    if(width<=850){if(touch)await page.locator('.workspace-tabs a[href="../?view=review"]').tap();else await page.locator('.workspace-tabs a[href="../?view=review"]').click()}
    else {await page.locator('.app-route[href="../?view=review"]').click()}
    await page.waitForURL(/\?view=review/,{timeout:12000});
    await assertReady(page,'#app .shell');
    await page.locator('h1:has-text("今日复习")').first().waitFor({state:'visible'});
    await screenshot(page,label+'-05-review.png');
    const o=await noOverflow(page);await assert(o.pass,JSON.stringify(o));
  });
  await attempt(label+' / theme across modules',async()=>{
    const btn=page.locator('[data-action="toggle-theme"]').first();
    if(touch)await btn.tap();else await btn.click();
    const theme=await page.locator('html').getAttribute('data-theme');
    await assert(theme==='dark','expected dark, got '+theme);
    const target=width<=850?'.mobile-nav .atlas-bottom-link':'.atlas-hub-link';
    if(touch)await page.locator(target).first().tap();else await page.locator(target).first().click();
    await page.waitForURL(/\/atlas\//,{timeout:12000});
    await assert((await page.locator('html').getAttribute('data-theme'))==='dark','dark theme lost during navigation');
    await screenshot(page,label+'-06-atlas-dark.png');
  });
  await attempt(label+' / Atlas keyboard and focus',async()=>{
    const search=page.locator('#search');
    if(width<=850){if(touch)await page.locator('#topSearchBtn').tap();else await page.locator('#topSearchBtn').click();}
    await search.focus();
    const name=await page.evaluate(()=>document.activeElement?.id);
    await assert(name==='search','search cannot receive keyboard focus');
    await page.keyboard.type('骨');
    await page.keyboard.press('Escape');
    await page.locator('#reader .page-title').first().waitFor({state:'visible'});
  });
  for(const [view,heading] of [
    ['library','术语词库'],['stats','学习记录'],['settings','设置与备份']
  ]){
    await attempt(label+' / '+view+' page and layout',async()=>{
      await page.goto(new URL('?view='+view,BASE).href,{waitUntil:'domcontentloaded'});
      await assertReady(page,'#app .main-content');
      const text=await page.locator('#app .main-content h1').first().innerText();
      await assert(text.includes(heading),'unexpected '+view+' title: '+text);
      const o=await noOverflow(page);await assert(o.pass,JSON.stringify(o));
      await screenshot(page,label+'-07-'+view+'.png');
    });
  }
  await attempt(label+' / practice card interactive entry',async()=>{
    await page.goto(BASE,{waitUntil:'domcontentloaded'});
    await assertReady(page,'#app .main-content');
    await page.locator('[data-action="start"]:not([disabled])').first().click();
    await assertReady(page,'#practice-card');
    const content=await page.locator('#practice-card').innerText();
    await assert(content.length>10,'practice card is empty');
    await screenshot(page,label+'-08-practice.png');
    const o=await noOverflow(page);await assert(o.pass,JSON.stringify(o));
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
    if(await page.locator('[data-action="tour-skip"]').count())await page.locator('[data-action="tour-skip"]').click();
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
  // Build a compact annotated contact sheet for reviewer visual QA.
  // Browser screenshots still remain in artifact at full resolution.
  try {
    const selected=[
      'desktop-01-overview.png','desktop-02-atlas.png','desktop-03-section.png',
      'phone-01-overview.png','phone-02-atlas.png','phone-03b-hit-test.png'
    ].filter(name=>fs.existsSync(path.join(OUT,name)));
    if(selected.length) {
      const preview=await browser.newPage({viewport:{width:1040,height:1180}});
      const sources=selected.map(name=>({name,data:'data:image/png;base64,'+fs.readFileSync(path.join(OUT,name)).toString('base64')}));
      const uri=await preview.evaluate(async items=>{
        const w=1040,h=Math.ceil(items.length/2)*355;
        const canvas=document.createElement('canvas'); canvas.width=w;canvas.height=h;
        const c=canvas.getContext('2d');c.fillStyle='#eef0f4';c.fillRect(0,0,w,h);
        for(let i=0;i<items.length;i++){
          const item=items[i],x=(i%2)*520,y=Math.floor(i/2)*355;
          const im=new Image(); im.src=item.data;
          await im.decode();
          c.fillStyle='#fdfdff';c.fillRect(x+7,y+7,506,344);
          c.fillStyle='#162031';c.font='bold 16px sans-serif';c.fillText(item.name,x+16,y+26);
          const crop=Math.min(im.height,im.width*0.72);
          c.drawImage(im,0,0,im.width,crop,x+16,y+36,488,300);
        }
        return canvas.toDataURL('image/jpeg',0.62);
      },sources);
      const b64=uri.split(',')[1]||'';
      fs.writeFileSync(path.join(OUT,'contact-sheet.jpg'),Buffer.from(b64,'base64'));
      for(let i=0;i<b64.length;i+=3000)console.log('LUMEN_CONTACT_CHUNK '+Math.floor(i/3000)+' '+b64.slice(i,i+3000));
      await preview.close();
    }
  }catch(e){console.log('WARN contact-sheet generation: '+String(e?.message||e))}
} finally {await browser.close();}
report.finishedAt=new Date().toISOString();
report.passCount=report.results.filter(x=>x.status==='PASS').length;
report.failCount=report.failures.length;
fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify(report,null,2));
console.log('BROWSER_QA_SUMMARY '+JSON.stringify({
  pass:report.passCount,fail:report.failCount,failures:report.failures,screenshots:report.screenshots.length
}));
if(report.failCount)process.exitCode=1;
