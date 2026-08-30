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

  /* 획을 여러 개로 나눠 각자 알파를 갖는다. 하나로 공유하면 페이드 도중 다시 움직였을 때
     이미 마르던 부분까지 같이 되살아난다 — 옛 잉크는 계속 마르고 새 잉크만 배어들어야 한다.
     One alpha per stroke: a shared one revives ink that was already drying when the pointer
     moves again. Old strokes keep drying while the new one soaks in. */
  let strokes = [], cur = null, lastMove = 0, running = false, lastFrame = 0;

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

  const drawStroke = (st) => {
    const marks = st.marks, n = marks.length;
    ctx.globalAlpha = st.alpha;
    if (n > 2) {
      const halfW = (i) => {
        const m = marks[i];
        /* 저주파만 쓰면 매끈한 아메바가 된다. 고주파까지 겹쳐야 가장자리가 찢어지고,
           합이 바닥에 가까워지는 지점에서 폭이 잘록해져 마른 붓 끊김이 생긴다.
           Low frequencies alone give a smooth amoeba; the high ones tear the edge. */
        const wob = 0.60
          + 0.20 * Math.sin(m.s * 0.021 + ph[0])
          + 0.13 * Math.sin(m.s * 0.058 + ph[1])
          + 0.09 * Math.sin(m.s * 0.134 + ph[2])
          + 0.06 * Math.sin(m.s * 0.315 + ph[3]);
        /* 테이퍼는 꼬리에만 건다. 양 끝에 대칭으로 걸면 커서 쪽(가장 최근)까지 깎여
           앞부분이 가늘어진다. 머리는 오히려 잉크를 머금은 것처럼 더 굵게.
           Taper the tail only; a symmetric taper thins the head, which is where the brush
           is actually loaded. */
        const fromTail = i, fromHead = n - 1 - i;
        const taper = 0.10 + 0.90 * Math.min(1, fromTail / 20) ** 2;
        const head = 1 + 0.55 * Math.exp(-fromHead / 16);
        return m.w * 0.5 * Math.max(0.04, wob) * taper * head;
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
      /* 머리는 둥근 캡으로 닫는다. 양쪽 변을 직선으로 이어 버리면 붓끝이 가위로 잘린 것처럼
         납작해지는데, 머리는 획이 가장 굵은 자리(head 보정 ×1.55)라 그 평평함이 제일 눈에
         띈다. 법선각에서 접선 방향을 지나 반대편 법선까지 반원을 그려 넣으면 잉크를 머금은
         붓끝처럼 앞으로 볼록해진다 — 반지름만큼 실제로 더 나아가므로 획이 길어 보이기도 한다.
         Cap the head with an arc. Joining the two sides straight leaves a cut-off tip, and the
         head is the widest point (the ×1.55 head boost), so that flatness is exactly where it
         shows. Sweeping from the normal through the tangent to the opposite normal bulges the
         tip forward by its own radius, like a loaded brush. */
      const CAP = 12;
      const [hx, hy] = normal(n - 1), hr = halfW(n - 1);
      const a0 = Math.atan2(hy, hx);
      for (let k = 1; k < CAP; k++) {
        const a = a0 - Math.PI * (k / CAP);   // 접선을 지나는 쪽으로 / sweeping through the tangent
        outline.push([marks[n - 1].x + Math.cos(a) * hr, marks[n - 1].y + Math.sin(a) * hr]);
      }
      for (let i = n - 1; i >= 0; i--) {
        const [nx, ny] = normal(i), h = halfW(i);
        outline.push([marks[i].x - nx * h, marks[i].y - ny * h]);
      }
      ctx.beginPath();
      tracePath(outline);
      ctx.fill();
    }
    for (const d of st.drops) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.spin);
      ctx.beginPath();
      ctx.ellipse(0, 0, d.r * d.stretch, d.r, 0, 0, TAU);   // 날아간 방향으로 늘어난 방울
      ctx.fill();
      ctx.restore();
    }
  };

  const draw = () => {
    const now = performance.now();
    const dt = Math.min(64, lastFrame ? now - lastFrame : 16);
    lastFrame = now;

    // 손을 멈추면 이 획은 끝난다. 다시 움직이면 새 획이 시작되고, 끝난 획은 계속 마른다
    // A pause ends the stroke; moving again starts a new one and never revives the old
    const wet = now - lastMove < IDLE;
    if (!wet) cur = null;

    /* 지수 감쇠 — 목표값으로 부드럽게 접근한다. 임계시간까지 버티다 선형으로 떨어뜨리면
       시작이 툭 끊긴다. Exponential approach; a hold-then-linear ramp starts abruptly. */
    for (const st of strokes) {
      const target = st === cur ? 1 : 0;
      const tau = target > st.alpha ? RISE : DRY;
      st.alpha += (target - st.alpha) * (1 - Math.exp(-dt / tau));
    }
    strokes = strokes.filter((st) => st.alpha >= 0.012 || st === cur);

    if (!strokes.length) {
      ctx.clearRect(0, 0, W, H);
      running = false;
      return;
    }
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    for (const st of strokes) drawStroke(st);
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
    if (!cur) { cur = { marks: [], drops: [], alpha: 0 }; strokes.push(cur); }
    while (strokes.length > 4) strokes.shift();   // 동시에 마르는 획 수를 묶어 둔다

    const steps = Math.min(60, Math.floor(dist / STEP));
    for (let i = 1; i <= steps; i++) {
      const f = i / steps;
      runLen += dist / steps;
      cur.marks.push({ x: px + (x - px) * f, y: py + (y - py) * f, w, s: runLen });
    }
    while (cur.marks.length > MAX) cur.marks.shift();

    // 빠르게 그으면 잉크가 튄다 / fast strokes fling droplets
    if (speed > 0.9) {
      const count = Math.min(4, Math.round(speed * 1.4));
      for (let i = 0; i < count; i++) {
        const side = Math.random() < 0.5 ? 1 : -1;
        const perp = angle + (Math.PI / 2) * side * (0.55 + Math.random() * 0.45);
        const off = w * (0.22 + Math.random() * 0.5);
        const alongF = Math.random();
        const rnd = Math.random();
        cur.drops.push({
          x: px + (x - px) * alongF + Math.cos(perp) * off,
          y: py + (y - py) * alongF + Math.sin(perp) * off,
          r: w * (0.010 + rnd * rnd * 0.05),      // 제곱 — 큰 방울은 가끔만
          stretch: 1 + Math.random() * 1.6,
          spin: perp,
        });
      }
      if (cur.drops.length > 70) cur.drops.splice(0, cur.drops.length - 70);
    }

    px = x; py = y; pt = now;
    lastMove = now;
    if (!running) { running = true; lastFrame = 0; requestAnimationFrame(draw); }
  }, { passive: true });

  addEventListener("blur", () => { strokes = []; cur = null; });
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

