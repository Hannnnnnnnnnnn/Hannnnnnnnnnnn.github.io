# Portfolio Site — Project Context

`Hannnnnnnnnnnn.github.io` — 개인 포트폴리오. 정적 HTML/CSS/JS, **빌드 스텝 없음**.
GitHub Pages가 저장소 루트를 그대로 서빙한다. 페이지 5개 (홈 / About / 프로젝트 3).

## 계정 구조 — 소유자와 푸시 신원이 다르다 (제일 헷갈리는 부분)

이 저장소는 **`Hannnnnnnnnnnn`이 소유**하고, 작업은 **`Han-Atacz` 자격증명으로 푸시**한다.
둘 다 같은 사람 계정이지만 역할이 다르다.

| | 계정 | 근거 |
|---|---|---|
| 저장소 owner | `Hannnnnnnnnnnn` | 포트폴리오는 그 계정 프로필에 떠야 함 |
| 푸시 자격증명 | `Han-Atacz` (collaborator, write) | 이 머신 키체인에 이미 있는 것 |
| 커밋 author | `Hannnnnnnnnnnn` | 잔디가 포트폴리오 계정에 찍혀야 함 |

**GitHub은 "누가 push했는지"가 아니라 커밋의 author 이메일로 기여를 귀속시킨다.** 그래서
이 저장소만 local git 신원을 덮어쓴다 (global은 `Han-Atacz / han.kim@atacz.com`이고
건드리지 않는다):

    git config user.name  Hannnnnnnnnnnn
    git config user.email 48038953+Hannnnnnnnnnnn@users.noreply.github.com

새 머신에서 클론하면 이 두 줄을 **반드시 다시** 해야 한다. 안 하면 회사 계정으로 커밋이
찍히고, 이미 푸시된 뒤엔 되돌리기가 번거롭다. 확인:
`git log -1 --format='%an <%ae>'` 와 `gh api repos/<owner>/<repo>/commits --jq '.[0].author.login'`
(후자가 `null`이면 어느 계정에도 귀속되지 않은 것).

- **개인 계정 저장소에는 collaborator admin 등급이 없다.** write가 유일하고, private이면
  read-only조차 불가. 그래서 Pages 설정·공개범위 변경·저장소 이름 변경은 이 세션에서
  못 하고 owner가 직접 해야 한다. 세분화된 권한이 필요하면 Organization을 만드는 수밖에 없다.
- 로컬 클론 경로는 `~/P` (저장소 이름 변경 전 이름). git은 경로에 무관하니 그대로 둬도 된다.

## 배포 — push가 곧 배포, 단 성공한다는 보장은 없다

`main`에 push하면 GitHub Pages가 빌드해서 `https://hannnnnnnnnnnn.github.io/`에 반영된다.
중간 단계도 워크플로도 없다. 되돌리려면 revert 후 push.

**`.nojekyll`은 지우지 마라 — 배포가 성립하는 이유다.** 이 파일이 없을 때
**빌드가 3연속 실패**했고(`296f1f3`, `7124a3e`, `d47ce9a`), 그동안 라이브는 조용히 옛
버전을 계속 서빙했다. 이 저장소는 Jekyll을 전혀 쓰지 않으므로(front matter 없음,
Liquid 없음, 밑줄 파일 없음) 그 빌드 단계는 실패 지점만 만드는 부채였다.
`.nojekyll`을 넣자 같은 트리가 바로 빌드됐다.

**실패한 빌드는 아무것도 알려주지 않는다.** `error.message`는 `"Page build failed."`
한 줄이고 `duration`은 `0`이다. API에 더 이상의 정보가 없으니, Jekyll을 정말 도입해야
한다면 로컬에서 재현하는 수밖에 없다.

**초록색 push는 배포 완료가 아니다.** 실제로 이 저장소에서 push 결과만 보고 "라이브
반영됨"이라고 보고했다가 틀렸다 — 그때 라이브는 두 커밋 전 버전이었다. 순서:

1. 빌드 상태를 **묻는다** (폴링 루프로 기다리지 말고) —
   `gh api repos/Hannnnnnnnnnnn/Hannnnnnnnnnnn.github.io/pages/builds --jq '.[] | "\(.commit[0:7])\t\(.status)\t\(.duration)"'`
   성공한 빌드는 40초 안팎(`dur≈40000`)이 걸린다. `dur=0`이면 시작도 못 한 실패다.
2. 실제 파일을 받아 **로컬과 바이트 대조**한다. 바이트가 다르면 배포가 안 된 것이다.
3. 신·구 버전을 구분하는 **마커**로 확인한다 (예: 신 `class="display"` / 구 `class="cards"`).
   "status 200"은 옛 버전을 받았을 때도 나온다.

## 검증 — 조용히 거짓말하는 것들 (전부 이 저장소에서 실제로 당함)

1. **`curl`이 `status=000`이면 사이트가 죽은 게 아니라 셸의 `CURL_CA_BUNDLE`이 깨진 것.**
   `~/.zshrc`에 없는 파일을 가리키는 값이 남아 있고, 오래된 세션은 그 값을 상속한다.
   항상 `env -u CURL_CA_BUNDLE curl ...`로 우회하고, `status`와 `bytes`를 같이 출력해라.
