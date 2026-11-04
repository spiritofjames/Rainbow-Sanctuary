// A deliberately small, non-executing renderer for this site's static HTML.
// Callers must supply an allowlisted public page, never source directories or
// unpublished CMS material. This is not a browser or a general HTML sanitizer.
const VOID = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const OMIT = new Set('head script style nav footer form button input select textarea option template iframe object embed svg canvas video audio helmet dc-import sc-if sc-for'.split(' '));
const BLOCK = new Set('main body article section header aside div p figure figcaption address dl dt dd'.split(' '));
const ENTITIES = {
  amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ',
  ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  hellip: '…', bull: '•', middot: '·', copy: '©', reg: '®', trade: '™',
  rarr: '→', larr: '←', times: '×', euro: '€', pound: '£', yen: '¥',
};

function decode(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi, (whole, entity) => {
    if (entity[0] !== '#') return ENTITIES[entity] ?? whole;
    const number = entity[1].toLowerCase() === 'x'
      ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10);
    return number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff)
      ? String.fromCodePoint(number) : '�';
  });
}

function parse(html) {
  const root = { tag: '#document', attrs: {}, children: [] };
  const stack = [root];
  // Quoted attributes can contain >. Comments never become readable content.
  const tokens = /<!--[\s\S]*?-->|<![^>]*>|<\/?[a-z][^"'<>]*(?:(?:"[^"]*"|'[^']*')[^"'<>]*)*>|[^<]+|</gi;
  let match;
  while ((match = tokens.exec(html))) {
    const token = match[0];
    if (token.startsWith('<!')) continue;
    if (!/^<\/?[a-z]/i.test(token)) {
      stack.at(-1).children.push({ text: token });
      continue;
    }
    const tag = token.match(/^<\/?([\w:-]+)/)[1].toLowerCase();
    if (token.startsWith('</')) {
      const position = stack.findLastIndex((node) => node.tag === tag);
      if (position > 0) stack.length = position;
      continue;
    }
    const attrs = {};
    const attributeSource = token.slice(token.match(/^<[\w:-]+/)[0].length, -1);
    for (const attribute of attributeSource.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      attrs[attribute[1].toLowerCase()] = decode(attribute[2] ?? attribute[3] ?? attribute[4] ?? '');
    }
    const node = { tag, attrs, children: [] };
    stack.at(-1).children.push(node);
    // Script/style text may contain markup-like strings, which must never
    // escape their raw-text element into the document tree.
    if (tag === 'script' || tag === 'style') {
      const closing = new RegExp(`</${tag}\\s*>`, 'gi');
      closing.lastIndex = tokens.lastIndex;
      const end = closing.exec(html);
      tokens.lastIndex = end ? closing.lastIndex : html.length;
    } else if (!VOID.has(tag) && !/\/\s*>$/.test(token)) {
      stack.push(node);
    }
  }
  return root;
}

function hidden(node) {
  const attrs = node.attrs || {};
  return 'hidden' in attrs || 'inert' in attrs || attrs['aria-hidden']?.toLowerCase() === 'true'
    || /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse))\s*(?:!important\s*)?(?:;|$)/i.test(attrs.style || '')
    || /(?:^|\s)(?:is-hidden|hidden)(?:\s|$)/.test(attrs.class || '');
}

function find(node, predicate, includeHidden = false) {
  if (!includeHidden && hidden(node)) return null;
  if (predicate(node)) return node;
  for (const child of node.children || []) {
    const found = find(child, predicate, includeHidden);
    if (found) return found;
  }
  return null;
}

