// ── THEME LOADER ──
async function loadTheme() {
  try {
    const res = await fetch('/content/settings/theme.json?t=' + Date.now());
    if (!res.ok) return;
    const t = await res.json();
    const r = document.documentElement.style;
    if (t.accent_color)  r.setProperty('--accent', t.accent_color);
    if (t.accent_hover)  r.setProperty('--accent-hover', t.accent_hover);
    if (t.bg_color)      r.setProperty('--bg', t.bg_color);
    if (t.bg_mid)        r.setProperty('--bg-mid', t.bg_mid);
    if (t.bg_soft)       r.setProperty('--bg-soft', t.bg_soft);
    if (t.text_color)    r.setProperty('--text', t.text_color);
    if (t.text_mid)      r.setProperty('--text-mid', t.text_mid);
    if (t.text_dim)      r.setProperty('--text-dim', t.text_dim);
    if (t.parchment)     r.setProperty('--parchment', t.parchment);

    // Fonts
    const fontMap = {
      'IM Fell English':     "'IM Fell English', serif",
      'Cormorant Garamond':  "'Cormorant Garamond', serif",
      'Playfair Display':    "'Playfair Display', serif",
      'Libre Baskerville':   "'Libre Baskerville', serif",
      'Lora':                "'Lora', serif",
    };
    if (t.heading_font && fontMap[t.heading_font]) r.setProperty('--font-display', fontMap[t.heading_font]);
    if (t.body_font && fontMap[t.body_font])       r.setProperty('--font-body', fontMap[t.body_font]);

    // Font size class
    const sizeMap = { small: 'fs-small', medium: 'fs-medium', large: 'fs-large', 'extra large': 'fs-xlarge' };
    document.body.classList.remove('fs-small','fs-medium','fs-large','fs-xlarge');
    if (t.base_font_size && sizeMap[t.base_font_size]) {
      document.body.classList.add(sizeMap[t.base_font_size]);
    }
  } catch(e) {}
}
loadTheme();

// ── LIGHTWEIGHT CURSOR ──
if (window.matchMedia('(hover: hover)').matches) {
  const cur = document.createElement('div');
  cur.className = 'cursor-dot';
  document.body.appendChild(cur);
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function loop() { cur.style.left = mx + 'px'; cur.style.top = my + 'px'; requestAnimationFrame(loop); })();
  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => { cur.style.width = '18px'; cur.style.height = '18px'; cur.style.opacity = '0.5'; });
    el.addEventListener('mouseleave', () => { cur.style.width = '8px'; cur.style.height = '8px'; cur.style.opacity = '1'; });
  });
}

// ── NAV SCROLL ──
const nav = document.getElementById('mainNav');
if (nav) window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50));

// ── MOBILE NAV ──
const toggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');
if (toggle && mobileNav) {
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    mobileNav.classList.toggle('open');
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
  });
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    toggle.classList.remove('open');
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
  }));
}

// ── ACTIVE NAV LINK ──
const path = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
  if (a.getAttribute('href') === path) a.classList.add('active');
});

// ── SCROLL FADE ──
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
