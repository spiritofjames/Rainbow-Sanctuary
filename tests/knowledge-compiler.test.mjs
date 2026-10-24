import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { compileKnowledge, validateArticle } from '../scripts/knowledge/compiler.mjs';
import { knowledgeContributorSchema } from '../scripts/knowledge/entities.mjs';

const fixtureRoot = path.resolve('tests/fixtures/knowledge');

test('Knowledge contributor schema distinguishes the editorial team from an individual author', () => {
  const editorial = knowledgeContributorSchema({ id: 'rainbow-editorial', name: 'Rainbow Sanctuary Editorial Team', role: 'Website editorial team' });
  assert.equal(editorial['@type'], 'Organization');
  assert.equal(editorial['@id'], 'https://rainbowsanctuary.life/#editorial-team');
  assert.deepEqual(editorial.parentOrganization, { '@id': 'https://rainbowsanctuary.life/#organization' });
  assert.equal(editorial.jobTitle, undefined);
  assert.deepEqual(knowledgeContributorSchema({ id: 'stephanie-wu', name: 'Stephanie Wu', role: 'Author' }), {
    '@type': 'Person', name: 'Stephanie Wu', jobTitle: 'Author',
  });
});

test('AC-001 / AC-002: compiles approved public content and excludes drafts from every public artifact', async (t) => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'rainbow-knowledge-'));
  t.after(() => rm(outputDir, { recursive: true, force: true }));

  const result = await compileKnowledge({
    sourceDir: fixtureRoot,
    outputDir,
    sourceCommit: 'test-commit',
    generatedAt: '2026-08-18T00:00:00.000Z',
  });

  assert.deepEqual(result.publicArticles.map(({ slug }) => slug), ['using-the-library']);
  assert.equal(result.excludedDraftCount, 1);

  const article = await readFile(path.join(outputDir, 'Knowledge-using-the-library.dc.html'), 'utf8');
  const landing = await readFile(path.join(outputDir, 'Knowledge.dc.html'), 'utf8');
  const directory = await readFile(path.join(outputDir, 'Knowledge-Articles.dc.html'), 'utf8');
  const index = await readFile(path.join(outputDir, 'knowledge-index.json'), 'utf8');
  const manifest = await readFile(path.join(outputDir, 'knowledge-build-manifest.json'), 'utf8');
  const generatedFiles = await readdir(outputDir);
  const combined = (await Promise.all(generatedFiles.map((name) => readFile(path.join(outputDir, name), 'utf8')))).join('\n');

  assert.match(article, /data-pagefind-body/);
  assert.match(article, /About this knowledge library/);
  assert.match(landing, /Recent articles/);
  assert.match(landing, /href="\/knowledge\/articles">Explore all articles/);
  assert.match(directory, /Explore all articles/);
  assert.match(directory, /using-the-library/);
  assert.match(manifest, /"Knowledge-Articles\.dc\.html": "\/knowledge\/articles"/);
  const schema = JSON.parse(article.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const articleEntity = schema['@graph'].find((item) => item['@type'] === 'Article');
  assert.equal(articleEntity.author['@type'], 'Organization');
  assert.equal(articleEntity.reviewedBy['@id'], articleEntity.author['@id']);
  assert.match(landing, /class="rs-knowledge-topic-card"[^>]*><span>Topic<\/span><h3>/);
  assert.match(landing, /class="rs-knowledge-article-card">[\s\S]*?<h3><a/);
  assert.doesNotMatch(landing, /class="rs-knowledge-article-card">[\s\S]*?<h2><a/);
  assert.match(directory, /class="rs-knowledge-article-card">[\s\S]*?<h2><a/);
  assert.doesNotMatch(combined, /PRIVATE_DRAFT_SENTINEL/);
  assert.doesNotMatch(combined, /private-source-path/);
});

test('Knowledge cards nest below section headings without changing directory heading levels', async (t) => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'rainbow-knowledge-headings-'));
  t.after(() => rm(outputDir, { recursive: true, force: true }));
  await compileKnowledge({ sourceDir: path.resolve('content/knowledge'), outputDir });
  const article = await readFile(path.join(outputDir, 'Knowledge-shared-practice-of-life.dc.html'), 'utf8');
  const related = article.match(/<section class="rs-knowledge-related">([\s\S]*?)<\/section>/)[1];
  assert.match(related, /^<h2>Related articles<\/h2>/);
  assert.match(related, /<h3><a/);
  assert.equal([...related.matchAll(/<h2>/g)].length, 1);
  const topic = await readFile(path.join(outputDir, 'Knowledge-Topic-co-creation-and-community.dc.html'), 'utf8');
  const directory = await readFile(path.join(outputDir, 'Knowledge-Long-Reads.dc.html'), 'utf8');
  assert.match(topic, /class="rs-knowledge-article-card">[\s\S]*?<h2><a/);
  assert.match(directory, /class="rs-knowledge-article-card">[\s\S]*?<h2><a/);
  const css = await readFile(path.resolve('knowledge.css'), 'utf8');
  assert.match(css, /\.rs-knowledge-topic-card h3,/);
  assert.match(css, /\.rs-knowledge-article-card h3,/);
  assert.match(css, /font-size: 28px; line-height: 1\.12; margin: 8px 0;/);
});

