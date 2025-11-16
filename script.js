const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let currentGame = 0;
let gameRunning = false;

function startGame(id) {
    currentGame = id;
    document.getElementById("menu").style.display = "none";
    canvas.style.display = "block";
    document.getElementById("controls").style.display = "block";
    gameRunning = true;

    if (id === 1) startColorGame();
    if (id === 2) startMergeGame();
    if (id === 3) startMatch3();
}

function backToMenu() {
    gameRunning = false;
    canvas.style.display = "none";
    document.getElementById("controls").style.display = "none";
    document.getElementById("menu").style.display = "block";
}

/* ============================
    ИГРА 1 — Лабиринт цветов
============================ */
let pX = 200, pY = 300;
let pSpeed = 4;
let targetColor = "";

function startColorGame() {
    pX = 200;
    pY = 300;
    targetColor = randomColor();

    document.onkeydown = function(e){
        if (e.key === "ArrowUp") pY -= pSpeed;
        if (e.key === "ArrowDown") pY += pSpeed;
        if (e.key === "ArrowLeft") pX -= pSpeed;
        if (e.key === "ArrowRight") pX += pSpeed;
    };

    enableSwipe(moveMobile);
    loop1();
}

function moveMobile(dir){
    if (!gameRunning || currentGame !== 1) return;

    if (dir === "up") pY -= pSpeed;
    if (dir === "down") pY += pSpeed;
    if (dir === "left") pX -= pSpeed;
    if (dir === "right") pX += pSpeed;
}

function loop1(){
    if (!gameRunning || currentGame !== 1) return;

    ctx.clearRect(0,0,420,620);

    ctx.fillStyle = "#2a3457";
    ctx.font = "20px Segoe UI";
    ctx.fillText("Поймай цвет", 20, 30);

    ctx.fillStyle = targetColor;
    ctx.fillRect(280, 10, 40, 40);

    ctx.fillStyle = "#6d8cff";
    ctx.fillRect(pX, pY, 40, 40);

    if (Math.abs(pX - 280) < 40 && Math.abs(pY - 10) < 40) {
        targetColor = randomColor();
    }

    requestAnimationFrame(loop1);
}

function randomColor(){
    return `rgb(${rand()}, ${rand()}, ${rand()})`;
}
function rand(){ return Math.floor(Math.random()*255); }

/* ============================
    ИГРА 2 — Слияние цифр
============================ */
function startMergeGame() {
    enableSwipe(()=>{});
    loop2();
}

function loop2(){
    if (!gameRunning || currentGame !== 2) return;

    ctx.clearRect(0,0,420,620);

    ctx.fillStyle = "#2a3457";
    ctx.font = "26px Segoe UI";
    ctx.fillText("Слияние цифр", 110, 40);

    for (let i=0;i<4;i++){
        for (let j=0;j<4;j++){
            ctx.fillStyle = "#e6eaff";
            ctx.fillRect(60 + j*80, 100 + i*80, 70, 70);
        }
    }

    requestAnimationFrame(loop2);
}

/* ============================
    ИГРА 3 — Три в ряд (фикс)
============================ */
let grid;

function startMatch3() {
    grid = [];
    for (let i=0;i<7;i++){
        grid.push([]);
        for (let j=0;j<7;j++){
            grid[i][j] = Math.floor(Math.random()*4);
        }
    }

    enableSwipe(()=>{});
    loop3();
}

function loop3(){
    if (!gameRunning || currentGame !== 3) return;

    ctx.clearRect(0,0,420,620);

    ctx.fillStyle = "#2a3457";
    ctx.font = "28px Segoe UI";
    ctx.fillText("Три в ряд", 150, 40);

    const colors = ["#ff7777","#77ff77","#7777ff","#ffaa44"];

    for (let i=0;i<7;i++){
        for (let j=0;j<7;j++){
            ctx.fillStyle = colors[grid[i][j]];
            ctx.fillRect(40 + j*52, 80 + i*52, 48, 48);
        }
    }

    requestAnimationFrame(loop3);
}

/* ============================
      Свайпы
============================ */
function enableSwipe(callback){
    let startX, startY;
    canvas.ontouchstart = e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    };
    canvas.ontouchend = e => {
        let dx = e.changedTouches[0].clientX - startX;
        let dy = e.changedTouches[0].clientY - startY;

        if (Math.abs(dx) > Math.abs(dy)){
            if (dx > 20) callback("right");
            if (dx < -20) callback("left");
        } else {
            if (dy > 20) callback("down");
            if (dy < -20) callback("up");
        }
    };
}
