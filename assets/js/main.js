(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  /* ---- nav ---- */
  const navBtn = document.getElementById('navToggle'), navLinks = document.getElementById('navLinks');
  navBtn.addEventListener('click', () => { const o = navLinks.classList.toggle('open'); navBtn.setAttribute('aria-expanded', String(o)); });
  navLinks.addEventListener('click', e => { if (e.target.closest('a')) { navLinks.classList.remove('open'); navBtn.setAttribute('aria-expanded', 'false'); } });

  /* ---- hero code card: file tabs (arrow keys move between them) ---- */
  const tabs = [...document.querySelectorAll('.hero-card [role="tab"]')];
  const selectTab = t => tabs.forEach(x => {
    const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
    document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      const n = tabs[(i + d + tabs.length) % tabs.length]; selectTab(n); n.focus();
    });
  });

  /* ---- copy email ---- */
  const copyBtn = document.getElementById('copyBtn'), emailEl = document.getElementById('email');
  copyBtn.addEventListener('click', () => {
    const done = () => { copyBtn.textContent = 'Copied'; setTimeout(() => copyBtn.textContent = 'Copy email', 1800); };
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(emailEl); const s = getSelection(); s.removeAllRanges(); s.addRange(r); copyBtn.textContent = 'Selected, press Ctrl+C'; };
    try { navigator.clipboard.writeText(emailEl.textContent.trim()).then(done, fallback); } catch (e) { fallback(); }
  });

  /* ---- contact form: posts to Netlify Forms ---- */
  const form = document.getElementById('contactForm'), status = document.getElementById('formStatus');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const missing = [...form.querySelectorAll('[required]')].find(el => !el.value.trim() || (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value)));
    if (missing) { status.style.color = 'var(--amber)'; status.textContent = 'Add your ' + missing.name + ' so I can reply.'; missing.focus(); return; }
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true; status.style.color = ''; status.textContent = 'Sending…';
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() })
      .then(r => { if (!r.ok) throw r; status.textContent = "Thanks, your message is on its way. I'll be in touch soon."; form.reset(); })
      .catch(() => { status.style.color = 'var(--amber)'; status.textContent = "Sorry, that didn't send. Please email me directly instead."; })
      .finally(() => { btn.disabled = false; });
  });

  /* ---- magnetic buttons + card tilt ---- */
  if (FINE && !RM) {
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px, ${(e.clientY - r.top - r.height / 2) * .32}px)`; });
      el.addEventListener('pointerleave', () => el.style.transform = '');
    });
    document.querySelectorAll('.card').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', ((px - .5) * 7) + 'deg'); c.style.setProperty('--rx', ((.5 - py) * 5) + 'deg');
        c.style.setProperty('--gx', (px * 100) + '%'); c.style.setProperty('--gy', (py * 100) + '%');
      });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---- work: show the first four, "See more" reveals the rest ---- */
  const moreBtn = document.getElementById('work-more');
  if (moreBtn) {
    const grid = document.querySelector('.work-grid');
    grid.classList.add('is-collapsed'); moreBtn.hidden = false;
    moreBtn.addEventListener('click', () => {
      grid.classList.remove('is-collapsed'); grid.classList.add('is-revealing');
      moreBtn.setAttribute('aria-expanded', 'true'); moreBtn.parentElement.hidden = true;
      grid.querySelector('[data-extra]')?.querySelector('.m-shot')?.focus({ preventScroll: true });
    });
  }

  /* ---- work screenshots: magnify into a scrollable lightbox ---- */
  const lb = document.getElementById('lightbox');
  if (lb) {
    const lbImg = lb.querySelector('img'), lbTitle = lb.querySelector('.lb-title'), lbBody = lb.querySelector('.lb-body');
    document.querySelectorAll('.zoom-btn').forEach(btn => btn.addEventListener('click', () => {
      lbImg.src = btn.dataset.zoom; lbImg.alt = `Full-page screenshot of the ${btn.dataset.title} website`;
      lbTitle.textContent = btn.dataset.title; lbBody.scrollTop = 0;
      lb.showModal(); lbBody.focus();
    }));
    lb.querySelector('.lb-close').addEventListener('click', () => lb.close());
    lb.addEventListener('click', e => { if (e.target === lb) lb.close(); }); // backdrop click
  }

  /* ---- helpers ---- */
  function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function makeNoise(seed) { const r = mulberry32(seed), p = Array.from({ length: 512 }, () => r()); return x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return p[i & 511] * (1 - u) + p[(i + 1) & 511] * u; }; }
  function fbm(n, x, oct) { let v = 0, a = .5, fr = 1, norm = 0; for (let o = 0; o < oct; o++) { v += a * n(x * fr + o * 13.1); norm += a; fr *= 2.03; a *= .5; } return v / norm; }

  /* ---- palettes for the canvas scenes (CSS tokens handle the rest of the page) ---- */
  const PALS = {
    night: {
      aurora: ['246,200,110', '169,180,224', '79,157,145', '60,80,170'],
      sky: [[0, '#0a0f1e'], [.35, '#131d3a'], [.62, '#26375f'], [1, '#2d3f6a']],
      glow: '246,200,110', glowA: .09, glowAt: [.35, .66],
      layers: [['#4a5c86', '#34446b'], ['#34456d', '#253353'], ['#233152', '#18223b'], ['#17223b', '#0f182b'], ['#0e1628', '#0a0f1e']],
      fog: '169,180,224', rim: ['255,214,130', '246,200,110'], stars: 1,
      body: { type: 'moon', x: .86, y: .15, r: [18, 34], col: ['#f1efe6', '#f1efe6'], glow: '233,237,246', ga: .22 },
      particles: 'fireflies', fly: ['255,250,222', '255,226,150', '246,200,110'], tree: 'pine', floor: '10,15,30'
    },
    dusk: {
      aurora: ['255,143,79', '234,164,180', '217,122,154', '90,40,110'],
      sky: [[0, '#170d1d'], [.28, '#3a1a45'], [.48, '#8a3a5c'], [.6, '#e0714a'], [.74, '#ffb36b'], [1, '#ffcf8a']],
      glow: '255,143,79', glowA: .2, glowAt: [.62, .56],
      layers: [['#8a4a6e', '#6e3a5e'], ['#5e2e52', '#4a2444'], ['#3e1c3a', '#2e1530'], ['#261228', '#1d0f22'], ['#1a0e1f', '#170d1d']],
      fog: '255,170,150', rim: ['255,200,160', '255,143,79'], stars: .35,
      body: { type: 'sun', x: .62, y: .5, r: [44, 92], col: ['#fff0c4', '#ff8f4f'], glow: '255,150,80', ga: .5 },
      particles: 'fireflies', fly: ['255,244,226', '255,196,150', '255,130,80'], tree: 'pine', floor: '23,13,29'
    },
    autumn: {
      aurora: ['247,197,47', '217,183,118', '168,184,92', '170,84,30'],
      sky: [[0, '#1a1208'], [.3, '#3d2a10'], [.55, '#8a5a1c'], [.72, '#d09232'], [1, '#f0c66a']],
      glow: '247,197,47', glowA: .16, glowAt: [.28, .52],
      layers: [['#a0763e', '#8a6232'], ['#7a5428', '#63441f'], ['#553816', '#422b11'], ['#35230e', '#2a1c0b'], ['#1c150c', '#16110a']],
      treeCols: [null, null, ['#9a5418', '#553816'], ['#6e3610', '#35230e'], ['#34200e', '#1c150c']],
      fog: '240,200,130', rim: ['255,232,150', '247,197,47'], stars: 0,
      body: { type: 'sun', x: .24, y: .28, r: [26, 48], col: ['#fff6d2', '#f7c52f'], glow: '255,210,110', ga: .38 },
      particles: 'leaves', leafCols: ['#f7c52f', '#f0a42a', '#e0781f', '#c9511c', '#e8d04a'], tree: 'round', floor: '22,17,10'
    },
    northern: {
      aurora: ['110,231,183', '157,120,255', '80,200,210', '40,60,150'],
      sky: [[0, '#04070f'], [.35, '#081324'], [.6, '#0f2336'], [1, '#132c3c']],
      glow: '110,231,183', glowA: .1, glowAt: [.45, .5],
      layers: [['#7f9bb5', '#223f55'], ['#58728c', '#172f42'], ['#243a52', '#0e1c2b'], ['#12202f', '#0a1420'], ['#0a111d', '#070b16']],
      fog: '140,220,200', fogMul: .8, rim: ['190,255,225', '110,231,183'], stars: 1,
      body: null,
      lights: [
        { base: .31, amp: .05, f: .0021, w: .00018, s1: .00004, s2: .00007, a: .95, h: [.12, .22],
          cols: [[0, 'rgba(150,110,255,0)'], [.5, 'rgba(150,110,255,.22)'], [.8, 'rgba(80,240,170,.7)'], [.94, 'rgba(200,255,228,.95)'], [1, 'rgba(80,240,170,0)']] },
        { base: .2, amp: .06, f: .0014, w: -.00013, s1: .00003, s2: .00009, a: .65, h: [.1, .18],
          cols: [[0, 'rgba(120,80,255,0)'], [.55, 'rgba(190,110,255,.3)'], [.88, 'rgba(255,125,215,.6)'], [1, 'rgba(255,125,215,0)']] },
        { base: .4, amp: .035, f: .0033, w: .00025, s1: .00005, s2: .00006, a: .5, h: [.07, .13],
          cols: [[0, 'rgba(60,200,220,0)'], [.6, 'rgba(60,200,220,.25)'], [.9, 'rgba(140,255,215,.7)'], [1, 'rgba(140,255,215,0)']] }
      ],
      particles: 'fireflies', fly: ['235,255,248', '170,255,220', '110,231,183'], flySize: [8, 18], tree: 'pine', floor: '7,11,22'
    },
    morning: {
      aurora: ['245,163,127', '201,166,200', '255,210,160', '150,160,220'],
      sky: [[0, '#7d8fc4'], [.28, '#c3a3c9'], [.48, '#f3bea8'], [.64, '#ffd6b3'], [1, '#fff1e2']],
      glow: '255,196,150', glowA: .4, glowAt: [.3, .56],
      layers: [['#c2b0d2', '#b1a0c7'], ['#9d8cbc', '#8b7bae'], ['#76709f', '#65608f'], ['#4f5480', '#42466f'], ['#353b5c', '#2c3150']],
      fog: '255,242,236', fogMul: 3.2, rim: ['255,236,210', '255,160,110'], stars: 0,
      body: { type: 'sun', x: .3, y: .53, r: [44, 96], col: ['#fffcf2', '#ffc48a'], glow: '255,206,160', ga: .6 },
      clouds: { col: '255,226,218', a: .5, n: 5, yMax: .32 }, rays: true,
      particles: 'fireflies', blink: false, fly: ['255,255,250', '255,240,220', '255,220,190'], flySize: [6, 14], tree: 'pine', floor: '251,241,236'
    },
    day: {
      aurora: ['29,111,224', '140,194,255', '93,154,110', '255,236,170'],
      sky: [[0, '#3a80d6'], [.42, '#86bbee'], [.66, '#cbe4f7'], [1, '#eef6fb']],
      glow: '255,255,235', glowA: .3, glowAt: [.82, .18],
      layers: [['#a3c1d9', '#94b4ce'], ['#7ea8b6', '#6c97a6'], ['#5f9a70', '#4d875c'], ['#40804b', '#346c3e'], ['#2b5f34', '#24512c']],
      treeCols: [null, null, ['#3e7c4b', '#30693c'], ['#2c6437', '#23552e'], ['#1e4b26', '#183e1f']],
      fog: '236,245,252', fogMul: 1.5, rim: ['255,255,255', '140,194,255'], stars: 0,
      body: { type: 'sun', x: .82, y: .16, r: [26, 44], col: ['#ffffff', '#fff2b0'], glow: '255,250,210', ga: .7 },
      clouds: { col: '255,255,255', a: .88, n: 7, yMax: .4 },
      particles: 'birds', tree: 'round', floor: '242,247,251'
    }
  };
  let P = PALS.night;

  /* ---- hero aurora ---- */
  const hero = document.querySelector('.hero'), au = document.getElementById('aurora'), actx = au.getContext('2d');
  let aw = 1, ah = 1, amx = .5, amy = .5, tmx = .5, tmy = .5;
  const blobs = [
    { a: .30, r: .42, sx: .00008, sy: .00011, px: .78, py: .28, ph: 0 },
    { a: .26, r: .5, sx: .00006, sy: .00009, px: .25, py: .2, ph: 2 },
    { a: .30, r: .45, sx: .0001, sy: .00007, px: .55, py: .75, ph: 4 },
    { a: .42, r: .6, sx: .00005, sy: .00008, px: .15, py: .8, ph: 1 }
  ];
  function aSize() { aw = Math.max(1, Math.round(hero.clientWidth * .22)); ah = Math.max(1, Math.round(hero.clientHeight * .22)); au.width = aw; au.height = ah; }
  hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); tmx = (e.clientX - r.left) / r.width; tmy = (e.clientY - r.top) / r.height; kick(); });
  function aDraw(t) {
    amx += (tmx - amx) * .03; amy += (tmy - amy) * .03;
    actx.clearRect(0, 0, aw, ah); actx.globalCompositeOperation = 'lighter';
    blobs.forEach((b, i) => {
      const c = P.aurora[i];
      const x = aw * (b.px + Math.sin(t * b.sx + b.ph) * .18 + (amx - .5) * .14 * (i % 2 ? 1 : -1));
      const y = ah * (b.py + Math.cos(t * b.sy + b.ph) * .2 + (amy - .5) * .12);
      const r = Math.max(aw, ah) * b.r, g = actx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${c},${b.a})`); g.addColorStop(1, `rgba(${c},0)`);
      actx.fillStyle = g; actx.fillRect(0, 0, aw, ah);
    });
    actx.globalCompositeOperation = 'source-over';
  }

  /* ---- forest ---- */
  const forest = document.querySelector('.forest'), fc = document.getElementById('forest'), ctx = fc.getContext('2d');
  const PAD = 90, EXTRA = 140;
  const LAYERS = [
    { base: .52, amp: .17, freq: .9, oct: 5, fog: .10, trees: 0, depth: .12 },
    { base: .60, amp: .14, freq: 1.3, oct: 5, fog: .12, trees: 0, depth: .28 },
    { base: .68, amp: .11, freq: 1.8, oct: 4, fog: .12, trees: .55, th: 15, depth: .5 },
    { base: .78, amp: .08, freq: 2.4, oct: 4, fog: .10, trees: .8, th: 28, depth: .75 },
    { base: .90, amp: .06, freq: 3.2, oct: 3, fog: .08, trees: 1, th: 50, depth: 1 }
  ];
  let W = 1, H = 1, layerC = [], rimC = [], ridgeY = [], stars = [], flies = [], leaves = [], clouds = [], flocks = [], sky;
  const hl = [0, 0, 0, 0, 0]; let active = -1;
  const mouse = { x: 0, y: 0, in: false, sx: .5, tx: .5 };

  const spr = document.createElement('canvas'); spr.width = spr.height = 64;
  function makeSprite() {
    const g2 = spr.getContext('2d'), g = g2.createRadialGradient(32, 32, 0, 32, 32, 32), [a, b, c] = P.fly || PALS.night.fly;
    g2.clearRect(0, 0, 64, 64);
    g.addColorStop(0, `rgba(${a},1)`); g.addColorStop(.1, `rgba(${b},.95)`); g.addColorStop(.32, `rgba(${c},.3)`); g.addColorStop(1, `rgba(${c},0)`);
    g2.fillStyle = g; g2.fillRect(0, 0, 64, 64);
  }

  function pine(x, cx, by, h) {
    const w = h * .34, tiers = 5, ty = k => by - h + h * (k / tiers) * .9, tw = k => w * (k / tiers);
    x.moveTo(cx, by - h);
    for (let k = 1; k <= tiers; k++) { x.lineTo(cx + tw(k), ty(k)); if (k < tiers) x.lineTo(cx + tw(k) * .42, ty(k) - h * .015); }
    x.lineTo(cx + w * .07, by); x.lineTo(cx - w * .07, by);
    for (let k = tiers; k >= 1; k--) { if (k < tiers) x.lineTo(cx - tw(k) * .42, ty(k) - h * .015); x.lineTo(cx - tw(k), ty(k)); }
    x.closePath();
  }
  function broadleaf(x, cx, by, h, r) {
    const tw = h * .045;
    x.moveTo(cx - tw, by); x.lineTo(cx - tw * .7, by - h * .5); x.lineTo(cx + tw * .7, by - h * .5); x.lineTo(cx + tw, by); x.closePath();
    const blobs = [[0, .62, .3], [-.2, .52, .22], [.2, .54, .23], [-.08, .8, .2], [.1, .76, .19]];
    for (const [dx, dy, rr] of blobs) { const R = h * rr * (.85 + r() * .3), X = cx + dx * h, Y = by - dy * h; x.moveTo(X + R, Y); x.arc(X, Y, R, 0, 6.2832); }
  }

  function build() {
    W = forest.clientWidth; H = forest.clientHeight;
    fc.width = Math.round(W * DPR); fc.height = Math.round(H * DPR);
    sky = ctx.createLinearGradient(0, 0, 0, H);
    P.sky.forEach(([o, c]) => sky.addColorStop(o, c));
    const tscale = Math.max(.55, Math.min(1, W / 1200)), rnd = mulberry32(42);
    layerC = []; rimC = []; ridgeY = [];
    LAYERS.forEach((L, i) => {
      const w = W + PAD * 2, h = H + EXTRA, n = makeNoise(1337 + i * 97), n2 = makeNoise(7 + i * 31);
      const col = P.layers[i];
      const c = document.createElement('canvas'); c.width = Math.ceil(w * DPR); c.height = Math.ceil(h * DPR);
      const x = c.getContext('2d'); x.scale(DPR, DPR);
      const pts = []; let minY = H;
      for (let px = 0; px <= w + 3; px += 3) { const v = fbm(n, (px / 1000) * L.freq * 1.6 + i * 7.3, L.oct); const y = H * L.base - (v - .42) * 2.2 * H * L.amp; pts.push(y); if (y < minY) minY = y; }
      const at = px => pts[Math.max(0, Math.min(pts.length - 1, Math.round(px / 3)))];
      ridgeY.push(H * L.base - H * L.amp * .25);
      const fg = x.createLinearGradient(0, minY - H * .08, 0, H * L.base + H * .04);
      fg.addColorStop(0, `rgba(${P.fog},0)`); fg.addColorStop(1, `rgba(${P.fog},${Math.min(.6, L.fog * (P.fogMul || 1))})`);
      x.fillStyle = fg; x.fillRect(0, minY - H * .08, w, h);
      const th = (L.th || 0) * tscale;
      const grad = x.createLinearGradient(0, minY - th, 0, H);
      grad.addColorStop(0, col[0]); grad.addColorStop(1, col[1]);
      x.fillStyle = grad; x.beginPath(); x.moveTo(0, h);
      pts.forEach((y, k) => x.lineTo(k * 3, y)); x.lineTo(w, h); x.closePath(); x.fill();
      if (L.trees) {
        const tc = P.treeCols && P.treeCols[i];
        if (tc) { const tg = x.createLinearGradient(0, minY - th * 1.2, 0, H * L.base + H * L.amp); tg.addColorStop(0, tc[0]); tg.addColorStop(1, tc[1]); x.fillStyle = tg; }
        x.beginPath(); let px = rnd() * th;
        while (px < w) {
          const dense = n2(px * .006) + (i === 4 ? .4 : 0), hh = th * (.55 + rnd() * .8) * (.8 + dense * .35);
          if (dense > .38) {
            if (P.tree === 'round' && rnd() > .25) broadleaf(x, px, at(px) + th * .14, hh * .85, rnd);
            else pine(x, px, at(px) + th * .14, hh);
          }
          px += th * (.16 + rnd() * .5) / L.trees * (P.tree === 'round' ? 1.5 : 1);
        }
        x.fill();
      }
      layerC.push(c);
      const rc = document.createElement('canvas'); rc.width = c.width; rc.height = c.height;
      const r = rc.getContext('2d'); r.scale(DPR, DPR);
      r.strokeStyle = `rgba(${P.rim[0]},.95)`; r.lineWidth = 1.6; r.shadowColor = `rgba(${P.rim[1]},1)`; r.shadowBlur = 12; r.lineJoin = 'round';
      r.beginPath(); pts.forEach((y, k) => k ? r.lineTo(k * 3, y) : r.moveTo(0, y)); r.stroke();
      rimC.push(rc);
    });
    const sr = mulberry32(9);
    stars = Array.from({ length: Math.round(W * H / 5200) }, () => ({ x: sr() * W, y: Math.pow(sr(), 1.6) * H * .6, r: sr() * 1.2 + .3, ph: sr() * 6.28, sp: .0006 + sr() * .0016 }));
    const fr = mulberry32(3);
    flies = Array.from({ length: Math.round(Math.min(80, Math.max(26, W * H / 15000))) }, () => ({ x: fr() * W, y: H * (.42 + fr() * .54), vx: 0, vy: 0, a: fr() * 6.28, sp: .22 + fr() * .5, ph: fr() * 6.28, fr: .0007 + fr() * .0016, sz: (P.flySize ? P.flySize[0] + fr() * (P.flySize[1] - P.flySize[0]) : 14 + fr() * 20) }));
    const lr = mulberry32(5);
    leaves = Array.from({ length: Math.round(Math.min(56, Math.max(20, W * H / 20000))) }, () => ({ x: lr() * W, y: lr() * H, vx: 0, vy: .5, rot: lr() * 6.28, vr: (lr() - .5) * .04, flip: lr() * 6.28, vf: .02 + lr() * .04, s: 5 + lr() * 7, ph: lr() * 6.28, col: P.leafCols ? P.leafCols[Math.floor(lr() * P.leafCols.length)] : '#f7c52f' }));
  }

  let auc = null, aucx = null, lightSpr = [], lightNoise = makeNoise(99);
  function buildLights() {
    if (!P.lights) { auc = null; return; }
    auc = document.createElement('canvas'); auc.width = Math.ceil(W / 3); auc.height = Math.ceil(H * .62 / 3); aucx = auc.getContext('2d');
    lightSpr = P.lights.map(L => { const c = document.createElement('canvas'); c.width = 4; c.height = 128; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 128); L.cols.forEach(([o, cc]) => g.addColorStop(o, cc)); x.fillStyle = g; x.fillRect(0, 0, 4, 128); return c; });
  }
  function drawLights(ft, sp) {
    const aw2 = auc.width, ah2 = auc.height, k3 = aw2 / W;
    aucx.globalCompositeOperation = 'source-over'; aucx.globalAlpha = 1; aucx.clearRect(0, 0, aw2, ah2);
    aucx.globalCompositeOperation = 'lighter';
    P.lights.forEach((L, li) => {
      const sprite = lightSpr[li];
      for (let x = 0; x < aw2; x++) {
        const X = x / k3, n1 = lightNoise(X * .0022 + ft * L.s1 + li * 11), n2 = lightNoise(X * .006 - ft * L.s2 + li * 5);
        let yb = H * L.base + Math.sin(X * L.f + ft * L.w + li) * H * L.amp + (n1 - .5) * H * .08;
        let a = Math.pow(n2, 1.6) * L.a * (.72 + .28 * Math.sin(X * .045 + ft * .0026 + li * 2)) * (.45 + .75 * lightNoise(X * .09 + li * 3 + ft * .0004));
        if (mouse.in) { const d = Math.abs(X - mouse.x); if (d < 260) { const k = 1 - d / 260; a += k * k * .4; yb += (Math.min(mouse.y, H * .5) - yb) * k * .14; } }
        const h = H * (L.h[0] + L.h[1] * n1);
        aucx.globalAlpha = Math.min(1, a);
        aucx.drawImage(sprite, x, (yb - h) * k3, 1.7, h * k3);
      }
    });
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1;
    ctx.drawImage(auc, (mouse.sx - .5) * 6, sp * 10, W, ah2 / k3);
    ctx.globalCompositeOperation = 'source-over';
  }

  function buildSky() {
    const cr = mulberry32(21);
    clouds = [];
    if (P.clouds) {
      for (let k = 0; k < P.clouds.n; k++) {
        const cw = 140 + cr() * 220, chh = cw * .42, c = document.createElement('canvas');
        c.width = Math.ceil(cw * DPR); c.height = Math.ceil(chh * DPR);
        const x = c.getContext('2d'); x.scale(DPR, DPR);
        const puffs = 6 + Math.floor(cr() * 5);
        for (let p = 0; p < puffs; p++) {
          const px = cw * (.18 + cr() * .64), py = chh * (.45 + cr() * .3), pr = chh * (.22 + cr() * .28);
          const g = x.createRadialGradient(px, py, 0, px, py, pr);
          g.addColorStop(0, `rgba(${P.clouds.col},${P.clouds.a})`); g.addColorStop(.6, `rgba(${P.clouds.col},${P.clouds.a * .6})`); g.addColorStop(1, `rgba(${P.clouds.col},0)`);
          x.fillStyle = g; x.fillRect(0, 0, cw, chh);
        }
        clouds.push({ c, w: cw, h: chh, x: cr() * (W + cw) - cw, y: H * (.04 + cr() * (P.clouds.yMax - .04)), v: .06 + cr() * .16, d: .05 + cr() * .15 });
      }
    }
    const br = mulberry32(17);
    flocks = Array.from({ length: W < 720 ? 2 : 3 }, () => {
      const n = 4 + Math.floor(br() * 5);
      return { x: br() * W, y: H * (.04 + br() * .1), v: .5 + br() * .5, ph: br() * 6.28,
        birds: Array.from({ length: n }, (_, i) => { const side = i % 2 ? 1 : -1, rank = Math.ceil(i / 2); return { ox: -rank * 16, oy: side * rank * 9, dx: 0, dy: 0, vx: 0, vy: 0, ph: br() * 6.28, s: 5 + br() * 3 }; }) };
    });
  }

  function scrollP() { const r = forest.getBoundingClientRect(); return Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight)); }

  function drawBody(sp) {
    if (!P.body) return;
    const B = P.body, bx = W * (W < 720 && B.type === 'moon' ? .82 : B.x) + (mouse.sx - .5) * 10, by = H * B.y + sp * 12;
    const br = Math.max(B.r[0], Math.min(B.r[1], W * (B.type === 'moon' ? .028 : .06)));
    const g = ctx.createRadialGradient(bx, by, br * .6, bx, by, br * (B.type === 'moon' ? 6 : 4.5));
    g.addColorStop(0, `rgba(${B.glow},${B.ga})`); g.addColorStop(1, `rgba(${B.glow},0)`);
    ctx.fillStyle = g; ctx.fillRect(bx - br * 6, by - br * 6, br * 12, br * 12);
    const d = ctx.createRadialGradient(bx, by - br * .3, 0, bx, by, br);
    d.addColorStop(0, B.col[0]); d.addColorStop(1, B.col[1]);
    ctx.fillStyle = d; ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.2832); ctx.fill();
    if (B.type === 'moon') { ctx.fillStyle = 'rgba(180,186,205,.25)'; ctx.beginPath(); ctx.arc(bx - br * .3, by - br * .2, br * .22, 0, 6.2832); ctx.arc(bx + br * .35, by + br * .3, br * .14, 0, 6.2832); ctx.fill(); }
  }

  function fDraw(t) {
    const ft = RM ? 5200 : t, sp = scrollP();
    mouse.sx += (mouse.tx - mouse.sx) * .04;
    for (let i = 0; i < 5; i++) { const target = active === i ? 1 : 0; hl[i] = RM ? target : hl[i] + (target - hl[i]) * .07; }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const hg = ctx.createRadialGradient(W * P.glowAt[0], H * P.glowAt[1], 0, W * P.glowAt[0], H * P.glowAt[1], Math.max(W, H) * .6);
    hg.addColorStop(0, `rgba(${P.glow},${P.glowA})`); hg.addColorStop(1, `rgba(${P.glow},0)`);
    ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
    if (P.stars) {
      ctx.fillStyle = '#f2f0ea';
      for (const s of stars) { ctx.globalAlpha = P.stars * (.25 + .75 * (.5 + .5 * Math.sin(ft * s.sp + s.ph))) * (P.stars < 1 ? Math.max(0, 1 - s.y / (H * .35)) : 1); ctx.fillRect(s.x, s.y + sp * 8, s.r, s.r); }
      ctx.globalAlpha = 1;
    }
    if (auc) drawLights(ft, sp);
    drawBody(sp);
    for (const c of clouds) {
      if (!RM) { c.x += c.v; if (c.x > W + 20) c.x = -c.w - 20; }
      ctx.drawImage(c.c, c.x + (mouse.sx - .5) * c.d * 40, c.y + sp * c.d * 30, c.w, c.h);
    }
    const oys = [];
    LAYERS.forEach((L, i) => {
      const ox = -PAD + (mouse.sx - .5) * 2 * L.depth * 26, oy = sp * L.depth * 70; oys.push(oy);
      ctx.drawImage(layerC[i], ox, oy, W + PAD * 2, H + EXTRA);
      if (hl[i] > .01) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = hl[i] * .2; ctx.drawImage(layerC[i], ox, oy, W + PAD * 2, H + EXTRA);
        ctx.globalAlpha = hl[i] * .9; ctx.drawImage(rimC[i], ox, oy, W + PAD * 2, H + EXTRA);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }
    });
    if (P.rays) drawRays(ft, sp);
    const ff = ctx.createLinearGradient(0, H * .84, 0, H);
    ff.addColorStop(0, `rgba(${P.floor},0)`); ff.addColorStop(1, `rgba(${P.floor},1)`);
    ctx.fillStyle = ff; ctx.fillRect(0, H * .84, W, H * .16);
    if (P.particles === 'leaves') drawLeaves(ft, oys); else if (P.particles === 'birds') drawBirds(ft); else drawFlies(ft, oys);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }

  function drawFlies(ft, oys) {
    ctx.globalCompositeOperation = 'lighter';
    for (const f of flies) {
      if (!RM) {
        f.a += (Math.random() - .5) * .3;
        let ax = Math.cos(f.a) * f.sp, ay = Math.sin(f.a) * f.sp * .55;
        if (active >= 0) ay += (ridgeY[active] + oys[active] - 24 - f.y) * .0022;
        if (mouse.in) { const dx = mouse.x - f.x, dy = mouse.y - f.y, d = Math.hypot(dx, dy) || 1; if (d < 220) { const k = 1 - d / 220; ax += (dx / d) * k * .35 - (dy / d) * k * .55; ay += (dy / d) * k * .35 + (dx / d) * k * .55; } }
        f.vx += (ax - f.vx) * .04; f.vy += (ay - f.vy) * .04; f.x += f.vx; f.y += f.vy;
        if (f.x < -20) f.x = W + 20; if (f.x > W + 20) f.x = -20;
        if (f.y < H * .3) f.vy += .06; if (f.y > H - 12) f.vy -= .08;
      }
      const b = P.blink === false ? .3 + .45 * (Math.sin(ft * f.fr * .6 + f.ph) + 1) / 2 : .06 + .94 * Math.pow((Math.sin(ft * f.fr + f.ph) + 1) / 2, 5), s = f.sz * (.45 + b * .9);
      ctx.globalAlpha = b; ctx.drawImage(spr, f.x - s / 2, f.y - s / 2, s, s);
    }
  }

  function drawRays(ft, sp) {
    const B = P.body, bx = W * B.x + (mouse.sx - .5) * 10, by = H * B.y + sp * 12, len = Math.hypot(W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 9; k++) {
      const ang = -2.6 + k * .32 + Math.sin(ft * .00012 + k * 1.7) * .05, spread = .035 + (k % 3) * .018;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, len * .8);
      g.addColorStop(0, 'rgba(255,236,210,.1)'); g.addColorStop(1, 'rgba(255,236,210,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(ang - spread) * len, by + Math.sin(ang - spread) * len);
      ctx.lineTo(bx + Math.cos(ang + spread) * len, by + Math.sin(ang + spread) * len);
      ctx.closePath(); ctx.globalAlpha = .5 + .5 * Math.sin(ft * .0004 + k); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }

  function drawBirds(ft) {
    ctx.strokeStyle = 'rgba(24,38,56,.72)'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const fl of flocks) {
      if (!RM) { fl.x += fl.v; fl.y += Math.sin(ft * .0006 + fl.ph) * .12; if (fl.x > W + 120) { fl.x = -60; fl.y = H * (.04 + Math.random() * .1); } }
      for (const b of fl.birds) {
        let bx = fl.x + b.ox + b.dx, by = fl.y + b.oy + b.dy;
        if (!RM) {
          if (mouse.in) { const dx = bx - mouse.x, dy = by - mouse.y, d = Math.hypot(dx, dy) || 1; if (d < 150) { const k = 1 - d / 150; b.vx += dx / d * k * 1.4; b.vy += dy / d * k * 1.4 - k * .6; } }
          b.vx -= b.dx * .004; b.vy -= b.dy * .004; b.vx *= .94; b.vy *= .94; b.dx += b.vx; b.dy += b.vy;
          bx = fl.x + b.ox + b.dx; by = fl.y + b.oy + b.dy;
        }
        const flap = Math.sin(ft * .012 * (1 + Math.hypot(b.vx, b.vy) * .4) + b.ph), s = b.s;
        ctx.lineWidth = 1.4 + s * .08; ctx.beginPath();
        ctx.moveTo(bx - s, by - flap * s * .55); ctx.quadraticCurveTo(bx - s * .4, by - s * .15, bx, by);
        ctx.quadraticCurveTo(bx + s * .4, by - s * .15, bx + s, by - flap * s * .55); ctx.stroke();
      }
    }
  }

  function drawLeaves(ft, oys) {
    const wind = .35 + Math.sin(ft * .00025) * .45;
    for (const f of leaves) {
      if (!RM) {
        let tx = wind + Math.sin(ft * .0014 + f.ph) * .9, ty = .45 + f.s * .045;
        if (active >= 0) { const ry = ridgeY[active] + oys[active]; if (f.y > ry - 60 && f.y < ry + 30) { tx *= .3; ty *= .35; } }
        if (mouse.in) { const dx = f.x - mouse.x, dy = f.y - mouse.y, d = Math.hypot(dx, dy) || 1; if (d < 170) { const k = 1 - d / 170; f.vx += dx / d * k * .9; f.vy += dy / d * k * .7 - k * .3; f.vr += (Math.random() - .5) * k * .04; } }
        f.vx += (tx - f.vx) * .03; f.vy += (ty - f.vy) * .03; f.vr *= .99;
        f.x += f.vx; f.y += f.vy; f.rot += f.vr + Math.sin(ft * .002 + f.ph) * .01; f.flip += f.vf;
        if (f.y > H + 20) { f.y = -20; f.x = Math.random() * W; }
        if (f.x > W + 20) f.x = -20; if (f.x < -20) f.x = W + 20;
      }
      const s = f.s;
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot); ctx.scale(1, Math.cos(f.flip) * .8 + .2 * Math.sign(Math.cos(f.flip) || 1));
      ctx.globalAlpha = .55 + s / 26;
      ctx.fillStyle = f.col; ctx.beginPath();
      ctx.moveTo(-s, 0); ctx.quadraticCurveTo(-s * .2, -s * .75, s, 0); ctx.quadraticCurveTo(-s * .2, s * .75, -s, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(60,30,10,.35)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-s * 1.25, 0); ctx.lineTo(s * .85, 0); ctx.stroke();
      ctx.restore();
    }
  }

  forest.addEventListener('pointermove', e => { const r = forest.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.tx = mouse.x / r.width; mouse.in = e.pointerType === 'mouse'; kick(); });
  forest.addEventListener('pointerleave', () => { mouse.in = false; mouse.tx = .5; });

  document.querySelectorAll('.layers li').forEach(li => {
    const L = +li.dataset.layer;
    const on = () => { active = L; document.querySelectorAll('.layers li').forEach(o => o.classList.toggle('is-active', o === li)); kick(); };
    const off = () => { if (active === L) active = -1; li.classList.remove('is-active'); kick(); };
    li.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') on(); });
    li.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && document.activeElement !== li) off(); });
    li.addEventListener('focus', on); li.addEventListener('blur', off);
  });

  /* ---- loop ---- */
  let heroVis = true, forestVis = true, raf = 0;
  function loop(t) {
    raf = 0;
    if (heroVis) aDraw(t);
    if (forestVis) fDraw(t);
    if (!RM && (heroVis || forestVis)) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }
  new IntersectionObserver(es => es.forEach(e => { heroVis = e.isIntersecting; kick(); }), { rootMargin: '120px' }).observe(hero);
  new IntersectionObserver(es => es.forEach(e => { forestVis = e.isIntersecting; kick(); }), { rootMargin: '120px' }).observe(forest);
  addEventListener('scroll', () => { if (RM && forestVis) kick(); }, { passive: true });

  function resizeAll() { aSize(); build(); buildSky(); buildLights(); aDraw(0); fDraw(0); kick(); }
  let rT; new ResizeObserver(() => { clearTimeout(rT); rT = setTimeout(resizeAll, 60); }).observe(document.body);

  /* ---- design preview (temporary) ---- */
  const root = document.documentElement, tp = document.getElementById('typepick'), tpToggle = document.getElementById('tpToggle');
  const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }, recall = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
  function setType(v) {
    if (v) root.dataset.type = v; else delete root.dataset.type;
    tp.querySelectorAll('[data-type]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.type === v)));
    store('typePreview', v);
  }
  function setPalette(v, redraw = true) {
    if (v) root.dataset.palette = v; else delete root.dataset.palette;
    tp.querySelectorAll('[data-palette]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.palette === v)));
    P = PALS[v] || PALS.night; makeSprite(); store('palettePreview', v);
    if (redraw) resizeAll();
  }
  tp.querySelectorAll('[data-type]').forEach(b => b.addEventListener('click', () => setType(b.dataset.type)));
  tp.querySelectorAll('[data-palette]').forEach(b => b.addEventListener('click', () => setPalette(b.dataset.palette)));
  tpToggle.addEventListener('click', () => { const min = tp.classList.toggle('min'); tpToggle.textContent = min ? 'Show' : 'Hide'; tpToggle.setAttribute('aria-expanded', String(!min)); });
  setType(recall('typePreview'));
  setPalette(recall('palettePreview') || 'northern', false);

  resizeAll();
})();
