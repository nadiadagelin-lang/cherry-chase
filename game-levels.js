const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayKicker = document.getElementById("overlay-kicker");
const overlayTitle = document.getElementById("overlay-title");
const overlayMessage = document.getElementById("overlay-message");
const overlayHint = document.querySelector(".overlay-hint");
const scoreValue = document.getElementById("score");
const levelValue = document.getElementById("level");
const levelNameValue = document.getElementById("level-name");

const TILE_SIZE = 32;
const LEVELS = [
  {
    name: "Velvet Hall",
    enemySpeed: 156,
    map: [
      "###################",
      "#P................#",
      "#.#####.###.#####.#",
      "#.....#...#.#.....#",
      "###.#.###.#.#.###.#",
      "#...#.....#.#...#.#",
      "#.#######.#.###.#.#",
      "#.#.......#...#...#",
      "#.#.#########.#.###",
      "#.#.....#.....#...#",
      "#.###.#.#.#######.#",
      "#.....#.#.......#.#",
      "#.#####.#######.#.#",
      "#..............E..#",
      "###################"
    ]
  },
  {
    name: "Midnight Turn",
    enemySpeed: 168,
    map: [
      "###################",
      "#P........#.......#",
      "#.#####.#.#.#####.#",
      "#.#...#.#.#.....#.#",
      "#.#.#.#.#.#####.#.#",
      "#...#...#...#...#.#",
      "###.#######.#.###.#",
      "#...#.....#.#.....#",
      "#.###.###.#.#####.#",
      "#.#...#.#.#.....#.#",
      "#.#.###.#.#.#####.#",
      "#.#.....#.#.....#.#",
      "#.#####.#.#####.#.#",
      "#.......#.....E...#",
      "###################"
    ]
  },
  {
    name: "Final Vault",
    enemySpeed: 182,
    map: [
      "###################",
      "#P.......#........#",
      "#.#####.#.#.#####.#",
      "#.....#.#.#.#.....#",
      "###.#.#.#.#.#.###.#",
      "#...#...#...#...#.#",
      "#.#######.#####.#.#",
      "#.#.....#.....#.#.#",
      "#.#.###.#####.#.###",
      "#...#.#...#...#...#",
      "###.#.###.#.#####.#",
      "#...#.....#.....#.#",
      "#.#####.#######.#.#",
      "#..............E..#",
      "###################"
    ]
  }
];

const COLORS = {
  board: "#12040a",
  lane: "rgba(255, 255, 255, 0.025)",
  wallOuter: "#74253d",
  wallInner: "#3a0d1d",
  wallGlow: "rgba(255, 91, 121, 0.1)",
  cherry: "#ff335c",
  cherryDark: "#d41f45",
  stem: "#8ada6d",
  player: "#ffe172",
  enemy: "#ff8b6a",
  enemyShadow: "#af3f4a",
  eye: "#fff6fa",
  pupil: "#231016",
  scoreFlash: "#fff7c2"
};

const DIRECTIONS = {
  up: { x: 0, y: -1, name: "up" },
  down: { x: 0, y: 1, name: "down" },
  left: { x: -1, y: 0, name: "left" },
  right: { x: 1, y: 0, name: "right" }
};

const DIRECTION_LIST = [DIRECTIONS.up, DIRECTIONS.left, DIRECTIONS.down, DIRECTIONS.right];
const REVERSE = {
  up: "down",
  down: "up",
  left: "right",
  right: "left"
};

const KEY_TO_DIRECTION = {
  ArrowUp: DIRECTIONS.up,
  ArrowDown: DIRECTIONS.down,
  ArrowLeft: DIRECTIONS.left,
  ArrowRight: DIRECTIONS.right,
  w: DIRECTIONS.up,
  s: DIRECTIONS.down,
  a: DIRECTIONS.left,
  d: DIRECTIONS.right,
  W: DIRECTIONS.up,
  S: DIRECTIONS.down,
  A: DIRECTIONS.left,
  D: DIRECTIONS.right
};

const game = {
  state: "start",
  score: 0,
  levelIndex: 0,
  level: null,
  cherries: new Set(),
  totalCherries: 0,
  player: null,
  enemy: null,
  queuedDirection: null,
  lastTimestamp: 0,
  animationTime: 0
};

