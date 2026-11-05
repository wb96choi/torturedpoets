# 여운 — 월간 선곡 모임

VS Code에서 HTML, CSS, JavaScript를 직접 수정할 수 있는 독립 프로젝트입니다.
React, Next.js, TypeScript, 번들러 없이 실행됩니다. 외부 npm 패키지도 필요하지 않습니다.
로컬 프로젝트가 작업 원본입니다. GitHub Pages와 GPT Sites는 각각 검수용·운영용 배포본입니다.

## 작업·검수·배포 원칙

1. **작업:** 이 로컬 저장소에서 화면·기능·콘텐츠를 수정합니다.
2. **검수:** `npm run build:pages`를 실행하고 `docs/`를 GitHub에 푸시합니다. 사용자 화면은 `https://wb96choi.github.io/torturedpoets/`, 관리자 화면은 `https://wb96choi.github.io/torturedpoets/admin/`에서 확인합니다. Pages 관리자 화면은 공개된 회차만 담은 **보기 전용 화면**이며 로그인·저장·업로드는 할 수 없습니다.
3. **운영 배포:** GPT Sites 배포는 사용자가 명시적으로 요청할 때만 진행합니다. GitHub에 푸시해도 GPT Sites는 자동으로 바뀌지 않습니다.

GitHub Pages는 검수 시점의 정적 사본입니다. 로컬 관리자에서 콘텐츠를 바꿔도 위 빌드와 푸시를 다시 하기 전에는 Pages에 반영되지 않습니다.

## 1. 바로 실행

1. Node.js 22 이상을 설치합니다.
2. 이 폴더를 VS Code의 **파일 → 폴더 열기**로 엽니다.
3. VS Code 터미널에서 실행합니다.

```sh
npm start
```

- 사용자·관리자 주소는 터미널에 출력되는 포트를 사용합니다. 기본값은 각각 `http://127.0.0.1:3000/`, `http://127.0.0.1:3000/admin/`입니다. 이 PC의 `.env`는 3001 포트를 사용합니다.

첫 실행 시 `data/catalog.example.json`을 복사해 `data/catalog.json`을 만듭니다.
관리자 화면의 **로컬 미리보기 시작**을 누르면 편집할 수 있습니다.
기본 개발 모드는 내 컴퓨터에서만 접속 가능합니다.

HTML/CSS/JS 수정 후 브라우저를 새로고침하세요. 서버까지 자주 수정할 때는 `npm run dev`를 사용합니다.
`index.html` 더블클릭이나 VS Code Live Server만으로는 저장·업로드 API가 작동하지 않습니다.
반드시 이 Node 서버로 실행하세요.

## 2. 무엇을 어디서 수정하나요?

| 수정할 내용 | 파일 |
|---|---|
| 사용자 메인 화면 구조·고정 문구 | `public/index.html` |
| 관리자 화면 구조·입력 폼 | `public/admin/index.html` |
| 색·폰트·여백·반응형 | `public/assets/css/site.css` |
| 플리 표시·접수 상태·PDF·슬라이드 | `public/assets/js/reader.js` |
| 관리자 로그인·편집·업로드·저장 | `public/assets/js/admin.js` |
| 공통 템플릿·문자 이스케이프 | `public/assets/js/shared.js` |
| 프론트엔드 API 경로 | `public/assets/js/config.js` |
| 로그인·파일 제공·저장 API | `server/index.js` |
| 서버 입력 검증 | `server/validation.js` |
| 초기 샘플 콘텐츠 | `data/catalog.example.json` |
| 실제 저장 콘텐츠 | `data/catalog.json` (첫 실행 시 생성) |
| 실제 업로드 파일 | `uploads/` |
| 샘플 이미지 | `public/assets/images/samples/` |

폰트는 Google Fonts를 이용하고, 인터넷이 없으면 시스템 폰트로 표시됩니다.
UI 아이콘은 문자 기호이므로 외부 아이콘 라이브러리 없이 수정 가능합니다.
반복되는 회차 카드와 이미지 목록은 JS 템플릿 문자열로 생성됩니다.
사이트 루트(`/`)에 배포하는 경로 설정입니다. 하위 폴더 배포는 HTML의 `/assets/`, `config.js` API 경로와 서버 라우트를 함께 수정해야 합니다.

