/* 스크롤 리빌 + 히어로 글자 등장 + 커서 리빌 + 데모 + 섹션 가이드
   Scroll reveal, hero letter entrance, cursor reveal, demos, section guide
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

/* ── 4. 작업 행 호버 미리보기 (데스크탑 전용) ──
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
  // 영상 미리보기는 호버 중에만 돈다. preload="metadata" 라 인덱스를 여는 것만으로
  // 1.4MB 를 받지는 않는다 / it plays only while hovered, and metadata-only preload keeps
  // the index page from pulling 1.4MB just to render
  const vid = document.createElement("video");
  vid.muted = true;
  vid.loop = true;
  vid.playsInline = true;
  vid.preload = "metadata";
  const cap = document.createElement("figcaption");
  cap.className = "label muted";
  box.append(img, vid, cap);
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
      const src = row.dataset.preview;
      const isVideo = /\.mp4$/i.test(src);
      if (src !== shown) {
        shown = src;
        // 파일이 아직 없는 슬롯은 케이스 페이지와 같은 자리표시로 떨어진다
        // A slot with no file yet falls back to the placeholder the case pages use
        box.classList.remove("is-loaded");
        // 세로 녹화를 4:3 상자에 cover 로 넣으면 화면이 거의 다 잘린다 — 비율을 바꾼다
        // A portrait recording covered into a 4:3 box is almost entirely cropped away
        box.classList.toggle("is-video", isVideo);
        cap.textContent = row.dataset.previewAlt || "";
        const media = isVideo ? vid : img;
        media.onerror = () => box.classList.remove("is-loaded");
        if (isVideo) {
          vid.onloadeddata = () => box.classList.add("is-loaded");
          vid.poster = row.dataset.previewPoster || "";
        } else {
          img.onload = () => box.classList.add("is-loaded");
        }
        media.src = src;                       // 핸들러를 먼저 걸고 src / handlers first, then src
      }
      if (isVideo) vid.play().catch(() => {}); // 막히면 포스터가 남는다 / poster stays if blocked
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
    row.addEventListener("mouseleave", () => {
      box.classList.remove("is-in");
      vid.pause();                             // 안 보이는 동안 돌릴 이유가 없다 / no reason to run unseen
    });
  });
});

/* ── 4b. 리뷰 조건부 렌더 (01 Decision 01) ──
   "리뷰를 없앤 게 아니라 빈 껍데기를 없앴다"는 게 논점이라, 리뷰 없는 상태에서
   자리가 비어 보이면 안 된다 — 행 자체가 사라져야 한다. hidden 하나면 된다.
   The claim is that the empty shell went, not the reviews, so with none the row is
   not rendered at all rather than left standing empty. */
run(() => {
  const demo = document.querySelector("[data-demo-reviews]");
  if (!demo) return;
  const row = demo.querySelector("[data-reviews-row]");
  // 숨길 때 open 을 건드리지 않는다 — 껐다 켜면 접힌 채로 돌아와서, 정작 보여줘야 할
  // 리뷰 내용이 사라진다. 숨은 동안 열려 있어도 보이지 않으므로 상관없다.
  // Hiding does not close it: forcing it shut meant toggling back returned an empty row,
  // and being open while hidden costs nothing.
  const render = () => {
    row.hidden = demo.querySelector("[name='reviews']:checked").value === "none";
  };
  demo.addEventListener("change", render);
  render();
});

/* ── 5. 데모 B: 상품 정보 칼럼의 배지 ──
   임계값을 8~10으로 올려 보면 "이건 거짓말 같다"는 감각이 직접 생긴다. 그게 2를
   고른 근거고, 산문으로 설명하는 것보다 빠르다.
   Drag the threshold up to 8 and the badge starts to feel like a lie. That
   feeling is the argument for 2, and it lands faster than a paragraph. */
