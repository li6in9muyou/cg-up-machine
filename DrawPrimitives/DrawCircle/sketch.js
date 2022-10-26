const cW = 400;
const cH = 400;

const pDim = 4;
const bgColor = 0;

const colorPicker = document.getElementById("setColor");
let drawColor = colorPicker.value;
colorPicker.addEventListener("change", (ev) => {
  drawColor = ev.target.value;
});
const colorMap = new Map();

const fabs = Math.abs;
const int = Math.round;

const transModelView = (x, y) => [x / pDim, y / pDim];

const control_points = [];

function setup() {
  let c = createCanvas(cW, cH);
  c.mouseClicked(() => {
    control_points.push([mouseX, mouseY]);
  });
}

function drawCircleArray(array) {
  if (array.length === 0) {
    return;
  }
  for (let i = 0; i < array.length; i += 2) {
    const tl = array[i];

    let br = array[i + 1];
    if (br === undefined) {
      br = [mouseX, mouseY];
    }

    let color = colorMap.get(i);
    if (color === undefined) {
      colorMap.set(i, `${drawColor}`);
      color = drawColor;
    }
    drawCircle(tl, br, color);
  }
}

function drawRectArray(array) {
  if (array.length === 0) {
    return;
  }
  for (let i = 0; i < array.length; i += 2) {
    const tl = array[i];
    const [tlx, tly] = tl;

    let br = array[i + 1];
    if (br === undefined) {
      br = [mouseX, mouseY];
    }
    const [brx, bry] = br;

    if (!colorMap.has(i)) {
      colorMap.set(i, `${drawColor}`);
    }
    const color = colorMap.get(i);
    lineDDA(tlx, tly, tlx, bry, color);
    lineDDA(tlx, tly, brx, tly, color);
    lineDDA(brx, bry, tlx, bry, color);
    lineDDA(brx, bry, brx, tly, color);
  }
}

function drawCircle(center, pass, color) {
  const [cx, cy] = center;
  const [px, py] = pass;
  setPixel(...center, "red");
  const radius = Math.sqrt((py - cy) * (py - cy) + (cx - px) * (cx - px));
  let prev_x = cx + radius;
  let prev_y = cy;
  const steps = radius > 20 ? 100 : 40;
  const step_theta = (2 * Math.PI) / steps;
  for (let i = 0; i < steps; i++) {
    const theta = i * step_theta;
    const next_x = cx + radius * Math.cos(theta);
    const next_y = cy + radius * Math.sin(theta);
    lineDDA(prev_x, prev_y, next_x, next_y, color);
    prev_x = next_x;
    prev_y = next_y;
  }
  lineDDA(prev_x, prev_y, cx + radius, cy, color);
}

function viewToModel(x, y) {
  return [int(x / pDim), int(y / pDim)];
}

function draw() {
  background(bgColor);

  setPixel(0, 0, "red");
  setPixel(cW - pDim, cH - pDim, "green");
  setPixel(0, cH - pDim, "blue");
  setPixel(cW - pDim, 0, "yellow");

  drawCircleArray(control_points);
}

function setPixel(_x, _y, color) {
  const [x, y] = transModelView(_x, _y);
  strokeWeight(0);
  fill(color);
  rect(x * pDim, y * pDim, pDim, pDim);
}

function lineDDA(x1, y1, x2, y2, color = "green") {
  let dx, dy, e, x, y;
  dx = x2 - x1;
  dy = y2 - y1;
  e = fabs(dx) > fabs(dy) ? fabs(dx) : fabs(dy);
  dx /= e;
  dy /= e;
  x = x1;
  y = y1;
  for (let i = 1; i <= e; i++) {
    setPixel(int(x + 0.5), int(y + 0.5), color);
    x += dx;
    y += dy;
  }
}
