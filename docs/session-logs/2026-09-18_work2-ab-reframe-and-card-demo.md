# 2026-09-18 — work-2 A/B 결론 재프레이밍 · Decision 01 카드 데모를 테마에서 재현

## 요청

work-2 한글 해석에서 시작해, 오너 지적 5건 → 데모 구조 변경 → 카드 실물 재현 →
섹션 번호·문구 교정으로 이어졌다. 커밋 8개, 전부 배포·검증 완료.

`cea556b` → `8361197` → `35f50e9` → `42afccb` → `14b40b5` → `465bcff` → `43f99b0`
→ `d592829` → `c2b1f08` → `830d0a7`

## 1. A/B 결론 재프레이밍 — 오너 지적이 케이스를 더 강하게 만들었다

원고는 "이 페이지는 A/B 테스트에 맞지 않았다"였다. 오너 지적: **도구가 아니라 모수 설정이
문제였던 것 아니냐.** 맞았고, 근거는 이미 페이지 안에 있었는데 연결돼 있지 않았다.

- 롤아웃이 나눈 것: **70,716 방문** (스토어 전체 테마 단위 배정)
- 개편에 실제로 도달한 사람: **2,327명** = 배정의 **3.3%**
- 필요했던 노출: 9% 기준선에서 +8% 판별 시 arm당 **약 24,000명**

나머지 ~97%는 그룹 배정은 됐지만 **양쪽이 동일한 페이지를 봐서** 비교에 기여가 0이다.
표본을 97% 버린 셈이고, 그래서 CI 가 `[−18%, +35%]` 로 벌어졌다.

**결론 교체:** "A/B는 틀린 도구" → **"페이지가 아니라 템플릿을 테스트하라."** PLP 템플릿
단위로 걸었으면 유료 진입의 51%를 덮고 같은 43일로 문턱을 넘었다.

### CI 는 남기고 어조만 바꿨다

오너는 "이건 여전히 증명"이라고 했다. **통계적으로는 아니다** — CI 가 0을 포함한다. 지우면
면접관이 제일 먼저 잡는다. 대신 **불편함의 원인이 사실이 아니라 어조**라는 걸 인정하고:

| 제거 | 이유 |
|---|---|
| "+8.2%를 성공이라 부르느니" | 자기비하 |
| 스크롤 = "테스트에서 가장 단단한 발견" | 주력 지표를 들러리로 만듦 |
| 스크롤과 클릭률을 라이벌처럼 배치 | 둘 다 같은 방향(관여 증가)을 가리킨다 |

프레임을 **"내 결과가 약하다" → "내가 검정력을 스코핑으로 날렸다"** 로 바꾸니 변명이 아니라
진단이 되고, 부제/결론과 하나로 맞물렸다.

## 2. Decision 01 데모 — 토글에서 나란히로, 그리고 실물로

토글(라디오 2개)은 독자가 한 버전을 **기억해서** 다른 쪽과 비교하게 만든다. 2열 그리드로
바꾸고 640px 이하 스택. 그러면서 각 카드가 **그 버전이 실제로 가졌던 것만** 담게 했다 —
토글일 땐 카드 하나를 공유했으니 CSS 로 숨기는 게 맞았지만, 카드가 둘이면 죽은 마크업이다.

### 두 테마를 받아 설정을 대조했다

