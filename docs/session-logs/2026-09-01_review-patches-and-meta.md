# 2026-09-01 · 리뷰 패치 5개 적용 + 케이스 메타 정리

`~/Downloads/files/` 의 리뷰 패치 5개(`git am` 형식)를 적용하고, 히어로 지표와
`.meta` 목록을 손봤다. 커밋 9개, `dabd33f → 7eb886e`.

| 커밋 | 내용 |
|---|---|
| `9716cae` | work-1 히어로 `+51% scroll depth` → `−53% dead click rate`, caveat 에 절대값 |
| `cf34372` | work-2 히어로 `0 metrics worsened` → `58% badge exposure`, caveat 에 절대값 |
| `076eb7e` | 5페이지 og/twitter/canonical + `images/og/*.png` 5장 (1200×630) |
| `7b98314` | 케이스 하단 다음-케이스 카드 (`01→02→03→01`) |
| `1003648` | `--muted` `#8f8f8f` → `#6b6b6b` |
| `8868390` | `Year` → `Role`/`Team`/`Timeline` |
| `2e82406` | 0004 의 TODO 3곳 확정 |
| `18c8c15` | `Team` 행 제거 |
| `7eb886e` | `Status` 행 제거 |

메타 목록 최종: `Client · Role · Timeline · Tools`.

## 실제로 밟은 함정

**1. `git am` 은 로컬 `user.email` 을 무시하고 패치의 author 를 그대로 쓴다.**
이 저장소는 CLAUDE.md 대로 local git 신원을 `Hannnnnnnnnnnn` 으로 덮어써 두는데,
패치 5개의 author 가 `Han Kim <hanbyoul.kim91@gmail.com>` 이라 `git am` 이 그 이름으로
커밋을 만들었다. **잔디가 포트폴리오 계정에 안 찍힌다** — push 하고 나면 되돌리기가
번거로운 바로 그 상황이다. 첫 패치는 `--amend --reset-author`, 나머지 4개는
`git rebase --exec 'git commit --amend --reset-author --no-edit -q' <base>` 로 고쳤다.
**패치를 받아 적용할 때는 `git log --format='%an <%ae>'` 로 author 를 확인하는 게
push 전 체크리스트에 들어간다.**

**2. Pages 빌드 시간은 페이로드에 비례한다 — 22초는 상수가 아니다.**
og PNG 5장(약 198KB)이 붙은 커밋의 빌드가 **235초** 걸렸다. 평소 20~28초만 보고
있으면 4분짜리 `building` 은 실패로 읽힌다. 실패의 지표는 시간이 아니라 `dur=0` 이다.
(이후 이미지 없는 커밋들은 다시 22초·62초로 돌아왔다.)

**3. `--muted` 대비 개선은 어두운 배경에서 반대로 간다 — 반드시 양쪽을 재라.**
`#8f8f8f` → `#6b6b6b` 는 흰 배경 3.23:1 → **5.33:1** (AA 통과)이지만,
`#0a0a0a` 위에서는 6.12:1 → **3.72:1** 로 내려간다. 지금은 안전하다 —
`--muted` 를 쓰는 요소 중 어두운 면 위에 얹힌 게 없다 (`.demo .resolver__cta`,
`.demo__seg label:has(input:checked)` 는 자체적으로 `color: var(--bg)` 를 지정하고
내부에 `.muted` 자식이 없음). **어두운 블록 안에 muted 텍스트를 새로 넣는 순간
이 커밋이 접근성 회귀가 된다.**

**4. 히어로 지표는 본문이 스스로 무효화하지 않는 것만 올린다 — 0005 의 논지.**
work-1 은 `+51% scroll depth` 를 걸어두고 Decision 02 에서 "페이지가 4배 짧아져
기계적으로 오른 수치"라고 자기가 깎고 있었다. 같은 기준으로 work-2 를 훑으니:
- `+9.4% actual scroll distance` — 깨끗함. 길이 9.5% 증가를 보정한 값이고 노이즈 확률 0.06%.
- `+8.2% product click-through` — 본문이 95% CI `[−18%, +35%]` 라 하고 *"I'd rather say
  that than call +8.2% a win"* 이라고 못박는다. **다만 caveat 이 이미 방어하고 있고
  primary metric 이라 유지.** 대신 절대값(9.05% → 9.80%)을 caveat 에 병기.
- `0 metrics worsened` — 문자 그대로는 참이나 본문이 friction 지표 2개를 노이즈 확률
  **64%·49%** 로 인정한다. 카운트로 단정하면 본문보다 세다 → `58% badge exposure` 로 교체.

**5. work-3 의 기간은 페이지 어디에도 없었다.** 본문의 Oct 2025–Aug 2026 은 반품률
차트지 작업 기간이 아니다. work-1(`Mar–May 2026`)·work-2(`Jun–Aug 2026`)는 본문 측정
창(Feb 25–Mar 31 / Apr 1–May 5, Jul 7–Aug 18)과 대조해 검증됐지만, work-3 은 근거가
없어 소유자에게 물어 `Feb – Mar 2026` 을 받았다. **없는 근거를 추정으로 메우지 않는다.**

**6. `Team` 과 `Status` 는 정보를 구분하지 못해 빠졌다.** 셋 다 `Role: Sole designer…`
바로 아래 `Team: Solo` 라 같은 말이 두 줄이었고, `Status` 는 셋 다 `Shipped` 였다.
출시 여부는 본문이 들고 있다 — work-2 "Shipped. The redesign went into the main deploy.",
work-3 caveat "Shipped solo…", 세 페이지 공통 "5 · What shipped" 섹션.
**work-1 만은 섹션 제목뿐이라 "라이브에 나갔다"는 진술이 본문에 없다 — 미해결.**

## 검증

9개 커밋 전부 push 후 Pages 빌드 `built` 확인, 매번 라이브 파일을 캐시버스터로 받아
로컬과 **바이트 대조**(6개 파일 전부 IDENTICAL). og 이미지 5장 `200` / `1200×630`.
`--muted` 대비는 계산으로 검증(assert). 남은 `TODO` 0개.

## 남은 것

- **LinkedIn Post Inspector 캐시 갱신 5개 URL** — og:image 는 절대 URL 이라 배포 후에만
  미리보기가 잡히고, LinkedIn 은 URL 별로 캐시한다. 세션에서 못 하는 작업.
- work-1 본문에 "실제로 라이브에 나갔다"는 한 문장 (위 6번).
