import { $, $$, esc, monthLabel, nextMonth, editionNavItem, refreshMonthMarquees } from './shared.js';

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
  $('#month-list').innerHTML = catalog.editions.slice().sort((a, b) => b.id.localeCompare(a.id)).map(item => editionNavItem(item, selected)).join('');
  refreshMonthMarquees($('#month-list'));
  $$('[data-field]').forEach(input => {
    if (input.type === 'checkbox') input.checked = edition[input.dataset.field];
    else input.value = edition[input.dataset.field] ?? '';
  });
  $('#make-current').checked = catalog.currentId === selected;
  $('#make-current').disabled = true;
  $('#current-hint').textContent = `현재 지정: ${monthLabel(catalog.currentId)}`;
  const nextId = nextMonth(selected);
  const next = catalog.editions.find(item => item.id === nextId);
  $('#schedule-pair').textContent = `${monthLabel(selected)} 감상평 + ${monthLabel(nextId)} 신청곡`;
  $('#schedule-review-title').textContent = `${monthLabel(selected)} 감상평 접수`;
  $('#schedule-song-title').textContent = `${monthLabel(nextId)} 신청곡 접수`;
  $('#next-month-missing').hidden = !!next;
  $('#next-month-fields').hidden = !next;
  $('#next-month-missing-text').textContent = `${monthLabel(nextId)} 회차가 검수본에 없어요.`;
  $('#create-next').hidden = true;
  $('#next-published-label').textContent = `${monthLabel(nextId)} 회차 공개하기`;
  $$('[data-next-field]').forEach(input => { input.value = next?.[input.dataset.nextField] ?? ''; input.readOnly = true; });
  $('#next-published').checked = !!next?.published;
  $('#next-published').disabled = true;
  $('#art-status').innerHTML = edition.artImage
    ? `<div class="art-preview"><img src="${esc(assetUrl(edition.artImage))}" alt="등록한 플레이리스트 자켓"><div><strong>자켓 사진 등록됨</strong></div></div>`
    : '<button class="upload-zone" disabled><strong>자켓 사진 선택</strong><span>로컬 관리자에서 등록해주세요.</span></button>';
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
window.addEventListener('resize', () => refreshMonthMarquees($('#month-list')));

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