test('AC-003: approved content requires an auditable publication chronology and opaque source IDs', () => {
  const valid = {
    id: 'auditable-article', title: 'An adequately long auditable article title', slug: 'auditable-article',
    summary: 'A sufficiently long summary that is only present to satisfy the article schema requirements.',
    topic: 'getting-started', content_type: 'explainer', audiences: ['everyone'], tags: ['test'],
    author_id: 'rainbow-editorial', reviewer_id: 'rainbow-editorial', source_ids: ['drive-opaque_ID-123'],
    publication_status: 'approved', visibility: 'public', health_claim_level: 'none', medical_review_required: false,
    locale: 'en', created_at: '2026-08-17', first_published_at: '2026-08-18', updated_at: '2026-08-19',
    review_due_at: '2027-08-19', canonical_path: '/knowledge/auditable-article', body: '## Safe section\n\nA safe test body.',
  };

  assert.throws(() => validateArticle({ ...valid, first_published_at: '' }), /first_published_at/i);
  assert.throws(() => validateArticle({ ...valid, created_at: '2026-08-20' }), /created_at/i);
  assert.throws(() => validateArticle({ ...valid, first_published_at: '2026-08-16' }), /publication date/i);
  assert.throws(() => validateArticle({ ...valid, source_ids: ['https://drive.google.com/private'] }), /opaque source ID/i);
  assert.throws(() => validateArticle({ ...valid, source_ids: ['/Users/editor/private-note'] }), /opaque source ID/i);
});

test('AC-004: rejects raw HTML and sensitive-health content without medical review', () => {
  assert.throws(
    () => validateArticle({
      id: 'unsafe', title: 'An adequately long unsafe article title', slug: 'unsafe',
      summary: 'A sufficiently long summary that is only present to satisfy the article schema requirements.',
      topic: 'getting-started', content_type: 'explainer', audiences: ['everyone'], tags: ['test'],
      author_id: 'rainbow-editorial', reviewer_id: 'rainbow-editorial', source_ids: ['safe-source'],
      publication_status: 'approved', visibility: 'public', health_claim_level: 'none', medical_review_required: false,
      locale: 'en', created_at: '2026-08-18', first_published_at: '2026-08-18', updated_at: '2026-08-18',
      review_due_at: '2027-08-18', canonical_path: '/knowledge/unsafe', body: '<script>alert(1)</script>',
    }),
    /raw HTML/i,
  );

  assert.throws(
    () => validateArticle({
      id: 'sensitive', title: 'An adequately long sensitive article title', slug: 'sensitive',
      summary: 'A sufficiently long summary that is only present to satisfy the article schema requirements.',
      topic: 'getting-started', content_type: 'safety', audiences: ['everyone'], tags: ['test'],
      author_id: 'rainbow-editorial', reviewer_id: 'rainbow-editorial', source_ids: ['safe-source'],
      publication_status: 'approved', visibility: 'public', health_claim_level: 'sensitive-health', medical_review_required: false,
      locale: 'en', created_at: '2026-08-18', first_published_at: '2026-08-18', updated_at: '2026-08-18',
      review_due_at: '2027-08-18', canonical_path: '/knowledge/sensitive', body: '## Safety\n\nA safe test body.',
    }),
    /medical review/i,
  );
});

test('NFR-012: repeated builds with fixed inputs are content-equivalent', async (t) => {
  const first = await mkdtemp(path.join(os.tmpdir(), 'rainbow-knowledge-first-'));
  const second = await mkdtemp(path.join(os.tmpdir(), 'rainbow-knowledge-second-'));
  t.after(() => Promise.all([rm(first, { recursive: true, force: true }), rm(second, { recursive: true, force: true })]));

  const options = { sourceDir: fixtureRoot, sourceCommit: 'test-commit', generatedAt: '2026-08-18T00:00:00.000Z' };
  await compileKnowledge({ ...options, outputDir: first });
  await compileKnowledge({ ...options, outputDir: second });

  assert.equal(
    await readFile(path.join(first, 'knowledge-build-manifest.json'), 'utf8'),
    await readFile(path.join(second, 'knowledge-build-manifest.json'), 'utf8'),
  );
});
