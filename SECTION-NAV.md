# SECTION NAV — 케이스 페이지 좌측 가이드

> Claude Code 작업 지시서. 케이스 페이지(`work-1.html` ~ `work-3.html`)에만 적용.
> index.html 과 about.html 에는 넣지 않습니다.

---

## 왜 필요한가

케이스 하나가 6~8스크린이고 섹션이 7개입니다. 읽는 사람이 지금 어디쯤인지, 무엇이 남았는지
알 수 있어야 하고, 결과 섹션만 먼저 보고 싶은 사람에게 점프 수단이 필요합니다.

**장식이 아니라 긴 문서를 읽기 위한 장치입니다.** 그 기준을 넘는 기능은 넣지 마세요.

---

## 배치

**좌측 고정.** 본문 왼쪽 여백에 `position: sticky`. 우측(스크롤바 옆)에 두지 않습니다 —
스크롤바와 클릭 타깃이 간섭하고, 좌→우 읽기에서 좌측이 시선이 지나가는 자리입니다.

```
┌──────────────┬────────────────────────────────┐
│              │                                │
│  ─ Problem   │   본문                          │
│  ─ Research  │                                │
│  ━ Decisions │                                │
│      01 ●    │                                │
│      02 ○    │                                │
│      03 ○    │                                │
│      04 ○    │                                │
│      05 ○    │                                │
│  ─ Outcome   │                                │
│  ─ Next      │                                │
│              │                                │
└──────────────┴────────────────────────────────┘
```

---

## 항목

**5개만.** HERO 와 WHAT'S NEXT 의 하위는 넣지 않습니다.

| 라벨 | 앵커 | 대상 섹션 |
|---|---|---|
| Problem | `#problem` | `## 2 · THE PROBLEM` |
| Research | `#research` | `## 3 · WHAT I FOUND` |
| Decisions | `#decisions` | `## 4 · DECISIONS` |
| Outcome | `#outcome` | `## 6 · OUTCOME` (03은 `WHAT I CAN AND CAN'T CLAIM`) |
| Next | `#next` | `## 7 · WHAT'S NEXT` |

`## 5 · WHAT SHIPPED` 는 목차에 넣지 않습니다. 짧고, Decisions 의 연장으로 읽힙니다.

**섹션 제목을 그대로 쓰지 말고 위 짧은 라벨을 쓰세요.** 사이드바 폭에 맞아야 합니다.

---

## Decisions 하위 확장

현재 위치가 Decisions 구간일 때 **그 아래에만** 결정 번호가 펼쳐집니다.

- **번호만.** 01 PDP 는 5개, 02·03 은 4개. 결정 제목은 넣지 않습니다 — 제목이 길어서
  (`"Removing the review section, then putting it back differently"`) 사이드바에 안 들어갑니다
- **스크롤 위치에 반응.** 호버로 여닫지 않습니다
- Decisions 구간을 벗어나면 접힙니다
- 확장·축소에 높이 애니메이션을 넣지 마세요. 스크롤 중 레이아웃이 흔들립니다.
  opacity 전환만 사용

---

## 상태

| 상태 | 표시 |
|---|---|
| 현재 섹션 | 라벨 진하게, 왼쪽 마커 굵게 |
| 그 외 | 흐리게 (본문 대비 40~50%) |
| 호버 | 색만 살짝 진하게. 크기·위치 변화 없음 |
| 포커스 | 가시적 포커스 링 필수 |

---

## 반응형

| 폭 | 동작 |
|---|---|
| ≥ 1200px | 좌측 사이드바 표시 |
| < 1200px | **사이드바 숨김.** 상단에 2~3px 스크롤 진행 바로 대체 |

모바일에서 사이드 목차는 어디에 놓아도 본문을 방해합니다. 진행률만 보여주세요.

---

## 접근성 — 필수

```html
<nav aria-label="On this page">
  <ol>
    <li><a href="#problem">Problem</a></li>
    <li><a href="#decisions" aria-current="location">Decisions</a></li>
    ...
  </ol>
</nav>
```

- **실제 앵커 링크(`<a href="#...">`)로 구현.** JS 스크롤만 쓰면 키보드 이동과
  새 탭 열기가 동작하지 않습니다
- 현재 항목에 `aria-current="location"`
- 각 대상 섹션에 `id` 와 `scroll-margin-top` 부여 (헤더에 가리지 않게)
- `scroll-behavior: smooth` 는 `prefers-reduced-motion: reduce` 에서 해제

---

## 구현

IntersectionObserver 하나. 20줄 내외입니다.

```js
// 화면 중앙을 기준으로 현재 섹션 판정 / activate at viewport middle
const observer = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) setActive(entry.target.id);
  }),
  { rootMargin: '-40% 0px -55% 0px' }
);
```

**`rootMargin` 이 핵심입니다.** 기본값으로 두면 섹션이 화면에 진입하자마자 활성화돼서
스크롤 중 목차가 계속 깜빡입니다. 화면 중앙을 지날 때 전환되도록 위아래를 잘라내세요.

스크롤 이벤트 + `getBoundingClientRect()` 방식은 쓰지 마세요. 매 프레임 레이아웃을
읽어서 스크롤이 버벅입니다.

---

## 넣지 말 것

- **커서를 따라다니는 라벨** — 읽기를 방해하고, 모바일에 존재하지 않으며,
  포트폴리오 과잉 장식의 전형입니다
- **호버로 열리는 확장 패널** — 마우스가 지나가기만 해도 열려서 스크롤과 싸웁니다
- 결정 제목을 사이드바에 노출
- 진행률 원형 인디케이터, 커스텀 커서, 마그네틱 효과
- 섹션 전환 시 사이드바 자체의 이동·스케일 애니메이션

이 사이트의 논지는 "무엇이 공간을 차지할 자격이 있는가"입니다. 내비게이션이 그 기준을
스스로 어기면 안 됩니다.

---

## 완료 기준

- [ ] 앵커 링크로 동작 — 키보드 Tab 이동, 새 탭 열기 가능
- [ ] 현재 섹션에 `aria-current="location"`
- [ ] Decisions 구간에서만 번호 펼침(케이스별 4~5개), 벗어나면 접힘
- [ ] 스크롤 중 활성 항목이 깜빡이지 않음
- [ ] 1200px 미만에서 사이드바 숨김, 진행 바로 대체
- [ ] `prefers-reduced-motion` 존중
- [ ] 앵커 이동 시 섹션 제목이 헤더에 가리지 않음
- [ ] JS 30줄 미만
