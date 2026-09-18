# 2026-09-17 — work-1 ATC 호버 · work-3 거짓 문단 삭제와 플로우 도해

같은 날 두 번째 세션(앞 세션: `2026-09-17_work3-patch-v2-v3-and-demo-c.md`).

## 요청

1. work-1 의 Add to Cart 버튼에 work-2·work-3 의 호버 애니메이션 적용
2. work-3 를 한국어로 해석
3. (2의 결과) Decision 05 의 "What I changed in the email" 문단 삭제 — **하지 않은 일이었다**
4. 오너가 만든 Shopify Flow 를 보여줄 방법

## 1 — work-1 Add to Cart 호버 (`f826a0d`)

`.pcard__atc`(work-2)·`.resolver__cta`(work-3)와 **같은 `pcard-shine` 키프레임을 재사용**했다.
새 키프레임을 만들지 않은 것이 핵심이고, 다른 것은 띠 색뿐이다.

| | 두 검은 버튼 | `.pdp__cta` |
|---|---|---|
| 배경 | `#0c0c0c` | `#fff` |
| 띠 색 | 흰색 25% | **글자색 25%**(`rgba(12,12,12,.25)`) |
| 배경 85% 페이드 | 보임 | **생략** — 흰 버튼이 흰 스테이지 위라 보이지 않는다 |

생략한 절반은 주석에 이유를 적었다. 안 적으면 다음 세션이 "라이브 호버의 절반이 빠졌다"로
읽는다. `[disabled]`(Sold out)에는 띠가 없고 `prefers-reduced-motion` 에서 꺼진다 — work-3 와 동일.

**검증:** 합성 `MouseEvent` 로는 `:hover` 가 붙지 않아 `getAnimations()` 가 0 을 준다(아래 교훈).
키프레임을 클래스로 강제 적용해 **재생 자체**(`animationName`, `currentTime > 0`)를 확인하고,
실제 호버는 오너 확인으로 넘겼다.

## 2 — work-3 한국어 해석

전문을 절별로 옮기다가 Decision 05 의 한 문단이 **사실과 다르다는 것을 오너가 지적**했다.
이메일 문구를 바꾼 적이 없다는 것. 추적 결과:

| | |
|---|---|
| 페이지 문장 | "What I changed in the email … **so I changed the wording instead**" |
| 들어온 커밋 | `b2ce809` (같은 날 13:22, 앞 세션) |
| 출처 | 테마 레포 `docs/session-logs/2026-09-16_preorder-false-positive-and-flow-audit.md:367` |
| 출처 원문 | "Email copy **is the cheapest remaining mitigation** for path B" — **권고** |

같은 문단의 "The flow is also set transactional" 도 같은 줄(364–365)의 **설정 권고**였고
검증된 적이 없다. 문단 통째로 삭제(`51cda38`). `llms.txt`·`SECTION-NAV.md` 에는 실려 있지
않아 파생 문서 수정은 없었다.

**같이 사라진 참인 사실 하나:** "마지막 한 개를 가져가는 주문이 태그 평가 직전에 플래그를
뒤집을 수 있다"(path B)는 실제로 열린 경로다. 지금 페이지 어디에도 없다 — 5장 Still open
으로 옮길지는 오너 미결정.

## 3 — 플로우 도해 (`1e4a58d`)

케이스가 Shopify Flow 를 네 번 언급하면서 그 워크플로가 무엇인지는 한 번도 보여주지 않았다.
`.flows` 로 두 개를 나란히 놓았다.

| 워크플로 | 트리거 | Run code | 액션 |
|---|---|---|---|
| `Pre-order setting for CA and US` | 변형 재고 수량 변경 | 로케이션별 재고 | `custom.preorder_ca/_us`, `hide_variant_ca/_us` **기록** |
| `pre-order` | 주문 생성 | **게이트** — 속성 AND 배송 마켓의 현재 플래그 | `Pre-order` 태그 → Klaviyo |

