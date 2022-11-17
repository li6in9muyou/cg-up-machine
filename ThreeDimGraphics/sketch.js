const repeatSix = (attr) => [attr, attr, attr, attr, attr, attr];

const element_attributes = [
  [0, 255, 0],
  [255, 255, 0],
  [0, 0, 255],
  [0, 0, 255],
  [255, 255, 0],
  [255, 0, 0],
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

function clamp(x, low, high) {
  if (x < low) {
    return low;
  }
  if (x > high) {
    return high;
  }
  return x;
}

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
    for (const attribute of DdaInterpolation(
      ctx.getFragmentAttribute(xLeft[y], y),
      ctx.getFragmentAttribute(xRight[y], y)
    )) {
      const x = int(attribute[0] + 0.999);
      const y = int(attribute[1]);
      ctx.setFragmentAttribute(x, y, attribute);
    }
    const leftEnd = clamp(xLeft[y], 0, ctx.W - 1);
    const rightEnd = clamp(xRight[y], 0, ctx.W - 1);
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
  const model_world = plzMany(plzTranslate(-1, 0, 0));
  const world_view = plzMany(
    plzScale(2 / 3, 2 / 3, 2 / 3),
    plzTranslate(-1, -1, -1)
  );
  const projection = plzIdentity();
  const vertexShader = makeBasicVertexShader(
    plzMany(model_world, world_view, projection)
  );
  const vertices_view_space = vertices_model_space.map(vertexShader);
  const vertices_screen_space = vertices_view_space.map((v) =>
    plzApplyManyMat4(
      v,
      plzMany(
        plzTranslate(1, 1, 0),
        plzScale(1 / 2, 1 / 2, 1),
        plzScale(1, -1, 1),
        plzTranslate(0, 1, 0),
        plzScale(screenW - 1, screenH - 1, 1)
      )
    )
  );
  drawTriangles(
    new GpuCtx(screenW, screenH),
    vertices_screen_space,
    elements,
    element_attributes,
    interpolateVertexAttributes
  );
}
