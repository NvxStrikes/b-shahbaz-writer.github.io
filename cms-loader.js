// ══════════════════════════════════════
// CMS LOADER v7 — bisma-shahbaz
// Uses jsDelivr CDN (no rate limits, no CORS)
// ══════════════════════════════════════

const GITHUB_REPO = "NvxStrikes/b-shahbaz-writer.github.io";
const GITHUB_BRANCH = "main";
// jsDelivr mirrors GitHub with no rate limits and proper CORS
const CDN = `https://cdn.jsdelivr.net/gh/${GITHUB_REPO}@${GITHUB_BRANCH}`;
// GitHub API still needed just to LIST files
const API = `https://api.github.com/repos/${GITHUB_REPO}/contents`;

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx < 0) return;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (val !== '' && !isNaN(val)) val = Number(val);
    if (key) meta[key] = val;
  });
  [...match[1].matchAll(/^(\w+):\s*\[(.*?)\]/gm)].forEach(([, k, v]) => {
    meta[k] = v.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  });
  return { meta, body: text.replace(/^---[\s\S]*?---\n?/, '').trim() };
}

async function fetchJSON(path) {
  try {
    const res = await fetch(path + '?t=' + Date.now());
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// List files via GitHub API, fetch content via jsDelivr CDN
async function fetchCollection(folder) {
  try {
    const res = await fetch(`${API}/content/${folder}?ref=${GITHUB_BRANCH}`);
    if (!res.ok) return [];
    const files = await res.json();
    if (!Array.isArray(files)) return [];
    const mdFiles = files.filter(f => f.name.endsWith('.md') && f.type === 'file');
    if (!mdFiles.length) return [];
    const items = await Promise.all(mdFiles.map(async f => {
      // jsDelivr has no rate limits and no CORS issues
      const r = await fetch(`${CDN}/content/${folder}/${f.name}`);
      const text = await r.text();
      const { meta, body } = parseFrontmatter(text);
      return { ...meta, body, _file: f.name, _slug: f.name.replace('.md', '') };
    }));
    return items.sort((a, b) => (a.order || 99) - (b.order || 99));
  } catch(e) { console.error('fetchCollection:', folder, e); return []; }
}

async function fetchSingleBook(slug) {
  try {
    // Try jsDelivr directly
    const r = await fetch(`${CDN}/content/books/${slug}.md`);
    if (r.ok) {
      const text = await r.text();
      const { meta, body } = parseFrontmatter(text);
      return { ...meta, body, _file: `${slug}.md`, _slug: slug };
    }
    return null;
  } catch { return null; }
}

const set = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.textContent = val; };
function statusBadge(s) {
  const m = { published:['Published','status-published'], wip:['WIP','status-wip'], upcoming:['Coming Soon','status-upcoming'], beta:['Beta Readers Open','status-beta'] };
  const [l, c] = m[s] || ['WIP','status-wip'];
  return `<span class="book-status ${c}">${l}</span>`;
}
function grad(g) { return {gothic:'linear-gradient(160deg,#1c1210,#0e0b08)',literary:'linear-gradient(160deg,#181010,#0e0b08)',fantasy:'linear-gradient(160deg,#101820,#0e0b08)'}[g]||'linear-gradient(160deg,#1a1612,#0e0b08)'; }
function gLabel(g) { return {gothic:'Gothic Romance',literary:'Literary Fiction',fantasy:'Cozy Fantasy',other:'Other'}[g]||g||''; }
function cLabel(c) { return {essay:'Substack Essay',writing:'On Writing',review:'ARC Review','series-review':'Series Review',reflection:'Reflection',identity:'Identity & Voice',recs:'Book Recs'}[c]||'Essay'; }
function coverInner(b, lg=false) {
  if (b.cover) return `<img src="${b.cover}" alt="${b.title}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;">`;
  return `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;">
    <div style="font-size:${lg?'4rem':'3rem'};margin-bottom:14px;opacity:0.7">${b.emoji||'📖'}</div>
    <div style="font-family:var(--font-display);font-size:${lg?'1.5rem':'1.15rem'};font-style:italic;color:var(--parchment);line-height:1.3;margin-bottom:10px;">${b.title||'Untitled'}</div>
    <div style="font-size:var(--fs-eyebrow);letter-spacing:0.14em;text-transform:uppercase;color:var(--text-dim);">Bisma Shahbaz</div>
  </div>`;
}
function observe(el) {
  const o = new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:0.1});
  (el||document).querySelectorAll('.fade-up').forEach(x=>o.observe(x));
}
function socialLinks(d) {
  document.querySelectorAll('[data-social="instagram"]').forEach(a=>{if(d.instagram)a.href=d.instagram;});
  document.querySelectorAll('[data-social="linktree"]').forEach(a=>{if(d.linktree)a.href=d.linktree;});
  document.querySelectorAll('[data-social="substack"]').forEach(a=>{if(d.substack)a.href=d.substack;});
}
function bookCard(b,i) {
  const d=i>0?` fade-up-delay-${Math.min(i,5)}`:'';
  return `<a href="book.html?id=${b._slug}" class="book-card card fade-up${d}" style="text-decoration:none;display:block;" data-tags="${b.genre||''} ${b.status||''}">
    <div class="book-cover" style="background:${grad(b.genre)};position:relative;overflow:hidden;aspect-ratio:2/3;">${statusBadge(b.status)}${coverInner(b)}</div>
    <div class="book-info"><div class="book-title">${b.title||'Untitled'}</div><div class="book-genre">${gLabel(b.genre)} · ${b.status==='published'?'Published':b.status==='beta'?'Beta Open':'WIP'}</div></div>
  </a>`;
}
function bookItem(b,i) {
  const d=i>0?` fade-up-delay-${Math.min(i,5)}`:'';
  return `<a href="book.html?id=${b._slug}" class="book-item fade-up${d}" style="text-decoration:none;display:block;" data-tags="${b.genre||''} ${b.status||''}">
    <div class="book-cover-wrap" style="background:${grad(b.genre)};position:relative;overflow:hidden;aspect-ratio:2/3;">${statusBadge(b.status)}${coverInner(b)}</div>
    <div class="book-meta">
      <div class="bm-title">${b.title||'Untitled'}</div>
      <div class="bm-genre">${gLabel(b.genre)} · ${b.status==='published'?'Published':b.status==='beta'?'Beta Open':'WIP'}</div>
      ${b.description?`<div class="bm-desc">${b.description}</div>`:''}
      ${b.tags&&b.tags.length?`<div class="bm-tags">${b.tags.map(t=>`<span class="bm-tag">${t}</span>`).join('')}</div>`:''}
    </div>
  </a>`;
}
function articleItem(a,i) {
  const dt=a.date?new Date(a.date).toLocaleDateString('en-GB',{year:'numeric',month:'long'}):'';
  return `<a href="${a.external_url||'#'}" target="_blank" class="article-item fade-up">
    <div class="ai-num">0${i+1}</div>
    <div class="ai-body">
      <div class="ai-meta"><span class="ai-tag">${cLabel(a.category)}</span><span class="ai-date">${dt}</span></div>
      <div class="ai-title">${a.title||'Untitled'}</div>
      <p class="ai-excerpt">${a.excerpt||''}</p>
      <div class="ai-read">Read Essay →</div>
    </div>
  </a>`;
}

