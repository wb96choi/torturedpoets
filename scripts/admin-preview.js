import { $, $$, esc, monthLabel } from './shared.js';

const siteRoot = new URL('../../', import.meta.url);
const assetUrl = value => new URL(value.replace(/^\.\//, ''), siteRoot).href;
let catalog;
let selected;

function render() {
  const edition = catalog.editions.find(item => item.id === selected);
  if (!edition) return;
  $('#edition-heading').textContent = `${monthLabel(selected)}의 기록`;
  $('#summary-title').textContent = edition.title.replace(/\n/g, ' ');
  $('#summary-state').textContent = edition.published ? '사용자에게 공개' : '비공개 초안';
  $('#save-state').textContent = '화면 검수용';
  $('#month-list').innerHTML = catalog.editions.slice().sort((a, b) => b.id.localeCompare(a.id)).map(item =>
    `<button data-month="${esc(item.id)}" class="${item.id === selected ? 'active' : ''}"><span>${monthLabel(item.id)}${catalog.currentId === item.id ? ' · 이번 달' : ''}</span><span class="status-dot">${item.published ? '공개' : '비공개'}</span></button>`
  ).join('');
  $$('[data-field]').forEach(input => {
    if (input.type === 'checkbox') input.checked = edition[input.dataset.field];
    else input.value = edition[input.dataset.field] ?? '';
  });
  $('#make-current').checked = catalog.currentId === selected;
  $('#make-current').disabled = true;
  $('#current-hint').textContent = `현재 지정: ${monthLabel(catalog.currentId)}`;
  $('#pdf-status').innerHTML = edition.pdf
    ? `<div class="registered-file"><span>▤</span><div><strong>감상집 PDF 등록됨</strong><a href="${esc(assetUrl(edition.pdf))}" target="_blank" rel="noopener noreferrer">파일 확인 ↗</a></div></div>`
    : '<button class="upload-zone" disabled><strong>PDF 파일 선택</strong><span>PDF · 최대 20MB</span></button>';
  $('#image-count').textContent = `${edition.images.length} / 40`;
  $('#image-list').innerHTML = edition.images.map((url, index) =>
    `<div class="image-tile"><img src="${esc(assetUrl(url))}" alt="감상집 ${index + 1}페이지"><div><span>${index + 1}</span><button class="icon-button" disabled>↑</button><button class="icon-button" disabled>↓</button><button class="icon-button" disabled>✕</button></div></div>`
  ).join('');
  $$('[data-field]').forEach(input => {
    input.readOnly = true;
    if (input.type === 'checkbox' || input.type === 'color') input.disabled = true;
  });
}

$$('[data-tab]').forEach(button => {
  button.id = `tab-${button.dataset.tab}`;
  $(`#panel-${button.dataset.tab}`).setAttribute('aria-labelledby', button.id);
  button.setAttribute('aria-selected', String(button.classList.contains('active')));
  button.addEventListener('click', () => {
    $$('[data-tab]').forEach(tab => {
      tab.classList.toggle('active', tab === button);
      tab.setAttribute('aria-selected', String(tab === button));
    });
    $$('[role=tabpanel]').forEach(panel => panel.hidden = panel.id !== `panel-${button.dataset.tab}`);
  });
});
$('#month-list').addEventListener('click', event => {
  const button = event.target.closest('[data-month]');
  if (button) {
    selected = button.dataset.month;
    render();
  }
});

try {
  const response = await fetch(new URL('../../catalog.json', import.meta.url), { cache: 'no-store' });
  if (!response.ok) throw Error('카탈로그를 불러오지 못했어요.');
  catalog = await response.json();
  selected = catalog.editions.some(item => item.id === catalog.currentId) ? catalog.currentId : catalog.editions[0]?.id;
  $('#login-screen').hidden = true;
  $('#admin-app').hidden = false;
  $('#auth-label').textContent = 'GitHub Pages · 보기 전용';
  $('#logout').hidden = true;
  $('#toggle-add').hidden = true;
  $('#add-images').disabled = true;
  $('#feedback').hidden = false;
  $('#feedback').textContent = '화면 검수용입니다. 변경 사항은 로컬 사이트에서 수정한 뒤 GitHub Pages를 갱신해주세요.';
  if (selected) render();
  else $('#feedback').textContent = '공개된 회차가 없어 관리자 화면의 내용 미리보기를 표시할 수 없어요.';
} catch (error) {
  $('#login-screen').hidden = false;
  $('#login-description').textContent = error.message;
  $('#login-form').hidden = true;
}
