const world = document.querySelector('#world');
const message = document.querySelector('#message');
const initial = ['grass','flower','grass','grass','rock','grass','grass','flower','grass','grass','grass','grass','flower','grass','grass','rock','grass','grass','rock','grass','flower','grass','grass','grass','grass','grass','flower','grass','grass','grass','grass','flower','grass','rock','grass','grass','grass','flower','grass','rock','grass','grass','grass','grass','grass','grass','grass','rock','grass','grass','flower','grass','grass','rock'];
let tiles = initial.map(type => ({type})), seeds = 2, stones = 1, upgraded = false, tool = 'gather';
const icons = {grass:'',flower:'✿',rock:'◆',sprout:'♧',bloom:'✿',path:'●',lantern:'✺'};
const names = {grass:'open ground',flower:'wild bloom',rock:'wild stone',sprout:'growing bloom',bloom:'garden bloom',path:'placed stone',lantern:'lantern'};
function render() {
 world.replaceChildren(...tiles.map((tile,index) => {const button=document.createElement('button');button.className=`tile ${tile.type}`;button.textContent=icons[tile.type];button.setAttribute('aria-label',`${names[tile.type]}, row ${Math.floor(index/9)+1}, column ${index%9+1}`);button.addEventListener('click',()=>act(index));return button}));
 document.querySelector('#seeds').textContent=seeds;document.querySelector('#stones').textContent=stones;
 document.querySelectorAll('.tool').forEach(button=>{button.classList.toggle('active',button.dataset.tool===tool);button.setAttribute('aria-pressed',button.dataset.tool===tool)});
 const upgrade=document.querySelector('#upgrade');upgrade.disabled=upgraded;upgrade.innerHTML=upgraded?'Upgraded <span>✓</span>':'Upgrade <span>5 seeds ↗</span>';
}
function say(text){message.textContent=text}
function act(index){const tile=tiles[index];
 if(tool==='gather'){
  if(tile.type==='flower'||tile.type==='bloom'){seeds+=upgraded?2:1;tile.type='grass';say('Seeds gathered. Plant them anywhere you like.');}
  else if(tile.type==='rock'){stones+=upgraded?2:1;tile.type='grass';say('Stone gathered. Make a path or build a lantern.');}
  else {say('Gather wild blooms or stones, or choose another tool.');return}
 }else if(tile.type!=='grass'){say('Choose an open patch of ground for that.');return}
 else if(tool==='plant'){if(seeds<1){say('Gather a bloom to find more seeds.');return}seeds--;tile.type='sprout';say('A bloom is growing. Give it a little time.');setTimeout(()=>{if(tiles[index]===tile&&tile.type==='sprout'){tile.type='bloom';render();say('A bloom has opened in your garden.')}},5000)}
 else if(tool==='stone'){if(stones<1){say('Gather a wild stone first.');return}stones--;tile.type='path';say('A stone placed. Every path starts somewhere.');}
 else if(tool==='lamp'){if(seeds<3||stones<2){say('A lantern needs 3 seeds and 2 stones.');return}seeds-=3;stones-=2;tile.type='lantern';say('A little light for your clearing.');}
 render();
}
document.querySelectorAll('.tool').forEach(button=>button.addEventListener('click',()=>{tool=button.dataset.tool;render();say(`Choose a tile to ${tool==='plant'?'plant a bloom':tool==='stone'?'place a stone':tool==='lamp'?'build a lantern':'gather'}.`)}));
document.querySelector('#upgrade').addEventListener('click',()=>{if(seeds<5){say('Gather 5 seeds to upgrade your hands.');return}seeds-=5;upgraded=true;render();say('Gathering hands upgraded. Collect twice as much.');});
document.querySelector('#reset').addEventListener('click',()=>{tiles=initial.map(type=>({type}));seeds=2;stones=1;upgraded=false;tool='gather';render();say('A fresh clearing awaits.');});
document.addEventListener('keydown',event=>{if(/^[1-4]$/.test(event.key))document.querySelectorAll('.tool')[Number(event.key)-1].click()});
render();
