import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';

const ARTICLE_STATUSES = new Set(['draft', 'in-review', 'approved', 'archived']);
const CONTENT_TYPES = new Set(['explainer', 'practice', 'faq', 'glossary', 'program-guide', 'research-note', 'safety', 'story']);
const CLAIM_LEVELS = new Set(['none', 'general-wellbeing', 'sensitive-health']);
const RESERVED_SLUGS = new Set(['search', 'topics', 'admin', 'index']);
const origin = 'https://rainbowsanctuary.life';

const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true });
const originalLinkOpen = markdown.renderer.rules.link_open
  || ((tokens, index, options, env, self) => self.renderToken(tokens, index, options));
markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const token = tokens[index];
  const href = token.attrGet('href') || '';
  if (/^https?:\/\//i.test(href)) token.attrJoin('rel', 'noopener noreferrer');
  return originalLinkOpen(tokens, index, options, env, self);
};

function fail(message) {
  throw new Error(`Knowledge validation failed: ${message}`);
}

function text(value) {
  return String(value ?? '').trim();
}

function date(value) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  const normalized = text(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || Number.isNaN(Date.parse(`${normalized}T00:00:00Z`))) {
    fail(`invalid ISO date ${JSON.stringify(value)}`);
  }
  return normalized;
}

function list(value, field) {
  if (!Array.isArray(value) || !value.length || value.some((item) => !text(item))) fail(`${field} must be a non-empty list`);
  return value.map((item) => text(item));
}

