// The hero painting: a yellow ground laid in broad strokes behind the text, and an oil-stick drawing of a robot
// in the physical world. Every line is drawn from a seeded random source, so the picture is the same on each visit.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const C = { ink: "#16130f", white: "#f6f1e4", red: "#d43a2c", blue: "#2c5ca8", pink: "#e9a49c", yellow: "#f2c12e", orange: "#ec8f2c", green: "#3f8f4e", sky: "#9cc3e6", amber: "#e3a33a" };

  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), s | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const f = (n) => n.toFixed(1);

  // A pen that draws wobbling, hand-made marks. t is a time cursor: each mark is scheduled after the last.
  function pen(root, r) {
    let g = root, t = 0.15;
    const wobble = (pts, amp) => pts.map(([x, y]) => [x + (r() - 0.5) * amp, y + (r() - 0.5) * amp]);
    const subdivide = (pts, step) => {
      const out = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
        const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
        for (let k = 1; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
      }
      return out;
    };
    const smooth = (pts, close) => {
      let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
      if (pts.length < 3) return d + `L${f(pts[1][0])} ${f(pts[1][1])}`;
      for (let i = 1; i < pts.length - 1; i++) {
        const [x, y] = pts[i], [nx, ny] = pts[i + 1];
        d += `Q${f(x)} ${f(y)} ${f((x + nx) / 2)} ${f((y + ny) / 2)}`;
      }
      const l = pts[pts.length - 1];
      return d + `L${f(l[0])} ${f(l[1])}` + (close ? "Z" : "");
    };
    const ring = (cx, cy, rx, ry, turns = 1, n = 28, jit = 0.06) => {
      const a0 = r() * Math.PI * 2, pts = [];
      for (let i = 0; i <= n * turns; i++) {
        const a = a0 + (i / n) * Math.PI * 2, k = 1 + (r() - 0.5) * jit;
        pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
      }
      return pts;
    };
    const P = {
      into(group) { const prev = g; g = group; return () => (g = prev); },
      at(time) { t = time; },
      stroke(pts, { w = 6, color = C.ink, amp = 3, step = 26, twice = false, o = 1, gap = 0.035, dur } = {}) {
        for (let p = 0; p < (twice ? 2 : 1); p++) {
          const d = smooth(wobble(subdivide(pts, step), amp));
          const len = pts.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0), 0);
          el("path", { d, fill: "none", stroke: color, "stroke-width": f(w * (p ? 0.55 : 1)), "stroke-linecap": "round", "stroke-linejoin": "round",
            "stroke-opacity": o, pathLength: 1, class: "s", style: `--d:${t.toFixed(2)}s;--t:${(dur ?? Math.min(0.7, 0.18 + len / 900)).toFixed(2)}s` }, g);
          t += gap;
        }
      },
      fill(pts, color, { o = 1, amp = 5 } = {}) {
        el("path", { d: smooth(wobble(subdivide([...pts, pts[0]], 30), amp), true), fill: color, "fill-opacity": o, class: "p", style: `--d:${t.toFixed(2)}s` }, g);
        t += 0.04;
      },
      // paint laid in with a loaded brush: overlapping wide strokes across a box
      scumble(x, y, w, h, color, { bw = 30, o = 0.9, vertical = false } = {}) {
        const n = Math.max(2, Math.ceil((vertical ? w : h) / (bw * 0.62)));
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n;
          const pts = vertical
            ? [[x + u * w, y + r() * 10], [x + u * w + (r() - 0.5) * 8, y + h - r() * 10]]
            : [[x + r() * 10, y + u * h], [x + w - r() * 10, y + u * h + (r() - 0.5) * 8]];
          P.stroke(pts, { w: bw * (0.8 + r() * 0.4), color, o, amp: 6, gap: 0.02, dur: 0.35 });
        }
      },
      line(x1, y1, x2, y2, opts) { P.stroke([[x1, y1], [x2, y2]], opts); },
      rect(x, y, w, h, opts = {}) {
        const o = 6; // corners overshoot, as when a box is drawn in four strokes
        P.line(x - o, y, x + w + o * 0.5, y, opts); P.line(x + w, y - o, x + w, y + h + o * 0.5, opts);
        P.line(x + w + o, y + h, x - o * 0.5, y + h, opts); P.line(x, y + h + o, x, y - o * 0.5, opts);
      },
      circle(cx, cy, rad, opts = {}) { P.stroke(ring(cx, cy, rad, opts.ry ?? rad, 1.1, Math.max(14, Math.round(rad / 4)), opts.jit ?? 0.08), { step: 400, ...opts }); },
      disc(cx, cy, rad, color, opts = {}) { P.fill(ring(cx, cy, rad, opts.ry ?? rad, 1, Math.max(12, Math.round(rad / 4)), 0.05).slice(0, -1), color, opts); },
      arc(cx, cy, rad, a0, a1, opts) {
        const pts = [];
        for (let i = 0; i <= 10; i++) { const a = a0 + ((a1 - a0) * i) / 10; pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); }
        P.stroke(pts, { step: 400, ...opts });
      },
      arrow(pts, opts = {}) {
        P.stroke(pts, opts);
        const [x2, y2] = pts[pts.length - 1], [x1, y1] = pts[pts.length - 2];
        const a = Math.atan2(y2 - y1, x2 - x1), s = opts.head ?? 18;
        P.line(x2, y2, x2 - Math.cos(a - 0.5) * s, y2 - Math.sin(a - 0.5) * s, opts);
        P.line(x2, y2, x2 - Math.cos(a + 0.5) * s, y2 - Math.sin(a + 0.5) * s, opts);
      },
      hatch(x, y, w, h, opts = {}) {
        const gap = opts.gap ?? 9, pts = [];
        for (let i = 0; x + i * gap <= x + w; i++) pts.push(i % 2 ? [x + i * gap, y + h] : [x + i * gap + gap * 0.6, y]);
        P.stroke(pts, { step: 400, amp: 2, ...opts });
      },
      text(str, x, y, size, { color = C.ink, rot = 0, anchor = "start", weight } = {}) {
        const e = el("text", { x, y, "font-size": size, fill: color, "text-anchor": anchor, transform: `rotate(${rot} ${x} ${y})`, style: `--d:${t.toFixed(2)}s` }, g);
        if (weight) e.setAttribute("font-weight", weight);
        e.textContent = str;
        t += 0.06;
        return e;
      },
      get t() { return t; },
    };
    return P;
  }

  // ---------- the drawing ----------
  const artSvg = document.querySelector(".art svg");
  const defs = el("defs", {}, artSvg);
  const boil = el("filter", { id: "boil", x: "-5%", y: "-5%", width: "110%", height: "110%" }, defs);
  const turb = el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.022", numOctaves: "2", seed: "3" }, boil);
  el("feDisplacementMap", { in: "SourceGraphic", scale: "5", xChannelSelector: "R", yChannelSelector: "G" }, boil);
  const art = el("g", { filter: "url(#boil)" }, artSvg);
  const P = pen(art, rng(19));
  const eyes = [];

  // a black field in the top right, where the apple falls
  P.fill([[724, 26], [992, 14], [998, 418], [872, 392], [770, 318], [742, 170]], C.ink);

  // the test suite that ships with the code, crossed out, and what replaces it
  P.text("test_suite.py", 30, 90, 44, { rot: -4 });
  P.line(24, 80, 330, 58, { w: 7, color: C.ink });
  P.line(32, 60, 326, 84, { w: 6, color: C.ink });
  P.arrow([[150, 108], [140, 136], [158, 160]], { w: 4, head: 14 });
  P.text("THE", 40, 206, 44, { color: C.red, rot: 3 });
  P.text("WORLD", 26, 266, 70, { color: C.red, rot: 2 });
  P.line(28, 282, 262, 276, { w: 5, color: C.red });

  // the head: white laid over yellow, a pink flush, then the oil-stick outline
  P.at(0.9);
  P.scumble(334, 186, 274, 232, C.white, { bw: 34, o: 0.92 });
  P.scumble(348, 300, 90, 46, C.pink, { bw: 24, o: 0.8 });
  P.scumble(540, 190, 60, 70, C.sky, { bw: 22, o: 0.7, vertical: true });
  P.rect(320, 172, 300, 258, { w: 9, twice: true });
  for (let k = 0; k < 3; k++) P.line(360, 200 + k * 11, 420 - k * 9, 198 + k * 12, { w: 3 });
  // ear bolts
  P.fill([[292, 250], [324, 250], [324, 322], [292, 322]], C.blue);
  P.rect(292, 250, 30, 72, { w: 5 });
  P.fill([[618, 244], [652, 244], [652, 320], [618, 320]], C.blue);
  P.rect(618, 244, 34, 76, { w: 5 });
  // antenna and its signal
  P.line(472, 172, 462, 112, { w: 6 });
  P.disc(458, 94, 19, C.red);
  P.circle(458, 94, 19, { w: 5 });
  P.arc(458, 94, 36, -2.6, -0.55, { w: 4 });
  P.arc(458, 94, 54, -2.5, -0.65, { w: 3 });
  // eyes: rings drawn round and round, pupils that follow the reader
  for (const [cx, cy, rad] of [[410, 278, 46], [536, 272, 58]]) {
    P.disc(cx, cy, rad, C.white);
    P.circle(cx, cy, rad, { w: 7 });
    P.circle(cx, cy, rad * 0.64, { w: 4, color: rad > 50 ? C.red : C.ink });
    const pg = el("g", { class: "pupil" }, art);
    const back = P.into(pg);
    P.disc(cx, cy, rad * 0.3, C.ink);
    P.disc(cx - rad * 0.1, cy - rad * 0.12, rad * 0.08, C.white);
    back();
    eyes.push({ g: pg, cx, cy, reach: rad * 0.3 });
  }
  P.hatch(352, 304, 46, 30, { w: 3, color: C.red, gap: 8 });
  // mouth: a grid of teeth, two of them gold
  P.fill([[372, 352], [580, 352], [580, 406], [372, 406]], C.white);
  P.fill([[434, 353], [455, 353], [455, 378], [434, 378]], C.yellow);
  P.fill([[517, 379], [538, 379], [538, 405], [517, 405]], C.yellow);
  P.rect(372, 352, 208, 54, { w: 6 });
  P.line(372, 379, 580, 379, { w: 3 });
  for (let k = 1; k < 10; k++) P.line(372 + k * 20.8, 352, 372 + k * 20.8, 406, { w: 3, gap: 0.015 });

  // neck and chest: a tally of verdicts, two passes, a failure, and one nobody can call
  P.line(442, 432, 442, 472, { w: 7 }); P.line(504, 432, 504, 472, { w: 7 });
  P.line(436, 450, 510, 452, { w: 3 });
  P.scumble(356, 478, 250, 104, C.white, { bw: 30, o: 0.85 });
  P.stroke([[360, 472], [594, 470], [618, 586], [334, 590], [360, 472]], { w: 8, twice: true, step: 60 });
  P.stroke([[388, 528], [400, 544], [424, 506]], { w: 6, color: C.green, step: 400 });
  P.stroke([[438, 528], [450, 544], [474, 506]], { w: 6, color: C.green, step: 400 });
  P.line(492, 508, 520, 542, { w: 6, color: C.red }); P.line(520, 508, 492, 542, { w: 6, color: C.red });
  P.text("?", 538, 548, 52, { color: C.blue, rot: 8 });
  P.line(384, 560, 572, 556, { w: 3 });

  // the apple, and what it does when let go
  P.at(1.6);
  P.disc(846, 132, 52, C.red, { ry: 48 });
  P.circle(846, 132, 52, { ry: 48, w: 5, color: C.white });
  P.line(846, 86, 852, 58, { w: 5, color: C.white });
  P.fill([[856, 66], [890, 48], [884, 72]], C.green);
  P.arrow([[846, 200], [848, 270], [846, 344]], { w: 6, color: C.white, head: 20 });
  P.text("g = 9.81", 868, 290, 30, { color: C.white, rot: -4 });

  // the tread: the loop, running on wheels
  P.at(2.4);
  P.scumble(110, 650, 760, 100, C.white, { bw: 30, o: 0.55 });
  P.stroke([[100, 642], [872, 640], [908, 700], [872, 762], [100, 760], [40, 701], [100, 642]], { w: 8, twice: true, step: 60 });
  P.line(100, 701, 880, 700, { w: 5 });
  const WORDS = [['WRITE', C.blue], ['RUN', C.ink], ['JUDGE', C.red], ['KEEP', C.green]];
  for (let k = 0; k <= 4; k++) P.line(104 + k * 192, 642, 104 + k * 192, 701, { w: 5, gap: 0.02 });
  WORDS.forEach(([w, color], k) => P.text(w, 200 + k * 192, 686, 30, { anchor: 'middle', color, rot: k % 2 ? 2 : -2 }));
  for (let k = 0; k < 8; k++) { P.circle(152 + k * 96, 731, 19, { w: 4 }); P.disc(152 + k * 96, 731, 5, C.ink); }

  // pupils follow the pointer
  const look = (x, y) => {
    const m = artSvg.getScreenCTM();
    if (!m) return;
    eyes.forEach((e) => {
      const sx = m.a * e.cx + m.e, sy = m.d * e.cy + m.f;
      const dx = x - sx, dy = y - sy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260) * e.reach;
      e.g.setAttribute("transform", `translate(${f((dx / d) * k)} ${f((dy / d) * k)})`);
    });
  };
  addEventListener("pointermove", (e) => look(e.clientX, e.clientY), { passive: true });

  // a slow boil: the drawing redraws itself a few times a second, as hand-drawn animation does
  let seed = 0, timer = 0;
  const boilOn = () => { clearInterval(timer); if (!still.matches) timer = setInterval(() => turb.setAttribute("seed", String((seed = (seed + 1) % 3) + 3)), 220); };
  new IntersectionObserver(([en]) => (en.isIntersecting ? boilOn() : clearInterval(timer))).observe(artSvg);
  still.addEventListener("change", boilOn);

  // ---------- the ground, laid out around the text ----------
  const hero = document.querySelector(".hero"), ground = document.querySelector(".ground");
  function paintGround() {
    const W = hero.clientWidth, H = hero.clientHeight;
    ground.setAttribute("viewBox", `0 0 ${W} ${H}`);
    ground.replaceChildren();
    const r = rng(7);
    el("rect", { width: W, height: H, fill: C.yellow }, ground);
    // brush edges: the strokes are pushed about by noise, so they end ragged instead of rounded
    const fl = el("filter", { id: "brush", x: "-10%", y: "-10%", width: "120%", height: "120%" }, el("defs", {}, ground));
    el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.035 0.09", numOctaves: "3", seed: "5" }, fl);
    el("feDisplacementMap", { in: "SourceGraphic", scale: "26", xChannelSelector: "R", yChannelSelector: "G" }, fl);
    const G = pen(el("g", { filter: "url(#brush)" }, ground), r);
    const tones = ["#f4c938", "#efb926", "#f5d04c", "#ebb02a", "#f3c530", "#f6d458"];
    for (let i = 0; i < Math.round((W * H) / 9000); i++) {
      const x = r() * W, y = r() * H, len = 120 + r() * 380, a = r() < 0.75 ? (r() - 0.5) * 0.5 : Math.PI / 2 + (r() - 0.5) * 0.4;
      G.stroke([[x, y], [x + Math.cos(a) * len, y + Math.sin(a) * len]], { w: 30 + r() * 80, color: tones[i % tones.length], o: 0.4 + r() * 0.3, amp: 14, step: 80 });
    }
    for (let i = 0; i < 4; i++) {
      const x = r() < 0.5 ? r() * W * 0.2 : W - r() * W * 0.25, y = r() * H;
      G.stroke([[x, y], [x + 60 + r() * 140, y + (r() - 0.5) * 60]], { w: 40 + r() * 40, color: C.orange, o: 0.5, amp: 10 });
    }
    // a black bar down the left edge with a red ladder beside it (wide screens only, where it clears the title)
    if (W >= 760) {
    G.fill([[0, H * 0.06], [W * 0.022, H * 0.07], [W * 0.026, H * 0.44], [0, H * 0.46]], C.ink, { amp: 8 });
    const lx = Math.max(14, W * 0.03);
    G.line(lx, H * 0.1, lx + 2, H * 0.4, { w: 4, color: C.red }); G.line(lx + 16, H * 0.1, lx + 18, H * 0.4, { w: 4, color: C.red });
    for (let y = H * 0.12; y < H * 0.4; y += 22) G.line(lx, y, lx + 17, y + 2, { w: 3, color: C.red, amp: 1 });
    }
    // white laid in behind the authors and the buttons
    const hb = hero.getBoundingClientRect(), box = (node, pad) => {
      const b = node.getBoundingClientRect();
      return [b.left - hb.left - pad, b.top - hb.top - pad, b.width + pad * 2, b.height + pad * 2];
    };
    const [wx, wy, ww, wh] = box(document.querySelector(".lower"), 22);
    G.scumble(wx, wy, ww, wh, C.white, { bw: 34, o: 0.9 });
    // drips and scraps
    for (let i = 0; i < 3; i++) {
      const x = W * (0.55 + r() * 0.4), y = H - 10 - r() * 30;
      G.fill([[x, y], [x + 30 + r() * 40, y - 4], [x + 36 + r() * 30, y + 26], [x - 4, y + 30]], i ? C.red : C.blue, { o: 0.85, amp: 6 });
    }
  }
  let rt = 0;
  const repaint = () => { clearTimeout(rt); rt = setTimeout(paintGround, 120); };
  paintGround();
  document.fonts?.ready.then(paintGround);
  new ResizeObserver(repaint).observe(hero);

  // ---------- the rest of the page ----------
  // cards and blocks are slapped onto the wall as they come into view
  document.documentElement.classList.add("js");
  const reveal = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); reveal.unobserve(en.target); }
  }), { rootMargin: "0px 0px -10% 0px" });
  document.querySelectorAll(".fig, .loop, .stages, .card, .closing, .five, .bib").forEach((node) => {
    // cards in a row arrive one after another
    if (node.matches(".card")) node.style.setProperty("--rd", `${[...node.parentElement.children].indexOf(node) * 0.07}s`);
    node.classList.add("reveal");
    reveal.observe(node);
  });

  // BibTeX: one block per line, so long values wrap with a hanging indent; the newlines stay for copying
  const bib = document.getElementById("bibtex");
  const esc = (t) => t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  bib.innerHTML = bib.textContent.split("\n").map((l) => `<span>${esc(l)}</span>`).join("\n");

  // the loop: four tabs, one stage of the opening scene each; arrow keys move between them
  const tabs = [...document.querySelectorAll('.loop [role="tab"]')];
  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.tabIndex = i ? -1 : 0;
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", (e) => {
      const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
    });
  });

  // the header gains a yellow ground once the hero has scrolled away
  const bar = document.querySelector(".bar");
  new IntersectionObserver(([en]) => bar.classList.toggle("solid", !en.isIntersecting), { rootMargin: "-80px 0px 0px 0px" }).observe(document.querySelector(".hero .copy"));

  // figures open full size in a lightbox; a click anywhere or Escape closes it
  const box = document.querySelector(".lightbox"), boxImg = box.querySelector("img");
  document.querySelectorAll(".zoom").forEach((b) => b.addEventListener("click", () => {
    const img = b.querySelector("img");
    boxImg.src = img.currentSrc || img.src; boxImg.alt = img.alt;
    box.showModal();
  }));
  box.addEventListener("click", () => box.close());

  // copy BibTeX
  document.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    const text = document.getElementById(b.dataset.copy).textContent;
    try { await navigator.clipboard.writeText(text); b.textContent = "Copied!"; }
    catch (e) { b.textContent = "Select and copy"; }
    setTimeout(() => (b.textContent = "Copy"), 1800);
  }));
})();