/* ── 5. 작업 행 호버 미리보기 (데스크탑 전용) ──
   Work row hover preview, desktop only.

   행에 마우스를 올리면 그 케이스의 히어로 이미지를 커서 오른쪽 아래에 띄운다.
   소스는 마크업의 data-preview 에 선언돼 있고 여기서는 읽기만 한다.
   Hovering a row floats that case's hero image below-right of the cursor.
   The source is declared on the markup as data-preview; this only reads it.

   따라오는 감쇠는 rAF 루프가 아니라 CSS transform 트랜지션이 만든다 —
   목표 좌표만 바꾸면 이징이 알아서 늦게 따라온다.
   The damped follow is a CSS transform transition rather than a rAF loop:
   move the target and the easing lags for us. */
run(() => {
  if (reduce) return;                                                    // 모션 최소화 존중 / respect reduced motion
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return; // 터치에는 호버가 없다 / no hover on touch

  const rows = document.querySelectorAll(".rows .row[data-preview]");
  if (!rows.length) return;

  const box = document.createElement("figure");
  box.className = "row-preview";
  box.setAttribute("aria-hidden", "true");   // 링크 텍스트가 이미 말하는 내용 / the link text already says this
  const img = document.createElement("img");
  img.alt = "";
  const cap = document.createElement("figcaption");
  cap.className = "label muted";
  box.append(img, cap);
  document.body.appendChild(box);

  const GAP = 20;   // 커서에서 띄우는 거리 / distance from the cursor
  let shown = "";

  // 오른쪽·아래가 기본이지만 화면을 넘으면 안쪽으로 접는다
  // Below-right by default, folded back inside when it would leave the viewport
  const place = (e) => {
    const w = box.offsetWidth, h = box.offsetHeight;
    const x = Math.max(GAP, Math.min(e.clientX + GAP, innerWidth - w - GAP));
    const y = Math.max(GAP, Math.min(e.clientY + GAP, innerHeight - h - GAP));
    box.style.setProperty("--x", x + "px");
    box.style.setProperty("--y", y + "px");
  };

  rows.forEach((row) => {
    row.addEventListener("mouseenter", (e) => {
      if (row.dataset.preview !== shown) {
        shown = row.dataset.preview;
        // 파일이 아직 없는 슬롯은 케이스 페이지와 같은 자리표시로 떨어진다
        // A slot with no file yet falls back to the placeholder the case pages use
        box.classList.remove("is-loaded");
        cap.textContent = row.dataset.previewAlt || "";
        img.onload = () => box.classList.add("is-loaded");
        img.onerror = () => box.classList.remove("is-loaded");
        img.src = shown;                       // 핸들러를 먼저 걸고 src / handlers first, then src
      }
      // 처음 뜰 때는 커서 자리에서 시작 — 아니면 직전 행 위치에서 날아온다
      // Start at the cursor on first show, or it flies in from the previous row
      if (!box.classList.contains("is-in")) {
        box.classList.add("is-placing");
        place(e);
        void box.offsetWidth;                  // 리플로우 강제 / force the reflow
        box.classList.remove("is-placing");
      }
      box.classList.add("is-in");
    });
    row.addEventListener("mousemove", place);
    row.addEventListener("mouseleave", () => box.classList.remove("is-in"));
  });
});

