# Portfolio

`https://hannnnnnnnnnnn.github.io/`

정적 HTML/CSS/JS. 빌드 스텝도 라이브러리도 없다 — GitHub Pages가 루트를 그대로 서빙한다.
Static HTML/CSS/JS, no build step, no libraries.

## 구조 / Structure

    index.html          홈 — 히어로 + 작업 행 리스트
    about.html          About
    work-1..3.html      프로젝트 상세 (Problem / Approach / Result)
    style.css           전부 여기. :root 토큰이 재디자인 지점
    main.js             모션 3종 (스크롤 리빌 / 낱자 등장 / 커서 블롭)
    CLAUDE.md           작업 규칙·함정
    docs/session-logs/  세션별 기록

## 로컬 미리보기 / Preview

    python3 -m http.server 8765     # http://127.0.0.1:8765/
    pkill -f "http.server 8765"

## 배포 / Deploy

`main`에 push하면 끝. 확인은 [`CLAUDE.md`](./CLAUDE.md) "배포" 절 참고 —
초록색 push는 배포 완료가 아니다.
