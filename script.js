const rows = 20, cols = 20;
const DIRS4 = [
  {dx: -1, dy:  0, cost: 1}, {dx:  1, dy:  0, cost: 1},
  {dx:  0, dy: -1, cost: 1}, {dx:  0, dy:  1, cost: 1}
];
const DIRS8 = [
  ...DIRS4,
  {dx: -1, dy: -1, cost: Math.SQRT2}, {dx: -1, dy:  1, cost: Math.SQRT2},
  {dx:  1, dy: -1, cost: Math.SQRT2}, {dx:  1, dy:  1, cost: Math.SQRT2}
];

let playerCell = null;
const gridEl = document.getElementById('grid');
const speedControl = document.getElementById('speed');
const player = document.getElementById('player');
const grid = [];
let animating = false;

for (let i = 0; i < rows; i++) {
  grid[i] = [];
  for (let j = 0; j < cols; j++) {
    const el = document.createElement('div');
    el.classList.add('cell');
    el.dataset.i = i; el.dataset.j = j;
    gridEl.appendChild(el);
    grid[i][j] = { i, j, el, obstacle: false, g: Infinity, h: 0, f: Infinity, prev: null, closed: false };
  }
}

placePlayerRandom();

// Left click moves the player to the selected cell
gridEl.addEventListener('click', e => {
  const el = e.target;
  if (!el.classList.contains('cell') || animating) return;
  const node = grid[+el.dataset.i][+el.dataset.j];
  if (node.obstacle) return;
  runTo(node);
});

// Right click toggles obstacles so users can draw walls
gridEl.addEventListener('contextmenu', e => {
  e.preventDefault();
  const el = e.target;
  if (!el.classList.contains('cell') || animating) return;
  const node = grid[+el.dataset.i][+el.dataset.j];
  if (node === playerCell) return;
  node.obstacle = !node.obstacle;
  node.el.classList.toggle('obstacle');
});

document.getElementById('clear').onclick = () => {
  clearGrid();
};

document.getElementById('random').onclick = () => {
  clearGrid();       // reset grid and place player randomly
  randomObstacles(); // then add new random obstacles
};

function clearGrid(reposition = true) {
  grid.flat().forEach(n => {
    n.obstacle = false;
    n.g = Infinity; n.h = 0; n.f = Infinity; n.prev = null; n.closed = false;
    n.el.className = 'cell';
  });
  if (reposition) placePlayerRandom();
  else updatePlayerPosition();
}

function randomObstacles(prob = 0.25) {
  grid.flat().forEach(n => {
    if (n === playerCell) return;
    if (Math.random() < prob) {
      n.obstacle = true;
      n.el.classList.add('obstacle');
    }
  });
}

function placePlayerRandom() {
  const cells = grid.flat().filter(n => !n.obstacle);
  playerCell = cells[Math.floor(Math.random() * cells.length)];
  updatePlayerPosition();
}

function updatePlayerPosition() {
  const gridRect = gridEl.getBoundingClientRect();
  const rect = playerCell.el.getBoundingClientRect();
  player.style.left = (rect.left - gridRect.left) + 'px';
  player.style.top = (rect.top - gridRect.top) + 'px';
  player.style.display = 'flex';
}

function heuristic(a, b) { return Math.hypot(a.i - b.i, a.j - b.j); }

async function runTo(dest) {
  if (playerCell === dest) return;
  const mode = document.querySelector('input[name="dirs"]:checked').value;
  animating = true;
  const path = await aStar(playerCell, dest, mode);
  animating = false;
  if (path) {
    await animatePath(path);
    playerCell = dest;
  }
}

async function aStar(start, end, mode) {
  const dirs = mode === '8' ? DIRS8 : DIRS4;
  grid.flat().forEach(n => {
    n.g = Infinity; n.h = 0; n.f = Infinity; n.prev = null; n.closed = false;
    n.el.classList.remove('open','closed','path');
  });
  const openSet = [];
  start.g = 0; start.h = heuristic(start, end); start.f = start.h;
  openSet.push(start);

  while (openSet.length) {
    openSet.sort((a,b) => a.f - b.f);
    const cur = openSet.shift();
    if (cur.closed) continue;
    if (cur !== start && cur !== end) cur.el.classList.replace('open','closed');
    cur.closed = true;
    if (cur === end) return reconstruct(cur);

    for (const {dx,dy,cost} of dirs) {
      const ni = cur.i + dx, nj = cur.j + dy;
      if (ni < 0 || ni >= rows || nj < 0 || nj >= cols) continue;
      const nb = grid[ni][nj];
      if (nb.obstacle || nb.closed) continue;
      const gNew = cur.g + cost;
      if (gNew < nb.g) {
        nb.g = gNew; nb.h = heuristic(nb,end); nb.f = nb.g + nb.h; nb.prev = cur;
        if (!openSet.includes(nb)) {
          openSet.push(nb);
          if (nb !== end) nb.el.classList.add('open');
        }
      }
    }
    await new Promise(r => setTimeout(r, parseInt(speedControl.value)));
  }
  alert('Không tìm thấy đường!');
  return null;
}

function reconstruct(endNode) {
  const path = [];
  let cur = endNode;
  while (cur.prev) {
    if (cur !== playerCell && cur !== endNode) cur.el.classList.add('path');
    path.push(cur);
    cur = cur.prev;
  }
  return path.reverse();
}

async function animatePath(path) {
  const gridRect = gridEl.getBoundingClientRect();
  updatePlayerPosition();
  for (const node of path) {
    const rect = node.el.getBoundingClientRect();
    player.style.left = (rect.left - gridRect.left) + 'px';
    player.style.top = (rect.top - gridRect.top) + 'px';
    await new Promise(r => setTimeout(r, 100));
  }
}
