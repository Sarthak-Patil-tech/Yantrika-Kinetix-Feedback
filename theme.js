/* =========================================================
   CAMPUS VOICE — theme / animation layer
   Pure visual sugar. Talks to script.js only via custom
   events (cv:success, cv:toast), never touches the backend.
   ========================================================= */

(function () {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* =========================================================
     BOOT SEQUENCE
     ========================================================= */
  const preloader = $("#preloader");
  const preFill = $("#preFill");
  const prePct = $("#prePct");
  const preLog = $("#preLog");

  const BOOT_LOG = [
    "BNL OS v8.1 — booting…",
    "Compacting trash… 700 yrs done",
    "Directive: STUDENT FEEDBACK",
    "Axiom uplink established",
    "Systems nominal ✓",
  ];

  function finishBoot() {
    document.body.classList.add("booted");
    if (preloader) {
      preloader.classList.add("done");
      setTimeout(() => preloader.remove(), 750);
    }
  }

  if (reduced || !preloader) {
    finishBoot();
  } else {
    const t0 = performance.now();
    const DUR = 1500;
    (function boot(now) {
      const p = Math.min(1, (now - t0) / DUR);
      const eased = 1 - Math.pow(1 - p, 2);
      const pct = Math.round(eased * 100);
      if (preFill) preFill.style.width = pct + "%";
      if (prePct) prePct.textContent = pct + "%";
      if (preLog) preLog.textContent = BOOT_LOG[Math.min(BOOT_LOG.length - 1, Math.floor(eased * BOOT_LOG.length))];
      if (p < 1) requestAnimationFrame(boot);
      else setTimeout(finishBoot, 180);
    })(t0);
  }

  /* =========================================================
     CUSTOM CURSOR (fine pointers only)
     ========================================================= */
  if (finePointer && !reduced) {
    document.body.classList.add("has-cursor");
    const dot = $("#cursorDot");
    const ring = $("#cursorRing");
    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my, rs = 1, rsTarget = 1;

    addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (dot) dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
    }, { passive: true });

    const HOVERABLE = "a, button, .star, input, select, textarea, label, .polaroid, .sticker";
    document.addEventListener("mouseover", (e) => {
      const hit = e.target.closest(HOVERABLE);
      document.body.classList.toggle("cursor-hover", !!hit);
      rsTarget = hit ? 1.7 : 1;
    });

    (function ringLoop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      rs += (rsTarget - rs) * 0.18;
      if (ring) ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${rs})`;
      requestAnimationFrame(ringLoop);
    })();
  }

  /* =========================================================
     MAGNETIC ELEMENTS
     ========================================================= */
  if (finePointer && !reduced) {
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22;
        const y = (e.clientY - r.top - r.height / 2) * 0.28;
        el.style.setProperty("--mx", x.toFixed(1) + "px");
        el.style.setProperty("--my", y.toFixed(1) + "px");
      });
      el.addEventListener("mouseleave", () => {
        el.style.setProperty("--mx", "0px");
        el.style.setProperty("--my", "0px");
      });
    });
  }

  /* =========================================================
     SCROLL REVEALS
     ========================================================= */
  const revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* =========================================================
     TEXT SCRAMBLE (robot decoding effect)
     ========================================================= */
  const GLYPHS = "▓▒░<>/\\[]{}=+*#%&@$01";
  function scramble(el) {
    const finalText = el.dataset.text || el.textContent;
    const len = finalText.length;
    let frame = 0;
    const totalFrames = 26;
    (function step() {
      let out = "";
      for (let i = 0; i < len; i++) {
        const revealAt = (i / len) * totalFrames * 0.75;
        out += frame >= revealAt ? finalText[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (frame++ < totalFrames) requestAnimationFrame(step);
      else el.textContent = finalText;
    })();
  }
  if (!reduced) {
    $$(".scramble").forEach((el) => {
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries, obs) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              scramble(en.target);
              obs.disconnect();
            }
          });
        }, { threshold: 0.5 }).observe(el);
      }
    });
  }

  /* =========================================================
     HERO PARALLAX + WALL-E EYE TRACKING
     ========================================================= */
  const hero = $(".hero");
  const walle = $("#walleBot");
  const eve = $("#eveBot");
  const pupils = $$(".pupil");

  if (hero && finePointer && !reduced) {
    let px = 0, py = 0, tx = 0, ty = 0;
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
    }, { passive: true });
    hero.addEventListener("mouseleave", () => { tx = 0; ty = 0; });

    (function parallaxLoop() {
      px += (tx - px) * 0.06;
      py += (ty - py) * 0.06;
      if (walle) walle.style.transform = `translate3d(${px * 18}px, ${py * 12}px, 0)`;
      if (eve) eve.style.transform = `translate3d(${px * -26}px, ${py * -16}px, 0)`;
      pupils.forEach((p) => {
        p.style.transform = `translate(${(px * 6).toFixed(1)}px, ${(py * 4).toFixed(1)}px)`;
      });
      requestAnimationFrame(parallaxLoop);
    })();
  }

  /* =========================================================
     ROBOT SPEECH BUBBLES
     ========================================================= */
  const WALLE_LINES = ["Eee-va!", "Waaall-ee!", "Ta-da!", "…beep?", "Directive?"];
  const EVE_LINES = ["Directive: FEEDBACK", "Plant detected ✓", "Weeee!", "Positive."];

  function bindBot(el, bubbleEl, lines, extra) {
    if (!el) return;
    let idx = 0;
    const speak = () => {
      if (!bubbleEl) return;
      bubbleEl.textContent = lines[idx++ % lines.length];
      bubbleEl.classList.add("show");
      clearTimeout(bubbleEl._t);
      bubbleEl._t = setTimeout(() => bubbleEl.classList.remove("show"), 1600);
      if (extra) extra();
    };
    el.addEventListener("click", speak);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        speak();
      }
    });
  }

  bindBot(walle, $("#walleBubble"), WALLE_LINES, () => {
    walle.classList.add("wave");
    setTimeout(() => walle.classList.remove("wave"), 2300);
  });
  bindBot(eve, $("#eveBubble"), EVE_LINES, () => {
    eve.classList.add("happy");
    setTimeout(() => eve.classList.remove("happy"), 1800);
  });

  /* =========================================================
     TILT (polaroids + review cards)
     ========================================================= */
  if (finePointer && !reduced) {
    document.addEventListener("mousemove", (e) => {
      const el = e.target.closest(".polaroid, .review-card");
      $$(".is-tilting").forEach((t) => {
        if (t !== el) {
          t.classList.remove("is-tilting");
          t.style.transform = "";
        }
      });
      if (!el) return;
      const r = el.getBoundingClientRect();
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 10;
      const rx = -((e.clientY - r.top) / r.height - 0.5) * 10;
      el.classList.add("is-tilting");
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) rotate(var(--r, 0deg))`;
    }, { passive: true });

    document.addEventListener("mouseleave", () => {
      $$(".is-tilting").forEach((t) => {
        t.classList.remove("is-tilting");
        t.style.transform = "";
      });
    });
  }

  /* =========================================================
     CHARGE BAR + TOPBAR + TO-TOP
     ========================================================= */
  const chargeFill = $("#chargeFill");
  const topbar = $("#topbar");
  const toTop = $("#toTop");

  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    if (chargeFill) chargeFill.style.width = (p * 100).toFixed(2) + "%";
    if (topbar) topbar.classList.toggle("scrolled", scrollY > 12);
    if (toTop) toTop.classList.toggle("show", scrollY > 500);
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }));
  }

  /* =========================================================
     HAL THE COCKROACH — occasional scurry across the footer
     ========================================================= */
  const footer = $(".footer");
  if (footer && !reduced) {
    const HAL_SVG =
      '<svg viewBox="0 0 90 56"><ellipse cx="42" cy="34" rx="24" ry="13" fill="#6b4526"/><ellipse cx="42" cy="30" rx="24" ry="10" fill="#7d5330"/><circle cx="68" cy="28" r="9" fill="#6b4526"/><path d="M72 22 l8 -9 M66 20 l4 -11" stroke="#4a2f18" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="71" cy="26" r="1.8" fill="#ffd66e"/><path d="M26 42 l-4 8 M36 44 l-2 8 M48 44 l2 8 M58 42 l4 8" stroke="#4a2f18" stroke-width="2.5" stroke-linecap="round"/></svg>';
    function spawnHal() {
      const hal = document.createElement("div");
      hal.className = "hal " + (Math.random() > 0.5 ? "run-r" : "run-l");
      hal.setAttribute("aria-hidden", "true");
      hal.innerHTML = HAL_SVG;
      hal.style.bottom = (6 + Math.random() * 40).toFixed(0) + "px";
      footer.appendChild(hal);
      setTimeout(() => hal.remove(), 4800);
      setTimeout(spawnHal, 9000 + Math.random() * 12000);
    }
    setTimeout(spawnHal, 6000);
  }

  /* =========================================================
     TOAST
     ========================================================= */
  const toast = $("#toast");
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("show"), 3400);
  }
  window.addEventListener("cv:toast", (e) => showToast(e.detail));

  /* =========================================================
     FEEDBACK SUCCESS → STAR CONFETTI + WALL-E CHEER
     ========================================================= */
  function starConfetti() {
    if (reduced) return;
    const COUNT = 26;
    const colors = ["#ffc53d", "#67e3ff", "#f09a4b", "#f2ecdd"];
    for (let i = 0; i < COUNT; i++) {
      const s = document.createElement("i");
      s.className = "confetti-star";
      s.textContent = "★";
      s.style.left = (30 + Math.random() * 40) + "vw";
      s.style.top = "42vh";
      s.style.color = colors[(Math.random() * colors.length) | 0];
      s.style.fontSize = (11 + Math.random() * 16).toFixed(0) + "px";
      s.style.setProperty("--dx", ((Math.random() - 0.5) * 90).toFixed(0) + "vw");
      s.style.setProperty("--dy", ((Math.random() * 0.6 + 0.3) * 60).toFixed(0) + "vh");
      s.style.setProperty("--spin", ((Math.random() - 0.5) * 720).toFixed(0) + "deg");
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1600);
    }
  }
  window.addEventListener("cv:success", () => {
    starConfetti();
    if (walle) {
      walle.classList.add("wave");
      setTimeout(() => walle.classList.remove("wave"), 2400);
      const b = $("#walleBubble");
      if (b) {
        b.textContent = "Directive fulfilled!";
        b.classList.add("show");
        setTimeout(() => b.classList.remove("show"), 2000);
      }
    }
  });

  /* =========================================================
     EASTER EGG — type "A113"
     ========================================================= */
  let buffer = "";
  addEventListener("keydown", (e) => {
    if (e.key && e.key.length === 1) {
      buffer = (buffer + e.key.toLowerCase()).slice(-4);
      if (buffer === "a113") {
        document.body.classList.add("party");
        showToast("AUTO OVERRIDE DISENGAGED — captains back in command · A113");
        setTimeout(() => document.body.classList.remove("party"), 2800);
        buffer = "";
      }
    }
  });
})();
