const repeatSix = (attr) => [attr, attr, attr, attr, attr, attr];

const element_attributes = [
  //Near
  ...repeatSix([255, 255, 255]),
  //Bottom
  ...repeatSix([0, 0, 255]),
  //Far
  ...repeatSix([0, 255, 255]),
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
    const leftEnd = xLeft[y];
    const rightEnd = xRight[y];
    const shouldPaint =
      leftEnd !== Number.POSITIVE_INFINITY &&
      rightEnd !== Number.NEGATIVE_INFINITY;
    if (shouldPaint) {
      for (const attribute of DdaInterpolation(
        ctx.getFragmentAttribute(leftEnd, y),
        ctx.getFragmentAttribute(rightEnd, y)
      )) {
        const x = int(attribute[0] + 0.999);
        const y = int(attribute[1]);
        ctx.setFragmentAttribute(x, y, attribute);
      }
      const left = clamp(leftEnd, 0, ctx.W - 1);
      const right = clamp(rightEnd, 0, ctx.W - 1);
      for (let i = left; i < right + 1; i++) {
        const a = ctx.getFragmentAttribute(i, y);
        if (a !== undefined) {
          const z = a[2];
          if (z < ctx.getDepthBuffer(i, y)) {
            ctx.setDepthBuffer(i, y, z);
            setPixel(i, y, fragShader(a));
          }
        } else {
          setPixel(i, y, [255, 0, 0]);
        }
      }
    }
  }
}

const toEye = [0, 0, -1];
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
    const A = vertices[elements[i]];
    const B = vertices[elements[i + 1]];
    const C = vertices[elements[i + 2]];
    if (Dot(toEye, Cross(Sub(B, C), Sub(A, B))) > 0) {
      const attributes = [
        [...A, ...element_attributes[i]],
        [...B, ...element_attributes[i + 1]],
        [...C, ...element_attributes[i + 2]],
      ];
      drawOneTriangle(ctx, attributes, fragShader);
    }
  }
}

const GpuCtx = class {
  attributesLookUp = new Array(screenW * screenH).fill(undefined);
  depthBuffer = new Array(screenW * screenH).fill(Number.POSITIVE_INFINITY);
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
  setDepthBuffer(x, y, depth) {
    this.depthBuffer[x * this.W + y] = depth;
  }
  getDepthBuffer(x, y) {
    return this.depthBuffer[x * this.W + y];
  }
};

const PRIMARY_BTN = 1;
const SECONDARY_BTN = 2;
let panHorizontal = 0.4;
let panVertical = 0.17;
let axisHorizontal = 5;
let axisVertical = 16;
let scaleFactor = 0.5;
const scaleStep = 0.02;

function withinCanvas(event) {
  return event.toElement === canvasElt;
}

function mouseDragged(event) {
  if (!withinCanvas(event)) return;

  if (event.buttons === SECONDARY_BTN) {
    panHorizontal += event.movementX / cW;
    panVertical += event.movementY / cH;
  }
  if (event.buttons === PRIMARY_BTN) {
    axisVertical += event.movementY;
    axisHorizontal += event.movementX;
  }

  return false;
}

function mouseWheel(event) {
  if (!withinCanvas(event)) return;

  scaleFactor += event.deltaY > 0 ? -scaleStep : scaleStep;
}

function plzPerspective() {
  const n = -1;
  const f = 1;
  const fov = Radians(60);
  const s = 1 / Math.tan(fov / 2);
  return [n, 0, 0, 0, 0, n, 0, 0, 0, 0, n + f, -1, 0, 0, -f * n, 0];
}

const aspect_ratio = 1;
const orthogonal_projection_W = 2;
const orthogonal_projection_H = orthogonal_projection_W / aspect_ratio;
const orthogonal_projection_D = 2;

const clip_space_W = 2;
const clip_space_H = 2;
const clip_space_D = 2;

function plzOrthogonal() {
  return plzMany(
    plzScale(
      clip_space_W / orthogonal_projection_W,
      clip_space_H / orthogonal_projection_H,
      clip_space_D / orthogonal_projection_D
    )
  );
}

function drawArray() {
  const model_world = plzIdentity();
  const world_view = plzMany(
    plzScale(
      orthogonal_projection_W / 3,
      orthogonal_projection_H / 3,
      orthogonal_projection_D / 3
    ),
    plzTranslate(orthogonal_projection_W / 2, orthogonal_projection_W / 2, 0)
  );
  const projection = plzOrthogonal();
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
