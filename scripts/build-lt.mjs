import {calendarEvent} from "../events/calendar.js";
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {translateHTML} from '../events/locale-lt.js';
import {eventFacts,eventSlug,hasEventPage,eventSchema} from './event-data.mjs';
process.env.SITE_LANG='lt';
const {listHTML}=await import('../events/events.js');
const out='public',origin='https://cypherbaltics.org';
const events=JSON.parse(await readFile('events/events.json','utf8'));
function localize(html,path){
 html=translateHTML(html).replace('<html lang="en">','<html lang="lt">').replaceAll('en_GB','lt_LT');
 html=html.replace(/(<a[^>]*href=")\/events\//g,'$1/lt/events/').replaceAll('href="/#','href="/lt/#').replaceAll('href="/"','href="/lt/"').replaceAll('href="/contribute/"','href="/contribute/?lang=lt"');
 html=html.replace(/(<link rel="canonical" href=")[^"]*/,`$1${origin+path}`).replace(/(<meta property="og:url" content=")[^"]*/,`$1${origin+path}`);
 html=html.replace(/(src|href)="(?!https?:|mailto:|#|\/)([^"]+)"/g, (_,attr,url)=>`${attr}="${path.includes('/events/') && !path.match(/\/events\/.+/) ? '/events/' : '/'}${url}"`);
 html=html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'');
 return html;
}
await mkdir(out+'/lt/events',{recursive:true});
await writeFile(out+'/lt/index.html',localize(await readFile(out+'/index.html','utf8'),'/lt/'));
let list=localize(await readFile('events/index.html','utf8'),'/lt/events/');
list=list.replace('<div id="event-list"><p>Įkeliami renginiai…</p></div>',`<div id="event-list">${translateHTML(listHTML(events))}</div>`);
await writeFile(out+'/lt/events/index.html',list);
const paths=['/lt/','/lt/events/'];
for(const e of events.filter(hasEventPage)){
 const route='/lt/events/'+eventSlug(e)+'/';
 await writeFile(out+'/events/'+e.id+'-lt.ics',calendarEvent(e,'lt'));
 let html=localize(await readFile(out+'/events/'+eventSlug(e)+'/index.html','utf8'),route);
 const en=eventFacts(e,{lang:'en',defaultCountry:'LT',imageBase:'/events/'}),lt=eventFacts(e,{lang:'lt',defaultCountry:'LT',imageBase:'/events/'});
 const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 for(const key of ['metaDescription','description','title','shortDate','date','checked','countryName'])if(en[key])html=html.replaceAll(escape(en[key]),escape(lt[key]));
 html=html.replaceAll('href="/lt/events/'+e.id+'.ics"','href="/events/'+e.id+'-lt.ics"');
 const own=!e.canonical || e.canonical.startsWith(origin);
 if(own)html=html.replace('</head>',`<script type="application/ld+json">${eventSchema(e,{url:origin+route,origin,lang:'lt',defaultCountry:'LT',imageBase:'/events/',organiser:{name:e.organiser,url:e.website}})}</script></head>`);
 else html=html.replace(`href="${origin+route}"`,`href="${e.canonical.replace('/en/events/','/events/').replace('bitcoinbaltics.com/events/','bitcoinbaltics.com/lt/events/')}"`);
 await mkdir(out+route,{recursive:true});await writeFile(out+route+'index.html',html);if(own)paths.push(route);
}
await writeFile(out+'/sitemap.xml',(await readFile(out+'/sitemap.xml','utf8')).replace('</urlset>',paths.map(p=>`<url><loc>${origin+p}</loc></url>`).join('')+'</urlset>'));
