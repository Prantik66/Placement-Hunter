// === DOM elements ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const livesDisplay = document.getElementById("lives");
const startBtn = document.getElementById("startBtn");
const resultScreen = document.getElementById("resultScreen");
const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");
const restartBtn = document.getElementById("restartBtn");

// === game state ===
let player, bullets, enemies, enemyBullets, score, timeLeft, gameInterval, spawnInterval, timerInterval;
let gameRunning = false;
let keys = {};

// === Subject-based Enemy Names ===
const subjects = [
  "OOPs", "PYTHON", "DBMS", "CYBER", "AWS", 
  "IWP", "CLOUD", "CPP", "JAVA", "SOFTWARE", "COLLEGE"
];

// === Classes ===
class Player {
  constructor() {
    this.width = 40;
    this.height = 40;
    this.x = canvas.width / 2 - this.width / 2;
    this.y = canvas.height - this.height - 10;
    this.speed = 5.5;
    this.fireCooldown = 0;
    this.fireRate = 12;
    this.lives = 3;
    this.hitInvul = 0;
  }
  draw() {
    if (this.hitInvul > 0 && Math.floor(this.hitInvul / 6) % 2 === 0) return;
    ctx.fillStyle = "#00ffcc";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#003";
    ctx.fillRect(this.x + 8, this.y + 8, 5, 5);
    ctx.fillRect(this.x + 27, this.y + 8, 5, 5);
  }
  moveLeft() { this.x = Math.max(0, this.x - this.speed); }
  moveRight() { this.x = Math.min(canvas.width - this.width, this.x + this.speed); }
  canShoot() { return this.fireCooldown <= 0; }
  shoot() {
    if (!this.canShoot()) return;
    bullets.push(new Bullet(this.x + this.width / 2, this.y));
    this.fireCooldown = this.fireRate;
  }
  update() {
    if (this.fireCooldown > 0) this.fireCooldown--;
    if (this.hitInvul > 0) this.hitInvul--;
    if (keys.ArrowLeft || keys.a) this.moveLeft();
    if (keys.ArrowRight || keys.d) this.moveRight();
    if ((keys[" "] || keys.Space || keys.ArrowUp) && this.canShoot()) this.shoot();
  }
  damage() {
    if (this.hitInvul > 0) return;
    this.lives--;
    this.hitInvul = 60;
    flashDamage();
    updateUI();
    if (this.lives <= 0) endGame();
  }
}

class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.speed = 9;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffff66";
    ctx.fill();
  }
  update() { this.y -= this.speed; }
  offscreen() { return this.y + this.radius < 0; }
}

class EnemyBullet {
  constructor(x, y, speed = 4) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.speed = speed;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ff77aa";
    ctx.fill();
  }
  update() { this.y += this.speed; }
  offscreen() { return this.y - this.radius > canvas.height; }
}

class Enemy {
  constructor(x, y, speed, points, subject) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.speed = speed;
    this.points = points;
    this.subject = subject;
    this.color = ["#ff5050", "#ff9933", "#33ff33", "#66ccff"][Math.floor(Math.random() * 4)];
    this.fireCooldown = 40 + Math.floor(Math.random() * 80);
    this.fireRate = 30;
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "white";
    ctx.font = "12px Poppins";
    ctx.textAlign = "center";
    ctx.fillText(this.subject, this.x + this.width / 2, this.y + this.height / 2 + 4);
  }
  update() {
    this.y += this.speed;
    if (this.fireCooldown > 0) this.fireCooldown--;
    const playerCenterX = player.x + player.width / 2;
    const alignTolerance = 25 + this.width / 2;
    if (this.fireCooldown <= 0 && Math.abs(playerCenterX - (this.x + this.width / 2)) <= alignTolerance && this.y < player.y) {
      enemyBullets.push(new EnemyBullet(this.x + this.width / 2, this.y + this.height, 4 + Math.random() * 1.5));
      this.fireCooldown = this.fireRate + Math.floor(Math.random() * 60);
    }
  }
  offscreen() { return this.y - this.height > canvas.height; }
}

