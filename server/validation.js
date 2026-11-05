export function playlistId(value){try{const u=new URL(value);return u.protocol==='https:'&&['youtube.com','www.youtube.com','music.youtube.com','m.youtube.com'].includes(u.hostname)&&/^[\w-]{10,150}$/.test(u.searchParams.get('list')||'')?u.searchParams.get('list'):null}catch{return null}}
export function validateCatalog(c){
 if(!c||!Array.isArray(c.editions)||!c.editions.length||c.editions.length>120)throw Error('회차 자료를 확인해주세요.');
 const ids=new Set();const editions=c.editions.map(e=>{
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(e.id)||ids.has(e.id))throw Error('회차 연월이 중복되거나 올바르지 않아요.');ids.add(e.id);
  const clean={id:e.id};
  for(const k of ['title','subtitle','playlistUrl','pdf','reviewUrl','songUrl','reviewStart','reviewEnd','songStart','songEnd','color']){if(typeof e[k]!=='string'||e[k].length>2000)throw Error('입력 내용을 확인해주세요.');clean[k]=e[k]}
  if(!e.title.trim()||e.title.length>100||e.subtitle.length>300||!/^#[0-9a-f]{6}$/i.test(e.color))throw Error('제목·소개·표지 색상을 확인해주세요.');
  for(const k of ['published','demo']){if(typeof e[k]!=='boolean')throw Error('공개 설정을 확인해주세요.');clean[k]=e[k]}
  if(e.playlistUrl&&!playlistId(e.playlistUrl))throw Error('유튜브 플레이리스트 링크를 확인해주세요.');
  for(const k of ['reviewUrl','songUrl'])if(e[k]){let u;try{u=new URL(e[k])}catch{}if(!u||u.protocol!=='https:'||u.username||u.password)throw Error('폼 링크는 https:// 주소를 입력해주세요.')}
  const uploaded=/^\/media\/[a-f0-9-]+\.(pdf|jpg|png|webp)$/;const sample=/^\/assets\/images\/samples\/[\w-]+\.svg$/;
  if(e.pdf&&(!uploaded.test(e.pdf)||!e.pdf.endsWith('.pdf')))throw Error('PDF를 다시 등록해주세요.');
  if(!Array.isArray(e.images)||e.images.length>40||e.images.some(x=>typeof x!=='string'||(!uploaded.test(x)&&!sample.test(x))||x.endsWith('.pdf')))throw Error('이미지 등록 내용을 확인해주세요.');clean.images=[...e.images];
  for(const [s,t] of [[e.reviewStart,e.reviewEnd],[e.songStart,e.songEnd]])if(!!s!==!!t||(s&&(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t)||!Number.isFinite(Date.parse(s+'+09:00'))||!Number.isFinite(Date.parse(t+'+09:00'))||Date.parse(s+'+09:00')>=Date.parse(t+'+09:00'))))throw Error('접수 시작과 마감 시간을 확인해주세요.');
  return clean;
 });
 if(!ids.has(c.currentId))throw Error('이번 달 회차가 필요해요.');return {currentId:c.currentId,editions};
}
