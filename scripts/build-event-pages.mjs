// One page per dated event at /events/<id>/, sharing the events page header and styles.
// Events first published by Lithuania BTC or Bitcoin Baltics carry a `canonical` URL pointing there;
// only events published here carry Event structured data and appear in the sitemap.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {esc,hasEventPage,eventSlug,eventFacts,eventSchema} from './event-data.mjs';
const origin='https://cypherbaltics.org';
const out=new URL('../public/',import.meta.url);
const events=JSON.parse(readFileSync(new URL('../events/events.json',import.meta.url),'utf8'));
const list=readFileSync(new URL('events/index.html',out),'utf8');
const header=list.match(/<header class="site-header events-header">[\s\S]*?<\/header>/)[0].replaceAll(' aria-current="page"','');
const external=(url,label)=>url?`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`:esc(label);
const own=[];
for(const e of events.filter(hasEventPage)){
 const route=`/events/${eventSlug(e)}/`,canonical=e.canonical||origin+route,mine=canonical===origin+route;
 const f=eventFacts(e,{lang:'en',defaultCountry:'LT',imageBase:'/events/'});
 const title=`${f.title}, ${f.shortDate} · Cypher Baltics`;
 const where=[f.venue&&external(f.venueWebsite,f.venue),f.address&&external(f.mapURL,f.address),f.countryName].filter(Boolean).join(' · ');
 const html=`<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#070b08">
<title>${esc(title)}</title><meta name="description" content="${esc(f.metaDescription)}">
<link rel="canonical" href="${canonical}"><link rel="icon" href="/assets/favicon.svg"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(f.metaDescription)}"><meta property="og:url" content="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="Cypher Baltics"><meta property="og:locale" content="en_GB"><meta property="og:image" content="${origin}/assets/share.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Cypher Baltics, privacy, sovereignty and digital freedom, with a green map of the Baltic countries."><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(f.metaDescription)}"><meta name="twitter:image" content="${origin}/assets/share.png">${mine?`<script type="application/ld+json">${eventSchema(e,{url:canonical,origin,defaultCountry:'LT',imageBase:'/events/',organiser:{name:e.organiser,url:e.website}})}</script>`:''}
<link rel="stylesheet" href="/matrix.css"><link rel="stylesheet" href="/events/events.css"><script defer src="/external-links.js"></script></head>
<body class="event-detail-page"><a class="skip" href="#main">Skip to content</a>${header}
<main id="main" class="wrap event-detail"><p class="eyebrow"><a href="/events/">Events</a> · ${esc(e.type||'event')}</p><h1>${esc(f.title)}</h1><p class="event-detail-when"><time datetime="${f.startDay}">${esc(f.date)}</time>${f.time?` · ${esc(f.time)} (Baltic time)`:''}</p>
<div class="detail-grid${f.image?'':' no-image'}"><div class="event-detail-copy"><p>${where||'Location to be announced'}${e.mapNote?`<br><small>${esc(e.mapNote)}</small>`:''}</p>${f.description?`<p>${esc(f.description)}</p>`:''}<p class="detail-source">${esc(e.organiser||'')}${f.checked?`${e.organiser?' · ':''}Source checked ${esc(f.checked)}`:''}</p></div>${f.image?`<figure><img src="${esc(f.image.src)}" alt="${esc(f.title)}"${f.image.width?` width="${f.image.width}" height="${f.image.height}"`:''} decoding="async"><figcaption class="detail-source">Visual from ${external(f.image.source||f.links[0]?.url,'the organiser')}</figcaption></figure>`:''}</div>
<div class="detail-links">${f.links.map(l=>external(l.url,l.name+' ↗')).join('')}<a href="/events/#${encodeURIComponent(f.id)}">Show on the map</a></div>
<p class="list-note">Dates and venues may change. Check the organiser’s page before travelling.</p></main></body></html>`;
 mkdirSync(new URL('.'+route,out),{recursive:true});
 writeFileSync(new URL('.'+route+'index.html',out),html);
 if(mine)own.push(canonical);
}
const sitemap=new URL('sitemap.xml',out);
writeFileSync(sitemap,readFileSync(sitemap,'utf8').replace('</urlset>',own.map(u=>`<url><loc>${u}</loc></url>`).join('')+'</urlset>'));
console.log(`Built ${events.filter(hasEventPage).length} event pages, ${own.length} published here`);
