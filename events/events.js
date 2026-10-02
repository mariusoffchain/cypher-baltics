const $ = s => document.querySelector(s);
const zone = 'Europe/Vilnius';
export const dayKey = value => new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
export function eventOnDay(event, day) { return !!event.start && dayKey(event.start) <= day && dayKey(event.end || event.start) >= day; }
export function isPast(event, now = Date.now()) { return !!event.start && new Date(event.end || event.start).getTime() < now; }
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeLink = value => {try {const url=new URL(value);return ['https:','http:'].includes(url.protocol) ? esc(url.href) : '#';} catch{return '#';}};
const dateText = event => {
 if (!event.start) return 'Date to be announced';
 const fmt = new Intl.DateTimeFormat('en-GB',{timeZone:zone,day:'numeric',month:'short',year:'numeric'});
 let text=fmt.format(new Date(event.start));
 if(event.end && dayKey(event.end)!==dayKey(event.start))text+=' – '+fmt.format(new Date(event.end));
 if(!event.dateOnly)text+=' · '+new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit'}).format(new Date(event.start))+' (Baltic time)';
 return text;
};
let events=[], map, markers=[];
function eventRow(e) {
 const date=e.start?`<strong>${esc(new Intl.DateTimeFormat('en-GB',{timeZone:zone,day:'2-digit'}).format(new Date(e.start)))}</strong><span>${esc(new Intl.DateTimeFormat('en-GB',{timeZone:zone,month:'short'}).format(new Date(e.start)))}</span>`:'<svg viewBox="0 0 24 24" width="26" height="30" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 3h14M5 21h14M7 3v4c0 3 5 5 5 5s5-2 5-5V3M7 21v-4c0-3 5-5 5-5s5 2 5 5v4"/></svg>';
 const location=[e.country,e.venue].filter(Boolean).join(' · ');
 return `<button class="event-row" data-event="${esc(e.id)}"><span class="date-badge" aria-hidden="true">${date}</span><span class="event-copy"><strong>${esc(e.title.en)}</strong><span class="meta">${esc(dateText(e))}</span><span class="venue">${esc(location||'Venue to be announced')}${e.locationPrecision==='city'?' · City location':''}</span></span></button>`;
}
function render(){
 const upcoming=events.filter(e=>!isPast(e)).sort((a,b)=>new Date(a.start||'9999-01-01')-new Date(b.start||'9999-01-01'));
 const past=events.filter(e=>isPast(e)).sort((a,b)=>new Date(b.start)-new Date(a.start));
 $('#event-list').innerHTML=`<section aria-labelledby="upcoming-heading"><h2 class="list-heading" id="upcoming-heading">Upcoming events</h2>${upcoming.length?upcoming.map(eventRow).join(''):'<p>No upcoming events announced yet.</p>'}</section>${past.length?`<section aria-labelledby="past-heading"><h2 class="list-heading" id="past-heading">Past events</h2>${past.map(eventRow).join('')}</section>`:''}`;
 $('#event-list').querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>openEvent(b.dataset.event));renderMarkers(events);
}
function renderMarkers(list){
 if(!map)return;markers.forEach(m=>m.remove());markers=[];
 const groups=new Map();for(const e of list){if(isPast(e))continue;if(!Number.isFinite(e.lat)||!Number.isFinite(e.lon))continue;const key=`${e.lon},${e.lat}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);}
 for(const group of groups.values()){
  const e=group[0], el=document.createElement('button');el.className='event-marker';el.textContent=group.length>1?group.length:'•';el.setAttribute('aria-label',group.map(x=>x.title.en).join(', '));
  el.onclick=()=>{if(group.length===1)openEvent(e.id);else{const box=document.createElement('div');for(const item of group){const b=document.createElement('button');b.textContent=item.title.en;b.className='popup-event';b.onclick=()=>{popup.remove();openEvent(item.id);};box.append(b);}const popup=new maplibregl.Popup().setLngLat([e.lon,e.lat]).setDOMContent(box).addTo(map);}};
  markers.push(new maplibregl.Marker({element:el}).setLngLat([e.lon,e.lat]).addTo(map));
 }
}
function openEvent(id){
 const e=events.find(e=>e.id===id);if(!e)return;
 $('#event-detail').innerHTML=`<p class="eyebrow">${e.start?(isPast(e)?'Past event':'Upcoming event'):'In preparation'} · ${esc(e.type)}</p><h2 id="detail-title">${esc(e.title.en)}</h2><div class="detail-grid"><div class="event-detail-copy"><p>${esc(dateText(e))}</p><p>${esc(e.address||e.venue||'Location to be announced')}${e.mapNote?'<br><small>'+esc(e.mapNote)+'</small>':''}</p><p>${esc(e.description.en)}</p><p class="detail-source">${esc(e.organiser)}${e.sourceVerifiedAt?' · Source checked '+esc(e.sourceVerifiedAt):''}</p></div>${e.image?`<div><img src="${esc(e.image.src)}" alt="${esc(e.title.en)}" loading="lazy"><p class="detail-source">Visual from <a href="${safeLink(e.image.source||e.url)}" target="_blank" rel="noopener">the organiser</a></p></div>`:''}</div><div class="detail-links"><a href="${safeLink(e.website||e.url)}" target="_blank" rel="noopener">Event / organiser website ↗</a>${e.sources?.[0]?`<a href="${safeLink(e.sources[0])}" target="_blank" rel="noopener">Source ↗</a>`:''}</div>`;
 if(!$('#event-dialog').open)$('#event-dialog').showModal();
 if(map&&!isPast(e)&&Number.isFinite(e.lat))map.flyTo({center:[e.lon,e.lat],zoom:e.locationPrecision==='city'?10:13,essential:false});
 history.replaceState(null,'',`#${encodeURIComponent(id)}`);
}
function setupMap(){
 try{
  map=new maplibregl.Map({container:'map',style:'map-style.json',center:[24.8,56.9],zoom:5.2,attributionControl:true});
  map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
  map.on('load',()=>{$('#map-status').hidden=true;renderMarkers(events);});map.on('error',()=>{$('#map-status').hidden=false;});
  $('#reset-map').onclick=()=>map.fitBounds([[20.7,53.8],[28.3,59.9]],{padding:40});
 }catch{$('#map-status').hidden=false;}
}
async function init(){
 $('#close-dialog').onclick=()=>$('#event-dialog').close();$('#event-dialog').addEventListener('close',()=>history.replaceState(null,'',location.pathname));
 $('#event-dialog').addEventListener('click',e=>{if(e.target===$('#event-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
 try{const response=await fetch('events.json');if(!response.ok)throw Error('Events unavailable');events=await response.json();render();setupMap();if(location.hash)openEvent(decodeURIComponent(location.hash.slice(1)));}catch{$('#event-list').innerHTML='<p>Events could not load. Please reload or <a href="mailto:contact@cypherbaltics.org">contact us</a>.</p>';}
}
if(typeof document!=='undefined')init();
