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

let startCell = null, endCell = null;
let drawing = false;
const gridEl = document.getElementById('grid');
const speedControl = document.getElementById('speed');
const player = document.getElementById('player');
const grid = [];

// Khởi tạo lưới
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

// Đặt Start/End bằng click phải
gridEl.addEventListener('contextmenu', e => {
  e.preventDefault();
  const el = e.target;
  if (!el.classList.contains('cell')) return;
  const node = grid[+el.dataset.i][+el.dataset.j];
  if (!startCell) {
    startCell = node; startCell.el.classList.add('start');
  } else if (!endCell) {
    endCell = node; endCell.el.classList.add('end');
  }
});

// Vẽ chướng ngại vật bằng giữ chuột trái
gridEl.addEventListener('mousedown', e => { if (e.button===0) { drawing=true; toggleObs(e.target); } });
gridEl.addEventListener('mousemove', e => { if (drawing) toggleObs(e.target); });
document.addEventListener('mouseup', () => drawing = false);

function toggleObs(el) {
  if (!el.classList.contains('cell')) return;
  const node = grid[+el.dataset.i][+el.dataset.j];
  if (node === startCell || node === endCell) return;
  node.obstacle = true; node.el.classList.add('obstacle');
}

document.getElementById('clear').onclick = () => {
  startCell = endCell = null;
  grid.flat().forEach(n => {
    n.obstacle=false; n.g=Infinity; n.h=0; n.f=Infinity; n.prev=null; n.closed=false;
    n.el.className='cell';
  });
  player.style.display = 'none';
};

document.getElementById('run').onclick = () => {
  if (!startCell || !endCell) return alert('Chưa đặt Start/End!');
  const mode = document.querySelector('input[name="dirs"]:checked').value;
  aStar(mode);
};

function heuristic(a, b) { return Math.hypot(a.i-b.i, a.j-b.j); }

async function aStar(mode) {
  const dirs = mode === '8' ? DIRS8 : DIRS4;
  grid.flat().forEach(n => { n.g=Infinity; n.h=0; n.f=Infinity; n.prev=null; n.closed=false;
    n.el.classList.remove('open','closed','path');
  });
  player.style.display = 'none';
  const openSet = [];
  startCell.g=0; startCell.h=heuristic(startCell,endCell); startCell.f= startCell.h;
  openSet.push(startCell);

  while (openSet.length) {
    openSet.sort((a,b)=>a.f-b.f);
    const cur = openSet.shift();
    if (cur.closed) continue;
    if (cur!==startCell && cur!==endCell) cur.el.classList.replace('open','closed');
    cur.closed = true;
    if (cur===endCell) return reconstruct(cur);

    for (const {dx,dy,cost} of dirs) {
      const ni=cur.i+dx, nj=cur.j+dy;
      if (ni<0||ni>=rows||nj<0||nj>=cols) continue;
      const nb = grid[ni][nj]; if (nb.obstacle||nb.closed) continue;
      const gNew = cur.g + cost;
      if (gNew < nb.g) {
        nb.g = gNew; nb.h = heuristic(nb,endCell); nb.f = nb.g + nb.h; nb.prev = cur;
        if (!openSet.includes(nb)) {
          openSet.push(nb);
          if (nb!==endCell) nb.el.classList.add('open');
        }
      }
    }
    await new Promise(r => setTimeout(r, parseInt(speedControl.value)));
  }
  alert('Không tìm thấy đường!');
}

function reconstruct(endNode) {
  const path = [];
  let cur = endNode;
  while (cur.prev) {
    if (cur!==startCell && cur!==endCell) cur.el.classList.add('path');
    path.push(cur);
    cur = cur.prev;
  }
  path.reverse();
  animatePath(path);
}

function animatePath(path) {
  if (!player) return;
  const gridRect = gridEl.getBoundingClientRect();
  const startRect = startCell.el.getBoundingClientRect();
  player.style.left = (startRect.left - gridRect.left) + 'px';
  player.style.top = (startRect.top - gridRect.top) + 'px';
  player.style.display = 'flex';
  (async () => {
    for (const node of path) {
      const rect = node.el.getBoundingClientRect();
      player.style.left = (rect.left - gridRect.left) + 'px';
      player.style.top = (rect.top - gridRect.top) + 'px';
      await new Promise(r => setTimeout(r, 100));
    }
  })();
}
