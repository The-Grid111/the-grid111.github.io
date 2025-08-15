/* THEGRID – main.js (drop-in replacement)
   - Admin-only Customiser: open/close reliably (button, X, ESC, outside click, swipe-down)
   - Confetti: full-screen, smooth, auto-cleans; scales for big purchases
*/
document.addEventListener("DOMContentLoaded", () => {
  /* ---------- ADMIN GATE (temporary) ---------- */
  // Toggle this to false to hide the customiser for non-admins.
  const IS_ADMIN = true;

  /* ---------- ELEMENTS ---------- */
  const libOpen   = document.getElementById("libOpen");
  const libPanel  = document.getElementById("libPanel");
  const confettiC = document.getElementById("confetti");
  const greet     = document.getElementById("greet");

  // Inject a close button in the panel if one isn’t there
  let libClose = document.getElementById("libClose");
  if (libPanel && !libClose) {
    libClose = document.createElement("button");
    libClose.id = "libClose";
    libClose.className = "lib-btn gold";
    libClose.textContent = "Close";
    const bar = document.createElement("div");
    bar.className = "lib-actions";
    bar.appendChild(libClose);
    libPanel.prepend(bar);
  }

  // Hide customiser if not admin
  if (!IS_ADMIN) {
    if (libOpen)  libOpen.style.display = "none";
    if (libPanel) libPanel.style.display = "none";
  }

  /* ---------- CUSTOMISER OPEN/CLOSE ---------- */
  let panelOpen = false;
  const openPanel = () => {
    if (!libPanel) return;
    libPanel.style.display = "block";
    libPanel.setAttribute("aria-hidden", "false");
    panelOpen = true;
  };
  const closePanel = () => {
    if (!libPanel) return;
    libPanel.style.display = "none";
    libPanel.setAttribute("aria-hidden", "true");
    panelOpen = false;
  };

  if (libOpen)  libOpen.addEventListener("click", openPanel);
  if (libClose) libClose.addEventListener("click", closePanel);

  // Click outside the panel closes it
  document.addEventListener("click", (e) => {
    if (!panelOpen || !libPanel) return;
    const inside = libPanel.contains(e.target) || (libOpen && libOpen.contains(e.target));
    if (!inside) closePanel();
  });

  // ESC closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panelOpen) closePanel();
  });

  // Swipe-down on mobile closes
  let touchY = null;
  document.addEventListener("touchstart", (e) => {
    if (!panelOpen) return;
    touchY = e.touches[0].clientY;
  }, {passive:true});
  document.addEventListener("touchmove", (e) => {
    if (!panelOpen || touchY === null) return;
    const dy = e.touches[0].clientY - touchY;
    if (dy > 40) { touchY = null; closePanel(); }
  }, {passive:true});
  document.addEventListener("touchend", () => (touchY = null));

  /* ---------- GREETING ---------- */
  if (greet) {
    const hour = new Date().getHours();
    const msg =
      hour < 5  ? "Good night"   :
      hour < 12 ? "Good morning" :
      hour < 17 ? "Good afternoon" :
                  "Good evening";
    greet.textContent = `${msg} — THEGRID`;
  }

  /* ---------- CONFETTI ENGINE ---------- */
  // Smooth, full-screen, mobile-friendly.
  if (!confettiC) return;

  const ctx = confettiC.getContext("2d");
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let W, H;
  const resize = () => {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    W = confettiC.clientWidth;
    H = confettiC.clientHeight;
    confettiC.width  = Math.floor(W * dpr);
    confettiC.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  // Make canvas cover the viewport
  const fitCanvasToViewport = () => {
    confettiC.style.position = "fixed";
    confettiC.style.left = "0";
    confettiC.style.top = "0";
    confettiC.style.width = "100vw";
    confettiC.style.height = "100vh";
    confettiC.style.pointerEvents = "none";
    confettiC.style.zIndex = "9999";
  };
  fitCanvasToViewport();
  resize();
  window.addEventListener("resize", resize);

  const GOLD = ["#FFD166", "#F6E27A", "#EAC14D", "#F2C94C", "#FFF3B0"];
  const PASTELS = ["#FDE2E4","#E2F0CB","#CDE7F0","#FFF1B6","#EAD7F6"];
  const COLORS = GOLD.concat(PASTELS);

  let rafId = null;
  let particles = [];

  function spawnBurst(x, y, {power = 1, spread = Math.PI * 2, rings = 1} = {}) {
    // scale particle count by viewport and "power"
    const base = Math.min(260, Math.round((W + H) / 6));
    const total = Math.max(60, Math.round(base * power));
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * spread + (Math.random() * 0.5);
      const speed = 4 + Math.random() * (6 + 3 * power);
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (3 + power), // initial “pop”
        g: 0.18 + Math.random() * 0.08,            // gravity
        fr: 0.985,                                 // friction
        w: 4 + Math.random() * 6,
        h: 2 + Math.random() * 4,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        life: 1,                                   // 1 -> 0
        decay: 0.007 + Math.random() * 0.012,
        color: COLORS[(Math.random() * COLORS.length) | 0]
      });
    }
    if (!rafId) loop();
  }

  function loop() {
    rafId = requestAnimationFrame(loop);
    ctx.clearRect(0, 0, W, H);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= p.fr;
      p.vy = p.vy * p.fr + p.g;
      p.x  += p.vx;
      p.y  += p.vy;
      p.r  += p.vr;
      p.life -= p.decay;

      // render
      if (p.life <= 0 || p.y > H + 40) {
        particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
      ctx.restore();
    }

    // Stop the loop when no particles remain (prevents freezing)
    if (particles.length === 0) {
      cancelAnimationFrame(rafId);
      rafId = null;
      ctx.clearRect(0, 0, W, H);
    }
  }

  // Utility: get element center in viewport
  function centerOf(el) {
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  }

  // Attach to celebratory buttons
  const celebrateButtons = [
    ...document.querySelectorAll("[data-confetti], .cta, #joinBtn, #monetiseBtn")
  ];
  celebrateButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const { x, y } = centerOf(btn);
      // Tiered power: data-confetti="tiny|small|normal|big|huge|luxe"
      const tier = (btn.getAttribute("data-confetti") || "normal").toLowerCase();
      const powerMap = { tiny:.4, small:.7, normal:1, big:1.6, huge:2.2, luxe:3 };
      const power = powerMap[tier] ?? 1;
      spawnBurst(x, y, { power });
    });
  });

  // Expose a simple API for future events (optional)
  window.TheGridConfetti = {
    celebrateAt(x, y, power = 1) { spawnBurst(x, y, { power }); },
    celebrateFull(power = 1.8) { spawnBurst(W / 2, H / 3, { power }); }
  };
});
