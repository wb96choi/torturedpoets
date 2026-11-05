import {API} from './config.js';
import {$,$$,esc,request,playlistId,nextMonth,monthLabel,cover} from './shared.js';
let catalog, selectedId, activeEdition, page = 0, zoom = false, touchX;

// 월별 정보는 서버에서 가져옵니다. 화면 문구/레이아웃은 index.html 또는 아래 템플릿을 수정하세요.
async function load() {
  try { const next = await request(API.catalog); if(JSON.stringify(next)!==JSON.stringify(catalog)){catalog=next;render()} $('#loading').hidden = true; $('#content').hidden = false; }
  catch (error) { $('#loading').textContent = error.message; }
}
function render() {
  const current = catalog.editions.find(e => e.id === catalog.currentId);
  const past = catalog.editions.filter(e => e.id < catalog.currentId).sort((a,b)=>b.id.localeCompare(a.id));
  const selected = past.find(e => e.id === selectedId) || past[0];
  $('#issue').textContent = catalog.currentId.replace('-',' · ');
  const id = playlistId(current?.playlistUrl);
  $('#player').style.backgroundColor = current?.color || '#53604b';
  const art = current?.artImage ? `<img class="art-photo" src="${esc(current.artImage)}" alt="${esc(current.title.replace(/\n/g,' '))} 플레이리스트 자켓"><div class="art-overlay"><span class="art-date">${esc(catalog.currentId.replace('-','.'))} · LISTENING SESSION</span>${current.artCaption?`<span class="art-note">${esc(current.artCaption)}</span>`:''}${id?'<span class="art-open">▶ YouTube에서 듣기 ↗</span>':''}</div>` : `<div class="art-plain"><span>${esc(catalog.currentId.replace('-','.'))}</span><strong>LISTENING SESSION</strong>${id?'<span>▶ YouTube에서 듣기 ↗</span>':''}</div>`;
  $('#player').innerHTML = id ? `<a class="art-link" href="${esc(current.playlistUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(current.title.replace(/\n/g,' '))} YouTube 플레이리스트 열기">${art}</a>` : `<div class="art-link">${art}</div>`;
  $('#current-title').textContent = current?.title || '이번 달의 음악을 준비하고 있어요.';
  $('#current-description').textContent = current?.subtitle || '플레이리스트가 등록되면 YouTube에서 들을 수 있어요.';
  $('#current-demo').hidden = !current?.demo;
  $('#playlist-link').innerHTML = id ? `<a class="button dark" href="${esc(current.playlistUrl)}" target="_blank" rel="noopener noreferrer">▶ YouTube에서 플레이리스트 열기 ↗</a>` : '<div class="pending">♫ 플레이리스트 링크를 기다리고 있어요.</div>';
  $('#latest').innerHTML = selected ? `<div class="edition-select"><span class="muted">감상집 꺼내보기</span><select aria-label="감상집 월 선택" id="month-select">${past.map(e=>`<option value="${esc(e.id)}" ${e.id===selected.id?'selected':''}>${monthLabel(e.id)}${e.demo?' · 예시':''}</option>`).join('')}</select></div><button class="cover-button" data-open="${selected.id}" aria-label="${esc(selected.title)} 감상집 열기">${cover(selected)}</button><div class="latest-caption"><p>${esc(selected.subtitle)}</p><span class="muted">${selected.demo?'예시 감상집 · ':''}${selected.images.length}장의 기록</span></div><div class="reader-actions"><button class="button dark" data-open="${selected.id}">▧ 이미지 감상집 보기</button></div>` : '<div class="empty-book"><h3>첫 감상집을 기다리고 있어요.</h3><p>발행된 기록이 이곳에 쌓여요.</p></div>';
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
function openViewer(id) {
  activeEdition = catalog.editions.find(e=>e.id===id);
  if(!activeEdition) return;
  page=0; zoom=false;
  $('#viewer-title').textContent=activeEdition.title.replace(/\n/g,' ');
  $('#viewer-month').textContent=activeEdition.id.replace('-','.')+' / LISTENING BOOK'+(activeEdition.demo?' · 예시 감상집':'');
  renderViewer(); $('#viewer').showModal();
}
function renderViewer() {
  const e=activeEdition;
  $('#viewer-body').innerHTML=e.images.length?`<div class="slide-stage ${zoom?'zoomed':''}" id="slide-stage"><img id="slide-image" src="${esc(e.images[page])}" alt="${e.id} 감상집 ${page+1}페이지"></div><div class="slide-controls"><button class="icon-button" data-move="-1" aria-label="이전 이미지" ${e.images.length<2?'disabled':''}>❮</button><span aria-live="polite">${page+1} <span class="muted">/ ${e.images.length}</span></span><button class="icon-button" data-move="1" aria-label="다음 이미지" ${e.images.length<2?'disabled':''}>❯</button><button class="button compact" id="zoom">${zoom?'축소':'확대'}</button></div>`:'<div class="viewer-empty"><h3>이미지 감상집을 준비 중이에요.</h3><p>관리자 화면에서 이미지를 올려주세요.</p></div>';
  $('#slide-image')?.addEventListener('click',()=>{zoom=!zoom;renderViewer()});
  $('#zoom')?.addEventListener('click',()=>{zoom=!zoom;renderViewer()});
  $('#slide-stage')?.addEventListener('touchstart',e=>touchX=e.touches[0].clientX,{passive:true});
  $('#slide-stage')?.addEventListener('touchend',e=>{const delta=e.changedTouches[0].clientX-touchX;if(!zoom&&Math.abs(delta)>45)move(delta<0?1:-1)},{passive:true});
}
function move(delta){if(!activeEdition?.images.length)return;page=(page+delta+activeEdition.images.length)%activeEdition.images.length;zoom=false;renderViewer()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(b)openViewer(b.dataset.open)});
$('#viewer').addEventListener('click',e=>{if(e.target===$('#viewer'))$('#viewer').close();const b=e.target.closest('[data-move]');if(b)move(Number(b.dataset.move))});
$('#viewer-close').addEventListener('click',()=>$('#viewer').close());
$('#viewer').addEventListener('keydown',e=>{if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1)});
window.addEventListener('focus',load);
setInterval(renderSubmissions,30000);
load();
