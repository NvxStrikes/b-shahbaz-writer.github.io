// ── CURSOR (lightweight, CSS-only movement) ──
const cur = document.createElement('div');
cur.style.cssText = `
  width:10px;height:10px;background:#c8a96e;border-radius:50%;
  position:fixed;top:0;left:0;pointer-events:none;z-index:9999;
  transform:translate(-50%,-50%);transition:width 0.2s,height 0.2s,opacity 0.2s;
  will-change:transform;
`;
document.body.appendChild(cur);
let mx = 0, my = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
(function loop() {
  cur.style.left = mx + 'px';
  cur.style.top  = my + 'px';
  requestAnimationFrame(loop);
})();
document.querySelectorAll('a,button').forEach(el => {
  el.addEventListener('mouseenter', () => { cur.style.width='20px'; cur.style.height='20px'; cur.style.opacity='0.5'; });
  el.addEventListener('mouseleave', () => { cur.style.width='10px'; cur.style.height='10px'; cur.style.opacity='1'; });
});
// Hide on mobile
if ('ontouchstart' in window) cur.style.display = 'none';

// ── NAV SCROLL ──
const nav = document.getElementById('mainNav');
if (nav) {
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50));
}

// ── MOBILE NAV ──
const toggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');
const mobileClose = document.getElementById('mobileClose');
if (toggle && mobileNav) {
  toggle.addEventListener('click', () => mobileNav.classList.add('open'));
  mobileClose?.addEventListener('click', () => mobileNav.classList.remove('open'));
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('open')));
}

// ── ACTIVE NAV LINK ──
const path = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
  if (a.getAttribute('href') === path) a.classList.add('active');
});

// ── FADE IN ON SCROLL ──
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
