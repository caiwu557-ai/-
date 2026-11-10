import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const folder=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','atlas');
const read=f=>JSON.parse(fs.readFileSync(path.join(folder,'data',f),'utf8'));
const manual=read('manual.json'),map=read('image-map.json'),terms=read('term-image-links.json');
const fail=(cond,msg)=>{if(!cond)throw new Error(msg)};
fail(manual.sections.length===182,'Expected 182 sections');
fail(manual.comparisons.length===45,'Expected 45 groups');
fail(new Set(manual.comparisons.map(c=>c.id)).size===45,'Duplicate G ids');
fail(manual.images.length===118,'Original 118 chat images not retained');
for(const c of manual.comparisons)fail((map.comparison||{})[c.id]?.length>0,'Missing comparison '+c.id);
let n=0;
for(const [id,m] of Object.entries(map.media)){if(m.kind!=='external'){
 const p=path.join(folder,m.src);fail(fs.existsSync(p),'Missing file '+id+' -> '+p);
 fail(fs.statSync(p).size>50,'Empty file '+p);n++;}}
for(const [sec,links] of Object.entries(terms))for(const t of links)fail(map.media[t.media],'Unknown term image '+sec+'/'+t.name);
for(const [sec,links] of Object.entries(map.section))for(const t of links)fail(map.media[t.media],'Unknown section image '+sec);
for(const [id,links] of Object.entries(map.comparison))for(const t of links)fail(map.media[t.media],'Unknown comparison image '+id);
const html=fs.readFileSync(path.join(folder,'index.html'),'utf8'),css=fs.readFileSync(path.join(folder,'atlas.css'),'utf8');
fail(html.includes('href="../"')&&html.includes('atlas.js'),'Missing integration links');
fail(css.includes('--accent:#615cf6'),'Missing LUMEN accent');
console.log(JSON.stringify({sections:manual.sections.length,comparisons:manual.comparisons.length,originalImages:manual.images.length,localImages:n,qa:'pass'}));
