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
export function cover(e, small = false) {
  return `<div class="book-cover ${small?'small':''}" style="background-color:${/^#[0-9a-f]{6}$/i.test(e.color)?e.color:'#53604b'}"><div class="book-top">여운 <span>MONTHLY LISTENING BOOK</span></div><div class="book-orbit" aria-hidden="true"></div><h3>${esc(e.title)}</h3><div class="book-bottom"><span>${esc(e.id.replace('-','.'))} / VOL. ${esc(e.id.slice(5))}</span><span>AFTER THE TRACK</span></div></div>`;
}
