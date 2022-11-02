const fabs = Math.abs;
const int = Math.floor;

const transClientSpaceToFragmentSpace = (p) => [
  int(p[0] / pDim),
  int(p[1] / pDim),
];
const invClientSpaceToFragmentSpace = (p) => [p[0] * pDim, p[1] * pDim];

function viewToModel(x, y) {
  return [int(x / pDim), int(y / pDim)];
}

function drawLineLoop(vertices) {
  if (vertices.length <= 2) {
    return;
  }

  let prev = vertices[0];
  for (let i = 1; i < vertices.length; i++) {
    if (!colorMap.has(i)) {
      colorMap.set(i, `${drawColor}`);
    }
    const color = colorMap.get(i);
    const [px, py] = prev;
    const [nx, ny] = vertices[i];
    lineDDA(px, py, nx, ny, color);
    prev = vertices[i];
  }

  const [head_x, head_y] = vertices[0];
  const [tail_x, tail_y] = vertices[vertices.length - 1];
  lineDDA(tail_x, tail_y, head_x, head_y, drawColor);
}

function setPixel(_x, _y, color) {
  strokeWeight(0);
  fill(color);
  rect(...invClientSpaceToFragmentSpace([_x, _y]), pDim, pDim);
}

function drawScanLine(y, left, right, color = "green") {
  strokeWeight(0);
  fill(color);
  for (let i = left; i < right + 1; i++) {
    rect(int(i) * pDim, int(y) * pDim, pDim, pDim);
  }
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

let more_setup;

function setup() {
  let c = createCanvas(cW, cH);
  c.mouseClicked(() => {
    vertices_client_space.push([mouseX, mouseY]);
  });
  if (more_setup) {
    more_setup(vertices_client_space.map(transClientSpaceToFragmentSpace));
  }
}

function draw() {
  background(bgColor);

  setPixel(0, 0, "red");
  setPixel(99, 99, "green");
  setPixel(0, 99, "blue");
  setPixel(99, 0, "yellow");

  drawArray(vertices_client_space.map(transClientSpaceToFragmentSpace));
}
