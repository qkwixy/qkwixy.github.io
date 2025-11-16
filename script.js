const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const panel = document.getElementById('panel');
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('gameContainer');

let currentGame = null;
let gameRunning = false;
let mazeData = null;

// ===== Цвета пастельные =====
const PASTEL_COLORS = ['#FF9AA2','#AFCBFF','#B9FFB0','#FFF3B0'];
const TILE_BG = '#ffffff';
const TILE_BORDER = '#cccccc';

// ======== Главное меню =====
function backToMenu(){
  menu.style.display='block';
  gameContainer.style.display='none';
  ctx.clearRect(0,0,canvas.width,canvas.height);
  panel.innerHTML='';
  currentGame = null;
  gameRunning=false;
  document.onkeydown = null;
}

// ================= Игра 1: Лабиринт чисел =================
function startGame(name){
  menu.style.display='none';
  gameContainer.style.display='block';
  gameRunning=true;

  if(name==='maze') {
    currentGame='maze';
    mazeData=createMazeGame();
  } else if(name==='wire'){
    currentGame='wire';
    createWireGame();
  } else if(name==='match3'){
    currentGame='match3';
    startMatch3();
  }
}

function createMazeGame(){
  const SIZE=5, TILE=80;
  let level=1;
  let grid=[], playerPos=[], finish=[], targetSum=0, currentSum=0, bonusCells={};

  function newLevel(){
    grid=[];
    for(let y=0;y<SIZE;y++){
      let row=[];
      for(let x=0;x<SIZE;x++) row.push(Math.floor(Math.random()*9)+1);
      grid.push(row);
    }
    playerPos=[0,Math.floor(SIZE/2)];
    finish=[SIZE-1,Math.floor(SIZE/2)];
    grid[playerPos[1]][playerPos[0]]=0;
    grid[finish[1]][finish[0]]=0;

    targetSum=Math.floor(Math.random()*(25-15+1))+15+level*2;
    currentSum=0;

    bonusCells={};
    for(let i=0;i<3;i++){
      let bx=Math.floor(Math.random()*SIZE), by=Math.floor(Math.random()*SIZE);
      if(!(bx==playerPos[0] && by==playerPos[1]) && !(bx==finish[0] && by==finish[1]))
        bonusCells[`${bx},${by}`]=Math.floor(Math.random()*2)+1;
    }
    draw();
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<SIZE;y++){
      for(let x=0;x<SIZE;x++){
        let rectX=x*TILE, rectY=y*TILE;
        ctx.fillStyle=TILE_BG;
        if(x==playerPos[0] && y==playerPos[1]) ctx.fillStyle='#A3E4D7';
        else if(x==finish[0] && y==finish[1]) ctx.fillStyle='#F7DC6F';
        else if(bonusCells[`${x},${y}`]) ctx.fillStyle='#F5B7B1';
        roundRect(ctx, rectX, rectY, TILE-2, TILE-2, 12, true, true);
        ctx.strokeStyle=TILE_BORDER;
        ctx.strokeRect(rectX, rectY, TILE-2, TILE-2);

        if(grid[y][x]!=0){
          ctx.fillStyle='black';
          ctx.font='20px Arial';
          ctx.textAlign='center';
          ctx.textBaseline='middle';
          ctx.fillText(grid[y][x], rectX+TILE/2-1, rectY+TILE/2-1);
        }

        if(bonusCells[`${x},${y}`]){
          ctx.fillStyle='black';
          ctx.font='16px Arial';
          ctx.fillText('+'+bonusCells[`${x},${y}`], rectX+TILE/2-1, rectY+TILE/2+20);
        }
      }
    }
    panel.innerHTML=`<div>Сумма: ${currentSum}/${targetSum}</div><div>Уровень: ${level}</div>`;
  }

  function move(dx,dy){
    let nx=playerPos[0]+dx, ny=playerPos[1]+dy;
    if(nx>=0 && nx<SIZE && ny>=0 && ny<SIZE){
      let key=`${nx},${ny}`;
      let val=grid[ny][nx];
      if(bonusCells[key]) { val*=bonusCells[key]; delete bonusCells[key]; }
      if(currentSum+val<=targetSum){
        playerPos=[nx,ny]; currentSum+=val;
      }
      if(nx==finish[0] && ny==finish[1]){
        if(currentSum==targetSum){ level++; newLevel(); }
        else { currentSum=0; playerPos=[0,Math.floor(SIZE/2)]; }
      }
      draw();
    }
  }

  document.onkeydown=function(e){
    if(e.key=='ArrowUp') move(0,-1);
    else if(e.key=='ArrowDown') move(0,1);
    else if(e.key=='ArrowLeft') move(-1,0);
    else if(e.key=='ArrowRight') move(1,0);
  }

  newLevel();

  return {move, draw};
}

function moveMaze(dir){
  if(!mazeData) return;
  if(dir=='up') mazeData.move(0,-1);
  else if(dir=='down') mazeData.move(0,1);
  else if(dir=='left') mazeData.move(-1,0);
  else if(dir=='right') mazeData.move(1,0);
}

