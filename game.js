// game.js — LEXIS core game engine

const WAVES_PER_LEVEL  = 3;
const BASE_SPEED       = 0.50;
const SPEED_INCREASE   = 0.20;
const STORAGE_KEY      = 'lexis_history';

const LEVEL_NAMES  = ['RECRUIT','CADET','PILOT','ACE','VETERAN','ELITE','COMMANDER','WARLORD','LEGEND','MYTHIC'];
const LEVEL_COLORS = ['#7DF9C8','#74B9FF','#A29BFE','#FEC89A','#FF9F43','#FF6B6B','#FD79A8','#E17055','#FDCB6E','#FFD700'];

// ── Canvas setup ────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const wrap   = document.getElementById('gameWrap');

function resize() {
  const w = Math.min(wrap.clientWidth, 720);
  canvas.width  = w;
  canvas.height = Math.round(w * 0.70);
}
resize();
window.addEventListener('resize', () => { resize(); if (state) initStars(); });

// ── Storage helpers ─────────────────────────────────────────
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch (e) { return []; }
}
function saveRun(run) {
  const h = loadHistory();
  h.push(run);
  if (h.length > 50) h.splice(0, h.length - 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
}

// ── Progress chart ──────────────────────────────────────────
function buildProgressChart(containerEl) {
  const history = loadHistory();
  if (history.length === 0) {
    containerEl.innerHTML = '<p style="color:#444;font-size:11px;text-align:center;padding:8px 0">No history yet — play a game first!</p>';
    return;
  }

  const W = 500, H = 160;
  const PAD = { top: 16, right: 16, bottom: 36, left: 52 };
  const iW  = W - PAD.left - PAD.right;
  const iH  = H - PAD.top  - PAD.bottom;

  const c  = document.createElement('canvas');
  c.width  = W; c.height = H; c.style.width = '100%';
  const cx = c.getContext('2d');

  const scores   = history.map(r => r.score);
  const maxScore = Math.max(...scores, 100);

  // Grid lines & Y labels
  cx.strokeStyle = 'rgba(255,255,255,0.05)';
  cx.lineWidth   = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y   = PAD.top + (iH / 4) * i;
    const val = Math.round(maxScore - (maxScore / 4) * i);
    cx.beginPath(); cx.moveTo(PAD.left, y); cx.lineTo(PAD.left + iW, y); cx.stroke();
    cx.fillStyle  = '#444';
    cx.font       = '9px monospace';
    cx.textAlign  = 'right';
    cx.fillText(val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val, PAD.left - 5, y + 3);
  }

  // X labels
  cx.fillStyle  = '#444';
  cx.font       = '9px monospace';
  cx.textAlign  = 'center';
  history.forEach((_, i) => {
    if (history.length <= 10 || i % Math.ceil(history.length / 8) === 0 || i === history.length - 1) {
      const x = PAD.left + (i / Math.max(history.length - 1, 1)) * iW;
      cx.fillText('#' + (i + 1), x, H - PAD.bottom + 12);
    }
  });
  cx.fillStyle = '#333';
  cx.fillText('GAMES PLAYED', PAD.left + iW / 2, H - 2);

  // Area fill
  const grad = cx.createLinearGradient(0, PAD.top, 0, PAD.top + iH);
  grad.addColorStop(0, 'rgba(125,249,200,0.18)');
  grad.addColorStop(1, 'rgba(125,249,200,0.01)');
  cx.beginPath();
  history.forEach((r, i) => {
    const x = PAD.left + (i / Math.max(history.length - 1, 1)) * iW;
    const y = PAD.top + iH - (r.score / maxScore) * iH;
    i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y);
  });
  cx.lineTo(PAD.left + iW, PAD.top + iH);
  cx.lineTo(PAD.left,      PAD.top + iH);
  cx.closePath();
  cx.fillStyle = grad; cx.fill();

  // Line
  cx.beginPath();
  cx.strokeStyle = '#7DF9C8'; cx.lineWidth = 1.8; cx.lineJoin = 'round';
  history.forEach((r, i) => {
    const x = PAD.left + (i / Math.max(history.length - 1, 1)) * iW;
    const y = PAD.top + iH - (r.score / maxScore) * iH;
    i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y);
  });
  cx.stroke();

  // Best score dashed line
  const bestScore = Math.max(...scores);
  const byVal     = PAD.top + iH - (bestScore / maxScore) * iH;
  cx.beginPath();
  cx.strokeStyle = 'rgba(255,215,0,0.35)'; cx.lineWidth = 0.8; cx.setLineDash([4, 3]);
  cx.moveTo(PAD.left, byVal); cx.lineTo(PAD.left + iW, byVal); cx.stroke();
  cx.setLineDash([]);
  cx.fillStyle = '#FFD700'; cx.font = '8px monospace'; cx.textAlign = 'left';
  cx.fillText('BEST', PAD.left + 2, byVal - 3);

  // Dots
  history.forEach((r, i) => {
    const x      = PAD.left + (i / Math.max(history.length - 1, 1)) * iW;
    const y      = PAD.top + iH - (r.score / maxScore) * iH;
    const isLast = i === history.length - 1;
    const isBest = r.score === bestScore;
    cx.beginPath();
    cx.arc(x, y, isLast ? 4 : (isBest ? 3.5 : 2), 0, Math.PI * 2);
    cx.fillStyle = isBest ? '#FFD700' : (isLast ? '#7DF9C8' : 'rgba(125,249,200,0.5)');
    cx.fill();
    if (isLast) { cx.strokeStyle = '#fff'; cx.lineWidth = 1; cx.stroke(); }
  });

  const title = document.createElement('div');
  title.style.cssText = 'color:#7DF9C8;font-size:10px;letter-spacing:2px;text-align:center;margin-bottom:8px';
  title.textContent   = 'YOUR PROGRESS — ' + history.length + ' GAME' + (history.length > 1 ? 'S' : '') + ' PLAYED';
  containerEl.innerHTML = '';
  containerEl.appendChild(title);
  containerEl.appendChild(c);
}

