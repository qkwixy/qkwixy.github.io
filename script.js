// script.js — полный код для трёх игр (Лабиринт чисел, Wire, Match-3)
// Ожидает в HTML: элементы с id="menu", id="gameCanvas", id="controls".
// Кнопки меню вызывают startGame(1|2|3). Для возврата в меню используйте backToMenu().

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const menuElem = document.getElementById("menu");
const controls = document.getElementById("controls");

let currentGame = 0;    // 0 = меню, 1 = maze, 2 = wire, 3 = match3
let gameRunning = false;

// Handy
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// --- Utilities for touch / swipe management ---
let touchStartX = null, touchStartY = null;
let touchEnabled = false;
let touchCallback = null;

function enableTouch(callback) {
  // callback(direction) where direction is 'left','right','up','down'
  touchEnabled = true;
  touchCallback = callback;
  canvas.ontouchstart = (e) => {
    if (!touchEnabled) return;
    if (!e.touches || e.touches.length === 0) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };
  canvas.ontouchend = (e) => {
    if (!touchEnabled || touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) touchCallback("right");
      if (dx < -30) touchCallback("left");
    } else {
      if (dy > 30) touchCallback("down");
      if (dy < -30) touchCallback("up");
    }
    touchStartX = null; touchStartY = null;
  };
}

function disableTouch() {
  touchEnabled = false;
  touchCallback = null;
  canvas.ontouchstart = null;
  canvas.ontouchend = null;
}

// --- Common UI helpers ---
function showControls(show) {
  if (!controls) return;
  controls.style.display = show ? "block" : "none";
}
function showCanvas(show) {
  canvas.style.display = show ? "block" : "none";
}
function showMenu(show) {
  menuElem.style.display = show ? "block" : "none";
}

// --- Start / Back ---
function startGame(id) {
  // ensure previous state cleared
  stopCurrentGame();

  currentGame = id;
  showMenu(false);
  showCanvas(true);

  if (id === 1) startMazeGame();
  else if (id === 2) startWireGame();
  else if (id === 3) startMatch3();

  gameRunning = true;
}

function backToMenu() {
  stopCurrentGame();
  currentGame = 0;
  gameRunning = false;
  showCanvas(false);
  showControls(false);
  showMenu(true);
}

function stopCurrentGame() {
  // clear handlers and animation loops
  document.onkeydown = null;
  canvas.onclick = null;
  disableTouch();
  showControls(false);

  // if match3 animation running, cancel it
  if (typeof match3AnimId !== "undefined" && match3AnimId !== null) {
    cancelAnimationFrame(match3AnimId);
    match3AnimId = null;
  }
  // remove any specific event listeners we added (safe to call repeatedly)
  canvas.removeEventListener("click", clickMatch3Handler);
  canvas.removeEventListener("click", clickWireHandler);
}

