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
  const menu = document.querySelector('.mobile-menu');
  if(menu){
    menu.addEventListener('click',event=>{if(event.target.closest('a'))menu.open=false;});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}});
    document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});
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