run(() => {
  const demo = document.querySelector("[data-demo-stock]");
  if (!demo) return;
  const $ = (sel) => demo.querySelector(sel);
  const LABEL = { low: "Low Stock", new: "New", popular: "Popular" };
  const render = () => {
    const left = +$("[data-stock]").value, limit = +$("[data-threshold]").value;
    $("[data-out-stock]").textContent = left;
    $("[data-out-threshold]").textContent = limit;
    // 배지 자리는 하나뿐이고 Low Stock > New > Popular 순으로 먼저 맞는 규칙이 이긴다.
    // 재고가 0이면 low stock 규칙 자체가 틀리므로 그 아래가 올라온다.
    // One slot, and the first matching rule wins. At zero the low stock rule is
    // false, so the next one takes the place rather than nothing showing.
    const type = left > 0 && left <= limit ? "low"
      : $("[data-new]").checked ? "new"
      : $("[data-popular]").checked ? "popular" : "";
    const badge = $("[data-badge]");
    badge.hidden = !type;
    badge.textContent = LABEL[type] || "";
    badge.className = "product-badge" + (type ? " product-badge--" + type : "");
    $("[data-sold]").hidden = left > 0;
    $("[data-cta]").textContent = left > 0 ? "Add to cart" : "Sold out";
    $("[data-cta]").disabled = left === 0;
    // 품절이면 실물도 다이내믹 체크아웃을 통째로 내린다 / the real page drops it at zero
    $("[data-dynamic]").hidden = left === 0;
  };
  demo.addEventListener("input", render);
  demo.addEventListener("change", render);
  render();
});

/* ── 6. 데모 C: 프리오더 상태 리졸버 (03 Decision 01) ──
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

/* ── 6b. 데모 B: 스크롤 착시 토글 (02 §6 Scroll) ──
   같은 데이터가 보기에 따라 반대 결론이 된다는 것을 막대 높이로 보여준다. 퍼센트로 보면
   두 막대가 같은 높이라 "아무 일도 없었다"로 읽히고, 절대 거리로 바꾸면 리디자인이
   길어진다. 높이는 각 보기 안에서 큰 쪽을 100%로 정규화한 값이다 — 두 보기의 축이
   다르다는 게 논점이므로 공통 축을 쓰면 안 된다.
   The same data flips conclusion depending on the view. Heights are normalised
   within each view on purpose: the two views not sharing an axis is the point. */
run(() => {
  const demo = document.querySelector("[data-demo-scroll]");
  if (!demo) return;
  const VIEW = {
    pct: { old: [99.9, "37.74%"], new: [100, "37.76%"],
      note: "Scroll depth is a share of page length. Nothing appears to have changed." },
    abs: { old: [91.4, "baseline"], new: [100, "+9.4%"],
      note: "The redesigned page is 9.5% longer. The same share is more scrolling." },
  };
  const render = () => {
    const v = VIEW[demo.querySelector("[name='scrollview']:checked").value];
    ["old", "new"].forEach((k) => {
      demo.querySelector("[data-bar-" + k + "]").style.height = v[k][0] + "%";
      demo.querySelector("[data-val-" + k + "]").textContent = v[k][1];
    });
    demo.querySelector("[data-note]").textContent = v.note;
  };
  demo.addEventListener("change", render);
  render();
});

/* ── 6d. 데모 A′: 임팩트 카운터가 화면에 들어오면 센다 (02 Dec 03) ──
   최종값은 HTML 에 그대로 들어 있다. JS 가 없거나 모션을 줄이라고 했으면 그 숫자가 그냥
   보이고, 그게 맞는 값이다 — 세는 동작은 그 위에 얹을 뿐 값을 만들어내지 않는다.
   The final number lives in the HTML. Without JS, or with reduced motion, it simply shows
   and it is already correct; the counting is layered on top and never sources the value.
   라이브 블록과 같은 2000ms. 한 번 세고 나면 observer 를 끊는다 — 스크롤할 때마다
   0 으로 되돌아가면 값이 아니라 장식으로 읽힌다.
   Same 2000ms as the live block, and it runs once: resetting to zero on every scroll pass
   would make it read as decoration rather than as a number.
   2번 리빌과 달리 여기서는 IO 하나로 충분하다. 숨은 탭에서 콜백이 안 와도 최종값이 이미
   화면에 있기 때문이다 — 리빌은 콘텐츠를 숨겨 두고 IO 로 되돌리는 구조라 콜백이 없으면
   영영 안 보이지만, 이쪽은 콜백이 없으면 애니메이션만 없다.
   Unlike the reveal in 2, IO alone is enough here: a hidden tab delivers no callback, but
   the final value is already on screen. The reveal hides content and needs IO to undo that;
   this only ever adds motion on top of a number that is already correct. */
