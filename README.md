# 행복특별시 포털 프론트엔드

가상 공공기관 포털 **「행복특별시 행복시청」** 의 Vue 3 CSR(클라이언트 사이드 렌더링) 프론트엔드입니다.  
시정 공지·민원 안내 UI, 쿠키 기반 로그인, 관리자 공지 CRUD, Nginx 배포를 포함합니다.

> 본 프로젝트는 **로컬/개인 테스트용**입니다. 실제 공공기관·대외 배포를 전제로 하지 않습니다.

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Vue 3 (`<script setup>`) |
| 빌드 | Vite 6 |
| 상태관리 | Pinia |
| 라우팅 | Vue Router 4 |
| HTTP | Axios (`withCredentials` / HttpOnly 쿠키 세션) |
| 스타일 | Tailwind CSS v4 (`@tailwindcss/vite`) |
| 아이콘 | lucide-vue-next |
| 배포 | Docker multi-stage + Nginx Alpine |

현재 버전: `0.4.0` (`package.json`)

---

## 폴더 구조

```
vue-frontend/
├── public/
│   └── env-config.js          # 런타임 공개 환경값 (컨테이너 기동 시 덮어씀)
├── src/
│   ├── assets/                # 전역 스타일 보조
│   ├── components/            # UI 컴포넌트·모달
│   │   ├── layout/            # Header, Footer, DefaultLayout, Loading/Toast
│   │   ├── AuthModal.vue      # 로그인/회원가입
│   │   ├── AdminLoginModal.vue
│   │   ├── NoticeDetailModal.vue / NoticeFormModal.vue
│   │   ├── MinwonDetailModal.vue
│   │   └── SitemapModal.vue
│   ├── config/env.js          # window._env_ 기반 API/환경 헬퍼
│   ├── data/                  # 폴백 공지·민원 퀵링크 정적 데이터
│   ├── router/index.js        # 라우트·네비게이션 가드
│   ├── stores/
│   │   ├── portal.js          # 공지·인증·GNB·검색
│   │   └── ui.js              # 글로벌 로딩·토스트
│   ├── utils/                 # http, pagedModel, file
│   ├── views/
│   │   ├── HomeView.vue       # 홈 (게시판 + 자주 찾는 민원)
│   │   ├── board/NoticeListView.vue
│   │   ├── minwon/MinwonGuideView.vue
│   │   ├── user/MyPageView.vue
│   │   └── admin/AdminDashboardView.vue
│   ├── App.vue
│   └── main.js
├── Dockerfile
├── entrypoint.sh              # env-config 생성, upstream 치환, Swagger htpasswd
├── nginx.conf.template
├── .env.development / .env.production
├── package.json
├── README.md
└── TODO.md
```

---

## 주요 라우트

| 경로 | 이름 | 레이아웃 | 접근 | 설명 |
|------|------|----------|------|------|
| `/` | `home` | DefaultLayout (헤더/푸터) | 공개 | 홈: 공지 테이블 + 자주 찾는 민원 |
| `/notices` | `notices` | DefaultLayout | 공개 | 전체 공지사항 (현재 Placeholder) |
| `/minwon` | `minwon` | DefaultLayout | 공개 | 종합 민원 안내 (현재 Placeholder) |
| `/mypage` | `mypage` | DefaultLayout | `requiresAuth` | 마이페이지 (현재 Placeholder) |
| `/admin` | `admin` | **별도** 백오피스 셸 | `requiresAuth` + `requiresAdmin` | 관리자 대시보드 (현재 Placeholder) |

- GNB: 민원안내 → `/minwon`, 시정소식·정보공개·시민참여 → `/notices`, 시청안내 → `/`
- 로그인 시 상단 **마이페이지**, 관리자일 때 **관리자 대시보드** 링크 노출
- 보호 라우트 진입 전 `GET /v1/auth/me`로 세션을 확인하며, 미충족 시 홈으로 이동합니다

---

## API 연동 현황

Axios 베이스 URL은 기본 `/api`입니다. Vite 개발 서버는 `/api`를 `http://localhost:8080`으로 프록시합니다.  
인증은 **HttpOnly 쿠키** (`withCredentials: true`)이며, Bearer 토큰을 쓰지 않습니다.

