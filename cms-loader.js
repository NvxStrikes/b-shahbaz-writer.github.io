// ══════════════════════════════════════
// CMS LOADER v8 FINAL — bisma-shahbaz
// ══════════════════════════════════════

const REPO = "NvxStrikes/b-shahbaz-writer.github.io";
const BRANCH = "main";
const API = `https://api.github.com/repos/${REPO}/contents`;
const RAW = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;

// Parse YAML frontmatter
function parseFM(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  m[1].split('\n').forEach(line => {
    const i = line.indexOf(':');
    if (i < 0) return;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (v === 'true') v = true;
    else if (v === 'false') v = false;
    else if (v !== '' && !isNaN(v)) v = Number(v);
    if (k) meta[k] = v;
  });
  // inline arrays: tags: ["a","b"]
  [...m[1].matchAll(/^(\w+):\s*\[(.*?)\]/gm)].forEach(([,k,v]) => {
    meta[k] = v.split(',').map(s => s.trim().replace(/^["']|["']$/g,'')).filter(Boolean);
  });
  return { meta, body: text.replace(/^---[\s\S]*?---\r?\n?/, '').trim() };
}

// Fetch JSON settings (served by Cloudflare directly)
async function getJSON(path) {
  try {
    const r = await fetch(`${path}?v=${Date.now()}`);
    return r.ok ? r.json() : null;
  } catch { return null; }
}

// List files in a folder via GitHub API
async function listFiles(folder) {
  try {
    const r = await fetch(`${API}/content/${folder}?ref=${BRANCH}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data) ? data.filter(f => f.name.endsWith('.md') && f.type === 'file') : [];
  } catch { return []; }
}

// Fetch single markdown file content via raw GitHub (with cache bust)
async function getRaw(folder, filename) {
  try {
    const r = await fetch(`${RAW}/content/${folder}/${filename}?v=${Date.now()}`, {
    });
    return r.ok ? r.text() : null;
  } catch { return null; }
}

// Full collection fetch
async function getCollection(folder) {
  const files = await listFiles(folder);
  if (!files.length) return [];
  const items = await Promise.all(files.map(async f => {
    try {
      // Use download_url directly from API response - most reliable
      const url = f.download_url + '?v=' + Date.now();
      const r = await fetch(url);
      if (!r.ok) { console.error('Failed to fetch', f.name, r.status); return null; }
      const text = await r.text();
      const { meta, body } = parseFM(text);
      return { ...meta, body, _file: f.name, _slug: f.name.replace('.md','') };
    } catch(e) { console.error('Error fetching', f.name, e); return null; }
  }));
  return items.filter(Boolean).sort((a,b) => (a.order||99)-(b.order||99));
}

// Single book by slug
async function getBook(slug) {
  try {
    // First try via GitHub API to get download_url
    const apiRes = await fetch(`${API}/content/books/${slug}.md?ref=${BRANCH}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    if (apiRes.ok) {
      const fileInfo = await apiRes.json();
      if (fileInfo.download_url) {
        const r = await fetch(fileInfo.download_url + '?v=' + Date.now());
        if (r.ok) {
          const text = await r.text();
          const { meta, body } = parseFM(text);
          return { ...meta, body, _slug: slug };
        }
      }
    }
    // Fallback to raw URL
    const text = await getRaw('books', `${slug}.md`);
    if (!text) return null;
    const { meta, body } = parseFM(text);
    return { ...meta, body, _slug: slug };
  } catch(e) { console.error('getBook error:', e); return null; }
}

// ── Helpers ──
const el = id => document.getElementById(id);
const set = (id, v) => { const e = el(id); if (e && v != null) e.textContent = v; };

const STATUS_LABEL = { published:'Published', wip:'WIP', upcoming:'Coming Soon', beta:'Beta Readers Open' };
const STATUS_CLASS = { published:'status-published', wip:'status-wip', upcoming:'status-upcoming', beta:'status-beta' };
const GENRE_LABEL  = { gothic:'Gothic Romance', literary:'Literary Fiction', fantasy:'Cozy Fantasy', other:'Other' };
const GENRE_GRAD   = { gothic:'linear-gradient(160deg,#1c1210,#0e0b08)', literary:'linear-gradient(160deg,#181010,#0e0b08)', fantasy:'linear-gradient(160deg,#101820,#0e0b08)', other:'linear-gradient(160deg,#12101a,#0e0b08)' };
const CAT_LABEL    = { essay:'Substack Essay', writing:'On Writing', review:'ARC Review', 'series-review':'Series Review', reflection:'Reflection', identity:'Identity & Voice', recs:'Book Recs' };

function badge(status) { return `<span class="book-status ${STATUS_CLASS[status]||'status-wip'}">${STATUS_LABEL[status]||'WIP'}</span>`; }
function grad(g) { return GENRE_GRAD[g] || 'linear-gradient(160deg,#1a1612,#0e0b08)'; }
function gLabel(g) { return GENRE_LABEL[g] || g || ''; }
function cLabel(c) { return CAT_LABEL[c] || 'Essay'; }

function coverHTML(b, large=false) {
  if (b.cover) return `<img src="${b.cover}" alt="${b.title||''}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;">`;
  return `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;">
    <div style="font-size:${large?'4rem':'3rem'};margin-bottom:14px;opacity:0.7">${b.emoji||'📖'}</div>
    <div style="font-family:var(--font-display);font-size:${large?'1.5rem':'1.15rem'};font-style:italic;color:var(--parchment);line-height:1.3;margin-bottom:10px;">${b.title||'Untitled'}</div>
    <div style="font-size:var(--fs-eyebrow);letter-spacing:0.14em;text-transform:uppercase;color:var(--text-dim);">Bisma Shahbaz</div>
  </div>`;
}

function observe(container) {
  const obs = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); }), {threshold:0.1});
  (container||document).querySelectorAll('.fade-up').forEach(x => obs.observe(x));
}