run(() => {
  const el = document.querySelector("[data-icount-value]");
  if (!el || reduce) return;
  const target = Number(el.textContent.replace(/,/g, ""));
  if (!Number.isFinite(target)) return;
  const fmt = (n) => n.toLocaleString("en-US");
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / 2000, 1);
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    el.textContent = fmt(0);
    requestAnimationFrame(tick);
  }, { threshold: 0.6 });
  io.observe(el);
});

/* ── 6e. 상품 카드 (02 Dec 01) — 색을 고르면 사진이 바뀌고, 비워진 모서리를 켤 수 있다 ──
   Product card: pick a colour to swap the photo, and optionally outline the vacated corner.

   사진 경로는 마크업의 data-photo 에 들어 있다 — 여기서 파일명을 만들지 않는다.
   기본 상태(첫 색 선택됨, 모서리 비어 있음)는 HTML 에 이미 들어 있으므로 JS 가 없으면
   카드는 그냥 그 상태로 보인다.
   The paths live on the markup; this never builds a filename. The default state ships in
   the HTML, so without JS the card simply shows as it is. */
run(() => {
  const demo = document.querySelector("[data-demo-card]");
  if (!demo) return;
  const photo = demo.querySelector("[data-card-photo]");
  const swatches = [...demo.querySelectorAll(".pcard__swatch")];

  const card = demo.querySelector(".pcard");
  const pick = (sw) => {
    photo.src = sw.dataset.photo;
    swatches.forEach((o) => {
      o.classList.toggle("is-active", o === sw);
      o.setAttribute("aria-pressed", String(o === sw));
    });
    // 라이브에서는 이 시점에 view=card 를 가져와 버튼 슬롯을 채운다 — 여기서는 상태 하나로 대신한다
    // The live page fills the button slot from a view=card fetch at exactly this point
    card.classList.add("is-picked");
  };
  // 라이브 트리거는 스워치의 mouseenter 다(클릭이 아니다). 클릭은 터치·키보드용으로 같이 둔다
  // The live trigger is mouseenter on the swatch; click is kept for touch and keyboard
  swatches.forEach((sw) => {
    sw.addEventListener("mouseenter", () => pick(sw));
    sw.addEventListener("click", () => pick(sw));
  });

  const corner = demo.querySelector("[data-card-corner]");
  demo.querySelector("[data-card-outline]").addEventListener("change", (e) => {
    corner.hidden = !e.target.checked;
  });
});

/* ── 6c. 히어로 영상: 모션을 줄이라고 했으면 재생하지 않는다 ──
   autoplay 는 CSS 로 못 끈다. 대신 컨트롤을 켜서 원하면 직접 볼 수 있게 남긴다.
   Autoplay cannot be disabled from CSS; hand the reader controls instead of motion. */
run(() => {
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll("video[autoplay]").forEach((v) => {
    v.autoplay = false;
    v.controls = true;
    v.pause();
  });
});

/* ── 7. 케이스 페이지 섹션 가이드 ──
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
  // 히어로에서는 목차가 제목과 나란히 서서 경쟁한다 — 제목이 화면을 뜬 뒤에 들인다
  // At the hero it stands level with the H1 and competes; let it in once the
  // title has left the screen
  const hero = document.querySelector(".prose h1");
  if (hero) {
    new IntersectionObserver(
      ([e]) => nav.classList.toggle("is-live", !e.isIntersecting),
      { rootMargin: "-64px 0px 0px 0px" }
    ).observe(hero);
  }
});

/* ── 8. 스크롤 진행 바 (1200px 미만에서 사이드바를 대신한다) ──
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
