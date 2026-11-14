import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const out=[];
async function check(label,fn){try{await fn();out.push([label,true]);console.log('NATIVE PASS '+label)}catch(e){out.push([label,false,String(e?.message||e)]);console.error('NATIVE FAIL '+label+' '+e?.message)}}
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await check(width+' native quiz boot',async()=>{
   await page.goto('http://127.0.0.1:4173/vnext/?space=quiz',{waitUntil:'domcontentloaded'});
   await page.locator('.vnext-native-quiz #metric-total').waitFor({timeout:20000});
   const total=(await page.locator('.vnext-native-quiz #metric-total').innerText()).trim();
   if(total!=='364')throw Error('wrong quiz count '+total);
   if(await page.locator('iframe[data-space=quiz]').count())throw Error('native mode fell back to legacy iframe');
   if(await page.locator('.vnext-native-quiz .global-nav').isVisible())throw Error('duplicate quiz global nav');
   if(errors.length)throw Error(errors.join(' | '));
  });
  await check(width+' native quiz navigation and state',async()=>{
   await page.locator('#moduleTabs button[data-tab=bank]').click();
   await page.locator('.vnext-native-quiz #page-bank').waitFor({state:'visible'});
   await page.locator('#moduleTabs button[data-tab=home]').click();
   await page.locator('.vnext-native-quiz #page-home').waitFor({state:'visible'});
   await page.locator('.vnext-native-quiz #start-btn').click();
   await page.locator('.vnext-native-quiz #page-quiz').waitFor({state:'visible'});
   const image=page.locator('.vnext-native-quiz #page-quiz img').first();
   await image.evaluate(img=>img.decode());
   if(!await image.evaluate(img=>img.naturalWidth>0))throw Error('native quiz image did not decode');
   await page.screenshot({path:'qa/browser-evidence/vnext-native-quiz-'+width+'.png',animations:'disabled'});
  });
  await check(width+' shared theme and internal route',async()=>{
   await page.locator('#themeToggle').click();
   const theme=await page.locator('html').getAttribute('data-theme');
   const local=await page.locator('.vnext-native-quiz').getAttribute('data-theme');
   if(theme!==local)throw Error('theme not synchronized');
   await page.locator('.primary-nav a[data-space=atlas],.mobile-nav a[data-space=atlas]').first().evaluate(el=>el.click());
   if(!page.url().includes('space=atlas'))throw Error('native quiz to atlas failed');
   await page.goBack({waitUntil:'domcontentloaded'});
   await page.locator('.vnext-native-quiz #page-quiz').waitFor({state:'visible'});
   if(errors.length)throw Error(errors.join(' | '));
  });
  await page.close();
 }
}finally{await browser.close()}
const failed=out.filter(x=>!x[1]);
console.log('VNEXT_NATIVE_QA_SUMMARY '+JSON.stringify({pass:out.length-failed.length,fail:failed.length,failed}));
if(failed.length)process.exitCode=1;
