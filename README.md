# Cypher Baltics

Website for [cypherbaltics.org](https://cypherbaltics.org), an initiative around privacy, individual sovereignty and free technology in the Baltic countries.

## Development

Requires Node.js 22 or later and Python 3. Wrangler is pinned in package-lock.json.

```sh
npm ci
npm run build
npm test
npm run dev
```

Open http://127.0.0.1:8782. The explicit localhost upstream keeps production HTTPS redirects out of local development. Rebuild after editing content or assets.

- `identity/matrix.template.html` contains the page content and metadata.
- `identity/matrix.css` and `identity/matrix.js` contain layout and decorative Matrix animation.
- `identity/assets/` contains the production logos, fonts and sharing images.
- `scripts/build.py` generates `public/`, including robots.txt, sitemap.xml, llms.txt, llms-full.txt and a 404 page.
- `scripts/prerender-events.mjs` then writes the event list into `public/events/index.html`, using the same `listHTML` as `events/events.js`, so crawlers and visitors without JavaScript can read it.
- `scripts/build-event-pages.mjs` writes one page per dated event at `/events/<id>/` and adds the events published here to the sitemap. An event copied from Lithuania BTC or Bitcoin Baltics has a `canonical` field in `events/events.json` pointing to its page there; such pages carry no Event JSON-LD. `scripts/event-data.mjs` is the same file in all four Baltic site repositories.
- `worker.mjs` serves assets, security headers and canonical redirects.
- `scripts/release.test.mjs` checks asset links, metadata, sharing image and redirects.

## Deployment

The deployment config targets Marius's Cloudflare account, Worker `cypher-baltics`, with the existing `lithuania-btc` authentication profile. Credentials are not included. Forks must change the account, domain routes, canonical metadata and profile before deploying to their own account.

```sh
npm test
npx wrangler deploy --dry-run
npm run deploy
```

Canonical domain is https://cypherbaltics.org/. Both www hostnames and cypherbaltics.com permanently redirect to it, preserving paths and queries. HTTP redirects to HTTPS. Keep Proton email DNS records unchanged when managing web domains.

## Design and privacy

The mobile header contains the logo and an accessible email link. Desktop retains section navigation. Matrix animation respects system reduced-motion settings and pauses while the document is hidden. It only renders visible scenes, at approximately 20 frames per second with capped canvas resolution. No motion preference is stored, no analytics scripts or remote fonts are loaded, and email contact uses mailto. Cloudflare operational logs/traces use 10% sampling.

`identity/share-design.html` is the 1200 × 630 sharing-image source. `identity/icon-design.html` is the icon source. Render them in a browser and export PNG images; the generated images are committed so normal builds need no capture tool.

## License and attribution

Original website code is MIT licensed; see LICENSE. Fonts remain under their bundled licenses. Partner logos, geographic artwork, names, branding and editorial content retain their respective rights and are not relicensed by the code license. Reusing the code does not imply endorsement by Cypher Baltics or its featured communities.

IBM Plex, Righteous and JetBrains Mono are bundled locally with their OFL notices. The PROOF wordmark uses Righteous and JetBrains Mono. Baltic map geometry and related project logos were reused from Marius's existing sites.

## Checks

Automated tests cover local references, sharing PNG dimensions, canonical metadata, exclusion of prototypes and redirect behavior. Layout checked at 320–1440 px. No Lighthouse score or physical-device testing is claimed. Google Search Console is managed separately by the site owner.

## Events map

`/events/` is a separate events-only map and list in the Cypher identity, using the same MapLibre/OpenFreeMap foundation as the community maps. No BTC Map API, merchant snapshot or merchant controls are included.

Edit `events/events.json` to curate the list. Initial selection comes from the community sites plus BSides Vilnius, explicitly requested by Marius. Solana is excluded from this page. Keep source URLs and verification dates. A listing does not imply formal partnership. Mark unknown dates as `status: planned` with no `start`; use `locationPrecision: city` and `mapNote` for approximate city markers. Never reuse a previous edition's venue for an unannounced edition. Topics support Bitcoin, Privacy, Cybersecurity and Open technology. Event dates use Europe/Vilnius time and support multi-day events. Upcoming and past events appear together in separate list sections, with a date badge on the left. No calendar or category dropdowns.

Assets, original image attribution and MapLibre's BSD license are retained in `events/`. The builder copies this self-contained directory to `public/events/`, adds the URL to sitemap/llms and links it from the homepage. No sibling repository is required to rebuild. Data is manually curated; updates in the other sites are not automatically imported. Run `npm test`, `npm run dev`, then `npm run deploy` with the existing Cloudflare profile. The Worker permits OpenFreeMap tile requests and MapLibre blob workers only on `/events/`; the homepage policy stays unchanged. Tiles are third-party requests, documented on the map and in the site's privacy note.