// ══ HOMEPAGE ══
async function loadHomepage() {
  const d = await fetchJSON('/content/settings/homepage.json');
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
    const c1=document.getElementById('heroCta1'),c2=document.getElementById('heroCta2');
    if(c1){if(d.cta_primary_text)c1.textContent=d.cta_primary_text;if(d.cta_primary_link)c1.href=d.cta_primary_link;}
    if(c2){if(d.cta_secondary_text)c2.textContent=d.cta_secondary_text+' →';if(d.cta_secondary_link)c2.href=d.cta_secondary_link;}
    const i1=document.getElementById('introCta1'),i2=document.getElementById('introCta2');
    if(i1){if(d.intro_cta1_text)i1.textContent=d.intro_cta1_text;if(d.intro_cta1_link)i1.href=d.intro_cta1_link;}
    if(i2){if(d.intro_cta2_text)i2.textContent=d.intro_cta2_text+' →';if(d.intro_cta2_link)i2.href=d.intro_cta2_link;}
    if(d.hero_genres?.length){const g=document.getElementById('heroGenres');if(g)g.innerHTML=d.hero_genres.map(x=>`<span class="genre-tag">${x}</span>`).join('');}
    if(d.marquee_items?.length){const m=document.getElementById('marqueeInner');if(m)m.innerHTML=[...d.marquee_items,...d.marquee_items].map(x=>`<span class="marquee-item">${x}</span>`).join('');}
  }
  const br=document.getElementById('homeBooksRow');
  if(br){
    const books=await fetchCollection('books');
    const feat=books.filter(b=>b.featured===true||b.featured==='true');
    const show=feat.length?feat:books.slice(0,3);
    br.innerHTML=show.length?show.map((b,i)=>bookCard(b,i)).join(''):`<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim);font-style:italic;font-family:var(--font-serif)">No featured books yet.</div>`;
    observe(br);
  }
  const ar=document.getElementById('homeArticlesRow');
  if(ar){
    const articles=await fetchCollection('articles');
    articles.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
    ar.innerHTML=articles.length?articles.slice(0,3).map((a,i)=>`
      <div class="article-card card fade-up${i>0?` fade-up-delay-${i}`:''}">
        <div class="article-num">0${i+1}</div><div class="article-tag">${cLabel(a.category)}</div>
        <div class="article-title">${a.title}</div><p class="article-excerpt">${a.excerpt||''}</p>
        <div class="article-date">${a.date?new Date(a.date).toLocaleDateString('en-GB',{year:'numeric',month:'long'}):'Essay'}</div>
      </div>`).join(''):`<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim);font-style:italic;font-family:var(--font-serif)">No articles yet.</div>`;
    observe(ar);
  }
  const lnk=await fetchJSON('/content/settings/links.json');
  if(lnk)socialLinks(lnk);
}

