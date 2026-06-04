# 폴더 구조화 및 소스 파일 리팩토링 완료 보고서

루트 디렉토리에 혼잡하게 분산되어 있던 CSS, JS, 가이드 HTML, 그리고 모든 HTML 진입 페이지 파일들을 모던 웹 프로젝트 표준인 `src/` 폴더 하위로 완전히 격리했습니다.

---

## 🛠️ 주요 변경 사항 요약

### 1. 자산(Asset) 및 소스 파일의 `src/` 폴더 격리
*   **소스 파일 격리**: 메인 HTML 진입점들과 `css/`, `js/`, `guides/` 폴더를 모두 `src/` 하위로 이동시켰습니다.
    *   `src/index.html`, `src/login.html` 등 9개 HTML 파일
    *   `src/css/`
    *   `src/js/`
    *   `src/guides/`
*   **데이터베이스 설정 SQL 파일 (1개)** ➔ `supabase/` 폴더로 이동
*   **로컬 간이 서버 스크립트 (1개)** ➔ `server/` 폴더로 이동

### 2. Vite 빌드 환경 및 리소스 설정 최적화
*   [vite.config.ts](file:///c:/Users/panth/Documents/%EB%B0%94%EC%9D%B4%EB%B8%8C%20%EC%BD%94%EB%94%A9/%ED%95%99%EA%B5%90%EB%AC%B8%EC%84%9C/vite.config.ts)를 모던 프로젝트 규격에 맞춰 다음과 같이 재설정했습니다:
    *   `root: 'src'`: Vite가 `src/`를 프로젝트 기본 루트로 간주하여 구동하도록 설정했습니다.
    *   `envDir: '../'`: 환경 변수 파일(`.env`)을 기존처럼 저장소 루트에서 안전하게 관리할 수 있도록 경로를 부모 디렉토리로 지정했습니다.
    *   `publicDir: '../public'`: 이미지 및 정적 자산이 들어있는 `public/` 디렉토리를 기존 그대로 유지할 수 있도록 맵핑했습니다.
    *   `build.outDir: '../dist'` & `build.emptyOutDir: true`: 빌드 출력물이 루트의 `dist/` 폴더로 나오도록 하여 Netlify 웹 배포 경로가 영향 받지 않도록 구성했습니다.

### 3. 로컬 서버 스크립트 (`server.js`) 최적화
*   HTML 파일들이 `src/` 폴더로 이동함에 따라 로컬 간이 서버도 `src/` 경로의 자산들을 정상적으로 서빙하도록 `ROOT = path.join(__dirname, '..', 'src')`로 변경 완료했습니다.

---

## ⚡ 깃허브 반영 완료
*   `git commit`과 `git push`를 통해 원격 저장소(`moodoocoding/docu`)의 `master` 브랜치에 최종 반영 완료했습니다. 이제 깃허브 메인은 오직 설정 파일들과 주요 폴더만 노출되어 최적의 깔끔함을 보여줍니다.
