import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('editor is constrained to the protected staging workflow', async () => {
  const config = await read('guardian/config.yml');

  assert.match(config, /repo: spiritofjames\/Rainbow-Sanctuary/);
  assert.match(config, /branch: staging/);
  assert.match(config, /auth_methods: \[token\]/);
  assert.match(config, /publish_mode: editorial_workflow/);
  assert.match(config, /cms_label_prefix: rainbow-knowledge\//);
  assert.doesNotMatch(config, /branch: (?:main|master|production)/);
  assert.doesNotMatch(config, /(?:client_secret|auth_endpoint|token_endpoint):/);
});

test('editor schema preserves the knowledge safety boundary', async () => {
  const config = await read('guardian/config.yml');

  assert.match(config, /pattern: \['\^\[a-z0-9\]\+\(\?:-\[a-z0-9\]\+\)\*\$'/);
  assert.match(config, /options: \[draft, in-review, approved, archived\]/);
  assert.match(config, /options: \[rainbow-editorial\]/);
  assert.match(config, /Opaque private IDs only; never paste a source URL, local path, or confidential note\./);
  assert.match(config, /Required for sensitive-health content\./);
  assert.match(config, /Required for a personal story, direct quote, or identifying image\./);
  assert.match(config, /Raw HTML and embedded media are rejected\./);
  assert.match(config, /media_folder: assets\/knowledge/);
  assert.match(config, /public_folder: \/assets\/knowledge/);
});

test('editor shell is private-by-discovery and loads only the vendored CMS bundle', async () => {
  const [guardian, vercel, support] = await Promise.all([
    read('guardian/index.html'),
    read('vercel.json').then(JSON.parse),
    read('support.js'),
  ]);

  assert.match(guardian, /name="robots" content="noindex,nofollow,noarchive"/);
  assert.match(guardian, /<script src="\/guardian\/sveltia-cms\.js"><\/script>/);
  assert.doesNotMatch(guardian, /<script[^>]+src="https?:\/\//);

  const guardianHeaders = vercel.headers.find(({ source }) => source === '/guardian/(.*)');
  assert.ok(guardianHeaders, 'Vercel must apply private-discovery headers to /guardian');
  assert.equal(
    guardianHeaders.headers.find(({ key }) => key === 'X-Robots-Tag')?.value,
    'noindex, nofollow, noarchive',
  );
  const guardianCsp = guardianHeaders.headers.find(({ key }) => key === 'Content-Security-Policy')?.value ?? '';
  assert.match(guardianCsp, /script-src 'self' 'unsafe-inline' 'unsafe-eval'/);
  assert.doesNotMatch(guardianCsp, /unpkg\.com/, 'the vendored editor must not allow external script sources');

  assert.equal(vercel.rewrites.some(({ source }) => source === '/admin'), false);
  await assert.rejects(access(new URL('../admin', import.meta.url)));

  const globalHeaders = vercel.headers.find(({ source }) => source === '/(.*)');
  const csp = globalHeaders?.headers.find(({ key }) => key === 'Content-Security-Policy')?.value ?? '';
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /connect-src 'self' https:\/\/api\.github\.com https:\/\/github\.com/);
  assert.match(support, /https:\/\/unpkg\.com\/react@/);
  assert.match(csp, /script-src[^;]+https:\/\/unpkg\.com/, 'the public-site React loader requires its pinned CDN allowance');
});

test('editor guide documents least privilege and the separate production decision', async () => {
  const guide = await read('docs/KNOWLEDGE-EDITOR-GUIDE.md');

  assert.match(guide, /fine-grained GitHub personal access token restricted to that repository/);
  assert.match(guide, /minimum repository contents and pull-request permissions/);
  assert.match(guide, /must target `staging`/);
  assert.match(guide, /Production remains a separate `staging` to `main` release decision by James/);
  assert.match(guide, /Do not paste a token into source files, issues, chat, or an untrusted browser/);
});