`miffy-drop2-organized`(#182726361392) vs 라이브(#188036022576), 그리드 섹션 설정:

| | Before | After |
|---|---|---|
| `enable_quick_view` | true | **false** |
| `show_vendor` | true | **false** |
| `show_rating` | true | **false** |
| `enable_sorting` | false | false |
| `card_swatches_below_price` | — | **true** |
| `card_title_font_size` / `_price` | — | **12 / 14** |
| `filter_text_underline_style` | — | **true** |

`card-product.liquid` 자체는 공백 외 **거의 동일**했다. 차이는 전부 섹션 설정과 섹션이
주입하는 `{%- style -%}` 에 있었다 — 파일 diff 만 봤으면 "차이 없음"으로 결론 낼 뻔했다.

### 퀵뷰가 "데스크탑 전용"이었던 진짜 메커니즘

```css
.quick-view__summary { transform: scale(0); }
@media screen and (hover: hover) {
  .card-wrapper:hover .quick-view__summary { transform: scale(1); }
}
```

기본이 `scale(0)` 이고 `@media (hover: hover)` 안에서만 `scale(1)` 이 된다 — **터치
기기에서는 나타날 수가 없다.** "의도가 아니라 CSS 때문"이라는 훨씬 구체적인 문장이 됐고,
97% 모바일에서 사용량 0 이 추정이 아니라 증거가 됐다.

또한 퀵뷰는 **삭제된 게 아니라 설정 하나가 꺼진 것**이다. 라이브에도 마크업이 그대로 있다.
"I removed it" → "I turned it off … reversible rather than deleted."

## 3. 지어낸 값 3건 — 전부 오너가 잡았다

이 세션 최대 실패. 테마에서 뽑지 않고 **그럴듯한 값을 썼다.**

| 내가 쓴 값 | 실제 | 출처 |
|---|---|---|
| 별점 11px | **15px**, tracking 3px, Times | `.rating-star` = `calc(1.5 * 1rem)`, `calc(0.3 * 1rem)` |
| 가격 14px | **18px** | `.price` 컨테이너(1.4rem)만 읽음. 금액은 `.price bdi` = `calc(--font-price-scale * 1.8rem)` |
| 필터 "Filter and sort" | **"Filter"** | `enable_sorting:false` → `filter_button` 분기 |

가격 건이 특히 나쁘다. `.price { font-size: 1.4rem }` 를 읽고 **거기서 멈췄다.** 실제 숫자는
자식 `<bdi>` 에 있다. 그리고 이게 리밴프 셀렉터 목록이 왜 그렇게 생겼는지도 설명한다 —
`.price, .price .price-item, .price bdi` 로 **bdi 를 명시**해야 숫자가 내려간다. 18→14 는
우연이 아니라 그 셀렉터가 노린 지점이었다.

## 4. DOM 에 있다 ≠ 화면에 보인다

오너가 붙여준 Before DOM 에 `rating-text`(4.38 / 5.0)와 `rating-count`((8))가 있길래
렌더했다. `component-rating.css`:

```css
.rating-text  { display: none; }
.rating-count { display: none; }
```

테마 전체에 덮는 규칙이 **없다**(grep 확인). 카드에는 **별만 보인다.** 마크업을 근거로
쓸 때는 **그 클래스의 CSS 까지 확인**해야 한다. 지금은 별만 렌더하고 수치는 `aria-label` 로
넘겼다.

## 5. 검사기가 버그였던 건 (또)

첫 스크린샷에서 After 의 PET 배지가 **흰 네모로 깨져** 보였다. 스크롤 리빌을 풀려고

```js
document.querySelectorAll('*').forEach(e => { if (getComputedStyle(e).opacity === '0') e.style.opacity = '1' })
```

를 돌렸는데, 여기에 **의도적으로 투명한 체크박스**(`.pet-badge__toggle`, `opacity:0` 로
클릭 영역만 담당)까지 포함돼 네이티브 체크박스가 배지 위에 덮였다. 코드는 멀쩡했다.
CLAUDE.md "FAIL 을 보면 검사기부터 의심해라"의 교과서 사례. 리빌 대상만 골라 푸는 방식으로
고쳤다.

## 6. 브라우저 검증 — 로컬은 불가, 라이브는 캐시 주의

- **확장이 `localhost`/`127.0.0.1` 에 못 붙는다.** `curl` 은 200 인데 확장은 에러 페이지만
  받는다(`readyState: complete`, DOM 비어 있음). 샌드박스 안팎 동일. 포트 2개 시도 후 포기.
  → **배포 후 라이브 URL 에서 검증**하는 게 유일한 경로다.
- **라이브에서도 CSS/HTML 은 브라우저 캐시를 탄다.** `curl` 바이트가 같아도 탭은 옛
  스타일시트를 쓴다. 실제로 "수정이 안 먹었다"로 한 번 오판했다. 검증 전에
  `?bust=Date.now()` 를 단 `<link>` 를 꽂고 옛 것을 제거해 **특정 셀렉터가 실제로 로드됐는지**
  먼저 확인할 것. HTML 쪽은 `?cb=` 를 붙여 재탐색.
- **라디오를 `.click()` 으로 토글할 때 이미 checked 면 `change` 가 안 뜬다.** "기본값 →
  기본값" 리셋이 조용히 no-op 이 되고, 직전 probe 에서 손으로 붙인 클래스가 남아 두 상태가
  똑같이 읽혔다. `el.checked = true; el.dispatchEvent(new Event('change', {bubbles:true}))`.

## 7. 레이아웃 함정 둘

- **`min-height` 는 더 큰 요소를 못 자른다.** 필터 행을 `min-height:42px` 로 맞췄는데 Before
  버튼이 실제 44px 라 카드가 1px 어긋난 채였다. `height:44px` + 버튼 `align-self:stretch` 로
  고정 — 폰트 메트릭에 안 흔들린다.
- **컨테이너를 교체하면 그 chrome 은 상속되지 않는다.** `.demo__stage` 를 `.demo__pair` 로
  바꾸면서 패딩·`border-top` 을 하나도 안 물려받아 컬럼이 가장자리에 딱 붙었다.

## 8. CSS 특이도 — 덮어쓰지 말고 원래 규칙의 범위를 좁혀라

Before 의 "Choose options" 가 색을 고르기 전엔 안 떴다. 원인은 기존
`.demo .pcard:not(.is-picked) .pcard__buy`(**0,4,0**)가 Before 규칙(**0,3,0**)을 이긴 것.
더 센 셀렉터를 새로 얹는 대신 **원래 규칙이 After 슬롯만 가리키도록** 좁혔다:
`.pcard__buy:not(.pcard__buy--before)`. 그 규칙의 의도가 원래 그것이었기 때문이다.

## 9. 잘못 결론 낼 뻔한 것 — 빈 버튼 슬롯

라이브 HTML 을 `curl` 로 받으니 리밴프 카드의 버튼 슬롯이 `<div
class="card-information__button"></div>` 로 **비어 있고** `show_quick_buy` 도 `false` 였다.
"After 엔 장바구니 버튼이 없다 → 내 데모가 틀렸다"로 갈 뻔했는데, `card-product.liquid` 를
더 읽으니:

```liquid
{%- if card_product.available and enable_quick_buy_2nd %}
  data-variant-id="{{ variant.id }}"
{% endif -%}
```

`enable_quick_buy_2nd` 는 **버튼을 그리지 않고 `<color-swatch>` 에 data 속성만 붙인다.**
버튼은 색 선택 후 JS 가 `view=card` 를 가져와 채운다. 서버 HTML 에선 양쪽 다 비어 보이는 게
정상이고, "색 선택 → 장바구니" 동작은 원래 원고가 맞았다.

## 10. 마지막 교정 3건

- **부제가 자기설명적이지 않았다.** "the test was scoped to one collection while the split
  divided the whole store" — 오너가 "이게 무슨 뜻이야?"라고 물었다. **작성자 본인이 되물어야
  하면 독자는 더 못 알아본다.** → "my A/B test split the whole store's traffic to measure a
  change on a single page in it."
- **섹션 번호가 2부터 시작.** work-1·2·3 **전부** 그랬다 — 히어로가 말없이 1 을 차지. 한
  페이지만 고치면 형제와 어긋나므로 **세 페이지 다** 1 부터로. `work-3` 의 "section 5"
  상호참조도 4 로.
- **필터 축소 이유가 동어반복이었다.** "필터링은 이 페이지의 문제가 아니었으니" — 왜 문제가
  아닌지를 말하지 않았다. 오너 근거로 교체: **전체 카탈로그가 60개**(가방+액세서리+스트랩)라
  필터가 필요할 사람이 애초에 많지 않았다.

## 부수 처리

**프리뷰 쿠키를 남겼다가 정리했다.** `?preview_theme_id=182726361392` 로 연 뒤 평문
`atacz.com` 도 계속 드래프트를 서빙했다(CLAUDE.md 에 적힌 함정 그대로). 라이브를 새로
조회(`188036022576`)해 되돌리고 `role: main` 확인. **다른 기기/브라우저에서 미리보기를 열었다면
거기도 같은 처리가 필요하다.**

`shopify theme pull` 의 `--only` 체인은 **~12개 넘으면 실패**한다(36개 요청 시 0개 전송,
녹색 종료). 배치로 나누고 `find | wc -l` 로 개수를 검증할 것.

## 남은 것

- **vendor 제거 이유는 내 추론이었고 오너가 사후 확인해줬다.** "단일 브랜드 스토어라 모든
  카드가 같은 이름을 반복한다" — 맞았지만 **운이었다.** 별점 제거 이유는 같은 방식으로
  추론했다가 틀렸다(내가 쓴 "표본이 얇아 노이즈" ≠ 실제 "리뷰 없는 상품이 더 많아 PDP 에서
  선택적 노출").
