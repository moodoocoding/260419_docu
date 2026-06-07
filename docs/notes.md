# Notes

Last updated: 2026-06-07

## Project Snapshot
- Repo: `moodoocoding/docu`
- Stack: Vite + plain HTML/JS/CSS, with all source code fully migrated into the `src/` directory.
- Main app entry: `src/index.html`
- Document editor: `src/create.html` + `src/js/app.js`
- Document archive: `src/history.html` + `src/js/history.js`
- Auth: `src/login.html` + `src/js/auth.js` + `src/js/supabase.js`
- Product requirements: `docs/prd.md`
- Academic calendar work plan: `docs/academic-calendar-work-plan.md`

## What Changed Recently (2026-06-07)
- **프로젝트 폴더 구조 정리 및 최적화 (v1.5.0)**:
  - 루트의 모든 HTML 파일(9개) 및 `css/`, `js/`, `guides/` 폴더를 `src/` 폴더 내부로 마이그레이션하여 저장소 루트를 깔끔하게 정돈했습니다.
  - `vite.config.ts` 파일에 `root: 'src'`, `envDir: '../'`, `publicDir: '../public'` 및 `build.outDir: '../dist'` 설정을 적용하여 배포 및 주소 체계를 그대로 유지했습니다.
  - 데이터베이스 SQL을 `supabase/`로, 로컬 간이 서버 `server.js`를 `server/` 폴더로 격리 및 상대경로 리팩토링했습니다.
- **문서 작성 페이지 중복 UI 렌더링 오류 수정 (v1.5.1)**:
  - `src/create.html` 파일 내부 하단에 잘못 중복 주입되어 어떤 생성창을 열든 무조건 하단에 "에듀파인 작성" 영역이 덧붙여 노출되던 마크업 오류(HTML 중복 블록)를 깔끔하게 제거했습니다.
- **대용량 파일 업로드 413 오류 조치 및 Vercel 최적화 (v1.5.2 - v1.5.3)**:
  - Netlify 관련 설정과 코드를 완전 제거하고 Vercel `/api` 라우트로 서버리스 함수를 단일화했습니다.
  - Vercel 전송 한도(4.5MB)를 초과하지 않도록 클라이언트 단 이미지 자동 압축(Canvas 기반 2048px 이하 리사이즈, JPEG 0.8 품질)을 도입하여 대용량 이미지도 413 에러 없이 전송할 수 있게 개선했습니다. PDF 등의 문서는 4MB 초과 제한을 유지합니다.

## Important Behavior
- Creating a document in `src/js/app.js` saves to Supabase first.
- If Supabase save fails, the app falls back to local storage.
- `src/js/history.js` reads from Supabase `documents` by `user_id`, then falls back to local storage.
- `src/js/auth.js` redirects non-logged-in users to `login.html` except on landing and login pages.

## Auth / Local Dev Notes
- Local login requires these Vite env vars in `.env`:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - optional `VITE_AUTH_REDIRECT_URL`
- For local OAuth testing, Supabase redirect URL should include:
  - `http://localhost:5173/login.html`
- The project currently has no checked-in `.env.local`.

## Dev Server
- Local dev server is run with:
  - `npm.cmd run dev` (PowerShell 실행 권한 우회)
- Vite served the app on port `5173` during the last session.

## Git / Deploy Notes
- Local changes were committed on `master`.
- Pushed to GitHub with commit `fix: Vercel 배포 최적화 및 클라이언트 이미지 자동 압축 기능 도입`.

## Caution
- Do not store GitHub tokens or Supabase secrets in the repo.
- If auth or pushes fail again, check:
  - GitHub credential helper
  - GitHub token scope
  - Supabase env vars
  - redirect URLs in Supabase

## Good Starting Files For Next Time
- `src/index.html`
- `src/create.html`
- `src/js/app.js`
- `vite.config.ts`
- `docs/notes.md`
