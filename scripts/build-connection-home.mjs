// Rebuild the identity homepage from the reviewed local copy. No network effects.
import fs from 'node:fs';
import MarkdownIt from 'markdown-it';
import {icon} from './lib/home-icons.mjs';
const md = new MarkdownIt({html:false});
const old = fs.readFileSync('Home.dc.html','utf8');
const source = fs.readFileSync('content/home/connection-copy.md','utf8');
const sections = Object.fromEntries([...source.matchAll(/^## (\d+)\. [^\n]+\n([\s\S]*?)(?=^## \d+\. |$(?![\s\S]))/gm)].map(m=>[+m[1],m[2].trim()]));
const inline = s => md.renderInline(s.replace(/\n/g,' ').trim());
const links = {'Connect with us':'#connect','Connect as a family':'#connect-families','Explore current family activities':'/children-and-family','See what is taking shape':'#progress','Explore the wider PSN vision':'/bigger-vision','Explore programmes & events':'/explore','Connect around this inquiry':'#connect-projects','Explore current experiences':'/events','Connect with the work':'#connect','Read Rainbow’s story':'/about','Visit Rainbow on Instagram':'https://www.instagram.com/rainbowsanctuary.life/'};
const link = (label,button=false) => {if(!links[label])throw Error('Unmapped CTA '+label);return `<a class="${button?'button':'text-link'}" href="${links[label]}">${inline(label)}${icon('arrow')}</a>`;};
function render(text){
  return text.split(/\n\s*\n/).filter(p=>p.trim()).map(p=>{
    if(p==='Mission statement:')return '';
    if(p.startsWith('Eyebrow:'))return `<p class="eyebrow">${inline(p.slice(8))}</p>`;
    if(p.startsWith('Context line:'))return `<p class="small context-note">${inline(p.slice(13))}</p>`;
    if(p.startsWith('Image caption:'))return '';
    if(p.startsWith('Small supporting heading:'))return `<h3>${inline(p.slice(25))}</h3>`;
    if(p.startsWith('Supporting invitation:'))return `<p>${inline(p.slice(22))}</p>`;
    if(/^(CTA|Text link):/.test(p))return link(p.replace(/^(CTA|Text link):\s*|\*\*/g,'').trim(),p.startsWith('CTA:'));
    if(/^#{1,3} /.test(p)){let n=p.match(/^#+/)[0].length;return `<h${n}>${p.split('\n').map(l=>inline(l.replace(/^#+ /,''))).join('<br>')}</h${n}>`;}
    return `<p>${inline(p)}</p>`;
  }).join('\n');
}
const fig = cls => {const x=old.match(new RegExp(`<figure class="${cls}">[\\s\\S]*?<\\/figure>`));if(!x)throw Error('Missing approved figure '+cls);return x[0];};
const coast=fig('coast'),school=fig('product-visual'),aerial=fig('site-visualisation wrap'),programme=fig('product-visual framed-website'),psn=fig('psn-artwork'),connection=fig('connection-visual'),social=fig('social-photo');
const mosaic=['mosaic-light','mosaic-water','mosaic-wildlife'].map(fig).join('');
const nav=`<a href="#vision">Our vision</a><a href="#school">The School</a><a href="#panama">Panama</a><a href="#progress">Our progress</a><a class="nav-action" href="#connect">Connect with us</a><a class="nav-secondary" href="/explore">Explore programmes &amp; events</a>`;
let head=old.split('<body')[0].replace(/<title>.*?<\/title>/,'<title>Rainbow Sanctuary | Community, Learning &amp; Connection</title>').replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="Connect with Rainbow Sanctuary in Panama. Explore our community vision, the developing School of the Universe and the wider Planetary Symbiosis Network.">').replaceAll('v=20261031','v=20261101');
const hub=sections[10];const intro=hub.split('### Parents and families')[0];
const audiences=[['families','Parents and families','Hello Rainbow, I’m connecting as a parent. We’re interested in…'],['communities','Existing communities','Hello Rainbow, our community is based in… We’re already working on…'],['projects','Active projects','Hello Rainbow, I’m working on… We’re looking for…']];
const cards=audiences.map(([id,title,starter])=>{const text=hub.split('### '+title+'\n')[1].split(/\nCTA:/)[0].trim();return `<article id="connect-${id}"><h3>${title}</h3>${render(text)}<p class="message-starter"><span>Message starter</span>${inline(starter)}</p></article>`;}).join('');
const how=hub.split('### A conversation, not a commitment')[1];
const visionMarkup=render(sections[3]);
const visionHeading=visionMarkup.match(/^[\s\S]*?<\/h2>/)[0];
const photo=(file,height,alt,caption,cls='chapter-photo')=>`<figure class="${cls}"><div class="media-frame"><img src="/assets/retreats/awakening-inner-light-december-2026/gallery/curated/${file}-1200.webp" width="1200" height="${height}" alt="${alt}" loading="lazy" decoding="async"></div><figcaption>${caption}</figcaption></figure>`;
const humanBridge=`<div class="shared-bridge wide-media" aria-label="People, shared paths and places">${photo('shared-reflection',550,'Adults sharing a conversation in an open wooden pavilion','People · listening and learning at a past gathering.','bridge-photo')}${photo('forest-walk',2132,'Two people walking beneath tall rainforest trees','Shared paths · through the living world.','bridge-photo')}${photo('pavilion-circle',675,'People meeting in a circle in a forest-side pavilion','Places · room to meet at a past gathering.','bridge-photo')}</div>`;
function bodyColumns(body){const ends=[...body.matchAll(/<\/p>/g)];const cut=ends[Math.min(1,ends.length-1)]?.index+4 || body.length;return `<div class="chapter-body"><div>${body.slice(0,cut)}</div><div>${body.slice(cut)}</div></div>`;}
function imageChapter(id,text,visual){const markup=render(text);const heading=markup.match(/^[\s\S]*?<\/h2>/)[0];return `<section class="image-chapter wrap" id="${id}"><div class="image-chapter-heading">${heading}</div>${visual}${bodyColumns(markup.slice(heading.length))}</section>`;}
const inquiryArt=`<figure class="inquiry-art"><img src="/assets/home/inquiry-mandala-1800.jpg" width="1800" height="600" alt="Symbolic golden botanical mandala connected by delicate light to a tropical forest and stream" loading="lazy" decoding="async"><figcaption>Artistic interpretation · a spiritual inquiry, not a demonstrated technology.</figcaption></figure>`;
const teamNetwork=`<div class="team-network" aria-label="People connected through Rainbow"><svg class="team-connections" viewBox="0 0 1000 400" fill="none" aria-hidden="true" focusable="false"><path d="M160 200C350 10 650 390 840 180M160 200C410 430 580 0 840 180M500 80v250" stroke="currentColor" stroke-width="1.5"/><circle cx="500" cy="220" r="160" stroke="currentColor" stroke-dasharray="3 10"/></svg>${[['stephanie-wu','Stephanie Wu','Spiritual practice & facilitation'],['james-stark','James Stark','Systems, emotional intelligence & technology'],['hanan-perea','Hanan Perea','Retreat facilitator']].map(([file,name,role])=>`<figure><img src="/assets/retreats/awakening-inner-light-december-2026/facilitators/${file}-1080x1920.webp" width="1080" height="1920" alt="${name}" loading="lazy" decoding="async"><figcaption><strong>${name}</strong><span>${role}</span></figcaption></figure>`).join('')}</div><p class="team-caption">People behind Rainbow and its retreat work · photographs. The connecting lines are symbolic.</p>`;
const faqs=[...sections[11].matchAll(/^### ([^\n]+)\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)].map(([,q,a])=>`<details><summary>${inline(q)}</summary><p>${inline(a)}</p></details>`).join('\n');
if((faqs.match(/<details>/g)||[]).length!==8)throw Error('Eight reviewed FAQs required');
let footer=old.match(/<footer[\s\S]*?<\/footer>/)[0].replace('Inner growth, shared learning and care for the living world.','Inner growth. Shared learning. Care for life.').replace('>Programmes<','>Explore programmes &amp; events<');
if(!footer.includes('The wider PSN vision'))footer=footer.replace('</nav><nav class="footer-legal"','<a href="#psn">The wider PSN vision</a><a href="#connect">Connect with us</a></nav><nav class="footer-legal"');
const progressParts=sections[9].split('Small supporting heading:');
const progressHeading=progressParts[0].split('### ')[0];
const progressCards=[...progressParts[0].matchAll(/^### ([^\n]+)\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)].map(([,h,b])=>`<article><h3>${inline(h)}</h3>${render(b.trim())}</article>`).join('');
const inquiryHeading=sections[8].match(/^## .+$/m)[0];
let html=`${head}<body class="selected-page connection-page experience-page">
<a class="skip" href="#main">Skip to content</a>
<header class="header wrap"><a href="/" class="brand" aria-label="Rainbow Sanctuary home"><img src="/assets/home/rainbow-wordmark.png" width="500" height="200" alt="Rainbow Sanctuary" decoding="async"></a><nav class="identity-nav" aria-label="Main navigation">${nav}</nav><details class="mobile-menu"><summary>Explore <span aria-hidden="true">+</span></summary><nav aria-label="Mobile navigation">${nav}</nav></details></header>
<main id="main">
<section class="arrival"><div class="arrival-intro wrap">${render(sections[2])}</div>${coast}</section>
<section class="vision-note wrap" id="vision"><div class="chapter-intro">${visionHeading}</div><div class="chapter-reading">${visionMarkup.slice(visionHeading.length)}</div></section>${humanBridge}
${imageChapter('school',sections[4],school)}
<section class="place-chapter" id="panama"><div class="copy-split wrap"><div class="place-heading"><p class="eyebrow">One place to put the vision into practice</p><h2>Rooted in Panama.<br>Learning through life.</h2></div><div>${render(sections[5].split('In Bocas del Toro')[1]?'In Bocas del Toro'+sections[5].split('In Bocas del Toro')[1]:sections[5])}</div></div>${aerial}<div class="nature-mosaic wrap">${mosaic}</div></section>
${imageChapter('psn',sections[6],psn)}
${imageChapter('pathways',sections[7],programme)}
<section class="inquiry-section" id="inquiry">${inquiryArt}<div class="copy-split wrap"><div class="inquiry-heading"><p class="eyebrow">An emerging inquiry</p>${render(inquiryHeading)}</div><div>${render(sections[8].replace(/^Eyebrow:.*\n/m,'').replace(inquiryHeading,''))}</div></div><div class="inquiry-outro" aria-hidden="true"></div></section>
<section class="progress-section wrap" id="progress">${render(progressHeading)}${photo('movement-practice',549,'People sharing a guided movement practice in a wooden pavilion','Shared practice at a past gathering.','progress-photo')}<div class="progress-grid">${progressCards}</div><div class="people-note" id="people">${render('Small supporting heading:'+progressParts[1])}${teamNetwork}</div></section>
<section class="connection-hub wrap" id="connect"><div class="hub-intro">${render(intro)}</div>${connection}<div class="audience-grid">${cards}</div><p class="copy-status" role="status" aria-live="polite"></p><a class="text-link" href="#contact-invitation">Ready to introduce yourself?${icon('arrow')}</a></section>
<section class="contact-invitation wrap" id="contact-invitation"><div class="contact-card"><div class="hub-contact"><p class="eyebrow">Begin with a conversation</p><h2>Have another way<br>to contribute?</h2><p>Bring a skill, an idea or a question. You do not need a formal project to introduce yourself.</p><p class="message-starter">Hello Rainbow, I’d like to introduce myself. I can offer…</p><a class="button" href="https://www.instagram.com/rainbowsanctuary.life/" target="_blank" rel="noopener noreferrer">Message Rainbow on Instagram</a><p class="small">This opens our Instagram profile. Send us a message there and tell us which part of the work interests you.</p></div><div class="connection-how"><h3>A conversation, not a commitment</h3>${render(how)}</div></div></section>
<section class="home-questions wrap" id="questions"><div><p class="eyebrow">Practical questions</p><h2>A clearer picture,<br>before we connect.</h2></div><div class="question-list">${faqs}</div></section>
<section class="closing wrap">${photo('evening-fire',675,'People gathering around a warm outdoor fire at dusk','An evening together · a past gathering.','closing-photo')}<div>${render(sections[12])}</div></section>
<section class="social-connect wrap" id="instagram"><div class="instagram-panel">${social}<div class="instagram-copy"><div class="instagram-glyph">${icon('instagram')}</div>${render(sections[13].replace(/Handle:[\s\S]*/,''))}<p class="instagram-handle">@rainbowsanctuary.life</p></div></div></section>
</main>${footer}</body></html>`;
if(!html.includes('/home-experience.css'))html=html.replace('</head>','<link rel="stylesheet" href="/home-experience.css?v=20261101">\n</head>');
html=html.replace(/(<article id="connect-(families|communities|projects)">)/g,(_,tag,name)=>tag+`<div class="audience-symbol">${icon(name)}</div>`);
html=html.replace(/(<p class="message-starter"><span>Message starter<\/span>[\s\S]*?<\/p>)/g,`$1<button type="button" class="copy-starter" data-copy-message hidden>${icon('copy')}<span>Copy message starter</span></button>`);
html=html.replace(/(<div class="progress-grid">)([\s\S]*?)(<\/div><div class="people-note")/,(_,start,cards,end)=>{let i=0;return start+cards.replace(/<article>/g,()=>`<article><span class="progress-symbol">${icon(['check','seed','horizon'][i++])}</span>`)+end;});
html=html.replace('Message Rainbow on Instagram</a>',`Message Rainbow on Instagram${icon('arrow')}</a>`);
html=html.replace(/<h3>A conversation, not a commitment<\/h3>/,`${icon('message')}<h3>A conversation, not a commitment</h3>`);
html=html.replace('<h2>Many places. A shared purpose.</h2>','<h2>Many places.<br>A shared purpose.</h2>');
html=html.replaceAll('v=20261101','v=20261102');
fs.writeFileSync('Home.dc.html',html);
