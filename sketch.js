const repeatSix = (attr) => [attr, attr, attr, attr, attr, attr];

const element_attributes = [
  // //Near
  // ...repeatSix([255, 255, 255]),
  // //Bottom
  // ...repeatSix([0, 0, 255]),
  // //Far
  // ...repeatSix([0, 255, 255]),
  // //Left
  // ...repeatSix([255, 0, 255]),
  // //Right
  // ...repeatSix([255, 255, 0]),
  //Top
  ...repeatSix([0, 255, 0]),
];

const elements = [
  // //Near
  // [0, 6, 2],
  // [0, 4, 6],
  // //Bottom
  // [0, 2, 1],
  // [1, 2, 3],
  // //Far
  // [7, 5, 3],
  // [3, 5, 1],
  // //Left
  // [5, 4, 1],
  // [1, 4, 0],
  // //Right
  // [6, 7, 2],
  // [2, 7, 3],
  //Top
  [5, 7, 4],
  // [4, 7, 6],
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
    const x = Math.round(attribute[0]);
    const y = Math.round(attribute[1]);
    ctx.setFragmentAttribute(x, y, attribute);
    xLeft[y] = Math.min(x, xLeft[y]);
    xRight[y] = Math.max(x, xRight[y]);
  }
  const roundXY = (T) => [Math.round(T[0]), Math.round(T[1]), ...T.slice(2)];
  for (const attribute of DdaInterpolation(roundXY(A), roundXY(B))) {
    logAttributesAndCacheHorizontalEndpoints(attribute);
  }
  for (const attribute of DdaInterpolation(roundXY(B), roundXY(C))) {
    logAttributesAndCacheHorizontalEndpoints(attribute);
  }
  for (const attribute of DdaInterpolation(roundXY(C), roundXY(A))) {
    logAttributesAndCacheHorizontalEndpoints(attribute);
  }

  for (let y = 0; y < ctx.H; y++) {
    const leftEnd = xLeft[y];
    const rightEnd = xRight[y];
    const shouldPaint =
      leftEnd !== Number.POSITIVE_INFINITY &&
      rightEnd !== Number.NEGATIVE_INFINITY;
    if (shouldPaint) {
      const dLeftRight = rightEnd - leftEnd;
      const processedX = [];

      for (const attribute of DdaInterpolation(
        ctx.getFragmentAttribute(leftEnd, y),
        ctx.getFragmentAttribute(rightEnd, y),
      )) {
        const x = Math.ceil(attribute[0]);
        ctx.setFragmentAttribute(x, y, attribute);
        processedX.push(x);
      }

      console.assert(
        processedX.length === dLeftRight,
        "some x is not processed from left to right",
        processedX,
        leftEnd,
        rightEnd,
      );

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
          console.warn("frag attr is not found", i, y);
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
  fragShader,
) {
  console.assert(
    elements.length % 3 === 0,
    "drawTriangles asserts that the number of elements are a multiply of 3.",
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
    this.outOfBounds = new Map();
  }
  getFragmentAttribute(x, y) {
    const key = y * this.W + x;
    if (x < 0 || this.W - 1 < x || y < 0 || this.H - 1 < y) {
      return this.outOfBounds.get(key);
    } else {
      const ans = this.attributesLookUp[key];
      return ans;
    }
  }
  setFragmentAttribute(x, y, attr) {
    const key = y * this.W + x;
    if (x < 0 || this.W - 1 < x || y < 0 || this.H - 1 < y) {
      this.outOfBounds.set(key, attr);
    } else {
      this.attributesLookUp[key] = attr;
    }
  }
  setDepthBuffer(x, y, depth) {
    this.depthBuffer[y * this.W + x] = depth;
  }
  getDepthBuffer(x, y) {
    return this.depthBuffer[y * this.W + x];
  }
};

const PRIMARY_BTN = 1;
const SECONDARY_BTN = 2;
let [panHorizontal, panVertical, axisHorizontal, axisVertical, zoomFactor] = [
  0.032500000000000064, 0.01749999999999999, -4, 92, 1.5400000000000005,
];
function dumpCameraPos() {
  console.log("camera pos", [
    panHorizontal,
    panVertical,
    axisHorizontal,
    axisVertical,
    zoomFactor,
  ]);
}
const zoomStep = -0.06;

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

  zoomFactor += event.deltaY > 0 ? zoomStep : -zoomStep;
}

