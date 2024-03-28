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

function drawLineStrip(vertices) {
  if (vertices.length < 2) {
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
}

function drawLineStripWithColor(vertices, color) {
  if (vertices.length < 2) {
    return;
  }

  let prev = vertices[0];
  for (let i = 1; i < vertices.length; i++) {
    const [px, py] = prev;
    const [nx, ny] = vertices[i];
    lineDDA(px, py, nx, ny, color);
    prev = vertices[i];
  }
}

function drawLineLoop(vertices) {
  if (vertices.length <= 2) {
    return;
  }

  drawLineStrip(vertices);

  const [head_x, head_y] = vertices[0];
  const [tail_x, tail_y] = vertices[vertices.length - 1];
  lineDDA(tail_x, tail_y, head_x, head_y, drawColor);
}

let canvasCtx;
let canvasElt;

function setPixel(_x, _y, color) {
  fill(color);
  // rect(...invClientSpaceToFragmentSpace([_x, _y]), pDim, pDim);
  canvasCtx.fillRect(...invClientSpaceToFragmentSpace([_x, _y]), pDim, pDim);
}

function drawScanLine(y, left, right, color = "green") {
  fill(color);
  for (let i = left; i < right + 1; i++) {
    rect(int(i) * pDim, int(y) * pDim, pDim, pDim);
  }
}

function lineDDA(_x1, _y1, _x2, _y2, color = "green") {
  for (const pos of DdaLineRasterizer(_x1, _y1, _x2, _y2)) {
    setPixel(...pos, color);
  }
}

function DdaLineRasterizer(_x1, _y1, _x2, _y2) {
  return DdaInterpolation([int(_x1), int(_y1)], [int(_x2), int(_y2)]).map((p) =>
    p.map(int),
  );
}

function DdaInterpolation(_start, _end) {
  const start = _start;
  const end = _end;
  let dAttr = [];
  let e = 0;
  for (let i = 0; i < start.length; i++) {
    const diff = end[i] - start[i];
    dAttr.push(diff);
    if (fabs(diff) > e) {
      e = fabs(diff);
    }
  }
  dAttr = dAttr.map((x) => x / e);
  const ans = [];
  const stt = [...start];
  for (let i = 1; i <= e; i++) {
    ans.push([...stt]);
    for (let j = 0; j < stt.length; j++) {
      stt[j] += dAttr[j];
    }
  }
  return ans;
}

let more_setup;

function setup() {
  let c = createCanvas(cW, cH);
  canvasCtx = c.elt.getContext("2d");
  canvasElt = c.elt;
  c.elt.addEventListener("contextmenu", (e) => e.preventDefault());
  c.mouseClicked(() => {
    vertices_client_space.push([mouseX, mouseY]);
  });
  if (more_setup) {
    more_setup(vertices_client_space.map(transClientSpaceToFragmentSpace));
  }
}

function draw() {
  background(bgColor);

  setPixel(0, 0, "#000000");
  setPixel(99, 99, "#FFFF00");
  setPixel(0, 99, "#00FF00");
  setPixel(99, 0, "#FF0000");

  strokeWeight(0);
  if (vertices_client_space.length % 2 === 1) {
    vertices_client_space.push([mouseX, mouseY]);
    drawArray(vertices_client_space.map(transClientSpaceToFragmentSpace));
    vertices_client_space.pop();
  } else {
    drawArray(vertices_client_space.map(transClientSpaceToFragmentSpace));
  }

  fill(100);
  rect(0, cH - 35, 125, 25);
  fill(255);
  text(`渲染帧率: ${int(frameRate())} 帧每秒`, 5, cH - 18);
}
