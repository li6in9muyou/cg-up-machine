const blackAndWhite = ((colorOne, colorTwo) => (x, y) => {
  if ((Math.floor(y / 5) % 2 === 0) ^ (Math.floor(x / 5) % 2 === 0)) {
    return colorOne;
  } else {
    return colorTwo;
  }
})([255, 255, 255], [80, 80, 80]);
const interpolateVertexAttributes = (attributes) => {
  const [, , ...attr] = attributes;
  return attr;
};

elements = [
  [0, 255, 255],
  [255, 0, 255],
  [255, 255, 0],
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
];

vertices_client_space = [
  [201, 20],
  [20, 180],
  [380, 180],
  [390, 190],
  [20, 380],
  [200, 390],
];

function drawOneTriangle(ctx, attributes, elements, fragShader) {
  const A = attributes[elements[0]];
  const B = attributes[elements[1]];
  const C = attributes[elements[2]];

  const xLeft = new Array(ctx.H).fill(Number.POSITIVE_INFINITY);
  const xRight = new Array(ctx.H).fill(Number.NEGATIVE_INFINITY);
  function logAttributesAndCacheHorizontalEndpoints(attribute) {
    const x = int(attribute[0]);
    const y = int(attribute[1]);
    ctx.setFragmentAttribute(x, y, attribute);
    xLeft[y] = Math.min(x, xLeft[y]);
    xRight[y] = Math.max(x, xRight[y]);
  }
  for (const attribute of DdaInterpolation(A, B)) {
    logAttributesAndCacheHorizontalEndpoints(attribute);
  }
  for (const attribute of DdaInterpolation(B, C)) {
    logAttributesAndCacheHorizontalEndpoints(attribute);
  }
  for (const attribute of DdaInterpolation(C, A)) {
    logAttributesAndCacheHorizontalEndpoints(attribute);
  }

  for (let y = 0; y < ctx.H; y++) {
    const leftEnd = xLeft[y];
    const rightEnd = xRight[y];
    const shouldPaint =
      0 <= leftEnd && leftEnd < ctx.W && 0 <= rightEnd && rightEnd < ctx.W;
    if (shouldPaint) {
      for (const attribute of DdaInterpolation(
        ctx.getFragmentAttribute(leftEnd, y),
        ctx.getFragmentAttribute(rightEnd, y)
      )) {
        const x = int(attribute[0]);
        const y = int(attribute[1]);
        ctx.setFragmentAttribute(x, y, attribute);
      }
      for (let i = leftEnd; i < rightEnd + 1; i++) {
        setPixel(i, y, fragShader(ctx.getFragmentAttribute(i, y)));
      }
    }
  }
}

function drawTriangles(ctx, attributes, elements, fragShader) {
  console.assert(
    elements.length % 3 === 0,
    "drawTriangles asserts that the number of elements are a multiply of 3."
  );
  for (let i = 0; i < elements.length; i += 3) {
    drawOneTriangle(ctx, attributes, elements.slice(i, i + 3), fragShader);
  }
}

const GpuCtx = class {
  attributesLookUp = new Array(screenW * screenH).fill(undefined);
  W;
  H;
  constructor(W, H) {
    this.W = W;
    this.H = H;
  }
  getFragmentAttribute(x, y) {
    return this.attributesLookUp[x * this.H + y];
  }
  setFragmentAttribute(x, y, attr) {
    this.attributesLookUp[x * this.W + y] = attr;
  }
};

function drawArray(array) {
  const attributes = array.map((xy, idx) => [...xy, ...elements[idx]]);
  drawTriangles(
    new GpuCtx(screenW, screenH),
    attributes,
    new Array(attributes.length).fill(null).map((_, idx) => idx),
    interpolateVertexAttributes
  );
}

let fillerText = "";
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
  ctx.fillStyle = "red";
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
