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
let events=[], period='upcoming', selectedDay='', month=new Date(), map, markers=[];
month=new Date(month.getFullYear(),month.getMonth(),1);
const filtered = () => events.filter(e=>(!$('#topic').value||e.topics.includes($('#topic').value))&&(!$('#country').value||e.country===$('#country').value));
function visible() { return filtered().filter(e=>selectedDay ? eventOnDay(e,selectedDay) : period==='past'?isPast(e):!isPast(e)).sort((a,b)=>period==='past'?new Date(b.start)-new Date(a.start):(new Date(a.start||'9999-01-01')-new Date(b.start||'9999-01-01'))); }
function renderCalendar() {
 $('#month-name').textContent=month.toLocaleDateString('en-GB',{month:'long',year:'numeric'});
 const first=(month.getDay()+6)%7, days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 $('#calendar-days').replaceChildren();
 for(let i=0;i<first;i++)$('#calendar-days').append(document.createElement('span'));
 for(let d=1;d<=days;d++){
  const key=`${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const matches=filtered().filter(e=>eventOnDay(e,key)), button=document.createElement('button');
  button.className='day'+(matches.length?' has-events':'');button.textContent=d;button.disabled=!matches.length;
  button.setAttribute('aria-label',`${key}, ${matches.length} events`);button.setAttribute('aria-pressed',key===selectedDay);
  button.onclick=()=>{selectedDay=key;render();};$('#calendar-days').append(button);
 }
 $('#clear-date').hidden=!selectedDay;
}
function render(){
 renderCalendar();
 document.querySelectorAll('[data-period]').forEach(b=>b.setAttribute('aria-pressed',!selectedDay&&b.dataset.period===period));
 const list=visible();$('#result-count').textContent=`${list.length} ${list.length===1?'event':'events'}${selectedDay?' · '+selectedDay:''}`;
 $('#event-list').innerHTML=list.length?list.map(e=>`<button class="event-row" data-event="${esc(e.id)}"><span class="meta">${esc(dateText(e))} · ${esc(e.country)}<br>${esc(e.type)} · ${esc(e.organiser)}</span><strong>${esc(e.title.en)}</strong><span class="venue">${esc(e.venue||'Venue to be announced')}${e.locationPrecision==='city'?' · City location':''}</span></button>`).join(''):'<p>No announced events for this selection. <a href="mailto:contact@cypherbaltics.org">Suggest one</a> or browse past events.</p>';
 $('#event-list').querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>openEvent(b.dataset.event));renderMarkers(list);
}
function renderMarkers(list){
 if(!map)return;markers.forEach(m=>m.remove());markers=[];
 const groups=new Map();for(const e of list){if(!Number.isFinite(e.lat)||!Number.isFinite(e.lon))continue;const key=`${e.lon},${e.lat}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);}
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
 if(map&&Number.isFinite(e.lat))map.flyTo({center:[e.lon,e.lat],zoom:e.locationPrecision==='city'?10:13,essential:false});
 history.replaceState(null,'',`#${encodeURIComponent(id)}`);
}
function setupMap(){
 try{
  map=new maplibregl.Map({container:'map',style:'map-style.json',center:[24.8,56.9],zoom:5.2,attributionControl:true});
  map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
  map.on('load',()=>{$('#map-status').hidden=true;renderMarkers(visible());});map.on('error',()=>{$('#map-status').hidden=false;});
  $('#reset-map').onclick=()=>map.fitBounds([[20.7,53.8],[28.3,59.9]],{padding:40});
 }catch{$('#map-status').hidden=false;}
}
async function init(){
 $('#close-dialog').onclick=()=>$('#event-dialog').close();$('#event-dialog').addEventListener('close',()=>history.replaceState(null,'',location.pathname));
 $('#event-dialog').addEventListener('click',e=>{if(e.target===$('#event-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
 for(const id of ['topic','country'])$('#'+id).onchange=()=>{selectedDay='';const dated=visible().find(e=>e.start);if(dated){const d=new Date(dated.start);month=new Date(d.getFullYear(),d.getMonth(),1);}if(map)map.fitBounds([[20.7,53.8],[28.3,59.9]],{padding:40});render();};
 for(const [id,step] of [['previous-month',-1],['next-month',1]])$('#'+id).onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()+step,1);renderCalendar();};
 $('#clear-date').onclick=()=>{selectedDay='';render();};document.querySelectorAll('[data-period]').forEach(b=>b.onclick=()=>{period=b.dataset.period;selectedDay='';if(period==='past'){const latest=filtered().filter(e=>isPast(e)).sort((a,b)=>new Date(b.start)-new Date(a.start))[0];if(latest){const d=new Date(latest.start);month=new Date(d.getFullYear(),d.getMonth(),1);}}else month=new Date(new Date().getFullYear(),new Date().getMonth(),1);render();});
 try{const response=await fetch('events.json');if(!response.ok)throw Error('Events unavailable');events=await response.json();render();setupMap();if(location.hash)openEvent(decodeURIComponent(location.hash.slice(1)));}catch{$('#event-list').innerHTML='<p>Events could not load. Please reload or <a href="mailto:contact@cypherbaltics.org">contact us</a>.</p>';}
}
if(typeof document!=='undefined')init();