function applyLinks(d) {
  document.querySelectorAll('[data-social="instagram"]').forEach(a => { if(d.instagram) a.href=d.instagram; });
  document.querySelectorAll('[data-social="linktree"]').forEach(a => { if(d.linktree) a.href=d.linktree; });
  document.querySelectorAll('[data-social="substack"]').forEach(a => { if(d.substack) a.href=d.substack; });
}

// Book card for homepage grid
function bookCard(b, i) {
  const delay = i > 0 ? ` fade-up-delay-${Math.min(i,5)}` : '';
  return `<a href="book.html?id=${b._slug}" class="book-card card fade-up${delay}" style="text-decoration:none;display:block;" data-tags="${b.genre||''} ${b.status||''}">
    <div class="book-cover" style="background:${grad(b.genre)};position:relative;overflow:hidden;aspect-ratio:2/3;">${badge(b.status)}${coverHTML(b)}</div>
    <div class="book-info">
      <div class="book-title">${b.title||'Untitled'}</div>
      <div class="book-genre">${gLabel(b.genre)} · ${STATUS_LABEL[b.status]||'WIP'}</div>
    </div>
  </a>`;
}

// Book item for books page grid
function bookItem(b, i) {
  const delay = i > 0 ? ` fade-up-delay-${Math.min(i,5)}` : '';
  return `<a href="book.html?id=${b._slug}" class="book-item fade-up${delay}" style="text-decoration:none;display:block;" data-tags="${b.genre||''} ${b.status||''}">
    <div class="book-cover-wrap" style="background:${grad(b.genre)};position:relative;overflow:hidden;aspect-ratio:2/3;">${badge(b.status)}${coverHTML(b)}</div>
    <div class="book-meta">
      <div class="bm-title">${b.title||'Untitled'}</div>
      <div class="bm-genre">${gLabel(b.genre)} · ${STATUS_LABEL[b.status]||'WIP'}</div>
      ${b.description?`<div class="bm-desc">${b.description}</div>`:''}
      ${b.tags?.length?`<div class="bm-tags">${b.tags.map(t=>`<span class="bm-tag">${t}</span>`).join('')}</div>`:''}
    </div>
  </a>`;
}

// Article list item
function articleItem(a, i) {
  const dt = a.date ? new Date(a.date).toLocaleDateString('en-GB',{year:'numeric',month:'long'}) : '';
  return `<a href="${a.external_url||'#'}" ${a.external_url?'target="_blank"':''} class="article-item fade-up">
    <div class="ai-num">0${i+1}</div>
    <div class="ai-body">
      <div class="ai-meta"><span class="ai-tag">${cLabel(a.category)}</span><span class="ai-date">${dt}</span></div>
      <div class="ai-title">${a.title||'Untitled'}</div>
      <p class="ai-excerpt">${a.excerpt||''}</p>
      <div class="ai-read">Read Essay →</div>
    </div>
  </a>`;
}