function escapeHtml(value) {
  return text(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function slugify(value) {
  return text(value).toLowerCase().replace(/<[^>]*>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'section';
}

function safeUrl(value, field) {
  const url = text(value);
  if (!url || /^(javascript|data|vbscript):/i.test(url)) fail(`${field} has an unsafe URL`);
  return url;
}

function relativeAsset(pathname) {
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function parseToc(markdownSource) {
  const counts = new Map();
  return markdownSource.split('\n').flatMap((line) => {
    const match = line.match(/^(#{2,6})\s+(.+?)\s*#*\s*$/);
    if (!match) return [];
    const base = slugify(match[2]);
    const count = (counts.get(base) || 0) + 1;
    counts.set(base, count);
    return [{ level: match[1].length, title: match[2].trim(), id: count === 1 ? base : `${base}-${count}` }];
  });
}

function renderMarkdown(source) {
  const toc = parseToc(source);
  let cursor = 0;
  const html = markdown.render(source).replace(/<h([2-6])>([\s\S]*?)<\/h\1>/g, (whole, level, heading) => {
    const item = toc[cursor++];
    return `<h${level} id="${item.id}">${heading}</h${level}>`;
  });
  return { html, toc };
}

export function validateArticle(raw) {
  const article = {
    id: text(raw.id), title: text(raw.title), slug: text(raw.slug), summary: text(raw.summary), topic: text(raw.topic),
    content_type: text(raw.content_type), audiences: list(raw.audiences, 'audiences'), tags: list(raw.tags, 'tags'),
    synonyms: Array.isArray(raw.synonyms) ? raw.synonyms.map(text).filter(Boolean) : [], author_id: text(raw.author_id),
    reviewer_id: text(raw.reviewer_id), source_ids: list(raw.source_ids, 'source_ids'), publication_status: text(raw.publication_status),
    visibility: text(raw.visibility), health_claim_level: text(raw.health_claim_level), medical_review_required: raw.medical_review_required === true,
    consent_record_id: text(raw.consent_record_id), locale: text(raw.locale), created_at: date(raw.created_at),
    first_published_at: raw.first_published_at ? date(raw.first_published_at) : '', updated_at: date(raw.updated_at),
    review_due_at: date(raw.review_due_at), featured: raw.featured === true,
    related_article_ids: Array.isArray(raw.related_article_ids) ? raw.related_article_ids.map(text).filter(Boolean) : [],
    canonical_path: text(raw.canonical_path), body: String(raw.body ?? '').trim(),
  };
  if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(article.id)) fail(`${article.id || 'article'} has an invalid id`);
  if (article.title.length < 20 || article.title.length > 90) fail(`${article.id} title must be 20–90 characters`);
  if (article.summary.length < 80 || article.summary.length > 280) fail(`${article.id} summary must be 80–280 characters`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug) || RESERVED_SLUGS.has(article.slug)) fail(`${article.id} has an invalid or reserved slug`);
  if (!CONTENT_TYPES.has(article.content_type)) fail(`${article.id} has unsupported content type`);
  if (!ARTICLE_STATUSES.has(article.publication_status)) fail(`${article.id} has unsupported publication status`);
  if (article.visibility !== 'public') fail(`${article.id} visibility must be public for this public compiler`);
  if (!CLAIM_LEVELS.has(article.health_claim_level)) fail(`${article.id} has unsupported health claim level`);
  if (article.health_claim_level === 'sensitive-health' && !article.medical_review_required) fail(`${article.id} requires medical review`);
  if (!article.locale || !article.author_id || !article.reviewer_id || !article.topic) fail(`${article.id} is missing a required reference`);
  if (article.source_ids.some((sourceId) => !/^[A-Za-z0-9][A-Za-z0-9_-]{2,159}$/.test(sourceId))) fail(`${article.id} source_ids must contain opaque source IDs only`);
  if (!article.body) fail(`${article.id} has no body`);
  if (/<\/?[a-z][^>]*>/i.test(article.body)) fail(`${article.id} raw HTML is not allowed`);
  if (/\b(?:script|iframe|object|embed)\b/i.test(article.body)) fail(`${article.id} contains a prohibited embedded element`);
  if (/\]\((?:javascript|data|vbscript):/i.test(article.body)) fail(`${article.id} contains an unsafe Markdown URL`);
  if (!article.body.match(/^##\s+/m)) fail(`${article.id} body must start its article hierarchy at H2`);
  if (article.publication_status === 'approved' && !article.first_published_at) fail(`${article.id} first_published_at is required for approved content`);
  if (article.created_at > article.updated_at) fail(`${article.id} created_at must not be after updated_at`);
  if (article.first_published_at && article.first_published_at < article.created_at) fail(`${article.id} publication date is before created_at`);
  if (article.first_published_at && article.first_published_at > article.updated_at) fail(`${article.id} publication date is after update date`);
  if (article.review_due_at <= article.updated_at) fail(`${article.id} review_due_at must be after updated_at`);
  if (article.canonical_path !== `/knowledge/${article.slug}`) fail(`${article.id} canonical_path must be /knowledge/{slug}`);
  return article;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function readArticles(sourceDir) {
  const directories = ['articles', 'long-reads'];
  const files = (await Promise.all(directories.map(async (directory) => {
    try {
      return (await readdir(path.join(sourceDir, directory))).filter((name) => name.endsWith('.md')).map((name) => ({ directory, name }));
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }))).flat().sort((a, b) => `${a.directory}/${a.name}`.localeCompare(`${b.directory}/${b.name}`));
  return Promise.all(files.map(async ({ directory, name }) => {
    const parsed = matter(await readFile(path.join(sourceDir, directory, name), 'utf8'));
    return validateArticle({ ...parsed.data, body: parsed.content });
  }));
}

function isLongRead(article) {
  return article.tags.includes('long-read');
}

function contentLabel(article) {
  return isLongRead(article) ? 'Long read' : article.content_type.replaceAll('-', ' ');
}

function pageShell({ title, description, body, canonicalPath, robots = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1', schema }) {
  const canonical = `${origin}${canonicalPath}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} | Rainbow Sanctuary</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="theme-color" content="#f5f5f5">
<link rel="icon" href="/assets/brand/favicon-lotus-64.png?v=20260717-final1" type="image/png" sizes="64x64">
<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png?v=20260717-final1" sizes="180x180">
<link rel="stylesheet" href="/site.css?v=20260714-spectrum1">
<link rel="stylesheet" href="/knowledge.css?v=20260818-knowledge1">
<script src="/site-config.js"></script>
<script src="/support.js"></script>
<script src="/knowledge-search.js?v=20260820-knowledge2" defer></script>
<!-- rs-discovery:start -->
<link rel="canonical" href="${canonical}">
<meta name="robots" content="${robots}">
<meta property="og:site_name" content="Rainbow Sanctuary">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${escapeHtml(title)} | Rainbow Sanctuary">
<meta property="og:description" content="${escapeHtml(description)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapeHtml(title)} | Rainbow Sanctuary">
<meta name="twitter:description" content="${escapeHtml(description)}">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<!-- rs-discovery:end -->
</head>
<body>
<x-dc>
<helmet><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@300;400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"></helmet>
<a class="rs-skip-link" href="#main-content">Skip to content</a>
<div class="rs-knowledge-shell"><dc-import name="SiteNavFixed" active-page="knowledge" hint-size="100%,84px"></dc-import>${body}
<footer class="rs-knowledge-footer"><div><strong>Rainbow Sanctuary</strong><p>A thoughtful, evolving library for questions, orientation, and responsible next steps.</p></div><nav aria-label="Knowledge links"><a href="/knowledge">Knowledge home</a><a href="/knowledge/articles">All articles</a><a href="/knowledge/long-reads">Long reads</a><a href="/knowledge/search">Search</a><a href="/contribute">Donate to support</a><a href="/wellbeing-disclaimer">Wellbeing disclaimer</a><a href="/privacy-policy">Privacy</a></nav></footer></div>
</x-dc>
</body>
</html>\n`;
}

function breadcrumb(items) {
  return { '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: `${origin}${item.path}` })) };
}

function websiteSchema() {
  return { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebSite', '@id': `${origin}/#website`, name: 'Rainbow Sanctuary', url: `${origin}/`, inLanguage: 'en' }] };
}

function articleSchema(article, author, reviewer) {
  const canonical = `${origin}${article.canonical_path}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Article', '@id': `${canonical}#article`, headline: article.title, description: article.summary, mainEntityOfPage: canonical, datePublished: article.first_published_at, dateModified: article.updated_at, inLanguage: article.locale, author: { '@type': 'Person', name: author.name, jobTitle: author.role }, reviewedBy: { '@type': 'Person', name: reviewer.name, jobTitle: reviewer.role }, publisher: { '@type': 'Organization', name: 'Rainbow Sanctuary', url: origin } },
      breadcrumb([{ name: 'Home', path: '/' }, { name: 'Knowledge', path: '/knowledge' }, { name: article.title, path: article.canonical_path }]),
    ],
  };
}

function renderTopicCards(topics, articleCounts) {
  return topics.map((topic) => `<a class="rs-knowledge-topic-card" href="/knowledge/topics/${topic.id}"><span>Topic</span><h2>${escapeHtml(topic.name)}</h2><p>${escapeHtml(topic.short_description)}</p><small>${articleCounts.get(topic.id) || 0} published article${articleCounts.get(topic.id) === 1 ? '' : 's'}</small></a>`).join('');
}

function renderArticleCard(article, topic) {
  return `<article class="rs-knowledge-article-card"><p class="rs-knowledge-kicker">${escapeHtml(topic.name)} · ${escapeHtml(contentLabel(article))}</p><h2><a href="${article.canonical_path}">${escapeHtml(article.title)}</a></h2><p>${escapeHtml(article.summary)}</p><small>Updated ${escapeHtml(article.updated_at)}</small></article>`;
}

function renderArticlePage(article, topic, author, reviewer, related) {
  const { html, toc } = renderMarkdown(article.body);
  const tocMarkup = toc.length ? `<nav class="rs-knowledge-toc" aria-label="On this page"><strong>On this page</strong><ol>${toc.map((item) => `<li class="level-${item.level}"><a href="#${item.id}">${escapeHtml(item.title)}</a></li>`).join('')}</ol></nav>` : '';
  const safety = article.health_claim_level === 'sensitive-health' ? '<aside class="rs-knowledge-safety"><strong>Important:</strong> This article is educational and does not replace medical or mental-health care.</aside>' : '';
  const relatedMarkup = related.length ? `<section class="rs-knowledge-related"><h2>Related articles</h2><div class="rs-knowledge-card-grid">${related.map(({ article: item, topic: itemTopic }) => renderArticleCard(item, itemTopic)).join('')}</div></section>` : '';
  const body = `<main id="main-content" class="rs-knowledge-main" data-pagefind-body data-pagefind-filter="topic:${escapeHtml(topic.id)}" data-pagefind-meta="title:${escapeHtml(article.title)}"><nav class="rs-knowledge-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/knowledge">Knowledge</a><span>/</span><a href="/knowledge/topics/${topic.id}">${escapeHtml(topic.name)}</a></nav><div class="rs-knowledge-article-layout"><article class="rs-knowledge-article"><p class="rs-knowledge-kicker">${escapeHtml(topic.name)} · ${escapeHtml(article.content_type.replaceAll('-', ' '))}</p><h1>${escapeHtml(article.title)}</h1><p class="rs-knowledge-summary">${escapeHtml(article.summary)}</p><dl class="rs-knowledge-byline"><div><dt>Written by</dt><dd>${escapeHtml(author.name)}, ${escapeHtml(author.role)}</dd></div><div><dt>Reviewed by</dt><dd>${escapeHtml(reviewer.name)}, ${escapeHtml(reviewer.role)}</dd></div><div><dt>Updated</dt><dd>${escapeHtml(article.updated_at)}</dd></div></dl>${safety}<div class="rs-knowledge-prose">${html}</div><p class="rs-knowledge-source-note">This article is part of Rainbow Sanctuary’s reviewed public knowledge library. <a href="/apply">Ask a question or suggest a correction</a>.</p></article>${tocMarkup}</div>${relatedMarkup}</main>`;
  return pageShell({ title: article.title, description: article.summary, body, canonicalPath: article.canonical_path, schema: articleSchema(article, author, reviewer) });
}

export async function compileKnowledge({ sourceDir, outputDir, sourceCommit = 'source-controlled', generatedAt }) {
  const [topicsData, peopleData, articles] = await Promise.all([readJson(path.join(sourceDir, 'topics.json')), readJson(path.join(sourceDir, 'people.json')), readArticles(sourceDir)]);
  const topics = (topicsData.topics || []).filter((topic) => topic && topic.enabled === true).map((topic) => ({ id: text(topic.id), name: text(topic.name), short_description: text(topic.short_description), order: Number(topic.order) }));
  if (!topics.length || topics.some((topic) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topic.id) || !topic.name || !topic.short_description || !Number.isInteger(topic.order))) fail('topics.json has an invalid enabled topic');
  topics.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const topicMap = new Map(topics.map((topic) => [topic.id, topic]));
  const people = (peopleData.people || []).filter((person) => person && person.active !== false).map((person) => ({ id: text(person.id), name: text(person.name), role: text(person.role) }));
  if (people.some((person) => !person.id || !person.name || !person.role)) fail('people.json has an invalid active person');
  const personMap = new Map(people.map((person) => [person.id, person]));
  const ids = new Set(); const slugs = new Set();
  for (const article of articles) {
    if (ids.has(article.id) || slugs.has(article.slug)) fail(`duplicate article id or slug: ${article.id}`);
    ids.add(article.id); slugs.add(article.slug);
    if (!topicMap.has(article.topic)) fail(`${article.id} references an unknown or disabled topic`);
    if (!personMap.has(article.author_id) || !personMap.has(article.reviewer_id)) fail(`${article.id} references an unknown author or reviewer`);
    if (article.related_article_ids.includes(article.id)) fail(`${article.id} cannot relate to itself`);
  }
  for (const article of articles) for (const relatedId of article.related_article_ids) if (!ids.has(relatedId)) fail(`${article.id} references unknown related article ${relatedId}`);
  const publicArticles = articles.filter((article) => article.publication_status === 'approved' && article.visibility === 'public').sort((a, b) => a.updated_at === b.updated_at ? a.slug.localeCompare(b.slug) : b.updated_at.localeCompare(a.updated_at));
  const publicLongReads = publicArticles.filter(isLongRead);
  const publicArticleEntries = publicArticles.filter((article) => !isLongRead(article));
  const stableGeneratedAt = generatedAt || `${publicArticles[0]?.updated_at || '1970-01-01'}T00:00:00.000Z`;
  const articleById = new Map(articles.map((article) => [article.id, article]));
  const articleCounts = new Map(topics.map((topic) => [topic.id, publicArticles.filter((article) => article.topic === topic.id).length]));
  await mkdir(outputDir, { recursive: true });
  const files = new Map();
  const write = async (name, value) => { await writeFile(path.join(outputDir, name), value); files.set(name, value); };
  const publicEntries = publicArticles.map((article) => ({ id: article.id, title: article.title, summary: article.summary, canonicalUrl: `${origin}${article.canonical_path}`, topic: { id: article.topic, name: topicMap.get(article.topic).name }, contentType: article.content_type, audiences: article.audiences, tags: article.tags, author: personMap.get(article.author_id), reviewer: personMap.get(article.reviewer_id), firstPublishedAt: article.first_published_at, updatedAt: article.updated_at, reviewDueAt: article.review_due_at, locale: article.locale }));
  const manifest = { schemaVersion: '1.0', sourceCommit, generatedAt: stableGeneratedAt, compilerVersion: '1.1.0', articleCount: publicArticles.length, longReadCount: publicLongReads.length, excludedDraftCount: articles.filter((article) => article.publication_status !== 'approved').length, routes: { 'Knowledge.dc.html': '/knowledge', 'Knowledge-Articles.dc.html': '/knowledge/articles', 'Knowledge-Long-Reads.dc.html': '/knowledge/long-reads', 'Knowledge-Search.dc.html': '/knowledge/search', ...Object.fromEntries(topics.map((topic) => [`Knowledge-Topic-${topic.id}.dc.html`, `/knowledge/topics/${topic.id}`])), ...Object.fromEntries(publicArticles.map((article) => [`Knowledge-${article.slug}.dc.html`, article.canonical_path])) }, entries: publicEntries };
  const landingBody = `<main id="main-content" class="rs-knowledge-main"><section class="rs-knowledge-hero"><nav class="rs-knowledge-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Knowledge</span></nav><p class="rs-knowledge-kicker">Rainbow Sanctuary knowledge</p><h1>A thoughtful place to begin.</h1><p>Find reviewed articles, practical orientation, and clear next steps from Rainbow Sanctuary.</p><form class="rs-knowledge-search-form" action="/knowledge/search" method="get"><label for="knowledge-query">Search the library</label><div><input id="knowledge-query" name="q" type="search" placeholder="What are you looking for?" autocomplete="off"><button type="submit">Search</button></div></form></section><section><h2>Explore by topic</h2><div class="rs-knowledge-topic-grid">${renderTopicCards(topics, articleCounts)}</div></section>${publicLongReads.length ? `<section class="rs-knowledge-recent"><div class="rs-knowledge-section-heading"><div><p class="rs-knowledge-kicker">Books & long reads</p><h2>Take your time with a longer read</h2></div><a class="rs-knowledge-secondary-link" href="/knowledge/long-reads">Explore long reads</a></div><div class="rs-knowledge-card-grid">${publicLongReads.map((article) => renderArticleCard(article, topicMap.get(article.topic))).join('')}</div></section>` : ''}${publicArticleEntries.length ? `<section class="rs-knowledge-recent"><div class="rs-knowledge-section-heading"><div><p class="rs-knowledge-kicker">Latest in the library</p><h2>Recent articles</h2></div><a class="rs-knowledge-secondary-link" href="/knowledge/articles">Explore all articles</a></div><div class="rs-knowledge-card-grid">${publicArticleEntries.slice(0, 6).map((article) => renderArticleCard(article, topicMap.get(article.topic))).join('')}</div></section>` : '<section class="rs-knowledge-empty"><h2>The library is being prepared</h2><p>Our editorial team is organizing reviewed articles. You can still explore the wider site or send a question.</p><a href="/apply">Ask a question</a></section>'}</main>`;
  await write('Knowledge.dc.html', pageShell({ title: 'Knowledge', description: 'Reviewed public knowledge from Rainbow Sanctuary.', body: landingBody, canonicalPath: '/knowledge', schema: { ...websiteSchema(), '@graph': [...websiteSchema()['@graph'], breadcrumb([{ name: 'Home', path: '/' }, { name: 'Knowledge', path: '/knowledge' }])] } }));
  const directoryBody = `<main id="main-content" class="rs-knowledge-main"><nav class="rs-knowledge-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/knowledge">Knowledge</a><span>/</span><span>All articles</span></nav><section class="rs-knowledge-directory-header"><p class="rs-knowledge-kicker">Knowledge library</p><h1>Explore all articles</h1><p>Browse every reviewed Rainbow Sanctuary article. New and updated pieces appear first.</p><div class="rs-knowledge-directory-actions"><a class="rs-knowledge-secondary-link" href="/knowledge/long-reads">Explore long reads</a><a class="rs-knowledge-secondary-link" href="/knowledge/search">Search the library</a><a class="rs-knowledge-secondary-link" href="/knowledge">Explore topics</a></div></section>${publicArticleEntries.length ? `<section class="rs-knowledge-directory-list" aria-label="All knowledge articles">${publicArticleEntries.map((article) => renderArticleCard(article, topicMap.get(article.topic))).join('')}</section>` : '<section class="rs-knowledge-empty"><h2>The library is being prepared</h2><p>Reviewed articles will appear here as they are approved.</p></section>'}</main>`;
  await write('Knowledge-Articles.dc.html', pageShell({ title: 'All knowledge articles', description: 'Browse every reviewed public article from Rainbow Sanctuary.', body: directoryBody, canonicalPath: '/knowledge/articles', schema: { ...websiteSchema(), '@graph': [...websiteSchema()['@graph'], breadcrumb([{ name: 'Home', path: '/' }, { name: 'Knowledge', path: '/knowledge' }, { name: 'All articles', path: '/knowledge/articles' }])] } }));
  const longReadsBody = `<main id="main-content" class="rs-knowledge-main"><nav class="rs-knowledge-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/knowledge">Knowledge</a><span>/</span><span>Long reads</span></nav><section class="rs-knowledge-directory-header"><p class="rs-knowledge-kicker">Books & long reads</p><h1>Read at a slower pace.</h1><p>Long-form writing from Rainbow Sanctuary for readers who want to stay with an idea.</p><div class="rs-knowledge-directory-actions"><a class="rs-knowledge-secondary-link" href="/knowledge/articles">Explore articles</a><a class="rs-knowledge-secondary-link" href="/knowledge/search">Search the library</a></div></section>${publicLongReads.length ? `<section class="rs-knowledge-directory-list" aria-label="Knowledge long reads">${publicLongReads.map((article) => renderArticleCard(article, topicMap.get(article.topic))).join('')}</section>` : '<section class="rs-knowledge-empty"><h2>Long reads are being prepared</h2></section>'}</main>`;
  await write('Knowledge-Long-Reads.dc.html', pageShell({ title: 'Long reads', description: 'Long-form books and writing from Rainbow Sanctuary.', body: longReadsBody, canonicalPath: '/knowledge/long-reads', schema: websiteSchema() }));
  const searchBody = `<main id="main-content" class="rs-knowledge-main"><nav class="rs-knowledge-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/knowledge">Knowledge</a><span>/</span><span>Search</span></nav><section class="rs-knowledge-search-page"><p class="rs-knowledge-kicker">Knowledge search</p><h1>Find a starting point</h1><form class="rs-knowledge-search-form" data-knowledge-search><label for="knowledge-search-query">Search approved articles</label><div><input id="knowledge-search-query" name="q" type="search" autocomplete="off"><button type="submit">Search</button></div></form><p class="rs-knowledge-search-status" role="status" aria-live="polite"></p><div class="rs-knowledge-search-results"></div><noscript><p>Search needs JavaScript, but you can still browse <a href="/knowledge">topics and articles</a>.</p></noscript></section></main>`;
  await write('Knowledge-Search.dc.html', pageShell({ title: 'Search knowledge', description: 'Search Rainbow Sanctuary’s reviewed public knowledge library.', body: searchBody, canonicalPath: '/knowledge/search', robots: 'noindex,follow', schema: websiteSchema() }));
  for (const topic of topics) {
    const topicArticles = publicArticles.filter((article) => article.topic === topic.id);
    const body = `<main id="main-content" class="rs-knowledge-main"><nav class="rs-knowledge-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/knowledge">Knowledge</a><span>/</span><span>${escapeHtml(topic.name)}</span></nav><section class="rs-knowledge-topic-header"><p class="rs-knowledge-kicker">Knowledge topic</p><h1>${escapeHtml(topic.name)}</h1><p>${escapeHtml(topic.short_description)}</p><a href="/knowledge/search">Search the library</a> <a class="rs-knowledge-text-link" href="/knowledge/articles">Explore all articles</a></section><section class="rs-knowledge-card-grid">${topicArticles.length ? topicArticles.map((article) => renderArticleCard(article, topic)).join('') : '<p class="rs-knowledge-empty">Reviewed articles for this topic are being prepared.</p>'}</section></main>`;
    await write(`Knowledge-Topic-${topic.id}.dc.html`, pageShell({ title: topic.name, description: topic.short_description, body, canonicalPath: `/knowledge/topics/${topic.id}`, schema: websiteSchema() }));
  }
  for (const article of publicArticles) {
    const related = article.related_article_ids.map((id) => articleById.get(id)).filter((item) => item?.publication_status === 'approved').map((item) => ({ article: item, topic: topicMap.get(item.topic) }));
    await write(`Knowledge-${article.slug}.dc.html`, renderArticlePage(article, topicMap.get(article.topic), personMap.get(article.author_id), personMap.get(article.reviewer_id), related));
  }
  await write('knowledge-index.json', `${JSON.stringify({ schemaVersion: '1.0', sourceCommit, generatedAt: stableGeneratedAt, entries: publicEntries }, null, 2)}\n`);
  await write('knowledge-build-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
  await write('knowledge-feed.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom"><title>Rainbow Sanctuary Knowledge</title><id>${origin}/knowledge</id><updated>${publicArticles[0]?.updated_at || stableGeneratedAt.slice(0, 10)}T00:00:00Z</updated>${publicArticles.map((article) => `<entry><title>${escapeHtml(article.title)}</title><id>${origin}${article.canonical_path}</id><link href="${origin}${article.canonical_path}"/><updated>${article.updated_at}T00:00:00Z</updated><summary>${escapeHtml(article.summary)}</summary></entry>`).join('')}</feed>\n`);
  return { publicArticles, excludedDraftCount: manifest.excludedDraftCount, manifest, files: [...files.keys()] };
}