function parseMap(layout) {
  const cherries = new Set();
  const width = layout[0].length;
  let playerSpawn = null;
  let enemySpawn = null;

  layout.forEach((line, row) => {
    if (line.length !== width) {
      throw new Error("Every map row must use the same width.");
    }

    [...line].forEach((cell, col) => {
      if (cell === ".") {
        cherries.add(tileKey(row, col));
      } else if (cell === "P") {
        playerSpawn = { row, col };
      } else if (cell === "E") {
        enemySpawn = { row, col };
      }
    });
  });

  if (!playerSpawn || !enemySpawn) {
    throw new Error("Map requires player and enemy spawn points.");
  }

  return {
    layout,
    width,
    height: layout.length,
    cherries,
    playerSpawn,
    enemySpawn
  };
}

function createEntity(spawn, speed) {
  return {
    row: spawn.row,
    col: spawn.col,
    x: tileCenterX(spawn.col),
    y: tileCenterY(spawn.row),
    targetRow: spawn.row,
    targetCol: spawn.col,
    direction: { x: 0, y: 0, name: "none" },
    isMoving: false,
    speed
  };
}

function tileKey(row, col) {
  return `${row},${col}`;
}

function tileCenterX(col) {
  return col * TILE_SIZE + TILE_SIZE / 2;
}

function tileCenterY(row) {
  return row * TILE_SIZE + TILE_SIZE / 2;
}

function updateScore() {
  scoreValue.textContent = String(game.score);
}

function updateLevelHud() {
  levelValue.textContent = `${game.levelIndex + 1} / ${LEVELS.length}`;
  levelNameValue.textContent = game.level.name;
}

function showOverlay(kicker, title, message, hint) {
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  overlayHint.textContent = hint;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function applyLevel(levelIndex, resetScore) {
  const levelConfig = LEVELS[levelIndex];
  const board = parseMap(levelConfig.map);

  if (resetScore) {
    game.score = 0;
  }

  game.levelIndex = levelIndex;
  game.level = {
    ...board,
    name: levelConfig.name,
    enemySpeed: levelConfig.enemySpeed
  };
  game.totalCherries = board.cherries.size;
  game.cherries = new Set(board.cherries);
  game.player = createEntity(board.playerSpawn, 178);
  game.enemy = createEntity(board.enemySpawn, levelConfig.enemySpeed);
  game.queuedDirection = null;

  canvas.width = board.width * TILE_SIZE;
  canvas.height = board.height * TILE_SIZE;

  updateScore();
  updateLevelHud();
}

function startNewGame() {
  applyLevel(0, true);
  game.state = "playing";
  hideOverlay();
}

function startNextLevel() {
  applyLevel(game.levelIndex + 1, false);
  game.state = "playing";
  hideOverlay();
}

function clearLevel() {
  if (game.levelIndex === LEVELS.length - 1) {
    game.state = "finished";
    showOverlay(
      "Cherry Crown",
      "All Mazes Cleared",
      `You cleared all ${LEVELS.length} mazes with ${game.score} points.`,
      "Press Enter or Space to play again from Level 1"
    );
    return;
  }

  const nextLevel = LEVELS[game.levelIndex + 1];
  game.state = "level-clear";
  showOverlay(
    `Level ${game.levelIndex + 1} Clear`,
    `${game.level.name} Complete`,
    `Score: ${game.score}. Next up is ${nextLevel.name}.`,
    "Press Enter or Space for the next maze"
  );
}

function loseRound() {
  game.state = "lost";
  showOverlay(
    `Caught On Level ${game.levelIndex + 1}`,
    "Watcher Wins",
    `${game.level.name} got the better of you. Score: ${game.score}.`,
    "Press Enter or Space to restart from Level 1"
  );
}

function isWalkable(row, col) {
  return (
    game.level.layout[row] &&
    game.level.layout[row][col] &&
    game.level.layout[row][col] !== "#"
  );
}

function canMoveFrom(row, col, direction) {
  if (!direction || direction.name === "none") {
    return false;
  }

  return isWalkable(row + direction.y, col + direction.x);
}

function choosePlayerDirection(entity) {
  if (game.queuedDirection && canMoveFrom(entity.row, entity.col, game.queuedDirection)) {
    return game.queuedDirection;
  }

  if (canMoveFrom(entity.row, entity.col, entity.direction)) {
    return entity.direction;
  }

  return null;
}

function chooseEnemyDirection(entity) {
  const validDirections = DIRECTION_LIST.filter((direction) => canMoveFrom(entity.row, entity.col, direction));
  if (validDirections.length === 0) {
    return null;
  }

  if (canMoveFrom(entity.row, entity.col, entity.direction)) {
    return entity.direction;
  }

  const reverseName = REVERSE[entity.direction.name];
  const nonReverse = validDirections.filter((direction) => direction.name !== reverseName);
  const options = nonReverse.length > 0 ? nonReverse : validDirections;
  return options[Math.floor(Math.random() * options.length)];
}

function moveEntity(entity, dt, getDirection) {
  let remaining = entity.speed * dt;

  while (remaining > 0) {
    if (!entity.isMoving) {
      const nextDirection = getDirection(entity);
      if (!nextDirection) {
        entity.direction = { x: 0, y: 0, name: "none" };
        break;
      }

      entity.direction = nextDirection;
      entity.targetRow = entity.row + nextDirection.y;
      entity.targetCol = entity.col + nextDirection.x;
      entity.isMoving = true;
    }

    const targetX = tileCenterX(entity.targetCol);
    const targetY = tileCenterY(entity.targetRow);
    const deltaX = targetX - entity.x;
    const deltaY = targetY - entity.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance === 0) {
      entity.row = entity.targetRow;
      entity.col = entity.targetCol;
      entity.isMoving = false;
      continue;
    }

    const step = Math.min(remaining, distance);
    entity.x += (deltaX / distance) * step;
    entity.y += (deltaY / distance) * step;
    remaining -= step;

    if (step === distance) {
      entity.x = targetX;
      entity.y = targetY;
      entity.row = entity.targetRow;
      entity.col = entity.targetCol;
      entity.isMoving = false;
    }
  }
}

