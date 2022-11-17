const repeatSix = (attr) => [attr, attr, attr, attr, attr, attr];

const element_attributes = [
  [255, 255, 255],
  [255, 255, 255],
  [255, 255, 255],
  [255, 255, 255],
  [255, 255, 255],
  [255, 255, 255],
];

const elements = [
  [2, 3, 0],
  [0, 3, 1],
].flat();

const vertices_model_space = [
  [0, 0, 0],
  [0, 3, 0],
  [3, 0, 0],
  [3, 3, 0],
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
        const x = int(attribute[0] + 0.999);
        const y = int(attribute[1]);
        ctx.setFragmentAttribute(x, y, attribute);
      }
      for (let i = leftEnd; i < rightEnd + 1; i++) {
        const a = ctx.getFragmentAttribute(i, y);
        if (a === undefined) {
          setPixel(i, y, [255, 0, 0]);
        } else {
          setPixel(i, y, fragShader(a));
        }
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
    return this.attributesLookUp[x * this.W + y];
  }
  setFragmentAttribute(x, y, attr) {
    this.attributesLookUp[x * this.W + y] = attr;
  }
};

function drawArray() {
  const model_world = plzMany(
    plzTranslate(0, 0, 0),
    plzRotateX(45),
    plzRotateY(10)
  );
  const world_view = plzMany(
    plzScale(2 / 3, 2 / 3, 2 / 3),
    plzTranslate(-1, -1, -1)
  );
  const projection = plzIdentity();
  const view_screen = plzMany(
    plzTranslate(1, 1, 0),
    plzScale(1 / 2, 1 / 2, 1),
    plzScale(screenW - 1, screenH - 1, 1)
  );
  const vertices_view_space = vertices_model_space.map((v) =>
    plzApplyManyMat4(v, model_world, world_view, projection)
  );
  const vertices_screen_space = vertices_view_space.map((v) =>
    plzApplyManyMat4(v, view_screen)
  );
  drawTriangles(
    new GpuCtx(screenW, screenH),
    vertices_screen_space,
    elements,
    element_attributes,
    interpolateVertexAttributes
  );
}
