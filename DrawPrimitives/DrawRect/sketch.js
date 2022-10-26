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

const rect_control_points = [];

function setup() {
  let c = createCanvas(cW, cH);
  c.mouseClicked(() => {
    rect_control_points.push([mouseX, mouseY]);
  });
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
    console.log(colorMap);
    lineDDA(tlx, tly, tlx, bry, color);
    lineDDA(tlx, tly, brx, tly, color);
    lineDDA(brx, bry, tlx, bry, color);
    lineDDA(brx, bry, brx, tly, color);
  }
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

  drawRectArray(rect_control_points);
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
