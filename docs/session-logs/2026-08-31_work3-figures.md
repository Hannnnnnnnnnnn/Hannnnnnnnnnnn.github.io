# 2026-08-31 · work-3 도판 3개를 HTML 로 닫음

`WORK-3-FIGURES-PLAN.md` 실행. 촬영 대기 슬롯 4개 중 2개를 없애고, 1개를 둘로 쪼갰다.
**사진 4장 → 2장** (`02.jpg`, `04-email.jpg`). 새 HTML 컴포넌트 3개, **새 데모 0개, JS 0줄.**

## 실제로 밟은 함정

**1. 로컬 테마 클론이 라이브와 달랐고, 하마터면 케이스가 자기 코드를 틀리게 말할 뻔했다.**
`~/atacz-theme` 클론(브랜치 `docs/session-start-staleness-hook`)의 `buy-buttons.liquid` 는
프로퍼티를 **항상 렌더하고 else 에서 `disabled`** 를 건다. 그런데 work-3 본문은 "조건부로
렌더한다, `disabled` 는 JS 수집 경로에서 새어나가므로"라고 쓰고 있었다 — 로컬만 봤으면
본문이 틀렸다고 판단해 **멀쩡한 문장을 고쳤을 것이다.**
Admin API 로 라이브 MAIN(`187497709872`)에서 같은 파일을 읽으니 본문이 정확했다: 조건부
렌더에 그 한·영 주석까지 그대로 있었다. **테마 사실은 레포가 아니라 라이브에서 읽는다**
(atacz-theme CLAUDE.md 의 "PULLED THEME 을 audit 하라"가 포트폴리오 쪽에도 그대로 적용된다).

**2. 같은 신호의 키 이름이 소스마다 달랐다 — 조용히 고르면 안 되는 종류.**
- 라이브 `buy-buttons.liquid`(PDP 폼) → `properties[_pre_order]` (밑줄 있음)
- 서빙되는 `global.js`(카드 퀵애드) → `properties[pre_order]` (밑줄 없음)
- 실제 주문 8건 → 전부 `pre_order`

소유자 판단으로 **`_pre_order`**(PDP 코드 기준)를 도식에 찍었다. 본문의 "hidden line item
property"는 밑줄이 있어야 성립하고, Dec 04 가 서술하는 것이 PDP 경로이기 때문이다.
**두 경로가 서로 다른 키를 쓰는 것 자체는 테마 쪽에 남아 있는 실제 불일치다.**

**3. `pet_bottle_count` 는 존재하지 않는 메타필드였다.** work-1·work-2·assets.json 에
6군데 있었고, 실제 키는 `pet_bottle_badge2`(`metafieldDefinitions` 로 확인, number_decimal).
work-1:435 는 이미 맞게 적혀 있어서 **한 페이지 안에서도 두 이름이 공존**하고 있었다.
계획서가 지목한 그 불일치가 맞았고, 틀린 쪽이 다수였다.

**4. `.anno` 의 row-gap 0 이 라벨을 엉뚱한 절에 붙였다.** 구조는 `[절 텍스트][그 절의 라벨]`
인데 세그먼트 사이 세로 간격이 0 이라, 라벨이 **제 절보다 다음 절에 더 가까웠다.** 화면에서는
"NAME THE ACTION" 이 아래 줄 "Your order is reserved" 의 제목처럼 읽혔다 — 근접성이 소속을
정한다. 측정으로 잡았다: 절→제 라벨 10.4px vs 라벨→다음 절 0px. `gap: 1.7rem 0.4em` 으로
29.2px 를 만들어 역전시켰다. **스크린샷을 안 봤으면 "구조는 맞다"로 통과시켰을 버그다.**

**5. 리빌 때문에 스크린샷이 회색으로 나왔다.** 자동화 탭은 `visibilityState: 'hidden'` 이라
IO 가 안 돌아 `.reveal` 이 opacity 0 에 굳는다. `getAnimations().finish()` 로도 안 풀렸고,
`documentElement.classList.remove('js')` 로 숨김 규칙 자체를 무효화해야 제대로 찍혔다
(이 저장소의 안전망 구조를 그대로 이용한 것). 그리고 `js` 를 떼면 **스크롤이 리셋되므로**
스크롤은 그 다음에 다시 해야 한다 — 첫 캡처가 페이지 최상단이었다.

## 검증

320 / 390 / 768 / 1280 네 폭 전부 `hOverflow: 0`, `.anno__job`·`.mfd--chain code` 클리핑 없음.
`.mfd--chain` 은 900px 부터 4열, 그 아래는 기본 세로 스택(700–899 에서 2×2 가 되면 체인이
안 읽혀서 명시적으로 1열로 막았다). 회귀: work-1·work-2 의 `.mfd` 는 1280 에서 3열
(`272.9 / 210.9 / 248.1`), `.dist` 는 gap 14.4px·track 10px 로 **변화 없음** — 변형을 전부
추가 클래스로만 열었기 때문.

차트 값은 ShopifyQL 12개월 실측이고 10월 9.357% 가 최댓값이라 본문 9.4% 와 맞는다.
막대 폭은 최댓값 100% 정규화(정규화 사실은 CSS 주석에, 캡션은 원값).

## 남은 것

- 사진 2장 대기: `02.jpg`(CTA 전/후), `04-email.jpg`(확인 이메일, 모바일 크롭·개인정보 마스킹)
- 테마 쪽 실제 불일치: PDP 는 `_pre_order`, 카드 퀵애드는 `pre_order` — 이 저장소 밖의 일
