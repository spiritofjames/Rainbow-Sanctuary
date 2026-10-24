import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { htmlToMarkdown } from '../scripts/lib/html-to-markdown.mjs';

const canonical = 'https://rainbowsanctuary.life/awakening-your-inner-light-2026';
const page = (main) => `<!doctype html><html><head><title>Not body text</title></head><body><nav>Global menu</nav><main>${main}</main><footer>Footer text</footer></body></html>`;

test('main-content headings, including section headers, remain structured', () => {
  const result = htmlToMarkdown(page('<header><h1>One title</h1><p>Introduction.</p></header><section><header><h2>During the week</h2><p>Care &amp; rest.</p></header><h3>Next step</h3><p>Details.</p></section>'), canonical);
  assert.equal((result.match(/^# /gm) || []).length, 1);
  assert.match(result, /^# One title\n\nIntroduction\./);
  assert.match(result, /## During the week\n\nCare & rest\./);
  assert.match(result, /### Next step\n\nDetails\./);
  assert.doesNotMatch(result, /Global menu|Footer text|Not body text/);
});

test('FAQ details include both questions and answers even when initially closed', () => {
  const result = htmlToMarkdown(page('<h1>Questions</h1><details><summary>Is it treatment?</summary><p>No. It does not replace qualified care.</p></details>'), canonical);
  assert.match(result, /\*\*Is it treatment\?\*\*\n\nNo\. It does not replace qualified care\./);
});

test('scripts, UI, hidden regions and their descendants never become Markdown', () => {
  const result = htmlToMarkdown(page(`<h1>Public</h1><p>Visible.</p><script>"<main><h1>Injected content</h1></main>"</script><style>.private { color: red; }</style><nav>Menu</nav><footer>Foot</footer><form><p>Contact fields</p></form><button>Player control</button><div hidden>Hidden one</div><div aria-hidden="true"><p>Hidden two</p></div><div style="display: none !important">Hidden three</div><div class="is-hidden">Hidden four</div><template>Hidden five</template><div inert>Hidden six</div>`), canonical);
  assert.equal(result, '# Public\n\nVisible.\n');
});

test('links and images resolve against the canonical HTML URL, not Markdown URL', () => {
  const result = htmlToMarkdown(page('<h1>Contact</h1><p><a href="/apply?reason=events&amp;intent=discovery-call">Ask us</a>; <a href="#questions">Questions</a>; <a href="mailto:hello@example.test">Email</a></p><img src="./assets/photo.jpg" alt="Forest &amp; sea"><img src="./decorative.jpg" alt="">'), canonical);
  assert.match(result, /\[Ask us\]\(https:\/\/rainbowsanctuary.life\/apply\?reason=events&intent=discovery-call\)/);
  assert.match(result, /\[Questions\]\(https:\/\/rainbowsanctuary.life\/awakening-your-inner-light-2026#questions\)/);
  assert.match(result, /\[Email\]\(mailto:hello@example.test\)/);
  assert.match(result, /!\[Forest & sea\]\(https:\/\/rainbowsanctuary.life\/assets\/photo.jpg\)/);
  assert.doesNotMatch(result, /decorative/);
});

test('unsafe URL protocols and comments cannot become active Markdown links', () => {
  const result = htmlToMarkdown(page('<h1>Public</h1><!-- Internal note --><a href="javascript:alert(1)">Unsafe link</a><a href="data:text/html,evil">Data link</a><p>&lt;script&gt; &quot;quoted&quot; &#x1f331; &#39;text&#39; &nbsp; &rarr;</p>'), canonical);
  assert.doesNotMatch(result, /javascript:|data:text|Internal note|<script>/);
  assert.match(result, /Unsafe link Data link/);
  assert.match(result, /&lt;script&gt; "quoted" 🌱 'text' →/);
});

test('lists, numbered steps, nested lists and table cell boundaries are preserved', () => {
  const result = htmlToMarkdown(page('<h1>Details</h1><ol start="2"><li>Arrive</li><li>Practise<ul><li>Rest</li><li>Reflect</li></ul></li></ol><table><thead><tr><th>Dates</th><th>Fee</th></tr></thead><tbody><tr><td>3–9 December</td><td>USD 3,500</td></tr></tbody></table>'), canonical);
  assert.match(result, /2\. Arrive\n3\. Practise/);
  assert.match(result, /   - Rest\n   - Reflect/);
  assert.match(result, /\| Dates \| Fee \|\n\| --- \| --- \|\n\| 3–9 December \| USD 3,500 \|/);
});

test('legacy body fallback retains content headers without publishing navigation', () => {
  const result = htmlToMarkdown('<html><head><title>Title</title></head><body><header role="banner">Brand navigation</header><nav>Menu</nav><div><header><h1>Legacy article</h1></header><section><h2>Content</h2><p>Still useful.</p></section></div><footer>Site footer</footer></body></html>', canonical);
  assert.match(result, /^# Legacy article\n\n## Content\n\nStill useful\./);
  assert.doesNotMatch(result, /Brand navigation|Menu|Site footer/);
});

test('noindex, empty and non-content documents fail closed', () => {
  for (const robots of ['noindex,nofollow', 'NOINDEX, FOLLOW', 'none']) {
    assert.throws(() => htmlToMarkdown(`<html><head><meta name="robots" content="${robots}"></head><body><main><h1>Not public</h1></main></body></html>`, canonical), /noindex/);
  }
  assert.throws(() => htmlToMarkdown('<html><body><nav>Menu only</nav></body></html>', canonical), /No readable/);
  assert.throws(() => htmlToMarkdown('<main hidden><h1>Private content</h1></main>', canonical), /No readable/);
  assert.throws(() => htmlToMarkdown(page('<h1>Title</h1>'), 'file:///private/document'), /HTTP/);
});

test('quoted greater-than attributes and uppercase HTML do not corrupt the tree', () => {
  const result = htmlToMarkdown('<HTML><BODY><MAIN><HEADER><H1 data-context="x > y">Public title</H1></HEADER><P>Read <A HREF="/about" title="x > y">our story</A>.</P></MAIN></BODY></HTML>', canonical);
  assert.match(result, /^# Public title/);
  assert.match(result, /\[our story\]\(https:\/\/rainbowsanctuary.life\/about\)/);
});

test('adjacent styled labels retain word boundaries and table captions', () => {
  const result = htmlToMarkdown(page('<h1>Facts</h1><div><span>Dates</span><strong>3–9 December 2026</strong></div><details><summary><span>01</span><span>Prepare with context</span></summary><p>Ask questions.</p></details><table><caption>Published fee</caption><tr><th>Price</th></tr><tr><td>USD 3,500</td></tr></table>'), canonical);
  assert.match(result, /Dates \*\*3–9 December 2026\*\*/);
  assert.match(result, /\*\*01 Prepare with context\*\*/);
  assert.match(result, /Published fee\n\n\| Price \|/);
});

test('whole-card links retain block headings, paragraphs and images without nesting', () => {
  const result = htmlToMarkdown(page(`<h1>Current invitations</h1><a href="/events"><img src="/assets/card.jpg" alt="Gathering"><div><span>In person</span><h2>December retreat</h2><p>Preparation, ceremony and integration.</p><span>Explore the retreat</span></div></a><a href="/assets/large.jpg"><img src="/assets/small.jpg" alt="Coastline"></a>`), canonical);
  assert.match(result, /^## December retreat$/m);
  assert.match(result, /\n\nPreparation, ceremony and integration\.\n\n/);
  assert.match(result, /!\[Gathering\]\(https:\/\/rainbowsanctuary.life\/assets\/card.jpg\)/);
  assert.match(result, /\[Visit linked page\]\(https:\/\/rainbowsanctuary.life\/events\)/);
  assert.match(result, /!\[Coastline\]\(https:\/\/rainbowsanctuary.life\/assets\/small.jpg\)\n\n\[Visit linked page\]\(https:\/\/rainbowsanctuary.life\/assets\/large.jpg\)/);
  assert.doesNotMatch(result, /\[!\[|\[[^\n]*##/);
});

test('real homepage linked cards keep their headings as Markdown headings', () => {
  const html = readFileSync(new URL('../Home.dc.html', import.meta.url), 'utf8');
  const result = htmlToMarkdown(html, 'https://rainbowsanctuary.life/');
  assert.match(result, /^## Awakening Your Inner Light$/m);
  assert.match(result, /\[Visit linked page\]\(https:\/\/rainbowsanctuary.life\/awakening-your-inner-light-2026\)/);
  assert.doesNotMatch(result, /\[[^\n]*##|\[!\[/);
});

test('real retreat HTML preserves important headings, FAQ and documentary labels', () => {
  const html = readFileSync(new URL('../Awakening-Your-Inner-Light-2026.dc.html', import.meta.url), 'utf8');
  const result = htmlToMarkdown(html, canonical);
  assert.equal(result, htmlToMarkdown(html, canonical), 'output is deterministic');
  assert.equal((result.match(/^# /gm) || []).length, 1);
  assert.match(result, /The ceremony is part of the journey/);
  assert.match(result, /Clear answers, before you decide/);
  assert.match(result, /3–9 December 2026/);
  assert.match(result, /USD 3,500/);
  assert.match(result, /illustrative/i);
  assert.doesNotMatch(result, /<script|@context|function\s*\(/);
});
