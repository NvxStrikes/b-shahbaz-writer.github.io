// ══════════════════════════════════════
// CMS LOADER v4 — bisma-shahbaz
// Uses GitHub API to list content files
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
  // Inline arrays
  [...raw.matchAll(/^(\w+):\s*\[(.*?)\]/gm)].forEach(([, k, v]) => {
    meta[k] = v.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  });
  return { meta, body: text.replace(/^---[\s\S]*?---\n?/, '').trim() };
}

// ── FETCH JSON settings ──
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
    // Use GitHub API to list files
    const res = await fetch(`${GITHUB_API}/content/${folder}?ref=${GITHUB_BRANCH}&t=${Date.now()}`);
    if (!res.ok) return [];
    const files = await res.json();
    const mdFiles = files.filter(f => f.name.endsWith('.md') && f.type === 'file');
    if (!mdFiles.length) return [];

    const items = await Promise.all(mdFiles.map(async f => {
      // Fetch raw content directly
      const r = await fetch(f.download_url + '?t=' + Date.now());
      const text = await r.text();
      const { meta, body } = parseFrontmatter(text);
      return { ...meta, body, _file: f.name };
    }));
    return items.sort((a, b) => (a.order || 99) - (b.order || 99));
  } catch(e) {
    console.error('fetchCollection error:', e);
    return [];
  }
}

// ── HELPERS ──
const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.textContent = val; };
const setHref = (id, val) => { const el = document.getElementById(id); if (el && val) el.href = val; };

function statusBadge(status) {
  const map = {
    published: ['Published','status-published'],
    wip: ['WIP','status-wip'],
    upcoming: ['Coming Soon','status-upcoming'],
    beta: ['Beta Readers Open','status-beta']
  };
  const [label, cls] = map[status] || ['WIP','status-wip'];
  return `<span class="book-status ${cls}">${label}</span>`;
}

function genreGrad(genre) {
  return {
    gothic: 'linear-gradient(160deg,#1c1210,#0e0b08)',
    literary: 'linear-gradient(160deg,#181010,#0e0b08)',
    fantasy: 'linear-gradient(160deg,#101820,#0e0b08)'
  }[genre] || 'linear-gradient(160deg,#1a1612,#0e0b08)';
}

function catLabel(cat) {
  return {
    essay: 'Substack Essay', writing: 'On Writing', review: 'ARC Review',
    'series-review': 'Series Review', reflection: 'Reflection',
    identity: 'Identity & Voice', recs: 'Book Recs'
  }[cat] || 'Essay';
}

function observeFade(container) {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  (container || document).querySelectorAll('.fade-up').forEach(el => obs.observe(el));
}

function bookCoverHTML(book) {
  if (book.cover) {
    return `<img src="${book.cover}" alt="${book.title}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">`;
  }
  return `<div class="book-cover-inner">
    <div class="book-cover-ornament">${book.emoji || '📖'}</div>
    <div class="book-cover-title">${book.title || 'Untitled'}</div>
    <div class="book-cover-author">Bisma Shahbaz</div>
  </div>`;
}

function articleItemHTML(article, i) {
  const dateStr = article.date ? new Date(article.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' }) : '';
  return `
    <a href="${article.external_url || '#'}" target="_blank" class="article-item fade-up">
      <div class="ai-num">0${i + 1}</div>
      <div class="ai-body">
        <div class="ai-meta">
          <span class="ai-tag">${catLabel(article.category)}</span>
          <span class="ai-date">${dateStr}</span>
        </div>
        <div class="ai-title">${article.title || 'Untitled'}</div>
        <p class="ai-excerpt">${article.excerpt || ''}</p>
        <div class="ai-read">Read Essay →</div>
      </div>
    </a>`;
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

    // Buttons
    const cta1 = document.getElementById('heroCta1');
    const cta2 = document.getElementById('heroCta2');
    if (cta1) { if (data.cta_primary_text) cta1.textContent = data.cta_primary_text; if (data.cta_primary_link) cta1.href = data.cta_primary_link; }
    if (cta2) { if (data.cta_secondary_text) cta2.textContent = data.cta_secondary_text + ' →'; if (data.cta_secondary_link) cta2.href = data.cta_secondary_link; }
    const ic1 = document.getElementById('introCta1');
    const ic2 = document.getElementById('introCta2');
    if (ic1) { if (data.intro_cta1_text) ic1.textContent = data.intro_cta1_text; if (data.intro_cta1_link) ic1.href = data.intro_cta1_link; }
    if (ic2) { if (data.intro_cta2_text) ic2.textContent = data.intro_cta2_text + ' →'; if (data.intro_cta2_link) ic2.href = data.intro_cta2_link; }

    // Genre tags
    if (data.hero_genres && data.hero_genres.length) {
      const genres = document.getElementById('heroGenres');
      if (genres) genres.innerHTML = data.hero_genres.map(g => `<span class="genre-tag">${g}</span>`).join('');
    }

    // Marquee
    if (data.marquee_items && data.marquee_items.length) {
      const marquee = document.getElementById('marqueeInner');
      if (marquee) {
        const doubled = [...data.marquee_items, ...data.marquee_items];
        marquee.innerHTML = doubled.map(m => `<span class="marquee-item">${m}</span>`).join('');
      }
    }
  }

  // Books from GitHub API
  const booksRow = document.getElementById('homeBooksRow');
  if (booksRow) {
    const books = await fetchCollection('books');
    if (books.length) {
      booksRow.innerHTML = books.slice(0, 3).map((b, i) => `
        <div class="book-card card fade-up${i > 0 ? ` fade-up-delay-${i}` : ''}">
          <div class="book-cover" style="background:${genreGrad(b.genre)};">
            ${statusBadge(b.status)}
            ${bookCoverHTML(b)}
          </div>
          <div class="book-info">
            <div class="book-title">${b.title || 'Untitled'}</div>
            <div class="book-genre">${b.genre ? b.genre.charAt(0).toUpperCase() + b.genre.slice(1) : ''} · ${b.status === 'published' ? 'Published' : b.status === 'beta' ? 'Beta Open' : 'WIP'}</div>
          </div>
        </div>`).join('');
      observeFade(booksRow);
    } else {
      booksRow.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim);font-style:italic;font-family:var(--font-serif)">No books added yet — check back soon.</div>`;
    }
  }

  // Articles from GitHub API
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
      articlesRow.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim);font-style:italic;font-family:var(--font-serif)">No articles added yet — check back soon.</div>`;
    }
  }

  // Social links
  const links = await fetchJSON('/content/settings/links.json');
  if (links) applySocialLinks(links);
}

