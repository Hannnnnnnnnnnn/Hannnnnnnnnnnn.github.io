# 2026-09-17 — work-3 패치 v2·v3 · 데모 C 호버와 라벨

## 요청

`~/Downloads/patch.md`(v2), 이어서 `patch-v3.md` 를 **검증한 뒤** 적용. 중간에 데모 C 의
CTA 호버와 컨트롤 라벨 수정.

## 원칙 — 패치를 받으면 먼저 반증한다

두 패치 모두 라인번호·CSS·JS 주장은 정확했다. 그런데 **둘 다 사실오류를 하나씩 갖고 있었고,
그대로 적용했으면 페이지가 거짓을 말했을 것이다.** 적용 전 검증이 값을 한 이유다.

### v2 에서 잡은 것

| 패치 주장 | 실제 | 조치 |
|---|---|---|
| Decision 05 "Two earlier orders had the same shape" | 같은 형태(Shop 앱 스테일 스냅샷)의 오탐은 **1건**. 8월 2건은 속성 없이 태그만 붙은 **별개의 미해명** 건 | 문장 삭제 |
| 6장 "three orders / a fourth case" | 위와 같은 이유 | `one order / a second case` |
| "Seven months after launch" | 2~3월 출시 → 9월이면 여섯 달 | `Six months` |
| (패치가 놓침) 174행 `Resulting states.` 가 여전히 `Available` | P0-2 가 오해의 소지라고 지적한 바로 그 용법이 네 줄 위에 남음 | 재고 기준으로 재서술, `main.js:449-450` 과 일치 |

### v3 에서 잡은 것

- **"한국어 주석이 페이지 전체에서 여기 한 줄뿐"이 아니다.** `work-1.html:425` 가 렌더되는
  Liquid 발췌 안에 **똑같은 한/영 병기 주석**을 갖고 있다. work-3 만 지우면 혼자 튄다.
  → 오너 결정으로 **두 페이지 다 영문화**.
- **C(분량)의 효과가 주장의 1/9.** 패치는 약 110단어 절감을 예고했으나 실측 **12단어**
  (Decision 05 683→671, 페이지 비중 25.0%→24.6%). C-1 "병합"은 실제로는 문장 하나(11단어)를
  지우고 두 문단을 이어붙인 것이라 60단어가 나올 수 없다. 변경 자체는 중복 제거라 옳지만
  **분량 대책으로는 무효**다.
- **C-1 의 삭제 대상은 앞 문장과 같은 말이 아니었다.** 앞 문장은 *속성이 붙은* 것,
  삭제 대상은 *게이트가 태그한* 것 — 그 문단이 구분하려는 두 단계다.
  `the gate agreed with it` 한 구절로 압축해 살렸다.

## 내가 대신 확인해 준 것 (패치가 "확인 필요"로 남긴 것)

- **`localization.market.handle`** — 실재하는 Liquid 속성이고(문서 예시가 `{"handle": "ca"}`),
  이 스토어의 실제 핸들도 `ca`/`us` 다. **마켓 컨텍스트 파일 접미사가 곧 핸들**이라는 점을
  이용해 확인했다 (`*.context.ca.json` 7개, `*.context.us.json` 5개). Admin API `markets`
  조회는 커넥터가 막는다. → 발췌에 `assign market_code = localization.market.handle` 추가.
- **`snippets/buy-buttons.liquid` 실물** — 테마 레포 워킹트리가 생겨 직접 읽었다.
  `| t` 이관은 **아직 안 됐다**(같은 날 별도로 처리). `simplified` 표기가 필요한 이유.

## 데모 C — 호버

"홈페이지와 똑같이" = 라이브 스토어 버튼. **이미 레포에 재현돼 있었다** (`.pcard__atc`,
work-1/2 의 PLP 카드 데모). 새로 만들지 않고 규칙과 `pcard-shine` 키프레임을 재사용했다.

중간에 **PDP 버튼이 `button--secondary`(전혀 다른 호버)일까 의심**해서 실물 테마를 뒤졌는데,
상품 템플릿 56개 중 **52개가 `show_dynamic_checkout: false`** 라 솔리드 `.button` 이 맞았다.
타이밍도 테마와 동일(`--duration-long` 500ms + `--duration-default` 250ms 딜레이).

품절(disabled)에는 띠를 넣지 않았다 — 누를 수 없는 버튼이 빛나면 받지도 않을 클릭을 부른다.

