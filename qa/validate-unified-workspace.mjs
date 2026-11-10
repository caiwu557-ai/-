/**
 * No dependencies. Run: node qa/validate-unified-workspace.mjs
 * Checks source-level integration only: browser screenshots and clinical-image
 * correctness need separate, real-world tests.
 */
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import assert from 'node:assert/strict';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const main = read('../index.html');
const atlas = read('../atlas/index.html');
const js = read('../atlas/atlas.js');
const css = read('../assets/lumen-unified.css');

function check(condition, label) {
  assert.ok(condition, label);
  console.log('PASS', label);
}
function equals(actual, expected, label) {
  assert.equal(actual, expected, label);
  console.log('PASS', label);
}
function count(s, needle) { return s.split(needle).length - 1; }

for(const [name, html] of [['Recall',main],['Atlas',atlas]]){
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
  for(let i=0;i<scripts.length;i++){
    // Parse without executing the code, so localStorage and network calls are not triggered.
    new Script(scripts[i][1],{filename:name+'-inline-'+i});
  }
  console.log('PASS',name,'inline scripts parse');
}
new Script(js,{filename:'atlas.js'});
console.log('PASS Atlas JS parses');
check(main.includes('href="./assets/lumen-unified.css"'),'Recall loads shared design tokens');
check(atlas.includes('href="../assets/lumen-unified.css"'),'Atlas loads shared design tokens');
check(css.includes('@view-transition { navigation: auto; }'),'Cross-document transition opted in');
check(css.includes('prefers-reduced-motion: reduce'),'Reduced motion is supported');
check(css.includes('lumen-workspace-sidebar'),'Navigation shell has a stable transition name');
check(css.includes('lumen-atlas-reader'),'Atlas content transition is scoped to reading area');
check(main.includes("new URLSearchParams(location.search).get('view')"),'Recall accepts cross-module deep links');
check(main.includes("['home','review','library','stats','settings'].includes(initialWorkspace)"),'Recall view query uses an allowlist');
check(main.includes('history.replaceState({lumen:view}'),'Recall updates route address after internal navigation');
check(main.includes('class="atlas-bottom-link"'),'Recall mobile nav includes Atlas');
equals(count(atlas,'class="app-route"'),6,'Atlas desktop nav contains six product destinations');
check(atlas.includes('aria-label="LUMEN 全局导航"'),'Atlas global navigation is labeled');
check(atlas.includes('class="workspace-tabs"'),'Atlas has mobile product nav');
check(atlas.includes('aria-current="page"'),'Atlas active destination is marked');
check(atlas.includes('class="brand atlas-brand-home"'),'Atlas brand has an accessible home action');
check(atlas.includes('class="atlas-page"'),'Atlas shared styles are scoped to atlas body');
check(atlas.includes('href="../?view=review"'),'Atlas can return straight to due review');
check(atlas.includes('href="../?view=settings"'),'Atlas can return straight to settings');
check(atlas.includes("localStorage.getItem('lumen_atlas_theme_v1')"),'Atlas reads shared theme early');
check(main.includes("lumen_atlas_theme_v1"),'Recall and Atlas share a theme preference');
check(js.includes("document.startViewTransition(update)"),'Atlas uses native reader transitions');
check(js.includes("prefers-reduced-motion: reduce"),'Atlas reader navigation checks reduced-motion');
check(js.includes('function showSearch(q)'),'Atlas search state logic is retained');
check(js.includes('function bindImages()'),'Atlas image fallbacks are retained');
check(js.includes('mediaCreditHtml'),'Atlas source credit logic is retained');
check(main.includes('window.LUMEN_DATA='),'Recall glossary payload is still embedded');
check(main.includes('function studyPage()'),'Recall practice renderer retained');
check(main.includes('function advanceRound()'),'Recall new-round progression retained');
check(main.includes('function importProgress(file)'),'Recall backup import retained');

console.log('All source-level integration checks passed. Browser, visual and medical-image QA remain separate.');
