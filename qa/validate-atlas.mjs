import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const folder=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','atlas');
const read=f=>JSON.parse(fs.readFileSync(path.join(folder,'data',f),'utf8'));
const manual=read('manual.json');const map=read('image-map.json');const terms=read('term-image-links.json');const credits=read('credits.json');
const fail=(cond,msg)=>{if(!cond)throw new Error(msg)};
fail(manual.sections.length===182,'Expected 182 reading sections');
fail(manual.comparisons.length===45,'Expected G01–G45');
fail(new Set(manual.comparisons.map(c=>c.id)).size===45,'Duplicate G identifier');
fail(manual.images.length===118,'Expected 118 original chat image links');
for(const c of manual.comparisons)fail((map.comparison||{})[c.id]?.length>0,'Missing comparison images '+c.id);
const local=[];for(const [id,m] of Object.entries(map.media)){if(m.kind!=='external'){const p=path.join(folder,m.src);fail(fs.existsSync(p),'Missing '+id+' -> '+p);fail(fs.statSync(p).size>50,'Empty image '+p);local.push(id)}}
for(const [section,links] of Object.entries(terms))for(const t of links)fail(map.media[t.media],`Unknown term image ${section}/${t.name}: ${t.media}`);
for(const [section,links] of Object.entries(map.section))for(const t of links)fail(map.media[t.media],`Unknown section image ${section}: ${t.media}`);
for(const [id,links] of Object.entries(map.comparison))for(const t of links)fail(map.media[t.media],`Unknown comparison image ${id}: ${t.media}`);
for(const [id,m] of Object.entries(map.media)){
 if(/(?:pancrea)/i.test(m.topic||'') && /(?:salivary|parotid)/i.test(m.scope||''))throw new Error('Cross-organ image: '+id);
}
// Every displayed local, external, and original-chat image must have a visible source link.
for(const id of Object.keys(map.media))fail(credits.media[id]?.name&&credits.media[id]?.url?.startsWith('https://'),'Uncredited image '+id);
for(const im of manual.images)fail(credits.chat[im.id]?.name&&credits.chat[im.id]?.url===im.url,'Uncredited original chat image '+im.id);
const atlasJS=fs.readFileSync(path.join(folder,'atlas.js'),'utf8');
const extraIds=[...atlasJS.matchAll(/"(WEB8:[^"]+)":\{"src":/g)].map(x=>x[1]);
for(const id of extraIds)fail(credits.media[id]?.url?.startsWith('https://'),'Uncredited external image '+id);
fail(atlasJS.includes('mediaCreditHtml(')&&atlasJS.includes('setModalCredit('),'Visible image credit render missing');
const hrefs=(manual.images||[]).map(i=>i.url||'');
fail(hrefs.every(x=>x.startsWith('https://')),'Original picture link missing or not HTTPS');
const css=fs.readFileSync(path.join(folder,'atlas.css'),'utf8');
const html=fs.readFileSync(path.join(folder,'index.html'),'utf8');
fail(html.includes('href="../"'),'Missing back link to LUMEN');
fail(html.includes('atlas.js'),'Missing UI script');
fail(css.includes('--accent:#615cf6'),'Host accent not applied');
console.log(JSON.stringify({sections:manual.sections.length, comparisons:manual.comparisons.length,originalLinks:manual.images.length,localMedia:local.length,creditRecords:Object.keys(credits.media).length+Object.keys(credits.chat).length,termSectionCount:Object.keys(terms).length,qa:'pass'},null,2));
