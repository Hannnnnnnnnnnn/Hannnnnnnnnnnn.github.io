/* 스크롤 리빌 + 히어로 글자 등장 + 커서 리빌 + 감쇠 스크롤
   Scroll reveal, hero letter entrance, cursor reveal, damped scroll
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

/* ── 3. 커서 리빌 — 히어로를 반전판으로 뚫어 보여준다 ──
   Cursor reveal: punches through to an inverted copy of the hero.

   구조는 참조 사이트와 같다. base(흰 배경 + 검은 글자) 위에 reveal(검은 배경 + 흰 글자)을
   겹치고, 커서가 지나간 자리만 마스크로 열어 준다. 그쪽은 그 마스크를 Three.js 유체
   셰이더로 그린다.

   ⚠️ radial-gradient 는 이름 그대로 원이다. 커서를 쫓는 점 몇 개로 만들면 커서가 멈춘
   순간 전부 한 자리에 수렴해 **가만히 있는 원**이 남는다. 그래서 (a) 쫓아가는 점이 아니라
   실제 커서 경로를 샘플링해 획을 만들고, (b) 멈추면 잉크가 마르듯 걷어낸다. 원이 화면에
   머무를 수 있는 상태를 없애는 것이 요점이다.
   Gradients are circles; followers all converge when the pointer stops, leaving a static
   disc. So sample the actual path instead, and dry the ink when movement stops. */
run(() => {
  if (reduce || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  // 마스크 미지원 브라우저에서는 아예 만들지 않는다 — 만들면 검은 판이 통째로 덮인다
  if (!CSS.supports("mask-image", "radial-gradient(#000, #000)")) return;

  const hero = document.querySelector(".hero");
  const display = hero && hero.querySelector(".display");
  if (!hero || !display) return;

  // 잉크 필터. 필터는 마스크보다 **먼저** 적용되므로 .hero-reveal 자신에 걸면 소용이 없다.
  // 마스크가 끝난 결과를 감싸는 래퍼에 걸어야 마스크 경계가 변형된다.
  // Filters run before masking, so it must sit on a wrapper around the masked result.
  // 참조가 해석되지 않는 브라우저에서는 필터가 무시될 뿐 — 원래 모양으로 남는다(안전한 폴백).
  document.body.insertAdjacentHTML("beforeend",
    '<svg class="ink-defs" aria-hidden="true" focusable="false">' +
    '<filter id="hero-ink" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>' +
      // 알파를 세게 밀어 임계값을 만든다 → 흐린 원들이 하나의 덩어리로 합쳐진다
      // Push alpha hard to threshold it, merging the blurred circles into one mass
      '<feColorMatrix in="blur" type="matrix" result="goo" ' +
        'values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 17 -6"/>' +
      // 난류로 경계를 흔들어 원의 흔적을 지운다 / turbulence breaks up the circular edge
      '<feTurbulence type="fractalNoise" baseFrequency="0.006 0.085" numOctaves="2" seed="9" result="noise"/>' +
      '<feDisplacementMap in="goo" in2="noise" scale="17" xChannelSelector="R" yChannelSelector="G"/>' +
    '</filter></svg>');

  const ink = document.createElement("div");
  ink.className = "hero-ink";
  const reveal = document.createElement("div");
  reveal.className = "hero-reveal";
  reveal.setAttribute("aria-hidden", "true");   // 시각용 사본, 스크린리더에는 원본만
  const clone = display.cloneNode(true);
  clone.classList.add("is-in");                 // 사본은 등장 애니메이션 없이 최종 상태로
  reveal.appendChild(clone);
  ink.appendChild(reveal);
  hero.appendChild(ink);

  const LIFE = 520;    // 획 한 점이 남아 있는 시간(ms) / how long a stroke point lives
  const IDLE = 200;    // 이 시간 이상 안 움직이면 마르기 시작 / ink starts drying
  const STEP = 6;      // 촘촘해야 융합 후 리본이 된다 / dense enough to fuse into a ribbon
  const MAX = 30;

  let trail = [], lastMove = 0, inside = false, running = false;

  const frame = () => {
    const now = performance.now();
    trail = trail.filter((p) => now - p.t < LIFE);
    const moving = now - lastMove < IDLE;

    if (!inside || (!moving && !trail.length)) {
      ink.style.opacity = "0";
      running = false;
      return;                                   // 남은 점이 없으면 루프를 멈춘다
    }

    // 오래된 점일수록 작고 옅게 → 획이 꼬리 쪽으로 가늘어진다
    // Older points are smaller and fainter, so the stroke tapers
    reveal.style.maskImage = trail
      .map((p) => {
        const a = 1 - (now - p.t) / LIFE;
        // 꼬리로 갈수록 가늘어진다 — 붓을 떼는 느낌 / tapers toward the tail
        const rad = p.w * (0.5 + 0.5 * a);
        return `radial-gradient(circle ${rad.toFixed(0)}px at ${p.x.toFixed(0)}px ${p.y.toFixed(0)}px, rgba(0,0,0,${(0.5 + 0.5 * a).toFixed(2)}) 0%, rgba(0,0,0,${(0.35 + 0.45 * a).toFixed(2)}) 60%, transparent 100%)`;
      })
      .join(",");
    ink.style.opacity = "1";
    requestAnimationFrame(frame);
  };

  addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!over) { inside = false; return; }

    // 마스크 좌표는 요소 기준이므로 뷰포트 좌표에서 변환 / mask coords are element-local
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const last = trail[trail.length - 1];
    if (!last || Math.hypot(x - last.x, y - last.y) >= STEP) {
      const now = performance.now();
      // 같은 거리(STEP)를 지나는 데 걸린 시간이 곧 속도의 역수다.
      // 빨리 그으면 가늘고 천천히 그으면 굵게 — 실제 붓이 하는 일.
      // Time to cover a fixed distance is the inverse of speed: fast strokes thin out.
      const dt = last ? Math.min(80, now - last.t) : 26;
      trail.push({ x, y, t: now, w: 15 + 33 * Math.min(1, dt / 55) });
      if (trail.length > MAX) trail.shift();
    }
    inside = true;
    lastMove = performance.now();
    if (!running) { running = true; requestAnimationFrame(frame); }
  }, { passive: true });

  addEventListener("blur", () => { inside = false; trail = []; });
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
