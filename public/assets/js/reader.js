import {API} from './config.js';
import {$,$$,esc,request,playlistId,nextMonth,monthLabel,cover} from './shared.js';
let catalog, selectedId, activeEdition, mode = 'slides', page = 0, zoom = false, touchX;

// 월별 정보는 서버에서 가져옵니다. 화면 문구/레이아웃은 index.html 또는 아래 템플릿을 수정하세요.
async function load() {
  try { catalog = await request(API.catalog); render(); $('#loading').hidden = true; $('#content').hidden = false; }
  catch (error) { $('#loading').textContent = error.message; }
}
function render() {
  const current = catalog.editions.find(e => e.id === catalog.currentId);
  const past = catalog.editions.filter(e => e.id < catalog.currentId).sort((a,b)=>b.id.localeCompare(a.id));
  const selected = past.find(e => e.id === selectedId) || past[0];
  $('#issue').textContent = catalog.currentId.replace('-',' · ');
  const id = playlistId(current?.playlistUrl);
  $('#player').style.backgroundColor = current?.color || '#53604b';
  $('#player').innerHTML = id ? `<iframe title="이번 달 유튜브 플레이리스트" src="https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(id)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>` : `<div class="art-caption">${esc(catalog.currentId.replace('-','.'))}<span>LISTENING SESSION</span></div><div class="vinyl" aria-hidden="true"><span>여운<small>AFTER THE TRACK</small></span></div><div class="art-foot">TURN THE MOMENT INTO MUSIC.</div>`;
  $('#current-title').textContent = current?.title || '이번 달의 음악을 준비하고 있어요.';
  $('#current-description').textContent = current?.subtitle || '플레이리스트가 등록되면 이곳에서 들을 수 있어요.';
  $('#current-demo').hidden = !current?.demo;
  $('#playlist-link').innerHTML = id ? `<a class="button dark" href="${esc(current.playlistUrl)}" target="_blank" rel="noopener noreferrer">▶ YouTube에서 플레이리스트 열기 ↗</a>` : '<div class="pending">♫ 플레이리스트 링크를 기다리고 있어요.</div>';
  $('#latest').innerHTML = selected ? `<div class="edition-select"><span class="muted">감상집 꺼내보기</span><select aria-label="감상집 월 선택" id="month-select">${past.map(e=>`<option value="${esc(e.id)}" ${e.id===selected.id?'selected':''}>${monthLabel(e.id)}${e.demo?' · 예시':''}</option>`).join('')}</select></div><button class="cover-button" data-open="${selected.id}" aria-label="${esc(selected.title)} 감상집 열기">${cover(selected)}</button><div class="latest-caption"><p>${esc(selected.subtitle)}</p><span class="muted">${selected.demo?'예시 감상집 · ':''}${selected.images.length}장의 기록</span></div><div class="reader-actions"><button class="button" data-open="${selected.id}" data-mode="pdf">▤ PDF 보기</button><button class="button dark" data-open="${selected.id}" data-mode="slides">▧ 슬라이드 보기</button></div>` : '<div class="empty-book"><h3>첫 감상집을 기다리고 있어요.</h3><p>발행된 기록이 이곳에 쌓여요.</p></div>';
  $('#month-select')?.addEventListener('change', e=>{selectedId=e.target.value;render()});
  $('#archive-list').innerHTML = past.map(e=>`<article class="archive-item"><button class="cover-button" data-open="${e.id}" aria-label="${esc(e.title)} 감상집 열기">${cover(e,true)}</button><div class="archive-item-info"><h3>${monthLabel(e.id)}${e.demo?'<span class="demo-label">예시</span>':''}</h3><p>${esc(e.subtitle)}</p><div class="archive-links">${playlistId(e.playlistUrl)?`<a href="${esc(e.playlistUrl)}" target="_blank" rel="noopener noreferrer">▶ 플리 듣기 ↗</a>`:'<span class="muted">플리 링크 준비 중</span>'}<button data-open="${e.id}">감상집 읽기 →</button></div></div></article>`).join('') || '<p class="muted">아직 발행된 지난 감상집이 없어요.</p>';
  renderSubmissions();
}
function renderSubmissions() {
  if (!catalog) return;
  const current = catalog.editions.find(e=>e.id===catalog.currentId);
  const next = catalog.editions.find(e=>e.id===nextMonth(catalog.currentId));
  $('#submissions').innerHTML = [[current,'review','이번 달 감상평 제출'],[next,'song','다음 달 노래 제출']].map(([e,key,title])=>{
    const start=e?.[key+'Start'], end=e?.[key+'End'], url=e?.[key+'Url'];
    const now=Date.now(), state=!start||!end?'unset':now<Date.parse(start+'+09:00')?'upcoming':now>Date.parse(end+'+09:00')?'closed':'open';
    const label={unset:'일정 준비 중',upcoming:'접수 예정',closed:'접수 마감',open:url?'접수 중':'링크 준비 중'}[state];
    const fmt=v=>v.slice(5,10).replace('-','.')+' '+v.slice(11);
    return `<div class="submission ${state==='open'&&url?'is-open':''}"><div class="submission-icon">${key==='review'?'▤':'♫'}</div><div><div class="submission-title">${title}<span class="pill">${label}</span></div><p>${start?fmt(start)+' — '+fmt(end)+' KST':'접수 일정이 정해지면 이곳에 안내해요.'}</p></div>${state==='open'&&url?`<a class="button dark compact" href="${esc(url)}" target="_blank" rel="noopener noreferrer">제출하기 ↗</a>`:'<span class="quiet-arrow">→</span>'}</div>`;
  }).join('');
}
function openViewer(id, requestedMode = 'slides') {
  activeEdition = catalog.editions.find(e=>e.id===id);
  if(!activeEdition) return;
  page=0; zoom=false; mode=requestedMode;
  $('#viewer-title').textContent=activeEdition.title.replace(/\n/g,' ');
  $('#viewer-month').textContent=activeEdition.id.replace('-','.')+' / LISTENING BOOK'+(activeEdition.demo?' · 예시 감상집':'');
  renderViewer(); $('#viewer').showModal();
}
function renderViewer() {
  const e=activeEdition;
  $$('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===mode));
  $('#pdf-download').hidden=mode!=='pdf'||!e.pdf;
  if(e.pdf) $('#pdf-download').href=e.pdf;
  $('#viewer-body').innerHTML=mode==='pdf'?(e.pdf?`<iframe class="pdf-frame" title="감상집 PDF" src="${esc(e.pdf)}"></iframe>`:'<div class="viewer-empty"><h3>PDF가 아직 등록되지 않았어요.</h3><p>이미지 슬라이드로 먼저 읽어보세요.</p></div>'):e.images.length?`<div class="slide-stage ${zoom?'zoomed':''}" id="slide-stage"><img id="slide-image" src="${esc(e.images[page])}" alt="${e.id} 감상집 ${page+1}페이지"></div><div class="slide-controls"><button class="icon-button" data-move="-1" aria-label="이전 이미지" ${e.images.length<2?'disabled':''}>❮</button><span aria-live="polite">${page+1} <span class="muted">/ ${e.images.length}</span></span><button class="icon-button" data-move="1" aria-label="다음 이미지" ${e.images.length<2?'disabled':''}>❯</button><button class="button compact" id="zoom">${zoom?'축소':'확대'}</button></div>`:'<div class="viewer-empty"><h3>이미지 감상집을 준비 중이에요.</h3><p>등록된 PDF가 있다면 PDF 보기로 읽어보세요.</p></div>';
  $('#slide-image')?.addEventListener('click',()=>{zoom=!zoom;renderViewer()});
  $('#zoom')?.addEventListener('click',()=>{zoom=!zoom;renderViewer()});
  $('#slide-stage')?.addEventListener('touchstart',e=>touchX=e.touches[0].clientX,{passive:true});
  $('#slide-stage')?.addEventListener('touchend',e=>{const delta=e.changedTouches[0].clientX-touchX;if(!zoom&&Math.abs(delta)>45)move(delta<0?1:-1)},{passive:true});
}
function move(delta){if(mode!=='slides'||!activeEdition?.images.length)return;page=(page+delta+activeEdition.images.length)%activeEdition.images.length;zoom=false;renderViewer()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(b)openViewer(b.dataset.open,b.dataset.mode||'slides')});
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.view;renderViewer()}));
$('#viewer').addEventListener('click',e=>{if(e.target===$('#viewer'))$('#viewer').close();const b=e.target.closest('[data-move]');if(b)move(Number(b.dataset.move))});
$('#viewer-close').addEventListener('click',()=>$('#viewer').close());
$('#viewer').addEventListener('keydown',e=>{if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1)});
window.addEventListener('focus',load);
setInterval(renderSubmissions,30000);
load();