## 데모 C — 라벨

오너 질문: "Opted in for this market 이 sell when out of stock 아니냐?" → **아니다.**
메타필드 정의 이름을 조회하니 `Preorder CA`/`Preorder US` 였고, `sell when out of stock` 은
inventory policy 로 **이미 별도 컨트롤로 있었다.** 다만 `Inventory policy` 가 Liquid 용어라
관리자 화면 문구와 다른 건 맞아서, 오너 선택으로 둘 다 관리자 문구로 바꿨다.

이어서 체크박스 하나를 **두 마켓 플래그를 동시에 보여주는 라디오 두 줄**로 분리했다.
마켓 토글은 이제 "어느 플래그를 읽을지"만 고른다. 부수 효과로 **JS 가 짧아졌다** —
마켓별 상태를 들고 다니며 체크박스를 재동기화하던 코드가 통째로 사라졌다.

```
SELL WHEN OUT OF STOCK   [ Off | On ]
MARKET                   [ CA  | US ]
STOCK                    [ 0   | 3  ]
PRE-ORDER IN CANADA      [ True | False ]
PRE-ORDER IN US          [ True | False ]
```

## 검증에서 걸린 함정

- **로컬 서버(127.0.0.1)는 Chrome 확장 권한에 없어 못 연다.** 서버는 200 을 주는데 탭은
  에러 페이지다. 라이브 도메인은 정상 → 브라우저 문제가 아니라 localhost 차단.
  → **이미 라이브인 페이지에 새 CSS 를 주입해서** 배포 없이 실렌더를 검증했다.
- 숨은 탭이라 애니메이션이 안 돌아 **`::after` 애니메이션을 450ms 지점에 직접 seek** 해서
  띠를 세워두고 확대 촬영했다. 배경 전환은 delay 0.25s 라 `finish()` 로 끝까지 보냈다.
- 리빌 때문에 스크린샷이 하얗게 나오면 `classList.remove('js')` + `getAnimations().finish()`.
- 데모 상태 7가지를 배포된 페이지에서 직접 돌려 전부 확인했다 (CA→Pre-order / US→Sold out 포함).

## 커밋 (전부 origin/main, 배포·검증 완료)

| SHA | 내용 |
|---|---|
| `b2ce809` | patch v2 — Decision 05 신설, Decision 01 목록/발췌, 4·6·7장 |
| `50d3df7` | 데모 C 호버 + 관리자 문구 라벨 |
| `e37c0a7` | 마켓별 플래그 두 줄 분리 (True/False) |
| `c8d5662` | patch v3 — 이메일 설명 일원화, `market_code` 출처, Path D 병합, 발췌 영문화 |

각 푸시마다 Pages 빌드 상태 조회 + 라이브 바이트 대조 + 신/구 마커 확인.
`llms.txt` 는 `b2ce809` 에서 같은 커밋으로 갱신 (케이스 페이지의 파생물 규칙).

---

# 같은 날 후속 — Decision 01 이 시스템을 틀리게 설명하고 있었다

## 발단

테마 쪽에서 `| t` 이관을 하다 메타필드 Flow 를 검증했고, 그 결과를 케이스에 반영할지 물었다.
오너의 대답이 질문을 바꿨다 — **"이 메타필드랑 플로우도 내가 만든 거니까 pre-order 프로젝트
안에 녹아들어야 하는 것 아닌가."**

맞았다. 덧붙일 문장의 문제가 아니라 **Decision 01 이 틀린 문제**였다.

## 무엇이 틀렸나

케이스는 세 번째 조건을 이렇게 썼다.

> *"Someone opted this variant in, for this market. A per-variant metafield, **set in Shopify admin**."*

실제로는 사람이 손으로 켜지 않는다. 오너가 만든 Flow
(`Pre-order setting for CA and US`, `Product variant inventory quantity changed` 트리거)가
로케이션별 재고를 보고 쓴다 — `available <= 0 && CONTINUE` → pre-order.

**그렇게 쓰는 순간 그 아래 있던 설계 논거가 통째로 사라진다.** Liquid 는 스토어 전체 재고
숫자 하나만 받는데 CA/US 는 서로 다른 로케이션에서 나간다. 페이지는 "*이* 마켓이 품절인가"를
물어볼 방법 자체가 없다 — 손에 쥔 숫자가 애초에 틀린 숫자다. 그래서 로케이션별 재고가 보이는
곳에서 계산해 variant별·마켓별로 써 둔다. **메타필드는 페이지에 남기는 메모가 아니라,
페이지가 볼 수 없는 "마켓을 아는 재고" 그 자체다.**