// --------------- GAME 1: MAZE (Лабиринт чисел) ----------------
let mazeState = null; // holds current maze state
function startMazeGame() {
  // show mobile controls for maze
  showControls(true);

  // initial state
  const SIZE = 5;
  const TILE = 80;

  function newLevel(level = 1) {
    const grid = [];
    for (let y = 0; y < SIZE; y++) {
      const row = [];
      for (let x = 0; x < SIZE; x++) row.push(Math.floor(Math.random() * 9) + 1);
      grid.push(row);
    }
    const playerPos = [0, Math.floor(SIZE / 2)];
    const finish = [SIZE - 1, Math.floor(SIZE / 2)];
    grid[playerPos[1]][playerPos[0]] = 0;
    grid[finish[1]][finish[0]] = 0;

    const targetSum = Math.floor(Math.random() * (25 - 15 + 1)) + 15 + level * 2;
    const bonusCells = {};
    // place up to 3 bonus multipliers (x2)
    for (let i = 0; i < 3; i++) {
      let bx = Math.floor(Math.random() * SIZE);
      let by = Math.floor(Math.random() * SIZE);
      if ((bx === playerPos[0] && by === playerPos[1]) || (bx === finish[0] && by === finish[1])) {
        i--; continue;
      }
      bonusCells[`${bx},${by}`] = 2; // multiplier
    }
    return {
      SIZE, TILE, level, grid, playerPos, finish, targetSum, currentSum: 0, bonusCells
    };
  }

  mazeState = newLevel(1);

  function drawMaze() {
    if (!mazeState) return;
    const { SIZE, TILE, grid, playerPos, finish, bonusCells, currentSum, targetSum, level } = mazeState;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const rectX = x * TILE;
        const rectY = y * TILE;
        // background
        if (x === playerPos[0] && y === playerPos[1]) ctx.fillStyle = "#A3E4D7"; // player
        else if (x === finish[0] && y === finish[1]) ctx.fillStyle = "#F7DC6F";
        else if (bonusCells[`${x},${y}`]) ctx.fillStyle = "#F5B7B1";
        else ctx.fillStyle = "#ffffff";

        roundRect(ctx, rectX + 6, rectY + 6, TILE - 12, TILE - 12, 10, true, true);
        ctx.strokeStyle = "#cccccc";
        ctx.strokeRect(rectX + 6, rectY + 6, TILE - 12, TILE - 12);

        if (grid[y][x] !== 0) {
          ctx.fillStyle = "#222";
          ctx.font = "20px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(grid[y][x].toString(), rectX + TILE / 2, rectY + TILE / 2);
        }
        if (bonusCells[`${x},${y}`]) {
          ctx.fillStyle = "#222";
          ctx.font = "14px Arial";
          ctx.fillText("x" + bonusCells[`${x},${y}`], rectX + TILE / 2, rectY + TILE / 2 + 18);
        }
      }
    }

    // top panel
    ctx.fillStyle = "#2a3457";
    ctx.font = "18px Arial";
    ctx.fillText(`Сумма: ${mazeState.currentSum}/${mazeState.targetSum}`, 10, canvas.height - 30);
    ctx.fillText(`Уровень: ${mazeState.level}`, canvas.width - 110, canvas.height - 30);
  }

  function tryMove(dx, dy) {
    const st = mazeState;
    const nx = st.playerPos[0] + dx;
    const ny = st.playerPos[1] + dy;
    if (nx < 0 || ny < 0 || nx >= st.SIZE || ny >= st.SIZE) return;
    let val = st.grid[ny][nx];
    const key = `${nx},${ny}`;
    if (st.bonusCells[key]) {
      val *= st.bonusCells[key];
      delete st.bonusCells[key];
    }
    if (st.currentSum + val <= st.targetSum) {
      st.currentSum += val;
      st.playerPos = [nx, ny];
    }
    // if reached finish
    if (nx === st.finish[0] && ny === st.finish[1]) {
      if (st.currentSum === st.targetSum) {
        // next level
        st.level += 1;
        Object.assign(mazeState, newLevel(st.level));
      } else {
        // reset position and sum
        st.currentSum = 0;
        st.playerPos = [0, Math.floor(st.SIZE / 2)];
      }
    }
    drawMaze();
  }

  // keyboard controls for desktop
  document.onkeydown = function (e) {
    if (currentGame !== 1) return;
    if (e.key === "ArrowUp") tryMove(0, -1);
    else if (e.key === "ArrowDown") tryMove(0, 1);
    else if (e.key === "ArrowLeft") tryMove(-1, 0);
    else if (e.key === "ArrowRight") tryMove(1, 0);
  };

  // mobile controls via controls buttons — those buttons call moveMobile()
  window.moveMazeMobile = function (dx, dy) {
    if (currentGame !== 1) return;
    tryMove(dx, dy);
  };

  // touch swipe also moves
  enableTouch((dir) => {
    if (currentGame !== 1) return;
    if (dir === "up") tryMove(0, -1);
    if (dir === "down") tryMove(0, 1);
    if (dir === "left") tryMove(-1, 0);
    if (dir === "right") tryMove(1, 0);
  });

  // initial draw
  drawMaze();
}

// helper to call from HTML controls: arrow buttons
function moveMaze(dx, dy) {
  // this function is referenced by HTML controls: onclick="moveMaze(0,-1)" etc.
  if (typeof window.moveMazeMobile === "function") window.moveMazeMobile(dx, dy);
}