## 3. 관리 순서

1. `/admin/`에서 새 연월 회차를 만듭니다.
2. 제목·소개·유튜브 플레이리스트 링크를 입력합니다.
3. 감상집 PDF와 이미지들을 올리고 이미지 순서를 조정합니다.
4. **접수 일정·링크**에서 감상평/신청곡 기간과 구글폼 링크를 등록합니다.
5. **공개 설정**에서 공개 여부, 이번 달 지정, 예시 표시를 정합니다.
6. **변경 사항 저장**을 누릅니다. 사용자 화면을 새로고침해 확인합니다.

예: 이번 달이 11월이면 11월 회차의 `review*` 설정이 ‘이번 달 감상평 제출’, 12월 회차의 `song*` 설정이 ‘다음 달 노래 제출’에 표시됩니다. 다음 달 회차도 공개해야 홈에서 해당 접수 일정을 읽을 수 있습니다.

- 접수 시각은 한국 시간(KST)입니다. 열린 화면에서도 30초마다 접수 상태를 갱신합니다.
- 기간 안에만 폼 링크 버튼이 표시됩니다. 이미 알고 있는 외부 폼 주소의 접속까지 막지는 않으므로 구글폼 자체의 마감도 설정하세요.
- 플리는 `list=`가 포함된 YouTube 또는 YouTube Music 플레이리스트 링크가 필요합니다. 임베드 제한 콘텐츠는 YouTube 링크로 열어야 합니다.
- PDF 1개, 이미지 최대 40장, 파일당 20MB를 지원합니다.
- 이미지 뷰어: 이전/다음, 좌우 방향키, 모바일 스와이프, 확대/축소.
- PDF는 브라우저 내장 뷰어와 새 창 열기/저장을 사용합니다. PDF 자체를 새로 생성하는 기능은 아닙니다.
- 등록 해제는 콘텐츠 연결만 없앱니다. 업로드 원본 파일을 자동 삭제하지 않습니다.

## 4. 로그인 상태 — 꼭 구분해주세요

이 독립 Node 서버는 다음 세 모드를 제공합니다. 카카오 앱 키와 관리자 ID는 저장소에 들어 있지 않습니다.

- 기본 개발 모드: 비밀번호 없이 로컬 미리보기 가능. 서버는 `127.0.0.1`만 바인딩합니다.
- 비밀번호 모드: `.env`에 `ADMIN_PASSWORD`를 설정하면 로그인 후 관리자 API를 사용할 수 있습니다.
- 카카오 모드: `KAKAO_REST_API_KEY`와 `KAKAO_REDIRECT_URI`를 설정하면 카카오 로그인 버튼이 나타납니다. 비밀번호 로그인은 닫히고, `KAKAO_ADMIN_IDS`의 사용자만 관리자 권한을 얻습니다.

로컬에서 카카오 로그인을 연결하려면 카카오디벨로퍼스에서 카카오 로그인 사용을 켜고, REST API 키의 리다이렉트 URI에 `http://127.0.0.1:3000/api/auth/kakao/callback`을 등록하세요. 클라이언트 시크릿이 켜져 있다면 그 값도 필요합니다. `.env.example`을 `.env`로 복사해 다음 값을 채웁니다.

```dotenv
KAKAO_REST_API_KEY=발급받은_REST_API_키
KAKAO_CLIENT_SECRET=발급받은_클라이언트_시크릿
KAKAO_REDIRECT_URI=http://127.0.0.1:3000/api/auth/kakao/callback
KAKAO_ADMIN_IDS=관리자_카카오_앱_사용자_ID
PUBLIC_ORIGIN=http://127.0.0.1:3000
```