function collectCherry() {
  const key = tileKey(game.player.row, game.player.col);
  if (!game.cherries.has(key)) {
    return;
  }

  game.cherries.delete(key);
  game.score += 10;
  updateScore();

  if (game.cherries.size === 0) {
    clearLevel();
  }
}

function playerCaught() {
  const distance = Math.hypot(game.player.x - game.enemy.x, game.player.y - game.enemy.y);
  return distance < TILE_SIZE * 0.56;
}

function update(dt) {
  if (game.state !== "playing") {
    return;
  }

  moveEntity(game.player, dt, choosePlayerDirection);
  collectCherry();

  if (game.state !== "playing") {
    return;
  }

  moveEntity(game.enemy, dt, chooseEnemyDirection);

  if (playerCaught()) {
    loseRound();
  }
}

function drawRoundedRect(x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const boardGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  boardGradient.addColorStop(0, "#1a0710");
  boardGradient.addColorStop(1, COLORS.board);
  ctx.fillStyle = boardGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.strokeStyle = COLORS.lane;
  ctx.lineWidth = 1;

  for (let row = 1; row < game.level.height; row += 1) {
    ctx.beginPath();
    ctx.moveTo(0, row * TILE_SIZE + 0.5);
    ctx.lineTo(canvas.width, row * TILE_SIZE + 0.5);
    ctx.stroke();
  }

  for (let col = 1; col < game.level.width; col += 1) {
    ctx.beginPath();
    ctx.moveTo(col * TILE_SIZE + 0.5, 0);
    ctx.lineTo(col * TILE_SIZE + 0.5, canvas.height);
    ctx.stroke();
  }

  ctx.restore();

  game.level.layout.forEach((line, row) => {
    [...line].forEach((cell, col) => {
      if (cell !== "#") {
        return;
      }

      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;

      ctx.save();
      ctx.shadowColor = COLORS.wallGlow;
      ctx.shadowBlur = 12;
      drawRoundedRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6, 8);
      ctx.fillStyle = COLORS.wallOuter;
      ctx.fill();

      drawRoundedRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16, 5);
      ctx.fillStyle = COLORS.wallInner;
      ctx.fill();
      ctx.restore();
    });
  });
}

