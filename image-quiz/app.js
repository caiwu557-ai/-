/* LUMEN Image Lab — user-supplied question bank, offline-first, no dependencies. */
(()=>{'use strict';
const BANK=window.LUMEN_IMAGE_BANK;
if(!BANK||!Array.isArray(BANK.questions)){
 document.getElementById('main').innerHTML='<h1>题库加载失败</h1><p>请保留 data/bank.js 与 images/ 文件夹后重新打开。</p>';return;
}
const QS=BANK.questions, byId=Object.fromEntries(QS.map(q=>[q.id,q]));
const STORAGE='lumen_image_lab_progress_v1',THEME='lumen_atlas_theme_v1';
const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
const htmlEscape=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const dateFmt=v=>v?new Date(v).toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'}):'—';
const clockFmt=v=>new Date(v).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
const norm=s=>String(s??'').normalize('NFKC').toLowerCase().trim().replace(/[^a-z0-9\u3400-\u9fff]/g,'');
const check=(v,q)=>Boolean(norm(v))&&q.accept.some(a=>norm(a)===norm(v));
// Only source-reviewed target coordinates are rendered. No answer text in markers.
let focusVisible=true;
function focusHtml(q){if(!focusVisible||!q?.focusMark)return '';
 const m=q.focusMark,x=Number(m.x),y=Number(m.y),r=Number(m.radius);
 if(![x,y,r].every(Number.isFinite)||x<=0||x>=1||y<=0||y>=1||r<=0||r>.3)return '';
 return `<span class="image-focus" style="--target-x:${(x*100).toFixed(2)}%;--target-y:${(y*100).toFixed(2)}%;--target-d:${(r*200).toFixed(2)}%" aria-hidden="true"></span>`;
}
function markButton(q){return q?.focusMark?`<button type="button" class="focus-btn" data-action="toggle-focus" aria-pressed="${focusVisible}">${focusVisible?'隐藏定位环':'显示定位环'}</button>`:'';}

const icons={
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
 repeat:'<path d="M4 11a8 8 0 0 1 14-5l2 2M20 4v4h-4"/><path d="M20 13a8 8 0 0 1-14 5l-2-2M4 20v-4h4"/>',
 book:'<path d="M12 6.5C9.5 5 6.2 5 3 6v14c3.2-1 6.5-1 9 1 2.5-2 5.8-2 9-1V6c-3.2-1-6.5-1-9 .5Z"/><path d="M12 6v15"/>',
 layers:'<path d="m12 3-9 5 9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
 scan:'<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/><circle cx="12" cy="12" r="3"/><path d="M8 12h8"/>',
 moon:'<path d="M20 13A8.6 8.6 0 0 1 11 4a9 9 0 1 0 9 9Z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M5 19l1.4-1.4M17.6 6.4 19 5"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 4.4 2c-.8.6-1.9 1-1.9 2.5M12 17h.01"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 spark:'<path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z"/>',
 shield:'<path d="m12 3 8 3v6c0 5-4 7.8-8 9-4-1.2-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
 arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 chevron:'<path d="m9 18 6-6-6-6"/>',
 check:'<path d="m4 12 5 5L20 6"/>',
 zoom:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
 download:'<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/>',
 alert:'<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 17h.01"/>'
};
function svg(name){return '<svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(icons[name]||icons.target)+'</svg>'}
function applyIcons(root=document){$$('[data-icon]',root).forEach(el=>{el.innerHTML=svg(el.dataset.icon)})}
const empty=()=>({version:1,items:{},sessions:[],flags:{},active:null});
const isRecord=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const MODES=new Set(['adaptive','new','weak','exam','single']);
const validAnswer=a=>isRecord(a)&&typeof a.id==='string'&&typeof a.user==='string'&&a.user.length<=1000&&typeof a.ok==='boolean'&&typeof a.skipped==='boolean'&&Number.isFinite(a.when);
function validSession(x,completed=false){
 if(!isRecord(x)||!MODES.has(x.mode)||!Array.isArray(x.ids)||!x.ids.length||x.ids.length>364||!Number.isFinite(x.startedAt)||!Array.isArray(x.answers)||x.answers.length>x.ids.length)return false;
 if(!x.ids.every(id=>typeof id==='string'&&byId[id]?.autoEligible))return false;
 if(!x.answers.every((a,i)=>validAnswer(a)&&a.id===x.ids[i]))return false;
 if(completed)return Number.isFinite(x.finishedAt)&&Number.isInteger(x.correct)&&Number.isInteger(x.skipped)&&x.correct>=0&&x.skipped>=0&&x.correct+x.skipped<=x.ids.length;
 return x.finishedAt==null&&Number.isInteger(x.index)&&x.index>=0&&x.index<x.ids.length&&
  (x.answers.length===x.index||x.answers.length===x.index+1)&&
  (x.draftInput===undefined||(typeof x.draftInput==='string'&&x.draftInput.length<=200));
}
function normalizeProgress(p){
 if(!isRecord(p)||p.version!==1||!isRecord(p.items)||!Array.isArray(p.sessions)||!isRecord(p.flags)||p.sessions.length>40)throw Error('学习进度结构不符合本模块格式');
 if(Object.keys(p.items).length>QS.length||Object.keys(p.flags).length>QS.length)throw Error('学习记录数量异常');
 for(const [id,r] of Object.entries(p.items)){
  if(!byId[id]||!isRecord(r)||!['attempts','correct','wrong','streak'].every(k=>Number.isInteger(r[k])&&r[k]>=0)||
    r.correct>r.attempts||r.wrong>r.attempts||r.correct+r.wrong!==r.attempts||
    (r.lastAt!==undefined&&!Number.isFinite(r.lastAt))||(r.dueAt!==undefined&&!Number.isFinite(r.dueAt))||
    (r.lastWrong!==undefined&&typeof r.lastWrong!=='boolean'))throw Error('题目练习记录异常：'+id);
 }
 for(const x of p.sessions){if(!validSession(x,true))throw Error('历史练习记录格式异常')}
 for(const [id,f] of Object.entries(p.flags)){
  if(!byId[id]||!isRecord(f)||typeof f.type!=='string'||f.type.length>100||
   typeof f.note!=='string'||f.note.length>2000||!Number.isFinite(f.when))throw Error('核验记录格式异常：'+id);
 }
 if(p.active!=null&&!validSession(p.active))throw Error('未完成练习记录格式异常');
 return {version:1,items:p.items,sessions:p.sessions,flags:p.flags,active:p.active??null};
}
function load(){try{return normalizeProgress(JSON.parse(localStorage.getItem(STORAGE)))}catch{return empty()}}
let store=load();
let storageFailureShown=false;
function save(){
 try{
  localStorage.setItem(STORAGE,JSON.stringify(store));
  if(storageFailureShown){storageFailureShown=false;const alert=$('#storage-alert');if(alert)alert.hidden=true;const badge=$('#local-badge');if(badge)badge.textContent='本机练习'}
  return true;
 }catch{
  const alert=$('#storage-alert');if(alert)alert.hidden=false;
  const badge=$('#local-badge');if(badge)badge.textContent='进度无法保存';
  if(!storageFailureShown){storageFailureShown=true;toast('浏览器拒绝保存学习进度，请检查本机存储权限')}
  return false;
 }
}
const groups=Object.keys(BANK.meta.categories),types=['器官','组织','结构','细胞'];
let state={view:'home',mode:'adaptive',size:20,groups:new Set(),types:new Set(),session:restoreActive(),bankQuery:'',bankGroup:'all',bankReview:'all',bankShown:36,flagging:null};
function restoreActive(){return validSession(store.active)?store.active:null}
function currentStats(){const recs=Object.values(store.items);const attempts=recs.reduce((sum,x)=>sum+(x.attempts||0),0),correct=recs.reduce((sum,x)=>sum+(x.correct||0),0);return {attempts,correct,newCount:QS.filter(q=>q.autoEligible&&!store.items[q.id]?.attempts).length,due:QS.filter(q=>q.autoEligible&&store.items[q.id]?.dueAt&&store.items[q.id].dueAt<=Date.now()).length}}
function eligiblePool(mode=state.mode){return QS.filter(q=>q.autoEligible&&(!state.groups.size||state.groups.has(q.group))&&(!state.types.size||state.types.has(q.type))&&
    (mode!=='exam'||q.examEligible)&&
    (mode!=='new'||!store.items[q.id]?.attempts)&&
    (mode!=='weak'||!!store.items[q.id]?.wrong));}
function choose(pool,limit,mode){
 const points=q=>{const r=store.items[q.id]||{},seen=r.attempts||0;const due=r.dueAt&&r.dueAt<=Date.now();return (mode==='adaptive'?((due?8:0)+(r.wrong?Math.min(r.wrong,6)*1.5:0)+(seen===0?5:0)):0)+Math.random()*2.5};
 const sorted=pool.map(q=>({q,s:points(q)})).sort((a,b)=>b.s-a.s);
 const ids=[],nameSeen=new Set();
 for(const {q} of sorted){if(ids.length>=limit)break;if(nameSeen.has(q.cn))continue;ids.push(q.id);nameSeen.add(q.cn)}
 for(const {q} of sorted){if(ids.length>=limit)break;if(!ids.includes(q.id))ids.push(q.id)}
 return ids;
}
function toast(message){const el=$('#toast');el.textContent=message;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{el.hidden=true},2500)}
function themeSync(){const dark=document.documentElement.dataset.theme==='dark';$('#theme-btn .nav-icon').dataset.icon=dark?'sun':'moon';applyIcons($('#theme-btn'))}
function setTheme(){const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem(THEME,theme)}catch{}themeSync()}
function titleFor(view){return ({home:'看图填空',quiz:'识图练习',result:'本轮结果',bank:'全部题库',history:'学习记录'})[view]||'看图填空'}
function setView(view){if(!['home','quiz','result','bank','history'].includes(view))return;state.view=view;document.body.classList?.toggle('image-quiz-focus-mode',view==='quiz');
 $$('.page').forEach(el=>el.classList.toggle('hidden',el.id!=='page-'+view));
 $('#breadcrumb').textContent=titleFor(view);
 $$('[data-view]').forEach(el=>{const active=el.dataset.view===view||(view==='result'&&el.dataset.view==='home')||(view==='quiz'&&el.dataset.view==='home');el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
 $('#shell').classList.remove('menu-open');
 if(view==='home')renderHome();if(view==='quiz')renderQuiz();if(view==='result')renderResult();if(view==='bank')renderBank();if(view==='history')renderHistory();
 window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true});
}
function renderHome(){const stats=currentStats();$('#metric-total').textContent=QS.length;$('#metric-new').textContent=stats.newCount;$('#metric-due').textContent=stats.due;$('#metric-accuracy').textContent=stats.attempts?Math.round(stats.correct/stats.attempts*100)+'%':'—';$('#audit-count').textContent=BANK.meta.extractedReviewCount+(BANK.meta.visualQaSuspendedCount||0);$('#supplement-count').textContent=BANK.meta.scopeSupplementCount;$('#available-total').textContent=BANK.meta.automaticCount;
 $('#group-chips').innerHTML=groups.map(g=>`<button type="button" class="filter-chip ${state.groups.has(g)?'on':''}" data-group="${htmlEscape(g)}" aria-pressed="${state.groups.has(g)}">${htmlEscape(g)} <span>${BANK.meta.categories[g]}</span></button>`).join('');
 $('#type-chips').innerHTML=types.map(t=>`<button type="button" class="filter-chip ${state.types.has(t)?'on':''}" data-type="${t}" aria-pressed="${state.types.has(t)}">${t} <span>${BANK.meta.types[t]}</span></button>`).join('');
 $$('.mode-option').forEach(el=>{const on=el.dataset.mode===state.mode;el.classList.toggle('selected',on);el.setAttribute('aria-checked',String(on))});
 $('#count-select').value=String(state.size);
 const pool=eligiblePool(),count=Math.min(pool.length,state.size);
 $('#pool-badge').textContent=`可用 ${pool.length} 题`;$('#start-count').textContent=count?`· ${count} 题`:'';$('#start-btn').disabled=!pool.length;
 const kinds={adaptive:'综合练习',new:'新图识别',weak:'错题强化',exam:'模拟考试'};
 $('#pool-description').textContent=pool.length?`${kinds[state.mode]} · 选中范围 ${pool.length} 题 · 本轮 ${count} 题${count<state.size?'（自动缩减）':''}`:'当前筛选无已核实目标的可练习题目。调整系统或目标类型。';
 const existing=$('#resume-box');if(existing)existing.remove();
 if(state.session&&!state.session.finishedAt){const box=document.createElement('div');box.id='resume-box';box.className='panel';box.style.marginBottom='15px';box.innerHTML=`<div class="panel-title"><div><h2>继续上次练习</h2><p style="color:var(--secondary);font-size:12px">已完成 ${state.session.answers.length} / ${state.session.ids.length} 题，自动保存在本机。</p></div><button type="button" class="secondary-btn" data-action="resume">继续</button></div>`;$('#page-home .two-col').before(box)}
}
function startRound(ids,mode=state.mode){if(!ids){const pool=eligiblePool(mode);if(!pool.length){toast('当前筛选没有可练习的题目');return}ids=choose(pool,Math.min(pool.length,state.size),mode)}
 if(ids.some(id=>!byId[id]?.autoEligible)){toast('此题属于补充范围或目标待核验，暂不参与自动判分。');return}
 if(state.session&&!state.session.finishedAt){if(!confirm('开始新一轮将丢弃当前未完成轮次及未提交的输入。已累计的普通练习作答仍在本机；未完成的模拟考试不会计入成绩。确定替换吗？'))return}
 state.session={id:'s-'+Date.now(),mode,ids:[...ids],index:0,answers:[],startedAt:Date.now(),finishedAt:null,applied:false};store.active=state.session;save();setView('quiz');}
function current(){return state.session&&byId[state.session.ids[state.session.index]]}
function feedbackHtml(q,ans,isExam){if(!ans)return '';
 const status=ans.skipped?'neutral':ans.ok?'ok':'bad';
 if(isExam)return `<div class="answer-feedback neutral"><strong>已记录作答</strong><p>模拟考试结束后统一显示答案。此时仍可继续下一题。</p></div>`;
 return `<div class="answer-feedback ${status}"><strong>${ans.skipped?'已跳过':ans.ok?'回答正确':'需要重新辨认'}</strong><p>${ans.skipped?'此题未计入正确率。':ans.ok?'本题识别正确。':'你的答案：'+htmlEscape(ans.user)}</p><p class="canonical">${htmlEscape(q.cn)} <span style="font-size:12px;color:var(--secondary);font-weight:500">${htmlEscape(q.en)}</span></p>${q.accept.length>2?`<p class="extras">同义答案：${q.accept.slice(2).map(htmlEscape).join('、')}</p>`:''}<div class="small-actions"><button type="button" data-action="copy-term" data-id="${q.id}">复制术语</button><button type="button" data-action="handoff" data-id="${q.id}">复制术语并打开词库 ↗</button><button type="button" data-action="flag" data-id="${q.id}">题目有问题？</button></div></div>`
}
function renderQuiz(){const q=current(),s=state.session;if(!q||!s){setView('home');return}
 const ans=s.answers.find(x=>x.id===q.id),exam=s.mode==='exam';const done=!!ans;
 $('#page-quiz').innerHTML=`<div class="practice-top"><div class="top-left"><button type="button" class="back-btn" data-action="leave-quiz" aria-label="返回练习设置">‹</button><div><h1>${exam?'模拟考试':s.mode==='single'?'单题训练':'识图练习'}</h1><small>${htmlEscape(q.group)} · ${htmlEscape(q.type)}</small></div></div><div class="top-counter">${s.index+1} / ${s.ids.length} 题</div></div>
 <div class="progress-track" role="progressbar" aria-label="练习进度" aria-valuemin="0" aria-valuemax="${s.ids.length}" aria-valuenow="${s.index}"><div style="width:${s.index/s.ids.length*100}%"></div></div>
 <div class="practice-layout"><section class="image-card"><div class="image-card-head"><strong>显微图像</strong><div class="image-tools">${markButton(q)}<small>放大观察原图标记</small></div></div><div class="image-stage"><button type="button" data-action="zoom" data-id="${q.id}" aria-label="放大 ${q.id} 显微图像"><span class="image-figure"><img src="${q.image}" width="${q.width}" height="${q.height}" alt="${q.id} 显微组织图像，待识别 ${htmlEscape(q.type)}">${focusHtml(q)}</span></button></div><div class="image-card-foot"><span>${q.id} · ${q.width} × ${q.height} · WebP</span><div class="image-card-actions"><button type="button" data-action="zoom" data-id="${q.id}">放大 <span aria-hidden="true">↗</span></button><button type="button" class="quiz-jump" data-action="jump-answer">${done?'查看反馈':'去作答'} <span aria-hidden="true">↓</span></button></div></div></section>
 <section class="answer-card"><button type="button" class="quiz-jump-back" data-action="jump-image">↑ 返回图像</button><p class="question-eyebrow">${htmlEscape(q.group)} / ${htmlEscape(q.type)}</p><h2 class="question-title">${htmlEscape(q.prompt)}</h2><p class="question-description">仅需回答本题指定对象；支持中文或英文全称及经过审核的同义词。</p><label for="answer-input">你的答案</label><input class="answer-input" id="answer-input" type="text" placeholder="填写中文或英文术语" autocomplete="off" spellcheck="false" enterkeyhint="done" ${done?'disabled':''} value="${done?htmlEscape(ans.user):htmlEscape(s.draftInput||'')}" maxlength="200"><p class="answer-help">Enter 提交 / 下一题。未提交的输入在本机暂存，图片可缩放查看。</p><div class="answer-actions">${done?`<button class="primary-btn" type="button" data-action="next">${s.index+1===s.ids.length?'查看结果':'下一题'} ${svg('arrow')}</button>`:`<button class="primary-btn" type="button" data-action="submit">${exam?'确认本题':'提交答案'} ${svg('arrow')}</button><button class="secondary-btn" type="button" data-action="skip">跳过</button>`}</div>${feedbackHtml(q,ans,exam)}<div class="qid">题目编号 ${q.id} · 已从题库范围与目标复核中保留</div></section></div><p class="quiz-notice">题图由提供者确认可公开托管；保留原始题号。若图中标记不清，可在作答后报告核验问题。</p>`;
 if(!done){const input=$('#answer-input');requestAnimationFrame(()=>{if(window.innerWidth>870)input.focus({preventScroll:true})})}else{const nextBtn=$('#page-quiz [data-action="next"]');requestAnimationFrame(()=>{if(window.innerWidth>870)nextBtn?.focus({preventScroll:true})})}
 const next=s.ids[s.index+1];if(next){const image=new Image();image.src=byId[next].image}
}
function grade(q,answer,skipped=false){return {id:q.id,user:answer,ok:!skipped&&check(answer,q),skipped,when:Date.now()}}
function submit(skip=false){const s=state.session,q=current();if(!s||!q)return;if(s.answers.some(a=>a.id===q.id))return;
 const input=$('#answer-input');const user=skip?'':input?.value.trim();if(!skip&&!user){toast('先填写答案，或使用「跳过」');input?.focus();return}
 const ans=grade(q,user,skip);s.answers.push(ans);s.draftInput='';
 if(s.mode!=='exam'&&!skip)applyAttempt(ans);
 store.active=s;save();renderQuiz();
}
function applyAttempt(a){const rec=store.items[a.id]||{attempts:0,correct:0,wrong:0,streak:0};rec.attempts+=1;rec.correct+=a.ok?1:0;rec.wrong+=a.ok?0:1;rec.streak=a.ok?(rec.streak||0)+1:0;rec.lastAt=Date.now();rec.lastWrong=!a.ok;
 const days=[0,1,3,7,14,30,60];rec.dueAt=Date.now()+(a.ok?days[Math.min(rec.streak,6)]*86400000:10*60000);store.items[a.id]=rec;
}
function next(){const s=state.session;if(!s)return;if(!s.answers.some(a=>a.id===current().id)){toast('先提交或跳过本题');return}
 if(s.index+1<s.ids.length){s.index++;store.active=s;save();renderQuiz();window.scrollTo({top:0,behavior:'instant'})}else finish();}
function finish(){const s=state.session;if(!s)return;
 if(s.mode==='exam'&&!s.applied){s.answers.filter(x=>!x.skipped).forEach(applyAttempt);s.applied=true}
 s.finishedAt=Date.now();const correct=s.answers.filter(a=>a.ok).length,skipped=s.answers.filter(a=>a.skipped).length;
 store.sessions.unshift({id:s.id,mode:s.mode,ids:s.ids,answers:s.answers,startedAt:s.startedAt,finishedAt:s.finishedAt,correct,skipped});store.sessions=store.sessions.slice(0,40);store.active=null;save();setView('result');}
function renderResult(){const s=state.session;if(!s?.finishedAt){setView('home');return}
 const right=s.answers.filter(a=>a.ok).length,skipped=s.answers.filter(a=>a.skipped).length,total=s.ids.length,percent=Math.round(right/total*100),wrongIds=s.answers.filter(a=>!a.ok&&!a.skipped).map(a=>a.id);
 $('#page-result').innerHTML=`<div class="page-head"><div><p class="overline">SESSION COMPLETE</p><h1>本轮结果</h1><p class="page-lead">${htmlEscape(({adaptive:'综合练习',new:'新图识别',weak:'错题强化',exam:'模拟考试',single:'单题训练'})[s.mode]||'练习')} · ${clockFmt(s.startedAt)}</p></div></div><div class="review-card score-hero"><div><div class="score">${percent}<span> / 100</span></div><p>答对 ${right} / ${total} 题 · 本轮正确率 ${percent}%</p></div><div class="result-actions"><button class="secondary-btn" type="button" data-action="export-mistakes">导出错题 CSV</button><button class="secondary-btn" type="button" data-action="train-wrong" ${wrongIds.length?'':'disabled'}>重练本轮错题</button><button class="primary-btn" type="button" data-view="home">新的一轮 ${svg('arrow')}</button></div></div><div class="result-stats"><div class="result-stat"><span>回答正确</span><strong>${right}</strong></div><div class="result-stat"><span>回答错误</span><strong>${total-right-skipped}</strong></div><div class="result-stat"><span>主动跳过</span><strong>${skipped}</strong></div></div><div class="panel" style="margin-bottom:14px"><h2>逐题回顾</h2><p class="review-note">点击图像放大。对目标编号或答案存疑时，标记并导出题目核验记录。</p><div class="result-list">${s.answers.map(a=>{const q=byId[a.id];return `<div class="result-row"><img src="${q.image}" width="${q.width}" height="${q.height}" loading="lazy" data-action="zoom" data-id="${q.id}" alt="${q.id} 图像"><div><small>${q.id} · ${htmlEscape(q.group)} · ${htmlEscape(q.type)}</small><strong>${htmlEscape(q.cn)} <span style="font-weight:500;color:var(--secondary)">${htmlEscape(q.en)}</span></strong><p>你的答案：${a.skipped?'（跳过）':htmlEscape(a.user)}</p></div><span class="status-pill ${a.skipped?'':a.ok?'ok':'bad'}">${a.skipped?'跳过':a.ok?'正确':'错误'}</span><div class="actions"><button type="button" data-action="copy-term" data-id="${q.id}">复制词条</button><button type="button" data-action="flag" data-id="${q.id}">核验疑问</button></div></div>`}).join('')}</div></div>`;
}
function renderBank(){const groupOpts=['all',...groups],found=filterBank(),visible=found.slice(0,state.bankShown);
 $('#page-bank').innerHTML=`<div class="page-head"><div><p class="overline">QUESTION LIBRARY</p><h1>全部题库</h1><p class="page-lead">364 张原图全部保留；仅自动组卷已排除补充范围与目标存疑题。归档题可查看，不自动判分。</p></div></div><div class="bank-controls"><input type="search" id="bank-search" placeholder="搜索中文 / English / 编号" aria-label="搜索题库" value="${htmlEscape(state.bankQuery)}"><select id="bank-group" aria-label="题库系统分类">${groupOpts.map(g=>`<option value="${htmlEscape(g)}" ${g===state.bankGroup?'selected':''}>${g==='all'?'所有系统':htmlEscape(g)}</option>`).join('')}</select><select id="bank-review" aria-label="题目审核状态"><option value="all" ${state.bankReview==='all'?'selected':''}>全部状态</option><option value="review" ${state.bankReview==='review'?'selected':''}>目标待核验</option><option value="supplement" ${state.bankReview==='supplement'?'selected':''}>补充范围</option><option value="clean" ${state.bankReview==='clean'?'selected':''}>自动练习可用</option></select></div><p class="bank-info">找到 ${found.length} 题 · 显示 ${visible.length} 题</p>${found.length?`<div class="bank-grid">${visible.map(q=>`<div class="bank-tile"><button class="thumb" type="button" data-action="zoom" data-id="${q.id}" aria-label="放大 ${q.id}"><img src="${q.image}" width="${q.width}" height="${q.height}" loading="lazy" alt="${q.id} 显微图"></button><div class="tile-body"><div class="tile-meta"><span>${q.id}</span><span>·</span><span>${htmlEscape(q.group)} / ${htmlEscape(q.type)}</span></div><strong>${htmlEscape(q.cn)}</strong><div class="en">${htmlEscape(q.en)}</div><div class="tile-bottom">${['review_needed','visual_review_needed'].includes(q.status)?'<span class="flagmini">图片目标待核验</span>':q.scope==='supplement'?'<span class="flagmini">补充范围</span>':'<span></span>'}<button type="button" data-action="single" data-id="${q.id}" ${q.autoEligible?'':'disabled title="仅供查阅，暂不自动判分"'}>${q.autoEligible?'练习此题':'仅供核验'}</button></div></div></div>`).join('')}</div>${visible.length<found.length?'<button type="button" class="load-more" data-action="more-bank">加载更多题目</button>':''}`:'<div class="empty-state"><strong>没有找到题目</strong>调整搜索关键词或筛选条件。</div>'}`;
}
function filterBank(){const q=state.bankQuery.trim().toLowerCase();return QS.filter(x=>(state.bankGroup==='all'||x.group===state.bankGroup)&&(state.bankReview==='all'||(state.bankReview==='review'?['review_needed','visual_review_needed'].includes(x.status):state.bankReview==='supplement'?x.scope==='supplement':x.autoEligible))&&(!q||[x.cn,x.en,x.id,x.group,x.type].some(z=>z.toLowerCase().includes(q))))}
function renderHistory(){const stats=currentStats();const attempts=stats.attempts;const reviewed=Object.entries(store.flags).length;
 $('#page-history').innerHTML=`<div class="page-head"><div><p class="overline">LEARNING RECORD</p><h1>学习记录</h1><p class="page-lead">作答结果、到期安排与核验疑问仅保存在当前浏览器，可随时导出备份。</p></div></div><div class="history-panels"><section class="panel"><h2>本机数据</h2><p>累计 ${attempts} 次有效作答，正确 ${stats.correct} 次。已标记 ${reviewed} 道题目需要进一步核实。</p><div class="history-actions"><button type="button" class="secondary-btn" data-action="export-progress">导出进度 JSON</button><button type="button" class="secondary-btn" data-action="import-progress">导入进度 JSON</button><button type="button" class="secondary-btn" data-action="export-audit">导出核验报告</button></div><p>导入进度会覆盖本模块本机记录，不会更改 LUMEN 单词记忆。执行前会再次确认。</p></section><section class="panel"><h2>复习安排</h2><p>答错后 10 分钟重新出现；连续答对后依次延长至 1、3、7、14、30 天。跳过不计错误，不改变复习日程。</p><p>当前到期 ${stats.due} 题。模拟考试在结束时统一写入成绩。</p><button type="button" class="text-btn" data-action="goto-weak">进入错题强化 →</button></section></div><section class="panel" style="margin-bottom:15px"><h2>最近练习</h2>${store.sessions.length?store.sessions.slice(0,20).map(s=>`<div class="session-row"><div><strong>${clockFmt(s.finishedAt)}</strong><br><span>${({adaptive:'综合练习',new:'新图识别',weak:'错题强化',exam:'模拟考试',single:'单题训练'})[s.mode]||htmlEscape(s.mode)} · ${s.ids.length} 题</span></div><strong>${s.correct} / ${s.ids.length}</strong></div>`).join(''):'<p>尚无已完成的练习。</p>'}</section><section class="panel"><h2>题目核验记录</h2><p>本机主动标记的题目：${reviewed} 项。系统标注目标存疑 ${BANK.meta.extractedReviewCount+(BANK.meta.visualQaSuspendedCount||0)} 项、补充范围 ${BANK.meta.scopeSupplementCount} 项，可在题库分别筛选。</p><div class="report-rows">${reviewed?Object.entries(store.flags).slice(0,15).map(([id,f])=>`<div class="report-row"><strong>${htmlEscape(id)} · ${htmlEscape(byId[id]?.cn||'未知题目')} · ${htmlEscape(f.type)}</strong><span>${htmlEscape(f.note||'无补充说明')} · ${dateFmt(f.when)}</span></div>`).join(''):'<div class="report-row">还没有主动标记题目。遇到编号不清或答案歧义，可在答题反馈中标记。</div>'}</div></section>`;
}
function makeDownload(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function downloadText(text,name,type='text/plain'){makeDownload(new Blob([text],{type:type+';charset=utf-8'}),name)}
function csv(rows){const quote=x=>{let v=String(x??'');if(/^\s*[=+\-@]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'};return '\ufeff'+rows.map(r=>r.map(quote).join(',')).join('\r\n')}
function exportMistakes(){const s=state.session;if(!s?.finishedAt)return;const rows=[['题目ID','系统','目标类型','标准中文','标准英文','用户答案','图片路径'],...s.answers.filter(a=>!a.ok&&!a.skipped).map(a=>{const q=byId[a.id];return [q.id,q.group,q.type,q.cn,q.en,a.user,q.image]})];downloadText(csv(rows),'LUMEN_看图填空_错题.csv','text/csv')}
function copyTerm(id){const q=byId[id];if(!q)return;const text=q.cn+' · '+q.en;const fallback=()=>{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()};if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).catch(fallback);else fallback();toast('已复制：'+text)}
function flagQuestion(id){if(!byId[id])return;state.flagging=id;$('#flag-target').textContent=id+' · '+byId[id].cn;$('#flag-note').value=store.flags[id]?.note||'';$('#flag-type').value=store.flags[id]?.type||'编号或目标不明确';$('#flag-dialog').showModal()}
function saveFlag(){const id=state.flagging;if(!id)return;store.flags[id]={type:$('#flag-type').value,note:$('#flag-note').value.trim().slice(0,2000),when:Date.now()};save();$('#flag-dialog').close();toast(id+' 的核验问题已保存在本机');if(state.view==='history')renderHistory()}
function handleAction(action,el){const id=el.dataset.id;
 if(action==='toggle-focus'){focusVisible=!focusVisible;if(state.view==='quiz')renderQuiz();else if(viewer.open)openViewer(state.viewerId);}else if(action==='submit')submit();else if(action==='skip')submit(true);else if(action==='next')next();else if(action==='leave-quiz'){setView('home');}
 else if(action==='resume')setView('quiz');else if(action==='zoom')openViewer(id);else if(action==='jump-answer'){const target=$('#page-quiz .answer-feedback')||$('#answer-input');target?.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});if(target?.id==='answer-input')target.focus({preventScroll:true})}else if(action==='jump-image'){$('#page-quiz .image-card')?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}else if(action==='single')startRound([id],'single');
 else if(action==='more-bank'){state.bankShown+=36;renderBank()}
 else if(action==='flag')flagQuestion(id);else if(action==='copy-term')copyTerm(id);else if(action==='handoff'){window.open('../?view=library','_blank','noopener');copyTerm(id)}
 else if(action==='export-mistakes')exportMistakes();else if(action==='train-wrong'){const s=state.session,ids=s.answers.filter(a=>!a.ok&&!a.skipped).map(a=>a.id);if(ids.length)startRound(ids,'weak')}
 else if(action==='export-progress')downloadText(JSON.stringify({schema:'lumen-image-progress-v1',exportedAt:Date.now(),progress:store},null,2),'LUMEN_识图学习进度.json','application/json');
 else if(action==='export-audit'){const audit={source:BANK.meta.sourceFile,exportedAt:new Date().toISOString(),flags:store.flags,pendingSourceReview:QS.filter(q=>!q.autoEligible).map(q=>({id:q.id,cn:q.cn,en:q.en,type:q.type,group:q.group,status:q.status,scope:q.scope,reason:q.scopeReason||q.reviewReason}))};downloadText(JSON.stringify(audit,null,2),'LUMEN_题库核验记录.json','application/json')}
 else if(action==='import-progress')importProgress();else if(action==='goto-weak'){state.mode='weak';setView('home')}
}
function importProgress(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.addEventListener('change',async()=>{const f=input.files?.[0];if(!f)return;try{if(f.size>5*1024*1024)throw Error('备份文件超过 5 MB 限制');const data=JSON.parse(await f.text());if(data.schema!=='lumen-image-progress-v1')throw Error('文件不是本模块进度备份');const restored=normalizeProgress(data.progress);if(!confirm('导入会覆盖当前识图学习记录。建议先导出备份；这不会更改主站术语记忆。确定继续吗？'))return;const previous=store;store=restored;if(!save()){store=previous;throw Error('浏览器无法写入本机存储，原记录未覆盖')}state.session=restoreActive();setView('history');toast('导入成功')}catch(e){toast('导入失败：'+e.message)}});input.click()}
// Magnifier: 1–6×, wheel zoom, pinch, pan, Esc; all transforms local to dialog.
const viewer=$('#viewer'),stage=$('#viewer-stage'),viewerImg=$('#viewer-image'),viewerContent=$('#viewer-content');let zoom=1,dx=0,dy=0,pointers=new Map(),drag=null,pinchLast=0;
function transform(){viewerContent.style.transform=`translate(${dx}px,${dy}px) scale(${zoom})`}
function resetZoom(){zoom=1;dx=0;dy=0;transform()}
function openViewer(id,preserveZoom=false){const q=byId[id];if(!q)return;const alreadyOpen=viewer.open;state.viewerId=id;viewerImg.src=q.image;$('#viewer-label').textContent=q.id+' · 显微图片';$('#viewer-focus').outerHTML=focusHtml(q)||'<span id="viewer-focus" class="image-focus hidden" aria-hidden="true"></span>';
 // Keep a stable reference after replacing the marker node.
 const currentFocus=$('#viewer-content .image-focus');if(currentFocus)currentFocus.id='viewer-focus';
 const toggle=$('#viewer-focus-toggle');toggle.hidden=!q.focusMark;toggle.setAttribute('aria-pressed',String(focusVisible));toggle.textContent=focusVisible?'隐藏定位环':'显示定位环';
 if(!preserveZoom)resetZoom();if(!alreadyOpen){viewer.showModal();$('#viewer-close').focus()}}
function closeViewer(){viewer.close();viewerImg.src='';pointers.clear();drag=null;if(state.view==='quiz')renderQuiz()}
function adjustZoom(delta){zoom=Math.max(1,Math.min(6,zoom*delta));if(zoom===1){dx=0;dy=0}transform()}
$('#viewer-focus-toggle').addEventListener('click',()=>{focusVisible=!focusVisible;if(state.viewerId)openViewer(state.viewerId,true)});
$('#viewer-close').addEventListener('click',closeViewer);
viewer.addEventListener('click',e=>{if(e.target===viewer)closeViewer()});
viewer.addEventListener('cancel',e=>{e.preventDefault();closeViewer()});
stage.addEventListener('wheel',e=>{e.preventDefault();adjustZoom(e.deltaY<0?1.18:1/1.18)},{passive:false});
stage.addEventListener('pointerdown',e=>{e.preventDefault();stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){drag={x:e.clientX,y:e.clientY}}else pinchLast=0});
stage.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const [a,b]=[...pointers.values()],dist=Math.hypot(a.x-b.x,a.y-b.y);if(pinchLast)adjustZoom(dist/pinchLast);pinchLast=dist;}else if(pointers.size===1&&zoom>1){dx+=e.clientX-old.x;dy+=e.clientY-old.y;transform()}});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(ev,e=>{pointers.delete(e.pointerId);pinchLast=0;drag=null});
$$('[data-zoom]').forEach(el=>el.addEventListener('click',()=>{const a=el.dataset.zoom;if(a==='reset')resetZoom();else adjustZoom(a==='plus'?1.35:1/1.35)}));
window.addEventListener('storage',e=>{if(e.key===THEME){document.documentElement.dataset.theme=e.newValue==='dark'?'dark':'light';themeSync()}});
// Events delegated to survive re-renders.
document.addEventListener('click',e=>{
 const mode=e.target.closest('[data-mode]');if(mode){state.mode=mode.dataset.mode;renderHome();return}
 const group=e.target.closest('[data-group]');if(group){const v=group.dataset.group;state.groups.has(v)?state.groups.delete(v):state.groups.add(v);renderHome();return}
 const type=e.target.closest('[data-type]');if(type){const v=type.dataset.type;state.types.has(v)?state.types.delete(v):state.types.add(v);renderHome();return}
 const view=e.target.closest('[data-view]');if(view){setView(view.dataset.view);if(view.dataset.focusFilter==='review'){state.bankReview='review';renderBank()}return}
 const action=e.target.closest('[data-action]');if(action){handleAction(action.dataset.action,action);return}
 const close=e.target.closest('[data-close]');if(close){$('#'+close.dataset.close).close();return}
});
document.addEventListener('input',e=>{if(e.target.id==='answer-input'&&state.view==='quiz'&&state.session&&!state.session.answers.some(a=>a.id===current()?.id)){state.session.draftInput=e.target.value.slice(0,200);store.active=state.session;save()}else if(e.target.id==='bank-search'){const focus=e.target.selectionStart;state.bankQuery=e.target.value;state.bankShown=36;renderBank();const input=$('#bank-search');input.focus({preventScroll:true});input.setSelectionRange(focus,focus)}});
document.addEventListener('change',e=>{if(e.target.id==='count-select'){state.size=Number(e.target.value);renderHome()}else if(e.target.id==='bank-group'){state.bankGroup=e.target.value;state.bankShown=36;renderBank()}else if(e.target.id==='bank-review'){state.bankReview=e.target.value;state.bankShown=36;renderBank()}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&state.view==='quiz'&&e.target.id==='answer-input'){e.preventDefault();if(state.session.answers.some(x=>x.id===current().id))next();else submit()}else if(e.key==='Escape'&&$('#shell').classList.contains('menu-open')){$('#shell').classList.remove('menu-open')}});
$('#start-btn').addEventListener('click',()=>startRound());$('#theme-btn').addEventListener('click',setTheme);$('#help-btn').addEventListener('click',()=>$('#help-dialog').showModal());$('#save-flag').addEventListener('click',saveFlag);
$('#menu-btn').addEventListener('click',()=>$('#shell').classList.toggle('menu-open'));$('#scrim').addEventListener('click',()=>$('#shell').classList.remove('menu-open'));
applyIcons();themeSync();setView('home');
// Introspection for deterministic, local test harness — not a remote endpoint.
window.LUMEN_IMAGE_TEST={BANK,check,norm,eligiblePool,choose,currentStats,getStore:()=>store,getState:()=>state,go:setView,start:startRound,submit,next,normalizeProgress};
})();