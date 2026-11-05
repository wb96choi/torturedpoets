/** API 경로 설정. HTML/CSS/JS는 빌드 없이 그대로 서비스됩니다. */
export const API = Object.freeze({
  catalog: '/api/catalog',
  adminCatalog: '/api/admin/catalog',
  upload: '/api/admin/upload',
  session: '/api/auth/session',
  login: '/api/auth/login',
  kakaoStart: '/api/auth/kakao/start',
  logout: '/api/auth/logout',
});
