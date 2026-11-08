const escapeHtml = (value) => String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
// Pagefind adds bare <mark> tags. Preserve only those two exact tags after
// escaping everything else; attributes and arbitrary HTML remain inert text.
const formatExcerpt = value => escapeHtml(value).replace(/&lt;(\/?)mark&gt;/gi, '<$1mark>');
const resultUrl = value => {
  const url = String(value || '');
  const legacy = url.match(/^\/Knowledge-([a-z0-9-]+)\.dc\.html$/);
  if (legacy) return `/knowledge/${legacy[1]}`;
  return /^\/knowledge\/[a-z0-9-]+$/.test(url) ? url : '/knowledge';
};

const initializeKnowledgeSearch = (form) => {
  if (form.dataset.knowledgeSearchReady === 'true') return;
  form.dataset.knowledgeSearchReady = 'true';
  const input = form.querySelector('input[name="q"]');
  const container = form.closest('.rs-knowledge-search-page') || document;
  const status = container.querySelector('.rs-knowledge-search-status');
  const results = container.querySelector('.rs-knowledge-search-results');
  if (!input || !status || !results) return;
  const params = new URLSearchParams(location.search);
  input.value = params.get('q') || '';
  let searchVersion = 0;

  const search = async (query) => {
    const version = ++searchVersion;
    if (!query.trim()) {
      status.textContent = 'Enter a word or phrase to search approved articles.';
      results.innerHTML = '';
      return;
    }
    status.textContent = 'Searching the library…';
    results.innerHTML = '';
    try {
      const pagefind = await import('/pagefind/pagefind.js');
      const response = await pagefind.search(query, { filters: {} });
      const records = await Promise.all(response.results.slice(0, 12).map((result) => result.data()));
      if (version !== searchVersion) return;
      const count = response.results.length > records.length ? `Showing ${records.length} of ${response.results.length} results` : `${records.length} result${records.length === 1 ? '' : 's'}`;
      status.textContent = records.length ? `${count} for “${query}”.` : `No approved articles matched “${query}”. Try a broader phrase or browse a topic.`;
      results.innerHTML = records.map((record) => `<article class="rs-knowledge-search-result"><p>${escapeHtml(record.meta?.topic || 'Knowledge')}</p><h2><a href="${escapeHtml(resultUrl(record.url))}">${escapeHtml(record.meta?.title || record.title)}</a></h2><p>${formatExcerpt(record.excerpt)}</p></article>`).join('');
    } catch {
      if (version !== searchVersion) return;
      status.textContent = 'Search is temporarily unavailable. You can still browse the knowledge topics.';
      results.innerHTML = '<p><a href="/knowledge">Browse knowledge topics</a></p>';
    }
  };
  form.addEventListener('submit', (event) => { event.preventDefault(); const query = input.value.trim(); history.replaceState({}, '', query ? `/knowledge/search?q=${encodeURIComponent(query)}` : '/knowledge/search'); search(query); });
  search(input.value);
};

const initializeAvailableSearch = () => {
  document.querySelectorAll('[data-knowledge-search]').forEach(initializeKnowledgeSearch);
};

initializeAvailableSearch();
const observer = new MutationObserver(initializeAvailableSearch);
observer.observe(document.body, { childList: true, subtree: true });