// ── Game state ───────────────────────────────────────────────
let state, stars, particles, explosions, fireBeams, animId;
let usedWords = new Set();

function getLevelFromWave(wave)  { return Math.min(Math.floor((wave - 1) / WAVES_PER_LEVEL) + 1, LEVEL_NAMES.length); }
function getSpeedMultiplier(lv)  { return 1 + (lv - 1) * SPEED_INCREASE; }

function pickWord(level) {
  const pool      = getWordPool(level);
  const available = pool.filter(w => !usedWords.has(w));
  if (available.length === 0) { usedWords.clear(); return pool[Math.floor(Math.random() * pool.length)]; }
  const w = available[Math.floor(Math.random() * available.length)];
  usedWords.add(w);
  return w;
}

function initStars() {
  stars = Array.from({ length: 130 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.4 + 0.2,
    speed: Math.random() * 0.4 + 0.08,
    alpha: Math.random() * 0.6 + 0.3
  }));
}

// ── New game ─────────────────────────────────────────────────
function newGame() {
  usedWords.clear();
  if (animId) cancelAnimationFrame(animId);

  state = {
    score: 0, wave: 1, lives: 3, running: true,
    enemies: [], typed: '', target: null,
    waveSize: 5, spawnInterval: 100,
    spawnTimer: 0, spawned: 0, waveComplete: false,
    combo: 0, comboTimer: 0, level: 1, muzzleFlash: 0,
    wordsDestroyed: 0, keystrokes: 0, correctKeys: 0,
    best: parseInt(localStorage.getItem('lexis_best') || '0'),
    startTime: Date.now()
  };
  particles = []; explosions = []; fireBeams = [];
  initStars();
  document.getElementById('overlay').style.display = 'none';
  updateHUD(); updateLevelBar();
  loop();
}

// ── Spawn ────────────────────────────────────────────────────
function spawnEnemy() {
  const word   = pickWord(state.level);
  const margin = 55;
  const x      = margin + Math.random() * (canvas.width - margin * 2);
  const mult   = getSpeedMultiplier(state.level);
  const spd    = (BASE_SPEED + Math.random() * 0.18) * mult;
  const col    = LEVEL_COLORS[(state.level - 1) % LEVEL_COLORS.length];
  state.enemies.push({ word, x, y: -30, speed: spd, col, destroyed: 0, pulseT: Math.random() * Math.PI * 2 });
}

// ── Fire beam ────────────────────────────────────────────────
function spawnFireBeam(ex, ey, col) {
  fireBeams.push({ x1: canvas.width / 2, y1: canvas.height - 60, x2: ex, y2: ey, col, life: 10, maxLife: 10 });
}

function fireParticles(x, y, col, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = Math.random() * 4 + 1;
    particles.push({ x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, alpha: 1, col, life: Math.random() * 30 + 15, r: Math.random() * 2.5 + 1 });
  }
}

