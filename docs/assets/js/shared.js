/** 화면 공통 함수. API 주소를 바꾸려면 config.js만 수정하세요. */
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function request(url, options = {}) {
  const response = await fetch(url, {cache: 'no-store', ...options});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '요청을 처리하지 못했어요.');
  return result;
}
export function playlistId(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && ['youtube.com','www.youtube.com','music.youtube.com','m.youtube.com'].includes(u.hostname) && /^[\w-]{10,150}$/.test(u.searchParams.get('list') || '') ? u.searchParams.get('list') : null; } catch { return null; }
}
export function nextMonth(id) { const [y,m] = id.split('-').map(Number); return m === 12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,'0')}`; }
export const monthLabel = id => `${id.slice(0,4)}년 ${Number(id.slice(5))}월`;
export function editionNavItem(e, selectedId) {
  const hasReview = Boolean(e.images?.length);
  const title = e.title.replace(/\s+/g, ' ').trim();
  const reviewLabel = hasReview ? '감상평 있음' : '감상평 없음';
  const label = monthLabel(e.id)+' - '+title;
  return `<button data-month="${esc(e.id)}" class="${e.id===selectedId?'active':''}" title="${esc(label)}"><span class="month-entry-date">${esc(monthLabel(e.id))} -</span><span class="month-entry-title"><span class="month-entry-text">${esc(title)}</span></span><span class="review-state ${hasReview?'has-review':'no-review'}" role="img" aria-label="${reviewLabel}" title="${reviewLabel}"></span></button>`;
}
export function refreshMonthMarquees(root = document) {
  $$('.month-entry-title', root).forEach(box => {
    const text = $('.month-entry-text', box);
    box.classList.remove('is-scrolling');
    const overflow = text.scrollWidth - box.clientWidth;
    if (overflow > 2) {
      box.style.setProperty('--scroll-distance', `${-overflow}px`);
      box.classList.add('is-scrolling');
    }
  });
}
export function cover(e, small = false) {
  const first = e.images?.[0];
  return first ? `<img class="book-preview" src="${esc(first)}" alt="${esc(e.title.replace(/\n/g,' '))} 첫 페이지" ${small?'loading="lazy"':''}>` : '<div class="book-preview-empty">등록된 감상집 이미지가 없어요.</div>';
}
