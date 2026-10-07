import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import worker from '../worker.mjs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const root=new URL('../public/',import.meta.url);
test('All local HTML links and assets resolve; anchors exist',()=>{
 for(const [,url] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  if(/^(https?:|mailto:)/.test(url))continue;
  if(url.startsWith('#')){if(url!=='#')assert.ok(html.includes(`id="${url.slice(1)}"`),url);continue;}
  assert.ok(existsSync(new URL(url.replace(/^\//,''),root)),url);
 }
});
test('Sharing image is a genuine 1200x630 PNG',()=>{
 const png=readFileSync(new URL('assets/share.png',root));
 assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
});
test('Production excludes prototypes and includes the approved initiatives',()=>{
 assert.ok(!html.includes('Design studies'));assert.ok(html.includes('href="https://cryptobaltics.org/"'));
 assert.ok(!readdirSync(root).includes('identity'));assert.equal((html.match(/<h1>/g)||[]).length,1);
 assert.ok(html.indexOf('id="proof"')<html.indexOf('id="initiatives"'));
});
test('Metadata and crawler files target the correct canonical domain',()=>{
 assert.ok(html.includes('rel="canonical" href="https://cypherbaltics.org/"'));
 for(const path of ['robots.txt','sitemap.xml','llms.txt','llms-full.txt'])assert.ok(readFileSync(new URL(path,root),'utf8').includes('https://cypherbaltics.org/'));
});
test('Structured data describes the organisation and website',()=>{
 const graph=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])['@graph'];
 assert.deepEqual(graph.map(n=>n['@type']),['Organization','WebSite']);
 for(const node of graph)assert.equal(node.url,'https://cypherbaltics.org/');
 assert.ok(existsSync(new URL(graph[0].logo.replace('https://cypherbaltics.org/',''),root)));
});
for(const host of ['www.cypherbaltics.org','cypherbaltics.com','www.cypherbaltics.com']){
 test(`${host} redirects preserving path and query`,async()=>{
  const r=await worker.fetch(new Request(`https://${host}/example/?lang=en`),{});
  assert.equal(r.status,301);assert.equal(r.headers.get('location'),'https://cypherbaltics.org/example/?lang=en');
 });
}
test('Canonical requests preserve asset status and add security headers',async()=>{
 const r=await worker.fetch(new Request('https://cypherbaltics.org/missing'),{ASSETS:{fetch:async()=>new Response('Not found',{status:404,headers:{'Content-Type':'text/html'}})}});
 assert.equal(r.status,404);assert.equal(await r.text(),'Not found');assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.ok(r.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
});

 test('HTTP canonical redirects to HTTPS', async () => {
 const {default: worker} = await import('../worker.mjs');
 const response = await worker.fetch(new Request('http://cypherbaltics.org/?check=1'), {});
 assert.equal(response.status, 301);
 assert.equal(response.headers.get('Location'), 'https://cypherbaltics.org/?check=1');
 });

const eventData=JSON.parse(readFileSync(new URL('events/events.json',root),'utf8'));
test('Events selection excludes Solana and merchants, includes BSides without invented dates',()=>{
 assert.ok(eventData.length>8);
 assert.ok(!eventData.some(e=>JSON.stringify(e).toLowerCase().includes('solana')));
 const next=eventData.find(e=>e.id==='bsides-vilnius-2027');assert.ok(next);assert.equal(next.start,undefined);assert.equal(next.locationPrecision,'city');
 for(const e of eventData){assert.ok(e.title.en);assert.ok(e.url);assert.ok(e.topics.length);if(e.image)assert.ok(existsSync(new URL('events/'+e.image.src,root)));}
});
test('Calendar uses Baltic dates and includes the last day of a multi-day event',async()=>{
 const {eventOnDay,isPast,dayKey}=await import('../events/events.js');
 assert.equal(dayKey('2026-06-03T22:30:00Z'),'2026-06-04');
 const e={start:'2026-06-03T00:00:00+03:00',end:'2026-06-04T23:59:59+03:00'};
 assert.ok(eventOnDay(e,'2026-06-04'));assert.ok(!eventOnDay(e,'2026-06-05'));
 assert.ok(isPast(e,new Date('2026-10-02').getTime()));assert.ok(!isPast({status:'planned'}));
});
test('Map CSP permits only the needed tile service and keeps homepage policy strict',async()=>{
 const env={ASSETS:{fetch:async()=>new Response('ok')}};
 const map=await worker.fetch(new Request('https://cypherbaltics.org/events/'),env);
 const home=await worker.fetch(new Request('https://cypherbaltics.org/'),env);
 assert.ok(map.headers.get('content-security-policy').includes('https://tiles.openfreemap.org'));
 assert.ok(!home.headers.get('content-security-policy').includes('unsafe-inline'));
 assert.ok(!readFileSync(new URL('events/events.js',root),'utf8').includes('btcmap.org'));
});
test('Events page lists every event before JavaScript and describes itself for search and sharing',()=>{
 const page=readFileSync(new URL('events/index.html',root),'utf8');
 assert.equal((page.match(/class="event-row"/g)||[]).length,eventData.length);
 assert.ok(!page.includes('Loading events'));
 const data=JSON.parse(page.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
 assert.equal(data['@type'],'CollectionPage');assert.equal(data.url,'https://cypherbaltics.org/events/');
 assert.match(page,/twitter:image" content="https:\/\/cypherbaltics.org\/assets\/share.png"/);
});

