// =====================================================================
// GOLDFISH GAME — Engine
// =====================================================================
(function() {
  "use strict";

  // ---- DOM ----
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlaySub = document.getElementById('overlay-sub');
  const countdownEl = document.getElementById('countdown-display');
  const btnStart = document.getElementById('btnStart');
  const gameOverScore = document.getElementById('game-over-score');
  const startFishAnim = document.getElementById('start-fish-anim');
  const scoreDisplay = document.getElementById('score-display');
  const hiscoreDisplay = document.getElementById('hiscore-display');
  const speedDisplay = document.getElementById('speed-display');
  const lifeCvs = [
    document.getElementById('life1'),
    document.getElementById('life2'),
    document.getElementById('life3'),
  ];

  // ---- SIZES ----
  function resize() {
    const mainEl = document.querySelector('main');
    const sideW = 185;
    const availW = mainEl.clientWidth - sideW;
    const availH = mainEl.clientHeight;
    let w = Math.min(availW - 4, Math.floor(availH * 0.62));
    let h = availH - 4;
    if (w * (1/0.62) > availH) { h = availH - 4; w = Math.floor(h * 0.62); }
    canvas.width = w;
    canvas.height = h;
    const gameArea = document.getElementById('game-area');
    overlay.style.width = w + 'px';
    overlay.style.height = h + 'px';
    overlay.style.left = ((gameArea.clientWidth - w) / 2) + 'px';
    overlay.style.top = ((gameArea.clientHeight - h) / 2) + 'px';
    LANE_W = w / LANES;
    PLAYER.x = Math.min(PLAYER.x || w/2, w - PLAYER.w);
  }

  // ---- CONSTANTS ----
  const LANES = 5;
  let LANE_W = 80;
  const PLAYER_W = 52;
  const PLAYER_H = 34;
  const OBSTACLE_W = 46;
  const OBSTACLE_H = 46;
  const BUBBLE_R = 18;
  const BASE_SPEED = 2.2;
  const MAX_SPEED = 7.5;
  const INVULN_MS = 1800;
  const OBSTACLE_INTERVAL_BASE = 1100;
  const SPEED_INCREASE_INTERVAL = 12000;
  const RANDOM_SLOWDOWN_CHANCE = 0.25;

  let hiScore = parseFloat(localStorage.getItem('goldfish_hi') || '0');

  // ---- STATE ----
  let gameState = 'start';
  let score = 0;
  let lives = 3;
  let speedMul = 1.0;
  let lastTimestamp = 0;
  let bgOffset = 0;
  let invulnTimer = 0;
  let bubbleSpawned = [false, false];
  let obstacleTimer = 0;
  let obstacleInterval = OBSTACLE_INTERVAL_BASE;
  let speedTimer = 0;
  let rafId = null;
  let dt = 0;
  let mouseX = -1, mouseY = -1;
  let lastBubbleTime = 0;

  const PLAYER = { x: 0, y: 0, w: PLAYER_W, h: PLAYER_H, targetX: 0 };
  let obstacles = [];
  let bubbles = [];
  let particles = [];

  // ---- SPRITE GENERATORS ----
  const spriteCache = {};

  function getSprite(key, drawFn, w, h) {
    if (!spriteCache[key]) {
      const sc = document.createElement('canvas');
      sc.width = w; sc.height = h;
      drawFn(sc.getContext('2d'), w, h);
      spriteCache[key] = sc;
    }
    return spriteCache[key];
  }

  // Goldfish pixel-art sprite
 function drawGoldfishSprite(c, w, h, flip = false) {
  c.save();

  // Ajuste para orientación vertical (Mantenido igual)
  c.translate(w / 2, h / 2);
  c.rotate(-Math.PI / 2);
  c.translate(-h / 2, -w / 2);

  if (flip) {
    c.scale(-1, 1);
    c.translate(-h, 0);
  }

  c.imageSmoothingEnabled = false;

  // Proporciones corregidas para que no se estire
  const pw = h / 16;
  const ph = w / 20;

  function px(col, row, color, cols = 1, rows = 1) {
    c.fillStyle = color;
    c.fillRect(
      Math.round(col * pw),
      Math.round(row * ph),
      Math.ceil(cols * pw),
      Math.ceil(rows * ph)
    );
  }

  // Colores extraídos de la imagen original
  const shellBlue = '#1c71d8';
  const shellDark = '#0a4da4';
  const shellLight = '#3cc7f3';
  const skinBrown = '#9a6b33';
  const skinGold = '#c4a055';

  // --- Aletas Traseras (lado izquierdo del dibujo horizontal) ---
  px(0, 2, skinBrown, 2, 2); px(0, 2, skinGold); // Superior
  px(0, 8, skinBrown, 2, 2); px(0, 9, skinGold); // Inferior

  // --- Aletas Delanteras (grandes, arriba y abajo del caparazón) ---
  px(4, 0, skinBrown, 4, 2); px(5, 0, skinGold, 2, 1); // Aleta superior
  px(4, 10, skinBrown, 4, 2); px(5, 11, skinGold, 2, 1); // Aleta inferior

  // --- Caparazón (Cuerpo central) ---
  px(2, 2, shellDark, 10, 8); // Borde azul oscuro
  px(3, 3, shellBlue, 8, 6);  // Interior azul
  
  // Patrón de brillo (Mosaico)
  px(4, 4, shellLight, 2, 1); px(8, 4, shellLight, 2, 1);
  px(6, 5, shellLight, 2, 2); // Centro brillante
  px(4, 7, shellLight, 2, 1); px(8, 7, shellLight, 2, 1);

  // --- Cabeza (lado derecho para que al rotar quede ARRIBA) ---
  px(12, 4, skinBrown, 3, 4); 
  px(13, 5, skinGold, 2, 2); // Mancha dorada en cabeza
  px(14, 5, '#000', 0.6, 0.6); // Ojo

  // --- Pequeña Cola (detrás) ---
  px(1, 5.5, skinBrown, 1, 1);

  c.restore();
}

  // Rock pixel-art sprite
  function drawRockSprite(c, w, h) {
  c.save();
  c.imageSmoothingEnabled = false;
  const pw = w / 10, ph = h / 10;

  function px(col, row, color, cols = 1, rows = 1) {
    c.fillStyle = color;
    c.fillRect(
      Math.round(col * pw),
      Math.round(row * ph),
      Math.ceil(cols * pw),
      Math.ceil(rows * ph)
    );
  }

  // --- PALETA DE COLORES (Calcada de rock.png) ---
  const outline = '#3e322a';  // Delineado oscuro
  const shadow  = '#5e4e42';  // Cara lateral (sombra)
  const mid     = '#8b7a6b';  // Cara frontal (medio)
  const light   = '#b3a291';  // Cara superior (luz)
  const floor   = 'rgba(0,0,0,0.3)'; // Sombra suelo

  // 1. Sombra en el suelo
  c.fillStyle = floor;
  c.fillRect(Math.round(1*pw), Math.round(8.5*ph), Math.ceil(8*pw), Math.ceil(1*ph));

  // --- ESTRUCTURA BASE (Líneas más irregulares) ---

  // Bloque Base Izquierda (Atrás) - Bordes mordidos
  px(1.8, 5.2, outline, 3.5, 3.8); // Delineado
  px(2, 5.5, mid, 3, 3);    // Frontal
  px(2, 5.5, light, 3, 1);  // Superior
  px(4.8, 6.2, shadow, 0.7, 2.5); // Lateral

  // Bloque Base Derecha (Atrás)
  px(5.2, 5.2, outline, 3.5, 3.8);  // Delineado
  px(5.5, 5.5, mid, 3, 3);  // Frontal
  px(5.5, 5.5, light, 3, 1);// Superior
  px(8, 6.2, shadow, 0.7, 2.5);   // Lateral

  // Bloque Frontal Pequeño (Al frente)
  px(4.2, 7.8, outline, 2.8, 1.8); // Delineado
  px(4.5, 8, mid, 2, 1.5);   // Frontal
  px(4.5, 8, light, 2, 0.5); // Superior
  px(6.5, 8.2, shadow, 0.5, 1.3); // Lateral

  // Bloque Largo Medio (Encima)
  px(2.8, 3.8, outline, 5.5, 2.8); // Delineado
  px(3, 4, mid, 5, 2);      // Frontal
  px(3, 4, light, 5, 1);    // Superior
  px(7.8, 4.8, shadow, 0.5, 1.5); // Lateral

  // Bloque Cima (Arriba)
  px(4.2, 1.8, outline, 2.8, 2.2); // Delineado
  px(4.5, 2, mid, 2, 1.5);   // Frontal
  px(4.5, 2, light, 2, 0.5); // Superior
  px(6.5, 2.2, shadow, 0.5, 1.3); // Lateral


  // === NUEVO: TEXTURIZADO ALEATORIO (Efecto Rocoso) ===

  // Función interna para poner moteado
  function speckle(col, row, color) {
    // Usamos Math.random para que cada roca sea única
    if (Math.random() > 0.6) { // Solo dibuja el 40% de las veces
      px(col, row, color, 0.4, 0.4); // Puntos muy pequeños
    }
  }

  // Moteado de luz (puntos claros sobre la cara frontal y superior)
  const hLight = 'rgba(255,255,255,0.2)'; 
  speckle(2.5, 6, hLight); speckle(3, 5, hLight); speckle(6, 6, hLight);
  speckle(4, 4.5, hLight); speckle(8, 5, hLight); speckle(5, 2.5, hLight);

  // Moteado de sombra (puntos oscuros para grietas internas)
  const hShadow = 'rgba(0,0,0,0.3)';
  speckle(2, 6.5, hShadow); speckle(4, 5.5, hShadow); speckle(7, 6, hShadow);
  speckle(5, 4.2, hShadow); speckle(6, 5, hShadow); speckle(4.5, 3, hShadow);

  // Romper el delineado (puntos de color 'mid' sobre el 'outline')
  speckle(1.8, 5.5, mid); speckle(5.2, 6.2, mid);
  speckle(2.8, 4, mid); speckle(7.8, 5.5, mid);

  c.restore();
}
  // Log pixel-art sprite
  function drawLogSprite(c, w, h) {
    c.save();
    c.imageSmoothingEnabled = false;
    const pw = w / 12, ph = h / 10;
    function px(col, row, color, cols=1, rows=1) {
      c.fillStyle = color;
      c.fillRect(Math.round(col*pw), Math.round(row*ph), Math.ceil(cols*pw), Math.ceil(rows*ph));
    }
    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.fillRect(Math.round(1*pw), Math.round(8.4*ph), Math.ceil(10*pw), Math.ceil(1.2*ph));
    px(0,3,'#5d3317',2,4);
    px(0,2,'#4e2700',2,1); px(0,7,'#4e2700',2,1);
    c.strokeStyle = '#6d4c41'; c.lineWidth = Math.max(1, pw*0.6);
    for(let r=0.3;r<=0.9;r+=0.3){
      c.beginPath();
      c.ellipse(1.2*pw, 5*ph, 0.9*pw*r, 1.6*ph*r, 0, 0, Math.PI*2);
      c.stroke();
    }
    px(2,2,'#4e2700',8,1);
    px(2,3,'#8d5524',8,1);
    px(2,4,'#a0622a',8,2);
    px(2,6,'#8d5524',8,1);
    px(2,7,'#4e2700',8,1);
    c.strokeStyle = 'rgba(62,26,0,0.4)'; c.lineWidth = Math.max(1,pw*0.4);
    for(let i=0;i<4;i++){
      c.beginPath();
      c.moveTo((3+i*2)*pw, 2*ph);
      c.quadraticCurveTo((4+i*2)*pw, 5*ph, (3+i*2)*pw, 8*ph);
      c.stroke();
    }
    c.strokeStyle = '#33691eaa'; c.lineWidth = Math.max(1,pw*0.5);
    for(let i=0;i<3;i++){
      c.beginPath();
      c.moveTo((3+i*2.5)*pw, 2*ph);
      c.quadraticCurveTo((4+i*2.5)*pw, 0.5*ph, (5+i*2.5)*pw, 1.2*ph);
      c.stroke();
    }
    c.restore();
  }

  // Bubble pixel-art sprite
  function drawBubbleSprite(c, r) {
    c.save();
    c.imageSmoothingEnabled = false;
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const bx = r + Math.cos(a) * r * 0.88;
      const by = r + Math.sin(a) * r * 0.88;
      const px = Math.max(2, r * 0.18);
      c.fillStyle = `rgba(129,212,250,${0.5 + 0.3 * Math.sin(i)})`;
      c.fillRect(Math.round(bx - px/2), Math.round(by - px/2), Math.ceil(px), Math.ceil(px));
    }
    const ig = c.createRadialGradient(r*0.65, r*0.5, 1, r, r, r*0.88);
    ig.addColorStop(0, 'rgba(255,255,255,0.5)');
    ig.addColorStop(0.4, 'rgba(178,235,242,0.2)');
    ig.addColorStop(1, 'rgba(21,101,192,0.15)');
    c.beginPath(); c.arc(r, r, r*0.85, 0, Math.PI*2);
    c.fillStyle = ig; c.fill();
    const hp = Math.max(2, r * 0.2);
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.fillRect(Math.round(r*0.45), Math.round(r*0.35), Math.ceil(hp*1.8), Math.ceil(hp));
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.fillRect(Math.round(r*0.42), Math.round(r*0.5), Math.ceil(hp), Math.ceil(hp*0.7));
    c.save();
    c.translate(r, r + r*0.1);
    const hs = r * 0.35;
    c.fillStyle = '#ff6b6b';
    const hpx = hs * 0.4;
    const heart = [
      [0,1,0,1,0],
      [1,1,1,1,1],
      [1,1,1,1,1],
      [0,1,1,1,0],
      [0,0,1,0,0],
    ];
    for (let row = 0; row < heart.length; row++) {
      for (let col = 0; col < heart[row].length; col++) {
        if (heart[row][col]) {
          c.fillRect(
            Math.round((col - 2.5) * hpx),
            Math.round((row - 2.5) * hpx),
            Math.ceil(hpx), Math.ceil(hpx)
          );
        }
      }
    }
    c.restore();
    c.restore();
  }

  // Heart pixel-art sprite
  function drawHeartSprite(c, w, h, full, gaining = false) {
    c.clearRect(0, 0, w, h);
    c.save();
    c.imageSmoothingEnabled = false;
    const pw = w / 7, ph = h / 6;
    function px(col, row, color) {
      c.fillStyle = color;
      c.fillRect(Math.round(col*pw), Math.round(row*ph), Math.ceil(pw), Math.ceil(ph));
    }
    let color, hiColor;
    if (gaining) {
      color = '#00e676'; hiColor = '#69f0ae';
    } else if (full) {
      color = '#f44336'; hiColor = '#ff8a80';
    } else {
      color = '#333'; hiColor = '#555';
    }
    const heart = [
      [0,1,1,0,1,1,0],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [0,1,1,1,1,1,0],
      [0,0,1,1,1,0,0],
      [0,0,0,1,0,0,0],
    ];
    for (let row = 0; row < heart.length; row++) {
      for (let col = 0; col < heart[row].length; col++) {
        if (heart[row][col]) {
          const isHi = (row === 0 && (col === 1 || col === 4)) || (row === 1 && (col === 1 || col === 4));
          px(col, row, isHi && full ? hiColor : color);
        }
      }
    }
    c.restore();
  }

  // ---- BACKGROUND ----
  let bgPattern = null;
  function buildBgPattern() {
    const bc = document.createElement('canvas');
    const bw = 96, bh = 96;
    bc.width = bw; bc.height = bh;
    const bx = bc.getContext('2d');
    bx.imageSmoothingEnabled = false;
    const bg = bx.createLinearGradient(0, 0, 0, bh);
    bg.addColorStop(0,   '#082244');
    bg.addColorStop(0.5, '#0a3060');
    bg.addColorStop(1,   '#061830');
    bx.fillStyle = bg;
    bx.fillRect(0, 0, bw, bh);
    for (let y = 0; y < bh; y += 8) {
      for (let x = 0; x < bw; x += 8) {
        if ((x + y) % 16 === 0) {
          bx.fillStyle = 'rgba(21,101,192,0.06)';
          bx.fillRect(x, y, 8, 8);
        }
      }
    }
    for (let y = 4; y < bh; y += 18) {
      bx.strokeStyle = `rgba(66,165,245,${0.07 + Math.random()*0.05})`;
      bx.lineWidth = 2;
      bx.beginPath();
      for (let x = 0; x <= bw; x += 3) {
        const py = y + Math.sin(x * 0.25 + y) * 2.5;
        x === 0 ? bx.moveTo(x, py) : bx.lineTo(x, py);
      }
      bx.stroke();
    }
    const bubColors = ['rgba(178,235,242,0.18)', 'rgba(129,212,250,0.14)', 'rgba(66,165,245,0.22)'];
    for (let i = 0; i < 7; i++) {
      const bxp = Math.floor(Math.random()*bw), byp = Math.floor(Math.random()*bh);
      const sz = 2 + Math.floor(Math.random()*3) * 2;
      bx.fillStyle = bubColors[i % bubColors.length];
      bx.fillRect(bxp, byp, sz, sz);
    }
    for (let i = 0; i < 3; i++) {
      const sx = Math.floor(Math.random()*bw);
      bx.fillStyle = `rgba(0,150,100,${0.15+Math.random()*0.1})`;
      bx.fillRect(sx, bh-6, 2, 6);
      bx.fillRect(sx+2, bh-4, 2, 4);
    }
    bgPattern = ctx.createPattern(bc, 'repeat');
  }

  function drawBackground() {
    if (!bgPattern) buildBgPattern();
    ctx.save();
    ctx.translate(0, bgOffset % 96);
    ctx.fillStyle = bgPattern;
    ctx.fillRect(0, -96, canvas.width, canvas.height + 192);
    ctx.restore();
    const dg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    dg.addColorStop(0, 'rgba(5,10,30,0.35)');
    dg.addColorStop(0.5, 'rgba(5,15,40,0.1)');
    dg.addColorStop(1, 'rgba(3,8,20,0.5)');
    ctx.fillStyle = dg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const vg = ctx.createRadialGradient(
      canvas.width/2, canvas.height/2, canvas.height*0.22,
      canvas.width/2, canvas.height/2, canvas.height*0.72
    );
    vg.addColorStop(0, 'transparent');
    vg.addColorStop(1, 'rgba(3,8,25,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(66,165,245,0.07)';
    ctx.lineWidth = 1;
    for (let i = 1; i < LANES; i++) {
      ctx.setLineDash([6, 10]);
      ctx.beginPath();
      ctx.moveTo(i * LANE_W, 0);
      ctx.lineTo(i * LANE_W, canvas.height);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // ---- PLAYER ----
  let fishFrame = 0;
  let fishFrameTimer = 0;
  const FISH_ANIM_SPEED = 180;
  let fishDir = 1;

  function initPlayer() {
    PLAYER.w = PLAYER_W;
    PLAYER.h = PLAYER_H;
    PLAYER.x = canvas.width / 2 - PLAYER_W / 2;
    PLAYER.y = canvas.height - PLAYER_H - 30;
    PLAYER.targetX = PLAYER.x;
  }

  function updatePlayer(delta) {
    if (mouseX >= 0) {
      PLAYER.targetX = mouseX - PLAYER.w / 2;
    }
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
      PLAYER.targetX -= 4 * speedMul * 0.8;
      fishDir = -1;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
      PLAYER.targetX += 4 * speedMul * 0.8;
      fishDir = 1;
    }
    PLAYER.x += (PLAYER.targetX - PLAYER.x) * 0.18;
    PLAYER.x = Math.max(0, Math.min(canvas.width - PLAYER.w, PLAYER.x));
    fishFrameTimer += delta;
    if (fishFrameTimer > FISH_ANIM_SPEED) {
      fishFrame = (fishFrame + 1) % 2;
      fishFrameTimer = 0;
    }
    PLAYER.y = canvas.height - PLAYER.h - 28 + Math.sin(Date.now() * 0.003) * 4;
  }

  function drawPlayer() {
    const sp = getSprite('goldfish', (c, w, h) => drawGoldfishSprite(c, w, h, false), PLAYER_W*2, PLAYER_H*2);
    ctx.save();
    if (invulnTimer > 0) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() * 0.018);
    }
    const wiggle = Math.sin(Date.now() * 0.012) * 2.5;
    ctx.drawImage(sp, PLAYER.x, PLAYER.y + wiggle, PLAYER.w, PLAYER.h);
    ctx.restore();
  }

  // ---- OBSTACLES ----
  function spawnObstacle() {
    const activeObstacles = obstacles.filter(o => o.y < canvas.height * 0.4);
    const occupiedLanes = new Set(activeObstacles.map(o => o.lane));
    if (occupiedLanes.size >= 4) return;
    const availLanes = [];
    for (let i = 0; i < LANES; i++) {
      if (!occupiedLanes.has(i)) availLanes.push(i);
    }
    if (availLanes.length === 0) return;
    const lane = availLanes[Math.floor(Math.random() * availLanes.length)];
    const type = Math.random() < 0.5 ? 'rock' : 'log';
    const x = lane * LANE_W + (LANE_W - OBSTACLE_W) / 2;
    obstacles.push({
      x, y: -OBSTACLE_H - 10,
      w: OBSTACLE_W, h: OBSTACLE_H,
      lane, type,
      speed: BASE_SPEED * speedMul * (0.85 + Math.random() * 0.3)
    });
  }

  function updateObstacles(delta) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].y += obstacles[i].speed * (delta / 16);
      if (obstacles[i].y > canvas.height + 60) {
        obstacles.splice(i, 1);
      }
    }
    obstacleTimer += delta;
    if (obstacleTimer >= obstacleInterval) {
      obstacleTimer = 0;
      spawnObstacle();
    }
  }

  function drawObstacles() {
    for (const o of obstacles) {
      let sp;
      if (o.type === 'rock') {
        sp = getSprite('rock', (c,w,h) => drawRockSprite(c,w,h), OBSTACLE_W*2, OBSTACLE_H*2);
      } else {
        sp = getSprite('log', (c,w,h) => drawLogSprite(c,w,h), OBSTACLE_W*2, OBSTACLE_H*2);
      }
      ctx.save();
      ctx.shadowColor = 'rgba(0,100,255,0.18)';
      ctx.shadowBlur = 8;
      ctx.drawImage(sp, o.x, o.y, o.w, o.h);
      ctx.restore();
    }
  }

  // ---- BUBBLES ----
  function spawnBubble() {
    const margin = BUBBLE_R + 10;
    const x = margin + Math.random() * (canvas.width - margin * 2);
    // Aparece desde arriba del canvas
    const y = -BUBBLE_R * 2; // arriba del canvas
    const sp = document.createElement('canvas');
    sp.width = BUBBLE_R * 2 + 4;
    sp.height = BUBBLE_R * 2 + 4;
    drawBubbleSprite(sp.getContext('2d'), BUBBLE_R + 2);
    bubbles.push({
      x, y,
      r: BUBBLE_R,
      sprite: sp,
      floatOffset: Math.random() * Math.PI * 2,
      vy: 3.5, // fijo hacia abajo
      born: Date.now()
    });
  }

  function updateBubbles(delta) {
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      // Cae hacia abajo escalado con la velocidad del juego
      b.y = b.y + b.vy * (delta / 16); // siempre baja
      if (b.y > canvas.height + BUBBLE_R * 4) {
        bubbles.splice(i, 1);
      }
    }
  }

  function drawBubbles() {
    for (const b of bubbles) {
      const sway = Math.sin(Date.now() * 0.0015 + b.floatOffset) * 3;
      ctx.save();
      ctx.shadowColor = '#4245f5';
      ctx.shadowBlur = 14;
      ctx.drawImage(b.sprite, b.x + sway - b.r - 2, b.y - b.r - 2);
      ctx.restore();
    }
  }

  // ---- PARTICLES ----
  function spawnParticles(x, y, color, n = 8) {
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 / n) * i + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 3;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 2 + Math.random() * 3,
        life: 1.0,
        color
      });
    }
  }

  function updateParticles(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * (delta / 16);
      p.y += p.vy * (delta / 16);
      p.vy += 0.08;
      p.life -= 0.025 * (delta / 16);
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }
  }

  // ---- COLLISION ----
  function checkCollisions() {
    const px = PLAYER.x + 6, py = PLAYER.y + 4;
    const pw = PLAYER.w - 12, ph = PLAYER.h - 8;

    if (invulnTimer <= 0) {
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        if (
          px < o.x + o.w - 4 && px + pw > o.x + 4 &&
          py < o.y + o.h - 4 && py + ph > o.y + 4
        ) {
          loseLife(o.x + o.w/2, o.y + o.h/2);
          obstacles.splice(i, 1);
          break;
        }
      }
    }

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      const sway = Math.sin(Date.now() * 0.0015 + b.floatOffset) * 3;
      const cx = PLAYER.x + PLAYER.w / 2;
      const cy = PLAYER.y + PLAYER.h / 2;
      const dist = Math.hypot(cx - (b.x + sway), cy - b.y);
      if (dist < b.r + 18) {
        collectBubble(i);
        break;
      }
    }
  }

  function loseLife(ox, oy) {
    lives = Math.max(0, lives - 1);
    invulnTimer = INVULN_MS;
    spawnParticles(PLAYER.x + PLAYER.w/2, PLAYER.y + PLAYER.h/2, '#ff4444', 12);
    updateLivesUI('lose');

    if (lives === 2 && !bubbleSpawned[0]) {
      bubbleSpawned[0] = true;
      setTimeout(spawnBubble, 800);
    }
    if (lives === 1 && !bubbleSpawned[1]) {
      bubbleSpawned[1] = true;
      setTimeout(spawnBubble, 800);
    }

    if (lives <= 0) {
      endGame();
    }
  }

  function collectBubble(idx) {
    const b = bubbles[idx];
    spawnParticles(b.x, b.y, '#80d8ff', 10);
    spawnParticles(b.x, b.y, '#fff', 5);
    bubbles.splice(idx, 1);
    if (lives < 3) {
      lives = Math.min(3, lives + 1);
      updateLivesUI('gain');
    }
  }

  // ---- UI UPDATES ----
  function updateLivesUI(event) {
    lifeCvs.forEach((c, i) => {
      const gaining = event === 'gain' && i === lives - 1;
      drawHeartSprite(c.getContext('2d'), 22, 22, i < lives, gaining);
    });
    if (event === 'gain') {
      setTimeout(() => {
        lifeCvs.forEach((c, i) => drawHeartSprite(c.getContext('2d'), 22, 22, i < lives, false));
      }, 400);
    }
  }

  function updateScoreUI() {
    const km = (score / 100).toFixed(2);
    scoreDisplay.textContent = km + ' km';
    speedDisplay.textContent = speedMul.toFixed(1) + 'x';
    const hi = Math.max(score, parseFloat(localStorage.getItem('goldfish_hi') || '0'));
    hiscoreDisplay.textContent = (hi / 100).toFixed(2) + ' km';
  }

  // ---- DIFFICULTY ----
  function updateDifficulty(delta) {
    speedTimer += delta;
    if (speedTimer >= SPEED_INCREASE_INTERVAL) {
      speedTimer = 0;
      if (Math.random() < RANDOM_SLOWDOWN_CHANCE && speedMul > 1.2) {
        speedMul = Math.max(1.0, speedMul - 0.3);
      } else {
        speedMul = Math.min(MAX_SPEED, speedMul + 0.2 + Math.random() * 0.15);
      }
      obstacleInterval = Math.max(400, OBSTACLE_INTERVAL_BASE / (speedMul * 0.7));
    }
  }

  // ---- GAME LOOP ----
  function gameLoop(ts) {
    if (gameState !== 'playing') return;
    dt = ts - lastTimestamp;
    if (dt > 100) dt = 100;
    lastTimestamp = ts;

    score += dt * speedMul * 0.008;
    bgOffset += 1.8 * speedMul * (dt / 16);

    if (invulnTimer > 0) invulnTimer -= dt;

    updateDifficulty(dt);
    updatePlayer(dt);
    updateObstacles(dt);
    updateBubbles(dt);
    updateParticles(dt);
    checkCollisions();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawObstacles();
    drawBubbles();
    drawPlayer();
    drawParticles();
    updateScoreUI();

    rafId = requestAnimationFrame(gameLoop);
  }

  // ---- GAME FLOW ----
  function startGame() {
    score = 0;
    lives = 3;
    speedMul = 1.0;
    obstacles = [];
    bubbles = [];
    particles = [];
    bubbleSpawned = [false, false];
    obstacleTimer = 0;
    obstacleInterval = OBSTACLE_INTERVAL_BASE;
    speedTimer = 0;
    invulnTimer = 0;
    bgOffset = 0;
    bgPattern = null;

    resize();
    initPlayer();
    updateLivesUI();
    updateScoreUI();

    btnStart.style.display = 'none';
    gameOverScore.style.display = 'none';
    startFishAnim.style.display = 'none';
    overlaySub.style.display = 'none';
    overlayTitle.style.display = 'none';
    countdownEl.style.display = 'block';

    gameState = 'countdown';
    let count = 3;
    countdownEl.textContent = count;
    const ivl = setInterval(() => {
      count--;
      if (count > 0) {
        countdownEl.textContent = count;
      } else if (count === 0) {
        countdownEl.textContent = '¡YA!';
      } else {
        clearInterval(ivl);
        overlay.classList.add('hidden');
        gameState = 'playing';
        lastTimestamp = performance.now();
        rafId = requestAnimationFrame(gameLoop);
      }
    }, 800);
  }

  function endGame() {
    gameState = 'gameover';
    if (rafId) cancelAnimationFrame(rafId);

    const km = (score / 100).toFixed(2);
    const hiRaw = parseFloat(localStorage.getItem('goldfish_hi') || '0');
    const isNew = score > hiRaw;
    if (isNew) {
      localStorage.setItem('goldfish_hi', score.toString());
      hiScore = score;
    }
    hiscoreDisplay.textContent = (Math.max(score, hiRaw) / 100).toFixed(2) + ' km';

    overlay.classList.remove('hidden');
    overlayTitle.style.display = 'block';
    overlayTitle.textContent = 'GAME OVER';
    overlaySub.style.display = 'none';
    startFishAnim.style.display = 'none';
    countdownEl.style.display = 'none';
    gameOverScore.style.display = 'block';
    gameOverScore.innerHTML = `Distancia recorrida: <span style="color:var(--gold)">${km} km</span><br>` +
      (isNew ? `<span style="color:#69f0ae">¡NUEVO RÉCORD!</span>` : `Récord: <span style="color:#69f0ae">${(hiRaw/100).toFixed(2)} km</span>`);
    btnStart.textContent = 'JUGAR DE NUEVO';
    btnStart.style.display = 'block';
  }

  function showStart() {
    overlay.classList.remove('hidden');
    overlayTitle.style.display = 'block';
    overlayTitle.textContent = 'GOLDFISH';
    overlaySub.style.display = 'block';
    startFishAnim.style.display = 'block';
    countdownEl.style.display = 'none';
    gameOverScore.style.display = 'none';
    btnStart.textContent = 'INICIAR JUEGO';
    btnStart.style.display = 'block';

    resize();
    buildBgPattern();
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawBackground();
    updateLivesUI();
    hiscoreDisplay.textContent = (hiScore/100).toFixed(2) + ' km';
  }

  // ---- INPUT ----
  const keys = {};
  document.addEventListener('keydown', e => { keys[e.key] = true; });
  document.addEventListener('keyup', e => { keys[e.key] = false; });

  document.addEventListener('mousemove', e => {
    if (gameState === 'playing') {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
    }
  });

  canvas.addEventListener('click', e => {
    if (gameState !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      const sway = Math.sin(Date.now() * 0.0015 + b.floatOffset) * 3;
      if (Math.hypot(cx - (b.x + sway), cy - b.y) < b.r + 8) {
        collectBubble(i);
        break;
      }
    }
  });

  btnStart.addEventListener('click', startGame);