// ══════════════════════════════════════
// BOOKS PAGE
// ══════════════════════════════════════
async function loadBooks() {
  const grid = document.getElementById('booksGrid');
  if (!grid) return;
  grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-dim);font-style:italic;font-family:var(--font-serif)">Loading books...</div>`;

  const books = await fetchCollection('books');
  if (!books.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-dim);font-style:italic;font-family:var(--font-serif)">No books added yet — check back soon.</div>`;
    return;
  }

  grid.innerHTML = books.map((b, i) => `
    <div class="book-item fade-up${i > 0 ? ` fade-up-delay-${Math.min(i, 5)}` : ''}" data-tags="${b.genre || ''} ${b.status || ''}">
      <div class="book-cover-wrap" style="background:${genreGrad(b.genre)};">
        ${statusBadge(b.status)}
        ${bookCoverHTML(b)}
      </div>
      <div class="book-meta">
        <div class="bm-title">${b.title || 'Untitled'}</div>
        <div class="bm-genre">${b.genre ? b.genre.charAt(0).toUpperCase() + b.genre.slice(1) : ''} · ${b.status === 'published' ? 'Published' : b.status === 'beta' ? 'Beta Open' : 'WIP'}</div>
        ${b.description ? `<div class="bm-desc">${b.description}</div>` : ''}
        ${b.tags && b.tags.length ? `<div class="bm-tags">${b.tags.map(t => `<span class="bm-tag">${t}</span>`).join('')}</div>` : ''}
      </div>
    </div>`).join('');
  observeFade(grid);
}

// ══════════════════════════════════════
// ARTICLES PAGE
// ══════════════════════════════════════
async function loadArticles() {
  const list = document.getElementById('articlesList');
  const featured = document.getElementById('articleFeatured');
  if (!list) return;
  list.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-dim);font-style:italic">Loading articles...</div>`;

  const articles = await fetchCollection('articles');
  articles.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (!articles.length) {
    if (featured) featured.style.display = 'none';
    list.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-dim);font-style:italic">No articles added yet — check back soon.</div>`;
    return;
  }

  const featuredArticle = articles.find(a => a.featured) || articles[0];
  const rest = articles.filter(a => a._file !== featuredArticle._file);

  if (featured && featuredArticle) {
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
    if (recsGrid) recsGrid.innerHTML = data.recs.map(r => `
      <div class="rec-item">
        <div class="rec-title">${r.title}</div>
        <div class="rec-author">${r.author}</div>
      </div>`).join('');
  }

  if (data.facts && data.facts.length) {
    const factsList = document.getElementById('aboutFacts');
    if (factsList) factsList.innerHTML = data.facts.map(f => `<li><span class="fact-icon">✦</span> ${f}</li>`).join('');
  }

  if (data.sidebar_links && data.sidebar_links.length) {
    const sidebar = document.getElementById('aboutSidebarLinks');
    if (sidebar) sidebar.innerHTML = data.sidebar_links.map(l => `
      <a href="${l.url}" ${l.external ? 'target="_blank"' : ''} class="sidebar-link">
        ${l.label} <span>${l.external ? '↗' : '→'}</span>
      </a>`).join('');
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
        <div class="lc-body">
          <div class="lc-title">${l.title}</div>
          <div class="lc-desc">${l.desc || ''}</div>
        </div>
        <div class="lc-arrow">↗</div>
      </a>`).join('');
  }
}

// ── SOCIAL LINKS ──
function applySocialLinks(data) {
  document.querySelectorAll('[data-social="instagram"]').forEach(a => { if (data.instagram) a.href = data.instagram; });
  document.querySelectorAll('[data-social="linktree"]').forEach(a => { if (data.linktree) a.href = data.linktree; });
  document.querySelectorAll('[data-social="substack"]').forEach(a => { if (data.substack) a.href = data.substack; });
}

// ══════════════════════════════════════
// AUTO DETECT & RUN
// ══════════════════════════════════════
const page = window.location.pathname.split('/').pop() || 'index.html';
if (page === '' || page === 'index.html') loadHomepage();
if (page === 'books.html') loadBooks();
if (page === 'articles.html') loadArticles();
if (page === 'about.html') loadAbout();
if (page === 'shop.html') loadShop();
