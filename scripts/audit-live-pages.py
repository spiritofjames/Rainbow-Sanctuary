#!/usr/bin/env python3
"""Bounded read-only public release probe. No form submissions or credentials."""
import argparse
import importlib.util
import json
from pathlib import Path
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET


def run(origin, limit):
    def fetch(path):
        start = time.monotonic()
        try:
            request = urllib.request.Request(origin + path, headers={'User-Agent': 'Rainbow-release-audit/1'})
            with urllib.request.urlopen(request, timeout=30) as response:
                body = response.read().decode('utf-8', errors='replace')
                return {'path': path, 'status': response.status, 'url': response.url,
                        'seconds': round(time.monotonic() - start, 3), 'headers': dict(response.headers), 'body': body}
        except urllib.error.HTTPError as error:
            return {'path': path, 'status': error.code, 'seconds': round(time.monotonic()-start, 3), 'body': ''}
        except Exception as error:
            return {'path': path, 'status': 0, 'error': str(error), 'body': ''}
        finally:
            time.sleep(1)

    results = [fetch('/robots.txt'), fetch('/sitemap.xml')]
    if 'Disallow: /\n' in results[0]['body'] or results[1]['status'] != 200:
        return {'errors': ['Robots or sitemap gate failed'], 'results': results}
    tree = ET.fromstring(results[1]['body'])
    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    all_paths = [item.findtext('s:loc', namespaces=ns).removeprefix(origin) for item in tree.findall('s:url', ns)]
    # Newest sitemap entries plus critical journeys; total HTML cap is explicit.
    priority = ['/', '/explore', '/personal-karma-reconciliation', '/apply', '/events',
                '/awakening-your-inner-light-Jan-2027', '/children-and-family', '/knowledge', '/knowledge/articles']
    paths = list(dict.fromkeys(priority + [p for p in all_paths if p.startswith('/knowledge/')] + all_paths))[:limit]
    module_path = Path(__file__).with_name('audit-static-pages.py')
    spec = importlib.util.spec_from_file_location('static_audit', module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    for path in paths:
        result = fetch(path)
        page = module.Page()
        page.feed(result.pop('body'))
        result.update({'h1_count': sum(level == 1 for level, _ in page.headings), 'title': page.titles,
                       'canonical': page.canonicals, 'schema_valid': bool(page.schemas) and None not in page.schemas})
        results.append(result)
    for path in ['/llms.txt', '/llms-full.txt', '/markdown/index.md', '/content/home/connection-copy.md', '/package.json', '/scripts/publish-discovery-layer.mjs']:
        result = fetch(path)
        result['bytes'] = len(result.pop('body').encode())
        results.append(result)
    for result in results[:2]:
        result['bytes'] = len(result.pop('body').encode())
    expected_404 = ['/content/home/connection-copy.md', '/package.json', '/scripts/publish-discovery-layer.mjs']
    errors = [r['path'] + ': unexpected status ' + str(r['status']) for r in results
              if r['status'] != (404 if r['path'] in expected_404 else 200)]
    errors += [r['path'] + ': missing H1 or canonical' for r in results if 'h1_count' in r and r['path'] != '/apply'
               and (r['h1_count'] != 1 or len(r['canonical']) != 1)]
    errors += [r['path'] + ': missing title or valid structured data' for r in results if 'h1_count' in r
               and (len(r['title']) != 1 or not r['schema_valid'])]
    errors += [r['path'] + ': canonical does not match production route' for r in results if 'canonical' in r
               and r['canonical'] != [origin + r['path']]]
    return {'origin': origin, 'html_sample_count': len(paths), 'sitemap_count': len(all_paths),
            'coverage': 'All published routes audited locally; bounded live HTML sample; no provider submissions',
            'errors': errors, 'results': results}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--origin', default='https://rainbowsanctuary.life')
    parser.add_argument('--limit', type=int, default=50)
    args = parser.parse_args()
    if not 1 <= args.limit <= 50 or args.origin != 'https://rainbowsanctuary.life':
        parser.error('Only public production origin and a maximum 50 HTML sample are supported')
    result = run(args.origin, args.limit)
    print(json.dumps(result, indent=2))
    raise SystemExit(bool(result['errors']))
