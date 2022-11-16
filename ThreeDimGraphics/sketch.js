const blackAndWhite = ((colorOne, colorTwo) => (attributes) => {
  const x = int(attributes[0]);
  const y = int(attributes[1]);
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

const repeatSix = (attr) => [attr, attr, attr, attr, attr, attr];

const element_attributes = [
  //Near
  ...repeatSix([255, 255, 255]),
  //Bottom
  ...repeatSix([0, 0, 255]),
  //Far
  ...repeatSix([255, 0, 0]),
  //Left
  ...repeatSix([255, 0, 255]),
  //Right
  ...repeatSix([255, 255, 0]),
  //Top
  ...repeatSix([0, 255, 0]),
];

const elements = [
  //Near
  [0, 6, 2],
  [0, 4, 6],
  //Bottom
  [0, 2, 1],
  [1, 2, 3],
  //Far
  [7, 5, 3],
  [3, 5, 1],
  //Left
  [5, 4, 1],
  [1, 4, 0],
  //Right
  [6, 7, 2],
  [2, 7, 3],
  //Top
  [5, 7, 4],
  [4, 7, 6],
].flat();

const vertices_model_space = [
  [0, 0, 0],
  [0, 0, 3],
  [3, 0, 0],
  [3, 0, 3],
  [0, 3, 0],
  [0, 3, 3],
  [3, 3, 0],
  [3, 3, 3],
];

function drawOneTriangle(ctx, attributes, fragShader) {
  const A = attributes[0];
  const B = attributes[1];
  const C = attributes[2];

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

function drawTriangles(
  ctx,
  vertices,
  elements,
  element_attributes,
  fragShader
) {
  console.assert(
    elements.length % 3 === 0,
    "drawTriangles asserts that the number of elements are a multiply of 3."
  );
  for (let i = 0; i < elements.length; i += 3) {
    const attributes = [
      [...vertices[elements[i]], ...element_attributes[i]],
      [...vertices[elements[i + 1]], ...element_attributes[i + 1]],
      [...vertices[elements[i + 2]], ...element_attributes[i + 2]],
    ];
    drawOneTriangle(ctx, attributes, fragShader);
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

function drawArray() {
  const model_world = plzMany(plzTranslate(0.2, 0.2, 0));
  const world_view = plzScale(30, 30, 30);
  const vertices_view_space = vertices_model_space.map((v) =>
    plzApplyManyMat4(v, model_world, world_view)
  );
  const vertices_screen_space = vertices_view_space.map((v3) => [v3[0], v3[1]]);
  drawTriangles(
    new GpuCtx(screenW, screenH),
    vertices_screen_space,
    elements,
    element_attributes,
    interpolateVertexAttributes
  );
}
