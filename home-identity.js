// Preserve deep links into the previous homepage now available at /explore.
// Only known former anchors can change the path. No external destination/input.
(() => {
  const legacy = new Set(['main-content', 'find-your-path', 'find-your-path-title',
    'planetary-vision', 'contribution-title', 'review-invitation-title',
    'home-photo-spiral', 'home-photo-family', 'home-photo-community']);
  let anchor;
  try { anchor = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
  if (legacy.has(anchor)) window.location.replace(`/explore${window.location.search}#${encodeURIComponent(anchor)}`);
})();

// Progressive enhancement only: all copy, links and native disclosures work without JS.
(() => {
  const masthead = document.querySelector('.coast-masthead');
  if(masthead){
    const sync = () => masthead.toggleAttribute('data-at-top', window.scrollY <= 24);
    sync();
    window.addEventListener('scroll', sync, {passive:true});
    window.addEventListener('pageshow', sync);
  }
  const navLinks=[...document.querySelectorAll('.identity-nav a[href^="#"]')];
  if('IntersectionObserver' in window){
    const chapters=[...document.querySelectorAll('main section[id]')];
    const observer=new IntersectionObserver(()=>{
      const point=window.innerHeight*.25;
      const chapter=chapters.find(section=>{const rect=section.getBoundingClientRect();return rect.top<=point&&rect.bottom>point;});
      const id=chapter?.id==='contact-invitation'?'connect':chapter?.id;
      for(const a of navLinks){if(a.hash==='#'+id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');}
    },{rootMargin:'-15% 0px -60% 0px',threshold:0});
    for(const chapter of chapters)observer.observe(chapter);
  }
  for(const button of document.querySelectorAll('[data-copy-message]')){
    const title=button.closest('article').querySelector('h3').textContent;
    button.setAttribute('aria-label','Copy message starter for '+title.toLowerCase());
    button.addEventListener('click',async()=>{
      const starter=button.closest('article').querySelector('.message-starter');
      const message=[...starter.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent).join('').trim();
      const status=document.querySelector('.copy-status');
      try{await navigator.clipboard.writeText(message);button.querySelector('span').textContent='Copied';status.textContent='Message starter copied. You can paste it into your own Instagram message.';}
      catch{status.textContent='Copy is unavailable here. Select the message starter above and copy it manually.';}
    });
    button.hidden=false;
  }
})();

// Keep native swipe and trackpad momentum; enhance the same rail with buttons.
(() => {
  const gallery = document.querySelector('.places-gallery');
  if (!gallery) return;
  const track = gallery.querySelector('.places-gallery-track');
  const slides = [...track.children];
  const controls = gallery.querySelector('.places-gallery-controls');
  const [previous, next] = controls.querySelectorAll('button');
  const status = controls.querySelector('[role="status"]');
  const last = slides.length - 1;
  let limit = 0, positions = [];
  // Geometry changes on resize, not on every scroll/button/keyboard update.
  const measure = () => {
    limit = Math.max(0, track.scrollWidth - track.clientWidth);
    const origin = slides[0].offsetLeft;
    positions = slides.map(slide => Math.min(limit, slide.offsetLeft - origin));
  };
  const start = index => positions[index];
  const active = () => {
    const scrollLeft = track.scrollLeft;
    // Several final slides may share a clamped snap position. At the end of
    // the rail report the final image rather than the first tied position.
    if (limit > 0 && scrollLeft >= limit - 1) return last;
    return positions.reduce((nearest, position, index) =>
      Math.abs(position - scrollLeft) < Math.abs(start(nearest) - scrollLeft) ? index : nearest, 0);
  };
  const sync = () => {
    const index = active();
    const label = (index + 1) + ' / ' + slides.length;
    if (status.textContent !== label) status.textContent = label;
    previous.setAttribute('aria-disabled', String(index === 0));
    next.setAttribute('aria-disabled', String(index === last));
  };
  const go = index => track.scrollTo({
    left: start(Math.max(0, Math.min(last, index))),
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
  });
  const step = direction => {
    let index = active() + direction;
    while (index >= 0 && index <= last && Math.abs(start(index) - track.scrollLeft) < 1) index += direction;
    return index;
  };
  previous.addEventListener('click', () => go(step(-1)));
  next.addEventListener('click', () => go(step(1)));
  track.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const keys = { ArrowLeft: () => step(-1), ArrowRight: () => step(1), Home: () => 0, End: () => last };
    if (!Object.hasOwn(keys, event.key)) return;
    event.preventDefault();
    go(keys[event.key]());
  });
  let settle;
  track.addEventListener('scroll', () => {
    clearTimeout(settle);
    settle = setTimeout(sync, 100);
  }, {passive: true});
  const refresh = () => { measure(); sync(); };
  window.addEventListener('resize', refresh);
  window.addEventListener('pageshow', refresh);
  controls.hidden = false;
  refresh();
})();
