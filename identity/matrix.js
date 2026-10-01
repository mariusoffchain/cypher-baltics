(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const glyphs = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/{}[]+=:アカサタナハマヤラワ';
  let paused = reduced.matches, frame = 0, last = 0, elapsed = 0;
  const scenes = [...document.querySelectorAll('.code-rain')].map(canvas => ({canvas, ctx:canvas.getContext('2d'), visible:false, columns:[], w:0, h:0})).filter(s=>s.ctx);
  function draw(scene, dt) {
    const {ctx,w,h,columns} = scene;
    ctx.clearRect(0,0,w,h);ctx.font='12px PlexMono, monospace';
    for(const c of columns){
      c.y+=c.speed*dt;if(c.y-c.len*18>h)c.y=-18;
      for(let j=0;j<c.len;j++){
        const y=c.y-j*18;if(y<0||y>h)continue;
        ctx.fillStyle=j===0?'rgba(178,255,201,.75)':`rgba(70,224,115,${.4*(1-j/c.len)})`;
        ctx.fillText(glyphs[(c.seed+j*7+Math.floor(elapsed*2))%glyphs.length],c.x,y);
      }
    }
  }
  function resize(scene){
    const box=scene.canvas.getBoundingClientRect();
    if(scene.w===box.width&&scene.h===box.height)return;
    scene.w=box.width;scene.h=box.height;
    const scale=Math.min(devicePixelRatio||1,1.5);
    scene.canvas.width=Math.round(box.width*scale);scene.canvas.height=Math.round(box.height*scale);
    scene.ctx.setTransform(scale,0,0,scale,0,0);
    const step=scene.canvas.dataset.density==='sparse'?32:23;
    scene.columns=Array.from({length:Math.ceil(box.width/step)},(_,i)=>({x:i*step,y:Math.random()*box.height,speed:22+Math.random()*25,len:6+Math.floor(Math.random()*12),seed:i*13}));
    draw(scene,0);
  }
  function tick(now){
    if(paused||document.hidden||!scenes.some(s=>s.visible)){frame=0;return;}
    if(now-last>=50){const dt=Math.min((now-last)/1000,.12);elapsed+=dt;for(const s of scenes)if(s.visible)draw(s,dt);last=now;}
    frame=requestAnimationFrame(tick);
  }
  function sync(){
    cancelAnimationFrame(frame);frame=0;last=performance.now();
    document.body.classList.toggle('paused',paused);
    if(!paused&&!document.hidden&&scenes.some(s=>s.visible))frame=requestAnimationFrame(tick);
  }
  if (!scenes.length) return;
  const observer=new IntersectionObserver(entries=>{for(const e of entries){const s=scenes.find(s=>s.canvas===e.target);if(s)s.visible=e.isIntersecting;}sync();});
  const resizer=new ResizeObserver(entries=>{for(const e of entries){const s=scenes.find(s=>s.canvas.parentElement===e.target);if(s)resize(s);}});
  for(const scene of scenes){resize(scene);observer.observe(scene.canvas);resizer.observe(scene.canvas.parentElement);}
  reduced.addEventListener('change',()=>{paused=reduced.matches;sync();});
  document.addEventListener('visibilitychange',sync);sync();
})();