document.addEventListener('keydown', function(event) {
  if (event.code === 'Space') {
    event.preventDefault(); // evita scroll de la página

    const modal = bootstrap.Modal.getOrCreateInstance(modalInstr);

    if (modalInstr.classList.contains('show')) {
      modal.hide(); // cerrará y ejecutará hidden.bs.modal
    } else {
      modal.show(); // abrirá y ejecutará show.bs.modal
    }
  }
});

  // ---- PAUSE ON INSTRUCCIONES MODAL ----
  const modalInstr = document.getElementById('modalInstrucciones');
  let pausedByModal = false;

  modalInstr.addEventListener('show.bs.modal', () => {
    if (gameState === 'playing') {
      gameState = 'paused';
      pausedByModal = true;
      if (rafId) cancelAnimationFrame(rafId);
    }
  });
  modalInstr.addEventListener('hidden.bs.modal', () => {
    if (pausedByModal) {
      pausedByModal = false;
      gameState = 'playing';
      lastTimestamp = performance.now();
      rafId = requestAnimationFrame(gameLoop);
    }
  });

  // ---- RESIZE ----
  window.addEventListener('resize', () => {
    if (gameState !== 'playing') {
      resize();
      buildBgPattern();
      ctx.clearRect(0,0,canvas.width,canvas.height);
      drawBackground();
    } else {
      resize();
    }
  });

  // ---- INIT ----
  resize();
  showStart();
  updateLivesUI();

})();