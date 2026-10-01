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
  assert.ok(existsSync(new URL(url,root)),url);
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