카카오 사용자 ID를 모르면 `KAKAO_ADMIN_IDS`를 비워 둔 채 한 번 로그인하세요. 권한이 거절된 화면에 본인의 앱 사용자 ID가 표시됩니다. 그 숫자만 `.env`의 `KAKAO_ADMIN_IDS`에 넣고 서버를 다시 시작하세요. ID가 비어 있으면 관리자 권한을 주지 않습니다. 여러 관리자는 쉼표로 구분합니다.

비밀번호 모드로 운영할 때는 다음 항목을 설정하세요. 카카오 모드로 운영한다면 비밀번호 대신 카카오 항목과 실제 HTTPS 콜백 주소를 설정합니다.

```dotenv
NODE_ENV=production
ADMIN_PASSWORD=여기에-16자-이상의-임의-비밀번호를-직접-설정
HOST=0.0.0.0
PORT=3000
PUBLIC_ORIGIN=https://실제-서비스-도메인
```

운영 환경은 HTTPS 리버스 프록시 뒤에서 실행해야 합니다. 운영 쿠키는 Secure/HttpOnly/SameSite 속성을 사용합니다.
`.env`는 Git/ZIP 공유 대상이 아니며 브라우저 JS에 비밀번호를 넣으면 안 됩니다.
세션은 메모리 저장이라 서버 재시작 시 로그아웃됩니다.
카카오 콜백은 일회용 `state` 쿠키를 검증한 뒤 서버에서 토큰과 앱 사용자 ID를 확인합니다. 허용된 ID에만 기존 관리자 세션을 발급합니다.

## 5. 저장·배포 조건

이 버전은 **디스크가 유지되는 단일 Node 서버**용입니다. `data/`와 `uploads/`를 영속 볼륨에 두고 백업하세요.
설정으로 `DATA_DIR`, `UPLOAD_DIR`에 절대 경로를 지정할 수도 있습니다.
Vercel 같은 임시 파일시스템/서버리스에 그대로 올리면 수정한 데이터가 유지되지 않습니다. 그런 환경에서는 DB와 오브젝트 저장소로 서버 부분을 교체해야 합니다.
동시 관리자 저장 충돌은 버전 비교로 방지하고 파일 저장은 원자적으로 교체하지만, 여러 서버 인스턴스 동시 실행은 지원하지 않습니다.
기존 배포본의 실제 등록 데이터는 자동 이관하지 않았습니다. ZIP에는 예시 회차만 포함됩니다.

## 6. 경로/API

| 경로 | 역할 |
|---|---|
| `/` | 사용자 화면 |
| `/admin/` | 관리자 화면 |
| `GET /api/catalog` | 공개된 회차 조회 |
| `GET /api/auth/session` | 현재 로그인 상태 |
| `POST /api/auth/login` | 개발/비밀번호 로그인 |
| `GET /api/auth/kakao/start` | 카카오 로그인 시작 |
| `GET /api/auth/kakao/callback` | 카카오 인증 콜백 |
| `POST /api/auth/logout` | 로그아웃 |
| `GET /api/admin/catalog` | 전체 회차 조회 (관리자) |
| `PUT /api/admin/catalog` | 회차 저장 (관리자) |
| `POST /api/admin/upload` | PDF·이미지 업로드 (관리자, base64 JSON) |
| `/media/파일ID.확장자` | 업로드 파일, 비공개 회차는 관리자만 열람 |

## 7. 검사·GitHub Pages

```sh
npm run check
npm test
```

GitHub 저장소는 [wb96choi/torturedpoets](https://github.com/wb96choi/torturedpoets)입니다. 검수용 정적 파일을 생성합니다.

```sh
npm run build:pages
```

`docs/`에 공개된 회차와 업로드 파일의 사본, 보기 전용 관리자 화면이 생성됩니다. GitHub 저장소의 **Settings → Pages → Build and deployment**는 **Deploy from a branch**, **main**, **/docs**로 설정되어 있습니다. 생성 후 `git add docs && git commit -m "Update Pages preview" && git push`로 갱신합니다. Pages에서 관리자 편집·카카오 로그인은 제공하지 않습니다.
