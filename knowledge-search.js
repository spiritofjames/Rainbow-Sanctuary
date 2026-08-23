const form = document.querySelector('[data-knowledge-search]');

if (form) {
  const input = form.querySelector('input[name="q"]');
  const status = document.querySelector('.rs-knowledge-search-status');
  const results = document.querySelector('.rs-knowledge-search-results');
  const params = new URLSearchParams(location.search);
  input.value = params.get('q') || '';

  const escapeHtml = (value) => String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const search = async (query) => {
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
      status.textContent = records.length ? `${records.length} result${records.length === 1 ? '' : 's'} for “${query}”.` : `No approved articles matched “${query}”. Try a broader phrase or browse a topic.`;
      results.innerHTML = records.map((record) => `<article class="rs-knowledge-search-result"><p>${escapeHtml(record.meta?.topic || 'Knowledge')}</p><h2><a href="${escapeHtml(record.url)}">${escapeHtml(record.meta?.title || record.title)}</a></h2><p>${escapeHtml(record.excerpt)}</p></article>`).join('');
    } catch {
      status.textContent = 'Search is temporarily unavailable. You can still browse the knowledge topics.';
      results.innerHTML = '<p><a href="/knowledge">Browse knowledge topics</a></p>';
    }
  };
  form.addEventListener('submit', (event) => { event.preventDefault(); const query = input.value.trim(); history.replaceState({}, '', query ? `/knowledge/search?q=${encodeURIComponent(query)}` : '/knowledge/search'); search(query); });
  search(input.value);
}