// ══ BOOKS PAGE ══
async function loadBooks() {
  const grid=document.getElementById('booksGrid');
  if(!grid)return;
  const books=await fetchCollection('books');
  if(!books.length){grid.innerHTML=`<div class="books-empty">No books added yet — check back soon.</div>`;return;}
  grid.innerHTML=books.map((b,i)=>bookItem(b,i)).join('');
  observe(grid);
}

// ══ BOOK DETAIL ══
async function loadBookDetail() {
  const container=document.getElementById('bookDetail');
  if(!container)return;
  const slug=new URLSearchParams(window.location.search).get('id');
  if(!slug){container.innerHTML=`<div class="bd-not-found">No book specified. <a href="books.html" style="color:var(--accent)">← Back to Books</a></div>`;return;}
  const b=await fetchSingleBook(slug);
  if(!b){container.innerHTML=`<div class="bd-not-found">Book not found. <a href="books.html" style="color:var(--accent)">← Back to Books</a></div>`;return;}
  document.title=`${b.title} — Bisma Shahbaz`;
  const sc={published:'status-published',wip:'status-wip',upcoming:'status-upcoming',beta:'status-beta'}[b.status]||'status-wip';
  const sl={published:'Published',wip:'WIP',upcoming:'Coming Soon',beta:'Beta Readers Open'}[b.status]||'WIP';
  container.innerHTML=`
    <a href="books.html" class="bd-back">← Back to Books</a>
    <div class="book-detail-grid fade-up">
      <div class="bd-cover-wrap">
        <div class="bd-cover" style="background:${grad(b.genre)};position:relative;overflow:hidden;aspect-ratio:2/3;">${coverInner(b,true)}</div>
        <span class="${sc}" style="display:inline-block;margin-top:14px;font-size:0.62rem;letter-spacing:0.16em;text-transform:uppercase;padding:6px 16px;">${sl}</span>
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
          <p style="font-size:var(--fs-body);line-height:1.8;color:var(--text-mid);margin-bottom:18px;">Bisma is looking for beta readers for this book.</p>
          <a href="contact.html" class="btn btn-gold">Sign Up to Beta Read</a>
        </div>`:''}
      </div>
    </div>`;
  observe(container);
}

// ══ ARTICLES PAGE ══
async function loadArticles() {
  const list=document.getElementById('articlesList'),feat=document.getElementById('articleFeatured');
  if(!list)return;
  list.innerHTML=`<div class="articles-empty">Loading articles...</div>`;
  const articles=await fetchCollection('articles');
  articles.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
  if(!articles.length){if(feat)feat.style.display='none';list.innerHTML=`<div class="articles-empty">No articles yet — check back soon.</div>`;return;}
  const fa=articles.find(a=>a.featured===true||a.featured==='true')||articles[0];
  const rest=articles.filter(a=>a._file!==fa._file);
  if(feat){feat.style.display='block';feat.innerHTML=`<span class="af-badge">Latest Essay</span><div class="af-title">${fa.title||'Untitled'}</div><p class="af-excerpt">${fa.excerpt||''}</p><a href="${fa.external_url||'#'}" target="_blank" class="btn btn-outline">Read on Substack →</a>`;}
  list.innerHTML=rest.map((a,i)=>articleItem(a,i)).join('');
  observe(list);
}

// ══ ABOUT ══
async function loadAbout() {
  const d=await fetchJSON('/content/settings/about.json');
  if(!d)return;
  ['aboutHeroEyebrow','aboutHeroTitle','aboutHeroSubtitle','aboutOriginEyebrow','aboutOriginHeading','aboutOriginP1','aboutOriginP2','aboutHighlightQuote','aboutWritingEyebrow','aboutWritingHeading','aboutWritingP1','aboutWritingP2','aboutReadingEyebrow','aboutReadingHeading','aboutReadingIntro','aboutFactsEyebrow','aboutFactsHeading'].forEach(id=>{
    const key=id.replace('about','').replace(/([A-Z])/g,m=>'_'+m.toLowerCase()).replace(/^_/,'');
    const keyMap={hero_eyebrow:'hero_eyebrow',hero_title:'hero_title',hero_subtitle:'hero_subtitle',origin_eyebrow:'origin_eyebrow',origin_heading:'origin_heading',origin_p1:'origin_p1',origin_p2:'origin_p2',highlight_quote:'highlight_quote',writing_eyebrow:'writing_eyebrow',writing_heading:'writing_heading',writing_p1:'writing_p1',writing_p2:'writing_p2',reading_eyebrow:'reading_eyebrow',reading_heading:'reading_heading',reading_intro:'reading_intro',facts_eyebrow:'facts_eyebrow',facts_heading:'facts_heading'};
    set(id,d[keyMap[key]]);
  });
  const rg=document.getElementById('aboutRecs');if(rg&&d.recs?.length)rg.innerHTML=d.recs.map(r=>`<div class="rec-item"><div class="rec-title">${r.title}</div><div class="rec-author">${r.author}</div></div>`).join('');
  const fl=document.getElementById('aboutFacts');if(fl&&d.facts?.length)fl.innerHTML=d.facts.map(f=>`<li><span class="fact-icon">✦</span> ${f}</li>`).join('');
  const sl=document.getElementById('aboutSidebarLinks');if(sl&&d.sidebar_links?.length)sl.innerHTML=d.sidebar_links.map(l=>`<a href="${l.url}" ${l.external?'target="_blank"':''} class="sidebar-link">${l.label} <span>${l.external?'↗':'→'}</span></a>`).join('');
  if(d.photo){const fr=document.getElementById('authorPhotoFrame');if(fr)fr.innerHTML=`<img src="${d.photo}" alt="Bisma Shahbaz" style="width:100%;height:100%;object-fit:cover;">`;}
}

// ══ SHOP ══
async function loadShop() {
  const d=await fetchJSON('/content/settings/links.json');
  if(!d)return;
  socialLinks(d);
  ['linkInstagram','linkLinktree','linkSubstack'].forEach((id,i)=>{const el=document.getElementById(id);const val=[d.instagram,d.linktree,d.substack][i];if(el&&val)el.href=val;});
  const h=document.getElementById('instagramHandle');if(h&&d.instagram_handle)h.textContent=d.instagram_handle;
  const ex=document.getElementById('extraLinks');if(ex&&d.extra_links?.length)ex.innerHTML=d.extra_links.map(l=>`<a href="${l.url}" target="_blank" class="link-card"><div class="lc-icon">${l.icon||'🔗'}</div><div class="lc-body"><div class="lc-title">${l.title}</div><div class="lc-desc">${l.desc||''}</div></div><div class="lc-arrow">↗</div></a>`).join('');
}

// ══ AUTO RUN ══
const pg=window.location.pathname.split('/').pop()||'index.html';
if(pg===''||pg==='index.html')loadHomepage();
if(pg==='books.html')loadBooks();
if(pg==='book.html')loadBookDetail();
if(pg==='articles.html')loadArticles();
if(pg==='about.html')loadAbout();
if(pg==='shop.html')loadShop();
