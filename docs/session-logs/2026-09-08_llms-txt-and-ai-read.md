# 2026-09-08 — `/llms.txt` + 푸터 "Read with Claude / ChatGPT"

작업 지시서: `~/Downloads/AI-READ-TASK.md` (자기완결형). 이 로그는 그 문서의
Step 1 검증 결과와, 문서가 예측하지 못한 것들을 남긴다.

## 무엇이 바뀌었나

| 파일 | 변경 |
|---|---|
| `llms.txt` (신규) | 지시서 부록 B 전문, 9,021 bytes |
| `index.html` | 푸터 **위**에 `<nav class="ai-read">` + 버튼 2개 (안 A) |
| `style.css` | 푸터 절 바로 뒤에 `.ai-read` / `.ai-read__btn` 규칙 |
| `main.js` | 9번 `run()` 블록 — `data-prompt` → `?q=` |
| `CLAUDE.md` | 콘텐츠 절에 파생물 동기화 규칙, 검증 절에 함정 28 |
| `brand/chatgpt.svg`·`brand/claude.svg` (신규) | 소유자 제공, 받은 그대로 |
| `assets.json`·`ASSETS.md` | `brand` 항목 등록 + 실패한 경로 기록 |
| `README.md` | 구조 표에 `llms.txt`, `main.js` 블록 수 정정 |

`about.html`·`work-*.html` 푸터는 **건드리지 않았다** (지시서 범위).

## Step 1 — 수치·서술 대조 결과

**수치 불일치: 0건.** `llms.txt` 의 숫자 토큰 49개가 전부 케이스 페이지 렌더
텍스트에 존재한다.

거짓 양성 2건이 먼저 나왔고, 둘 다 토크나이저 문제였다:

1. `GA4,` — `\d[\d,\.]*%?` 가 `GA4` 의 `4,` 를 숫자로 잡는다.
   앞에 영숫자가 붙은 경우를 제외해서 해결.
2. `1.0` — `llms.txt` 는 `1.0–1.7%`, 페이지는 `1.0% and 1.7%`.
   범위 표기에서 % 를 뒤로 모으면 앞쪽 값이 `1.0` 이 되어 페이지의 `1.0%` 와
   안 맞는다. **값은 동일하다.** 표기 차이일 뿐이라 수정하지 않았다.

**검증기 자체를 검증했다.** 불일치 0 은 검증기가 죽었을 때도 나오는 결과다.
가짜 숫자(`25.3%`→`25.9%`, `+9.4%`→`+9.7%`)를 주입하니 정확히 2건 더 잡혔다.
그걸 확인한 뒤에 0 을 믿었다.

**서술 근거: 21/21.** 첫 실행에서 1건이 MISSING 으로 나왔는데,
needle 을 곧은 아포스트로피로 썼기 때문이었다 — 페이지는 `&rsquo;`.
검증기 쪽 버그였고 문장은 멀쩡했다.

### 보고 대상 — 오너 판단 필요 (수정하지 않음)