// --------------- GAME 2: WIRE (Логическая головоломка) ----------------
let wireState = null;
function startWireGame() {
  // hide mobile controls for this game
  showControls(false);

  const ROWS = 6, COLS = 6, TILE = 70;
  function newLevel(level = 1) {
    const grid = [];
    for (let y = 0; y < ROWS; y++) {
      const row = [];
      for (let x = 0; x < COLS; x++) row.push('empty');
      grid.push(row);
    }
    const source = [0, Math.floor(ROWS / 2)];
    const target = [COLS - 1, Math.floor(ROWS / 2)];
    grid[source[1]][source[0]] = 'source';
    grid[target[1]][target[0]] = 'target';
    // place some blocks
    let blocks = Math.min(12, 4 + level * 2);
    for (let i = 0; i < blocks; i++) {
      let x = Math.floor(Math.random() * (COLS - 2)) + 1;
      let y = Math.floor(Math.random() * ROWS);
      if ((x === source[0] && y === source[1]) || (x === target[0] && y === target[1])) { i--; continue; }
      grid[y][x] = 'block';
    }
    return { ROWS, COLS, TILE, level, grid, source, target };
  }

  wireState = newLevel(1);

  function drawWire() {
    if (!wireState) return;
    const { ROWS, COLS, TILE, grid } = wireState;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const rectX = x * TILE + 10;
        const rectY = y * TILE + 10;
        let color = "#D5DBDB";
        if (grid[y][x] === 'source') color = "#A3E4D7";
        else if (grid[y][x] === 'target') color = "#F7DC6F";
        else if (grid[y][x] === 'wire') color = "#AFCBFF";
        else if (grid[y][x] === 'block') color = "#F5B7B1";
        roundRect(ctx, rectX, rectY, TILE - 18, TILE - 18, 10, true, true);
        ctx.strokeStyle = "#cccccc";
        ctx.strokeRect(rectX, rectY, TILE - 18, TILE - 18);

        // draw a small icon for wire
        if (grid[y][x] === 'wire') {
          ctx.fillStyle = "#123456";
          ctx.fillRect(rectX + 12, rectY + 12, (TILE - 42), (TILE - 42));
        }
      }
    }
    ctx.fillStyle = "#2a3457";
    ctx.font = "18px Arial";
    ctx.fillText(`Уровень: ${wireState.level}`, 10, canvas.height - 30);
  }

  // click handler
  function clickWire(e) {
    if (currentGame !== 2) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left - 10) / TILE);
    const y = Math.floor((e.clientY - rect.top - 10) / TILE);
    if (x < 0 || y < 0 || x >= wireState.COLS || y >= wireState.ROWS) return;
    if (wireState.grid[y][x] === 'empty') wireState.grid[y][x] = 'wire';
    else if (wireState.grid[y][x] === 'wire') wireState.grid[y][x] = 'empty';
    // cannot toggle source/target/block
    if (wireState.grid[y][x] === 'source' || wireState.grid[y][x] === 'target' || wireState.grid[y][x] === 'block') {
      // do nothing
    }
    drawWire();
    if (checkConnection()) {
      wireState.level++;
      wireState = newLevel(wireState.level);
      drawWire();
    }
  }

  // connectivity check
  function checkConnection() {
    const { ROWS, COLS, grid, source, target } = wireState;
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const queue = [[source[0], source[1]]];
    visited[source[1]][source[0]] = true;
    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      if (cx === target[0] && cy === target[1]) return true;
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      for (let [dx,dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && !visited[ny][nx]) {
          if (grid[ny][nx] === 'wire' || grid[ny][nx] === 'target') {
            visited[ny][nx] = true;
            queue.push([nx, ny]);
          }
        }
      }
    }
    return false;
  }

  // register click
  canvas.addEventListener("click", clickWire);
  // touch also toggles on tap
  enableTouch((dir) => {
    // small taps aren't swipe; don't interpret swipe for toggles
  });

  // initial draw
  drawWire();

  // expose handler removal if needed
  clickWireHandler = clickWire; // for cleanup later
}

// --------------- GAME 3: MATCH-3 (fixed) ----------------
let match3AnimId = null;
let match3Grid = [];
let match3Selected = null;
let match3Size = 7;
let clickMatch3Handler = null;

function startMatch3() {
  // hide controls for match3
  showControls(false);

  // prepare grid
  match3Grid = [];
  for (let i = 0; i < match3Size; i++) {
    match3Grid.push([]);
    for (let j = 0; j < match3Size; j++) {
      match3Grid[i][j] = Math.floor(Math.random() * 4);
    }
  }
  match3Selected = null;

  // remove any previous handlers
  canvas.removeEventListener("click", clickMatch3Handler);
  clickMatch3Handler = function(e) {
    if (currentGame !== 3) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left - 40) / 52);
    const y = Math.floor((e.clientY - rect.top - 80) / 52);
    if (x < 0 || y < 0 || x >= match3Size || y >= match3Size) return;
    handleMatch3Click(y, x);
  };
  canvas.addEventListener("click", clickMatch3Handler);

  // enable swipe (for swapping)
  enableTouch((dir) => {
    if (currentGame !== 3) return;
    if (!match3Selected) return; // need a selected cell to swipe relative
    swipeMatch3(dir);
  });

  // run loop
  match3AnimId = requestAnimationFrame(match3Loop);
}

