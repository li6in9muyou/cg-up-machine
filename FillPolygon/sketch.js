elements = [
  [
    [199, 20],
    [255, 0, 0],
  ],
  [
    [10, 390],
    [0, 255, 0],
  ],
  [
    [390, 390],
    [0, 0, 255],
  ],
];

vertices_client_space = [
  elements[0][0],
  elements[1][0],
  elements[2][0],
  elements[0][0],
];

let fillerText = "";

class Point {
  x;
  y;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Edge {
  yMin;
  yMax;
  dX;
  pUp;
  pDw;
  fragments;

  constructor(p1, p2) {
    if (p1.y < p2.y) {
      this.pUp = p1;
      this.pDw = p2;
    } else {
      this.pUp = p2;
      this.pDw = p1;
    }
    this.yMin = this.pUp.y;
    this.yMax = this.pDw.y;
    this.dX = (this.pDw.x - this.pUp.x) / (this.pDw.y - this.pUp.y);
    const xLookUp = DdaLineRasterizer(
      this.pUp.x,
      this.pUp.y,
      this.pDw.x,
      this.pDw.y
    ).map((p) => [p[1], p[0]]);
    this.fragments = new Map(xLookUp);
  }

  getXAt(y) {
    return this.fragments.get(y);
  }
}

function drawFilledPolygon(array) {
  if (array.length < 3) return;
  const inScreenCoordinate = array.map((arr) => new Point(arr[0], arr[1]));

  const allEdges = [];
  for (let i = 0; i < inScreenCoordinate.length - 1; i += 1) {
    allEdges.push(new Edge(inScreenCoordinate[i], inScreenCoordinate[i + 1]));
  }
  allEdges.push(
    new Edge(
      inScreenCoordinate[0],
      inScreenCoordinate[inScreenCoordinate.length - 1]
    )
  );

  const sortByY = allEdges.sort((ea, eb) => {
    return ea.yMin - eb.yMin;
  });

  const EdgeTablePerScanLine = new Array(100).fill(null).map(() => []);

  for (const edge of sortByY) {
    const first_scan_line = edge.yMin;
    EdgeTablePerScanLine[first_scan_line].push(edge);
  }

  let activeEdges = [];
  for (let y = 0; y < nLines; y++) {
    const edgesFromThisY = EdgeTablePerScanLine[y];
    activeEdges = [...activeEdges, ...edgesFromThisY].filter(
      (edge) => edge.yMin <= y && edge.yMax > y
    );

    const xStops = activeEdges.map((edge) => int(edge.getXAt(y)));
    xStops.sort((a, b) => a - b);
    for (let i = 0; i < xStops.length; i += 2) {
      const leftEnd = xStops[i];
      const rightEnd = xStops[i + 1];
      drawScanLine(y, leftEnd, rightEnd);
    }
  }
}

function drawArray(array) {
  drawFilledPolygon(array);
}

const setText = document.getElementById("setText");
const previewText = document.getElementById("previewText");
const ctx = previewText.getContext("2d");

function renderFillerText() {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.font = `bold ${ctx.canvas.height * 1.2}px monospace`;
  ctx.fillStyle = "red";
  ctx.fillText(fillerText, 0, ctx.canvas.height - 5);
}

window.addEventListener("load", () => {
  fillerText = setText.value;
  renderFillerText();
});

setText.addEventListener("input", (ev) => {
  fillerText = ev.target.value;
  renderFillerText();
});
