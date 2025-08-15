/* THEGRID – UX glue (no HTML edits needed) */
(() => {
  // ---------- Confetti Engine (self-clearing, non-freezing) ----------
  const makeConfetti = (() => {
    let canvas, ctx, raf, particles = [], active = false;
    const colors = ["#ffd166","#f6c35c","#e6b24d","#f4e3b0","#fff3d1","#f2c078","#f7d07a","#ffecb3"];

    const spawn = (count, power = 1) => {
      const { innerWidth: w, innerHeight: h } = window;
      for (let i=0;i<count;i++){
        particles.push({
          x: w/2 + (Math.random() - 0.5) * 80,
          y: h/2 - 40,
          vx: (Math.random() - 0.5) * (6*power),
          vy: -Math.random() * (8*power) - 4,
          g: 0.25,
          r: 2 + Math.random()*3,
          a: 1,
          rot: Math.random()*Math.PI*2,
          vr: (Math.random()-0.5)*0.2,
          c: colors[(Math.random()*colors.length)|0]
        });
      }
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const { innerWidth: w, innerHeight: h } = window;
      canvas.width = w; canvas.height = h;
      ctx.clearRect(0,0,w,h);

      particles.forEach(p=>{
        p.vy += p.g;
        p.x += p.vx; p.y += p.vy;
        p.rot += p.vr;
        if (p.y > h+40) p.a -= 0.03;  // fade out off-screen
      });
      particles = particles.filter(p=>p.a>0);

      particles.forEach(p=>{
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.c;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.r, -p.r, p.r*2, p.r*2);
        ctx.restore();
      });

      if (!particles.length) stop();
    };

    const start = () => {
      if (active) return;
      active = true;
      canvas = document.createElement('canvas');
      canvas.id = "confetti";
      Object.assign(canvas.style, {
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999
      });
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');
      loop();
      window.addEventListener('resize', resize, { passive:true });
      resize();
    };
    const stop = () => {
      if (!active) return;
      cancelAnimationFrame(raf);
      active = false;
      canvas?.remove();
      window.removeEventListener('resize', resize);
    };
    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    return (power = 1) => {
      if (!active) start();
      spawn(160 * power, power);
      // hard-stop after 4s even if tab frozen
      setTimeout(stop, 4000);
    };
  })();

  // ---------- Helpers ----------
  const smoothScrollTo = (sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ---------- Wire up existing buttons/links (no HTML changes) ----------
  const hookButtons = () => {
    const clickers = [
      { q: 'a[href*="join"] , a:contains("Join Now")', confetti: 2.2 },
      { q: 'a:contains("Monetise"), a:contains("Monetize")', confetti: 1.8, scroll: '#pricing,#monetise,#monetize' },
      { q: 'a:contains("Explore Niches")', confetti: 1.2, scroll: '#niches,#signature-niches' },
      { q: 'a:contains("Cinematic Reels")', confetti: 1.2, scroll: '#reels,#landscape-reels' },
      { q: 'button:contains("Customize"), a:contains("Customize")', confetti: 0.8 }
    ];

    // :contains polyfill
    const matchContains = (el, text) =>
      (el.textContent || '').trim().toLowerCase().includes(text.toLowerCase());

    // build final node list for every rule and attach once
    clickers.forEach(rule => {
      const nodes = Array.from(document.querySelectorAll(rule.q.split(',').map(s=>s.trim()).map(s=>{
        // convert :contains selector manually
        if (!s.includes(':contains')) return s;
        return s.split(':contains')[0] || '*';
      }).join(',')))
      .filter(n => {
        const clauses = rule.q.split(',');
        return clauses.some(cl=>{
          const m = cl.match(/:contains\("?(.*?)"?\)/i);
          if (!m) return n.matches(cl);
          const base = cl.split(':contains')[0] || '*';
          return (base==='*' || n.matches(base)) && matchContains(n, m[1]);
        });
      });

      nodes.forEach(n=>{
        if (n.__hooked) return;
        n.__hooked = true;
        n.addEventListener('click', (e)=>{
          makeConfetti(rule.confetti || 1);
          if (rule.scroll) {
            e.preventDefault();
            const targets = rule.scroll.split(',');
            const first = targets.map(s=>s.trim()).map(s=>document.querySelector(s)).find(Boolean);
            if (first) first.scrollIntoView({ behavior:"smooth" });
          }
        }, { passive:false });
      });
    });
  };

  // ---------- Hero auto source (video → image fallback) ----------
  const initHero = async () => {
    const hero = document.querySelector('#hero, .hero, .card video, .card img'); // tolerant
    if (!hero) return;

    const tryVideo = async (src) => new Promise((res, rej) => {
      const v = document.createElement('video');
      v.src = src; v.muted = true; v.playsInline = true; v.autoplay = true; v.loop = true;
      v.addEventListener('canplay', ()=>res(v));
      v.addEventListener('error', rej);
    });

    try {
      const v = await tryVideo('assets/video/gc_spin.mp4');
      hero.replaceWith(v);
      v.play().catch(()=>{});
    } catch {
      const img = document.createElement('img');
      img.src = 'assets/images/gc_logo.png';
      img.alt = 'GC';
      img.style.width = '100%';
      hero.replaceWith(img);
    }
  };

  // ---------- Boot ----------
  document.addEventListener('DOMContentLoaded', () => {
    hookButtons();
    initHero();
  });
})();
