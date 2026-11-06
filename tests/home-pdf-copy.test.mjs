import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const copy = JSON.parse(read('content/home/co-create-verbatim.json'));
const home = read('Home.dc.html');
// Preserve punctuation/capitalization. Remove only PDF furniture and line wrapping,
// including the co-creation word split across pages 5 and 6.
const normalize = value => value
  .replace(/^Rainbow Sanctuary Co-Create Page Copy\s*$/gm, '')
  .replace(/Page \d+ of 6/g, '')
  .replace(/-\s*\n\s*/g, '-')
  .replace(/\s+/g, ' ').trim();
const source = normalize(read('tests/fixtures/home-co-create-pdf.txt'));
const text = normalize(home
  .replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/g, '')
  .replace(/<\/?(?:div|section|article|p|h[1-6]|main|footer|header|br|li|ul|ol|summary|details)\b[^>]*>/g, ' ')
  .replace(/<[^>]*>/g, '')
  .replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'"));
const strings = [];
function collect(value, path) {
  if (typeof value === 'string') strings.push([path, value]);
  else if (Array.isArray(value)) value.forEach((item, i) => collect(item, path + '.' + i));
  else Object.entries(value).forEach(([key, item]) => collect(item, path + '.' + key));
}
for (const [key, value] of Object.entries(copy)) {
  if (!['source', 'revision'].includes(key)) collect(value, key);
}

test('every canonical copy string is verbatim from the owner PDF extraction', () => {
  assert.equal(strings.length, 151);
  for (const [path, value] of strings) assert.ok(source.includes(normalize(value)), path);
  assert.equal(copy.source.sha256, '023ad0d1669fca2a87b38ee0f4dc314037f79ee4e1302e9a85bebb505745ba49');
});

test('all 151 PDF copy strings are rendered without paraphrasing', () => {
  for (const [path, value] of strings) assert.ok(text.includes(normalize(value)), path);
});

test('PDF chapters retain their original order and five optional disclosures', () => {
  const chapters = ['story', 'ecosystem', 'approach', 'school', 'places', 'foundations',
    'horizon', 'offers', 'needs', 'working-together', 'people', 'project-profile', 'connect'];
  let previous = -1;
  for (const id of chapters) {
    const at = home.indexOf('id="' + id + '"');
    assert.ok(at > previous, id); previous = at;
  }
  assert.equal((home.match(/<details class="disclosure">/g) || []).length, 5);
  for (const added of ['In our spiritual understanding', 'not blame for hardship',
    'Adults and lifelong practice', 'A conversation, not a commitment',
    'See the moments behind the vision', 'Our spiritual horizon is becoming']) {
    assert.ok(!text.includes(added), 'removed prior editorial addition: ' + added);
  }
});
