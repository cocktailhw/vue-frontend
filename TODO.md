# TODO — 시정 포털 프론트엔드

작업 상태 추적 문서입니다. 완료된 항목과 예정 작업을 구분합니다.

---

## 완료된 작업

### 기반 설정
- [x] Vue 3 + Vite + Pinia + Vue Router 프로젝트 구성
- [x] Tailwind CSS v4 적용
- [x] Axios 공통 클라이언트 (`withCredentials`, 로딩/에러 인터셉터)
- [x] 런타임 `env-config.js` + `config/env.js` 환경 헬퍼
- [x] 글로벌 로딩 / 토스트 UI (`stores/ui.js`)

### 홈·공지 UI
- [x] `HomeView` 공지 테이블 + 자주 찾는 민원 그리드
- [x] 공공 포털형 UI 정리 (플로트 애니메이션·파스텔 뱃지 제거)
- [x] 게시판 탭·검색·서버 페이징 (`PagedModel` 파서)
- [x] API 실패 시 폴백 공지 데이터

### 인증·권한
- [x] HttpOnly 쿠키 세션 (Bearer/localStorage 제거)
- [x] 모달 기반 로그인 / 회원가입 (`AuthModal`)
- [x] 관리자 로그인 모달 + `/v1/auth/me` 세션 복원
- [x] `isAdmin` / `currentUser` Pinia 상태

### 공지 CRUD·파일
- [x] 관리자 공지 작성/수정/삭제 (`FormData`)
- [x] 첨부파일 업로드·다운로드
- [x] 상세/목록 모달 연동

### 배포·인프라
- [x] Docker multi-stage 빌드 + Nginx 서빙
- [x] `/api` 프록시 및 SPA `try_files`
- [x] Swagger UI / OpenAPI 프록시 + Basic Auth (`htpasswd`)
- [x] `entrypoint.sh`로 upstream·env·htpasswd 주입

### 라우팅
- [x] 다중 페이지 라우트 분리 (`/`, `/notices`, `/minwon`, `/mypage`, `/admin`)
- [x] Header GNB `router-link` 연동
- [x] 로그인 시 마이페이지 / 관리자 시 대시보드 링크
- [x] `requiresAuth` / `requiresAdmin` 네비게이션 가드
- [x] `/admin` 별도 레이아웃 껍데기

### 문서
- [x] `README.md` / `TODO.md` 작성

---

## 진행 중 / 예정된 작업

### Placeholder View 실구현
- [ ] `NoticeListView` (`/notices`) — 전체 공지 목록 UI·페이징·상세 연동
- [ ] `MinwonGuideView` (`/minwon`) — 종합 민원 안내·카테고리·절차 UI
- [ ] `MyPageView` (`/mypage`) — 프로필·세션 정보·비밀번호 변경 등
- [ ] `AdminDashboardView` (`/admin`) — 백오피스 대시보드·공지 관리 화면 이전/확장

### API·기능 확장
- [ ] 민원 실 API 연동 (현재 퀵메뉴는 정적 + 테스트 모달/`alert`)
- [ ] 공지 외 게시판 유형(보도/고시 등) 전용 목록·필터 UX 고도화
- [ ] 검색 결과를 홈 스크롤이 아닌 전용 결과 페이지로 분리할지 검토
- [ ] 로그아웃 시 로그인/회원가입 버튼 숨김 또는 로그아웃 메뉴로 UX 정리
- [ ] 보호 라우트 거부 시 홈 이동 대신 로그인 모달 유도

### 품질·운영
- [ ] `PROJECT_STATUS.md` / `CHANGELOG.md` / `AGENTS.md` 필요 시 추가
- [ ] 단위·컴포넌트 테스트 도입 여부 검토
- [ ] E2E(로그인·CRUD·가드) 스모크 시나리오 정리
- [ ] (선택) `.devcontainer` 구성 — 현재는 Dockerfile 중심

### 보류 / 하지 않음 (현 범위)
- [ ] 외부 공개 배포·실서비스 보안 하드닝
- [ ] GitHub 등 원격 저장소 기본 연동 (로컬 Git 우선)

---

## 참고

- API·실행·환경변수 상세: [README.md](./README.md)
- 민원 연동·Placeholder UI는 **한 번에 여러 화면을 동시에 붙이지 않고**, 화면 단위로 진행하는 것을 권장합니다.
