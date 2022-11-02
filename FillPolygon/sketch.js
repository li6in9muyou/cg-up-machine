vertices_client_space = [
  [50, 99],
  [350, 0],
  [50, 300],
  [350, 399],
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
  }

  getXAt(y) {
    return this.pUp.x + (y - this.pUp.y) * this.dX;
  }
}

function drawFilledPolygon(array) {
  const inScreenCoordinate = array.map((point) => {
    const [x, y] = point;
    return new Point(
      ...transClientSpaceToFragmentSpace(x, y).map((x) => int(x))
    );
  });
  console.log("inScreenCoordinate", inScreenCoordinate);

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
  console.log("allEdges", allEdges);

  const sortByY = allEdges.sort((ea, eb) => {
    return ea.yMin - eb.yMin;
  });

  const EdgeTablePerScanLine = new Array(100).fill(null).map(() => []);

  for (const edge of sortByY) {
    const first_scan_line = edge.yMin;
    EdgeTablePerScanLine[first_scan_line].push(edge);
  }
  console.log(
    EdgeTablePerScanLine.map((edges, idx) => [idx, edges]).filter(
      (c) => c[1].length > 0
    )
  );

  let activeEdges = [];
  for (let y = 0; y < nLines; y++) {
    console.log("y", y);
    const edgesFromThisY = EdgeTablePerScanLine[y];
    if (edgesFromThisY.length > 0) {
      console.log("edges begin at this y", edgesFromThisY);
      activeEdges = [...activeEdges, ...edgesFromThisY].filter(
        (edge) => edge.yMin <= y && edge.yMax > y
      );
    }
    console.log("activeEdges", activeEdges);
    let leftEnd, rightEnd;
    for (let i = 0; i < activeEdges.length; i += 2) {
      const oneX = int(activeEdges[i].getXAt(y));
      const twoX = int(activeEdges[i + 1].getXAt(y));
      if (oneX > twoX) {
        leftEnd = twoX;
        rightEnd = oneX;
      } else {
        leftEnd = oneX;
        rightEnd = twoX;
      }
      console.log("drawScanLine", y, leftEnd, rightEnd);
      drawScanLine(y, leftEnd, rightEnd);
    }
  }
}

more_setup = (array) => {
  drawFilledPolygon(array);
};

function drawArray(array) {
  // drawFilledPolygon(array);
  drawLineLoop(array);
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
