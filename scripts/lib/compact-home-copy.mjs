// Reproduce the owner's six-page copy verbatim within the Shared Pathway design.
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const rich = value => escape(value).replaceAll('Awakening the Original Code','<strong>Awakening the Original Code</strong>');
const p = (text, cls='') => '<p'+(cls?' class="'+cls+'"':'')+'>'+rich(text)+'</p>';
// Match the reference's deliberate editorial line breaks, without changing copy.
const heading = value => escape(value
  .replace('home to who we are.','home\nto who we are.')
  .replace('whole, in four forms.','whole,\nin four forms.')
  .replace('awakening to a culture','awakening\nto a culture')
  .replace('foundation into a way','foundation\ninto a way')
  .replace('inner growth into the life','inner growth into\nthe life'))
  .replace('. ','.<br>').replaceAll('\n','<br>');
const disclosure = (title, body, symbol) => '<details class="disclosure"><summary><span aria-hidden="true" class="disclosure-symbol">'+symbol+'</span><span class="disclosure-label"><span class="disclosure-title">'+escape(title)+'</span></span><span aria-hidden="true" class="disclosure-toggle"></span></summary><div class="disclosure-body">'+body+'</div></details>';

export function simplifyHome(reference, copy) {
  let main=reference;
  const sourceSymbol=id=>{
    const section=reference.match(new RegExp('<section[^>]*id="'+id+'"[\\s\\S]*?<\\/section>'))?.[0];
    const mark=section?.match(/<span\b[^>]*class="disclosure-symbol"[^>]*>([\s\S]*?)<\/span>/)?.[1];
    if(!mark)throw new Error('Missing original source disclosure glyph '+id);
    return mark;
  };
  const update=(id, render)=>{
    const re=new RegExp('<section[^>]*id="'+id+'"[\\s\\S]*?<\\/section>');
    const old=main.match(re)?.[0];if(!old)throw new Error('Missing copy section '+id);
    main=main.replace(re,render(old));
  };
  const frame=(old,title,intro,body='')=>{
    const open=old.match(/^<section[^>]*>/)[0];
    const id=old.match(/aria-labelledby="([^"]+)"/)?.[1];
    const key=old.match(/\bid="([^"]+)"/)?.[1];
    const dataKey=key==='working-together'?'collaboration':key;
    const label=(old.match(/<div class="chapter-label">[\s\S]*?<\/div><\/div>/)?.[0] || '').replace(/(<div class="eyebrow">)[\s\S]*?(<\/div>)/,'$1'+escape(copy[dataKey]?.label || '')+'$2');
    return open+'<div class="section-intro">'+label+'<h2 id="'+id+'">'+heading(title)+'</h2>'+intro+'</div>'+body+'</section>';
  };
  const articles=old=>[...old.matchAll(/<article\b[\s\S]*?<\/article>/g)].map(m=>m[0]);
  const medallion=old=>old?.match(/<span\b[^>]*class="icon-medallion"[^>]*>[\s\S]*?<\/span>/)?.[0] || '';
  main=main.replace(/<h1\b([^>]*)>[\s\S]*?<\/h1>/,'<h1$1>'+heading(copy.hero.heading.replace(' Co-create','\nCo-create'))+'</h1>')
    .replace(/<p class="lead">[\s\S]*?<\/p>/,p(copy.hero.body,'lead'))
    .replace(/<p class="hero-story">[\s\S]*?<\/p>/,'')
    .replace(/<p class="hello">[\s\S]*?<\/p>/,p(copy.hero.tagline,'hello'));
  main=main.replace(/<(?:div|section)\b[^>]*class="status-strip"[^>]*>[\s\S]*?(?=<section\b[^>]*id="story")/,
    '<div class="status-strip" aria-label="Three highlights">'+copy.highlights.map(([label,text])=>'<div><span class="eyebrow">'+escape(label)+':</span>'+p(text)+'</div>').join('')+'</div>\n');

  update('story',old=>frame(old,copy.story.heading,'<div class="story-columns">'+copy.story.paragraphs.map(text=>'<div>'+p(text)+'</div>').join('')+'</div>',
    '<div class="mission"><span class="eyebrow">'+escape(copy.story.purposeLabel)+'</span>'+p(copy.story.purpose)+'</div>'+
    disclosure(copy.story.disclosure,'<div class="fact-grid">'+copy.story.sovereignty.map(([title,text])=>'<p><strong>'+escape(title)+':</strong> '+escape(text)+'</p>').join('')+'</div>',sourceSymbol('story'))));
  update('ecosystem',old=>{
    const prior=articles(old);
    const cards=copy.ecosystem.cards.map((card,i)=>'<article class="card ecosystem-card-'+(i+1)+'"><div class="ecosystem-card-head"><div class="card-brand">'+prior[i].match(/<img\b[^>]*>/)[0]+'</div><span class="role">'+escape(card.role)+'</span><h3>'+escape(card.title)+':</h3></div>'+p(card.body)+'<span class="stage">'+escape(card.stage)+'</span></article>').join('');
    return frame(old,copy.ecosystem.heading,'','<div class="ecosystem">'+cards+'</div>');
  });
  update('approach',old=>{
    const prior=articles(old);
    return frame(old,copy.approach.heading,'','<div class="three learning">'+copy.approach.cards.map(([title,text],i)=>'<article class="illustrated-card">'+medallion(prior[i])+'<h3>'+escape(title)+':</h3>'+p(text)+'</article>').join('')+'</div>'+p(copy.approach.embrace)+disclosure(copy.approach.disclosure,p(copy.approach.honesty),sourceSymbol('approach')));
  });
  update('school',old=>{
    const prior=[...old.matchAll(/<div class="pathway-heading">[\s\S]*?<\/h3><\/div>/g)].map(m=>m[0]);
    const pathways=copy.school.pathways.map(([title,text],i)=>'<div class="pathway-card"><div class="pathway-heading">'+medallion(prior[i])+'<h3>'+escape(title)+':</h3></div>'+p(text)+'</div>').join('');
    return frame(old,copy.school.heading,p(copy.school.intro,'muted'),'<div class="story-columns learning-pathways">'+pathways+'</div>'+disclosure(copy.school.coursesTitle,p(copy.school.courses),sourceSymbol('school'))+disclosure(copy.school.journeyTitle,p(copy.school.journey),sourceSymbol('school')));
  });
  update('places',old=>{
    const cards=copy.places.items.map((place,i)=>'<article class="card place"><span class="place-index place-badge">'+String(i+1).padStart(2,'0')+'</span><h3>'+escape(place.name)+'</h3><span class="stage">'+escape(place.status)+'</span>'+p(place.body)+'</article>').join('');
    return frame(old,copy.places.heading,'','<div class="three places-grid">'+cards+'</div>'+p(copy.places.note,'source-line'));
  });
  update('foundations',old=>frame(old,copy.foundations.heading,copy.foundations.paragraphs.map(text=>p(text,'muted')).join('')));
  update('horizon',old=>{
    const reading=copy.horizon.reading.map(([title,text])=>'<p><strong>'+escape(title)+':</strong> '+escape(text)+'</p>').join('');
    return frame(old,copy.horizon.heading,p(copy.horizon.intro),disclosure(copy.horizon.disclosure,reading,sourceSymbol('horizon')));
  });
  update('offers',old=>{
    const prior=articles(old);
    const cards=copy.offers.cards.map(([title,text],i)=>'<article class="benefit"><div class="content-card-head">'+medallion(prior[i])+'<span class="n" aria-hidden="true">'+String(i+1).padStart(2,'0')+'</span><h3>'+escape(title)+':</h3></div>'+p(text)+'</article>').join('');
    return frame(old,copy.offers.heading,'','<div class="benefits">'+cards+'</div>');
  });
  update('needs',old=>{
    const prior=articles(old);
    const cards=copy.needs.cards.map(([title,text],i)=>'<article class="workstream"><div class="content-card-head">'+medallion(prior[i])+'<h3>'+escape(title)+':</h3></div>'+p(text)+'</article>').join('');
    return frame(old,copy.needs.heading,'','<div class="roadmap needs-grid">'+cards+'</div>');
  });
  update('working-together',old=>frame(old,copy.collaboration.heading,p(copy.collaboration.intro)));
  update('people',old=>{
    const prior=articles(old);
    const cards=copy.people.members.map((person,i)=>'<article class="card">'+prior[i].match(/<img\b[^>]*>/)[0]+'<h3>'+escape(person.name)+'</h3><span class="role">'+escape(person.role)+'</span>'+p(person.body)+'</article>').join('');
    return frame(old,copy.people.heading,p(copy.people.intro,'muted'),'<div class="neutral-team">'+cards+'</div>');
  });
  update('project-profile',old=>'<section class="section profile-section" id="project-profile" aria-labelledby="profile-title"><div><div class="eyebrow">'+escape(copy.profile.label)+'</div><h2 id="profile-title">'+heading(copy.profile.heading)+'</h2>'+p(copy.profile.body)+'</div><div class="profile-downloads"><a class="button primary" href="/co-create/profile.md">'+escape(copy.profile.buttons[0])+'</a><a class="button" href="/co-create/profile.json">'+escape(copy.profile.buttons[1])+'</a></div></section>');
  update('connect',old=>'<section class="closing" id="connect" aria-labelledby="connect-title">'+old.match(/<img\b[^>]*>/)[0]+'<div class="eyebrow">'+escape(copy.connect.label)+'</div><h2 id="connect-title">'+heading(copy.connect.heading)+'</h2>'+copy.connect.paragraphs.map(text=>p(text)).join('')+'<div class="connect-grid"></div><p class="contact-note">Write to us at <a href="mailto:hello@rainbowsanctuary.life">hello@rainbowsanctuary.life</a>.</p><p><strong>'+escape(copy.connect.signoff)+'</strong></p></section>');
  return main;
}