function plzPerspective() {
  const n = -1;
  const f = 1;
  const fov = Radians(60 * (2 - zoomFactor));
  const s = 1 / Math.tan(fov / 2);
  return [n * s, 0, 0, 0, 0, n * s, 0, 0, 0, 0, n + f, -1, 0, 0, -f * n, 0];
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
      clip_space_D / orthogonal_projection_D,
    ),
    plzScale(zoomFactor, zoomFactor, zoomFactor),
  );
}

function plzMoveCamera(position, spinX, spinY, spinZ) {
  return plzMany(
    plzRotateX(spinX),
    plzRotateY(spinY),
    plzRotateZ(spinZ),
    plzTranslate(...Times(-1, position)),
  );
}

const defaultShader = interpolateVertexAttributes;

// FIXME: very repetitive, refactor when a third config is added
let useMSAA = false;
const useMSAASelector = "[data-msaa-toggle]";
const msaaToggle = document.querySelector(useMSAASelector);
if (msaaToggle !== null) {
  msaaToggle.checked = useMSAA;
  msaaToggle.addEventListener("change", (ev) => {
    useMSAA = ev.target.checked;
  });
} else {
  console.warn(`${useMSAASelector} is not found, useMSAA is ${useMSAA}`);
}

let usePerspective = true;
const usePerspectiveSelector = "[data-perspective-toggle]";
const perspectiveToggle = document.querySelector(usePerspectiveSelector);
if (perspectiveToggle !== null) {
  perspectiveToggle.checked = usePerspective;
  perspectiveToggle.addEventListener("change", (ev) => {
    usePerspective = ev.target.checked;
  });
} else {
  console.warn(
    `${usePerspectiveSelector} is not found, usePerspective is ${usePerspective}`,
  );
}

function drawArray() {
  const model_world = plzMany(
    // 基础平移：将模型挪到世界中心
    plzTranslate(-1.5, -1.5, -1.5),
    // 基础缩放：将 3x3x3 的模型缩放到合适大小
    plzScale(
      orthogonal_projection_W / 3,
      orthogonal_projection_H / 3,
      orthogonal_projection_D / 3,
    ),
    // 旋转操作：用户拖拽产生旋转
    plzRotateX(-axisVertical),
    plzRotateY(-axisHorizontal),
    // 平移操作：用户右键产生平移
    plzTranslate(panHorizontal * pDim, -panVertical * pDim, 0),
  );
  const world_view = plzMany(plzTranslate(0, 0, 5));
  let projection;
  if (usePerspective) {
    projection = plzPerspective();
  } else {
    projection = plzOrthogonal();
  }
  const vertexShader = makeBasicVertexShader(
    plzMany(model_world, world_view, projection),
  );
  const vertices_clip_space = vertices_model_space.map(vertexShader);
  const vertices_screen_space = vertices_clip_space.map((v) =>
    plzApplyManyMat4(
      v,
      plzMany(
        plzTranslate(1, 1, 0),
        plzScale(1 / 2, 1 / 2, 1),
        plzScale(1, -1, 1),
        plzTranslate(0, 1, 0),
        plzScale(screenW - 1, screenH - 1, 1),
      ),
    ),
  );
  const gpuCtx = new GpuCtx(screenW, screenH);
  let shader;
  if (useMSAA) {
    shader = MSAA(gpuCtx);
  } else {
    shader = defaultShader;
  }
  drawTriangles(
    gpuCtx,
    vertices_screen_space,
    elements,
    element_attributes,
    shader,
  );
}