2. **404 페이지는 약 9KB짜리 HTML이고 grep을 통과한다.** 아직 배포되지 않은 파일을 받으면
   `main.js`가 9378바이트로 돌아오는데(로컬은 4114) 마커 grep은 그냥 0을 반환한다.
   "0 matches → 코드가 없다"가 아니라 "애초에 그 파일을 받지 않았다"이다.
   **바이트 수를 먼저 대조하고, 알려진 마커가 있는지 확인한 뒤에** 결론을 내라.
3. **브라우저 자동화 탭은 `visibilityState: 'hidden'`이라 CSS 트랜지션·애니메이션·rAF가
   돌지 않는다.** `is-in` 클래스는 붙었는데 `getComputedStyle`의 opacity는 계속 0으로 읽힌다 —
   코드는 멀쩡한데 고장난 것처럼 보인다. 최종 상태를 보려면 강제 종료:
   `document.querySelectorAll('*').forEach(el => el.getAnimations().forEach(a => a.finish()))`
4. **렌더된 스크린샷이 최종 판정이다.** `mix-blend-mode` 같은 합성 효과는 computed style로
   확인이 안 된다. 화면을 찍어서 봐라.
5. **검사기가 통과했다고 검사한 게 아니다.** 안전망을 넣었으면 일부러 던져서 발동하는 것을
   확인해라 (`run(() => { throw new Error('test') })` → `html.js`가 떨어지고 콘텐츠가 보이는지).
6. **상관관계를 원인이라고 부르지 마라 — 이 저장소에서 5번째 데이터가 4번째까지를
   뒤집었다.** Pages 빌드 실패를 조사하다 "소유자가 트리거한 빌드만 성공하고
   collaborator가 푸시한 건 전부 0ms로 실패"라는 완벽한 상관을 4건에서 찾아 원인으로
   단정했다. 바로 다음 빌드가 collaborator 푸시로 성공하면서 가설이 무너졌다.
   진짜 원인은 Jekyll 처리 단계였다. 표본이 적을 때 "결정적"이라는 말을 쓰지 말 것.


## 코딩 컨벤션

- **라이브러리 없음, 빌드 스텝 없음.** 프레임워크·번들러·전처리기 전부 도입하지 않는다.
  참조로 삼은 사이트(noth.in)는 같은 효과에 GSAP + Three.js + Lenis 752KB를 쓰지만,
  여기서는 vanilla로 체감의 대부분을 낸다. 새 의존성은 vanilla로 안 되는 게 **입증된 뒤에만**.
- **주석은 한국어와 영어 둘 다** 쓴다.
- **CSS에 `!important` 금지.** 선택자 특정성으로 해결한다.
- 디자인 토큰은 `style.css`의 `:root` 블록 하나에 모은다. 톤을 바꾸는 작업이 다른 파일로
  번지면 잘못 만든 것이다.
- 접근성: 시맨틱 HTML, 키보드 도달 가능, `prefers-reduced-motion`에서 모션 전부 끄기,
  낱자 span에는 `aria-hidden` + 부모에 `aria-label`.

## 이 코드베이스의 함정 (겪은 순서대로)

- **CSS가 숨기고 JS가 되돌리는 구조는 JS가 죽으면 백지가 된다.** `html.js` 클래스가 붙으면
  리빌 대상이 `opacity: 0`이 되고, `main.js`가 `is-in`을 붙여 되돌린다. 그래서 `main.js`의
  모든 기능은 `run()`으로 감싸고, 예외가 나면 `html.js`를 제거해 숨김 규칙을 통째로
  무효화한다. **이 안전망 없이 리빌 코드를 추가하지 마라.**
- **최상위에서 던지면 그 아래 전부 죽는다.** 실제로 문자열에 없는 `.keys()`를 부르는 한 줄
  때문에 스크롤 리빌과 커서 블롭이 통째로 실행되지 않았다. 증상은 "일부 기능만 안 됨"이라
  원인을 엉뚱한 데서 찾게 된다. 독립적인 기능은 독립적으로 감싼다.
- **지연 초기화는 `setTimeout`으로, `requestAnimationFrame`으로 하지 마라.** rAF는
  백그라운드 탭에서 발화하지 않는다 — 폴백이 필요한 바로 그 상황에서 폴백이 안 도는 것이다.
- **IntersectionObserver 단독에 보이는 콘텐츠를 걸지 마라.** 숨은 탭은 콜백을 주지 않아
  `opacity: 0`인 요소가 영구히 안 보인다. `getBoundingClientRect` 스윕과
  `visibilitychange` 재확인을 같이 둔다.
- **`overflow: hidden`을 `body`나 `html`에 걸면 `position: sticky`가 죽는다.** 히어로
  타이포를 뷰포트 밖으로 흘리려고 걸 때는 `.hero`에만 건다.
- **`:has()`로 커서 블롭 크기를 바꾼다** (`body:has(.row:hover) .cursor-blob`). JS를 더
  쓰지 않고 호버 상태를 문서 밖 요소에 전달하는 방법.

## 구조

    index.html    홈 — 히어로 + 작업 행 리스트
    about.html    About
    work-1..3.html 프로젝트 상세 (Problem / Approach / Result)
    style.css     전부 여기. :root 토큰이 재디자인 지점
    main.js       모션 3종. 라이브러리 없음
    docs/session-logs/  세션별 작업 기록

## 로컬 미리보기

    cd ~/P && python3 -m http.server 8765     # http://127.0.0.1:8765/
    pkill -f "http.server 8765"               # 종료

`open index.html`(file://)도 되지만, 상대경로와 스크립트 로딩을 실제와 같게 보려면
서버로 띄우는 편이 낫다.
