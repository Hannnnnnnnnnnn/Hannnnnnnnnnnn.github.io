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

/* ── 3. 잉크 리빌 — 획 전체를 하나의 패스로 그린다 ──
   Ink reveal: the whole stroke is drawn as a single path.

   흰색을 mix-blend-mode: difference 로 얹으면 흰 배경은 검게, 검은 글자는 희게 뒤집힌다.
   White under difference inverts the backdrop.

   ⚠️ 왜 스탬프를 겹쳐 찍지 않는가: 비트맵을 겹치면 "겹침의 경계"가 생기고, 그 경계는
   회전을 무작위로 주면 지그재그로, 천천히 돌리면 규칙적인 물결로 망가진다. 둘 다 개별
   스탬프를 손봐서는 못 고치고 블러로 덮는 수밖에 없었다. 획을 **하나의 닫힌 패스**로
   그리면 합집합 경계라는 것이 존재하지 않아 블러 없이도 선명하다. 덤으로 프레임당
   비트맵 240장이 패스 하나로 줄어든다.
   A single filled path has no union boundary to go wrong, so it stays crisp without blur —
   and costs one fill instead of hundreds of bitmap draws. */
run(() => {
  if (reduce || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const hero = document.querySelector(".hero");
  if (!hero || !hero.querySelector(".display")) return;

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

  const TAU = Math.PI * 2;
  const IDLE = 140;     // 이 시간 안에 움직임이 있으면 잉크가 유지된다 / keeps the ink wet
  const STEP = 9;       // 경로 샘플 간격 / path sample spacing
  const MAX = 260;
  const RISE = 55;      // 차오르는 시정수(ms) — 빠르게 / fast to appear
  const DRY = 420;      // 마르는 시정수(ms) — 느리게 / slow to dry

  // 폭이 길이를 따라 흔들리도록 — 위상은 로드 때 한 번만 / width wobble, phases fixed once
  const ph = Array.from({ length: 4 }, () => Math.random() * TAU);

  let marks = [], drops = [], lastMove = 0, running = false;
  let alpha = 0, lastFrame = 0;

  /* 점열을 매끄러운 닫힌 패스로 — 이웃 두 점의 중점을 지나는 2차 곡선이라 이음매가 없다
     Smooth closed path through midpoints, so no joint shows */
  const tracePath = (pts) => {
    const n = pts.length;
    ctx.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
    for (let i = 0; i < n; i++) {
      const cur = pts[i], nxt = pts[(i + 1) % n];
      ctx.quadraticCurveTo(cur[0], cur[1], (cur[0] + nxt[0]) / 2, (cur[1] + nxt[1]) / 2);
    }
  };

  const draw = () => {
    const now = performance.now();
    const dt = Math.min(64, lastFrame ? now - lastFrame : 16);
    lastFrame = now;

    /* 지수 감쇠 — 목표값으로 부드럽게 접근한다. 임계시간까지 버티다 선형으로 떨어뜨리면
       시작이 툭 끊기고, 페이드 중에 다시 움직였을 때 알파가 1로 점프한다.
       Exponential approach: a hold-then-linear ramp starts abruptly and snaps back to full
       if the pointer moves again mid-fade. */
    const target = now - lastMove < IDLE ? 1 : 0;
    const tau = target > alpha ? RISE : DRY;
    alpha += (target - alpha) * (1 - Math.exp(-dt / tau));

    if (alpha < 0.012 && target === 0) {
      alpha = 0; marks = []; drops = [];
      ctx.clearRect(0, 0, W, H);
      running = false;
      return;
    }

    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#fff";

    const n = marks.length;
    if (n > 2) {
      const halfW = (i) => {
        const m = marks[i];
        /* 저주파만 쓰면 매끈한 아메바가 된다. 고주파까지 겹쳐야 가장자리가 찢어지고,
           합이 바닥에 가까워지는 지점에서 폭이 잘록해져 마른 붓 끊김이 생긴다.
           패스는 여전히 하나이므로 블러 없이도 선명하다.
           Low frequencies alone give a smooth amoeba; the high ones tear the edge, and where
           the sum bottoms out the ribbon pinches, which reads as the brush running dry. */
        const wob = 0.60
          + 0.20 * Math.sin(m.s * 0.021 + ph[0])
          + 0.13 * Math.sin(m.s * 0.058 + ph[1])
          + 0.09 * Math.sin(m.s * 0.134 + ph[2])
          + 0.06 * Math.sin(m.s * 0.315 + ph[3]);
        // 양 끝을 길게 가늘게 — 짧게 깎으면 화살촉처럼 뾰족해진다
        // Taper over a long run; a short one turns the end into an arrowhead
        const endT = Math.min(1, Math.min(i, n - 1 - i) / 20);
        return m.w * 0.5 * Math.max(0.04, wob) * (0.10 + 0.90 * endT * endT);
      };
      const normal = (i) => {
        const a = marks[Math.max(0, i - 1)], b = marks[Math.min(n - 1, i + 1)];
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        return [-dy / len, dx / len];
      };
      const outline = [];
      for (let i = 0; i < n; i++) {
        const [nx, ny] = normal(i), h = halfW(i);
        outline.push([marks[i].x + nx * h, marks[i].y + ny * h]);
      }
      for (let i = n - 1; i >= 0; i--) {
        const [nx, ny] = normal(i), h = halfW(i);
        outline.push([marks[i].x - nx * h, marks[i].y - ny * h]);
      }
      ctx.beginPath();
      tracePath(outline);
      ctx.fill();
    }

    for (const d of drops) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.spin);
      ctx.beginPath();
      ctx.ellipse(0, 0, d.r * d.stretch, d.r, 0, 0, TAU);   // 날아간 방향으로 늘어난 방울
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  };

  let px = 0, py = 0, pt = 0, drawing = false, runLen = 0;

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

    /* 이벤트가 온 지점만 이으면 획이 각진다. 커서를 빠르게 휘두르면 pointermove 사이가
       50~100px 씩 벌어지기 때문. 구간을 STEP 간격으로 보간해 채운다.
       Interpolate along the segment; events arrive too sparsely on a fast sweep. */
    const angle = Math.atan2(y - py, x - px);
    const dt = Math.max(1, Math.min(120, now - pt));
    const speed = dist / dt;                                // px/ms
    const w = 150 + 210 * (1 - Math.min(1, speed / 2));     // 느릴수록 굵게
    const steps = Math.min(60, Math.floor(dist / STEP));
    for (let i = 1; i <= steps; i++) {
      const f = i / steps;
      runLen += dist / steps;
      marks.push({ x: px + (x - px) * f, y: py + (y - py) * f, w, s: runLen });
    }
    while (marks.length > MAX) marks.shift();

    // 빠르게 그으면 잉크가 튄다 / fast strokes fling droplets
    if (speed > 0.9) {
      const count = Math.min(4, Math.round(speed * 1.4));
      for (let i = 0; i < count; i++) {
        const side = Math.random() < 0.5 ? 1 : -1;
        const perp = angle + (Math.PI / 2) * side * (0.55 + Math.random() * 0.45);
        const off = w * (0.22 + Math.random() * 0.5);
        const alongF = Math.random();
        const rnd = Math.random();
        drops.push({
          x: px + (x - px) * alongF + Math.cos(perp) * off,
          y: py + (y - py) * alongF + Math.sin(perp) * off,
          r: w * (0.010 + rnd * rnd * 0.05),      // 제곱 — 큰 방울은 가끔만
          stretch: 1 + Math.random() * 1.6,
          spin: perp,
        });
      }
      if (drops.length > 70) drops.splice(0, drops.length - 70);
    }

    px = x; py = y; pt = now;
    lastMove = now;
    if (!running) { running = true; lastFrame = 0; requestAnimationFrame(draw); }
  }, { passive: true });

  addEventListener("blur", () => { marks = []; drops = []; });
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
