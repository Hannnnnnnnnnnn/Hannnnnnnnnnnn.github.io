# 2026-08-26 — 저장소 개설, 스캐폴드, A/B 디자인 패스

## 한 줄 요약

포트폴리오 저장소를 개설해 `https://hannnnnnnnnnnn.github.io/`로 띄우고, 정적 5페이지
스캐폴드 → 디스플레이 타이포 리스타일(A) → 모션(B)까지 세 번 배포했다.

## 배경 — 계정 두 개를 어떻게 엮을지

시작 질문은 "다른 GitHub 계정과 이 레포를 연결할 수 있나"였다. 세 가지 해석이 있었고
(협업자 초대 / 저장소 이전 / 로그인 전환) 처음엔 업무 저장소 `Han-Atacz/atacz-theme`에
`Hannnnnnnnnnnn`을 write로 초대했다. 그 뒤 포트폴리오는 별도 저장소가 낫다는 결론이 나서
방향이 바뀌었다.

**결정적이었던 사실: 개인 계정 저장소에는 collaborator admin 등급이 없다.** 처음에
"admin으로 초대"를 선택지로 제시한 것은 조직 저장소 기준이었고 틀렸다. GitHub 문서:

> "Repositories owned by personal accounts have a single owner who has full control."
> "Collaborators on a personal repository can pull (read) ... and push (write)."

private 저장소에서는 read-only조차 불가. 그래서 "권한을 준다"가 아니라 **"소유권을 어디에
두느냐"**가 진짜 질문이었다. 포트폴리오는 그 계정 프로필에 떠야 하므로 `Hannnnnnnnnnnn`이
소유하고, 이 머신은 collaborator(write)로 붙는 구조로 갔다.

## 최종 구성

- 저장소: `Hannnnnnnnnnnn/Hannnnnnnnnnnn.github.io` (public)
- 사이트: https://hannnnnnnnnnnn.github.io/ — user site라 서브패스 없이 루트
- 로컬: `~/P` (이름 변경 전 경로. git은 무관하므로 유지)
- 푸시: `Han-Atacz` 키체인 자격증명 / 커밋 author: `Hannnnnnnnnnnn` (local git 신원 덮어씀)
- custom domain: **불필요**. 기본 도메인 + 자동 HTTPS로 충분

`gh api .../commits --jq '.[0].author.login'`이 `Hannnnnnnnnnnn`을 반환하는 것으로
기여 귀속을 확인했다 — 푸시 신원과 무관하게 author 이메일 기준으로 붙는다.

## 커밋

| sha | 내용 |
|---|---|
| `c2b20ae` | 정적 5페이지 스캐폴드 |
| `296f1f3` | A 패스 — 디스플레이 타이포 + 에디토리얼 행 리스트 |
| `7124a3e` | B 패스 — 스크롤 리빌 / 낱자 등장 / 커서 블롭 |
| `d47ce9a` | CLAUDE.md + 세션 로그 |
| `44b60dd` | `.nojekyll` — 실제로 배포를 성립시킨 커밋 |

## 참조 사이트 분석 (noth.in)

"이런 느낌 가능하냐"는 질문에 소스를 팠다. 결론: **호스팅은 전혀 문제 없고(전부 정적),
따라 만들 가치가 있는지가 문제.**

- 거대 타이포는 텍스트가 아니라 인라인 SVG (`nothin-hero-svg`), 글자 하나가 `<path>` 하나
- Webflow로 만들었지만 인터랙션은 Webflow 기능이 아님 (`data-w-id` 0개) — 직접 짠 코드
- 애니메이션은 별도 번들 `nothinv1.netlify.app/main.js`, **752KB**,
  GSAP + ScrollTrigger + Three.js + Lenis
- 호버 효과의 정체: `mask-reveal-canvas`를 만들어 마우스 좌표를 추적하고 ping-pong FBO로
  **셰이더 유체 시뮬레이션**을 돌려, base(흰 면)를 걷어내고 reveal(뒤의 배경 영상)을 드러냄
- 로딩 후 등장은 path들을 `Math.random()`으로 섞어 `yPercent: 120 → 0`, stagger 0.07
- 991px 이하에서는 호버 전부 비활성 — 터치에는 대체 상태가 필요하다는 뜻
- 영상은 GitHub이 아니라 BunnyCDN에 별도 호스팅 (대역폭 회피)

따라가지 않기로 하고, `mix-blend-mode: difference` 커서 블롭으로 "지나가면 반전된다"는
인상을 라이브러리 0개로 냈다.

## 하드하게 배운 것

### 1. CSS가 숨기고 JS가 되돌리는 구조는 백지 리스크다

리빌 구현이 `html.js` 클래스로 `opacity: 0`을 걸고 `main.js`가 `is-in`으로 되돌리는
형태였다. 그런데 `main.js`가 **첫 줄에서 던져** 아무것도 실행되지 않았다.

원인은 사소했다 — `text.keys()`. 문자열에는 `.keys()`가 없다(Array에만 있음). 하지만
**증상은 사소하지 않았다**: 최상위에서 던졌으므로 그 아래 스크롤 리빌과 커서 블롭까지
통째로 죽었고, 페이지는 히어로만 남고 나머지가 안 보이는 상태가 됐다.

