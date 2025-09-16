// --- LAVA LAMP (mobile-optimized, translucent blobs) ---

let lamp = { x: 220, y: 260, w: 180, h: 320, dragging: false, dx: 0, dy: 0 };
let blobs = [];
let topCol, botCol, glassCol;

function setup() {
  const { w, h } = canvasSizeForPhone();
  createCanvas(w, h);
  pixelDensity(1);      // smoother on high-DPI phones
  frameRate(60);

  // position/size lamp relative to screen
  lamp.w = constrain(Math.round(w * 0.55), 160, 240);
  lamp.h = constrain(Math.round(h * 0.55), 280, 420);
  lamp.x = w * 0.5;
  lamp.y = h * 0.55;

  topCol   = color(255, 90, 160);
  botCol   = color(255, 180, 60);
  glassCol = color(255, 255, 255, 50);

  // scale blob count for small screens
  const targetBlobs = (w < 380) ? 5 : 8;
  blobs = [];
  for (let i = 0; i < targetBlobs; i++) blobs.push(makeBlob());
}

function windowResized() {
  const { w, h } = canvasSizeForPhone();
  resizeCanvas(w, h);

  // re-center and scale lamp on rotation/resize
  lamp.w = constrain(Math.round(w * 0.55), 160, 240);
  lamp.h = constrain(Math.round(h * 0.55), 280, 420);
  lamp.x = w * 0.5;
  lamp.y = h * 0.55;
}

function canvasSizeForPhone() {
  // fits phones nicely, caps size for desktops
  const w = Math.min(window.innerWidth, 600);
  const h = Math.min(window.innerHeight * 0.9, 720);
  return { w, h };
}

function draw() {
  background(18, 22, 35);

  drawBaseAndCap();
  drawLampGlassAndContents();

  // subtle glass highlight
  noFill();
  stroke(255, 255, 255, 35);
  strokeWeight(2);
  let r = lamp.w * 0.5;
  arc(lamp.x - lamp.w*0.15, lamp.y - lamp.h*0.2, r, lamp.h*0.8, -HALF_PI, HALF_PI);
  noStroke();
}

// ---------- Helpers ----------
function makeBlob() {
  const padX = lamp.w * 0.30;
  const padY = lamp.h * 0.35;
  return {
    x: random(lamp.x - padX, lamp.x + padX),
    y: random(lamp.y - padY, lamp.y + padY),
    r: random(18, 42),
    vx: random(-0.35, 0.35),
    vy: random(-0.55, 0.15),
    phase: random(TWO_PI),
    alpha: random(110, 170) // transparency per blob
  };
}

function drawBaseAndCap() {
  fill(70);
  noStroke();
  rectMode(CENTER);
  rect(lamp.x, lamp.y + lamp.h/2 + 18, lamp.w*0.8, 36, 8); // base
  rect(lamp.x, lamp.y - lamp.h/2 - 14, lamp.w*0.6, 28, 8); // cap
}

function drawLampGlassAndContents() {
  const gx = lamp.x, gy = lamp.y, gw = lamp.w*0.7, gh = lamp.h;

  push();
  drawingContext.save();
  translate(gx, gy);
  const ctx = drawingContext;
  const rx = -gw/2, ry = -gh/2, rad = 22;

  // clip to rounded glass
  ctx.beginPath();
  roundedRectPath(ctx, rx, ry, gw, gh, rad);
  ctx.clip();

  // vertical gradient
  for (let i = 0; i <= gh; i++) {
    const t = i / gh;
    stroke( lerpColor(topCol, botCol, t) );
    line(-gw/2, -gh/2 + i, gw/2, -gh/2 + i);
  }

  // blobs: translucent with soft halo + core
  noStroke();
  for (let b of blobs) {
    // buoyancy + wobble
    b.vy -= 0.0045;
    b.vx += 0.06 * Math.sin(frameCount*0.02 + b.phase);

    b.x += Math.max(-1.2, Math.min(1.2, b.vx));
    b.y += Math.max(-1.2, Math.min(1.2, b.vy));

    // soft outer halo (more transparent)
    fill(255, 120, 90, b.alpha * 0.6);
    circle(b.x - gx, b.y - gy, b.r * 2.3);

    // inner core (less transparent)
    fill(255, 120, 90, b.alpha);
    circle(b.x - gx, b.y - gy, b.r * 1.7);

    // bounds inside glass
    const left  = -gw/2 + b.r, right =  gw/2 - b.r;
    const top   = -gh/2 + b.r, bot   =  gh/2 - b.r;
    if (b.x - gx < left  || b.x - gx > right) b.vx *= -0.9;
    if (b.y - gy < top)  { b.vy *= -0.7; b.y = gy + top; }
    if (b.y - gy > bot)  { b.vy *= -0.7; b.y = gy + bot; }
  }

  // occasionally add a blob
  if (frameCount % 360 === 0 && blobs.length < 10) blobs.push(makeBlob());

  drawingContext.restore();

  // glass outline
  noFill();
  stroke(glassCol);
  strokeWeight(6);
  roundedRect(lamp.x, lamp.y, gw, gh, rad);
  noStroke();
}

function roundedRect(x, y, w, h, r) {
  push();
  translate(x, y);
  rectMode(CENTER);
  noFill();
  rect(0, 0, w, h, r);
  pop();
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

// ---------- Drag to move lamp ----------
function mousePressed() {
  if (pointInLamp(mouseX, mouseY)) {
    lamp.dragging = true;
    lamp.dx = mouseX - lamp.x;
    lamp.dy = mouseY - lamp.y;
  }
}
function mouseDragged() {
  if (lamp.dragging) {
    lamp.x = mouseX - lamp.dx;
    lamp.y = mouseY - lamp.dy;
  }
}
function mouseReleased() { lamp.dragging = false; }

// touch support for phones
function touchStarted(){ mousePressed(); return false; }
function touchMoved(){ mouseDragged(); return false; }
function touchEnded(){ mouseReleased(); return false; }

function pointInLamp(px, py) {
  const gw = lamp.w*0.7, gh = lamp.h;
  return (px > lamp.x - gw/2 && px < lamp.x + gw/2 &&
          py > lamp.y - gh/2 && py < lamp.y + gh/2);
}
