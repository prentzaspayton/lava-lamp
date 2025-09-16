// === Full-screen Lava Lamp (drag blobs; phone-optimized) ===

let blobs = [];
let topCol, botCol;
let draggingBlob = null;   // index of blob being dragged (single-touch version)
let dragDX = 0, dragDY = 0;

function setup() {
  const { w, h } = canvasSizeForPhone();
  createCanvas(w, h);
  pixelDensity(1);
  frameRate(60);

  // gradient colors
  topCol = color(255, 90, 160);
  botCol = color(255, 180, 60);

  // scale blob count by screen size
  const target = width < 380 ? 6 : 10;
  blobs = [];
  for (let i = 0; i < target; i++) blobs.push(makeBlob());
}

function windowResized() {
  const { w, h } = canvasSizeForPhone();
  resizeCanvas(w, h);

  // keep blobs inside new bounds
  for (let b of blobs) {
    b.x = constrain(b.x, b.r, width - b.r);
    b.y = constrain(b.y, b.r, height - b.r);
  }
}

function canvasSizeForPhone() {
  // Fill the phone nicely (cap for desktops)
  const w = Math.min(window.innerWidth, 600);
  const h = Math.min(window.innerHeight, 900);
  return { w, h };
}

function draw() {
  // Vertical gradient = "glass"
  for (let y = 0; y < height; y++) {
    const t = y / (height - 1);
    stroke( lerpColor(topCol, botCol, t) );
    line(0, y, width, y);
  }

  // Animate + draw blobs
  noStroke();
  for (let i = 0; i < blobs.length; i++) {
    const b = blobs[i];

    if (draggingBlob !== i) {
      // buoyancy + gentle wobble
      b.vy -= 0.0035; // upforce
      b.vx += 0.05 * sin(frameCount * 0.02 + b.phase);

      // integrate with caps for stability
      b.x += constrain(b.vx, -1.2, 1.2);
      b.y += constrain(b.vy, -1.2, 1.2);
    }

    // bounds (bounce off screen edges)
    if (b.x < b.r)         { b.x = b.r;           b.vx *= -0.9; }
    if (b.x > width - b.r) { b.x = width - b.r;   b.vx *= -0.9; }
    if (b.y < b.r)         { b.y = b.r;           b.vy *= -0.7; }
    if (b.y > height - b.r){ b.y = height - b.r;  b.vy *= -0.7; }

    // draw: translucent halo + core for realistic lava
    fill(b.col.levels[0], b.col.levels[1], b.col.levels[2], b.alpha * 0.5);
    circle(b.x, b.y, b.r * 2.3);

    fill(b.col.levels[0], b.col.levels[1], b.col.levels[2], b.alpha);
    circle(b.x, b.y, b.r * 1.7);
  }

  // optional soft glass glare
  noFill();
  stroke(255, 255, 255, 30);
  strokeWeight(2);
  const glareX = width * 0.25;
  line(glareX, height * 0.1, glareX, height * 0.9);
  noStroke();
}

function makeBlob() {
  const r = random(18, 46);
  return {
    x: random(r, width - r),
    y: random(r, height - r),
    r,
    vx: random(-0.3, 0.3),
    vy: random(-0.5, 0.15),
    phase: random(TWO_PI),
    alpha: random(110, 170),
    col: color(255, 120, 90) // tweak blob hue here
  };
}

// --- Pointer/Touch interaction: drag a single blob ---
function mousePressed() {
  // pick the topmost blob under the pointer
  for (let i = blobs.length - 1; i >= 0; i--) {
    const b = blobs[i];
    if (dist(mouseX, mouseY, b.x, b.y) <= b.r * 1.1) {
      draggingBlob = i;
      dragDX = mouseX - b.x;
      dragDY = mouseY - b.y;
      // soften velocity when grabbed
      b.vx *= 0.2;
      b.vy *= 0.2;
      break;
    }
  }
}

function mouseDragged() {
  if (draggingBlob !== null) {
    const b = blobs[draggingBlob];
    b.x = constrain(mouseX - dragDX, b.r, width - b.r);
    b.y = constrain(mouseY - dragDY, b.r, height - b.r);
  }
}

function mouseReleased() {
  if (draggingBlob !== null) {
    const b = blobs[draggingBlob];
    // give a tiny nudge based on drag end for feel
    b.vx += (movedX || 0) * 0.02;
    b.vy += (movedY || 0) * 0.02;
  }
  draggingBlob = null;
}

// Touch aliases for phones
function touchStarted(){ mousePressed(); return false; }
function touchMoved(){ mouseDragged(); return false; }
function touchEnded(){ mouseReleased(); return false; }
