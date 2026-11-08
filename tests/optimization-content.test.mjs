import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import matter from 'gray-matter';

const root = new URL('../', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');
const newIds = [
  'rainbow-sanctuary-school-psn-guide', 'starting-a-co-creation-conversation',
  'community-project-collaboration-brief', 'place-stewardship-questions-before-commitment',
  'family-learning-questions-before-joining', 'turning-insight-into-daily-practice',
  'respectful-spiritual-practice-and-consent', 'january-retreat-questions-before-registering',
  'conscious-technology-discernment-guide', 'contributing-skills-with-clear-boundaries'
];

test('ten useful new articles are published throughout discovery, not orphaned drafts', () => {
  const manifest = JSON.parse(read('knowledge-build-manifest.json'));
  const entries = new Map(manifest.entries.map(entry => [entry.id, entry]));
  const routes = new Set(JSON.parse(read('vercel.json')).rewrites.map(rule => rule.source));
  for (const id of newIds) {
    const { data, content } = matter(read(`content/knowledge/articles/${id}.md`));
    assert.equal(data.author_id, 'rainbow-editorial', 'do not invent a named personal author');
    assert.equal(data.publication_status, 'approved');
    assert.ok(content.trim().split(/\s+/).length >= 800, id);
    assert.ok((content.match(/^### /gm) || []).length >= 3, `${id}: reader questions`);
    assert.doesNotMatch(content, /^# /m, 'compiler supplies the single H1');
    assert.ok(entries.has(id), `${id}: public manifest`);
    assert.ok(routes.has(`/knowledge/${id}`), `${id}: clean route`);
    assert.ok(read('sitemap.xml').includes(`/knowledge/${id}</loc>`));
    assert.ok(read('llms.txt').includes(`/knowledge/${id})`));
    assert.ok(read(`markdown/knowledge/${id}.md`).includes(data.title));
    assert.ok(read('Knowledge-Articles.dc.html').includes(`/knowledge/${id}`));
    for (const [, href] of content.matchAll(/\]\((\/[^)]+)\)/g)) {
      const [route, fragment] = href.split('#');
      assert.ok(routes.has(route), `${id}: known internal route ${route}`);
      if (fragment && route === '/') assert.ok(read('Home.dc.html').includes(`id="${fragment}"`), fragment);
    }
  }
});

test('new content retains factual and family-facing boundaries', () => {
  assert.match(read('content/knowledge/articles/family-learning-questions-before-joining.md'), /Adult retreat participation is separate and voluntary/);
  assert.match(read('content/knowledge/articles/conscious-technology-discernment-guide.md'), /not verified technical access/);
  assert.match(read('content/knowledge/articles/rainbow-sanctuary-school-psn-guide.md'), /preparing for beta/);
  const retreat = read('content/knowledge/articles/january-retreat-questions-before-registering.md');
  assert.match(retreat, /18–24 January 2027/);
  assert.match(retreat, /USD 3,500 per person/);
  assert.match(retreat, /does not reserve a place/);
});