// Drawing and logic
function match3Loop() {
  if (!gameRunning || currentGame !== 3) {
    if (match3AnimId) { cancelAnimationFrame(match3AnimId); match3AnimId = null; }
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2a3457";
  ctx.font = "28px Segoe UI";
  ctx.fillText("Три в ряд", 150, 40);

  const colors = ["#ff7777","#77ff77","#7777ff","#ffaa44"];
  for (let i = 0; i < match3Size; i++) {
    for (let j = 0; j < match3Size; j++) {
      ctx.fillStyle = colors[match3Grid[i][j]];
      ctx.fillRect(40 + j * 52, 80 + i * 52, 48, 48);
      if (match3Selected && match3Selected.i === i && match3Selected.j === j) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.strokeRect(40 + j * 52, 80 + i * 52, 48, 48);
      }
    }
  }

  match3AnimId = requestAnimationFrame(match3Loop);
}

function handleMatch3Click(i, j) {
  if (!match3Selected) {
    match3Selected = { i, j };
    return;
  }
  const sel = match3Selected;
  // if neighbor -> swap
  if (Math.abs(sel.i - i) + Math.abs(sel.j - j) === 1) {
    swapMatch3(sel.i, sel.j, i, j);
    if (!checkMatches3()) {
      // swap back if no match
      swapMatch3(sel.i, sel.j, i, j);
    } else {
      // matches handled inside checkMatches3->collapse
    }
  }
  match3Selected = null;
}

function swapMatch3(i1, j1, i2, j2) {
  const t = match3Grid[i1][j1];
  match3Grid[i1][j1] = match3Grid[i2][j2];
  match3Grid[i2][j2] = t;
}

function swipeMatch3(dir) {
  const s = match3Selected;
  if (!s) return;
  let ti = s.i, tj = s.j;
  if (dir === "up") ti--;
  if (dir === "down") ti++;
  if (dir === "left") tj--;
  if (dir === "right") tj++;
  if (ti < 0 || tj < 0 || ti >= match3Size || tj >= match3Size) return;
  swapMatch3(s.i, s.j, ti, tj);
  if (!checkMatches3()) swapMatch3(s.i, s.j, ti, tj);
  match3Selected = null;
}

function checkMatches3() {
  const size = match3Size;
  const toRemove = Array.from({ length: size }, () => Array(size).fill(false));
  let found = false;

  // horizontal
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size - 2; j++) {
      const a = match3Grid[i][j];
      if (a === match3Grid[i][j + 1] && a === match3Grid[i][j + 2]) {
        toRemove[i][j] = toRemove[i][j + 1] = toRemove[i][j + 2] = true;
        found = true;
      }
    }
  }
  // vertical
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size - 2; i++) {
      const a = match3Grid[i][j];
      if (a === match3Grid[i + 1][j] && a === match3Grid[i + 2][j]) {
        toRemove[i][j] = toRemove[i + 1][j] = toRemove[i + 2][j] = true;
        found = true;
      }
    }
  }

  if (!found) return false;

  // remove
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (toRemove[i][j]) match3Grid[i][j] = -1;
    }
  }

  collapseMatch3();
  return true;
}

function collapseMatch3() {
  const size = match3Size;
  for (let j = 0; j < size; j++) {
    const col = [];
    for (let i = 0; i < size; i++) {
      if (match3Grid[i][j] !== -1) col.push(match3Grid[i][j]);
    }
    while (col.length < size) {
      col.unshift(Math.floor(Math.random() * 4));
    }
    for (let i = 0; i < size; i++) match3Grid[i][j] = col[i];
  }
  // chain react after a short delay to make it feel natural
  setTimeout(() => {
    if (!checkMatches3()) {
      // done, continue rendering
    }
  }, 140);
}

// --------------- Helpers & UI drawing utils ----------------
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (typeof stroke === 'undefined') stroke = true;
  if (typeof r === 'undefined') r = 5;
  if (typeof fill === 'undefined') fill = true;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// ---------------- Expose small helpers to global (for HTML controls) --------------
window.moveMaze = function(dx, dy) {
  // called from mobile arrow buttons: moveMaze(0,-1)...
  if (currentGame === 1 && typeof window.moveMazeMobile === "function") {
    window.moveMazeMobile(dx, dy);
  }
};

// ensure back button available globally if user wants to call backToMenu()
// e.g. you can add a "Back" button that calls backToMenu()

// ---------------- initial visibility ----------------
showCanvas(false);
showControls(false);
showMenu(true);
