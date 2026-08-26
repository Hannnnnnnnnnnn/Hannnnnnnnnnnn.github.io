/* B 패스: 스크롤 리빌 + 히어로 글자 등장 + 커서 반전 블롭
   B pass: scroll reveal, hero letter entrance, difference-blend cursor blob
   라이브러리 없음 / no libraries */

/* CSS가 콘텐츠를 숨기고 이 파일이 되돌리는 구조라, 여기서 예외가 나면 페이지가
   백지로 남는다. 기능 하나가 죽어도 나머지는 살고, 최악의 경우 html.js 를 떼어
   전부 그냥 보이게 만든다.
   CSS hides content and this file reveals it, so a throw here would leave the page
   blank. Each feature is isolated; on failure we drop html.js so everything shows. */
const run = (fn) => {
  try { fn(); }
  catch (e) { console.error("[portfolio]", e); document.documentElement.classList.remove("js"); }
};

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── 1. 히어로 글자를 낱자로 쪼개 무작위 순서로 등장 ──
   Split the hero into letters, reveal them in random order.
   낱자 span은 스크린리더가 한 글자씩 읽으므로 aria로 원문을 보존
   Letter spans would be read one-by-one, so the original text is kept in aria-label */
run(() => {
  const display = document.querySelector(".display");
  if (!display || reduce) return;
  const text = display.textContent.trim();
  display.setAttribute("aria-label", text);
  const chars = [...text];
  const order = [...chars.keys()].sort(() => Math.random() - 0.5);
  display.innerHTML = chars
    .map((ch, i) => `<span class="ltr" aria-hidden="true" style="--i:${order[i]}">${ch === " " ? "&nbsp;" : ch}</span>`)
    .join("");
  // rAF는 백그라운드 탭에서 안 돌아 히어로가 영영 숨겨짐 — setTimeout 사용
  // rAF never fires in a background tab, which would strand the hero — use setTimeout
  setTimeout(() => display.classList.add("is-in"), 0);
});

/* ── 2. 스크롤 진입 리빌 ──
   IntersectionObserver 단독에 의존하지 않는다: 숨은 탭에서는 콜백이 오지 않아
   opacity:0 인 콘텐츠가 영구히 안 보이게 된다.
   Never gate visible content on IO alone — a hidden tab delivers no callbacks,
   which would strand opacity:0 content forever. */
run(() => {
  const targets = document.querySelectorAll(".rows li, .section-head, .hero-caption, .prose > *");
  if (!targets.length || reduce) return;
  const show = (el) => el.classList.add("is-in");
  const inView = (el) => {
    const r = el.getBoundingClientRect();
    return r.top < innerHeight * 0.9 && r.bottom > 0;
  };
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }),
    { rootMargin: "0px 0px -10% 0px" }
  );
  targets.forEach((el) => io.observe(el));

  const sweep = () => targets.forEach((el) => { if (inView(el)) show(el); });
  setTimeout(sweep, 0);                                  // 첫 화면분 / above the fold
  document.addEventListener("visibilitychange", sweep);  // 탭이 살아나면 재확인 / re-check on wake
});

/* ── 3. 커서 블롭 — 히어로 타이포 위에서만 ──
   Cursor blob, only over the hero type.
   mix-blend-mode: difference 는 "아래 있는 것을 반전"시키는 효과라, 반전할 대상이 없는
   여백 위에서는 흰 원이 흰 배경과 연산되어 그냥 검은 원이 된다. 이 레이아웃은 대부분이
   여백이므로 글자 영역 안에 있을 때만 보이게 제한한다.
   difference inverts what is beneath it; over empty white there is nothing to invert and
   the blob reads as a stray black disc. This page is mostly whitespace, so it is limited
   to the letterforms. */
run(() => {
  if (reduce || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const display = document.querySelector(".display");
  if (!display) return;   // 히어로가 없는 페이지(About, 작업 상세)에는 아예 붙지 않음

  const blob = document.createElement("div");
  blob.className = "cursor-blob";
  document.body.appendChild(blob);

  // 글자 상자들의 합집합으로 판정 — h1 블록 상자를 쓰면 글자 오른쪽 빈 공간까지 포함된다
  // Test against the letters' union, not the h1 block box, which extends past the text
  const overType = (x, y) => {
    const ls = display.querySelectorAll(".ltr");
    if (!ls.length) return false;
    const a = ls[0].getBoundingClientRect();
    const b = ls[ls.length - 1].getBoundingClientRect();
    return x >= a.left && x <= b.right && y >= a.top && y <= a.bottom;
  };

  let x = 0, y = 0, queued = false;
  addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    if (queued) return;
    queued = true;
    // pointermove 는 탭이 보일 때만 발생하므로 여기선 rAF 가 안전
    // pointermove only fires while visible, so rAF is safe here
    requestAnimationFrame(() => {
      queued = false;
      blob.style.setProperty("--x", x + "px");
      blob.style.setProperty("--y", y + "px");
      blob.style.opacity = overType(x, y) ? "1" : "0";
    });
  }, { passive: true });

  addEventListener("blur", () => { blob.style.opacity = "0"; });
});

/* ── 4. 감쇠 스크롤 (데스크탑 전용) ──
   Damped scroll, desktop only.

   실제 스크롤 위치(window.scrollTo)를 움직인다. 콘텐츠를 transform 으로 미는 방식이
   더 흔하지만 그러면 position: sticky 헤더가 죽는다.
   Moves the real scroll position. The commoner transform-based approach would kill the
   sticky header.

   ⚠️ 이 블록은 접근성 비용을 알고 넣은 것이다 — 스크롤이 입력을 즉시 따라가지 않으므로
   빠르게 훑는 사용자에게는 반응이 굼뜨게 느껴질 수 있다. 빼려면 이 run(...) 하나를 지우면
   되고 나머지 동작에는 영향이 없다.
   Deliberate accessibility cost. Delete this one run(...) to remove it; nothing else
   depends on it. */
run(() => {
  if (reduce) return;                                                  // 모션 최소화 존중
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return; // 터치는 네이티브 관성 유지

  const EASE = 0.12;
  let target = scrollY, current = scrollY, running = false;
  const maxScroll = () => document.documentElement.scrollHeight - innerHeight;

  const tick = () => {
    current += (target - current) * EASE;
    if (Math.abs(target - current) < 0.5) { current = target; running = false; }
    else requestAnimationFrame(tick);
    window.scrollTo(0, current);
  };

  // deltaMode 정규화 — 휠 마우스는 줄(1), 일부는 페이지(2) 단위로 보고한다
  // Normalise deltaMode: wheel mice report lines (1), some report pages (2)
  const px = (e) => e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;

  addEventListener("wheel", (e) => {
    if (e.ctrlKey) return;              // 핀치 확대는 건드리지 않음 / leave pinch-zoom alone
    e.preventDefault();
    target = Math.max(0, Math.min(maxScroll(), target + px(e)));
    if (!running) { running = true; requestAnimationFrame(tick); }
  }, { passive: false });

  // 휠이 아닌 스크롤(키보드, 스크롤바 드래그, 앵커 이동, 포커스 이동)은 가로채지 않고
  // 목표값만 재동기화한다 — 그래야 Space/PageDown/Tab 이 평소대로 동작한다
  // Non-wheel scrolling is never intercepted, only resynced, so keyboard and anchors work
  addEventListener("scroll", () => { if (!running) { target = current = scrollY; } }, { passive: true });
});
