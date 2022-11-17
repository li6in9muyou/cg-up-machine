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

function lineDDA(_x1, _y1, _x2, _y2, color = "green") {
  for (const pos of DdaLineRasterizer(_x1, _y1, _x2, _y2)) {
    setPixel(...pos, color);
  }
}

function DdaLineRasterizer(_x1, _y1, _x2, _y2) {
  return DdaInterpolation([int(_x1), int(_y1)], [int(_x2), int(_y2)]).map((p) =>
    p.map(int)
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
  c.mouseClicked(() => {
    vertices_client_space.push([mouseX, mouseY]);
  });
  if (more_setup) {
    more_setup(vertices_client_space.map(transClientSpaceToFragmentSpace));
  }
  // noLoop();
}

function draw() {
  background(bgColor);

  setPixel(0, 0, "red");
  setPixel(99, 99, "green");
  setPixel(0, 99, "blue");
  setPixel(99, 0, "yellow");

  const thisFrame = vertices_client_space.map(transClientSpaceToFragmentSpace);
  if (vertices_client_space.length % 2 === 1) {
    thisFrame.push(transClientSpaceToFragmentSpace([mouseX, mouseY]));
  } else {
    drawArray(vertices_client_space.map(transClientSpaceToFragmentSpace));
  }
  drawArray(thisFrame);
}

window.addEventListener("load", () => {
  const mark_up = `
      <ul>
        <li>
          <a href="#">图形绘制</a>
          <ul>
            <li>
              <a href="/cg-up-machine/DrawPrimitives/DrawRect/index.html">绘制矩形</a>
            </li>
            <li>
              <a href="/cg-up-machine/DrawPrimitives/DrawCircle/index.html">绘制圆形</a>
            </li>
          </ul>
        </li>
        <li>
          <a href="#">区域填充</a>
          <ul>
            <li>
              <a href="/cg-up-machine/FillPolygon/index.html">绘制多边形</a>
            </li>
          </ul>
        </li>
        <li>
          <a href="#">三维变换</a>
          <ul>
            <li>
              <a href="#">绘制一个三维立方体</a>
            </li>
            <li>
              <a href="#">沿 X 轴方向平移</a>
            </li>
            <li>
              <a href="#">沿 Y 轴方向平移</a>
            </li>
            <li>
              <a href="#">沿 Z 轴方向平移</a>
            </li>
            <li>
              <a href="#">绕 X 轴旋转</a>
            </li>
            <li>
              <a href="#">绕 Y 轴旋转</a>
            </li>
            <li>
              <a href="#">绕 Z 轴旋转</a>
            </li>
          </ul>
        </li>
      </ul>`;
  const nav = document.createElement("nav");
  nav.innerHTML = mark_up;
  nav.dataset.nav = "";
  document.body.prepend(nav);

  const btn = document.createElement("button");
  btn.id = "toggleNav";
  btn.innerText = "图形应用";
  btn.dataset.toggleNav = "";
  document.body.prepend(btn);

  let showNav = false;
  nav.classList.add("hidden");
  btn.addEventListener("click", () => {
    showNav = !showNav;
    if (showNav) {
      nav.classList.remove("hidden");
    } else {
      nav.classList.add("hidden");
    }
  });

  const link = document.createElement("link");
  link.href = "/public/index.css";
  link.type = "text/css";
  link.rel = "stylesheet";
  document.getElementsByTagName("head")[0].appendChild(link);
});