// ── Drawing ──────────────────────────────────────────────────
function drawShip(x, y) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(125,249,200,0.12)';
  ctx.beginPath(); ctx.ellipse(0, 14, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7DF9C8'; ctx.shadowColor = '#7DF9C8'; ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(0, -22); ctx.lineTo(-13, 11); ctx.lineTo(-6, 6);
  ctx.lineTo(0, 9);  ctx.lineTo(6, 6);   ctx.lineTo(13, 11);
  ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(5,6,15,0.85)';
  ctx.beginPath(); ctx.ellipse(0, -8, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(125,249,200,0.5)';
  ctx.beginPath(); ctx.ellipse(0, -9, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
  if (state.muzzleFlash > 0) {
    ctx.globalAlpha = state.muzzleFlash / 8;
    ctx.fillStyle = '#FF9F43'; ctx.shadowColor = '#FF6B00'; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(0, -24, 7, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawEnemy(e) {
  ctx.save(); ctx.translate(e.x, e.y);
  const pulse = Math.sin(e.pulseT) * 2;
  if (state.target === e) {
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.strokeStyle = e.col; ctx.globalAlpha = 0.25; ctx.lineWidth = 1;
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.fillStyle = e.col; ctx.shadowColor = e.col; ctx.shadowBlur = 8 + pulse;
  ctx.beginPath();
  ctx.moveTo(0, 14);  ctx.lineTo(-10, -7); ctx.lineTo(-4, -2);
  ctx.lineTo(0, -10); ctx.lineTo(4, -2);   ctx.lineTo(10, -7);
  ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;

  const remaining = e.word.slice(e.destroyed);
  ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  if (state.target === e && remaining.length > 0) {
    const totalW = ctx.measureText(remaining).width;
    const sx     = -totalW / 2;
    const firstW = ctx.measureText(remaining[0]).width;
    ctx.fillStyle = '#FF9F43';
    ctx.fillText(remaining[0], sx + firstW / 2, 19);
    if (remaining.length > 1) {
      const rest = remaining.slice(1);
      ctx.fillStyle = 'rgba(255,255,255,0.93)';
      ctx.fillText(rest, sx + firstW + ctx.measureText(rest).width / 2, 19);
    }
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.93)';
    ctx.fillText(remaining, 0, 19);
  }
  ctx.restore();
}

function drawFireBeams() {
  for (const b of fireBeams) {
    const alpha = b.life / b.maxLife;
    ctx.save(); ctx.globalAlpha = alpha * 0.85;
    ctx.strokeStyle = b.col; ctx.lineWidth = 2.5; ctx.shadowColor = b.col; ctx.shadowBlur = 10;
    ctx.beginPath();
    const segs = 6;
    const dx   = (b.x2 - b.x1) / segs;
    const dy   = (b.y2 - b.y1) / segs;
    ctx.moveTo(b.x1, b.y1);
    for (let i = 1; i <= segs; i++) {
      const jitter = (1 - alpha) * 6;
      const jx = i < segs ? (Math.random() - 0.5) * jitter : 0;
      const jy = i < segs ? (Math.random() - 0.5) * jitter : 0;
      ctx.lineTo(b.x1 + dx * i + jx, b.y1 + dy * i + jy);
    }
    ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.shadowBlur = 0; ctx.globalAlpha = alpha * 0.5;
    ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    ctx.restore();
  }
}

// ── Update ───────────────────────────────────────────────────
function update() {
  if (!state.running) return;
  const H = canvas.height;
  if (state.muzzleFlash > 0) state.muzzleFlash--;
  state.spawnTimer++;
  if (state.comboTimer > 0) state.comboTimer--;
  else state.combo = 0;

  if (state.spawned < state.waveSize && state.spawnTimer >= state.spawnInterval) {
    spawnEnemy(); state.spawned++; state.spawnTimer = 0;
  }

  for (let i = fireBeams.length - 1; i >= 0; i--) {
    fireBeams[i].life--;
    if (fireBeams[i].life <= 0) fireBeams.splice(i, 1);
  }

  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    e.y += e.speed; e.pulseT += 0.07;
    if (e.y > H + 40) {
      if (state.target === e) {
        state.target = null; state.typed = '';
        document.getElementById('typed-display').textContent = '';
      }
      state.enemies.splice(i, 1);
      state.lives--; state.combo = 0;
      fireParticles(e.x, H - 20, '#FF6B6B', 16);
      updateHUD();
      if (state.lives <= 0) { endGame(); return; }
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.alpha -= 1 / p.life;
    if (p.alpha <= 0) particles.splice(i, 1);
  }

  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].t++;
    if (explosions[i].t > 30) explosions.splice(i, 1);
  }

  if (state.spawned >= state.waveSize && state.enemies.length === 0 && !state.waveComplete) {
    state.waveComplete = true; nextWave();
  }
}

// ── Draw frame ───────────────────────────────────────────────
function draw() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#05060F'; ctx.fillRect(0, 0, W, H);

  const sm = getSpeedMultiplier(state.level);
  for (const s of stars) {
    s.y += s.speed * sm * 0.5;
    if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    ctx.globalAlpha = s.alpha; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(125,249,200,0.10)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(0, H - 36); ctx.lineTo(W, H - 36); ctx.stroke();

  for (const ex of explosions) {
    const prog = ex.t / 30;
    ctx.globalAlpha = (1 - prog) * 0.9; ctx.strokeStyle = ex.col; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ex.x, ex.y, ex.r * prog * 3.5, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = (1 - prog) * 0.35; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(ex.x, ex.y, ex.r * prog * 1.8, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  for (const p of particles) {
    ctx.globalAlpha = p.alpha; ctx.fillStyle = p.col;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawFireBeams();
  for (const e of state.enemies) drawEnemy(e);
  drawShip(W / 2, H - 60);
}

function loop() {
  if (!state || !state.running) return;
  update(); draw();
  animId = requestAnimationFrame(loop);
}

// ── HUD helpers ──────────────────────────────────────────────
function updateHUD() {
  document.getElementById('score').textContent = state.score.toLocaleString();
  document.getElementById('wave').textContent  = state.wave;
  document.getElementById('best').textContent  = state.best.toLocaleString();
  document.getElementById('hearts').textContent =
    '❤️'.repeat(state.lives) + '🖤'.repeat(Math.max(0, 3 - state.lives));
}

function updateLevelBar() {
  const lv   = state.level;
  const name = LEVEL_NAMES[Math.min(lv - 1, LEVEL_NAMES.length - 1)];
  const mult = getSpeedMultiplier(lv);
  const col  = LEVEL_COLORS[(lv - 1) % LEVEL_COLORS.length];
  const wil  = ((state.wave - 1) % WAVES_PER_LEVEL) + 1;
  const pct  = Math.round((wil / WAVES_PER_LEVEL) * 100);
  document.getElementById('level-info').innerHTML =
    `<span style="color:${col}">LVL ${lv}</span> <span style="color:#444;margin-left:6px">${name}</span>`;
  document.getElementById('xp-bar').style.width      = pct + '%';
  document.getElementById('xp-bar').style.background = col;
  document.getElementById('speed-info').textContent  = 'SPEED ' + mult.toFixed(1) + '×';
}

// ── Wave / Level ─────────────────────────────────────────────
function nextWave() {
  state.wave++;
  state.waveSize     = 4 + Math.floor(state.wave * 1.5);
  state.spawnInterval = Math.max(45, 100 - state.wave * 5);
  state.spawned      = 0; state.waveComplete = false;

  const newLevel  = getLevelFromWave(state.wave);
  const leveledUp = newLevel > state.level;
  state.level     = newLevel;
  state.score    += state.wave * 60;
  updateHUD(); updateLevelBar();

  if (leveledUp) {
    showLevelUp(state.level);
  } else {
    const wil = ((state.wave - 1) % WAVES_PER_LEVEL) + 1;
    const wd  = document.getElementById('wave-display');
    wd.innerHTML = 'WAVE ' + state.wave +
      `<br><span style="font-size:12px;color:#aaa">WAVE ${wil} OF ${WAVES_PER_LEVEL} — LVL ${state.level}</span>`;
    wd.style.opacity = '1';
    setTimeout(() => wd.style.opacity = '0', 1600);
  }
}

function showLevelUp(level) {
  const name = LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];
  const mult = getSpeedMultiplier(level);
  document.getElementById('lvl-title').textContent = 'LEVEL ' + level + ' — ' + name;
  document.getElementById('lvl-sub').textContent   = 'SPEED ' + mult.toFixed(1) + '× — BRACE YOURSELF';
  const banner = document.getElementById('level-up-banner');
  banner.style.opacity = '1'; setTimeout(() => banner.style.opacity = '0', 2400);
  const wd = document.getElementById('wave-display');
  wd.innerHTML = 'WAVE ' + state.wave; wd.style.opacity = '1';
  setTimeout(() => wd.style.opacity = '0', 2400);
}

// ── End game ─────────────────────────────────────────────────
function endGame() {
  state.running = false;
  cancelAnimationFrame(animId);
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem('lexis_best', state.best);
  }

  const duration = Math.round((Date.now() - state.startTime) / 1000);
  const accuracy = state.keystrokes > 0
    ? Math.round((state.correctKeys / state.keystrokes) * 100) : 0;

  saveRun({ score: state.score, wave: state.wave, level: state.level,
    words: state.wordsDestroyed, accuracy, duration, date: new Date().toLocaleDateString() });

  const lvlName = LEVEL_NAMES[Math.min(state.level - 1, LEVEL_NAMES.length - 1)];
  const ov      = document.getElementById('overlay');
  ov.style.display = 'flex';
  ov.innerHTML = `
    <div style="font-size:30px">💥</div>
    <h2 style="color:#FF6B6B;font-size:20px;text-shadow:0 0 14px rgba(255,107,107,0.4)">SHIELDS DOWN</h2>
    <div class="score-final">${state.score.toLocaleString()} pts</div>
    <div class="stat-row">
      <div class="stat-box"><div class="sv">${state.wave}</div><div class="sl">WAVE</div></div>
      <div class="stat-box"><div class="sv">${lvlName}</div><div class="sl">RANK</div></div>
      <div class="stat-box"><div class="sv">${state.wordsDestroyed}</div><div class="sl">WORDS</div></div>
      <div class="stat-box"><div class="sv">${accuracy}%</div><div class="sl">ACCURACY</div></div>
      <div class="stat-box"><div class="sv">${duration}s</div><div class="sl">TIME</div></div>
    </div>
    <div id="progressChart"></div>
    <button id="startBtn">PLAY AGAIN</button>
    <p style="color:#282828;font-size:10px;letter-spacing:1px;margin-top:4px">LEXIS — PROGRESS SAVED LOCALLY</p>
  `;
  buildProgressChart(document.getElementById('progressChart'));
  document.getElementById('startBtn').addEventListener('click', newGame);
}

// ── Key handler ──────────────────────────────────────────────
function handleKey(ch) {
  if (!state || !state.running) return;
  state.keystrokes++;

  const tryHit = (en) => {
    spawnFireBeam(en.x, en.y, en.col);
    state.muzzleFlash = 8;
    fireParticles(en.x, en.y, en.col, 6);
    en.destroyed++;
    state.correctKeys++;
    state.typed += ch;
    document.getElementById('typed-display').textContent = state.typed.toUpperCase();

    if (en.destroyed >= en.word.length) {
      const pts = en.word.length * 12 * state.level + (state.combo > 2 ? state.combo * 8 : 0);
      state.score += pts;
      state.combo++; state.comboTimer = 90; state.wordsDestroyed++;
      fireParticles(en.x, en.y, en.col, en.word.length * 5 + 12);
      explosions.push({ x: en.x, y: en.y, r: 16 + en.word.length * 3, col: en.col, t: 0 });
      state.enemies.splice(state.enemies.indexOf(en), 1);
      state.target = null; state.typed = '';
      document.getElementById('typed-display').textContent = '';
      if (state.combo > 2) {
        const cd = document.getElementById('combo-display');
        cd.textContent = 'COMBO x' + state.combo + '!'; cd.style.opacity = '1';
        setTimeout(() => cd.style.opacity = '0', 700);
      }
      updateHUD();
    }
  };

  if (state.target) {
    const en = state.target;
    if (en.word[en.destroyed] === ch) {
      tryHit(en);
    } else {
      state.target = null; state.typed = '';
      let found = false;
      for (const en2 of state.enemies) {
        if (en2.word[en2.destroyed] === ch) { state.target = en2; tryHit(en2); found = true; break; }
      }
      if (!found) document.getElementById('typed-display').textContent = '';
    }
  } else {
    let found = false;
    for (const en of state.enemies) {
      if (en.word[en.destroyed] === ch) { state.target = en; tryHit(en); found = true; break; }
    }
    if (!found) document.getElementById('typed-display').textContent = '';
  }
}

document.addEventListener('keydown', (ev) => {
  if (!state || !state.running) return;
  if (ev.key === 'Backspace') {
    state.typed = ''; state.target = null;
    document.getElementById('typed-display').textContent = ''; return;
  }
  if (ev.key.length !== 1 || !/[a-zA-Z]/.test(ev.key)) return;
  handleKey(ev.key.toLowerCase());
});

// ── Start screen history preview ─────────────────────────────
(function () {
  const h  = loadHistory();
  const el = document.getElementById('historyPreview');
  if (!el || h.length === 0) return;
  const best = Math.max(...h.map(r => r.score));
  el.innerHTML = `<p style="color:#444;font-size:10px;letter-spacing:1px;margin-top:10px">
    ${h.length} GAME${h.length > 1 ? 'S' : ''} PLAYED &nbsp;·&nbsp; BEST: ${best.toLocaleString()} PTS
  </p>`;
})();

document.getElementById('startBtn').addEventListener('click', newGame);
