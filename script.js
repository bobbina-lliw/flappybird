(() => {
  const canvas = document.getElementById('game');
  const c = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let running = false, paused = false, gameOver = false;
  const GRAVITY = 0.45, FLAP = -7.5, PIPE_GAP_BASE = 140;
  const PIPE_WIDTH = 64, PIPE_SPACING = 250, GROUND_H = 80;
  let speed = 2.2, frame = 0, score = 0;
  const best = +localStorage.getItem('flappyHighScore') || 0;
  document.getElementById('best').textContent = best;

  const bird = { x: 80, y: H * 0.45, vy: 0, r: 12, rot: 0 };
  const pipes = [];

  function reset() {
    running = false; paused = false; gameOver = false;
    speed = 2.2; frame = 0; score = 0;
    pipes.length = 0;
    bird.x = 80; bird.y = H * 0.45; bird.vy = 0; bird.rot = 0;
    spawnPipe(true); spawnPipe(true); spawnPipe(true);
    drawSplash();
  }

  function start() {
    if (running) return;
    running = true; gameOver = false; paused = false;
    requestAnimationFrame(loop);
  }

  function togglePause() {
    if (!running || gameOver) return;
    paused = !paused;
    if (!paused) requestAnimationFrame(loop);
    else drawPauseOverlay();
  }

  function loop() {
    if (!running || paused) return;
    update(); draw();
    requestAnimationFrame(loop);
  }

  function update() {
    frame++;
    bird.vy += GRAVITY; bird.y += bird.vy;
    bird.rot = Math.max(-0.5, Math.min(1.0, bird.vy / 10));

    if (pipes.length === 0 || (W - (pipes[pipes.length - 1].x)) >= PIPE_SPACING) {
      spawnPipe();
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i]; p.x -= speed;
      if (!p.passed && p.x + PIPE_WIDTH < bird.x) {
        p.passed = true; score++;
        document.getElementById('score').textContent = score;
        speed = 2.2 + Math.min(2.4, score * 0.06);
      }
      if (p.x + PIPE_WIDTH < -10) pipes.splice(i, 1);
    }

    if (bird.y + bird.r > H - GROUND_H || bird.y - bird.r < 0) endGame();

    const bx = bird.x, by = bird.y, r = bird.r;
    for (const p of pipes) {
      const withinX = bx + r > p.x && bx - r < p.x + PIPE_WIDTH;
      if (withinX) {
        const gap = getGap();
        const top = p.gapY - gap / 2, bottom = p.gapY + gap / 2;
        if (by - r < top || by + r > bottom) endGame();
      }
    }
  }

  function endGame() {
    if (gameOver) return;
    gameOver = true; running = false;
    const newBest = Math.max(score, +localStorage.getItem('flappyHighScore') || 0);
    localStorage.setItem('flappyHighScore', newBest);
    document.getElementById('best').textContent = newBest;
    draw(); drawGameOverOverlay();
  }

  function flap() {
    if (gameOver) { reset(); return; }
    if (!running) start();
    bird.vy = FLAP;
  }

  function spawnPipe(initial=false) {
    const margin = 70, gap = getGap();
    const gapY = margin + Math.random() * (H - GROUND_H - margin*2);
    const lastX = pipes.length ? pipes[pipes.length - 1].x : W + 120;
    const startX = initial ? (lastX + PIPE_SPACING) : W + 10;
    pipes.push({ x: startX, gapY, passed: false });
  }

  function getGap() {
    return Math.max(105, PIPE_GAP_BASE - score * 1.5);
  }

  // Drawing
  function draw() {
    c.clearRect(0,0,W,H);
    drawBackdrop();
    for (const p of pipes) drawPipe(p);
    drawBird();
    drawGround();
    drawScore();
  }

  function drawBackdrop() {
    c.fillStyle = '#b7ecf2';
    for (let i = 0; i < 6; i++) {
      const x = (i * 90 + (frame * 0.25)) % (W + 120) - 60;
      const y = 60 + (i % 3) * 40;
      cloud(x, y, 22 + (i%3)*6);
    }
  }

  function cloud(x, y, r) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI*2);
    c.arc(x + r*0.9, y + r*0.1, r*0.8, 0, Math.PI*2);
    c.arc(x - r*0.8, y + r*0.2, r*0.9, 0, Math.PI*2);
    c.arc(x, y + r*0.4, r*0.85, 0, Math.PI*2);
    c.fill();
  }
  
