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
const powerStatusValue = document.getElementById("power-status");
const powerDetailValue = document.getElementById("power-detail");
const playerNameInput = document.getElementById("player-name");
const leaderboardList = document.getElementById("leaderboard-list");
const leaderboardHelp = document.getElementById("leaderboard-help");
const leaderboardNote = document.getElementById("leaderboard-note");
const touchControls = document.getElementById("touch-controls");
const touchActionButton = document.getElementById("touch-action");
const touchMoveButtons = Array.from(document.querySelectorAll(".touch-button[data-direction]"));

const TILE_SIZE = 32;
const PLAYER_SPEED = 178;
const POWER_DURATION = 7;
const SMALL_CHERRY_POINTS = 10;
const POWER_CHERRY_POINTS = 50;
const ENEMY_EAT_POINTS = 200;
const ENEMY_STUN_DURATION = 0.9;
const LEADERBOARD_KEY = "cherry-chase-leaderboard-v1";
const PLAYER_NAME_KEY = "cherry-chase-player-name";
const MAX_NAME_LENGTH = 10;
const APP_CONFIG = window.CHERRY_CHASE_CONFIG || {};
const SCOREBOARD_CONFIG = APP_CONFIG.scoreboard || {};
const SHARED_SCOREBOARD_ENABLED =
  SCOREBOARD_CONFIG.provider === "supabase" &&
  typeof SCOREBOARD_CONFIG.url === "string" &&
  SCOREBOARD_CONFIG.url.trim() &&
  typeof SCOREBOARD_CONFIG.anonKey === "string" &&
  SCOREBOARD_CONFIG.anonKey.trim();
const SCOREBOARD_TABLE = SCOREBOARD_CONFIG.table || "cherry_chase_scores";
const coarsePointerQuery = window.matchMedia("(pointer: coarse)");

