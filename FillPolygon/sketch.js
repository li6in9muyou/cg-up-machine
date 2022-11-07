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
  [
    [199, 20],
    [255, 0, 0],
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
  attributes;

  constructor(x, y, ...attributes) {
    this.x = x;
    this.y = y;
    this.attributes = attributes;
  }
}

class Edge {
  yMin;
  yMax;
  pUp;
  pDw;

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
  }
}

function drawFilledPolygon(array) {
  if (array.length < 3) return;
  const inScreenCoordinate = array.map(
    (arr, idx) => new Point(arr[0], arr[1], ...elements[idx][1])
  );

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

  // for every edge
  // interpolate attributes of its two endpoints, including x, y and other attributes
  // after that, a number of { x, y, other attributes } are obtained
  // these fragments are on the borderline of this polygon
  // log them to a "fragments" object
  const fragments = new Map();
  const xStopLookUp = new Map();
  function interpolateAndLog(db, stt, end) {
    for (const attribute of DdaInterpolation(stt, end)) {
      const [x, y, ...attr] = attribute.map(int);
      if (xStopLookUp.has(y)) {
        xStopLookUp.get(y).add(x);
      } else {
        xStopLookUp.set(y, new Set([x]));
      }
      const fragId = `${x},${y}`;
      if (!db.has(fragId)) {
        db.set(fragId, attr);
      }
    }
  }

  for (const edge of sortByY) {
    interpolateAndLog(
      fragments,
      [edge.pUp.x, edge.pUp.y, ...edge.pUp.attributes],
      [edge.pDw.x, edge.pDw.y, ...edge.pDw.attributes]
    );
    console.log(edge, fragments.keys());
  }

  // we can have fragmentShader(xStop, y):color
  // default fragmentShader would be ExtractColorFrom( fragments.GetAttributesAt(xStop, y) )
  function fragmentShader(x, y) {
    return fragments.get(`${x},${y}`);
  }

  function drawScanLineWithFragShader(y, left, right, shader) {
    for (let i = left; i < right + 1; i++) {
      setPixel(i, y, shader(i, y));
    }
  }

  // for every scanline
  let activeEdges = [];
  for (let y = 0; y < nLines; y++) {
    const edgesFromThisY = EdgeTablePerScanLine[y];
    activeEdges = [...activeEdges, ...edgesFromThisY].filter(
      (edge) => edge.yMin <= y && edge.yMax > y
    );

    if (!xStopLookUp.has(y)) {
      continue;
    }
    const xStops = [...xStopLookUp.get(y)];
    if (xStops.length === 1) {
      continue;
    }
    xStops.sort((a, b) => a - b);
    for (let i = 0; i < xStops.length; i += 2) {
      const leftEnd = xStops[i];
      const rightEnd = xStops[i + 1];

      // interpolate along one scanline
      // leftEnd and rightEnd are on the borderline of which attributes have already been interpolated
      const rightEndAttr = fragments.get(`${rightEnd},${y}`);
      const leftEndAttr = fragments.get(`${leftEnd},${y}`);
      if (rightEndAttr === undefined) {
        console.warn(`no attr for ${rightEnd},${y} is found`);
        continue;
      }
      if (leftEndAttr === undefined) {
        console.warn(`no attr for ${leftEnd},${y} is found`);
        continue;
      }
      interpolateAndLog(
        fragments,
        [rightEnd, y, ...rightEndAttr],
        [leftEnd, y, ...leftEndAttr]
      );
      drawScanLineWithFragShader(y, leftEnd, rightEnd, fragmentShader);
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
