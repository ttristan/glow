const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d');
const $ = (id) => document.getElementById(id);
const SIZE = 23;
const SAVE = 'glow-tidal-garden-v1';
const islands = [[10,11,4.3,'The Quiet Shoal'],[17,7,2.9,'Lantern Reach'],[5,4,2.7,'The Moss Archive'],[5,18,3.1,'Willow Rest'],[19,18,2.7,'The Far Garden']];
const noise = (x,y) => { const n = Math.sin(x*127.1+y*311.7)*43758.5453; return n-Math.floor(n); };
const key = (x,y) => `${x},${y}`;
const valid = (x,y) => Number.isInteger(x) && Number.isInteger(y) && x>=0 && y>=0 && x<SIZE && y<SIZE;
function terrain(x,y) {
  let distance = 99, island = -1;
  islands.forEach(([cx,cy,r],i) => { const d = Math.hypot(x-cx,(y-cy)*1.05)/r; if(d<distance){distance=d;island=i;} });
  const land = distance < 1 + noise(x,y)*.12;
  return {land, island, shore:distance>.79, resource:land && noise(x+19,y+28)>.63 ? 'grove' : null};
}
const initial = () => ({version:1,x:10,y:11,wood:4,seeds:2,turn:0,upgraded:false,mods:{},visited:[0],planted:0,built:0});
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE));
    if (!s || s.version!==1 || !valid(s.x,s.y) || !['wood','seeds','turn','planted','built'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0) || typeof s.upgraded!=='boolean' || !s.mods || Array.isArray(s.mods) || !Array.isArray(s.visited) || !s.visited.every(i=>Number.isInteger(i)&&i>=0&&i<5)) return initial();
    for(const [k,v] of Object.entries(s.mods)) { const [x,y]=k.split(',').map(Number); if(!valid(x,y) || !v || !['bridge','grove'].includes(v.type) || (v.type==='grove' && (!Number.isSafeInteger(v.ready)||v.ready<0))) return initial(); }
    if (s.shoreGathered !== undefined && (!s.shoreGathered || typeof s.shoreGathered !== 'object' || Array.isArray(s.shoreGathered) || !Object.values(s.shoreGathered).every(v=>Number.isSafeInteger(v)&&v>=0))) return initial();
    if (!terrain(s.x,s.y).land && s.mods[key(s.x,s.y)]?.type !== 'bridge') return initial();
    return s;
  } catch { return initial(); }
}
let state = load(), tool = 'walk', hover = null, width=0,height=0,scale=1,ox=0,oy=0,lastDirection=[1,0];
const tideHigh = () => Math.floor(state.turn/8)%2===1;
const tile = (x,y) => { const base=terrain(x,y); return {...base,...state.mods[key(x,y)]}; };
const walkable = (x,y) => valid(x,y) && (terrain(x,y).land || state.mods[key(x,y)]?.type==='bridge');
const range = () => state.upgraded?3:2;
const distance = (x,y) => Math.hypot(x-state.x,y-state.y);
function save() { try { localStorage.setItem(SAVE,JSON.stringify(state)); $('save-status').textContent='Saved on this device'; } catch { $('save-status').textContent='Storage unavailable · progress lasts this session'; } }
function say(text) { $('message').textContent=text; }
function update() {
  $('wood').textContent=state.wood; $('seeds').textContent=state.seeds;
  $('day').textContent=`Day ${Math.floor(state.turn/16)+1}`;
  $('tide').textContent=tideHigh()?'High tide · plant inland':'Low tide · driftwood returns';
  $('groves').textContent=state.planted; $('bridges').textContent=state.built; $('islands').textContent=`${state.visited.length} / 5`;
  $('place').textContent=islands[terrain(state.x,state.y).island][3];
  $('upgrade').disabled=state.upgraded;
  $('upgrade').innerHTML=state.upgraded?'Gathering satchel crafted <span>Reach increased to 3 tiles</span>':'Craft a gathering satchel <span>8 wood · 3 seeds</span>';
  save(); draw();
}
function advance(message) {state.turn++; say(message); update();}
function select(name) {tool=name;document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('selected',b.dataset.tool===name));draw();}
function pathExists(tx,ty) {
 const queue=[[state.x,state.y]], seen=new Set([key(state.x,state.y)]);
 for(let i=0;i<queue.length;i++){const [x,y]=queue[i];if(x===tx&&y===ty)return true;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(walkable(nx,ny)&&!seen.has(k)){seen.add(k);queue.push([nx,ny]);}}}return false;
}
function act(x,y,action=tool) {
 if(!valid(x,y))return;
 const t=tile(x,y), k=key(x,y);
 if(action==='walk'){
  if(!walkable(x,y)||!pathExists(x,y)){say('Water between you and there. A boardwalk could make a way.');return;}
  if(x===state.x&&y===state.y)return;
  state.x=x;state.y=y;if(t.land&&!state.visited.includes(t.island))state.visited.push(t.island);
  advance('A different view. A little more world.');return;
 }
 if(distance(x,y)>range()){say(`Wander closer. Your reach is ${range()} tiles.`);return;}
 if(action==='gather'){
  if(t.type==='grove'||(t.resource==='grove'&&!t.type)){
   if((t.ready||0)>state.turn){say(`This grove is growing. Rest ${t.ready-state.turn} more times, or wander.`);return;}
   state.wood+=3;state.seeds+=2;state.mods[k]={type:'grove',ready:state.turn+5};advance('+3 driftwood · +2 glow seeds. The grove will grow back.');return;
  }
  if(t.land&&t.shore&&!tideHigh()&&t.type!=='bridge'){
   // Tides replenish loose wood, tracked per shore tile and tide cycle.
   const cycle=Math.floor(state.turn/16),shoreKey=`shore-${k}`;
   state.shoreGathered ??= {};
   if(state.shoreGathered[shoreKey]===cycle){say('This shore is clear. Try another shore, or wait for the next low tide.');return;}
   state.shoreGathered[shoreKey]=cycle;state.wood++;advance('+1 driftwood, washed ashore by the tide.');return;
  }
  say('Gather from a glowing grove, or an empty shore at low tide.');return;
 }
 if(action==='plant'){
  if(!t.land||t.type==='bridge'||t.type==='grove'||t.resource){say('A seed needs an empty patch of earth.');return;}
  if(t.shore&&tideHigh()){say('The tide is too high here. Plant inland, or wait for low tide.');return;}
  if(state.seeds<1){say('Gather a glowing grove for more seeds.');return;}
  state.seeds--;state.planted++;state.mods[k]={type:'grove',ready:state.turn+5};advance('A small beginning. Your grove will bloom after four more actions.');return;
 }
 if(action==='build'){
  if(t.land||t.type==='bridge'){say('Build a boardwalk on water beside land or an existing boardwalk.');return;}
  if(![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>walkable(x+dx,y+dy))){say('Your boardwalk needs a shore or another boardwalk to connect to.');return;}
  if(state.wood<2){say('A boardwalk needs 2 driftwood. Gather a nearby grove.');return;}
  state.wood-=2;state.built++;state.mods[k]={type:'bridge'};advance('A way across. The world is a little more connected.');
 }
}
$('upgrade').onclick=()=>{if(state.upgraded)return;if(state.wood<8||state.seeds<3){say('Gather 8 driftwood and 3 glow seeds to craft the satchel.');return;}state.wood-=8;state.seeds-=3;state.upgraded=true;advance('A roomier satchel. Gather, plant, and build up to 3 tiles away.');};
$('rest').onclick=()=>advance('The water moves. The garden grows.');
$('reset').onclick=()=>{if(confirm('Start a new garden? Your saved garden will be replaced.')){state=initial();select('walk');say('A fresh shore. A few seeds. All the time you need.');update();}};
for(const b of document.querySelectorAll('[data-tool]'))b.onclick=()=>select(b.dataset.tool);
document.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLButtonElement && [' ','Enter'].includes(e.key))return;
 if(['1','2','3','4'].includes(e.key))select(['walk','gather','plant','build'][Number(e.key)-1]);
 const moves={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
 if(moves[e.key]){e.preventDefault();lastDirection=moves[e.key];act(state.x+lastDirection[0],state.y+lastDirection[1],'walk');}
 if(e.code==='Space'){e.preventDefault();$('rest').click();}
 if(e.key.toLowerCase()==='p')act(state.x,state.y,'plant');
 if(e.key.toLowerCase()==='b')act(state.x+lastDirection[0],state.y+lastDirection[1],'build');
 if(e.key.toLowerCase()==='g'){
  const choices=[];for(let x=0;x<SIZE;x++)for(let y=0;y<SIZE;y++){const t=tile(x,y);if(distance(x,y)<=range()&&(t.type==='grove'||t.resource==='grove')&&(t.ready||0)<=state.turn)choices.push([x,y]);}
  if(choices.length)act(...choices.sort((a,b)=>distance(...a)-distance(...b))[0],'gather');else say('No mature grove in reach. Wander or rest a while.');
 }
});
function project(x,y){return [ox+(x-y)*28*scale,oy+(x+y)*14*scale];}
function unproject(px,py){const a=(px-ox)/(28*scale),b=(py-oy)/(14*scale);return [Math.round((a+b)/2),Math.round((b-a)/2)];}
canvas.addEventListener('pointermove',e=>{const [x,y]=unproject(e.clientX,e.clientY+7*scale);hover=valid(x,y)?[x,y]:null;const tip=$('tooltip');if(!hover){tip.hidden=true;draw();return;}const t=tile(x,y);tip.textContent=t.type==='bridge'?'Boardwalk':t.type==='grove'||t.resource==='grove'?((t.ready||0)>state.turn?'Growing grove':'Glow grove · 3 wood + 2 seeds'):t.land?(t.shore?'Sandy shore':'Soft earth · room to grow'):'Shallow water · bridge for 2 wood';tip.hidden=false;tip.style.left=`${Math.min(e.clientX+16,width-230)}px`;tip.style.top=`${Math.max(10,e.clientY-42)}px`;draw();});
canvas.addEventListener('pointerleave',()=>{hover=null;$('tooltip').hidden=true;draw();});
canvas.addEventListener('click',e=>{act(...unproject(e.clientX,e.clientY+7*scale));});
function polygon(points,fill,stroke){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function line(x1,y1,x2,y2,color,w=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke();ctx.lineWidth=1;}
function grove(px,py,x,y,growing){
 const n=noise(x,y),h=growing?12:31+n*22;
 ellipse(px,py+2,17,7,'#072c2b66');
 line(px,py,px,py-h*.7,'#8b9d6a',3);
 for(let i=0;i<3;i++){
 const xx=px+(i-1)*9, yy=py-h+(i===1?-6:5);
 line(px,py-9,xx,yy+10,'#7d9f6c',2);
 ctx.save();ctx.shadowColor='#b0f6aa';ctx.shadowBlur=growing?4:17;
 ellipse(xx,yy,growing?5:10,growing?7:13,i===1?'#d7e3a0':'#94c899');ctx.restore();
 ellipse(xx-2,yy-3,growing?2:4,growing?3:5,'#e2eac087');
 }
}
function draw(){
 ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);ctx.clearRect(0,0,width,height);
 const bg=ctx.createRadialGradient(width*.52,height*.46,30,width*.5,height*.48,width*.7);bg.addColorStop(0,tideHigh()?'#244c50':'#214b49');bg.addColorStop(1,'#071e28');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
 ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.translate(-ox,-oy);
 // Fine current lines give the water a calm, cartographic texture.
 for(let i=0;i<140;i++){const x=noise(i,1)*width/scale-width*.12,y=noise(i,2)*height/scale;line(x,y,x+12+noise(i,3)*22,y,'#83b4a514');}
 ctx.restore();
 // Back-to-front tiles preserve occlusion of grove silhouettes.
 for(let sum=0;sum<SIZE*2;sum++)for(let x=0;x<SIZE;x++){
 const y=sum-x;if(!valid(x,y))continue;
 const t=tile(x,y),[px,py]=project(x,y);
 ctx.save();ctx.translate(px,py);ctx.scale(scale,scale);
 if(t.land){
  const top=t.shore?(tideHigh()?'#718c74':'#a2af83'):['#648b6a','#729573','#7b9c77'][Math.floor(noise(x,y)*3)];
  polygon([[-28,-7],[0,7],[0,17],[-28,3]],t.shore?'#657e67':'#3e6856');
  polygon([[0,7],[28,-7],[28,3],[0,17]],t.shore?'#496f60':'#305749');
  polygon([[0,-21],[28,-7],[0,7],[-28,-7]],top,'#b4c49a18');
  if(t.shore){line(-20,10,-4,18,'#bad6bc39');line(6,18,23,10,'#bad6bc24');}
  if(!t.resource&&!t.type&&noise(x+3,y)>.65){for(let j=0;j<3;j++){const gx=(j-1)*5;line(gx,-7,gx-2,-12,'#b0c18a77');line(gx,-7,gx+2,-10,'#b0c18a77');}}
 }else if(t.type==='bridge'){
  polygon([[0,-17],[25,-5],[0,8],[-25,-5]],'#b19c74','#d3bd8a');
  for(let i=-3;i<=3;i++)line(-16+i*3,-10+i*1.5,8+i*3,2+i*1.5,'#6e7056');
  line(-20,-5,-20,7,'#526c59',3);line(20,-5,20,7,'#526c59',3);
 }else if(noise(x,y)>.88){ellipse(0,0,9,2,'#8cb5a41c');}
 if(hover&&hover[0]===x&&hover[1]===y){polygon([[0,-21],[28,-7],[0,7],[-28,-7]],'#e5edb122','#d9dfaa');}
 if(t.type==='grove'||(!t.type&&t.resource==='grove'))grove(0,-9,x,y,(t.ready||0)>state.turn);
 if(t.land&&noise(x+8,y+11)>.94&&!t.resource&&!t.type){ellipse(2,-9,8,5,'#a5bbaa');ellipse(0,-11,6,4,'#bed0b3');}
 if(x===state.x&&y===state.y){
  ellipse(0,-5,10,5,'#183f4155');ctx.save();ctx.shadowColor='#f1e5a6';ctx.shadowBlur=20;ellipse(0,-7,13,6,'#eff0b326');ctx.restore();
  line(-3,-7,-3,-17,'#d5c89b',3);line(3,-7,3,-17,'#d5c89b',3);
  polygon([[-7,-16],[0,-30],[7,-16],[5,-10],[-5,-10]],'#d7c493');
  ellipse(0,-30,5,6,'#f0dfb2');ellipse(0,-33,7,3,'#eddfb5');line(8,-16,10,-28,'#afc49c',2);
  ctx.save();ctx.shadowColor='#ffec9e';ctx.shadowBlur=15;ellipse(10,-28,3,4,'#f8e6a1');ctx.restore();
 }
 ctx.restore();
 }
 const [playerX,playerY]=project(state.x,state.y);
 ctx.fillStyle='#f4e5b4';ctx.font=`${Math.max(8,9*scale)}px Arial`;ctx.textAlign='center';ctx.fillText('YOU',playerX,playerY-65*scale);
 polygon([[playerX-3,playerY-60*scale],[playerX+3,playerY-60*scale],[playerX,playerY-55*scale]],'#f4e5b4');
 // A small compass grounds the composition without obscuring play.
 ctx.fillStyle='#8ca99e66';ctx.font='9px Arial';ctx.textAlign='center';ctx.fillText('N',width-70,height-205);line(width-70,height-190,width-70,height-168,'#8ca99e66');line(width-80,height-179,width-60,height-179,'#8ca99e66');
}
function resize(){width=innerWidth;height=innerHeight;canvas.width=width*devicePixelRatio;canvas.height=height*devicePixelRatio;scale=Math.min(width/1400,(height-160)/720);if(width<650)scale=Math.min(width/1100,(height-180)/720);ox=width*.51;oy=height*.5-22*14*scale;draw();}
addEventListener('resize',resize);resize();update();
