# BUILD PLAN — Interactive demos

> Claude Code 작업 지시서. 사이트 콘텐츠가 아닙니다.
> A work order for Claude Code, not site content.

---

## 0 · 우선순위 경고 / Read this first

인터랙티브 데모는 **차별점**이지 필수 요건이 아닙니다. JD 필수 요건은 Figma 파일과
사용성 테스트입니다. 시간이 부족하면 **데모 A 하나만** 만들고 나머지는 정적 이미지로
가세요. 데모 3개보다 Figma 파일 하나가 서류 통과에 더 직접적입니다.

권장 순서: Figma(3h) → 사용성 테스트(3h) → 데모 A → 데모 C → 데모 B

---

## 1 · 원칙

**데모는 UI 재현이 아니라 결정을 만질 수 있게 만드는 것.**
그냥 예쁘게 생긴 컴포넌트를 놓는 게 아니라, 산문으로 설명하면 세 문단 걸리는 판단을
토글 세 번으로 이해시키는 게 목적입니다. 그 기준을 통과하지 못하는 건 정적 이미지로.

**데모는 3개. 그 이상 만들지 말 것.**

| | 데모 | 증명하는 것 | 들어갈 곳 |
|---|---|---|---|
| **A** | PET 배지 확장 | 인터랙션 디자인, progressive disclosure | 01 Dec 04 · 02 Dec 03 |
| **B** | 스크롤 착시 토글 | 측정 해석 — 같은 숫자, 다른 결론 | 02 §6 Scroll |
| **C** | 프리오더 상태 리졸버 | 시스템 로직, 조건 설계 | 03 Dec 01 |

**인터랙티브로 만들지 말 것:** PDP/PLP 전체 페이지, Pairs Well With 섹션, 리뷰 조건부
렌더링, 카운터. 전부 정적 이미지로 충분합니다.

---

## 2 · 공용 셸 / Shared demo shell

세 데모가 **같은 껍데기**를 씁니다. 먼저 이걸 만들고 안을 갈아끼우세요.

```
┌─ .demo ─────────────────────────────────┐
│  .demo__label      Try it               │  ← 조작 가능하다는 신호
│  .demo__caption    한 줄 안내            │
│  ┌─ .demo__stage ─────────────────────┐ │
│  │   결과물이 렌더되는 곳              │ │
│  └────────────────────────────────────┘ │
│  ┌─ .demo__controls ──────────────────┐ │
│  │   토글 / 슬라이더                   │ │
│  └────────────────────────────────────┘ │
│  <details> Liquid 원본 발췌 </details>   │  ← 접힌 상태가 기본
└─────────────────────────────────────────┘
```

**규칙**

- `.demo` 내부 CSS는 전부 `.demo` 하위로 스코프. 사이트 전역 스타일과 절대 섞지 말 것
- 상품 이미지는 회색 플레이스홀더(`#e5e5e5` 블록). 미피는 라이선스 IP
- 데모 안의 링크는 `pointer-events: none`. 클릭해서 밖으로 나가면 안 됨
- `prefers-reduced-motion: reduce` 시 transition 제거
- 모바일에서 반드시 동작. 호버 전용 금지
- Liquid 발췌는 **10–15줄**. 전체 파일 붙이지 말 것

---

## 3 · 데모 A — PET 배지 확장

**들어갈 곳**
`01-pdp-revamp.md` → `### 04 — Putting the brand on the product photo`
→ **The badge had to work at two sizes** 문단 바로 아래
`02-plp-revamp.md` → `### 03 — Deliberately unclickable`
→ 코드 블록(`Default / Expanded`)을 이 데모로 **대체**

**캡션**
> Hover or tap the badge. It expands in place and never navigates.

**동작**

```
default    [ 🍶 × 2 ]
expanded   [ 2 bottles upcycled ]
```

- 데스크톱: `:hover`
- 모바일: 탭 — 숨긴 checkbox + `:checked`, 또는 `:focus-within`
- **JS 0줄로 가능**

```css
.demo .badge__full { max-width: 0; overflow: hidden; transition: max-width .25s; }
.demo .badge:hover .badge__full,
.demo .badge__toggle:checked ~ .badge__full { max-width: 12rem; }
```

**두 크기 다 보여줄 것.** 카드 위(작게)와 미디어 위(크게)를 나란히. 같은 컴포넌트가
두 맥락에서 동작한다는 게 이 데모의 논점입니다.

---

## 4 · 데모 B — 스크롤 착시 토글 ⭐

**들어갈 곳**
`02-plp-revamp.md` → `### Scroll: the one solid result`
→ **Corrected for length** 문단 바로 아래

**캡션**
> Same number, two conclusions. Toggle the view.

**컨트롤**

```
View as:   [ Percentage ]   [ Actual distance ]
```

**출력** — 막대 두 개, 원본 / 리디자인

| 보기 | 원본 | 리디자인 | 결론 |
|---|---|---|---|
| Percentage | 37.74% | 37.76% | 높이 동일 — "아무 변화 없음" |
| Actual distance | 기준 | +9.4% | 리디자인이 눈에 띄게 길어짐 |

