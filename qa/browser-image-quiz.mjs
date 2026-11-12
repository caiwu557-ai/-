import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base='http://127.0.0.1:4173';
fs.mkdirSync('qa/browser-evidence',{recursive:true});
const browser=await chromium.launch({headless:true});
let checks=0;
try{
 for(const width of [1440,390,320]){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(base+'/image-quiz/',{waitUntil:'load'});
  assert.equal(response.status(),200,'image-quiz route should respond HTTP 200');
  await page.locator('#metric-total').waitFor();
  assert.equal((await page.locator('#metric-total').innerText()).trim(),'364');
  assert.equal((await page.locator('#available-total').innerText()).trim(),'305');
  await page.locator('#start-btn').click();
  const img=page.locator('#page-quiz .image-stage img');
  await img.waitFor();
  await img.evaluate(el=>el.decode());
  assert.ok(await img.evaluate(el=>el.naturalWidth>0),'real image must decode');
  await page.locator('#answer-input').fill('definitely-not-the-answer');
  await page.locator('[data-action="submit"]').click();
  assert.ok(await page.locator('#page-quiz').innerText().then(t=>t.includes('需要重新辨认')),'feedback must render');
  await page.locator('[data-action="leave-quiz"]').click();
  await page.reload({waitUntil:'load'});
  await page.locator('#resume-box button[data-action="resume"]').waitFor();
  await page.locator('#resume-box button[data-action="resume"]').click();
  assert.ok(await page.locator('#page-quiz').isVisible(),'unfinished image session resumes');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(overflow<=8,'horizontal overflow at '+width+'px: '+overflow);
  assert.deepEqual(errors,[],'browser errors');
  await page.screenshot({path:'qa/browser-evidence/image-quiz-'+width+'.png',fullPage:true});
  checks+=7;
  await page.close();
 }
 const page=await browser.newPage();
 const home=await page.goto(base+'/',{waitUntil:'load'});
 assert.equal(home.status(),200);
 assert.ok(await page.locator('a[href="./image-quiz/"]').count()>=1,'workspace must link to image quiz');
 await page.goto(base+'/atlas/',{waitUntil:'load'});
 assert.ok(await page.locator('a[href="../image-quiz/"]').count()>=1,'atlas must link to image quiz');
 checks+=2;
 await page.close();
 console.log('IMAGE_QUIZ_BROWSER_QA_PASS',checks);
} finally {await browser.close()}
