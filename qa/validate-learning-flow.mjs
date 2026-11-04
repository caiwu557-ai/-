/**
 * Terminology eligibility + forward-learning regression test.
 * Usage: node qa/validate-learning-flow.mjs
 * No packages or browser required; tests the actual functions extracted from index.html.
 */
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function readJson(key){
 const start=html.indexOf(key);
 assert(start>=0,'Missing '+key);
 const from=start+key.length,end=html.indexOf(';\n',from);
 assert(end>=0,'Missing end '+key);
 return JSON.parse(html.slice(from,end));
}
function sliceCode(a,b){
 const start=html.indexOf(a),end=html.indexOf(b,start+a.length);
 assert(start>=0&&end>start,'Cannot find code section '+a);
 return html.slice(start,end);
}
const DATA=readJson('window.LUMEN_DATA=');
const EXTRA=readJson('const EXAM_EXTRA_CARDS=');
const EXAM_FOCUS_ENTRIES=readJson('const EXAM_FOCUS_ENTRIES=');
const WORDS=[...DATA.cards,...EXTRA];
const BY_ID=new Map(WORDS.map(w=>[w.id,w]));
const EXAM_FOCUS_SET=new Set(EXAM_FOCUS_ENTRIES.map(e=>e.id));
const store={prefs:{goal:8,scope:'all',includeBasics:false},favorites:[],history:{}};
const helpers=[
 sliceCode('function getHistory(','const CHAPTERS='),
 sliceCode('function displayCn(','function todayActions('),
 sliceCode('function pickWords(','function startStudy(')
].join('\n');
const api=new Function('store','WORDS','BY_ID','DATA','EXAM_SCOPE_ID','EXAM_FOCUS_ENTRIES','EXAM_FOCUS_SET','shuffled',
 helpers+'\nreturn {practiceWords,pickWords,countNew,terminologyClass,shouldAutoTrain,availableWords,isNew};'
)(store,WORDS,BY_ID,DATA,'exam-focus',EXAM_FOCUS_ENTRIES,EXAM_FOCUS_SET,a=>[...a]);

assert.equal(DATA.cards.length,1269);
assert.equal(EXTRA.length,14);
assert.equal(EXAM_FOCUS_ENTRIES.length,172);
const excluded=WORDS.filter(w=>api.terminologyClass(w)!=='term');
assert.equal(excluded.length,54);
assert(excluded.every(w=>w.origin==='chapter'&&!EXAM_FOCUS_SET.has(w.id)));
assert.equal(api.practiceWords().length,1283-54);
const cell=WORDS.find(w=>w.en==='cell');
const epithelium=WORDS.find(w=>w.en==='Simple squamous epithelium');
assert.equal(api.terminologyClass(cell),'embedded');
assert(!api.shouldAutoTrain(cell));
assert(api.shouldAutoTrain(epithelium));

const initialNew=api.countNew();
const due=api.practiceWords().slice(0,15);
for(const w of due)store.history[w.id]={due:Date.now()-100000,streak:0,reps:1,right:1,wrong:0};
const ordinary=api.pickWords({mode:'mixed'});
const first=api.pickWords({mode:'mixed',onlyNew:true});
const review=api.pickWords({mode:'mixed',onlyLearned:true});
assert.equal(ordinary.length,8);
assert(ordinary.every(w=>store.history[w.id]),'Normal prioritization should include due terms');
assert.equal(first.length,8);
assert(first.every(w=>!store.history[w.id]),'New-learning must bypass the due queue');
assert.equal(review.length,8);
assert(review.every(w=>store.history[w.id]),'Consolidation must not select unseen terms');

for(const w of first)store.history[w.id]={due:Date.now()+100000,reps:1,right:1};
const next=api.pickWords({mode:'mixed',onlyNew:true});
assert(next.every(w=>!first.some(x=>x.id===w.id)),'Next batch repeated learned entries');
assert.equal(api.countNew(),initialNew-23);
assert.equal(api.pickWords({mode:'spell',specificId:cell.id}).length,1,'Direct practice must override suppression');
store.prefs.includeBasics=true;
assert(api.practiceWords().includes(cell),'Preferences must restore foundational words');
store.prefs.includeBasics=false;
store.favorites=[cell.id];
assert(api.practiceWords().includes(cell),'Favorites must allow opt-in manual retention');
store.favorites=[];
store.prefs.scope='exam-focus';
assert.equal(api.availableWords().length,172);
assert.equal(api.practiceWords().length,172,'Exam scope must not lose any word');
store.prefs.scope='all';
for(const w of api.practiceWords())store.history[w.id]={due:Date.now()+100000,right:1};
assert.equal(api.countNew(),0);
assert.equal(api.pickWords({mode:'mixed',onlyNew:true}).length,0);
store.prefs.scope='04';
assert(api.practiceWords().every(w=>w.courseIds.includes('04')));
assert(html.includes('data-new="1"')&&html.includes('data-action="round-continue"')&&html.includes('data-action="round-exit"'),'Round-complete continuation controls missing');
console.log('PASS — 54 standalone entries de-prioritized, exam list protected, new batches advance, review separate, round-dialog controls, manual/setting/favorite overrides intact.');