- **새 격자를 만들지 않았다.** 워크플로 하나가 정확히 기본 `.mfd` 의 3열(트리거 → Run code
  → 액션)이라 그대로 얹었고, `.flows` 가 더한 것은 이름표·연결 문장·본문용 `details`
  스타일뿐이다. `.mfd` 자체는 01·02 가 같이 쓰므로 건드리지 않았다(기존 규칙).
- **자리:** `OR` 실수 문단 **뒤**, 검증 표 **앞**. 게이트를 보여준 다음 그 게이트를 검증하는
  순서. 처음에는 표 뒤에 넣었다가 옮겼다.
- **코드 발췌**는 Decision 01 의 Liquid 발췌와 같은 `<details>` 문법, 12줄, `simplified` 표기.
  실물은 속성 철자 2종과 POS 제외도 처리한다.
- 값·키·트리거 이름은 전부 9/16 감사 로그에서 읽었다. 지어낸 값 없음.
- iframe 실측 320/390/768/1000/1280 — 페이지 가로 오버플로 0, 700px 부터 3열.

## 교훈

### 로그의 "권고"를 페이지의 "완료"로 옮기지 마라

이번 세션에서 유일하게 **포트폴리오가 거짓을 말하고 있던** 항목이고, 앞 세션이 만들었다.
세션 로그는 *한 일*과 *하면 좋을 일*을 같은 문단에 섞어 적는다 — 옮길 때 시제를 원문에서
확인해야 한다. 특히 정직함이 주제인 케이스에서.
기존 규칙 "받은 패치의 사실 주장은 적용 전에 반증해라"의 자매편이다: **출처가 내 로그여도
같다.**

### 합성 `MouseEvent` 는 `:hover` 를 만들지 않는다

`dispatchEvent(new MouseEvent('mouseover'))` 뒤 `el.matches(':hover')` 는 `false` 이고
`getAnimations()` 는 빈 배열이다 — 멀쩡한 CSS 호버가 "안 돈다"로 읽힌다(함정 4 와 다른 축:
그건 탭이 숨겨져 안 도는 것, 이건 상태가 아예 안 붙는 것).
할 수 있는 것: 같은 키프레임을 클래스로 강제해 **키프레임이 해석되고 재생되는지**까지.
할 수 없는 것: 호버 트리거 그 자체 — 사람이 봐야 한다.

### 함정 29 는 이제 틀렸다 — 로컬 서버가 열린다

`http://localhost:8777` 과 `http://127.0.0.1:8777` **둘 다** 정상적으로 열렸고 JS 측정까지
됐다. 막힌 것은 `file://` 뿐이다(`Can't interact with browser-internal or unparseable URLs`).
확장 권한은 머신·버전마다 다르니 "못 한다"고 기억하지 말고 **한 번 열어 보고** 판단할 것.

### `.label` 안의 `<code>` 는 감싸기만으로 대문자가 안 풀린다

`text-transform` 은 상속되므로 `<code>` 로 감싸도 그대로 대문자다. 이 저장소는 이미
`.figure figcaption code` 와 `.frame__slot code` 에 `text-transform: none` 을 따로 걸어
두고 있었다 — 이번에 `.flows__name code` 가 **세 번째**다. CLAUDE.md 의 서술이 그 사실을
빠뜨리고 있어 같이 고쳤다. 플로 이름은 실물 이름이라 `pre-order` 와
`Pre-order setting for CA and US` 의 대소문자가 정보다.

## 커밋

| | |
|---|---|
| `f826a0d` | work-1 Add to Cart 호버 |
| `51cda38` | Decision 05 이메일 문단 삭제 |
| `1e4a58d` | 플로우 도해 + `.flows` + CLAUDE.md 컴포넌트 표 |

셋 다 push 후 Pages 빌드 `built`(dur 21236 / 17474) 확인, 라이브 파일과 로컬 **바이트 대조
일치**까지 확인했다.