**`Honest gaps` 4번째 항목이 이 절의 머리말과 어긋난다.** 머리말은
"Stated on the site itself, collected here" 인데, 4번 항목
("All three cases are one store, one brand, one category… Only one was a
controlled experiment")은 **어느 페이지에도 그렇게 적혀 있지 않다.**
세 케이스를 겹쳐 봐야 나오는 교차 추론이다.

내용 자체는 참이다(전부 Atacz, work-1 은 "not a controlled experiment",
work-3 은 실험 아님, work-2 만 split test). 틀린 것은 **머리말**이다.

**오너 결정 (같은 세션): 머리말을 고친다. 항목은 남긴다.**
4번은 채용 담당자에게 가장 쓸모 있는 한계라 지우면 정직함이 줄어든다.
과장하고 있던 것은 항목이 아니라 "Stated on the site itself" 쪽이었다.

    - Stated on the site itself, collected here:
    + The first three are stated on the site. The last is an observation across
    + all three cases rather than a line any one page states:

같은 항목의 "underpowered by **design constraints**" 도 함께 고쳤다 —
work-2 가 말하는 원인은 설계 제약이 아니라 **트래픽 볼륨**이다
("This page runs about 26 sessions a day per arm"). `the page's traffic
volume` 로 바꾸고 근거 문장을 다시 대조했다.

**교훈: 근거 없는 문장과 머리말이 과장된 문장은 다르다.** 지시서는 전자에
"삭제하고 보고"를 규정하는데, 여기서는 항목이 아니라 머리말이 범인이었다.
기계적으로 삭제했으면 사이트에서 가장 유용한 한계 하나가 사라졌을 것이다.

## 지시서의 사실 표에서 틀렸던 것

- **"`run()` 8블록"** — 주석 번호는 8까지지만 실제 블록은 13개다
  (`4b, 6b, 6c, 6d, 6e` 가 끼어 있고 `6c` 가 `6e` **뒤에** 온다).
  9번을 파일 끝에 붙이는 데는 영향이 없었다. `README.md` 도 같은 오류를
  갖고 있어서 함께 고쳤다.

나머지 항목(CSS 토큰, `--border` 부재, 푸터 마크업, 포트 8765, 연락처,
`robots.txt`/`sitemap.xml`/`llms.txt` 부재)은 전부 일치했다.

## Step 2 — 브랜드 로고: 자동 확보 실패 → 소유자가 직접 받아 해결

공식 경로가 전부 막혀 있다. 지시서가 "그리지 말고 멈춰라"라고 했으므로
`<img>` 없이 진행했다.

    www.anthropic.com/brand          404 (60,130 bytes — 404 도 본문이 크다)
    www.anthropic.com/company/brand  404
    openai.com/brand                 403 (봇 챌린지, 9,930 bytes)
    cdn.openai.com/API/logo-openai.svg  404

소유자가 로고를 쓰겠다고 확정한 상태였으므로 마크업에는 자리를 주석으로 남기고
나머지 Step 을 완주한 뒤 파일을 요청했다.

### 2차 시도 — 더 깊이 팠고, 더 나쁜 함정이 나왔다

    claude.ai/favicon.svg                       200 인데 본문이 Next.js 에러 HTML (60KB)
    claude.ai/icon.svg                          200 인데 본문이 HTML (107KB)
    claude.ai/login 헤드리스 DOM                봇 차단, 인라인 SVG 0개
    anthropic.com/.../safari-pinned-tab.svg     진짜 SVG 지만 Anthropic A\ 워드마크
    claude.ai/images/claude_app_icon.png        진짜 Claude 마크지만 크림색 배경판 PNG

**`status=200` + `Content-Type: image/svg+xml` 인데 본문이 HTML 이었다.** 상태 코드도
확장자도 MIME 도 전부 맞는데 파일이 아니다 — 404 를 상태 코드로 거르는 것보다 한 단계
어렵다. `head -c 4` 로 `<svg` 인지 보는 게 유일하게 싼 방어였다.

`safari-pinned-tab.svg` 는 더 조용한 실패다. **진짜 SVG 라서 모든 형식 검사를 통과하고,
렌더해서 눈으로 봐야 Claude 마크가 아니라 회사 워드마크인 걸 안다.** 형식이 맞는 것과
맞는 물건인 것은 다르다.

### 결말

소유자가 브라우저로 두 파일 다 받아 왔다 (`ChatGPT-Logo.svg`, `Claude_AI_symbol.svg`).
**둘 다 받은 그대로 커밋했다** — `claude.svg` 는 Downloads 원본과 byte-identical.

| | viewBox | fill | 비고 |
|---|---|---|---|
| `chatgpt.svg` | `0 0 320 320` | 없음 → 기본 검정 | OpenAI 모노크롬 |
| `claude.svg` | `0 0 100 100` | `hsl(14.8, 63.1%, 59.6%)` = **#D97757** | 공식 코랄, 배경 rect 없음 |

`claude.svg` 에 export 잔재로 `class="w-full"` 이 붙어 있다. `style.css` 에 그 규칙이
**0건**이라 무해하므로 지우지 않았다("공식 애셋을 그대로"). 유틸리티 클래스를 도입하는
날 확인할 지점이다.

두 마크 다 자기 색을 지킨다 — 버튼 글자색(`--muted`)이 로고에 적용되지 않는 것이 의도다.
`.ai-read` 가 flex row 라서 두 pill 은 높이가 같게 늘어난다(34px). 덕분에 로고가 한쪽만
있던 중간 상태에서도 레이아웃이 깨져 보이지 않았고, 소유자가 "ChatGPT 만 먼저" 를
고를 수 있었다.

**주의: 404·403 응답도 본문이 크다.** `bytes=60130` 짜리 404 를 성공으로
읽기 쉽다. 상태 코드를 먼저 보라 — CLAUDE.md 검증 절의 그 함정 그대로다.

## Step 3 — 안 A/B 비교: B 는 실제로 깨진다

지시서가 "세 번째 요소를 그냥 넣으면 레이아웃이 무너진다"고 예측했고, 맞았다.

- **안 A** (푸터 위 별도 `<nav>`) — 정상. 버튼 2개가 좌측 정렬로 조용히 앉는다.
- **안 B** (푸터 내부 세 번째 span) — `justify-content: space-between` 이
  span 3개를 분배하면서 `About / LinkedIn` 이 **가운데로 밀리고**, 버튼은
  둘째 줄 우측으로 떨어져 푸터 경계선 아래에 떠 있는 것처럼 보인다.
  게다가 `<footer class="label">` 의 `text-transform: uppercase` 를 상속해
  **"READ WITH CLAUDE"** 로 대문자화된다 — 지시서가 기본안에서 피하라고 한 형태.

A 로 진행했다.

## Step 6 — 검증

| 항목 | 결과 |
|---|---|
| JS 없는 상태 | 서빙된 마크업의 `href="llms.txt"` 2개 → 200 `text/plain` |
| `/llms.txt` | 9,021 bytes, `Content-type: text/plain`, 로컬 파일과 byte-identical |
| 생성된 href | `claude.ai/new` 709자 / `chatgpt.com/` 708자. 디코드 복원이 부록 A 와 일치, 개행 12개 전부 `%0A` |
| `target`/`rel` | `_blank` / `noopener` |
| 1280px | 정상 (전체 높이 캡처) |
| 390px / 320px | `overflow=0`. 390 은 한 줄, 320 은 `flex-wrap` 으로 두 줄 |
| 키보드 | 탭 순서 7·8번(푸터 링크 바로 앞). `:focus-visible` = true, outline 2px `--fg` offset 3px |
| `!important` | 0 |

**검증하지 못한 것 — 오너 확인 필요.** 실제로 두 링크를 열어 프롬프트가
입력창에 채워지는지는 확인 못 했다. `claude.ai/new` 와 `chatgpt.com/` 둘 다
curl 에 **403** 을 준다(봇 챌린지, 5.6KB / 8.7KB). URL 구성이 옳다는 것까지가
여기서 증명 가능한 전부다. 로그인된 실제 브라우저에서 한 번 눌러 볼 것.

### 이번에 걸린 측정 함정 2개

1. **첫 스크린샷 2장이 바이트까지 동일했다.** `--screenshot` 은 뷰포트만 찍는데
   푸터가 화면 밖이라 두 안 모두 히어로만 담겼다. "차이 없음" 이 아니라
   "둘 다 안 찍힘" 이었다. `--window-size=1280,2400` 으로 해결.
   비교 전에 `cmp` 로 두 파일이 실제로 다른지 먼저 확인하는 게 싸다.
2. **`:focus-visible` 이 true 인데 border 는 그대로였다.** `transition:
   border-color 0.15s` 때문에 포커스 직후 computed style 은 시작값을 준다.
   `getAnimations().forEach(a => a.finish())` 후에 읽으니 `--fg` 로 바뀌었다.
   CLAUDE.md 가 적어둔 그 함정인데, 이번엔 색에서 나왔다.

좁은 폭은 헤드리스가 500px 밑으로 못 내려가므로(CLAUDE.md) iframe 실측으로 했다.

## 배포

커밋 3개, 전부 `main` 에 푸시됨. Pages 빌드는 셋 다 success (28초 / 30초 / 30초대).

| | |
|---|---|
| `e91273b` | `llms.txt` + 푸터 버튼 + CSS/JS + 문서 |
| `b6be026` | ChatGPT 마크 |
| `2a70cfc` | Claude 마크 |

라이브 검증 (`hannnnnnnnnnnn.github.io`):

- `/llms.txt` 200, **9,125 bytes 로 로컬과 byte-identical**, `text/plain; charset=utf-8`
- `/brand/claude.svg` 1,155 · `/brand/chatgpt.svg` 1,739 — 둘 다 byte-identical, `<svg` 로 시작
- `main.js`·`style.css` 로컬과 byte-identical
- 라이브 HTML 을 `DOMParser` 로 파싱해 버튼별 `<img>` 수를 셌다 — 중간 상태에서
  `grep` 은 **주석 안의 `<img>` 까지 잡아** 마치 이미 적용된 것처럼 보였다.
  주석은 DOM 에 없으므로 파서로 봐야 진짜 상태가 나온다

## 남은 것

- [x] 브랜드 SVG 2개 → `/brand/`, `assets.json`·`ASSETS.md` 등록
- [x] `Honest gaps` 4번 항목 vs 머리말 — 머리말 수정으로 해결 (항목 유지)
- [x] 배포 후 라이브 `/llms.txt` 확인 — 바이트 수 먼저 대조, 마커 확인
- [ ] **로그인 브라우저에서 두 링크 실제로 눌러 보기.** 이 세션이 검증하지 못한
      유일한 항목이다. `claude.ai/new`·`chatgpt.com` 둘 다 curl 에 403(봇 챌린지)을
      주므로, URL 구성이 옳다는 것(디코드 복원이 부록 A 와 일치, 개행 12개 전부
      `%0A`)까지가 증명 가능한 전부다
- [ ] 다른 4개 페이지 푸터로 확산할지 오너 결정 — 지금은 `index.html` 에만 있다.
      푸터는 5개 파일에 하드코딩돼 있고 include 가 없으므로 확산은 4곳 수정이다
