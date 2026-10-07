// Write the event list into the built page so crawlers and visitors without JavaScript can read it.
// events.js renders the same markup again once it has loaded.
import {readFileSync,writeFileSync} from 'node:fs';
import {listHTML} from '../events/events.js';
const page=new URL('../public/events/index.html',import.meta.url);
const events=JSON.parse(readFileSync(new URL('../events/events.json',import.meta.url),'utf8'));
const placeholder='<div id="event-list"><p>Loading events…</p></div>';
const html=readFileSync(page,'utf8');
if(!html.includes(placeholder))throw Error('Event list placeholder not found');
writeFileSync(page,html.replace(placeholder,`<div id="event-list">${listHTML(events)}</div>`));
console.log(`Prerendered ${events.length} events`);