/* ── 6. 데모 B: 재고 임계값 (01 Decision 04) ──
   임계값을 8~10으로 올려 보면 "이건 거짓말 같다"는 감각이 직접 생긴다. 그게 2를
   고른 근거고, 산문으로 설명하는 것보다 빠르다.
   Drag the threshold up to 8 and the badge starts to feel like a lie. That
   feeling is the argument for 2, and it lands faster than a paragraph. */
run(() => {
  const demo = document.querySelector("[data-demo-stock]");
  if (!demo) return;
  const $ = (s) => demo.querySelector(s);
  const stock = $("[data-stock]"), limit = $("[data-threshold]"), badge = $("[data-stock-badge]");
  const render = () => {
    const n = +stock.value, t = +limit.value;
    $("[data-out-stock]").textContent = n;
    $("[data-out-threshold]").textContent = t;
    // 품절은 배지 블록이 아니라 가격 옆 테마 기본 배지가 맡는다 — 컴포넌트가 다르므로
    // 클래스도 바꾼다 / Sold out is the theme's own badge beside the price, a
    // different component, so the class swaps with it
    const sold = n === 0;
    badge.hidden = !sold && n > t;
    badge.textContent = sold ? "Sold out" : "Low Stock";
    badge.classList.toggle("theme-badge", sold);
    badge.classList.toggle("product-badge", !sold);
    badge.classList.toggle("product-badge--low", !sold);
  };
  demo.addEventListener("input", render);
  render();
});

/* ── 7. 데모 C: 프리오더 상태 리졸버 (03 Decision 01) ──
   opt-in 을 시장별로 들고 있는 게 핵심이다. CA↔US 를 바꾸면 같은 variant 가 다른
   상태가 되고, "약속은 시장마다 다르다"는 논점이 조작 한 번으로 전달된다.
   The opt-in is held per market on purpose: flipping CA↔US turns the same
   variant into a different state, which is the whole claim of that decision. */
