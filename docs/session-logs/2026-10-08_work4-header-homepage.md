# 2026-10-08 — work-4 헤더 & 홈페이지 케이스 (링크 없이 공개)

- 출처 테마: 드래프트 `188488679728` (`2026_10_xx_HP layout`), `188817080624` (`… + header update`).
  값은 `sections/header.liquid`(브랜치 `feature/header-liquid-glass`)와 드래프트 1512px 실측.
- 수치: GA4 (홈 체류·모듈 목적지 비율·기기별 세션/구매/매출). 절대 볼륨은 싣지 않았다.
  홈 캐러셀 클릭 이벤트가 GA4 에 없어서 "홈 → 목적지 페이지" 비율을 상한으로 썼다.
- 외부 근거: Runyon 2013, NN/g auto-forwarding 2013, scrolling 2018, hamburger 2016,
  glassmorphism 2024, liquid glass 2025. 1차 출처에서 확인(Runyon 첫 슬라이드 비율은 2차 출처들의
  84% 가 아니라 원문 89.1%).
- 디자인 결정의 이유는 소유자 답변만 실었다. 이유가 없는 결정(다크→화이트, 각진 모서리, 스크롤
  연동, sticky ATC 가 늦게 뜨는 것)은 사실만 적었다.
- 같은 세션에 테마도 바꿨다: 터치 기기에서 모든 유리 면 80% 고정(`6cca7fc`). 굴절 박스 45% 가
  검은 배경 위 4.1:1 로 AA 미달이었던 것이 계기. 케이스 Dec 02 가 이 내용을 쓴다.
- 로컬 서버는 이번에도 확장이 붙지 못해(`chrome-error://`) push 후 라이브에서 검증했다.
- 남은 것: 히어로 녹화 2개(`images/04-header/hero-{mobile,desktop}.mp4`, 소유자가 준다).
