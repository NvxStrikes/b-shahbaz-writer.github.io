// ══════════════════════════════════════
// CMS LOADER v5 — bisma-shahbaz
// GitHub API + Featured filter + Book detail
// ══════════════════════════════════════

const GITHUB_REPO = "NvxStrikes/b-shahbaz-writer.github.io";
const GITHUB_BRANCH = "main";
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/contents`;

// ── PARSE FRONTMATTER ──
function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  const raw = match[1];
  raw.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) return;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (val !== '' && !isNaN(val)) val = Number(val);
    if (key) meta[key] = val;
  });
  [...raw.matchAll(/^(\w+):\s*\[(.*?)\]/gm)].forEach(([, k, v]) => {
    meta[k] = v.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  });
  return { meta, body: text.replace(/^---[\s\S]*?---\n?/, '').trim() };
}

// ── FETCH JSON ──
async function fetchJSON(path) {
  try {
    const res = await fetch(path + '?t=' + Date.now());
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// ── FETCH COLLECTION via GitHub API ──
async function fetchCollection(folder) {
  try {
    const res = await fetch(`${GITHUB_API}/content/${folder}?ref=${GITHUB_BRANCH}&t=${Date.now()}`);
    if (!res.ok) return [];
    const files = await res.json();
    const mdFiles = files.filter(f => f.name.endsWith('.md') && f.type === 'file');
    if (!mdFiles.length) return [];
    const items = await Promise.all(mdFiles.map(async f => {
      const r = await fetch(f.download_url + '?t=' + Date.now());
      const text = await r.text();
      const { meta, body } = parseFrontmatter(text);
      return { ...meta, body, _file: f.name, _slug: f.name.replace('.md', '') };
    }));
    return items.sort((a, b) => (a.order || 99) - (b.order || 99));
  } catch(e) {
    console.error('fetchCollection error:', e);
    return [];
  }
}

// ── FETCH SINGLE FILE via GitHub API ──
async function fetchSingleBook(slug) {
  try {
    const res = await fetch(`${GITHUB_API}/content/books/${slug}.md?ref=${GITHUB_BRANCH}&t=${Date.now()}`);
    if (!res.ok) return null;
    const fileInfo = await res.json();
    const r = await fetch(fileInfo.download_url + '?t=' + Date.now());
    const text = await r.text();
    const { meta, body } = parseFrontmatter(text);
    return { ...meta, body, _file: `${slug}.md`, _slug: slug };
  } catch { return null; }
}

// ── HELPERS ──
const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.textContent = val; };

function statusBadge(status, className='book-status') {
  const map = {
    published: ['Published', 'status-published'],
    wip: ['WIP', 'status-wip'],
    upcoming: ['Coming Soon', 'status-upcoming'],
    beta: ['Beta Readers Open', 'status-beta']
  };
  const [label, cls] = map[status] || ['WIP', 'status-wip'];
  return `<span class="${className} ${cls}">${label}</span>`;
}

function genreGrad(genre) {
  return { gothic: 'linear-gradient(160deg,#1c1210,#0e0b08)', literary: 'linear-gradient(160deg,#181010,#0e0b08)', fantasy: 'linear-gradient(160deg,#101820,#0e0b08)' }[genre] || 'linear-gradient(160deg,#1a1612,#0e0b08)';
}

function genreLabel(genre) {
  return { gothic: 'Gothic Romance', literary: 'Literary Fiction', fantasy: 'Cozy Fantasy' }[genre] || genre || '';
}

function catLabel(cat) {
  return { essay: 'Substack Essay', writing: 'On Writing', review: 'ARC Review', 'series-review': 'Series Review', reflection: 'Reflection', identity: 'Identity & Voice', recs: 'Book Recs' }[cat] || 'Essay';
}

function bookCoverHTML(book, large = false) {
  const size = large ? '4rem' : '3.2rem';
  const titleSize = large ? '1.5rem' : '1.2rem';
  if (book.cover) {
    return `<img src="${book.cover}" alt="${book.title}" style="width:100%;height:100%;object-fit:cover;object-position:center top;position:absolute;inset:0;">`;
  }
  return `<div class="${large ? 'bd-cover-art' : 'book-cover-art'}">
    <div style="font-size:${size};margin-bottom:14px;opacity:0.7">${book.emoji || '📖'}</div>
    <div style="font-family:var(--font-display);font-size:${titleSize};font-style:italic;color:var(--parchment);line-height:1.3;margin-bottom:10px;text-align:center">${book.title || 'Untitled'}</div>
    <div style="font-size:var(--fs-eyebrow);letter-spacing:0.14em;text-transform:uppercase;color:var(--text-dim)">Bisma Shahbaz</div>
  </div>`;
}

function observeFade(container) {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  (container || document).querySelectorAll('.fade-up').forEach(el => obs.observe(el));
}

// ── BOOK CARD HTML (links to detail page) ──
function bookCardHTML(book, i, cardClass = 'book-card card') {
  const delay = i > 0 ? ` fade-up-delay-${Math.min(i, 5)}` : '';
  return `
    <a href="book.html?id=${book._slug}" class="${cardClass} fade-up${delay}" data-tags="${book.genre || ''} ${book.status || ''}" style="text-decoration:none;display:block;">
      <div class="book-cover" style="background:${genreGrad(book.genre)};position:relative;overflow:hidden;">
        ${statusBadge(book.status)}
        ${bookCoverHTML(book)}
      </div>
      <div class="book-info">
        <div class="book-title">${book.title || 'Untitled'}</div>
        <div class="book-genre">${genreLabel(book.genre)} · ${book.status === 'published' ? 'Published' : book.status === 'beta' ? 'Beta Open' : 'WIP'}</div>
      </div>
    </a>`;
}

function bookItemHTML(book, i) {
  const delay = i > 0 ? ` fade-up-delay-${Math.min(i, 5)}` : '';
  return `
    <a href="book.html?id=${book._slug}" class="book-item fade-up${delay}" data-tags="${book.genre || ''} ${book.status || ''}" style="text-decoration:none;display:block;">
      <div class="book-cover-wrap" style="background:${genreGrad(book.genre)};position:relative;overflow:hidden;">
        ${statusBadge(book.status)}
        ${bookCoverHTML(book)}
      </div>
      <div class="book-meta">
        <div class="bm-title">${book.title || 'Untitled'}</div>
        <div class="bm-genre">${genreLabel(book.genre)} · ${book.status === 'published' ? 'Published' : book.status === 'beta' ? 'Beta Open' : 'WIP'}</div>
        ${book.description ? `<div class="bm-desc">${book.description}</div>` : ''}
        ${book.tags && book.tags.length ? `<div class="bm-tags">${book.tags.map(t => `<span class="bm-tag">${t}</span>`).join('')}</div>` : ''}
      </div>
    </a>`;
}

// ── ARTICLE ITEM HTML ──
function articleItemHTML(article, i) {
  const dateStr = article.date ? new Date(article.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' }) : '';
  return `
    <a href="${article.external_url || '#'}" target="_blank" class="article-item fade-up">
      <div class="ai-num">0${i + 1}</div>
      <div class="ai-body">
        <div class="ai-meta"><span class="ai-tag">${catLabel(article.category)}</span><span class="ai-date">${dateStr}</span></div>
        <div class="ai-title">${article.title || 'Untitled'}</div>
        <p class="ai-excerpt">${article.excerpt || ''}</p>
        <div class="ai-read">Read Essay →</div>
      </div>
    </a>`;
}

// ── SOCIAL LINKS ──
function applySocialLinks(data) {
  document.querySelectorAll('[data-social="instagram"]').forEach(a => { if (data.instagram) a.href = data.instagram; });
  document.querySelectorAll('[data-social="linktree"]').forEach(a => { if (data.linktree) a.href = data.linktree; });
  document.querySelectorAll('[data-social="substack"]').forEach(a => { if (data.substack) a.href = data.substack; });
}

// ══════════════════════════════════════
// HOMEPAGE
// ══════════════════════════════════════
async function loadHomepage() {
  const data = await fetchJSON('/content/settings/homepage.json');
  if (data) {
    set('heroEyebrow', data.hero_eyebrow);
    set('heroNameFirst', data.hero_name_first);
    set('heroNameLast', data.hero_name_last);
    set('heroTagline', data.hero_tagline);
    set('heroQuote', data.hero_quote);
    set('introEyebrow', data.intro_eyebrow);
    set('introHeading', data.intro_heading);
    set('introP1', data.intro_p1);
    set('introP2', data.intro_p2);
    set('stat1Num', data.intro_stat_1_num); set('stat1Label', data.intro_stat_1_label);
    set('stat2Num', data.intro_stat_2_num); set('stat2Label', data.intro_stat_2_label);
    set('stat3Num', data.intro_stat_3_num); set('stat3Label', data.intro_stat_3_label);
    set('stat4Num', data.intro_stat_4_num); set('stat4Label', data.intro_stat_4_label);
    set('booksEyebrow', data.books_eyebrow);
    set('booksHeading', data.books_heading);
    set('bigQuote', data.big_quote);
    set('quoteAttr', data.quote_attr);
    set('articlesEyebrow', data.articles_eyebrow);
    set('articlesHeading', data.articles_heading);

    const cta1 = document.getElementById('heroCta1');
    const cta2 = document.getElementById('heroCta2');
    if (cta1) { if (data.cta_primary_text) cta1.textContent = data.cta_primary_text; if (data.cta_primary_link) cta1.href = data.cta_primary_link; }
    if (cta2) { if (data.cta_secondary_text) cta2.textContent = data.cta_secondary_text + ' →'; if (data.cta_secondary_link) cta2.href = data.cta_secondary_link; }
    const ic1 = document.getElementById('introCta1');
    const ic2 = document.getElementById('introCta2');
    if (ic1) { if (data.intro_cta1_text) ic1.textContent = data.intro_cta1_text; if (data.intro_cta1_link) ic1.href = data.intro_cta1_link; }
    if (ic2) { if (data.intro_cta2_text) ic2.textContent = data.intro_cta2_text + ' →'; if (data.intro_cta2_link) ic2.href = data.intro_cta2_link; }

    if (data.hero_genres && data.hero_genres.length) {
      const genres = document.getElementById('heroGenres');
      if (genres) genres.innerHTML = data.hero_genres.map(g => `<span class="genre-tag">${g}</span>`).join('');
    }
    if (data.marquee_items && data.marquee_items.length) {
      const marquee = document.getElementById('marqueeInner');
      if (marquee) {
        const doubled = [...data.marquee_items, ...data.marquee_items];
        marquee.innerHTML = doubled.map(m => `<span class="marquee-item">${m}</span>`).join('');
      }
    }
  }

  // ── FEATURED BOOKS ONLY on homepage ──
  const booksRow = document.getElementById('homeBooksRow');
  if (booksRow) {
    const books = await fetchCollection('books');
    // Only show featured books — if none are featured, show first 3
    const featured = books.filter(b => b.featured === true || b.featured === 'true');
    const toShow = featured.length ? featured : books.slice(0, 3);
    if (toShow.length) {
      booksRow.innerHTML = toShow.map((b, i) => bookCardHTML(b, i)).join('');
      observeFade(booksRow);
    } else {
      booksRow.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim);font-style:italic;font-family:var(--font-serif)">No featured books yet — add books in the admin panel.</div>`;
    }
  }

  // Articles
  const articlesRow = document.getElementById('homeArticlesRow');
  if (articlesRow) {
    const articles = await fetchCollection('articles');
    articles.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    if (articles.length) {
      articlesRow.innerHTML = articles.slice(0, 3).map((a, i) => `
        <div class="article-card card fade-up${i > 0 ? ` fade-up-delay-${i}` : ''}">
          <div class="article-num">0${i + 1}</div>
          <div class="article-tag">${catLabel(a.category)}</div>
          <div class="article-title">${a.title}</div>
          <p class="article-excerpt">${a.excerpt || ''}</p>
          <div class="article-date">${a.date ? new Date(a.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' }) : 'Essay'}</div>
        </div>`).join('');
      observeFade(articlesRow);
    } else {
      articlesRow.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim);font-style:italic;font-family:var(--font-serif)">No articles yet — check back soon.</div>`;
    }
  }

  const links = await fetchJSON('/content/settings/links.json');
  if (links) applySocialLinks(links);
}