const pipeTopImg = new Image();
pipeTopImg.src = 'https://png.pngtree.com/png-vector/20201128/ourmid/pngtree-burning-fire-png-image_2447015.png';

const pipeBottomImg = new Image();
pipeBottomImg.src = 'https://png.pngtree.com/png-vector/20201128/ourmid/pngtree-burning-fire-png-image_2447015.png';

function drawPipe(p) {
  const gap = getGap();
  const topH = p.gapY - gap / 2;
  const bottomY = p.gapY + gap / 2;
  const bottomH = H - GROUND_H - bottomY;

  // Draw top pipe (image will stretch to height)
  c.drawImage(pipeTopImg, p.x, topH - pipeTopImg.height, PIPE_WIDTH, pipeTopImg.height);

  // Draw bottom pipe
  c.drawImage(pipeBottomImg, p.x, bottomY, PIPE_WIDTH, pipeBottomImg.height);
}

const birdImg = new Image();
birdImg.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNib2PoKB79JbQm2GJJNxSV9-vJXR1vONA1w&s'; // replace with your bird image path

function drawBird() {
  c.save();
  c.translate(bird.x, bird.y); // move to bird position
  c.rotate(bird.rot); // tilt when falling/rising

  // Center the image on the bird's position
  const birdWidth = 34;  // match your PNG dimensions or scale
  const birdHeight = 24;
  c.drawImage(birdImg, -birdWidth / 2, -birdHeight / 2, birdWidth, birdHeight);

  c.restore();
}


  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawGround() {
    const groundY = H - GROUND_H;
    c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ground');
    c.fillRect(0, groundY, W, GROUND_H);
    c.fillStyle = 'rgba(0,0,0,.06)';
    const off = (frame * speed * 0.75) % 20;
    for (let x = -20 + off; x < W; x += 20) {
      c.fillRect(x, groundY, 12, 6);
    }
  }

  function drawScore() {
    c.save();
    c.font = 'bold 32px system-ui';
    c.textAlign = 'center';
    c.fillStyle = 'rgba(255,255,255,.95)';
    c.strokeStyle = 'rgba(0,0,0,.25)';
    c.lineWidth = 6;
    const txt = String(score);
    c.strokeText(txt, W/2, 70);
    c.fillText(txt, W/2, 70);
    c.restore();
  }

  function drawSplash() {
    draw(); overlayBox('Flappy Bird', 'Tap/Click or press SPACE/↑ to flap');
  }
  function drawPauseOverlay() {
    overlayBox('Paused', 'Press P to resume');
  }
  function drawGameOverOverlay() {
    overlayBox('Game Over', `Score: ${score}\\nBest: ${localStorage.getItem('flappyHighScore')}`);
  }

  function overlayBox(title, subtitle) {
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0,0,W,H);
    const bw = 300, bh = 160, bx = (W - bw)/2, by = (H - bh)/2 - 30;
    c.fillStyle = 'rgba(255,255,255,.96)';
    roundRect(bx, by, bw, bh, 14);
    c.fill(); c.strokeStyle = 'rgba(0,0,0,.08)'; c.stroke();
    c.fillStyle = '#0f172a'; c.textAlign = 'center';
    c.font = '700 28px system-ui'; c.fillText(title, W/2, by + 44);
    c.font = '500 16px system-ui';
    String(subtitle).split('\\n').forEach((l,i)=> c.fillText(l, W/2, by + 80 + i*22));
    c.font = '600 14px system-ui'; c.fillText('R to Restart • P to Pause', W/2, by + bh - 18);
  }

  function roundRect(x,y,w,h,r){
    c.beginPath();
    c.moveTo(x+r,y);
    c.arcTo(x+w,y,x+w,y+h,r);
    c.arcTo(x+w,y+h,x,y+h,r);
    c.arcTo(x,y+h,x,y,r);
    c.arcTo(x,y,x+w,y,r);
    c.closePath();
  }

  // Input
  function onPress(e){ e.preventDefault(); flap(); }
  window.addEventListener('pointerdown', onPress, {passive:false});
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') flap();
    if (e.code === 'KeyP') togglePause();
    if (e.code === 'KeyR') reset();
  });
  document.getElementById('restart').onclick = reset;
  document.getElementById('pause').onclick = togglePause;

  reset();
})();