두 가지를 고쳤다:
- 기능마다 `run()`으로 격리 — 하나가 죽어도 나머지는 산다
- 예외 시 `html.js`를 제거 — 숨김 규칙이 전부 무효화되어 콘텐츠가 그냥 보인다

그리고 **안전망이 실제로 발동하는지 증명**했다. 일부러 던지고 `is-in` 없는 요소의
computed opacity가 1인지 확인 — 통과. 발동을 확인하지 않은 안전망은 안전망이 아니다.

### 2. 숨은 탭에서는 트랜지션이 흐르지 않아 멀쩡한 코드가 고장나 보인다

`is-in` 클래스는 전부 붙었는데 `getComputedStyle(cap).opacity`가 계속 `0`이었다.
자동화 탭이 `visibilityState: 'hidden'`이라 트랜지션이 진행되지 않은 것.
`getAnimations().forEach(a => a.finish())`로 강제 종료시키니 전부 `1`.
**클래스 상태와 computed 값이 어긋나면 먼저 탭 가시성을 의심할 것.**

### 3. 404 페이지가 grep을 통과한다

배포 확인차 라이브 `main.js`를 받아 마커를 grep했더니 0. "배포 실패"로 읽히지만,
받은 건 **9378바이트짜리 404 HTML**이었다(로컬은 4114). `main.js`는 그 커밋에서 새로
추가된 파일이라 빌드가 끝나기 전엔 존재하지 않았던 것.
바이트 수를 먼저 대조했다면 즉시 알았다. `pages/builds`의 `status`가 `building`인지
묻는 게 폴링보다 정확하다.

### 4. 세 번의 배포가 조용히 실패하고 있었다 (그리고 나는 성공했다고 보고했다)

A 패스를 푸시한 뒤 "라이브 반영됐어"라고 보고했다. **틀렸다.** push는 성공했지만 Pages
빌드가 실패했고, 라이브는 계속 첫 스캐폴드를 서빙하고 있었다. B 패스도, 문서 커밋도
같은 식으로 실패했다 — 3연속. 아무도 알려주지 않았다.

들킨 경위도 우연에 가까웠다. 배포 확인차 라이브 `main.js`를 받아 마커를 grep했는데 0이
나왔고, 그게 "아직 파일이 없다"는 신호였다. 바이트 수를 봤더니 9378(로컬 4114) — 받은 건
404 페이지였다.

    commit    pusher           dur       status
    c2b20ae   Hannnnnnnnnnnn   38485ms   built
    296f1f3   Han-Atacz            0ms   errored
    7124a3e   Han-Atacz            0ms   errored
    d47ce9a   Han-Atacz            0ms   errored
    44b60dd   Han-Atacz        40363ms   built     ← .nojekyll 추가

**여기서 한 번 크게 틀렸다.** 위 표의 앞 4줄만 보고 "소유자가 트리거한 빌드만 성공한다"는
가설을 세웠고, 상관이 완벽했기 때문에 "결정적 패턴"이라고 단언했다. 그 직후 5번째 줄이
collaborator 푸시로 성공하며 가설을 무너뜨렸다. 진짜 원인은 pusher가 아니라 **Jekyll 처리
단계**였고, `.nojekyll` 하나로 해결됐다.

이 저장소는 Jekyll을 전혀 쓰지 않는다 — front matter도, Liquid도, 밑줄 파일도 없다.
그런데도 Pages는 기본으로 Jekyll을 돌리고 있었고, 그 단계가 실패 지점만 제공했다.
실패한 빌드의 `error.message`는 `"Page build failed."` 한 줄, `duration`은 `0`.
API가 주는 정보는 그게 전부라 정확히 무엇이 Jekyll을 넘어뜨렸는지는 끝내 특정하지 못했다.
`.nojekyll`이 그 질문 자체를 없앴으므로 더 파지 않았다.

남길 규칙 세 가지:
- **`.nojekyll`을 지우지 마라.** 장식이 아니라 배포가 성립하는 이유다.
- **push 성공 ≠ 배포 성공.** `pages/builds`의 `status`와 `duration`을 읽고, 라이브 파일을
  받아 로컬과 바이트 대조하고, 신·구 마커로 확인한 뒤에 "반영됐다"고 말할 것.
  성공한 빌드는 40초쯤 걸린다. `dur=0`은 시작도 못 한 실패다.
- **표본 4개짜리 완벽한 상관을 "결정적"이라고 부르지 마라.**

### 5. 그 밖

- `overflow: hidden`을 body/html에 걸면 sticky 헤더가 죽는다 → `.hero`에만
- 지연 초기화는 rAF가 아니라 `setTimeout` (rAF는 백그라운드 탭에서 발화 안 함)
- IO 단독에 보이는 콘텐츠를 걸지 않는다 → rect 스윕 + `visibilitychange` 재확인
- `curl status=000`은 상속된 깨진 `CURL_CA_BUNDLE`. `env -u`로 우회
- 브라우저에 `...github.io.git`을 넣으면 저장소 페이지로 간다. 사이트 주소는
  `github.com`이 들어가지 않는 쪽

## 남은 것

- 콘텐츠가 전부 플레이스홀더 — 실제 프로젝트 2~3개로 채우기
- 프로젝트 스크린샷/이미지 (용량 주의: Pages 저장소 1GB, 대역폭 월 100GB)
- 폰트: 현재 시스템 그로테스크. 웹폰트로 갈지 결정 (`--grot` 한 줄)
- C 패스(프리로더) 여부
