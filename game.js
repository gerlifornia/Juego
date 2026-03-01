const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreNode = document.getElementById("score");
const timeNode = document.getElementById("time");
const messageNode = document.getElementById("message");
const restartButton = document.getElementById("restart");
const controlButtons = document.querySelectorAll(".ctrl");

const TILE = 16;
const STEP_MS = 130;

const map = [
  "11111111111111111111",
  "10000000000000000001",
  "10111110111111101101",
  "10100010100000101001",
  "10100010101110101001",
  "10100010100010101001",
  "10111010111010101101",
  "10001010000010100001",
  "10101011111010101101",
  "10100000000000100001",
  "11111111111111111111",
];

const MAP_W = map[0].length;
const MAP_H = map.length;

canvas.width = MAP_W * TILE;
canvas.height = MAP_H * TILE;

const palette = {
  grass1: "#2d6a4f",
  grass2: "#1b4332",
  rock: "#4a4e69",
  crystal: "#8be9fd",
  hero: "#ff8fab",
  heroCape: "#ffd166",
  shadow: "rgba(0,0,0,0.35)",
};

const crystalsBase = [
  { x: 2, y: 1 },
  { x: 18, y: 2 },
  { x: 10, y: 4 },
  { x: 4, y: 7 },
  { x: 16, y: 9 },
];

const hero = {
  x: 1,
  y: 1,
  pixelX: TILE,
  pixelY: TILE,
};

let crystals = [];
let score = 0;
let won = false;
let start = performance.now();
let lastStep = 0;
let last = performance.now();
let activeDirection = null;

function resetGame() {
  hero.x = 1;
  hero.y = 1;
  hero.pixelX = TILE;
  hero.pixelY = TILE;
  crystals = crystalsBase.map((c) => ({
    ...c,
    taken: false,
    bob: Math.random() * Math.PI * 2,
  }));
  score = 0;
  won = false;
  start = performance.now();
  lastStep = 0;
  activeDirection = null;
  messageNode.textContent = "Presiona una dirección para empezar.";
}

function isWall(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
  return map[y][x] === "1";
}

function tryMove(dx, dy) {
  if (won) return;
  const nx = hero.x + dx;
  const ny = hero.y + dy;
  if (!isWall(nx, ny)) {
    hero.x = nx;
    hero.y = ny;
  }
}

function directionDelta(direction) {
  switch (direction) {
    case "up":
      return [0, -1];
    case "down":
      return [0, 1];
    case "left":
      return [-1, 0];
    case "right":
      return [1, 0];
    default:
      return [0, 0];
  }
}

function update(dt, now) {
  if (activeDirection && !won) {
    if (lastStep === 0 || now - lastStep >= STEP_MS) {
      const [dx, dy] = directionDelta(activeDirection);
      tryMove(dx, dy);
      lastStep = now;
      messageNode.textContent = "Recolecta todos los cristales.";
    }
  }

  crystals.forEach((c) => {
    c.bob += dt * 0.005;
    if (!c.taken && c.x === hero.x && c.y === hero.y) {
      c.taken = true;
      score += 1;
      messageNode.textContent = "¡Buen trabajo! Sigue recolectando.";
      if (score === crystals.length) {
        won = true;
        const total = ((performance.now() - start) / 1000).toFixed(1);
        messageNode.textContent = `¡Ganaste! Tiempo final: ${total}s. Usa Reiniciar para jugar otra vez.`;
      }
    }
  });

  hero.pixelX += (hero.x * TILE - hero.pixelX) * Math.min(1, dt * 0.02);
  hero.pixelY += (hero.y * TILE - hero.pixelY) * Math.min(1, dt * 0.02);

  const elapsed = ((performance.now() - start) / 1000).toFixed(1);
  timeNode.textContent = `${elapsed}s`;
  scoreNode.textContent = `${score} / ${crystals.length}`;
}

function drawTile(x, y, ch) {
  const px = x * TILE;
  const py = y * TILE;

  if (ch === "1") {
    ctx.fillStyle = palette.rock;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "#22223b";
    ctx.fillRect(px + 3, py + 3, 10, 10);
    return;
  }

  ctx.fillStyle = (x + y) % 2 ? palette.grass1 : palette.grass2;
  ctx.fillRect(px, py, TILE, TILE);

  if ((x + y) % 3 === 0) {
    ctx.fillStyle = "#3a7d5c";
    ctx.fillRect(px + 10, py + 2, 3, 3);
  }
}

function drawCrystal(c) {
  if (c.taken) return;
  const px = c.x * TILE + 4;
  const py = c.y * TILE + 4 + Math.sin(c.bob) * 2;
  ctx.fillStyle = palette.shadow;
  ctx.fillRect(c.x * TILE + 4, c.y * TILE + 11, 8, 2);
  ctx.fillStyle = palette.crystal;
  ctx.fillRect(px + 2, py, 4, 8);
  ctx.fillRect(px, py + 2, 8, 4);
}

function drawHero() {
  ctx.fillStyle = palette.shadow;
  ctx.fillRect(hero.pixelX + 2, hero.pixelY + 13, 12, 2);

  ctx.fillStyle = palette.heroCape;
  ctx.fillRect(hero.pixelX + 3, hero.pixelY + 5, 10, 8);

  ctx.fillStyle = palette.hero;
  ctx.fillRect(hero.pixelX + 4, hero.pixelY + 2, 8, 10);
  ctx.fillStyle = "#ffe5ec";
  ctx.fillRect(hero.pixelX + 6, hero.pixelY + 4, 2, 2);
  ctx.fillRect(hero.pixelX + 10, hero.pixelY + 4, 2, 2);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < MAP_H; y += 1) {
    for (let x = 0; x < MAP_W; x += 1) {
      drawTile(x, y, map[y][x]);
    }
  }

  crystals.forEach(drawCrystal);
  drawHero();

  if (won) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffd166";
    ctx.font = "14px monospace";
    ctx.fillText("¡Nivel completado!", 110, 80);
    ctx.fillText("Pulsa Reiniciar para otra ronda", 56, 100);
  }
}

function loop(now) {
  const dt = now - last;
  last = now;
  update(dt, now);
  draw();
  requestAnimationFrame(loop);
}

function setDirection(direction) {
  activeDirection = direction;
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key === "w" || key === "arrowup") setDirection("up");
  if (key === "s" || key === "arrowdown") setDirection("down");
  if (key === "a" || key === "arrowleft") setDirection("left");
  if (key === "d" || key === "arrowright") setDirection("right");

  if (key === "r") resetGame();
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (
    ["w", "arrowup", "s", "arrowdown", "a", "arrowleft", "d", "arrowright"].includes(
      key,
    )
  ) {
    activeDirection = null;
  }
});

controlButtons.forEach((button) => {
  const direction = button.dataset.dir;

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    setDirection(direction);
    button.classList.add("active");
  });

  ["pointerup", "pointercancel", "pointerleave"].forEach((type) => {
    button.addEventListener(type, () => {
      activeDirection = null;
      button.classList.remove("active");
    });
  });
});

restartButton.addEventListener("click", resetGame);

resetGame();
requestAnimationFrame(loop);
