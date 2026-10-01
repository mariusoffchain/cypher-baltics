from pathlib import Path
import shutil, re, json
root=Path(__file__).resolve().parents[1]
source=root/'identity'
out=root/'public'
(out/'assets').mkdir(parents=True,exist_ok=True)
html=(source/'matrix.template.html').read_text()
(source/'matrix.html').write_text(html)
(out/'index.html').write_text(html)
for name in ['matrix.css','matrix.js']:
    shutil.copy2(source/name,out/name)
assets=['PlexSans.woff2','PlexMono.woff2','righteous-latin.woff2','jetbrainsmono-latin.woff2','cypher-map-borders.svg','lithuania-btc.png','bitcoin-baltics.svg','favicon.svg','favicon.png','apple-touch-icon.png','share.png','IBM-Plex-OFL.txt','Righteous-OFL.txt','JetBrainsMono-OFL.txt']
for name in assets:
    if (source/'assets'/name).exists(): shutil.copy2(source/'assets'/name,out/'assets'/name)
(out/'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: https://cypherbaltics.org/sitemap.xml\n')
(out/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://cypherbaltics.org/</loc></url></urlset>\n')
(out/'llms.txt').write_text('''# Cypher Baltics

> A Baltic initiative around privacy, individual sovereignty and free technology.

Cypher Baltics is maintained by Marius Off-Chain. It does not claim registered nonprofit status.

## Pages and resources
- [Approach](https://cypherbaltics.org/#approach): Privacy, encryption, free software, open technology and monetary sovereignty.
- [PROOF](https://cypherbaltics.org/#proof): The privacy and sovereignty conference in Vilnius that informs the initiative.
- [Communities](https://cypherbaltics.org/#initiatives): Lithuania BTC, an autonomous local community, and Bitcoin Baltics, a regional initiative.
- [Full text](https://cypherbaltics.org/llms-full.txt): Readable text of the current site.
- [Contact](mailto:contact@cypherbaltics.org)

## Related sites
- [PROOF conference](https://proofconference.com/)
- [Lithuania BTC](https://lithuaniabtc.com/)
- [Bitcoin Baltics](https://bitcoinbaltics.com/)

Existing community sites are available. Future workshops and collaborations are intentions, not a published event schedule.
''')
from html.parser import HTMLParser
class Text(HTMLParser):
    def __init__(self):super().__init__();self.parts=[];self.skip=0
    def handle_starttag(self,tag,attrs):
        if tag in ('head','script','style'):self.skip+=1
        if tag in ('p','h1','h2','h3','section','article'):self.parts.append('\n')
    def handle_endtag(self,tag):
        if tag in ('head','script','style'):self.skip-=1
        if tag in ('p','h1','h2','h3','section','article'):self.parts.append('\n')
    def handle_data(self,data):
        if not self.skip:self.parts.append(data.strip()+' ')
p=Text();p.feed(html)
(out/'llms-full.txt').write_text('# Cypher Baltics\nSource: https://cypherbaltics.org/\n\n'+re.sub(r'\n\s*\n+', '\n\n',''.join(p.parts)).strip()+'\n')
(out/'404.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found — Cypher Baltics</title><link rel="stylesheet" href="/matrix.css"><main class="wrap section"><p class="eyebrow">404 / Cypher Baltics</p><h1>Page not found.</h1><p>This address does not match a page on this site.</p><a class="primary" href="/">Return to Cypher Baltics ↗</a></main></html>''')
print(f'Built {out}')
