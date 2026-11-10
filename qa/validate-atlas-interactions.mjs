import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const js=fs.readFileSync(path.join(root,'atlas/atlas.js'),'utf8');
const css=fs.readFileSync(path.join(root,'atlas/atlas.css'),'utf8');
const index=fs.readFileSync(path.join(root,'atlas/index.html'),'utf8');
const hub=fs.readFileSync(path.join(root,'index.html'),'utf8');
const manual=JSON.parse(fs.readFileSync(path.join(root,'atlas/data/manual.json'),'utf8'));
const imageMap=JSON.parse(fs.readFileSync(path.join(root,'atlas/data/image-map.json'),'utf8'));
const credits=JSON.parse(fs.readFileSync(path.join(root,'atlas/data/credits.json'),'utf8'));
const checks={
  hubIntegration:hub.includes('href="./atlas/"')&&hub.includes('lumen_histology_recall_v1'),
  learningContinuity:hub.includes('shouldShowRoundPrompt()')&&hub.includes('function reviewPage()')&&hub.includes('function settingsPage()'),
  atlasDeepLink:js.includes("new URLSearchParams(location.search).get('q')"),
  mobileSearch:index.includes('id="topSearchBtn"')&&js.includes("$('#topSearchBtn')"),
  termToAtlas:hub.includes('./atlas/?q=${encodeURIComponent(w.en)}'),
  globalSearch:js.includes('function renderSearchResults(')&&js.includes('const sectionIndex=')&&js.includes('const comparisonIndex='),
  comparisonsInSearch:js.includes('data-opencomp=')&&js.includes('found.dataset.opencomp'),
  searchRanking:js.includes('function sectionSearchRank('),
  backForward:js.includes('history.pushState(')&&js.includes("addEventListener('popstate'"),
  nativeEvidenceButtons:js.includes('type="button" data-evidence=')&&js.includes('type="button" data-termimage='),
  focusRestoration:js.includes('modalReturnFocus.focus(')&&js.includes("$('#closeModal').focus"),
  modalKeyboard:js.includes("e.key==='Tab'")&&js.includes("e.key==='Escape'"),
  brokenImageFeedback:js.includes('function bindImages()')&&js.includes('image-unavailable')&&css.includes('.image-unavailable'),
  noPrematureLazyFailure:!js.includes('im.complete&&im.naturalWidth===0'),
  themeControl:js.includes("'lumen_histology_recall_v1'"),
  modalSemantics:index.includes('role="dialog" aria-modal="true"'),
  originalData:Array.isArray(manual.sections)&&manual.sections.length===182&&manual.comparisons.length===45,
  localAssetMetadata:Object.keys(imageMap.media).length>=193,
  creditLabels:Object.keys(credits.media).length>=262&&Object.keys(credits.chat).length===118,
};
for(const [label,result] of Object.entries(checks))assert.ok(result,'UI audit regression: '+label);
console.log(JSON.stringify({checks:Object.keys(checks).length,status:'pass',sections:manual.sections.length,comparisons:manual.comparisons.length},null,2));
