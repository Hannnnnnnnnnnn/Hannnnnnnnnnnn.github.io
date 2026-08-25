# Portfolio

정적 HTML/CSS. 빌드 스텝 없음 — 파일을 그대로 GitHub Pages가 서빙한다.
Static HTML/CSS, no build step.

## 구조 / Structure

    index.html    홈 — 소개 + 프로젝트 카드
    about.html    About me
    work-1.html   프로젝트 상세 (Problem / Approach / Result)
    work-2.html
    work-3.html
    style.css     전부 여기. :root 토큰만 바꾸면 톤이 바뀐다

## 로컬 확인 / Preview

    open index.html            # 그냥 열면 됨
    python3 -m http.server     # 상대경로까지 실서버처럼 볼 때

## 배포 / Deploy

Settings → Pages → Deploy from a branch → `main` / `/ (root)`.