// ══════════════════════════════════════
// PAGE LOADERS
// ══════════════════════════════════════

async function loadHomepage() {
  const d = await getJSON('/content/settings/homepage.json');
  if (d) {
    set('heroEyebrow',d.hero_eyebrow); set('heroNameFirst',d.hero_name_first); set('heroNameLast',d.hero_name_last);
    set('heroTagline',d.hero_tagline); set('heroQuote',d.hero_quote);
    set('introEyebrow',d.intro_eyebrow); set('introHeading',d.intro_heading);
    set('introP1',d.intro_p1); set('introP2',d.intro_p2);
    set('stat1Num',d.intro_stat_1_num); set('stat1Label',d.intro_stat_1_label);
    set('stat2Num',d.intro_stat_2_num); set('stat2Label',d.intro_stat_2_label);
    set('stat3Num',d.intro_stat_3_num); set('stat3Label',d.intro_stat_3_label);
    set('stat4Num',d.intro_stat_4_num); set('stat4Label',d.intro_stat_4_label);
    set('booksEyebrow',d.books_eyebrow); set('booksHeading',d.books_heading);
    set('bigQuote',d.big_quote); set('quoteAttr',d.quote_attr);
    set('articlesEyebrow',d.articles_eyebrow); set('articlesHeading',d.articles_heading);

    const c1=el('heroCta1'), c2=el('heroCta2');
    if(c1){if(d.cta_primary_text)c1.textContent=d.cta_primary_text; if(d.cta_primary_link)c1.href=d.cta_primary_link;}
    if(c2){if(d.cta_secondary_text)c2.textContent=d.cta_secondary_text+' →'; if(d.cta_secondary_link)c2.href=d.cta_secondary_link;}
    const i1=el('introCta1'), i2=el('introCta2');
    if(i1){if(d.intro_cta1_text)i1.textContent=d.intro_cta1_text; if(d.intro_cta1_link)i1.href=d.intro_cta1_link;}
    if(i2){if(d.intro_cta2_text)i2.textContent=d.intro_cta2_text+' →'; if(d.intro_cta2_link)i2.href=d.intro_cta2_link;}

    if(d.hero_genres?.length) { const g=el('heroGenres'); if(g) g.innerHTML=d.hero_genres.map(x=>`<span class="genre-tag">${x}</span>`).join(''); }
    if(d.marquee_items?.length) { const m=el('marqueeInner'); if(m) m.innerHTML=[...d.marquee_items,...d.marquee_items].map(x=>`<span class="marquee-item">${x}</span>`).join(''); }
  }

  // Featured books
  const br = el('homeBooksRow');
  if (br) {
    const books = await getCollection('books');
    const feat = books.filter(b => b.featured===true||b.featured==='true');
    const show = feat.length ? feat : books.slice(0,3);
    if (show.length) { br.innerHTML = show.map((b,i)=>bookCard(b,i)).join(''); observe(br); }
    else br.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim);font-style:italic;font-family:var(--font-serif)">No featured books yet — add books in admin.</div>`;
  }

  // Latest articles
  const ar = el('homeArticlesRow');
  if (ar) {
    const arts = await getCollection('articles');
    arts.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
    if (arts.length) {
      ar.innerHTML = arts.slice(0,3).map((a,i)=>`
        <div class="article-card card fade-up${i>0?` fade-up-delay-${i}`:''}">
          <div class="article-num">0${i+1}</div>
          <div class="article-tag">${cLabel(a.category)}</div>
          <div class="article-title">${a.title}</div>
          <p class="article-excerpt">${a.excerpt||''}</p>
          <div class="article-date">${a.date?new Date(a.date).toLocaleDateString('en-GB',{year:'numeric',month:'long'}):'Essay'}</div>
        </div>`).join('');
      observe(ar);
    } else ar.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim);font-style:italic;font-family:var(--font-serif)">No articles yet.</div>`;
  }

  const lnk = await getJSON('/content/settings/links.json');
  if (lnk) applyLinks(lnk);
}

