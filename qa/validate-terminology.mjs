/**
 * LUMEN terminology regression checks (Node.js >= 18, no dependencies).
 * Usage: node qa/validate-terminology.mjs
 * This is a structural + targeted semantic regression check; it cannot certify every term.
 */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function extractEmbeddedJSON(prefix, terminator = ';\n') {
  const start = html.indexOf(prefix);
  assert(start >= 0, `Missing ${prefix}`);
  const at = start + prefix.length;
  const end = html.indexOf(terminator, at);
  assert(end >= 0, `Cannot locate JSON end: ${prefix}`);
  return JSON.parse(html.slice(at, end));
}
function extractSingleLineJSON(prefix) {
  const start = html.indexOf(prefix);
  assert(start >= 0, `Missing ${prefix}`);
  const at = start + prefix.length;
  const end = html.indexOf(';\n', at);
  assert(end >= 0, `Cannot locate JSON end: ${prefix}`);
  return JSON.parse(html.slice(at, end));
}

const data = extractEmbeddedJSON('window.LUMEN_DATA=');
const cards = data.cards;
const extra = extractSingleLineJSON('const EXAM_EXTRA_CARDS=');
const focus = extractSingleLineJSON('const EXAM_FOCUS_ENTRIES=');
const approvedAliases = extractSingleLineJSON('const EXAM_ALLOWED_ALIASES=');
const allCards = [...cards, ...extra];
const byId = new Map(allCards.map(w => [w.id, w]));
const norm = s => String(s).toLowerCase().normalize('NFKC').trim();

assert.equal(cards.length, 1269, 'Underlying study vocabulary should remain intact');
assert.equal(extra.length, 14, 'Classroom-slide additions should remain intact');
assert.equal(allCards.length, 1283, 'Total displayed cards changed');
assert.equal(byId.size, allCards.length, 'Card IDs must be unique (SRS depends on them)');
assert.equal(new Set(allCards.map(w => norm(w.en))).size, allCards.length, 'English main labels must be unique');
assert.equal(focus.length, 172, 'Classroom-focus list changed');
for (const item of focus) assert(byId.has(item.id), `Dangling exam focus ID: ${item.id}`);
assert(!focus.some(item => /classwork/i.test(JSON.stringify(item))), 'Classwork was included in exam focus');
assert(cards.every(w => w.id && w.en && w.cn && Array.isArray(w.aliases)), 'Invalid glossary record');
for (const w of cards) {
  assert(w.aliases.some(a => norm(a) === norm(w.en)), `Main spelling missing from aliases: ${w.id}`);
  for (const course of (w.courseIds || [])) {
    assert(data.meta.courseNames[course], `Unknown chapter ${course}: ${w.id}`);
  }
}

const expected = new Map([
  ['renal capsule','肾被膜'],
  ['proximal straight tubule','近端直小管'],
  ['distal straight tubule','远端直小管'],
  ['varicosity','轴突膨体（神经纤维串珠状膨大）'],
  ['dendritic spine','树突棘'],
  ['embryonic hematopoiesis','胚胎造血'],
  ['dyad','二联体'],
  ['cellulitis','蜂窝织炎'],
  ['parietal','壁侧的（上皮／浆膜语境）'],
  ['serous','浆液性的（腺体分泌语境）'],
  ['molecular','分子的'],
  ['axis','轴；轴线（具体结构需结合上下文）'],
  ['radial','放射状的（女性生殖系统语境）'],
  ['primary','初级的'],
  ['secondary','次级的'],
  ['ciliary','纤毛的（呼吸上皮语境）'],
  ['index finger','示指'],
  ['type I alveolar cell','Ⅰ型肺泡细胞'],
  ['type II alveolar cell','Ⅱ型肺泡细胞']
]);
const byEnglish = new Map(cards.map(w => [norm(w.en), w]));
for (const [en, cn] of expected) {
  assert.equal(byEnglish.get(norm(en))?.cn, cn, `Failed revised pair: ${en}`);
}
for (const invalid of ['dendrite spine','embryotic hematopoiesis','diad','cellulitis-anatomy','typeⅠalveolar cell','typeⅡalveolar cell']) {
  assert(!byEnglish.has(norm(invalid)), `Non-standard main label still present: ${invalid}`);
}

const forbidden = new Map([
 ['Simple squamous epithelium',['Endothelium']],
 ['Collecting tubule',['Collecting duct']],
 ['Myelinated nerve fascicle',['Nerve fascicle']],
 ['Intercalated duct',['Intralobular duct']],
 ['Palatine tonsil',['Tonsil']],
 ['Meibomian gland',['Sebaceous gland']],
 ['Intrapulmonary bronchus',['Bronchus','Small bronchus']],
 ['Colon',['Large intestine']],
 ['Early placenta',['Placenta']],
 ['Pseudostratified ciliated columnar epithelium',['Pseudostratified epithelium']],
 ['Elastic fibers',['Elastic lamellae']],
 ['Serous demilune cell',['Serous demilune']],
 ["Peyer's patches",['Aggregated lymphoid nodules']],
 ['Atrium',['atrial myocardium','atrial wall']],
 ['Ventricle',['ventricular myocardium','ventricular wall']],
 ['Early spermatid',['spermatid']],
 ['Mucosa-associated lymphoid nodule',['Lymphoid nodule']],
 ['Trabecula of lymph node',['Trabecula']]
]);
for (const [en, removed] of forbidden) {
  const w = byEnglish.get(norm(en));
  assert(w, `Missing alias owner: ${en}`);
  const all = [...w.aliases, ...(approvedAliases[w.id] || [])].map(norm);
  for (const alias of removed) assert(!all.includes(norm(alias)), `Unsafe alias reappeared: ${en} -> ${alias}`);
}
console.log('PASS: 1,269 core records + 14 photo-only cards; 172 focus entries; unique IDs/labels; 19 corrections; 21 unsafe aliases removed.');
