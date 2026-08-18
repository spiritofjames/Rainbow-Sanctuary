import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { compileKnowledge, validateArticle } from '../scripts/knowledge/compiler.mjs';

const fixtureRoot = path.resolve('tests/fixtures/knowledge');

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
  const combined = `${article}\n${index}\n${manifest}`;

  assert.match(article, /data-pagefind-body/);
  assert.match(article, /About this knowledge library/);
  assert.match(landing, /Recent articles/);
  assert.match(landing, /href="\/knowledge\/articles">Explore all articles/);
  assert.match(directory, /Explore all articles/);
  assert.match(directory, /using-the-library/);
  assert.match(manifest, /"Knowledge-Articles\.dc\.html": "\/knowledge\/articles"/);
  assert.doesNotMatch(combined, /PRIVATE_DRAFT_SENTINEL/);
  assert.doesNotMatch(combined, /private-source-path/);
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
