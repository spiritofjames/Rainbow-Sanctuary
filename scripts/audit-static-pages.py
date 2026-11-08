#!/usr/bin/env python3
"""Dependency-free audit of every published HTML route, not component fragments.

Emits reviewable JSON. This measures source structure, not rendered accessibility,
search indexing, field Core Web Vitals or external provider delivery.
"""
from __future__ import annotations

import argparse
from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.titles = []
        self.headings = []
        self.meta = {}
        self.canonicals = []
        self.links = []
        self.images = []
        self.schemas = []
        self.current = None
        self.buffer = []
        self.hidden_depth = 0
        self.words = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            self.current, self.buffer = tag, []
        if tag == 'meta':
            self.meta[a.get('name', a.get('property', ''))] = a.get('content', '')
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonicals.append(a.get('href', ''))
        if tag == 'a' and a.get('href'):
            self.links.append(a['href'])
        if tag == 'img':
            self.images.append(a)
        if tag == 'script' and a.get('type') == 'application/ld+json':
            self.current, self.buffer = 'schema', []
        if tag in ('script', 'style'):
            self.hidden_depth += 1

    def handle_data(self, data):
        if self.current:
            self.buffer.append(data)
        if not self.hidden_depth:
            self.words.extend(data.split())

    def handle_endtag(self, tag):
        if self.current == tag or (tag == 'script' and self.current == 'schema'):
            value = ''.join(self.buffer).strip()
            if tag == 'title':
                self.titles.append(value)
            elif self.current == 'schema':
                try:
                    self.schemas.append(json.loads(value))
                except json.JSONDecodeError:
                    self.schemas.append(None)
            else:
                self.headings.append((int(tag[1]), value))
            self.current, self.buffer = None, []
        if tag in ('script', 'style'):
            self.hidden_depth = max(0, self.hidden_depth - 1)


def audit(root):
    config = json.loads((root / 'vercel.json').read_text())
    routes = {r['source']: r['destination'].lstrip('/') for r in config['rewrites']
              if r.get('destination', '').endswith('.dc.html') and ':' not in r['source']
              and '(' not in r['source'] and not r['destination'].startswith('/SiteNav')}
    sitemap = ET.parse(root / 'sitemap.xml')
    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    indexed = {urlparse(u.findtext('s:loc', namespaces=ns)).path
               for u in sitemap.findall('s:url', ns)}
    errors, pages = [], []
    titles, descriptions = Counter(), Counter()
    for route, file in sorted(routes.items()):
        path = root / file
        if not path.exists():
            errors.append(f'{route}: missing HTML {file}')
            continue
        page = Page()
        raw = path.read_text()
        page.feed(raw)
        h1 = [text for level, text in page.headings if level == 1]
        expected = f'https://rainbowsanctuary.life{route}'
        problems = []
        if len(page.titles) != 1 or not page.titles[0]:
            problems.append('requires exactly one nonempty title')
        if len(h1) != 1:
            problems.append(f'requires exactly one H1 (found {len(h1)})')
        if route in indexed and page.canonicals != [expected]:
            problems.append('canonical missing, duplicated or mismatched')
        if not page.meta.get('description'):
            problems.append('missing meta description')
        if route in indexed and (page.schemas.count(None) or not page.schemas):
            problems.append('missing or invalid JSON-LD')
        if route in indexed and 'noindex' in page.meta.get('robots', ''):
            problems.append('noindex route in sitemap')
        if route not in indexed and 'noindex' not in page.meta.get('robots', ''):
            problems.append('indexable route absent from sitemap')
        previous = 0
        jumps = []
        for level, text in page.headings:
            if previous and level > previous + 1:
                jumps.append({'from': previous, 'to': level, 'heading': text})
            previous = level
        missing_alt = [i.get('src', '') for i in page.images if 'alt' not in i]
        missing_size = [i.get('src', '') for i in page.images if not (i.get('width') and i.get('height'))]
        if missing_alt:
            problems.append('image alt attributes missing')
        titles[page.titles[0] if page.titles else ''] += 1
        descriptions[page.meta.get('description', '')] += 1
        errors.extend(f'{route}: {p}' for p in problems)
        pages.append({'route': route, 'file': file, 'indexable': route in indexed,
                      'title': page.titles, 'description_length': len(page.meta.get('description', '')),
                      'h1': h1, 'heading_jumps': jumps, 'html_bytes': path.stat().st_size,
                      'source_word_count': len(page.words), 'image_count': len(page.images),
                      'images_missing_dimensions': missing_size, 'problems': problems})
    return {'scope': 'All source-controlled public HTML rewrites; excludes components and private interfaces',
            'route_count': len(routes), 'sitemap_count': len(indexed),
            'errors': errors, 'duplicate_titles': [t for t, n in titles.items() if n > 1],
            'duplicate_descriptions': [d for d, n in descriptions.items() if n > 1], 'pages': pages}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument('--check', action='store_true', help='Fail on structural publishing errors')
    parser.add_argument('--summary', action='store_true', help='Print counts and failures without per-page detail')
    args = parser.parse_args()
    result = audit(args.root)
    print(json.dumps({k: v for k, v in result.items() if k != 'pages'} if args.summary else result,
                     ensure_ascii=False, indent=2))
    raise SystemExit(1 if args.check and (result['errors'] or result['duplicate_titles']) else 0)