async function loadBooks() {
  const grid = el('booksGrid');
  if (!grid) return;
  grid.innerHTML = `<div class="books-empty">Loading books...</div>`;
  const books = await getCollection('books');
  if (!books.length) { grid.innerHTML = `<div class="books-empty">No books added yet — check back soon.</div>`; return; }
  grid.innerHTML = books.map((b,i)=>bookItem(b,i)).join('');
  observe(grid);
}

async function loadBookDetail() {
  const cont = el('bookDetail');
  if (!cont) return;
  const slug = new URLSearchParams(window.location.search).get('id');
  if (!slug) { cont.innerHTML = `<div class="bd-not-found">No book specified. <a href="books.html" style="color:var(--accent)">← Back to Books</a></div>`; return; }

  cont.innerHTML = `<div style="text-align:center;padding:100px 20px;color:var(--text-dim);font-style:italic;font-family:var(--font-serif)">Loading...</div>`;
  const b = await getBook(slug);
  if (!b) { cont.innerHTML = `<div class="bd-not-found">Book not found. <a href="books.html" style="color:var(--accent)">← Back to Books</a></div>`; return; }

  document.title = `${b.title} — Bisma Shahbaz`;
  cont.innerHTML = `
    <a href="books.html" class="bd-back">← Back to Books</a>
    <div class="book-detail-grid fade-up">
      <div class="bd-cover-wrap">
        <div class="bd-cover" style="background:${grad(b.genre)};position:relative;overflow:hidden;aspect-ratio:2/3;">${coverHTML(b,true)}</div>
        <span class="${STATUS_CLASS[b.status]||'status-wip'}" style="display:inline-block;margin-top:14px;font-size:0.62rem;letter-spacing:0.16em;text-transform:uppercase;padding:6px 16px;">${STATUS_LABEL[b.status]||'WIP'}</span>
        ${b.tags?.length?`<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;">${b.tags.map(t=>`<span style="font-size:0.62rem;letter-spacing:0.1em;text-transform:uppercase;border:1px solid rgba(200,169,110,0.15);color:var(--text-dim);padding:4px 10px;">${t}</span>`).join('')}</div>`:''}
      </div>
      <div>
        <div style="font-size:var(--fs-eyebrow);letter-spacing:0.25em;text-transform:uppercase;color:var(--text-dim);margin-bottom:14px;">✦ ${gLabel(b.genre)}</div>
        <h1 style="font-family:var(--font-display);font-size:clamp(2.2rem,5vw,4rem);font-style:italic;color:var(--parchment);line-height:1.1;margin-bottom:8px;">${b.title||'Untitled'}</h1>
        <div style="font-size:var(--fs-eyebrow);letter-spacing:0.18em;text-transform:uppercase;color:var(--accent);margin-bottom:28px;">By Bisma Shahbaz</div>
        <div style="width:60px;height:1px;background:linear-gradient(to right,var(--accent),transparent);margin-bottom:28px;"></div>
        ${b.description?`<p style="font-size:var(--fs-body-lg);line-height:1.95;color:var(--text-mid);margin-bottom:24px;font-weight:300;">${b.description}</p>`:''}
        ${b.body?`<div style="font-size:var(--fs-body-lg);line-height:1.95;color:var(--text-mid);font-weight:300;">${b.body.split('\n\n').map(p=>p.trim()?`<p style="margin-bottom:18px">${p}</p>`:'').join('')}</div>`:''}
        ${b.beta_open?`<div style="margin-top:44px;padding:28px 32px;background:rgba(200,169,110,0.06);border:1px solid rgba(200,169,110,0.15);border-left:3px solid var(--accent);">
          <h3 style="font-family:var(--font-display);font-size:1.5rem;font-style:italic;color:var(--parchment);margin-bottom:10px;">Beta Readers Open</h3>
          <p style="font-size:var(--fs-body);line-height:1.8;color:var(--text-mid);margin-bottom:18px;">Bisma is looking for beta readers for this book. She'd love to hear from you.</p>
          <a href="contact.html" class="btn btn-gold">Sign Up to Beta Read</a>
        </div>`:''}
      </div>
    </div>`;
  observe(cont);
}

async function loadArticles() {
  const list = el('articlesList'), feat = el('articleFeatured');
  if (!list) return;
  list.innerHTML = `<div class="articles-empty">Loading articles...</div>`;
  const arts = await getCollection('articles');
  arts.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
  if (!arts.length) { if(feat)feat.style.display='none'; list.innerHTML=`<div class="articles-empty">No articles yet — check back soon.</div>`; return; }
  const fa = arts.find(a=>a.featured===true||a.featured==='true') || arts[0];
  const rest = arts.filter(a=>a._file!==fa._file);
  if (feat) { feat.style.display='block'; feat.innerHTML=`<span class="af-badge">Latest Essay</span><div class="af-title">${fa.title||'Untitled'}</div><p class="af-excerpt">${fa.excerpt||''}</p><a href="${fa.external_url||'#'}" ${fa.external_url?'target="_blank"':''} class="btn btn-outline">Read on Substack →</a>`; }
  list.innerHTML = rest.map((a,i)=>articleItem(a,i)).join('');
  observe(list);
}

async function loadAbout() {
  const d = await getJSON('/content/settings/about.json');
  if (!d) return;
  set('aboutHeroEyebrow',d.hero_eyebrow); set('aboutHeroTitle',d.hero_title); set('aboutHeroSubtitle',d.hero_subtitle);
  set('aboutOriginEyebrow',d.origin_eyebrow); set('aboutOriginHeading',d.origin_heading);
  set('aboutOriginP1',d.origin_p1); set('aboutOriginP2',d.origin_p2);
  set('aboutHighlightQuote',d.highlight_quote);
  set('aboutWritingEyebrow',d.writing_eyebrow); set('aboutWritingHeading',d.writing_heading);
  set('aboutWritingP1',d.writing_p1); set('aboutWritingP2',d.writing_p2);
  set('aboutReadingEyebrow',d.reading_eyebrow); set('aboutReadingHeading',d.reading_heading);
  set('aboutReadingIntro',d.reading_intro);
  set('aboutFactsEyebrow',d.facts_eyebrow); set('aboutFactsHeading',d.facts_heading);
  const rg=el('aboutRecs'); if(rg&&d.recs?.length) rg.innerHTML=d.recs.map(r=>`<div class="rec-item"><div class="rec-title">${r.title}</div><div class="rec-author">${r.author}</div></div>`).join('');
  const fl=el('aboutFacts'); if(fl&&d.facts?.length) fl.innerHTML=d.facts.map(f=>`<li><span class="fact-icon">✦</span> ${f}</li>`).join('');
  const sl=el('aboutSidebarLinks'); if(sl&&d.sidebar_links?.length) sl.innerHTML=d.sidebar_links.map(l=>`<a href="${l.url}" ${l.external?'target="_blank"':''} class="sidebar-link">${l.label} <span>${l.external?'↗':'→'}</span></a>`).join('');
  if(d.photo){const fr=el('authorPhotoFrame');if(fr)fr.innerHTML=`<img src="${d.photo}" alt="Bisma Shahbaz" style="width:100%;height:100%;object-fit:cover;">`;}
}

async function loadShop() {
  const d = await getJSON('/content/settings/links.json');
  if (!d) return;
  applyLinks(d);
  const ig=el('linkInstagram'),lt=el('linkLinktree'),ss=el('linkSubstack');
  if(ig&&d.instagram)ig.href=d.instagram; if(lt&&d.linktree)lt.href=d.linktree; if(ss&&d.substack)ss.href=d.substack;
  const h=el('instagramHandle'); if(h&&d.instagram_handle)h.textContent=d.instagram_handle;
  const ex=el('extraLinks'); if(ex&&d.extra_links?.length) ex.innerHTML=d.extra_links.map(l=>`<a href="${l.url}" target="_blank" class="link-card"><div class="lc-icon">${l.icon||'🔗'}</div><div class="lc-body"><div class="lc-title">${l.title}</div><div class="lc-desc">${l.desc||''}</div></div><div class="lc-arrow">↗</div></a>`).join('');
}

// AUTO RUN
const pg = window.location.pathname.split('/').pop() || 'index.html';
if (pg===''||pg==='index.html') loadHomepage();
if (pg==='books.html') loadBooks();
if (pg==='book.html') loadBookDetail();
if (pg==='articles.html') loadArticles();
if (pg==='about.html') loadAbout();
if (pg==='shop.html') loadShop();
