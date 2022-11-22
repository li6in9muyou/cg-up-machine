function Heart(t) {
  const s = Math.sin(t);
  const x = 16 * s * s * s;
  const y =
    13 * Math.cos(t) -
    5 * Math.cos(2 * t) -
    2 * Math.cos(3 * t) -
    Math.cos(4 * t);
  return [x, y];
}

function trans(c) {
  const flippedY = 40 - c[1];
  return [int(((c[0] + 20) * cW) / 40), int(((flippedY - 20) * cH) / 40)];
}

const steps = 80;
const d = (Math.PI * 2) / steps;
for (let t = 0; t < steps; t++) {
  vertices_client_space.push(trans(Heart(t * d)));
}

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

function checkerBoard(colorOne, colorTwo) {
  return (x, y) => {
    if ((Math.floor(y / 5) % 2 === 0) ^ (Math.floor(x / 5) % 2 === 0)) {
      return colorOne;
    } else {
      return colorTwo;
    }
  };
}

const blackAndWhite = checkerBoard([255, 255, 255], [80, 80, 80]);

const attributesLookUp = new Map();
const fragmentShader = (x, y) => fillText(...texTrans(x, y));

function linearInterpolation(t, from, to) {
  return from * (1 - t) + to * t;
}

function clamp(num, low, high) {
  if (num < low) {
    return low;
  }
  if (num > high) {
    return high;
  }
  return num;
}

function xAtScanLine(edge, y) {
  const travel = y - edge.yMin;
  const dY = edge.yMax - edge.yMin;
  const t = travel / dY;
  return int(linearInterpolation(t, edge.pUp.x, edge.pDw.x));
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
    const first_scan_line = clamp(edge.yMin, 0);
    EdgeTablePerScanLine[first_scan_line].push(edge);
  }

  const xLeft = new Map();
  const xRight = new Map();
  function interpolateAndLog(db, stt, end) {
    for (const attribute of DdaInterpolation(stt, end)) {
      const [x, y, ...attr] = attribute.map(int);
      if (xLeft.has(y)) {
        xLeft.set(y, Math.min(xLeft.get(y), x));
      } else {
        xLeft.set(y, x);
      }
      if (xRight.has(y)) {
        xRight.set(y, Math.max(xRight.get(y), x));
      } else {
        xRight.set(y, x);
      }
      const fragId = `${x},${y}`;
      if (!db.has(fragId)) {
        db.set(fragId, attr);
      }
    }
  }

  for (const edge of sortByY) {
    interpolateAndLog(
      attributesLookUp,
      [edge.pUp.x, edge.pUp.y],
      [edge.pDw.x, edge.pDw.y]
    );
  }

  function drawScanLineWithFragShader(y, left, right, shader) {
    for (let i = left; i < right + 1; i++) {
      setPixel(i, y, shader(i, y));
    }
  }

  let activeEdges = [];
  for (let y = 0; y < nLines; y++) {
    const edgesFromThisY = EdgeTablePerScanLine[y];
    activeEdges = [...activeEdges, ...edgesFromThisY].filter(
      (edge) => edge.yMin <= y && edge.yMax > y
    );

    if (!xLeft.has(y)) {
      continue;
    }

    const xStops = activeEdges.map((edge) => xAtScanLine(edge, y));
    xStops.sort((a, b) => a - b);
    for (let i = 0; i < xStops.length; i += 2) {
      const leftEnd = xStops[i];
      const rightEnd = xStops[i + 1];
      drawScanLineWithFragShader(y, leftEnd, rightEnd, fragmentShader);
    }
  }
}

let texTrans;

function makeTexTrans(t) {
  return (x, y) => {
    const scaleX = 1.15 + 0.1 * Math.sin(4 * t);
    const translateX = (-scaleX / 2) * screenW + screenW / 2;
    x /= scaleX;
    x -= translateX;
    x -= -5 * Math.sin(10 * t);

    const scaleY = 0.95 + 0.05 * Math.sin(2 * t + Math.PI);
    const translateY = (-scaleY / 2) * screenH + screenH / 2;
    y /= scaleY;
    y -= translateY;
    y -= -5 * Math.sin(8 * t);

    x = int(x);
    y = int(y);
    return [x, y];
  };
}

function makeObjectTrans(t) {
  return (x, y) => {
    const scaleX = 1.15 + 0.1 * Math.sin(4 * t);
    const translateX = (-scaleX / 2) * screenW + screenW / 2;
    x *= scaleX;
    x += translateX;
    x += -5 * Math.sin(10 * t);

    const scaleY = 0.95 + 0.05 * Math.sin(2 * t + Math.PI);
    const translateY = (-scaleY / 2) * screenH + screenH / 2;
    y *= scaleY;
    y += translateY;
    y += -5 * Math.sin(8 * t);

    x = int(x);
    y = int(y);
    return [x, y];
  };
}

function drawArray(array) {
  const t = millis() / 1e3;
  texTrans = makeTexTrans(t);
  const objTrans = makeObjectTrans(t);
  for (let i = 0; i < array.length; i++) {
    const xy = objTrans(array[i][0], array[i][1]);
    array[i][0] = xy[0];
    array[i][1] = xy[1];
  }
  drawFilledPolygon(array);
  drawLineLoop(array);
}

const setText = document.getElementById("setText");
const previewText = document.getElementById("previewText");
const ctx = previewText.getContext("2d", { willReadFrequently: true });
const texH = 12;
const texW = 28;
ctx.canvas.width = texW;
ctx.canvas.height = texH;

let texture = ctx.getImageData(0, 0, texW, texH).data;

function renderFillerText() {
  ctx.clearRect(0, 0, texW, texH);
  ctx.font = `bold ${texH}px monospace`;
  ctx.fillStyle = "#ff1493";
  ctx.textBaseline = "ideographic";
  ctx.fillText(fillerText, 0, texH);
  texture = ctx.getImageData(0, 0, texW, texH).data;
}

fillerText = setText.value;
renderFillerText();

function fillText(x, y) {
  const u = x % texW;
  const v = y % texH;
  const offset = (v * texW + u) * 4;
  return [
    texture[offset],
    texture[offset + 1],
    texture[offset + 2],
    texture[offset + 3],
  ];
}

window.addEventListener("load", () => {
  fillerText = setText.value;
  renderFillerText();
});

setText.addEventListener("input", (ev) => {
  fillerText = ev.target.value;
  renderFillerText();
});
