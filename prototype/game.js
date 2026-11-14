const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d');
const world = { width: 1920, height: 1200 };
const player = { x: 480, y: 330, fiber: 0, stone: 0, lights: 0, reach: 58, upgraded: false };
const keys = new Set();
const things = [];
const beacons = [];
let seed = 7431;
function random() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
for (let i = 0; i < 180; i++) {
  const x = 35 + random() * (world.width - 70), y = 35 + random() * (world.height - 70);
  if (Math.hypot(x - player.x, y - player.y) < 75) continue;
  const roll = random();
  things.push({ x, y, type: roll < .27 ? 'stone' : roll < .63 ? 'flower' : roll < .82 ? 'bush' : 'grass', variation: random() });
}
// A few inviting resources within reach make the first interaction easy to discover.
things.push({ x: 450, y: 365, type: 'flower', variation: .3 }, { x: 530, y: 350, type: 'stone', variation: .4 });
function ellipse(x, y, rx, ry, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
function drawThing(t) {
  const {x,y,type,variation:v} = t;
  if (type === 'stone') { ellipse(x + 2,y + 6,17,6,'#617c5a55'); ellipse(x,y,15,10,'#b5b9a0'); ellipse(x-3,y-3,9,5,'#c9cbb3'); }
  if (type === 'grass') { ctx.strokeStyle='#789e6f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+5);ctx.quadraticCurveTo(x-5,y-4,x-8,y-5);ctx.moveTo(x,y+5);ctx.quadraticCurveTo(x+1,y-5,x+5,y-9);ctx.stroke(); }
  if (type === 'bush') { ellipse(x,y+8,20,7,'#64845b55');ellipse(x,y,19,13,'#779e6c');ellipse(x-8,y-5,11,9,'#88ad79');ellipse(x+7,y-7,12,10,'#94b982');ellipse(x+3,y-11,5,3,'#a9c993'); }
  if (type === 'flower') { ctx.strokeStyle='#6f9767';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+7);ctx.lineTo(x,y-4);ctx.stroke();const c=v>.5?'#f4daa4':'#f7ebca';for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(x+Math.cos(a)*4,y-5+Math.sin(a)*4,3,3,c)}ellipse(x,y-5,2,2,'#d9b86c'); }
}
function render() {
  const cameraX = Math.max(0, Math.min(world.width - canvas.width, player.x - canvas.width / 2));
  const cameraY = Math.max(0, Math.min(world.height - canvas.height, player.y - canvas.height / 2));
  ctx.fillStyle='#a9c58d';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(-cameraX,-cameraY);
  // Broad patches give the meadow a soft, hand-painted texture.
  for(let y=0;y<world.height;y+=100) for(let x=0;x<world.width;x+=130) ellipse(x+55,y+35,78,38,(Math.floor(x/130+y/100)%3===0)?'#b5ce9a55':'#9fbd8450');
  ctx.strokeStyle='#d8d8aa';ctx.lineWidth=82;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-60,660);ctx.bezierCurveTo(220,610,250,475,480,460);ctx.bezierCurveTo(760,435,770,260,1080,280);ctx.bezierCurveTo(1380,300,1480,170,2000,210);ctx.stroke();
  ctx.strokeStyle='#e1dfb8';ctx.lineWidth=52;ctx.stroke();
  things.forEach(drawThing);
  for(const b of beacons){ellipse(b.x,b.y,42,25,'#f8ecaa55');ellipse(b.x,b.y+8,12,5,'#607d5c66');ctx.fillStyle='#8d7852';ctx.fillRect(b.x-2,b.y-16,4,23);ellipse(b.x,b.y-20,9,11,'#f6d888');ellipse(b.x,b.y-22,5,7,'#fff3b8');}
  ellipse(player.x,player.y+12,16,7,'#54735166');ellipse(player.x,player.y+2,12,14,'#d9a574');ellipse(player.x,player.y-9,10,10,'#f0c39d');ellipse(player.x,player.y-15,11,6,'#765e4d');ctx.fillStyle='#f5e9ce';ctx.fillRect(player.x-10,player.y+1,20,9);
  ctx.restore();
}
function updateUI() { for(const id of ['fiber','stone','lights']) document.querySelector('#'+id).textContent=player[id];document.querySelector('#beacon').disabled=player.fiber<3||player.stone<2;document.querySelector('#upgrade').disabled=player.upgraded||player.fiber<4||player.stone<3;if(player.upgraded){document.querySelector('#upgrade-title').textContent='Wider reach unlocked';document.querySelector('#upgrade-copy').textContent='Your gathering reach has grown';} }
let toastTimer;
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.style.opacity='1';clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.style.opacity='.72',3500);}
function gather(){let nearest=-1,dist=player.reach;things.forEach((t,i)=>{if(t.type==='grass')return;const d=Math.hypot(t.x-player.x,t.y-player.y);if(d<dist){dist=d;nearest=i;}});if(nearest<0){toast('Nothing close enough yet. Wander a little.');return}const item=things.splice(nearest,1)[0];const resource=item.type==='stone'?'stone':'fiber';player[resource]++;toast(resource==='stone'?'A smooth stone for your pocket.':'A little wild fiber, gathered.');updateUI();}
function beacon(){if(player.fiber<3||player.stone<2)return;player.fiber-=3;player.stone-=2;player.lights++;beacons.push({x:player.x,y:player.y});toast('A little light, left in the field.');updateUI();}
function upgrade(){if(player.upgraded||player.fiber<4||player.stone<3)return;player.fiber-=4;player.stone-=3;player.reach=100;player.upgraded=true;toast('Your reach has grown.');updateUI();}
document.querySelector('#gather').addEventListener('click',gather);document.querySelector('#beacon').addEventListener('click',beacon);document.querySelector('#upgrade').addEventListener('click',upgrade);
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.code==='Space'&&!e.repeat)gather();});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
let previous=0;function frame(now){const dt=Math.min((now-previous)/1000,.05);previous=now;let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);const length=Math.hypot(dx,dy)||1;player.x=Math.max(15,Math.min(world.width-15,player.x+dx/length*150*dt));player.y=Math.max(15,Math.min(world.height-15,player.y+dy/length*150*dt));render();requestAnimationFrame(frame);}updateUI();requestAnimationFrame(frame);
