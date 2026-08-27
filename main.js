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

  /* 잉크 덩어리 텍스처 — 각도마다 반지름을 흔든 닫힌 경로에 위성 방울을 얹는다.
     평행한 붓털(빗질)이 아니라 불규칙한 잉크 자국이어야 "뿌려지는" 느낌이 난다.
     An irregular blob rather than combed bristles; ink splashes, it does not rake.
     크게 찍을 것이므로 비트맵 해상도도 올린다 / higher res since it is stamped large. */
  const TIP = 256;
  const tip = document.createElement("canvas");
  tip.width = tip.height = TIP;
  (function paintTip(c) {
    const cx = TIP / 2, cy = TIP / 2;
    c.fillStyle = "#fff";
    c.beginPath();
    const N = 56;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      // 저주파 + 고주파를 겹쳐 가장자리를 찢는다 / low and high frequency wobble
      const rr = TIP * (0.30 + 0.10 * Math.sin(a * 3 + 1.2) + 0.06 * Math.sin(a * 7 + 0.4)
                        + 0.03 * Math.sin(a * 13) + Math.random() * 0.02);
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.closePath();
    c.fill();
    // 본체에서 떨어져 나온 위성 방울 / satellites flung off the body
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = TIP * (0.30 + Math.random() * 0.16);
      c.globalAlpha = 0.35 + Math.random() * 0.65;
      c.beginPath();
      c.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, TIP * (0.006 + Math.random() * 0.03), 0, 6.2832);
      c.fill();
    }
    c.globalAlpha = 1;
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

  const LIFE = 700;   // 자국이 남아 있는 시간(ms) / how long a mark lives
  const IDLE = 220;   // 이 시간 이상 안 움직이면 마르기 시작 / ink starts drying
  const STEP = 16;    // 스탬프가 커졌으므로 간격도 넓힌다 / wider spacing for a bigger stamp
  const MAX = 90;

  let marks = [], drops = [], lastMove = 0, running = false;

  const draw = () => {
    const now = performance.now();
    marks = marks.filter((m) => now - m.t < LIFE);
    drops = drops.filter((d) => now - d.t < LIFE * 0.8);
    if (!marks.length && !drops.length && now - lastMove > IDLE) {
      ctx.clearRect(0, 0, W, H);
      running = false;
      return;
    }
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    for (const m of marks) {
      const a = 1 - (now - m.t) / LIFE;
      const size = m.w * m.scale;
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle + m.spin);
      ctx.globalAlpha = Math.min(1, 0.6 + 0.4 * a);
      ctx.drawImage(tip, -size * 0.5, -size * 0.5, size, size);
      ctx.restore();
    }
    // 방울도 같은 잉크 비트맵을 작게 찍는다 — 완벽한 원은 잉크가 아니라 물방울무늬로 보인다
    // Reuse the ink bitmap for droplets; perfect circles read as polka dots, not splatter
    for (const d of drops) {
      const a = 1 - (now - d.t) / (LIFE * 0.8);
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.spin);
      ctx.globalAlpha = Math.min(1, 0.8 + 0.2 * a);
      // 날아간 방향으로 늘어난다 / stretched along the direction it was flung
      ctx.drawImage(tip, -d.r * d.stretch, -d.r, d.r * 2 * d.stretch, d.r * 2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
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
       50~100px 씩 벌어져 자국이 낱개로 끊긴다. 구간을 STEP 간격으로 보간해 채워 찍는다.
       Interpolate along the segment so the stroke is continuous regardless of event density. */
    const angle = Math.atan2(y - py, x - px);
    const dt = Math.max(1, Math.min(120, now - pt));
    const speed = dist / dt;                                  // px/ms
    const w = 150 + 210 * (1 - Math.min(1, speed / 2));       // 느릴수록 굵게
    const steps = Math.min(48, Math.floor(dist / STEP));
    for (let i = 1; i <= steps; i++) {
      const f = i / steps;
      // 스탬프마다 회전·크기를 흔들어야 같은 비트맵을 반복해도 균일해 보이지 않는다
      // Jitter each stamp or the repeated bitmap reads as a uniform tube
      marks.push({
        x: px + (x - px) * f, y: py + (y - py) * f, t: now, w, angle,
        spin: Math.random() * 6.2832,
        scale: 0.82 + Math.random() * 0.36,
      });
    }
    while (marks.length > MAX) marks.shift();

    /* 빠르게 그으면 잉크가 튄다 — 획 옆으로 방울이 흩어진다
       Fast strokes fling droplets sideways off the stroke */
    if (speed > 0.9) {
      const n = Math.min(4, Math.round(speed * 1.4));
      for (let i = 0; i < n; i++) {
        const side = Math.random() < 0.5 ? 1 : -1;
        const perp = angle + (Math.PI / 2) * side * (0.55 + Math.random() * 0.45);
        const off = w * (0.22 + Math.random() * 0.5);          // 획에 가깝게 / stay near the stroke
        const alongF = Math.random();
        const rnd = Math.random();
        drops.push({
          x: px + (x - px) * alongF + Math.cos(perp) * off,
          y: py + (y - py) * alongF + Math.sin(perp) * off,
          // 제곱으로 작은 쪽에 치우치게 — 큰 방울은 가끔만 / squared, so big drops are rare
          r: w * (0.010 + rnd * rnd * 0.05),
          stretch: 1 + Math.random() * 1.6,
          spin: perp,
          t: now,
        });
      }
      if (drops.length > 70) drops.splice(0, drops.length - 70);
    }

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