사람이 내리는 머천다이징 결정은 메타필드가 아니라 `inventory_policy` 였다. trade-off 논지는
그대로 살고 대상만 옮기면 됐다 (오너 확인: CONTINUE 는 상품별 의도적 결정이 맞다).

부수 효과가 좋았다 — Decision 05 의 크로스마켓 실패(Path D)가 이제 **케이스가 이미 세워놓은
구조 위에서** 읽힌다. 전에는 마켓이 둘이라는 사실이 05 에서 처음 등장했다.

## 그리고 그 수정이 새 논리 오류를 만들었다 (재검토에서 잡음)

조건 3 을 "It is out of stock in **this** market" 으로 바꾸면서 기존 조건 1
"The variant is out of stock" 을 그대로 뒀다. 바로 아래 문단이 **"두 마켓은 서로 다른 재고를
들고 있다"** 고 말하므로, **CA 가 비고 US 는 출고되는 상황에서 조건 3 은 참인데 조건 1 은
거짓**이 된다. 페이지는 "세 조건이 모두 합의해야 한다"고 하니, **이 케이스의 대표 시나리오가
자기 규칙에 걸려 탈락**하고 있었다.

→ **두 조건**으로 줄였다. 스토어프론트가 실제로 검사하는 것도 둘뿐이다
(`inventory_policy` + 마켓 플래그).

**교훈: 참인 사실을 추가하는 수정이 거짓인 규칙을 만들 수 있다.** 새 조건만 검토하고 기존
목록과의 상호작용을 안 봤다. 어떤 자동 검사로도 안 잡힌다 — 절 전체를 산문으로 다시 읽어야
보였다. "한번 더 읽어보고 줄일 부분 짚어줘"가 아니었으면 그대로 배포돼 있었을 것이다.

## 나머지 재검토 5건

- **§5 What shipped 통째 삭제.** Decision 01·03·04 를 세 문장으로 되풀이했고, 첫 문장은 §3 과
  거의 같은 말이었다 (`no app, no separate checkout, no data leaving Shopify`).
  **`SECTION-NAV.md` 가 이미 같은 결론에 도달해 있었다** — "5 · WHAT SHIPPED 는 넣지 않는다,
  짧고 Decisions 의 연장으로 읽힌다". 목차에서 빼둔 절이면 본문에서도 물을 만하다.
- **섹션 재배열 2–6.** 본문의 `section 6` 참조도 따라갔다.
- **§5(구 6장)** 이 Decision 05 를 두 화면 뒤에서 축약 재방송하던 부분 삭제.
- `"Two choices inside that are worth naming."` 삭제 — 네 문단을 끌고 있었다.
- **§6(구 7장)** 에서 `Order status in the account area` 제거. 나머지 다섯은 전부 본문에서
  실제로 부딪힌 것에서 나오는데 이것만 일반적 희망사항이었다.

2,816 → **2,702 단어**.

## 섹션 번호를 바꾸면 따라와야 하는 것

- `llms.txt` — "Three conditions" → "Two" (케이스 페이지의 파생물, 같은 커밋 규칙)
- **`ASSETS.md`** — `03 §3·§5·§6` 처럼 **work-3 섹션을 번호로 참조**한다. 섹션을 지우면
  조용히 어긋난다. 번호를 건드릴 때 같이 볼 것.

## 커밋

| SHA | 내용 |
|---|---|
| `953fd77` | Decision 01 이 숨기던 설계 복원 (메타필드 = 마켓을 아는 재고) |
| `def793b` | 재검토 6건 — 논리 오류, §5 삭제, 재배열, 축약 |

## 남은 것 (스토어 쪽, 이 레포 밖)

`#AT10745`·`#AT10761`(속성 없이 태그만), **Defect 4** — 온라인 출고 로케이션 6개 중 Flow 는
1개만 센다. 창고들(`Richmond Centre Warehouse` 등)이 CA 마켓을 서빙한다면, 재고가 있는데
"기다리세요"라고 하는 오탐이 남아 있다. **이 케이스가 다루는 오탐과 정확히 같은 유형이다.**
