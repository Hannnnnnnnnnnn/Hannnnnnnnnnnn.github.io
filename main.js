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

/* ── 3. 커서 리빌 — 히어로를 반전판으로 뚫어 보여준다 ──
   Cursor reveal: punches through to an inverted copy of the hero.

   구조는 참조 사이트와 같다. base(흰 배경 + 검은 글자) 위에 reveal(검은 배경 + 흰 글자)을
   겹치고, 커서가 지나간 자리만 마스크로 열어 준다. 그쪽은 그 마스크를 Three.js 유체
   셰이더로 그리지만, 서로 다른 속도로 커서를 쫓는 radial-gradient 3장이면 같은 번짐과
   꼬리가 나온다.
   Same structure as the reference: an inverted layer above the base, opened only where the
   cursor has been. They paint that mask with a WebGL fluid sim; three radial gradients
   chasing the cursor at different rates give the same smear for none of the weight.

   단색 원을 페이지 전체에 띄웠던 이전 방식과 다른 점: 열린 자리가 "설계된 반전판"이라
   여백 위에서도 결함으로 보이지 않는다. */
run(() => {
  if (reduce || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  // 마스크 미지원 브라우저에서는 아예 만들지 않는다 — 만들면 검은 판이 통째로 덮인다
  // Never build it without mask support, or the panel would cover the hero outright
  if (!CSS.supports("mask-image", "radial-gradient(#000, #000)")) return;

  const hero = document.querySelector(".hero");
  const display = hero && hero.querySelector(".display");
  if (!hero || !display) return;

  const reveal = document.createElement("div");
  reveal.className = "hero-reveal";
  reveal.setAttribute("aria-hidden", "true");   // 시각용 사본, 스크린리더에는 원본만
  const clone = display.cloneNode(true);
  clone.classList.add("is-in");                 // 사본은 등장 애니메이션 없이 최종 상태로
  reveal.appendChild(clone);
  hero.appendChild(reveal);

  // 세 점이 서로 다른 속도로 커서를 쫓는다 → 앞의 점이 머리, 뒤의 점이 꼬리
  // Three followers at different rates: the fast one leads, the slow ones trail
  const pts = [{ x: 0, y: 0, k: 0.35 }, { x: 0, y: 0, k: 0.18 }, { x: 0, y: 0, k: 0.10 }];
  let tx = 0, ty = 0, inside = false, running = false, seeded = false;

  const frame = () => {
    let moving = false;
    pts.forEach((p, i) => {
      p.x += (tx - p.x) * p.k;
      p.y += (ty - p.y) * p.k;
      if (Math.abs(tx - p.x) > 0.5 || Math.abs(ty - p.y) > 0.5) moving = true;
      reveal.style.setProperty(`--x${i + 1}`, p.x.toFixed(1) + "px");
      reveal.style.setProperty(`--y${i + 1}`, p.y.toFixed(1) + "px");
    });
    if (moving || inside) requestAnimationFrame(tick);
    else running = false;
  };
  const tick = () => frame();

  addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    // 마스크 좌표는 요소 기준이므로 뷰포트 좌표에서 변환한다 / mask coords are element-local
    tx = e.clientX - r.left;
    ty = e.clientY - r.top;
    const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (over !== inside) {
      inside = over;
      reveal.classList.toggle("is-on", inside);
    }
    if (!seeded) {   // 첫 진입 때 꼬리가 좌상단에서 날아오지 않도록 세 점을 같은 자리에 둠
      seeded = true;
      pts.forEach((p) => { p.x = tx; p.y = ty; });
    }
    if (!running) { running = true; requestAnimationFrame(tick); }
  }, { passive: true });

  addEventListener("blur", () => { inside = false; reveal.classList.remove("is-on"); });
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
