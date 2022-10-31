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

function draw() {
  background(bgColor);

  setPixel(0, 0, "red");
  setPixel(cW - pDim, cH - pDim, "green");
  setPixel(0, cH - pDim, "blue");
  setPixel(cW - pDim, 0, "yellow");

  drawCircleArray(control_points);
}