// === helpers ===
function rand(min, max) { return Math.random() * (max - min) + min; }

function startGame() {
  player = new Player();
  bullets = [];
  enemies = [];
  enemyBullets = [];
  score = 0;
  timeLeft = 60;
  gameRunning = true;
  resultScreen.style.display = "none";
  updateUI();
  startBtn.disabled = true;
  canvas.focus();

  gameInterval = setInterval(gameLoop, 1000 / 60);
  spawnInterval = setInterval(spawnEnemy, 900);
  timerInterval = setInterval(() => {
    timeLeft--;
    timeDisplay.textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function endGame() {
  if (!gameRunning) return;
  gameRunning = false;
  clearInterval(gameInterval);
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  startBtn.disabled = false;
  showResult();
}

function spawnEnemy() {
  const x = Math.random() * (canvas.width - 50);
  const speed = 1.5 + Math.random() * 2.2;
  const points = Math.floor(speed * 12);
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  enemies.push(new Enemy(x, -40, speed, points, subject));
}

function updateUI() {
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;
  livesDisplay.textContent = player.lives;
}

function flashDamage() {
  const el = document.createElement("div");
  el.className = "damage-flash";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 300);
}

function showResult() {
  resultScreen.style.display = "block";
  let title, message;
  if (player.score <= 0) {
    title = "Berozgari";
    message = `Ek game katha ${score}`;
  } else if (score < 100) {
    title = "TCS";
    message = `Kya majduri thi: ${score}`;
  } else if (score < 200) {
    title = "Local Startup";
    message = `Kuch to ukhadoge hi: ${score}`;
  } else if (score < 300) {
    title = "Cognizant";
    message = `Score: ${score}. Chalo badhiya h`;
  } else if (score < 400) {
    title = "ORACLE";
    message = `Score: ${score}. Badhai ho aapko`;
  } else {
    title = "Dream Offer 🌟";
    message = `Score: ${score}. MANG!! bhai aag lagadi`;
  }
  resultTitle.textContent = title;
  resultMessage.textContent = message;
}

// === collision helpers ===
function rectCircleCollide(rx, ry, rw, rh, cx, cy, cr) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) <= (cr * cr);
}

function rectRect(a, b) {
  return !(a.x + a.width < b.x || a.x > b.x + b.width || a.y + a.height < b.y || a.y > b.y + b.height);
}

// === main game loop ===
function gameLoop() {
  player.update();

  // Player bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.update();
    if (b.offscreen()) { bullets.splice(i, 1); continue; }
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (rectCircleCollide(e.x, e.y, e.width, e.height, b.x, b.y, b.radius)) {
        score += e.points;
        updateUI();
        enemies.splice(j, 1);
        bullets.splice(i, 1);
        break;
      }
    }
  }

  // Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.update();
    if (e.offscreen()) { enemies.splice(i, 1); continue; }
    if (rectRect(e, player) && player.hitInvul <= 0) {
      player.damage();
      score = Math.max(0, score - 15);
      updateUI();
      enemies.splice(i, 1);
    }
  }

  // Enemy bullets
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const eb = enemyBullets[i];
    eb.update();
    if (eb.offscreen()) { enemyBullets.splice(i, 1); continue; }
    if (rectCircleCollide(player.x, player.y, player.width, player.height, eb.x, eb.y, eb.radius)) {
      player.damage();
      enemyBullets.splice(i, 1);
      score = Math.max(0, score - 8);
      updateUI();
    }
  }

  // draw everything
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  player.draw();
  bullets.forEach(b => b.draw());
  enemies.forEach(e => e.draw());
  enemyBullets.forEach(eb => eb.draw());
}

// === input handling ===
window.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.code === "Space") keys.Space = true;
  if (gameRunning && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
});
window.addEventListener("keyup", e => {
  keys[e.key] = false;
  if (e.code === "Space") keys.Space = false;
});

// start/restart hooks
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", () => {
  resultScreen.style.display = "none";
  startGame();
});

canvas.addEventListener("click", () => canvas.focus());
