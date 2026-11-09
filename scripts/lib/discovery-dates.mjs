import { createHash } from 'node:crypto';

// Only date content we can identify. Do not use file mtimes, build time, or
// the last generated schema block as evidence of a meaningful page update.
export function mainContentFingerprint(source) {
  const main = source.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (!main) return '';
  return createHash('sha256').update(main.replace(/\s+/g, ' ').trim()).digest('hex');
}

export function verifiedPageDate(source, record) {
  if (!record) return '';
  const parsedDate = new Date(`${record.updatedAt}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.updatedAt)
    || Number.isNaN(parsedDate.valueOf())
    || parsedDate.toISOString().slice(0, 10) !== record.updatedAt
    || !/^[a-f0-9]{64}$/.test(record.mainContentSha256 || '')
    || !record.evidence?.trim()) {
    throw new Error('Invalid discovery page-date record');
  }
  return mainContentFingerprint(source) === record.mainContentSha256 ? record.updatedAt : '';
}

export function knowledgePageDate(route, entries) {
  let matching = entries;
  if (route.startsWith('/knowledge/topics/')) {
    const topic = route.slice('/knowledge/topics/'.length);
    matching = entries.filter(entry => entry.topic?.id === topic);
  } else if (route === '/knowledge/long-reads') {
    matching = entries.filter(entry => entry.tags?.includes('long-read'));
  } else if (route === '/knowledge/articles') {
    matching = entries.filter(entry => !entry.tags?.includes('long-read'));
  } else if (route !== '/knowledge') {
    matching = entries.filter(entry => new URL(entry.canonicalUrl).pathname === route);
  }
  return matching.map(entry => entry.updatedAt).filter(Boolean).sort().at(-1) || '';
}