| 구분 | 메서드 | 경로 | 용도 |
|------|--------|------|------|
| 인증 | `POST` | `/v1/auth/login` | 로그인 |
| 인증 | `POST` | `/v1/auth/signup` | 회원가입 |
| 인증 | `POST` | `/v1/auth/logout` | 로그아웃 |
| 인증 | `GET` | `/v1/auth/me` | 세션·권한 복원 |
| 포털 | `GET` | `/v1/portal` | 공지 목록 (페이징·카테고리·키워드) |
| 포털 | `POST` | `/v1/portal` | 공지 등록 (`FormData`: JSON `data` + 선택 `file`) |
| 포털 | `PUT` | `/v1/portal/{id}` | 공지 수정 |
| 포털 | `DELETE` | `/v1/portal/{id}` | 공지 삭제 |
| 파일 | `GET` | `/v1/portal/files/download/{storedFileName}` | 첨부 다운로드 |

목록 API 실패·빈 응답 시 `src/data/fallbackNotices.js` 폴백을 사용합니다.  
민원 퀵메뉴는 아직 실 API 없이 정적 데이터 + 모달(테스트용)입니다.

---

## 실행 방법

### 1) 로컬 개발 (Vite)

백엔드가 `localhost:8080`에서 동작 중이어야 `/api` 프록시가 정상 동작합니다.

```bash
npm install
npm run dev
```

기타 스크립트:

```bash
npm run build          # 기본 빌드
npm run build:dev      # development 모드 빌드
npm run build:prd      # production 모드 빌드
npm run preview        # 빌드 결과 미리보기
```

### 2) Docker / Nginx

```bash
docker build -t vue-frontend .
docker run --rm -p 80:80 \
  -e APP_ENV=PRODUCTION \
  -e API_BASE_URL=/api \
  -e BACKEND_UPSTREAM=http://backend:8080 \
  -e SWAGGER_USER=your-user \
  -e SWAGGER_PASSWORD=your-password \
  vue-frontend
```

- SPA 라우팅: Nginx `try_files` → `index.html`
- `/api/`, `/swagger-ui/`, `/v3/api-docs` → `BACKEND_UPSTREAM` 프록시
- Swagger UI·OpenAPI는 **Basic Auth** (`SWAGGER_USER` / `SWAGGER_PASSWORD`)

> 컨테이너에 `apache2-utils`(htpasswd)가 포함되어 있습니다. 이미지 변경 후 **Rebuild**가 필요합니다.

---

## 환경변수 세팅 가이드

### 빌드 타임 (Vite) — `.env.development` / `.env.production`

| 변수 | 예시 | 설명 |
|------|------|------|
| `VITE_APP_ENV` | `DEVELOPMENT` / `PRODUCTION` | 빌드 모드 라벨 |
| `VITE_API_BASE_URL` | `/api` | Axios 폴백 베이스 (런타임 `_env_` 우선) |

민감정보(비밀번호·토큰)를 `.env*`에 넣지 마세요.

### 런타임 (브라우저) — `public/env-config.js` / `window._env_`

컨테이너 `entrypoint.sh`가 기동 시 `env-config.js`를 생성합니다.

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `APP_ENV` | `PRODUCTION` | DEV/PRD 배지 등 |
| `API_BASE_URL` | `/api` | 프론트 API 베이스 |

### 런타임 (Nginx 컨테이너, 서버 전용)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `BACKEND_UPSTREAM` | `http://backend:8080` | `/api`·Swagger 프록시 대상 |
| `SWAGGER_USER` | (없음) | Swagger Basic Auth 사용자 |
| `SWAGGER_PASSWORD` | (없음) | Swagger Basic Auth 비밀번호 |

`SWAGGER_*` 미설정 시 Swagger 경로는 유효 계정이 없어 사실상 잠깁니다.  
이 값들은 **커밋하지 말고** Docker/`-e` 또는 Secret으로만 주입하세요.

---

## 주요 기능 요약

- 홈 공지 게시판 (탭·검색·서버 페이징, 공공 포털형 UI)
- 자주 찾는 민원 퀵메뉴 (정적)
- 모달 기반 로그인/회원가입·관리자 로그인
- 관리자 공지 작성/수정/삭제 및 첨부 업로드·다운로드
- 글로벌 로딩·토스트 (`stores/ui.js`)
- 다중 라우트 + 인증/관리자 네비게이션 가드

상세 진행 현황은 [TODO.md](./TODO.md)를 참고하세요.
