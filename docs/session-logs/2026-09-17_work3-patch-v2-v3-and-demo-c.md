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
