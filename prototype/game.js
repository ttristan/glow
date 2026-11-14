const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d');
const $ = s => document.querySelector(s);
const W = 2400, H = 1600;
const key = 'glow-lantern-garden-v1';
let state;
function fresh() {
  const objects = [];
  let seed = 73421;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 145; i++) {
    const x = 60 + rand() * (W - 120), y = 60 + rand() * (H - 120);
    if (Math.hypot(x - 1200, y - 800) < 95) continue;
    objects.push({x, y, type: rand() < .52 ? 'flower' : 'tree', phase: rand() * 7, active: true});
  }
  return {x:1200,y:800,seeds:0,wood:0,level:1,lanterns:[],objects};
}
try { state = JSON.parse(localStorage.getItem(key)) || fresh(); if (!Array.isArray(state.objects) || !Array.isArray(state.lanterns)) state = fresh(); } catch { state = fresh(); }
const save = () => localStorage.setItem(key, JSON.stringify(state));
const keys = new Set();
let toastTimer;
function say(message) { $('#toast').textContent = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').textContent = 'The meadow is yours to explore.', 3500); }
function updateUI() { $('#seeds').textContent = state.seeds; $('#wood').textContent = state.wood; $('#placed').textContent = state.lanterns.length; $('#level').textContent = ['','I','II','III'][state.level]; $('#cost').textContent = state.level >= 3 ? 'Fully grown' : `${state.level * 4} seeds + ${state.level * 4} wood`; }
function gather() {
  const near = state.objects.filter(o => o.active && Math.hypot(o.x-state.x,o.y-state.y) < 62 + state.level*16).sort((a,b) => Math.hypot(a.x-state.x,a.y-state.y)-Math.hypot(b.x-state.x,b.y-state.y))[0];
  if (!near) return say('Nothing close enough to gather. Try a flower or tree.');
  near.active = false;
  if (near.type === 'flower') { state.seeds++; say('A light seed, gathered from the meadow.'); } else { state.wood++; say('A little wood for making something new.'); }
  updateUI(); save();
}
function place() {
  if (state.seeds < 2 || state.wood < 2) return say('A lantern needs 2 light seeds and 2 wood.');
  if (state.lanterns.some(l => Math.hypot(l.x-state.x,l.y-state.y)<35)) return say('Give your lanterns a little room to glow.');
  state.seeds-=2; state.wood-=2; state.lanterns.push({x:state.x,y:state.y}); updateUI(); save(); say('A little light, left behind.');
}
function upgrade() {
  if (state.level>=3) return say('Your gathering glow is fully grown.');
  const cost=state.level*4;
  if(state.seeds<cost || state.wood<cost) return say(`Gather ${cost} seeds and ${cost} wood to grow your reach.`);
  state.seeds-=cost; state.wood-=cost; state.level++; updateUI(); save(); say('Your gathering glow reaches a little farther.');
}
$('#place').onclick=place; $('#upgrade').onclick=upgrade;
$('#reset').onclick=()=>{if(confirm('Start a new meadow? Your current garden will be lost.')) {state=fresh();updateUI();save();say('A fresh meadow awaits.');}};
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault(); if(e.repeat) return; keys.add(e.key.toLowerCase()); if(e.code==='Space') gather(); if(e.key.toLowerCase()==='l') place();});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();save();});
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function draw(t) {
  const camX=Math.max(0,Math.min(W-canvas.width,state.x-canvas.width/2)), camY=Math.max(0,Math.min(H-canvas.height,state.y-canvas.height/2));
  ctx.fillStyle='#526c45';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(-camX,-camY);
  // Stable meadow texture gives the world detail without assets.
  for(let i=0;i<850;i++){const x=(i*193+71)%W,y=(i*397+53)%H;ctx.fillStyle=i%3?'#6b815066':'#354e3966';ctx.fillRect(x,y,2+(i%3),2);if(i%5===0){ctx.strokeStyle='#a0af7060';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+3,y-6);ctx.stroke();}}
  for(let i=0;i<18;i++){const x=(i*421+133)%W,y=(i*613+99)%H;ctx.fillStyle='#74875630';ctx.beginPath();ctx.ellipse(x,y,95,45,-.3,0,7);ctx.fill();}
  const things=[...state.objects.filter(o=>o.active),...state.lanterns.map(l=>({...l,type:'lantern'})),{x:state.x,y:state.y,type:'player'}].sort((a,b)=>a.y-b.y);
  for(const o of things){const {x,y}=o; if(o.type==='flower'){
    const glow=ctx.createRadialGradient(x,y-8,1,x,y-8,25);glow.addColorStop(0,'#f0f4a999');glow.addColorStop(1,'#e0ef9d00');ctx.fillStyle=glow;ctx.fillRect(x-25,y-33,50,50);ctx.strokeStyle='#b6cb83';ctx.beginPath();ctx.moveTo(x,y+5);ctx.lineTo(x,y-7);ctx.stroke();for(let a=0;a<5;a++)circle(x+Math.cos(a*1.257)*5,y-9+Math.sin(a*1.257)*5,3,'#eef1bb');circle(x,y-9,3,'#f9df89');
  }else if(o.type==='tree'){
    ctx.fillStyle='#273c2b55';ctx.beginPath();ctx.ellipse(x+4,y+5,24,9,0,0,7);ctx.fill();ctx.fillStyle='#725943';ctx.fillRect(x-4,y-18,8,20);circle(x,y-27,22,'#344f37');circle(x-12,y-29,15,'#405f3d');circle(x+11,y-32,16,'#496b42');circle(x-2,y-41,15,'#52754a');
  }else if(o.type==='lantern'){
    const g=ctx.createRadialGradient(x,y-12,2,x,y-12,70);g.addColorStop(0,'#ffe79e99');g.addColorStop(1,'#ffebad00');ctx.fillStyle=g;ctx.fillRect(x-70,y-82,140,140);ctx.fillStyle='#5b4734';ctx.fillRect(x-2,y-19,4,21);ctx.fillStyle='#f7d580';ctx.fillRect(x-7,y-29,14,12);ctx.strokeStyle='#5b4734';ctx.strokeRect(x-7,y-29,14,12);circle(x,y-34,3,'#e8d18d');
  }else {ctx.fillStyle='#263d2f77';ctx.beginPath();ctx.ellipse(x,y+8,13,5,0,0,7);ctx.fill();ctx.fillStyle='#d4c4a1';ctx.fillRect(x-5,y-19,10,11);circle(x,y-24,7,'#e2c7a0');ctx.fillStyle='#e8e0c7';ctx.beginPath();ctx.moveTo(x,y-23);ctx.lineTo(x-13,y+4);ctx.lineTo(x+13,y+4);ctx.closePath();ctx.fill();ctx.fillStyle='#ac7655';ctx.beginPath();ctx.ellipse(x,y-27,9,4,0,0,7);ctx.fill();circle(x+9,y-2,3,'#f4d893');}}
  ctx.restore();
}
let last=0, saveAt=0;
function frame(t){const dt=Math.min((t-last)/1000,.05);last=t;let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(dx||dy){const n=Math.hypot(dx,dy);state.x=Math.max(15,Math.min(W-15,state.x+dx/n*160*dt));state.y=Math.max(15,Math.min(H-15,state.y+dy/n*160*dt));if(t-saveAt>1000){save();saveAt=t;}}draw(t);requestAnimationFrame(frame);}
updateUI();requestAnimationFrame(frame);