// ══════════════════════════════════════
// BOOKS PAGE — shows ALL books
// ══════════════════════════════════════
async function loadBooks() {
  const grid = document.getElementById('booksGrid');
  if (!grid) return;
  grid.innerHTML = `<div class="books-empty">Loading books...</div>`;
  const books = await fetchCollection('books');
  if (!books.length) {
    grid.innerHTML = `<div class="books-empty">No books added yet — check back soon.</div>`;
    return;
  }
  grid.innerHTML = books.map((b, i) => bookItemHTML(b, i)).join('');
  observeFade(grid);
}

// ══════════════════════════════════════
// BOOK DETAIL PAGE
// ══════════════════════════════════════
async function loadBookDetail() {
  const container = document.getElementById('bookDetail');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('id');

  if (!slug) {
    container.innerHTML = `<div class="bd-not-found">No book specified. <a href="books.html" style="color:var(--accent)">← Back to Books</a></div>`;
    return;
  }

  const book = await fetchSingleBook(slug);

  if (!book) {
    container.innerHTML = `<div class="bd-not-found">Book not found. <a href="books.html" style="color:var(--accent)">← Back to Books</a></div>`;
    return;
  }

  // Update page title
  document.title = `${book.title} — Bisma Shahbaz`;

  const statusMap = { published: 'Published', wip: 'WIP', upcoming: 'Coming Soon', beta: 'Beta Readers Open' };
  const statusClass = { published: 'status-published', wip: 'status-wip', upcoming: 'status-upcoming', beta: 'status-beta' };

  container.innerHTML = `
    <a href="books.html" class="bd-back">← Back to Books</a>
    <div class="book-detail-grid fade-up">
      <!-- COVER -->
      <div class="bd-cover-wrap">
        <div class="bd-cover" style="background:${genreGrad(book.genre)};">
          ${book.cover
            ? `<img src="${book.cover}" alt="${book.title}" style="width:100%;height:100%;object-fit:cover;object-position:center top;">`
            : `<div class="bd-cover-art">
                <div class="bd-cover-ornament">${book.emoji || '📖'}</div>
                <div class="bd-cover-title">${book.title || 'Untitled'}</div>
                <div class="bd-cover-author">Bisma Shahbaz</div>
              </div>`
          }
        </div>
        <span class="bd-status ${statusClass[book.status] || 'status-wip'}">${statusMap[book.status] || 'WIP'}</span>
        ${book.tags && book.tags.length ? `<div class="bd-tags">${book.tags.map(t => `<span class="bd-tag">${t}</span>`).join('')}</div>` : ''}
      </div>

      <!-- CONTENT -->
      <div class="bd-content">
        <div class="bd-eyebrow">${genreLabel(book.genre)}</div>
        <h1 class="bd-title">${book.title || 'Untitled'}</h1>
        <div class="bd-genre">By Bisma Shahbaz</div>
        <div class="bd-divider"></div>

        ${book.description ? `<p class="bd-description">${book.description}</p>` : ''}

        ${book.body ? `<div class="bd-body">${book.body.split('\n\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}</div>` : ''}

        ${book.beta_open ? `
        <div class="bd-beta-box">
          <h3>Beta Readers Open</h3>
          <p>Bisma is currently looking for beta readers for this book. If you'd like to read an early draft and share feedback, she'd love to hear from you.</p>
          <a href="contact.html?beta=${encodeURIComponent(book.title)}" class="btn btn-gold">Sign Up to Beta Read</a>
        </div>` : ''}
      </div>
    </div>`;

  observeFade(container);
}

// ══════════════════════════════════════
// ARTICLES PAGE
// ══════════════════════════════════════
async function loadArticles() {
  const list = document.getElementById('articlesList');
  const featured = document.getElementById('articleFeatured');
  if (!list) return;
  list.innerHTML = `<div class="articles-empty">Loading articles...</div>`;
  const articles = await fetchCollection('articles');
  articles.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  if (!articles.length) {
    if (featured) featured.style.display = 'none';
    list.innerHTML = `<div class="articles-empty">No articles yet — check back soon.</div>`;
    return;
  }
  const featuredArticle = articles.find(a => a.featured === true || a.featured === 'true') || articles[0];
  const rest = articles.filter(a => a._file !== featuredArticle._file);
  if (featured) {
    featured.style.display = 'block';
    featured.innerHTML = `
      <span class="af-badge">Latest Essay</span>
      <div class="af-title">${featuredArticle.title || 'Untitled'}</div>
      <p class="af-excerpt">${featuredArticle.excerpt || ''}</p>
      <a href="${featuredArticle.external_url || '#'}" target="_blank" class="btn btn-outline">Read on Substack →</a>`;
  }
  list.innerHTML = rest.map((a, i) => articleItemHTML(a, i)).join('');
  observeFade(list);
}

// ══════════════════════════════════════
// ABOUT PAGE
// ══════════════════════════════════════
async function loadAbout() {
  const data = await fetchJSON('/content/settings/about.json');
  if (!data) return;
  set('aboutHeroEyebrow', data.hero_eyebrow);
  set('aboutHeroTitle', data.hero_title);
  set('aboutHeroSubtitle', data.hero_subtitle);
  set('aboutOriginEyebrow', data.origin_eyebrow);
  set('aboutOriginHeading', data.origin_heading);
  set('aboutOriginP1', data.origin_p1);
  set('aboutOriginP2', data.origin_p2);
  set('aboutHighlightQuote', data.highlight_quote);
  set('aboutWritingEyebrow', data.writing_eyebrow);
  set('aboutWritingHeading', data.writing_heading);
  set('aboutWritingP1', data.writing_p1);
  set('aboutWritingP2', data.writing_p2);
  set('aboutReadingEyebrow', data.reading_eyebrow);
  set('aboutReadingHeading', data.reading_heading);
  set('aboutReadingIntro', data.reading_intro);
  set('aboutFactsEyebrow', data.facts_eyebrow);
  set('aboutFactsHeading', data.facts_heading);
  if (data.recs && data.recs.length) {
    const recsGrid = document.getElementById('aboutRecs');
    if (recsGrid) recsGrid.innerHTML = data.recs.map(r => `<div class="rec-item"><div class="rec-title">${r.title}</div><div class="rec-author">${r.author}</div></div>`).join('');
  }
  if (data.facts && data.facts.length) {
    const factsList = document.getElementById('aboutFacts');
    if (factsList) factsList.innerHTML = data.facts.map(f => `<li><span class="fact-icon">✦</span> ${f}</li>`).join('');
  }
  if (data.sidebar_links && data.sidebar_links.length) {
    const sidebar = document.getElementById('aboutSidebarLinks');
    if (sidebar) sidebar.innerHTML = data.sidebar_links.map(l => `<a href="${l.url}" ${l.external ? 'target="_blank"' : ''} class="sidebar-link">${l.label} <span>${l.external ? '↗' : '→'}</span></a>`).join('');
  }
  if (data.photo) {
    const frame = document.getElementById('authorPhotoFrame');
    if (frame) frame.innerHTML = `<img src="${data.photo}" alt="Bisma Shahbaz" style="width:100%;height:100%;object-fit:cover;">`;
  }
}

// ══════════════════════════════════════
// SHOP PAGE
// ══════════════════════════════════════
async function loadShop() {
  const data = await fetchJSON('/content/settings/links.json');
  if (!data) return;
  applySocialLinks(data);
  const ig = document.getElementById('linkInstagram');
  const lt = document.getElementById('linkLinktree');
  const ss = document.getElementById('linkSubstack');
  if (ig && data.instagram) ig.href = data.instagram;
  if (lt && data.linktree) lt.href = data.linktree;
  if (ss && data.substack) ss.href = data.substack;
  const handle = document.getElementById('instagramHandle');
  if (handle && data.instagram_handle) handle.textContent = data.instagram_handle;
  if (data.extra_links && data.extra_links.length) {
    const extra = document.getElementById('extraLinks');
    if (extra) extra.innerHTML = data.extra_links.map(l => `
      <a href="${l.url}" target="_blank" class="link-card">
        <div class="lc-icon">${l.icon || '🔗'}</div>
        <div class="lc-body"><div class="lc-title">${l.title}</div><div class="lc-desc">${l.desc || ''}</div></div>
        <div class="lc-arrow">↗</div>
      </a>`).join('');
  }
}

// ══════════════════════════════════════
// AUTO DETECT & RUN
// ══════════════════════════════════════
const page = window.location.pathname.split('/').pop() || 'index.html';
if (page === '' || page === 'index.html') loadHomepage();
if (page === 'books.html') loadBooks();
if (page === 'book.html') loadBookDetail();
if (page === 'articles.html') loadArticles();
if (page === 'about.html') loadAbout();
if (page === 'shop.html') loadShop();