const escapeText = (value) => value.replace(/\\/g, '\\\\').replace(/([*_[\]`])/g, '\\$1').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const compact = (value) => value.replace(/\s+/g, ' ').trim();
const clean = (value) => value.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

function absoluteUrl(value, canonicalUrl) {
  if (!value) return null;
  try {
    const url = new URL(value, canonicalUrl);
    if (!['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol)) return null;
    return url.href.replaceAll('(', '%28').replaceAll(')', '%29').replaceAll('>', '%3E');
  } catch { return null; }
}

/** Render visible static main content; does not execute scripts or load assets. */
export function htmlToMarkdown(html, canonicalUrl) {
  const canonical = new URL(canonicalUrl);
  if (!['https:', 'http:'].includes(canonical.protocol)) throw new Error('Markdown requires an HTTP(S) canonical URL.');
  const document = parse(String(html));
  if (find(document, (node) => node.tag === 'meta'
    && ['robots', 'googlebot', 'bingbot'].includes(node.attrs.name?.toLowerCase())
    && /(?:^|[,\s])(?:noindex|none)(?:$|[,\s])/i.test(node.attrs.content || ''), true)) {
    throw new Error('Refusing to publish Markdown for a noindex document.');
  }
  const main = find(document, (node) => node.tag === 'main')
    || find(document, (node) => node.attrs?.id === 'main-content');
  const body = main || find(document, (node) => node.tag === 'body');
  if (!body || (!main && !find(body, (node) => /^h[1-6]$/.test(node.tag)))) {
    throw new Error('No readable public main content found.');
  }

  function children(node, context = {}) {
    let result = '';
    let previousElement = false;
    for (const child of node.children || []) {
      let value = render(child, context);
      // Source indentation is not an intentional Markdown code block.
      if (result.endsWith('\n')) value = value.replace(/^[ \t]+/, '');
      // Flex/grid labels often have no source whitespace between inline
      // elements. Keep their words distinct without splitting inline text.
      if (value && previousElement && child.tag && /\S$/.test(result) && !/^[\s.,;:!?)]/.test(value)) result += ' ';
      result += value;
      if (value) previousElement = Boolean(child.tag);
    }
    return result;
  }

  function render(node, context = {}) {
    if ('text' in node) return escapeText(decode(node.text).replace(/\s+/g, ' '));
    if (OMIT.has(node.tag) || hidden(node) || node.attrs.role === 'navigation'
      || (!main && node.attrs.role === 'banner')) return '';
    const text = () => children(node, context);
    if (/^h[1-6]$/.test(node.tag)) return `\n\n${'#'.repeat(Number(node.tag[1]))} ${compact(text())}\n\n`;
    if (node.tag === 'br') return '\n';
    if (node.tag === 'hr') return '\n\n---\n\n';
    if (node.tag === 'a') {
      const content = text();
      const href = absoluteUrl(node.attrs.href, canonical);
      const containsBlock = node.children.some((child) => find(child, (item) =>
        BLOCK.has(item.tag) || /^h[1-6]$/.test(item.tag)
        || ['img', 'ul', 'ol', 'table', 'blockquote', 'details', 'hr'].includes(item.tag)));
      // Whole-card anchors wrap headings, paragraphs and images. Markdown link
      // labels cannot contain those block structures; keep the content intact
      // and expose its destination separately (also avoids nested image links).
      if (containsBlock) {
        const readable = clean(content);
        if (!readable) return '';
        return `\n\n${readable}${href ? `\n\n[Visit linked page](${href})` : ''}\n\n`;
      }
      const label = compact(content);
      return label && href ? `[${label}](${href})` : label;
    }
    if (node.tag === 'img') {
      const alt = compact(escapeText(node.attrs.alt || ''));
      const src = absoluteUrl(node.attrs.src, canonical);
      return alt && src ? `\n\n![${alt}](${src})\n\n` : '';
    }
    if (node.tag === 'strong' || node.tag === 'b' || node.tag === 'dt' || node.tag === 'summary') {
      const value = compact(text());
      const formatted = value ? `**${value}**` : '';
      return ['dt', 'summary'].includes(node.tag) ? `\n\n${formatted}\n\n` : formatted;
    }
    if (node.tag === 'em' || node.tag === 'i') return `*${compact(text())}*`;
    if (node.tag === 'blockquote') return `\n\n${clean(text()).split('\n').map((line) => `> ${line}`).join('\n')}\n\n`;
    if (node.tag === 'ul' || node.tag === 'ol') {
      const start = Number.parseInt(node.attrs.start, 10) || 1;
      const items = node.children.filter((child) => child.tag === 'li' && !hidden(child));
      const value = items.map((item, index) => {
        const marker = node.tag === 'ol' ? `${start + index}. ` : '- ';
        const lines = clean(children(item, { ...context, list: true })).split('\n');
        return marker + lines.map((line, i) => i ? `${' '.repeat(marker.length)}${line}` : line).join('\n');
      }).join('\n');
      return `\n\n${value}\n\n`;
    }
    if (node.tag === 'table') {
      const rows = [];
      const visit = (item) => {
        if (hidden(item) || OMIT.has(item.tag)) return;
        if (item.tag === 'tr') {
          const cells = item.children.filter((child) => ['td', 'th'].includes(child.tag) && !hidden(child));
          if (cells.length) rows.push(cells.map((cell) => compact(children(cell)).replaceAll('|', '\\|')));
        } else (item.children || []).forEach(visit);
      };
      visit(node);
      if (!rows.length) return '';
      const columns = Math.max(...rows.map((row) => row.length));
      const rowText = (row) => `| ${Array.from({ length: columns }, (_, i) => row[i] || '').join(' | ')} |`;
      const caption = node.children.find((child) => child.tag === 'caption' && !hidden(child));
      return `\n\n${caption ? `${compact(children(caption))}\n\n` : ''}${rowText(rows[0])}\n${rowText(Array(columns).fill('---'))}\n${rows.slice(1).map(rowText).join('\n')}\n\n`;
    }
    if (BLOCK.has(node.tag) || node.tag === 'details') return `\n\n${clean(text())}\n\n`;
    return text();
  }

  const result = clean(render(body));
  if (!result) throw new Error('No readable public main content found.');
  return `${result}\n`;
}
