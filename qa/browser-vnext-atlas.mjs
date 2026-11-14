import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];
async function test(label,fn){try{await fn();results.push([label,true]);console.log('ATLAS_NATIVE PASS '+label)}catch(e){results.push([label,false,e.message]);console.error('ATLAS_NATIVE FAIL '+label+': '+e.message)}}
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await test(width+' native Atlas boot',async()=>{
   await page.goto('http://127.0.0.1:4173/vnext/?space=atlas&nativeAtlas=1',{waitUntil:'domcontentloaded'});
   await page.locator('.vnext-native-atlas #reader .page-title').waitFor({timeout:25000});
   if(await page.locator('iframe[data-space=atlas]').count())throw Error('native Atlas unexpectedly fell back to iframe');
   const text=await page.locator('.vnext-native-atlas #reader .page-title').innerText();
   if(!text.includes('组织切片图谱'))throw Error('Atlas overview missing: '+text);
   if(errors.length)throw Error(errors.join(' | '));
  });
  await test(width+' native Atlas sections and images',async()=>{
   const section=page.locator('.vnext-native-atlas [data-target="sec-7-2"]').first();
   await section.evaluate(el=>el.click());
   await page.locator('.vnext-native-atlas #reader .page-title').waitFor({state:'visible'});
   const title=await page.locator('.vnext-native-atlas #reader .page-title').innerText();
   if(!title.includes('Thick skin')&&!title.includes('厚皮'))throw Error('wrong section '+title);
   if(!page.url().includes('section=sec-7-2'))throw Error('section not reflected in parent URL');
   await page.screenshot({path:'qa/browser-evidence/vnext-native-atlas-'+width+'.png',animations:'disabled'});
  });
  await test(width+' persistent module and theme',async()=>{
   await page.locator('#themeToggle').click();
   const theme=await page.locator('html').getAttribute('data-theme');
   const moduleTheme=await page.locator('.vnext-native-atlas').getAttribute('data-theme');
   if(theme!==moduleTheme)throw Error('Atlas theme not synchronized');
   await page.locator('.primary-nav a[data-space=quiz],.mobile-nav a[data-space=quiz]').first().evaluate(el=>el.click());
   await page.locator('iframe[data-space=quiz]').waitFor();
   await page.goBack({waitUntil:'domcontentloaded'});
   await page.locator('.vnext-native-atlas #reader .page-title').waitFor();
   if(!page.url().includes('space=atlas'))throw Error('browser back navigation lost Atlas');
   if(errors.length)throw Error(errors.join(' | '));
  });
  await page.close();
 }
}finally{await browser.close()}
const failed=results.filter(x=>!x[1]);
console.log('VNEXT_NATIVE_ATLAS_SUMMARY '+JSON.stringify({pass:results.length-failed.length,fail:failed.length,failed}));
if(failed.length)process.exitCode=1;