리디자인 페이지가 **9.5% 더 길다**는 걸 막대 아래 라벨로 표시. 토글하면 같은 데이터가
절대 거리로 다시 그려지면서 결론이 뒤집힙니다.

**상태 아래 한 줄을 같이 렌더**하세요:
- Percentage: *"Scroll depth is a share of page length. Nothing appears to have changed."*
- Actual distance: *"The redesigned page is 9.5% longer. The same share is more scrolling."*

**왜 이 데모가 중요한지:** 이 포트폴리오 전체의 주제가 "결과가 무엇을 증명하는지에
신중하다"입니다(About 마지막 문장). 그런데 그 주제를 조작 가능하게 만든 데모가 없었습니다.
이게 그 자리를 채웁니다. 그리고 01 PDP 에서는 같은 함정을 반대 방향으로 다뤘으므로
(페이지가 4배 짧아져 스크롤 뎁스가 부풀 수 있음), 데모 아래 한 줄로 그 대비를 언급하면
두 케이스가 방법론으로 묶입니다.

CSS transition 으로 막대 높이만 전환. JS 10줄 내외.

## 5 · 데모 C — 프리오더 상태 리졸버 ⭐

**들어갈 곳**
`03-preorder-experience.md` → `### 01 — Deciding what a promise is made of`
→ 기존 Liquid 코드 블록을 이 데모로 **대체**. 코드는 `<details>` 안으로 이동

**캡션**
> Three conditions decide what this button can promise. Change them.

**컨트롤**

| 컨트롤 | 값 |
|---|---|
| Inventory policy | `Deny` / `Continue` |
| Market | `CA` / `US` |
| Opted in for this market | `off` / `on` |
| Stock | `0` / `3` |

**출력**

```
[  Pre-order now  ]
Pre-order today. Your order is reserved and will ship within 2–3 weeks.
```

**리졸브 규칙**

```
stock > 0                                   → Add to cart
stock = 0 · policy Deny                     → Sold out (disabled)
stock = 0 · policy Continue · opted in      → Pre-order + 안내 문구
stock = 0 · policy Continue · not opted in  → Sold out (disabled)
```

**핵심 연출:** Market을 CA↔US로 바꿨을 때 같은 variant가 다른 상태가 되도록.
"약속은 시장마다 다르다"는 Decision 01의 논점이 조작 한 번으로 전달됩니다.

**상태 아래 한 줄 설명을 같이 렌더**하세요. 예: *"Selling past zero is allowed, but this
variant hasn't been opted in for CA."* — 왜 그 상태가 나왔는지가 보여야 데모가 논증이
됩니다.

JS 20–30줄. 상태 머신 하나면 충분합니다.

---

## 6 · 히어로 프레임 (데모와 별개)

**01만** 데스크톱+모바일 프레임 스냅샷. 02·03은 정적 이미지 또는 텍스트 히어로.

```html
<div class="frame frame--desktop">
  <div class="frame__scroll"><img src="..."></div>
</div>
```

- 고정 높이 + `overflow-y: auto` — 긴 페이지가 프레임 안에서만 스크롤
- 모바일 프레임이 **앞에 크게**, 데스크톱은 뒤에. PDP는 74%가 모바일이었다는 게 케이스의
  전제이므로 반대로 놓으면 내용과 어긋남
- 캡처는 상단 뷰포트 1~2화면분이면 충분

---

## 7 · 작업 순서

| | 작업 | 예상 |
|---|---|---|
| 1 | 공용 셸 `.demo` + 스코프 CSS | 45분 |
| 2 | 데모 A (배지) — 두 크기 | 30분 |
| 3 | 데모 C (리졸버) | 60분 |
| 4 | 데모 B (스크롤 착시) | 40분 |
| 5 | 히어로 프레임 (01) | 60분 |

셸을 먼저 완성하고 하나씩 채우세요. A를 먼저 하는 이유는 가장 쉽고, 되는 걸 눈으로
확인해야 나머지 판단이 서기 때문입니다.

---

## 8 · 완료 기준 / Acceptance

- [ ] 세 데모 모두 **모바일 탭으로 동작** (호버 전용 아님)
- [ ] 데모 CSS가 전역 스타일에 새어나가지 않음
- [ ] `prefers-reduced-motion` 존중
- [ ] 데모 안의 링크가 밖으로 나가지 않음
- [ ] 각 데모에 캡션 한 줄 — 조작 가능하다는 신호
- [ ] Liquid 발췌는 `<details>` 안, 10–15줄
- [ ] 상품 이미지 없음 (회색 플레이스홀더)
- [ ] JS 총량 50줄 미만
- [ ] 키보드로 조작 가능, 포커스 링 보임

---

## 9 · 선행 작업 / Before writing any demo code

`snippets/buy-buttons.liquid` 의 하드코딩된 문자열을 먼저 고치세요:

```liquid
elsif is_inventory_preorder
  echo 'Pre-order now'        # ← 로케일 파일로 뺄 것
```

데모 C에 Liquid 발췌를 실을 건데, 마켓별로 분기하는 로직 안에서 문자열만 마켓을
안 따라가는 상태입니다. 면접에서 코드를 보여줄 때 지적당하기 딱 좋은 자리입니다.