run(() => {
  const demo = document.querySelector("[data-demo-resolver]");
  if (!demo) return;
  const $ = (s) => demo.querySelector(s);
  const optedIn = { CA: true, US: false };
  const val = (name) => demo.querySelector("[name='" + name + "']:checked").value;
  const render = (e) => {
    const market = val("market");
    const optin = $("[name='optin']");
    if (e && e.target === optin) optedIn[market] = optin.checked;
    optin.checked = optedIn[market];
    const policy = val("policy"), n = +val("stock");
    const preorder = n === 0 && policy === "continue" && optedIn[market];
    $("[data-cta]").textContent = n > 0 ? "Add to cart" : preorder ? "Pre-order now" : "Sold out";
    $("[data-cta]").disabled = n === 0 && !preorder;
    $("[data-copy]").hidden = !preorder;
    $("[data-why]").textContent = n > 0
      ? n + " in stock, so the promise never comes up."
      : policy === "deny"
        ? "Selling past zero is turned off for this variant."
        : preorder
          ? "Opted in for " + market + ", so the page can name a wait."
          : "Selling past zero is allowed, but this variant hasn't been opted in for " + market + ".";
  };
  demo.addEventListener("change", render);
  render();
});

/* ── 8. 케이스 페이지 섹션 가이드 ──
   IntersectionObserver 하나. rootMargin 이 핵심이다 — 기본값이면 섹션이 화면에
   들어오는 즉시 활성화돼서 스크롤 내내 목차가 깜빡인다. 위아래를 잘라 화면 중앙을
   지날 때만 전환시킨다. 스크롤 이벤트 + getBoundingClientRect 는 매 프레임 레이아웃을
   읽어 스크롤을 버벅이게 하므로 쓰지 않는다.
   One observer. The rootMargin is the whole trick: at its default a section goes
   active the moment it enters the viewport and the index flickers the entire way
   down, so the band is cropped to the middle of the screen. */
run(() => {
  const nav = document.querySelector(".toc");
  if (!nav) return;
  const links = [...nav.querySelectorAll("a")];
  const setActive = (id) => {
    const inDecision = id.indexOf("decision-") === 0;
    nav.classList.toggle("is-decisions", inDecision || id === "decisions");
    // 결정 안에 있어도 '현재 섹션'은 Decisions 다 / inside a decision the section is still Decisions
    const current = "#" + (inDecision ? "decisions" : id);
    links.forEach((a) => {
      a.classList.toggle("is-on", a.hash === "#" + id);
      if (a.hash === current) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  };
  const spy = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
    { rootMargin: "-40% 0px -55% 0px" }
  );
  links.forEach((a) => {
    const target = document.getElementById(a.hash.slice(1));
    if (target) spy.observe(target);
  });
  // 앵커로 바로 들어오면 그 섹션은 이미 관찰 밴드 위에 있어서 관찰자가 한 번도 발화하지
  // 않는다 — 목차가 아무것도 가리키지 않은 채로 남는다. 클릭도 같은 이유로 먼저 반영한다.
  // Arriving on an anchor lands the section above the band, so the observer never
  // fires and the index sits blank; a click has the same problem, so both lead.
  nav.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link) setActive(link.hash.slice(1));
  });
  if (location.hash) setActive(location.hash.slice(1));
});

/* ── 9. 스크롤 진행 바 (1200px 미만에서 사이드바를 대신한다) ──
   scrollTop 하나만 읽는다 — 섹션 판정에 쓰는 레이아웃 측정과는 비용이 다르다.
   Reads scrollTop and nothing else; this is not the per-frame layout read that
   section detection must avoid. */
run(() => {
  const bar = document.querySelector(".progress span");
  if (!bar) return;
  const doc = document.documentElement;
  const draw = () => {
    const done = doc.scrollTop / (doc.scrollHeight - doc.clientHeight) || 0;
    bar.style.transform = "scaleX(" + done + ")";
  };
  addEventListener("scroll", draw, { passive: true });
  draw();
});
