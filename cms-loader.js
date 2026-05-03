// ══════════════════════════════════════
// CMS LOADER — bisma-shahbaz.netlify.app
// Reads content files and injects into pages
// ══════════════════════════════════════

// ── PARSE FRONTMATTER from markdown ──
function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (!key || !rest.length) return;
    let val = rest.join(':').trim().replace(/^["']|["']$/g, '');
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (!isNaN(val) && val !== '') val = Number(val);
    meta[key.trim()] = val;
  });
  // Parse list arrays like tags: ["a", "b"]
  match[1].replace(/^(\w+):\s*\[(.*?)\]/gm, (_, k, v) => {
    meta[k] = v.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
  });
  // Parse yaml lists
  const bodyText = text.replace(/^---[\s\S]*?---\n?/, '');
  return { meta, body: bodyText.trim() };
}

// ── FETCH JSON settings ──
async function fetchSettings(file) {
  try {
    const res = await fetch(`/content/settings/${file}?t=${Date.now()}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// ── FETCH all markdown files in a folder ──
async function fetchCollection(folder) {
  try {
    // Fetch the GitHub API to list files
    const res = await fetch(`/content/${folder}/`);
    const text = await res.text();
    // Parse file links from directory listing
    const matches = [...text.matchAll(/href="([^"]+\.md)"/g)];
    const files = matches.map(m => m[1].split('/').pop());
    if (!files.length) return [];
    const items = await Promise.all(
      files.map(async f => {
        const r = await fetch(`/content/${folder}/${f}?t=${Date.now()}`);
        const t = await r.text();
        const parsed = parseFrontmatter(t);
        return { ...parsed.meta, body: parsed.body, _file: f };
      })
    );
    return items.sort((a, b) => (a.order || 99) - (b.order || 99));
  } catch { return []; }
}

// ── STATUS BADGE helper ──
function statusBadge(status) {
  const map = {
    published: ['Published', 'badge-published'],
    wip:       ['WIP', 'badge-wip'],
    upcoming:  ['Coming Soon', 'badge-upcoming'],
    beta:      ['Beta Readers Open', 'badge-beta'],
  };
  const [label, cls] = map[status] || ['WIP', 'badge-wip'];
  return `<span class="book-badge ${cls}">${label}</span>`;
}

// ── GENRE COLOR helper ──
function genreGradient(genre) {
  const map = {
    gothic:  'linear-gradient(160deg,#1c1210,#0e0b08)',
    literary:'linear-gradient(160deg,#181010,#0e0b08)',
    fantasy: 'linear-gradient(160deg,#101820,#0e0b08)',
  };
  return map[genre] || 'linear-gradient(160deg,#1a1612,#0e0b08)';
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
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-dim);font-style:italic;font-family:var(--font-serif)">No books yet — check back soon.</div>`;
    return;
  }

  grid.innerHTML = books.map((book, i) => `
    <div class="book-item fade-up ${i > 0 ? `fade-up-delay-${Math.min(i,5)}` : ''}" data-tags="${book.genre || ''} ${book.status || ''}">
      <div class="book-cover-wrap" style="background:${genreGradient(book.genre)};">
        ${statusBadge(book.status)}
        ${book.cover
          ? `<img src="${book.cover}" alt="${book.title}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">`
          : `<div class="book-cover-art">
              <div class="bca-ornament">${book.emoji || '📖'}</div>
              <div class="bca-title">${book.title || 'Untitled'}</div>
              <div class="bca-author">Bisma Shahbaz</div>
            </div>`
        }
      </div>
      <div class="book-meta">
        <div class="bm-title">${book.title || 'Untitled'}</div>
        <div class="bm-genre">${book.genre ? book.genre.charAt(0).toUpperCase() + book.genre.slice(1) : ''} ${book.status === 'wip' ? '· WIP' : book.status === 'published' ? '· Published' : book.status === 'beta' ? '· Beta Open' : '· Coming Soon'}</div>
        ${book.description ? `<div class="bm-desc" style="display:block">${book.description}</div>` : ''}
        ${book.tags && book.tags.length ? `<div class="bm-tags">${book.tags.map(t => `<span class="bm-tag">${t}</span>`).join('')}</div>` : ''}
      </div>
    </div>
  `).join('');

  // Re-observe fade-up elements
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  grid.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// ══════════════════════════════════════
// ARTICLES PAGE
// ══════════════════════════════════════
async function loadArticles() {
  const list = document.getElementById('articlesList');
  const featured = document.getElementById('articleFeatured');
  if (!list) return;

  list.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-dim);font-style:italic;font-family:var(--font-serif)">Loading articles...</div>`;

  const articles = await fetchCollection('articles');

  if (!articles.length) {
    list.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-dim);font-style:italic;font-family:var(--font-serif)">No articles yet — check back soon.</div>`;
    return;
  }

  // Sort by date newest first
  articles.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const featuredArticle = articles.find(a => a.featured) || articles[0];
  const rest = articles.filter(a => a._file !== featuredArticle._file);

  // Featured
  if (featured && featuredArticle) {
    const catLabel = {
      essay: 'Substack Essay', writing: 'On Writing', review: 'ARC Review',
      'series-review': 'Series Review', reflection: 'Reflection',
      identity: 'Identity & Voice', recs: 'Book Recommendations'
    }[featuredArticle.category] || 'Essay';

    featured.innerHTML = `
      <span class="af-badge">${featuredArticle.featured ? 'Latest Essay' : catLabel}</span>
      <div class="af-title">${featuredArticle.title || 'Untitled'}</div>
      <p class="af-excerpt">${featuredArticle.excerpt || ''}</p>
      <a href="${featuredArticle.external_url || '#'}" target="_blank" class="btn btn-outline">Read on Substack →</a>
    `;
  }

  // List
  list.innerHTML = rest.map((article, i) => {
    const catLabel = {
      essay: 'Substack Essay', writing: 'On Writing', review: 'ARC Review',
      'series-review': 'Series Review', reflection: 'Reflection',
      identity: 'Identity & Voice', recs: 'Book Recommendations'
    }[article.category] || 'Essay';

    const dateStr = article.date ? new Date(article.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' }) : '';

    return `
      <a href="${article.external_url || '#'}" target="_blank" class="article-item fade-up">
        <div class="ai-num">0${i + 1}</div>
        <div class="ai-body">
          <div class="ai-meta">
            <span class="ai-tag">${catLabel}</span>
            <span class="ai-date">${dateStr}</span>
          </div>
          <div class="ai-title">${article.title || 'Untitled'}</div>
          <p class="ai-excerpt">${article.excerpt || ''}</p>
          <div class="ai-read">Read Essay →</div>
        </div>
      </a>
    `;
  }).join('');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  list.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// ══════════════════════════════════════
// HOMEPAGE
// ══════════════════════════════════════
async function loadHomepage() {
  const data = await fetchSettings('homepage.json');
  if (!data) return;

  const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
  const setHTML = (id, val) => { const el = document.getElementById(id); if (el && val) el.innerHTML = val; };

  set('heroTagline', data.hero_tagline);
  set('heroQuote', data.hero_quote);
  set('introParagraph1', data.intro_p1);
  set('introParagraph2', data.intro_p2);
  set('bigQuote', data.big_quote);
  set('quoteAttr', data.quote_attr);

  // Load featured books on homepage too
  const booksRow = document.getElementById('homeBooksRow');
  if (booksRow) {
    const books = await fetchCollection('books');
    const featured = books.slice(0, 3);
    if (featured.length) {
      booksRow.innerHTML = featured.map((book, i) => `
        <div class="book-card card fade-up ${i > 0 ? `fade-up-delay-${i + 1}` : ''}">
          <div class="book-cover" style="background:${genreGradient(book.genre)};">
            <span class="book-status status-${book.status || 'wip'}">${
              { published:'Published', wip:'WIP', upcoming:'Coming Soon', beta:'Beta Readers Open' }[book.status] || 'WIP'
            }</span>
            ${book.cover
              ? `<img src="${book.cover}" alt="${book.title}" style="width:100%;height:100%;object-fit:cover;">`
              : `<div class="book-cover-inner">
                  <div class="book-cover-ornament">${book.emoji || '📖'}</div>
                  <div class="book-cover-title">${book.title}</div>
                  <div class="book-cover-author">Bisma Shahbaz</div>
                </div>`
            }
          </div>
          <div class="book-info">
            <div class="book-title">${book.title}</div>
            <div class="book-genre">${book.genre ? book.genre.charAt(0).toUpperCase() + book.genre.slice(1) : ''} · ${book.status === 'wip' || book.status === 'beta' ? 'WIP' : book.status === 'published' ? 'Published' : 'Coming Soon'}</div>
          </div>
        </div>
      `).join('');
    }
  }

  // Load latest articles on homepage
  const articlesRow = document.getElementById('homeArticlesRow');
  if (articlesRow) {
    const articles = await fetchCollection('articles');
    articles.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const latest = articles.slice(0, 3);
    if (latest.length) {
      articlesRow.innerHTML = latest.map((a, i) => `
        <div class="article-card card fade-up ${i > 0 ? `fade-up-delay-${i + 1}` : ''}">
          <div class="article-num">0${i + 1}</div>
          <div class="article-tag">${{ essay:'Substack Essay', writing:'On Writing', review:'ARC Review', reflection:'Reflection', identity:'Identity & Voice', recs:'Book Recs' }[a.category] || 'Essay'}</div>
          <div class="article-title">${a.title}</div>
          <p class="article-excerpt">${a.excerpt || ''}</p>
          <div class="article-date">${a.date ? new Date(a.date).toLocaleDateString('en-GB', { year:'numeric', month:'long' }) : 'Essay'}</div>
        </div>
      `).join('');
    }
  }
}

// ══════════════════════════════════════
// ABOUT PAGE
// ══════════════════════════════════════
async function loadAbout() {
  const data = await fetchSettings('about.json');
  if (!data) return;

  const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };

  set('aboutOriginP1', data.origin_p1);
  set('aboutOriginP2', data.origin_p2);
  set('aboutHighlightQuote', data.highlight_quote);
  set('aboutWritingP1', data.writing_p1);
  set('aboutWritingP2', data.writing_p2);

  // Photo
  if (data.photo) {
    const frame = document.getElementById('authorPhotoFrame');
    if (frame) {
      frame.innerHTML = `<img src="${data.photo}" alt="Bisma Shahbaz" style="width:100%;height:100%;object-fit:cover;">`;
    }
  }

  // Facts list
  if (data.facts && data.facts.length) {
    const factsList = document.getElementById('aboutFacts');
    if (factsList) {
      factsList.innerHTML = data.facts.map(f => `
        <li><span class="fact-icon">✦</span> ${f}</li>
      `).join('');
    }
  }
}

// ══════════════════════════════════════
// SHOP / LINKS PAGE
// ══════════════════════════════════════
async function loadLinks() {
  const data = await fetchSettings('links.json');
  if (!data) return;

  const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.href = val; };
  const setText = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };

  set('linkInstagram', data.instagram);
  set('linkLinktree', data.linktree);
  set('linkSubstack', data.substack);
  setText('instagramHandle', data.instagram_handle);

  // Extra links
  if (data.extra_links && data.extra_links.length) {
    const extraContainer = document.getElementById('extraLinks');
    if (extraContainer) {
      extraContainer.innerHTML = data.extra_links.map(link => `
        <a href="${link.url}" target="_blank" class="link-card">
          <div class="lc-icon">${link.icon || '🔗'}</div>
          <div class="lc-body">
            <div class="lc-title">${link.title}</div>
            <div class="lc-desc">${link.desc || ''}</div>
          </div>
          <div class="lc-arrow">↗</div>
        </a>
      `).join('');
    }
  }

  // Update all footer social links across site
  document.querySelectorAll('a[data-social="instagram"]').forEach(a => { if (data.instagram) a.href = data.instagram; });
  document.querySelectorAll('a[data-social="linktree"]').forEach(a => { if (data.linktree) a.href = data.linktree; });
  document.querySelectorAll('a[data-social="substack"]').forEach(a => { if (data.substack) a.href = data.substack; });
}

// ══════════════════════════════════════
// AUTO-DETECT PAGE & RUN
// ══════════════════════════════════════
const page = window.location.pathname.split('/').pop() || 'index.html';
if (page === 'index.html' || page === '') loadHomepage();
if (page === 'books.html') loadBooks();
if (page === 'articles.html') loadArticles();
if (page === 'about.html') loadAbout();
if (page === 'shop.html') loadLinks();