// ================ Игра 2: Логическая головоломка ================
function createWireGame(){
  const ROWS=6,COLS=6,TILE=70;
  let grid=[], level=1;
  const source=[0,Math.floor(ROWS/2)], target=[COLS-1,Math.floor(ROWS/2)];

  function newLevel(){
    grid=[];
    for(let y=0;y<ROWS;y++){
      let row=[];
      for(let x=0;x<COLS;x++) row.push('empty');
      grid.push(row);
    }
    grid[source[1]][source[0]]='source';
    grid[target[1]][target[0]]='target';
    for(let i=0;i<10;i++){
      let x=Math.floor(Math.random()*(COLS-2))+1;
      let y=Math.floor(Math.random()*ROWS);
      if((x!=source[0]||y!=source[1])&&(x!=target[0]||y!=target[1])) grid[y][x]='block';
    }
    draw();
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        let rectX=x*TILE, rectY=y*TILE;
        let color='#D5DBDB';
        if(grid[y][x]=='source') color='#A3E4D7';
        else if(grid[y][x]=='target') color='#F7DC6F';
        else if(grid[y][x]=='wire') color='#AFCBFF';
        else if(grid[y][x]=='block') color='#F5B7B1';
        roundRect(ctx, rectX, rectY, TILE-2, TILE-2, 12, true, true);
        ctx.strokeStyle=TILE_BORDER;
        ctx.strokeRect(rectX, rectY, TILE-2, TILE-2);
        ctx.fillStyle=color;
        ctx.fill();
      }
    }
    panel.innerHTML=`<div>Уровень: ${level}</div>`;
  }

  canvas.onclick=function(e){
    const rect = canvas.getBoundingClientRect();
    const x=Math.floor((e.clientX-rect.left)/TILE);
    const y=Math.floor((e.clientY-rect.top)/TILE);
    if(x>=0 && x<COLS && y>=0 && y<ROWS){
      if(grid[y][x]=='empty') grid[y][x]='wire';
      else if(grid[y][x]=='wire') grid[y][x]='empty';
      draw();
      if(checkConnection()){ level++; newLevel(); }
    }
  };

  function checkConnection(){
    let visited=Array.from({length:ROWS},()=>Array(COLS).fill(false));
    let queue=[[...source]];
    while(queue.length>0){
      let [cx,cy]=queue.shift();
      if(cx==target[0] && cy==target[1]) return true;
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
        let nx=cx+dx, ny=cy+dy;
        if(nx>=0 && nx<COLS && ny>=0 && ny<ROWS && !visited[ny][nx] && (grid[ny][nx]=='wire'||grid[ny][nx]=='target')){
          visited[ny][nx]=true;
          queue.push([nx,ny]);
        }
      });
    }
    return false;
  }

  newLevel();
}

// ================= Игра 3: Три в ряд =================
let gridMatch3, selected=null, score=0, level3=1, target_score=50;
function startMatch3(){
  gridMatch3=[];
  for(let i=0;i<7;i++){
    gridMatch3.push([]);
    for(let j=0;j<7;j++){
      gridMatch3[i][j] = Math.floor(Math.random()*PASTEL_COLORS.length);
    }
  }
  loop3();
}

function loop3(){
  if(!gameRunning || currentGame!=='match3') return;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "#2a3457";
  ctx.font = "28px Segoe UI";
  ctx.fillText("Три в ряд", 150, 40);

  for(let i=0;i<7;i++){
    for(let j=0;j<7;j++){
      ctx.fillStyle=PASTEL_COLORS[gridMatch3[i][j]];
      ctx.fillRect(40 + j*52, 80 + i*52, 48, 48);
    }
  }

  panel.innerHTML=`<div>Счет: ${score}</div><div>Уровень: ${level3}</div><div>Цель: ${target_score}</div>`;
  requestAnimationFrame(loop3);
}

canvas.onclick=function(e){
  if(currentGame!=='match3') return;
  const rect = canvas.getBoundingClientRect();
  const x=Math.floor((e.clientX-rect.left)/52);
  const y=Math.floor((e.clientY-rect.top-80)/52);
  if(!selected) selected=[x,y];
  else{
    if(Math.abs(selected[0]-x)+Math.abs(selected[1]-y)==1){
      [gridMatch3[selected[1]][selected[0]], gridMatch3[y][x]]=[gridMatch3[y][x], gridMatch3[selected[1]][selected[0]]];
      let removed=true;
      while(removed){
        removed=false;
        for(let i=0;i<7;i++){
          for(let j=0;j<5;j++){
            if(gridMatch3[i][j]===gridMatch3[i][j+1] && gridMatch3[i][j]===gridMatch3[i][j+2]){
              for(let k=0;k<3;k++) gridMatch3[i][j+k]=Math.floor(Math.random()*PASTEL_COLORS.length);
              score++;
              removed=true;
            }
          }
        }
      }
    }
    selected=null;
  }
}

// ================ Вспомогательная функция ================
function roundRect(ctx, x, y, w, h, r, fill, stroke){
  if(typeof stroke==='undefined') stroke=true;
  if(typeof r==='undefined') r=5;
  if(typeof fill==='undefined') fill=true;
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
  if(fill) ctx.fill();
  if(stroke) ctx.stroke();
}
