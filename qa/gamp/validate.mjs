import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const lineMatches = (s, re) => String(s ?? '').split(/\r?\n/).filter(x => re.test(x));
export function reference(text) {
  const lines = lineMatches(text, /^GAMP-Issue:/);
  if (lines.length !== 1) return null;
  const m = /^GAMP-Issue: #([1-9]\d{0,8})$/.exec(lines[0]);
  return m ? Number(m[1]) : null;
}
const forbidden = /(?:^|\/)(?:\.memory|\.private|private-memory|private-context|raw-transcripts?|private-handoffs?)(?:\/|$)|(?:^|\/)\.env(?:\.[^/]+)?$|(?:^|\/)(?:credentials|secrets)\.(?:json|ya?ml|txt)$/i;
export function validate({repo, pr, issue, commits, files}) {
  const failures = [];
  const n = reference(pr.body);
  if (!n) failures.push('PR_REFERENCE');
  const expectedRepo = 'https://api.github.com/repos/' + repo;
  if (!issue || issue.number !== n || issue.pull_request || issue.repository_url !== expectedRepo || issue.state !== 'open') failures.push('ACTIVE_SAME_REPO_ISSUE');
  const body = issue?.body ?? '';
  if (lineMatches(body, /^GAMP-Record: active$/).length !== 1 || lineMatches(body, /^GAMP-Record:/).length !== 1) failures.push('ISSUE_RECORD_TYPE');
  for (const field of ['Public summary','Scope','Acceptance criteria','Status']) {
    const lines = body.split(/\r?\n/);
    const idx = lines.findIndex(l => l === '## ' + field);
    const section = idx < 0 ? [] : lines.slice(idx+1, lines.findIndex((l,i)=>i>idx && /^## /.test(l)) < 0 ? lines.length : lines.findIndex((l,i)=>i>idx && /^## /.test(l)));
    if (!section.join('\n').replace(/<!--[\s\S]*?-->/g,'').replace(/- \[ \]/g,'').trim()) failures.push('ISSUE_FIELD_' + field.replaceAll(' ','_').toUpperCase());
  }
  if (!Array.isArray(commits) || !commits.length || commits.length !== pr.commits || commits.length >= 250) failures.push('COMMIT_ENUMERATION');
  for (const c of commits ?? []) {
    const msg = String(c.commit?.message ?? '').trimEnd();
    const last = msg.split(/\r?\n/).at(-1);
    if (reference(msg) !== n || last !== 'GAMP-Issue: #' + n) failures.push('COMMIT_TRAILER');
    const created = Date.parse(issue?.created_at), authored = Date.parse(c.commit?.author?.date), committed = Date.parse(c.commit?.committer?.date);
    if (![created,authored,committed].every(Number.isFinite) || authored < created || committed < created) failures.push('ISSUE_PRECEDENCE');
  }
  if (!Array.isArray(files) || files.length !== pr.changed_files || files.length >= 3000) failures.push('FILE_ENUMERATION');
  for (const f of files ?? []) {
    for (const p of [f.filename,f.previous_filename].filter(Boolean)) {
      if (forbidden.test(p) && !/(?:^|\/)\.env\.example$/.test(p)) failures.push('PRIVATE_PATH');
    }
  }
  return [...new Set(failures)];
}
async function main() {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  if (process.env.GITHUB_EVENT_NAME !== 'pull_request' || !event.pull_request || !/^[\w.-]+\/[\w.-]+$/.test(repo ?? '') || !token) throw Error('UNSUPPORTED_CONTEXT');
  const base = 'https://api.github.com/repos/' + repo;
  async function get(path) {
    const res = await fetch(base + path,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},redirect:'error'});
    if (!res.ok) throw Error('API_LOOKUP_FAILED');
    return res.json();
  }
  async function all(path, max) {
    const rows=[];
    for(let page=1;page<=max;page++){
      const x=await get(path+'?per_page=100&page='+page);
      if(!Array.isArray(x)) throw Error('API_ENUMERATION_FAILED');
      rows.push(...x); if(x.length<100) return rows;
    }
    return rows;
  }
  const prn=event.pull_request.number;
  if(!Number.isSafeInteger(prn)||prn<1) throw Error('INVALID_PR_NUMBER');
  const pr=await get('/pulls/'+prn);
  if(pr.head?.sha!==event.pull_request.head?.sha) throw Error('HEAD_MOVED');
  const n=reference(pr.body);
  let issue=null;
  if(n) { try { issue=await get('/issues/'+n); } catch {} }
  const commits=await all('/pulls/'+prn+'/commits',3);
  const files=await all('/pulls/'+prn+'/files',30);
  const failures=validate({repo,pr,issue,commits,files});
  const latest=await get('/pulls/'+prn);
  if(latest.head?.sha!==pr.head?.sha || latest.body!==pr.body) failures.push('PR_MOVED');
  if(n && issue) {
    const latestIssue=await get('/issues/'+n);
    if(latestIssue.state!==issue.state || latestIssue.updated_at!==issue.updated_at || latestIssue.body!==issue.body) failures.push('ISSUE_MOVED');
  }
  if(failures.length) { console.error('GAMP advisory FAIL: '+failures.join(', ')); process.exitCode=1; }
  else console.log('GAMP advisory PASS; structural traceability only, not confidentiality or release authorization.');
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) main().catch(()=>{console.error('GAMP advisory FAIL: INPUT_OR_API_ERROR');process.exitCode=1;});
