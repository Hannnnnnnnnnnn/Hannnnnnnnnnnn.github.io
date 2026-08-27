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

/* ── 3. 브러시 리빌 — 붓 자국을 경로에 찍는다 ──
   Brush reveal: stamps a brush tip along the cursor path.

   흰색을 mix-blend-mode: difference 로 얹으면 흰 배경은 검게, 검은 글자는 희게 뒤집힌다.
   따로 반전판을 만들어 마스크로 뚫던 이전 구조와 결과가 같으면서 레이어가 셋 줄었다.
   White under difference inverts the backdrop, giving the same result as the masked
   inverted panel this replaces, with three fewer layers.

   ⚠️ 처음 커서 블롭이 결함으로 보였던 것은 블렌드 탓이 아니라 모양이 **원**이라서였다.
   붓 자국은 원이 아니므로 그 문제가 발생하지 않는다.

   질감은 코드가 아니라 **스탬프 비트맵**에서 나온다. 절차적 노이즈로는 붓털을 못 만든다 —
   초기화 때 붓끝 텍스처를 한 장 그려 두고, 그것을 진행 방향으로 회전시켜 반복해 찍는다.
   페인팅 앱이 쓰는 방식이고, 스캔한 붓끝 PNG 로 갈아끼우면 그대로 더 좋아진다.
   Texture comes from the stamp bitmap, not from code; swap in a scanned tip to improve it. */
run(() => {
  if (reduce || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const hero = document.querySelector(".hero");
  if (!hero || !hero.querySelector(".display")) return;

  /* 붓끝 텍스처 — 결이 x축을 따라 흐른다. 찍을 때 진행 방향으로 회전시키므로
     결이 획을 따라 눕는다. 중간중간 끊긴 붓털이 마른 자국을 만든다.
     Bristles run along x; the stamp is rotated to the direction of travel.
     Gaps between bristles are what read as dry brush. */
  const TIP = 128;
  const tip = document.createElement("canvas");
  tip.width = tip.height = TIP;
  (function paintTip(c) {
    const BRISTLES = 34;
    for (let i = 0; i < BRISTLES; i++) {
      const y = ((i + 0.5) / BRISTLES) * TIP;
      // 붓털마다 길이와 진하기가 다르다. 일부는 아예 짧아 빈 골을 남긴다
      const len = TIP * (0.45 + Math.random() * 0.55);
      const x0 = (TIP - len) * Math.random();
      c.globalAlpha = 0.30 + Math.random() * 0.7;
      c.lineWidth = (TIP / BRISTLES) * (0.5 + Math.random() * 0.9);
      c.lineCap = "round";
      c.strokeStyle = "#fff";
      c.beginPath();
      c.moveTo(x0, y + (Math.random() - 0.5) * 2);
      c.lineTo(x0 + len, y + (Math.random() - 0.5) * 2);
      c.stroke();
    }
    // 가장자리를 타원으로 부드럽게 깎는다 / soften the outline into an oval
    c.globalAlpha = 1;
    c.globalCompositeOperation = "destination-in";
    const g = c.createRadialGradient(TIP / 2, TIP / 2, TIP * 0.1, TIP / 2, TIP / 2, TIP * 0.5);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.82, "rgba(255,255,255,0.95)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, TIP, TIP);
    c.globalCompositeOperation = "source-over";
  })(tip.getContext("2d"));

  const canvas = document.createElement("canvas");
  canvas.className = "hero-brush";
  canvas.setAttribute("aria-hidden", "true");
  hero.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let dpr = 1, W = 0, H = 0;
  const resize = () => {
    const r = hero.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener("resize", resize, { passive: true });

  const LIFE = 620;   // 자국이 남아 있는 시간(ms) / how long a mark lives
  const IDLE = 220;   // 이 시간 이상 안 움직이면 마르기 시작 / ink starts drying
  const STEP = 7;     // 이 거리마다 찍는다 / stamp spacing
  const MAX = 190;   // 보간 후 마크가 촘촘해진다 / marks are dense once interpolated

  let marks = [], lastMove = 0, running = false;

  const draw = () => {
    const now = performance.now();
    marks = marks.filter((m) => now - m.t < LIFE);
    if (!marks.length && now - lastMove > IDLE) {
      ctx.clearRect(0, 0, W, H);
      running = false;
      return;
    }
    ctx.clearRect(0, 0, W, H);
    for (const m of marks) {
      const a = 1 - (now - m.t) / LIFE;
      const along = m.w * 0.85;     // 진행 방향 길이 / length along the stroke
      const across = m.w;           // 획 폭 / width across it
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle);
      ctx.globalAlpha = Math.min(1, 0.55 + 0.45 * a);
      ctx.drawImage(tip, -along / 2, -across / 2, along, across);
      ctx.restore();
    }
    requestAnimationFrame(draw);
  };

  let px = 0, py = 0, pt = 0, drawing = false;

  addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) { drawing = false; return; }
    if (Math.abs(r.width - W) > 1 || Math.abs(r.height - H) > 1) resize();

    const x = e.clientX - r.left, y = e.clientY - r.top;
    const now = performance.now();
    if (!drawing) { drawing = true; px = x; py = y; pt = now; return; }

    const dist = Math.hypot(x - px, y - py);
    if (dist < STEP) return;

    /* 이벤트가 온 지점에만 찍으면 안 된다. 커서를 빠르게 휘두르면 pointermove 사이가
       50~100px 씩 벌어져 자국이 낱개로 끊긴다. 직전 점과 새 점 사이를 STEP 간격으로
       보간해 채워 찍어야 이벤트 밀도와 무관하게 획이 이어진다. 페인팅 앱의 표준 처리.
       Stamping only where events land breaks the stroke apart on fast movement; interpolate
       along the segment so the stroke is continuous regardless of event density. */
    const angle = Math.atan2(y - py, x - px);
    const dt = Math.max(1, Math.min(120, now - pt));
    // 속도는 px/ms. 느리게 그으면 굵고 빠르게 그으면 가늘다 — 실제 붓의 성질
    // Speed in px/ms: slow strokes lay down more pigment, fast ones thin out
    const speed = dist / dt;
    const w = 38 + 54 * (1 - Math.min(1, speed / 2));
    const steps = Math.min(48, Math.floor(dist / STEP));
    for (let i = 1; i <= steps; i++) {
      const f = i / steps;
      marks.push({ x: px + (x - px) * f, y: py + (y - py) * f, t: now, w, angle });
    }
    while (marks.length > MAX) marks.shift();

    px = x; py = y; pt = now;
    lastMove = now;
    if (!running) { running = true; requestAnimationFrame(draw); }
  }, { passive: true });

  addEventListener("blur", () => { marks = []; });
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
