// Shared Pathway chapters with verbatim PDF copy and Rainbow's coastal masthead.
// Saved source is inert input; no network is used by this build.
import fs from 'node:fs';
import {simplifyHome} from './lib/compact-home-copy.mjs';
const read = name => fs.readFileSync(name, 'utf8');
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const reference = read('content/home/shared-pathway-style-reference.html');
const copy = JSON.parse(read('content/home/co-create-verbatim.json'));
if (/<script\b|<iframe\b|<form\b|\son[a-z]+\s*=|javascript:/i.test(reference)) throw new Error('Unexpected active content in reference.');
let main = reference.match(/<main\b[\s\S]*?<\/main>/)?.[0];
if (!main) throw new Error('Reference main missing.');
main = simplifyHome(main,copy);
const sourceHero = main.match(/<section class="hero neutral-hero" aria-labelledby="hero-title">[\s\S]*?<\/section>/)?.[0];
if (!sourceHero?.includes('<figure class="hero-photo">')) throw new Error('Reference hero missing.');
const coastalPhoto = '<figure class="coast-hero__photo"><img src="/assets/home/coast-1920.webp" srcset="/assets/home/coast-960.webp 960w, /assets/home/coast-1920.webp 1920w" sizes="(min-width: 112rem) 108rem, 96vw" width="1920" height="1079" alt="Aerial view of rainforest, a sandy shoreline and turquoise sea in Bocas del Toro, Panama" fetchpriority="high" decoding="async"><figcaption>Bocas surroundings · photograph</figcaption></figure>';
main = main.replace(sourceHero, sourceHero
  .replace('<section class="hero neutral-hero" aria-labelledby="hero-title"><div>',
    '<section class="hero coast-hero" aria-labelledby="hero-title"><div class="coast-hero__copy">')
  .replace(/<figure class="hero-photo">[\s\S]*?<\/figure>/, coastalPhoto));
const edit = (id, fn) => {
  const re = new RegExp('<section[^>]*id="'+id+'"[\\s\\S]*?<\\/section>');
  if (!re.test(main)) throw new Error('Missing reference section '+id);
  main = main.replace(re,fn);
};
const alias = (section,id) => section.replace(/(<h2\b)/,'<span id="'+id+'" class="anchor-alias" aria-hidden="true"></span>$1');
edit('story',s=>alias(s,'vision'));
edit('school',s=>s
  .replace('<div class="section-intro">','<div class="school-intro-with-symbol"><div class="section-intro">')
  .replace('<div class="story-columns learning-pathways">',
    '<figure class="school-symbol"><img src="/assets/home/noya-rao-school-rainbow.webp" width="1120" height="896" alt="Illustration of a luminous Noya Rao tree with spreading roots beneath a rainbow" loading="lazy" decoding="async"></figure></div><div class="story-columns learning-pathways">'));
const placesImages = [
  'A boat in turquoise water beside a forested shore',
  'A long sandy beach running alongside tropical forest',
  'People resting on cushions beside candles',
  'Stars above the silhouettes of trees',
  'Sparks and smoke in front of a gathering',
  'A sloth among green leaves',
  'Sunbeams passing through dense forest',
  'A crescent moon and stars framed by palms',
  'A toucan perched among green leaves',
  'Two people holding hands in a seated circle',
  'Looking up into a canopy of tall palms',
  'People seated around a fire with a guitar',
  'Aerial view of a dense forest canopy',
  'A guitarist and companions beside a beach fire',
  'Sunlit palms and tall trunks in a tropical forest',
  'A reptile’s eye at the surface of water among floating leaves'
];
const placesGallery = '<div class="places-gallery" id="places-gallery" role="region" aria-label="Nature and gatherings gallery">'
  + '<div class="places-gallery-bar"><p>Nature &amp; gatherings</p><span class="places-gallery-hint">Swipe or scroll to explore</span></div>'
  + '<ul class="places-gallery-track" id="places-gallery-track" tabindex="0" aria-label="Gallery images">'
  + placesImages.map((alt,i)=>{
    const src='/assets/home/places-gallery/'+(i+1);
    return '<li><img src="'+src+'-720.webp" srcset="'+src+'-720.webp 720w, '+src+'-1440.webp 1440w" sizes="(max-width: 44rem) 82vw, (min-width: 64rem) 720px, 74vw" width="1440" height="1080" alt="'+escape(alt)+'" loading="lazy" decoding="async"></li>';
  }).join('') + '</ul>'
  + '<div class="places-gallery-controls" hidden><span role="status">1 / '+placesImages.length+'</span>'
  + '<button type="button" aria-label="Previous image" aria-controls="places-gallery-track" aria-disabled="true">‹</button>'
  + '<button type="button" aria-label="Next image" aria-controls="places-gallery-track">›</button></div></div>';