function drawCherry(row, col) {
  const centerX = tileCenterX(col);
  const centerY = tileCenterY(row) + 1;

  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = COLORS.stem;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(centerX - 2, centerY - 5);
  ctx.quadraticCurveTo(centerX, centerY - 9, centerX + 4, centerY - 7);
  ctx.stroke();

  ctx.fillStyle = COLORS.cherryDark;
  ctx.beginPath();
  ctx.arc(centerX - 4, centerY, 4.5, 0, Math.PI * 2);
  ctx.arc(centerX + 3.5, centerY + 1, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.cherry;
  ctx.beginPath();
  ctx.arc(centerX - 4.5, centerY - 0.5, 3.3, 0, Math.PI * 2);
  ctx.arc(centerX + 3, centerY + 0.2, 3.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCherries() {
  game.cherries.forEach((key) => {
    const [row, col] = key.split(",").map(Number);
    drawCherry(row, col);
  });
}

function directionAngle(direction) {
  switch (direction.name) {
    case "up":
      return -Math.PI / 2;
    case "down":
      return Math.PI / 2;
    case "left":
      return Math.PI;
    case "right":
      return 0;
    default:
      return 0;
  }
}

function drawPlayer() {
  const facing = game.player.direction.name === "none" ? DIRECTIONS.right : game.player.direction;
  const angle = directionAngle(facing);
  const mouth = 0.18 + Math.abs(Math.sin(game.animationTime * 10)) * 0.28;

  ctx.save();
  ctx.fillStyle = COLORS.player;
  ctx.shadowColor = "rgba(255, 225, 114, 0.32)";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(game.player.x, game.player.y);
  ctx.arc(game.player.x, game.player.y, TILE_SIZE * 0.38, angle + mouth, angle - mouth + Math.PI * 2, false);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEnemy() {
  const x = game.enemy.x;
  const y = game.enemy.y;
  const radius = TILE_SIZE * 0.34;
  const bob = Math.sin(game.animationTime * 6) * 1.5;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.shadowColor = "rgba(255, 139, 106, 0.28)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = COLORS.enemy;

  ctx.beginPath();
  ctx.arc(0, -3, radius, Math.PI, 0, false);
  ctx.lineTo(radius, radius - 2);
  ctx.lineTo(radius * 0.45, radius * 0.45);
  ctx.lineTo(0, radius - 2);
  ctx.lineTo(-radius * 0.45, radius * 0.45);
  ctx.lineTo(-radius, radius - 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = COLORS.enemyShadow;
  ctx.fillRect(-radius, radius * 0.35, radius * 2, 4);

  ctx.fillStyle = COLORS.eye;
  ctx.beginPath();
  ctx.arc(-5, -5, 4, 0, Math.PI * 2);
  ctx.arc(5, -5, 4, 0, Math.PI * 2);
  ctx.fill();

  const pupilOffsetX = game.enemy.direction.x * 1.4;
  const pupilOffsetY = game.enemy.direction.y * 1.4;
  ctx.fillStyle = COLORS.pupil;
  ctx.beginPath();
  ctx.arc(-5 + pupilOffsetX, -5 + pupilOffsetY, 1.8, 0, Math.PI * 2);
  ctx.arc(5 + pupilOffsetX, -5 + pupilOffsetY, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawProgress() {
  const completed = game.totalCherries - game.cherries.size;
  const progress = completed / game.totalCherries;
  const barWidth = 156;
  const barHeight = 10;
  const x = canvas.width - barWidth - 18;
  const y = 16;

  drawRoundedRect(x, y, barWidth, barHeight, 999);
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fill();

  if (progress > 0) {
    drawRoundedRect(x, y, barWidth * progress, barHeight, 999);
    ctx.fillStyle = progress === 1 ? COLORS.scoreFlash : COLORS.cherry;
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255, 242, 244, 0.78)";
  ctx.font = '12px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = "left";
  ctx.fillText("Cherries", x, y - 6);
}

function drawScene() {
  drawBoard();
  drawCherries();
  drawPlayer();
  drawEnemy();
  drawProgress();
}

function frame(timestamp) {
  const seconds = timestamp / 1000;
  if (!game.lastTimestamp) {
    game.lastTimestamp = seconds;
  }

  const dt = Math.min(seconds - game.lastTimestamp, 0.05);
  game.lastTimestamp = seconds;
  game.animationTime += dt;

  update(dt);
  drawScene();
  window.requestAnimationFrame(frame);
}

document.addEventListener("keydown", (event) => {
  if (event.key in KEY_TO_DIRECTION || event.key === " " || event.key === "Enter") {
    event.preventDefault();
  }

  if (event.key === " " || event.key === "Enter") {
    if (game.state === "start" || game.state === "lost" || game.state === "finished") {
      startNewGame();
    } else if (game.state === "level-clear") {
      startNextLevel();
    }
    return;
  }

  const direction = KEY_TO_DIRECTION[event.key];
  if (!direction) {
    return;
  }

  game.queuedDirection = direction;
});

applyLevel(0, true);
showOverlay(
  "3-Level Run",
  "Cherry Chase",
  "Collect every cherry and stay away from the watcher across three mazes.",
  "Press Enter or Space to begin"
);
window.requestAnimationFrame(frame);
