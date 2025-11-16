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
    ИГРА 3 — Три в ряд (ФИКС + КЛИКИ + ОБНОВЛЕНИЕ)
============================ */

let grid;
let selected = null;
const size = 7;
const colors3 = ["#ff7777","#77ff77","#7777ff","#ffaa44"];

function startMatch3() {
    currentGame = 3;
    gameRunning = true;
    removeSwipe(); // фикс багов управления

    grid = [];
    for (let i = 0; i < size; i++) {
        grid.push([]);
        for (let j = 0; j < size; j++) {
            grid[i][j] = Math.floor(Math.random() * 4);
        }
    }

    canvas.addEventListener("click", click3);
    enableSwipe(swipe3);

    loop3();
}

/* ----- ОТРИСОВКА ----- */
function loop3() {
    if (!gameRunning || currentGame !== 3) return;

    ctx.clearRect(0, 0, 420, 620);

    ctx.fillStyle = "#2a3457";
    ctx.font = "28px Segoe UI";
    ctx.fillText("Три в ряд", 150, 40);

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            ctx.fillStyle = colors3[grid[i][j]];
            ctx.fillRect(40 + j * 52, 80 + i * 52, 48, 48);

            // рамка выбранной клетки
            if (selected && selected.i === i && selected.j === j) {
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 3;
                ctx.strokeRect(40 + j * 52, 80 + i * 52, 48, 48);
            }
        }
    }

    requestAnimationFrame(loop3);
}

/* ----- КЛИКИ ----- */
function click3(e) {
    if (currentGame !== 3) return;

    const x = e.offsetX;
    const y = e.offsetY;

    const j = Math.floor((x - 40) / 52);
    const i = Math.floor((y - 80) / 52);

    if (i < 0 || j < 0 || i >= size || j >= size) return;

    if (!selected) {
        selected = { i, j };
        return;
    }

    // если сосед — меняем
    if (Math.abs(selected.i - i) + Math.abs(selected.j - j) === 1) {
        swap3(selected.i, selected.j, i, j);
        if (!checkMatches3()) {
            // откат если нет совпадений
            swap3(selected.i, selected.j, i, j);
        }
    }

    selected = null;
}

/* ----- СВАЙПЫ НА ТЕЛЕФОНЕ ----- */
function swipe3(dir) {
    if (!selected) return;

    const { i, j } = selected;

    let ti = i, tj = j;

    if (dir === "up") ti--;
    if (dir === "down") ti++;
    if (dir === "left") tj--;
    if (dir === "right") tj++;

    if (ti < 0 || tj < 0 || ti >= size || tj >= size) return;

    swap3(i, j, ti, tj);

    if (!checkMatches3()) {
        swap3(i, j, ti, tj);
    }

    selected = null;
}

/* ----- ОБМЕН ----- */
function swap3(i1, j1, i2, j2) {
    const t = grid[i1][j1];
    grid[i1][j1] = grid[i2][j2];
    grid[i2][j2] = t;
}

/* ----- ПОИСК СОВПАДЕНИЙ ----- */
function checkMatches3() {
    let remove = [];

    // горизонталь
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size - 2; j++) {
            const a = grid[i][j];
            if (a === grid[i][j + 1] && a === grid[i][j + 2]) {
                remove.push([i, j], [i, j + 1], [i, j + 2]);
            }
        }
    }

    // вертикаль
    for (let j = 0; j < size; j++) {
        for (let i = 0; i < size - 2; i++) {
            const a = grid[i][j];
            if (a === grid[i + 1][j] && a === grid[i + 2][j]) {
                remove.push([i, j], [i + 1, j], [i + 2, j]);
            }
        }
    }

    if (remove.length === 0) return false;

    // удаляем
    for (let [i, j] of remove) {
        grid[i][j] = -1;
    }

    collapse3();
    return true;
}

/* ----- ПАДЕНИЕ КЛЕТОК ----- */
function collapse3() {
    for (let j = 0; j < size; j++) {
        let arr = [];
        for (let i = 0; i < size; i++) {
            if (grid[i][j] !== -1) arr.push(grid[i][j]);
        }
        while (arr.length < size) arr.unshift(Math.floor(Math.random() * 4));

        for (let i = 0; i < size; i++) {
            grid[i][j] = arr[i];
        }
    }

    setTimeout(checkMatches3, 150);
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