const LEVELS = [
  {
    name: "Velvet Hall",
    enemySpeed: 156,
    map: [
      "###################",
      "#P......O.........#",
      "#.#####.###.#####.#",
      "#.....#...#.#.....#",
      "###.#.###.#.#.###.#",
      "#...#.....#.#...#.#",
      "#.#######.#.###.#.#",
      "#.#.......#...#...#",
      "#.#.#########.#.###",
      "#.#.....#.....#...#",
      "#.###.#.#.#######.#",
      "#..O..#.#.......#.#",
      "#.#####.#######.#.#",
      "#....O.F.......E..#",
      "###################"
    ]
  },
  {
    name: "Midnight Turn",
    enemySpeed: 168,
    map: [
      "###################",
      "#P....O...#.......#",
      "#.#####.#.#.#####.#",
      "#.#...#.#.#.....#.#",
      "#.#.#.#.#.#####.#.#",
      "#...#...#...#...#.#",
      "###.#######.#.###.#",
      "#...#.....#.#.....#",
      "#.###.###.#.#####.#",
      "#.#...#.#.#.....#.#",
      "#.#.###.#.#.#####.#",
      "#.#..O..#.#.....#.#",
      "#.#####.#.#####.#.#",
      "#..O.F..#....E....#",
      "###################"
    ]
  },
  {
    name: "Final Vault",
    enemySpeed: 182,
    map: [
      "###################",
      "#P...O...#....O...#",
      "#.#####.#.#.#####.#",
      "#.....#.#.#.#.....#",
      "###.#.#.#.#.#.###.#",
      "#...#...#...#...#.#",
      "#.#######.#####.#.#",
      "#.#.....#.....#.#.#",
      "#.#.###.#####.#.###",
      "#...#.#...#...#...#",
      "###.#.###.#.#####.#",
      "#..O#.....#..O..#.#",
      "#.#####.#######.#.#",
      "#....OF.......E...#",
      "###################"
    ]
  },
  {
    name: "Rose Circuit",
    enemySpeed: 194,
    map: [
      "###################",
      "#P..O....#....O...#",
      "#.###.##.#.##.###.#",
      "#...#....#....#...#",
      "###.#.#######.#.#.#",
      "#...#...#.....#.#.#",
      "#.#####.#.#####.#.#",
      "#..O..#.#...#...#.#",
      "#.###.#.###.#.###.#",
      "#.#...#...#.#.....#",
      "#.#.#####.#.#####.#",
      "#.#.....#.#.....#.#",
      "#.###.#.#.###.#.#.#",
      "#..F..#..OE...#...#",
      "###################"
    ]
  },
  {
    name: "Crimson Maze",
    enemySpeed: 204,
    map: [
      "###################",
      "#P..O....#....O...#",
      "#.###.##.#.##.###.#",
      "#...#....#....#...#",
      "###.#.#######.#.#.#",
      "#...#...#.....#.#.#",
      "#.#####.#.#####.#.#",
      "#..O..#.#...#...#.#",
      "#.###.#.###.#.###.#",
      "#.#...#...#.#.....#",
      "#.#.#####.#.#####.#",
      "#.#..O..#.#.....#.#",
      "#.###.#.#.###.#.#.#",
      "#...E.#..F....#...#",
      "###################"
    ]
  },
  {
    name: "Royal Gauntlet",
    enemySpeed: 216,
    map: [
      "###################",
      "#P...O...#....O...#",
      "#.#####.#.#.#####.#",
      "#.....#.#.#.#.....#",
      "###.#.#.#.#.#.###.#",
      "#...#...#...#...#.#",
      "#.#######.#####.#.#",
      "#.#..O..#.....#.#.#",
      "#.#.###.#####.#.###",
      "#...#.#...#...#...#",
      "###.#.###.#.#####.#",
      "#..O#.....#..O..#.#",
      "#.#####.#######.#.#",
      "#..F..O......E....#",
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
  powerCherry: "#ff9daf",
  powerGlow: "rgba(255, 157, 175, 0.4)",
  stem: "#8ada6d",
  player: "#ffe172",
  frightened: "#65b6ff",
  frightenedShadow: "#215a91",
  eye: "#fff6fa",
  pupil: "#231016",
  scoreFlash: "#fff7c2"
};

const ENEMY_THEMES = [
  { body: "#ff8b6a", shadow: "#af3f4a" },
  { body: "#ffc36b", shadow: "#9a5e1c" }
];

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
  powerCherries: new Set(),
  totalCollectibles: 0,
  player: null,
  enemies: [],
  queuedDirection: null,
  powerModeRemaining: 0,
  enemyCombo: 0,
  scoreSaved: false,
  lastTimestamp: 0,
  animationTime: 0
};

function parseMap(layout) {
  const cherries = new Set();
  const powerCherries = new Set();
  const enemySpawns = [];
  const width = layout[0].length;
  let playerSpawn = null;

  layout.forEach((line, row) => {
    if (line.length !== width) {
      throw new Error("Every map row must use the same width.");
    }

    [...line].forEach((cell, col) => {
      const key = tileKey(row, col);

      if (cell === ".") {
        cherries.add(key);
      } else if (cell === "O") {
        powerCherries.add(key);
      } else if (cell === "P") {
        playerSpawn = { row, col };
      } else if (cell === "E" || cell === "F") {
        enemySpawns.push({ row, col });
      }
    });
  });

  if (!playerSpawn || enemySpawns.length < 2) {
    throw new Error("Map requires one player spawn and two enemy spawns.");
  }

  return {
    layout,
    width,
    height: layout.length,
    cherries,
    powerCherries,
    playerSpawn,
    enemySpawns
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

function createEnemy(spawn, speed, theme) {
  return {
    ...createEntity(spawn, speed),
    spawn,
    baseSpeed: speed,
    body: theme.body,
    shadow: theme.shadow,
    stunTimer: 0
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

function updatePowerHud() {
  if (game.powerModeRemaining > 0) {
    powerStatusValue.textContent = `${game.powerModeRemaining.toFixed(1)}s`;
    powerDetailValue.textContent = "Blue chasers are edible";
    return;
  }

  powerStatusValue.textContent = game.powerCherries.size > 0 ? "Ready" : "Empty";
  powerDetailValue.textContent =
    game.powerCherries.size > 0 ? `${game.powerCherries.size} big cherries left` : "No power cherries left";
}

function showOverlay(kicker, title, message, hint) {
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  overlayHint.textContent = hint;
  overlay.classList.remove("hidden");
  updateTouchActionButton();
}

function hideOverlay() {
  overlay.classList.add("hidden");
  updateTouchActionButton();
}

function updateLeaderboardModeUi() {
  leaderboardNote.textContent = SHARED_SCOREBOARD_ENABLED ? "Shared online" : "Local until configured";
}

function isTouchMode() {
  return coarsePointerQuery.matches || navigator.maxTouchPoints > 0;
}

function updateTouchModeUi() {
  const touchMode = isTouchMode();
  document.body.classList.toggle("touch-mode", touchMode);
  touchControls.hidden = !touchMode;
}

function updateTouchActionButton() {
  if (game.state === "playing") {
    touchActionButton.textContent = "Play";
    touchActionButton.disabled = true;
    return;
  }

  touchActionButton.disabled = false;

  if (game.state === "level-clear") {
    touchActionButton.textContent = "Next";
  } else if (game.state === "lost" || game.state === "finished") {
    touchActionButton.textContent = "Restart";
  } else {
    touchActionButton.textContent = "Start";
  }
}

function queueDirectionByName(directionName) {
  const direction = DIRECTIONS[directionName];
  if (!direction) {
    return;
  }

  game.queuedDirection = direction;
}

function advanceGameState() {
  if (game.state === "start" || game.state === "lost" || game.state === "finished") {
    startNewGame();
    return true;
  }

  if (game.state === "level-clear") {
    startNextLevel();
    return true;
  }

  return game.state === "playing";
}

function handleTouchDirection(directionName) {
  if (game.state !== "playing" && !advanceGameState()) {
    return;
  }

  queueDirectionByName(directionName);
}

function getPlayerName() {
  return playerNameInput.value.trim().slice(0, MAX_NAME_LENGTH);
}

function setLeaderboardHelp(message) {
  leaderboardHelp.textContent = message;
}

function sortLeaderboardEntries(entries) {
  return [...entries].sort((first, second) => {
    if (second.score !== first.score) {
      return second.score - first.score;
    }
    if (second.level !== first.level) {
      return second.level - first.level;
    }
    return (first.createdAt || 0) - (second.createdAt || 0);
  });
}

function normalizeLeaderboardEntries(entries) {
  return sortLeaderboardEntries(
    entries
      .filter((entry) => entry && typeof entry.name === "string")
      .map((entry) => ({
        name: entry.name.slice(0, MAX_NAME_LENGTH),
        score: Number(entry.score) || 0,
        level: Number(entry.level) || 1,
        result: entry.result || "Played",
        createdAt: entry.createdAt || Date.parse(entry.created_at || "") || Date.now()
      }))
  );
}

function loadLocalLeaderboard() {
  try {
    const raw = window.localStorage.getItem(LEADERBOARD_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? normalizeLeaderboardEntries(parsed) : [];
  } catch {
    return [];
  }
}

function saveLocalLeaderboard(entries) {
  try {
    window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  } catch {
    setLeaderboardHelp("This browser blocked score saving, so the leaderboard cannot update here.");
  }
}

function createSupabaseHeaders() {
  return {
    apikey: SCOREBOARD_CONFIG.anonKey,
    Authorization: `Bearer ${SCOREBOARD_CONFIG.anonKey}`,
    "Content-Type": "application/json"
  };
}

async function fetchRemoteLeaderboard() {
  const response = await fetch(
    `${SCOREBOARD_CONFIG.url}/rest/v1/${SCOREBOARD_TABLE}?select=name,score,level,result,created_at`,
    {
      headers: createSupabaseHeaders()
    }
  );

  if (!response.ok) {
    throw new Error(`Leaderboard fetch failed: ${response.status}`);
  }

  const entries = await response.json();
  return normalizeLeaderboardEntries(entries);
}

async function pushRemoteScore(entry) {
  const response = await fetch(`${SCOREBOARD_CONFIG.url}/rest/v1/${SCOREBOARD_TABLE}`, {
    method: "POST",
    headers: {
      ...createSupabaseHeaders(),
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      name: entry.name,
      score: entry.score,
      level: entry.level,
      result: entry.result
    })
  });

  if (!response.ok) {
    throw new Error(`Score save failed: ${response.status}`);
  }
}

async function loadLeaderboard() {
  if (!SHARED_SCOREBOARD_ENABLED) {
    return loadLocalLeaderboard();
  }

  try {
    return await fetchRemoteLeaderboard();
  } catch {
    setLeaderboardHelp("Shared leaderboard could not load right now, so this browser is showing local scores.");
    return loadLocalLeaderboard();
  }
}

function renderLeaderboard(entries) {
  leaderboardList.innerHTML = "";

  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "leaderboard-empty";
    empty.textContent = "No scores yet. Be the first cherry hunter on the board.";
    leaderboardList.append(empty);
    return;
  }

  entries.forEach((entry, index) => {
    const item = document.createElement("li");
    item.className = "leaderboard-entry";

    const rank = document.createElement("span");
    rank.className = "leaderboard-rank";
    rank.textContent = String(index + 1);

    const identity = document.createElement("div");
    const name = document.createElement("span");
    name.className = "leaderboard-name";
    name.textContent = entry.name;
    const meta = document.createElement("span");
    meta.className = "leaderboard-meta";
    meta.textContent = `${entry.result} - Level ${entry.level}`;
    identity.append(name, meta);

    const score = document.createElement("span");
    score.className = "leaderboard-score";
    score.textContent = `${entry.score}`;

    item.append(rank, identity, score);
    leaderboardList.append(item);
  });
}

async function refreshLeaderboard() {
  const entries = await loadLeaderboard();
  renderLeaderboard(entries);
}

function savePlayerName() {
  try {
    window.localStorage.setItem(PLAYER_NAME_KEY, getPlayerName());
  } catch {
    // Ignore storage failures and keep the current session playable.
  }
}

function restorePlayerName() {
  try {
    playerNameInput.value = window.localStorage.getItem(PLAYER_NAME_KEY) || "";
  } catch {
    playerNameInput.value = "";
  }
}

function requirePlayerName() {
  if (getPlayerName()) {
    return true;
  }

  setLeaderboardHelp("Add your name first so your score can land on the leaderboard.");
  playerNameInput.focus();
  showOverlay(
    "Name Required",
    "Add Your Name",
    "Type your name in the leaderboard panel before you start a run.",
    "Then press Enter or Space to begin"
  );
  return false;
}

async function recordScore(result) {
  if (game.scoreSaved || game.score <= 0) {
    return;
  }

  const name = getPlayerName();
  if (!name) {
    setLeaderboardHelp("Your run ended, but no name was entered so the score could not be saved.");
    game.scoreSaved = true;
    return;
  }

  const entry = {
    name,
    score: game.score,
    level: game.levelIndex + 1,
    result,
    createdAt: Date.now()
  };

  try {
    if (SHARED_SCOREBOARD_ENABLED) {
      await pushRemoteScore(entry);
      setLeaderboardHelp(`Saved ${game.score} points for ${name} on the shared leaderboard.`);
    } else {
      const entries = loadLocalLeaderboard();
      entries.push(entry);
      saveLocalLeaderboard(normalizeLeaderboardEntries(entries));
      setLeaderboardHelp(
        `Saved ${game.score} points for ${name} in this browser. Add Supabase config to share it with everyone.`
      );
    }
  } catch {
    const entries = loadLocalLeaderboard();
    entries.push(entry);
    saveLocalLeaderboard(normalizeLeaderboardEntries(entries));
    setLeaderboardHelp(
      `Shared save failed, so ${game.score} points for ${name} were stored only in this browser for now.`
    );
  }

  await refreshLeaderboard();
  game.scoreSaved = true;
}

function applyLevel(levelIndex, resetScore) {
  const levelConfig = LEVELS[levelIndex];
  const board = parseMap(levelConfig.map);

  if (resetScore) {
    game.score = 0;
    game.scoreSaved = false;
  }

  game.levelIndex = levelIndex;
  game.level = {
    ...board,
    name: levelConfig.name
  };
  game.totalCollectibles = board.cherries.size + board.powerCherries.size;
  game.cherries = new Set(board.cherries);
  game.powerCherries = new Set(board.powerCherries);
  game.player = createEntity(board.playerSpawn, PLAYER_SPEED);
  game.enemies = board.enemySpawns.map((spawn, index) =>
    createEnemy(spawn, levelConfig.enemySpeed + index * 8, ENEMY_THEMES[index % ENEMY_THEMES.length])
  );
  game.queuedDirection = null;
  game.powerModeRemaining = 0;
  game.enemyCombo = 0;

  canvas.width = board.width * TILE_SIZE;
  canvas.height = board.height * TILE_SIZE;

  updateScore();
  updateLevelHud();
  updatePowerHud();
}

function startNewGame() {
  if (!requirePlayerName()) {
    return;
  }

  playerNameInput.blur();
  applyLevel(0, true);
  game.state = "playing";
  setLeaderboardHelp(`Now playing as ${getPlayerName()}.`);
  hideOverlay();
}

function startNextLevel() {
  playerNameInput.blur();
  applyLevel(game.levelIndex + 1, false);
  game.state = "playing";
  hideOverlay();
}

function clearLevel() {
  if (game.levelIndex === LEVELS.length - 1) {
    game.state = "finished";
    recordScore("Cleared All");
    showOverlay(
      "Cherry Crown",
      "All Mazes Cleared",
      `You beat both chasers through all ${LEVELS.length} mazes and scored ${game.score}.`,
      "Press Enter or Space to play again from Level 1"
    );
    return;
  }

  const nextLevel = LEVELS[game.levelIndex + 1];
  game.state = "level-clear";
  showOverlay(
    `Level ${game.levelIndex + 1} Clear`,
    `${game.level.name} Complete`,
    `Score: ${game.score}. Two chasers are waiting in ${nextLevel.name}.`,
    "Press Enter or Space for the next maze"
  );
}

function loseRound() {
  game.state = "lost";
  recordScore("Caught");
  showOverlay(
    `Caught On Level ${game.levelIndex + 1}`,
    "The Chasers Won",
    `${game.level.name} closed in on you. Use the big cherries to turn the hunt around. Score: ${game.score}.`,
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

  const reverseName = REVERSE[entity.direction.name];
  const nonReverse = validDirections.filter((direction) => direction.name !== reverseName);
  const options = nonReverse.length > 0 ? nonReverse : validDirections;

  if (game.powerModeRemaining > 0) {
    return options[Math.floor(Math.random() * options.length)];
  }

  if (canMoveFrom(entity.row, entity.col, entity.direction)) {
    return entity.direction;
  }

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

function remainingCollectibles() {
  return game.cherries.size + game.powerCherries.size;
}

function activatePowerMode() {
  game.powerModeRemaining = POWER_DURATION;
  game.enemyCombo = 0;
  updatePowerHud();
}

function eatEnemy(enemy) {
  const bonus = ENEMY_EAT_POINTS * (game.enemyCombo + 1);
  game.enemyCombo += 1;
  game.score += bonus;
  updateScore();

  enemy.row = enemy.spawn.row;
  enemy.col = enemy.spawn.col;
  enemy.x = tileCenterX(enemy.spawn.col);
  enemy.y = tileCenterY(enemy.spawn.row);
  enemy.targetRow = enemy.spawn.row;
  enemy.targetCol = enemy.spawn.col;
  enemy.direction = { x: 0, y: 0, name: "none" };
  enemy.isMoving = false;
  enemy.stunTimer = ENEMY_STUN_DURATION;
}

function collectAtPlayer() {
  const key = tileKey(game.player.row, game.player.col);
  let changed = false;

  if (game.powerCherries.has(key)) {
    game.powerCherries.delete(key);
    game.score += POWER_CHERRY_POINTS;
    activatePowerMode();
    changed = true;
  } else if (game.cherries.has(key)) {
    game.cherries.delete(key);
    game.score += SMALL_CHERRY_POINTS;
    changed = true;
  }

  if (!changed) {
    return;
  }

  updateScore();
  updatePowerHud();

  if (remainingCollectibles() === 0) {
    clearLevel();
  }
}

function handleEnemyCollisions() {
  for (const enemy of game.enemies) {
    if (enemy.stunTimer > 0) {
      continue;
    }

    const distance = Math.hypot(game.player.x - enemy.x, game.player.y - enemy.y);
    if (distance >= TILE_SIZE * 0.56) {
      continue;
    }

    if (game.powerModeRemaining > 0) {
      eatEnemy(enemy);
      continue;
    }

    loseRound();
    return true;
  }

  return false;
}

function updatePowerMode(dt) {
  if (game.powerModeRemaining <= 0) {
    return;
  }

  game.powerModeRemaining = Math.max(0, game.powerModeRemaining - dt);
  if (game.powerModeRemaining === 0) {
    game.enemyCombo = 0;
  }
  updatePowerHud();
}

function updateEnemies(dt) {
  for (const enemy of game.enemies) {
    if (enemy.stunTimer > 0) {
      enemy.stunTimer = Math.max(0, enemy.stunTimer - dt);
      continue;
    }

    enemy.speed = game.powerModeRemaining > 0 ? enemy.baseSpeed * 0.72 : enemy.baseSpeed;
    moveEntity(enemy, dt, chooseEnemyDirection);
  }
}

function update(dt) {
  if (game.state !== "playing") {
    return;
  }

  updatePowerMode(dt);
  moveEntity(game.player, dt, choosePlayerDirection);
  collectAtPlayer();

  if (game.state !== "playing") {
    return;
  }

  if (handleEnemyCollisions()) {
    return;
  }

  updateEnemies(dt);
  handleEnemyCollisions();
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

function drawCherry(row, col, radiusScale, glowColor) {
  const centerX = tileCenterX(col);
  const centerY = tileCenterY(row) + 1;

  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = COLORS.stem;
  ctx.lineWidth = 2;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = radiusScale > 1 ? 16 : 0;

  ctx.beginPath();
  ctx.moveTo(centerX - 2 * radiusScale, centerY - 5 * radiusScale);
  ctx.quadraticCurveTo(centerX, centerY - 9 * radiusScale, centerX + 4 * radiusScale, centerY - 7 * radiusScale);
  ctx.stroke();

  ctx.fillStyle = COLORS.cherryDark;
  ctx.beginPath();
  ctx.arc(centerX - 4 * radiusScale, centerY, 4.5 * radiusScale, 0, Math.PI * 2);
  ctx.arc(centerX + 3.5 * radiusScale, centerY + radiusScale, 4.5 * radiusScale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = radiusScale > 1 ? COLORS.powerCherry : COLORS.cherry;
  ctx.beginPath();
  ctx.arc(centerX - 4.5 * radiusScale, centerY - 0.5 * radiusScale, 3.3 * radiusScale, 0, Math.PI * 2);
  ctx.arc(centerX + 3 * radiusScale, centerY + 0.2 * radiusScale, 3.3 * radiusScale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCollectibles() {
  game.cherries.forEach((key) => {
    const [row, col] = key.split(",").map(Number);
    drawCherry(row, col, 1, "transparent");
  });

  const pulse = 1.35 + Math.sin(game.animationTime * 8) * 0.12;
  game.powerCherries.forEach((key) => {
    const [row, col] = key.split(",").map(Number);
    drawCherry(row, col, pulse, COLORS.powerGlow);
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

function drawEnemy(enemy) {
  const radius = TILE_SIZE * 0.34;
  const bob = Math.sin(game.animationTime * 6 + enemy.spawn.col) * 1.5;
  const flashing =
    game.powerModeRemaining > 0 &&
    game.powerModeRemaining < 1.8 &&
    Math.floor(game.animationTime * 8) % 2 === 0;
  const isFrightened = game.powerModeRemaining > 0 && enemy.stunTimer <= 0;
  const bodyColor = isFrightened ? (flashing ? COLORS.scoreFlash : COLORS.frightened) : enemy.body;
  const shadowColor = isFrightened ? COLORS.frightenedShadow : enemy.shadow;

  ctx.save();
  ctx.translate(enemy.x, enemy.y + bob);
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = 10;
  ctx.fillStyle = bodyColor;

  ctx.beginPath();
  ctx.arc(0, -3, radius, Math.PI, 0, false);
  ctx.lineTo(radius, radius - 2);
  ctx.lineTo(radius * 0.45, radius * 0.45);
  ctx.lineTo(0, radius - 2);
  ctx.lineTo(-radius * 0.45, radius * 0.45);
  ctx.lineTo(-radius, radius - 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = shadowColor;
  ctx.fillRect(-radius, radius * 0.35, radius * 2, 4);

  ctx.fillStyle = COLORS.eye;
  ctx.beginPath();
  ctx.arc(-5, -5, 4, 0, Math.PI * 2);
  ctx.arc(5, -5, 4, 0, Math.PI * 2);
  ctx.fill();

  const pupilOffsetX = enemy.direction.x * 1.4;
  const pupilOffsetY = enemy.direction.y * 1.4;
  ctx.fillStyle = COLORS.pupil;
  ctx.beginPath();
  ctx.arc(-5 + pupilOffsetX, -5 + pupilOffsetY, 1.8, 0, Math.PI * 2);
  ctx.arc(5 + pupilOffsetX, -5 + pupilOffsetY, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawProgress() {
  const collected = game.totalCollectibles - remainingCollectibles();
  const progress = collected / game.totalCollectibles;
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
  drawCollectibles();
  drawPlayer();
  game.enemies.forEach(drawEnemy);
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
  const isTypingField =
    event.target instanceof HTMLElement &&
    (event.target.tagName === "INPUT" ||
      event.target.tagName === "TEXTAREA" ||
      event.target.isContentEditable);

  if (isTypingField) {
    if (
      event.target === playerNameInput &&
      event.key === "Enter" &&
      (game.state === "start" || game.state === "lost" || game.state === "finished")
    ) {
      event.preventDefault();
      startNewGame();
    }
    return;
  }

  if (event.key in KEY_TO_DIRECTION || event.key === " " || event.key === "Enter") {
    event.preventDefault();
  }

  if (event.key === " " || event.key === "Enter") {
    advanceGameState();
    return;
  }

  const direction = KEY_TO_DIRECTION[event.key];
  if (!direction) {
    return;
  }

  queueDirectionByName(direction.name);
});

overlay.addEventListener("click", () => {
  if (game.state !== "playing") {
    advanceGameState();
  }
});

touchActionButton.addEventListener("click", () => {
  advanceGameState();
});

touchMoveButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleTouchDirection(button.dataset.direction);
  });
});

playerNameInput.addEventListener("input", () => {
  savePlayerName();

  if (getPlayerName()) {
    setLeaderboardHelp(`Ready for ${getPlayerName()}. Finish a run to save your score.`);
  } else {
    setLeaderboardHelp("Enter your name before you start so your score can be saved.");
  }
});

restorePlayerName();
updateLeaderboardModeUi();
updateTouchModeUi();
updateTouchActionButton();
refreshLeaderboard();
if (getPlayerName()) {
  setLeaderboardHelp(`Ready for ${getPlayerName()}. Finish a run to save your score.`);
} else if (SHARED_SCOREBOARD_ENABLED) {
  setLeaderboardHelp("Enter your name before you start so your score can be saved for everyone.");
} else {
  setLeaderboardHelp("Enter your name before you start. Add Supabase config later to share the scoreboard with everyone.");
}

applyLevel(0, true);
showOverlay(
  "6-Level Run",
  "Cherry Chase",
  "Enter your name, eat the big cherries, and push through all six mazes for the top score.",
  "Press Enter or Space to begin"
);
coarsePointerQuery.addEventListener?.("change", updateTouchModeUi);
window.requestAnimationFrame(frame);