edit('places',s=>{
  return s.replace('<div class="three places-grid">',placesGallery+'<div class="three places-grid">')
    .replace('<article class="card place">','<article class="card place" id="panama">');
});
edit('foundations',s=>alias(s,'progress'));
edit('horizon',s=>alias(s,'psn'));
edit('offers',s=>alias(s,'pathways'));
edit('needs',s=>s.replace('<div class="roadmap needs-grid">',
  '<figure class="needs-illustration"><img src="/assets/home/shared-future-1440.webp" srcset="/assets/home/shared-future-720.webp 720w, /assets/home/shared-future-1440.webp 1440w" sizes="(min-width: 75rem) 1136px, 92vw" width="1440" height="1080" alt="Illustration of golden paths linking forests and islands beneath a rising sun" loading="lazy" decoding="async"><figcaption>Artistic vision · many places, one shared future.</figcaption></figure><div class="roadmap needs-grid">'));
edit('people',s=>s.replace(/<img\b[^>]*\bsrc="\/assets\/team\/(stephanie|james|ethel|chloe)\.jpg"[^>]*>/g,(tag,name)=>tag
  .replace('team-photo stephanie-photo','team-photo')
  .replace(/src="[^"]+"/,'src="/assets/home/team/aligned/'+name+'.jpg"')
  .replace(/width="\d+" height="\d+"/,'width="900" height="1200"')));
edit('project-profile',s=>s.replace('href="/co-create/profile.md"','href="/markdown/home.md"')
  .replace('href="/co-create/profile.json"','href="/assets/home/co-create-profile.json"'));
const topics = [
 ['connect-communities','Community%20or%20project%20co-creation'],
 ['connect-families','School%20youth%20or%20adult%20learning'],
 ['connect-places','Stewardship%20and%20physical%20nodes'],
 ['connect-projects','Contributing%20to%20SI%20and%20conscious%20technology']
];
const contact = '<div class="connect-grid">'+topics.map(([id,subject],i)=>
 '<a class="button contact-path-link" id="'+id+'" href="mailto:hello@rainbowsanctuary.life?subject='+subject+'">'+escape(copy.connect.buttons[i])+'</a>').join('')+'</div>';
const closingArt = JSON.parse(read('content/home/approved-visuals.json'))['connection-visual'];
if (!closingArt) throw new Error('Closing artwork missing.');
edit('connect',s=>s.replace('<div class="connect-grid">',closingArt+contact.replace(/<\/div>$/,'')));
main = main.replaceAll('/co-create/assets/photos/','/assets/home/shared/photos/')
 .replace('<img src="/assets/brand/rainbow-dark.png"','<img class="ecosystem-logo" src="/assets/home/rainbow-rect-logo-2.png"')
 .replaceAll('/assets/brand/','/assets/home/shared/brand/')
 .replace(/<img\b[^>]*>/g,tag=>tag.includes('decoding=') ? tag : tag.replace('>',' decoding="async">'));
const header = '<header class="coast-masthead"><div class="coast-masthead__inner">'
 + '<a class="coast-masthead__brand" href="/" aria-label="Rainbow Sanctuary home"><img src="/assets/brand/lotus-mark-header.png" alt="" width="256" height="186"><span>Rainbow Sanctuary</span></a>'
 + '<nav class="nav identity-nav" aria-label="Main navigation"><a class="masthead-connect" href="#connect">Connect with Us</a>'
 + '<a class="masthead-website" href="/explore">Programs &amp; Events <span aria-hidden="true">→</span></a></nav></div></header>';
const footerLinks=[['/explore','Programmes & events'],['/knowledge','Knowledge library'],['/privacy-policy','Privacy'],['/terms','Terms'],['/wellbeing-disclaimer','Wellbeing scope'],['/children-safeguarding','Children & safeguarding'],['/accessibility','Accessibility']];
const footer='<footer><div>'+escape(copy.footer)+'<br>'+escape(copy.values)+'</div><nav aria-label="Footer navigation">'+footerLinks.map(([href,label])=>'<a href="'+href+'">'+escape(label)+'</a>').join('')+'</nav></footer>';
const html=read('content/home/page-head.html')+'\n<body class="shared-page exact-shared-style"><a class="skip" href="#main">Skip to content</a><div class="wrap">'+header+main+footer+'</div></body></html>\n';
if((html.match(/<h1\b/g)||[]).length!==1)throw new Error('Homepage needs one h1.');
fs.writeFileSync('Home.dc.html',html);
const profile={name:'Rainbow Sanctuary',url:'https://rainbowsanctuary.life/',revision:copy.revision,description:copy.hero.body,purpose:copy.story.purpose,ecosystem:copy.ecosystem.cards,school:{status:copy.ecosystem.cards[1].stage,pathways:copy.school.pathways,courses:copy.school.courses,journey:copy.school.journey},places:{ownerReportedAsOf:'2026-11-03',items:copy.places.items},currentStage:copy.foundations.paragraphs,team:copy.people.members,offers:copy.offers.cards,needs:copy.needs.cards,contact:{email:'hello@rainbowsanctuary.life',topics:topics.map(([id,subject],i)=>({label:copy.connect.buttons[i],href:'mailto:hello@rainbowsanctuary.life?subject='+subject}))}};
fs.writeFileSync('assets/home/co-create-profile.json',JSON.stringify(profile,null,2)+'\n');
console.log('Built coastal homepage with verbatim PDF copy.');
