const repeatSix = (attr) => [attr, attr, attr, attr, attr, attr];
const repeat3 = (attr) => [attr, attr, attr];

let element_attributes = [
  //Near
  ...repeatSix([255, 255, 255, 0, 0, -1, 0]),
  //Bottom
  ...repeatSix([0, 0, 255, 0, -1, 0, 1]),
  //Far
  ...repeatSix([0, 255, 255, 0, 0, 1, 2]),
  //Left
  ...repeatSix([255, 0, 255, -1, 0, 0, 3]),
  //Right
  ...repeat3([0, 255, 0, 0, 1, 0, 4]),
  ...repeat3([0, 255, 0, 0, 1, 0, 5]),
  //Top
  ...repeat3([0, 255, 0, 0, 1, 0, 6]),
  ...repeat3([0, 255, 0, 0, 1, 0, 7]),
];

let elements = [
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

let vertices_model_space = [
  [0, 0, 0],
  [0, 0, 3],
  [3, 0, 0],
  [3, 0, 3],
  [0, 3, 0],
  [0, 3, 3],
  [3, 3, 0],
  [3, 3, 3],
];

const sphere = generateUVSphere(44);
elements = sphere.elements.flat();
element_attributes = sphere.element_attributes;
vertices_model_space = sphere.vertices_model_space;

function clamp(x, low, high) {
  if (x < low) {
    return low;
  }
  if (x > high) {
    return high;
  }
  return x;
}

// 物理光照相关常量
// x points right, y points up, z points in
const lightDirection = Normalize([1, 0, 0]); // 平行光方向
const lightColor = [255, 255, 0]; // 光源颜色
const ambientIntensity = 0.05; // 环境光强度（物理渲染中通常较小）

// 材质定义 - 每个面不同的物理材质属性 [albedo, roughness, metallic]
const materials = [
  [[255, 0, 0], 0.8, 0],
  [[0, 255, 0], 0.2, 0],
];

// 向量长度
function length(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

// 向量点积
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

// 向量叉积
function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

// 计算Fresnel项 (Schlick近似)
function fresnelSchlick(cosTheta, F0) {
  const powResult = Math.pow(1.0 - cosTheta, 5.0);
  return F0.map((x) => x + (1.0 - x) * powResult);
}

// 计算几何函数 (GGX/Trowbridge-Reitz近似)
function geometrySchlickGGX(cosTheta, roughness) {
  const r = roughness + 1.0;
  const k = (r * r) / 8.0;
  return cosTheta / (cosTheta * (1.0 - k) + k);
}

// 计算几何遮蔽函数
function geometrySmith(normal, lightDir, viewDir, roughness) {
  const ggx1 = geometrySchlickGGX(dot(normal, lightDir), roughness);
  const ggx2 = geometrySchlickGGX(dot(normal, viewDir), roughness);
  return ggx1 * ggx2;
}

// 计算微表面分布函数 (GGX/Trowbridge-Reitz)
function distributionGGX(normal, halfDir, roughness) {
  const cosTheta = Math.max(dot(normal, halfDir), 0.0);
  const alpha = roughness * roughness;
  const alpha2 = alpha * alpha;
  const denom = cosTheta * cosTheta * (alpha2 - 1.0) + 1.0;
  return alpha2 / (Math.PI * denom * denom);
}

// Cook-Torrance BRDF实现
function cookTorranceBRDF(
  normal,
  lightDir,
  viewDir,
  halfDir,
  albedo,
  metallic,
  roughness,
) {
  // 确保输入全部归一化
  const N = Normalize(normal);
  const L = Normalize(lightDir);
  const V = Normalize(viewDir);
  const H = Normalize(halfDir);

  // 1. 计算点积，限制范围保证物理正确
  const NdotL = Math.max(Dot(N, L), 0.0);
  const NdotV = Math.max(Dot(N, V), 0.0);
  const VdotH = Math.max(Dot(V, H), 0.0);

  // 2. 基础反射率 F0
  const F0 = [
    0.04 * (1.0 - metallic) + albedo[0] * metallic,
    0.04 * (1.0 - metallic) + albedo[1] * metallic,
    0.04 * (1.0 - metallic) + albedo[2] * metallic,
  ];

  // 3. 中间体计算
  const F = fresnelSchlick(Math.min(VdotH, 1.0), F0);
  const G = geometrySmith(N, L, V, roughness);
  const D = distributionGGX(N, H, roughness);

  // 4. 镜面反射 Specular
  // 优化分母截断，防止数值爆炸
  const denominator = 4.0 * NdotV * NdotL + 0.0001;
  const specular = [
    (D * G * F[0]) / denominator,
    (D * G * F[1]) / denominator,
    (D * G * F[2]) / denominator,
  ];

  // 5. 能量守恒
  // kS 就是菲涅尔项 F
  const kD = [
    (1.0 - F[0]) * (1.0 - metallic),
    (1.0 - F[1]) * (1.0 - metallic),
    (1.0 - F[2]) * (1.0 - metallic),
  ];

  // 6. 漫反射项 (Lambertian)
  const diffuse = [
    (kD[0] * albedo[0]) / Math.PI,
    (kD[1] * albedo[1]) / Math.PI,
    (kD[2] * albedo[2]) / Math.PI,
  ];

  // 7. 最终组合：(Diffuse + Specular) * N·L
  // 注意：irradiance (NdotL) 需要作用于整体
  const result = [
    (diffuse[0] + specular[0]) * NdotL,
    (diffuse[1] + specular[1]) * NdotL,
    (diffuse[2] + specular[2]) * NdotL,
  ];

  return result;
}

// 计算光照的函数 (基于Cook-Torrance BRDF)
function pbrShader(attr) {
  // 提取坐标和面索引信息
  const [, , , , , , nx, ny, nz, materialIdx] = attr;

  // 获取材质属性
  const [albedo, roughness, metallic] = materials[materialIdx];

  // 归一化输入
  const norm = [nx, ny, nz];
  const lightDir = Normalize(lightDirection);
  // 假设观察者在屏幕前方 (模拟相机视角)
  const viewDir = Normalize([0, 0, -1]);
  const halfDir = Normalize([
    lightDir[0] + viewDir[0],
    lightDir[1] + viewDir[1],
    lightDir[2] + viewDir[2],
  ]);
  // 将RGB值从[0,255]转换到[0,1]
  const linearAlbedo = rgbToOne(albedo);

  // 计算Cook-Torrance BRDF
  const brdfResult = cookTorranceBRDF(
    norm,
    lightDir,
    viewDir,
    halfDir,
    linearAlbedo,
    metallic,
    roughness,
  );

  // 应用光源颜色
  const litColor = [
    brdfResult[0] * (lightColor[0] / 255.0),
    brdfResult[1] * (lightColor[1] / 255.0),
    brdfResult[2] * (lightColor[2] / 255.0),
  ];

  // 添加少量环境光
  const ambient = [
    linearAlbedo[0] * ambientIntensity,
    linearAlbedo[1] * ambientIntensity,
    linearAlbedo[2] * ambientIntensity,
  ];

  // 合并结果
  const finalLinear = [
    litColor[0] + ambient[0],
    litColor[1] + ambient[1],
    litColor[2] + ambient[2],
  ];

  // 色调映射 (Reinhard色调映射)
  const mapped = [
    finalLinear[0] / (1.0 + finalLinear[0]),
    finalLinear[1] / (1.0 + finalLinear[1]),
    finalLinear[2] / (1.0 + finalLinear[2]),
  ];

  // 转回[0,255]范围并转为sRGB
  const result = oneToRgb(mapped);

  return result;
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
      // const dLeftRight = rightEnd - leftEnd;
      const processedX = [];

      for (const attribute of DdaInterpolation(
        ctx.getFragmentAttribute(leftEnd, y),
        ctx.getFragmentAttribute(rightEnd, y),
      )) {
        const x = Math.ceil(attribute[0]);
        ctx.setFragmentAttribute(x, y, attribute);
        processedX.push(x);
      }

      // console.assert(
      //   processedX.length === dLeftRight,
      //   "some x is not processed from left to right",
      //   processedX,
      //   leftEnd,
      //   rightEnd,
      // );

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
          // console.warn("frag attr is not found", i, y);
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
  // console.assert(
  //   elements.length % 3 === 0,
  //   "drawTriangles asserts that the number of elements are a multiply of 3.",
  // );
  for (let i = 0; i < elements.length; i += 3) {
    const A = vertices[elements[i]];
    const B = vertices[elements[i + 1]];
    const C = vertices[elements[i + 2]];
    if (Dot(toEye, Cross(Sub(B, C), Sub(A, B))) > 0) {
      const ii = i / 3;
      const attributes = [
        [...A, ...element_attributes[ii]],
        [...B, ...element_attributes[ii]],
        [...C, ...element_attributes[ii]],
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
let [panHorizontal, panVertical, zoomFactor] = [
  -0.009999999999999938, 0.012500000000000016, 1.3600000000000003,
];
let currentRotationMatrix = plzMany(
  plzRotateX(0),
  plzRotateY(0),
  plzRotateZ(0),
);
function dumpCameraPos() {
  console.log("camera pos", [panHorizontal, panVertical, zoomFactor]);
  console.log("currentRotationMatrix", currentRotationMatrix);
}
const zoomStep = -0.06;
const rotateStep = -0.3;

function withinCanvas(event) {
  return event.toElement === canvasElt;
}

// 记录鼠标按下时的起始向量
let arcballStartVector = null;

function getArcballVector(x, y) {
  // 1. 将像素坐标映射到 [-1, 1] 范围
  const p = [
    (x / cW) * 2 - 1,
    -((y / cH) * 2 - 1), // Y轴在屏幕空间是反的
    0,
  ];

  // 2. 计算 Z 坐标 (基于球体方程: x^2 + y^2 + z^2 = 1)
  const xySquared = p[0] * p[0] + p[1] * p[1];
  if (xySquared <= 1.0) {
    p[2] = Math.sqrt(1.0 - xySquared); // 在球内
  } else {
    // 在球外，进行归一化处理，投影到球边缘
    const length = Math.sqrt(xySquared);
    p[0] /= length;
    p[1] /= length;
    p[2] = 0;
  }

  return p;
}

function renormalizeMatrix(m) {
  // 提取 3x3 部分的基向量
  let x = Normalize([m[0], m[1], m[2]]);
  let y_temp = [m[4], m[5], m[6]];

  // 施密特正交化 (Gram-Schmidt)
  // z = x cross y
  let z = Normalize(Cross(x, y_temp));
  // y = z cross x (确保三个轴完全垂直)
  let y = Normalize(Cross(z, x));

  m[0] = x[0];
  m[1] = x[1];
  m[2] = x[2];
  m[4] = y[0];
  m[5] = y[1];
  m[6] = y[2];
  m[8] = z[0];
  m[9] = z[1];
  m[10] = z[2];
  return m;
}

function mousePressed(event) {
  if (!withinCanvas(event)) return;
  if (event.buttons === PRIMARY_BTN) {
    arcballStartVector = getArcballVector(mouseX, mouseY);
    currentRotationMatrix = renormalizeMatrix(currentRotationMatrix);
  }
}

function mouseDragged(event) {
  if (!withinCanvas(event)) return;

  if (event.buttons === SECONDARY_BTN) {
    panHorizontal += event.movementX / cW;
    panVertical += event.movementY / cH;
  }

  if (event.buttons === PRIMARY_BTN && arcballStartVector) {
    const arcballEndVector = getArcballVector(mouseX, mouseY);

    // 1. 计算旋转轴和角度
    const axis = Cross(arcballStartVector, arcballEndVector);
    const angle = Math.acos(
      Math.min(1.0, Dot(arcballStartVector, arcballEndVector)),
    );

    if (angle > 0.001) {
      // 2. 将 轴-角 转换为 旋转矩阵 (Rodriguez 旋转公式)
      const n = Normalize(axis);
      const s = Math.sin(angle);
      const c = Math.cos(angle);
      const oc = 1.0 - c;

      const deltaMat = rowMajorToColMajor4([
        oc * n[0] * n[0] + c,
        oc * n[0] * n[1] - n[2] * s,
        oc * n[2] * n[0] + n[1] * s,
        0,
        oc * n[0] * n[1] + n[2] * s,
        oc * n[1] * n[1] + c,
        oc * n[1] * n[2] - n[0] * s,
        0,
        oc * n[2] * n[0] - n[1] * s,
        oc * n[1] * n[2] + n[0] * s,
        oc * n[2] * n[2] + c,
        0,
        0,
        0,
        0,
        1,
      ]);

      // 3. 累加旋转：将新产生的微小旋转应用到当前矩阵
      // 这里使用右乘是因为旋转是相对于观察者的屏幕空间
      currentRotationMatrix = plzMany(currentRotationMatrix, deltaMat);

      // 更新起始向量，使得旋转是平滑增量的
      arcballStartVector = arcballEndVector;
    }
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

// 法线计算函数 - 通过三角形顶点计算面法线
function calculateNormal(v1, v2, v3) {
  const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
  const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
  const normal = cross(edge1, edge2);
  return Normalize(normal);
}

// 更新drawArray函数以使用物理光照着色器
function drawArray() {
  // noFill();
  // stroke(150);
  // strokeWeight(1);
  // ellipse(cW / 2, cH / 2, cW);

  const model_rotation_scale = plzMany(
    // 基础缩放：将 3x3x3 的模型缩放到合适大小
    plzScale(
      orthogonal_projection_W / 3,
      orthogonal_projection_H / 3,
      orthogonal_projection_D / 3,
    ),
    // 直接使用累加的旋转矩阵，不再受万向节死锁困扰
    currentRotationMatrix,
  );
  const model_world = plzMany(
    // 基础平移：将模型挪到世界中心
    // plzTranslate(-1.5, -1.5, -1.5),
    model_rotation_scale,
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
  const mvpMatrix = plzMany(model_world, world_view, projection);

  const vertexShader = makeBasicVertexShader(mvpMatrix);
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
  const element_attr_view_space = element_attributes.map(
    makeNormalTransShader(currentRotationMatrix),
  );
  const gpuCtx = new GpuCtx(screenW, screenH);

  const shader = debugNan(pbrShader);

  drawTriangles(
    gpuCtx,
    vertices_screen_space,
    elements,
    element_attr_view_space,
    shader,
  );
}

// 简单的 Lambertian 漫反射
function brdf2(normal, lightDir, _, _, albedo) {
  const NdotL = Math.max(Dot(normal, lightDir), 0.0);
  return Times(NdotL, albedo);
}

// 极简验证模型 3
function brdf3(
  normal,
  lightDir,
  viewDir,
  halfDir,
  albedo,
  metallic,
  roughness,
) {
  const NdotL = Math.max(dot(normal, lightDir), 0.0);
  const NdotH = Math.max(dot(normal, halfDir), 0.0);

  // 1. 将 Roughness 映射为简单的 Shininess 指数
  const specExp = Math.pow(10.0, (1.0 - roughness) * 2.0);

  // 2. 简单的能量归一化高光 (避免过亮)
  const specFactor = (specExp + 2.0) / 8.0;
  const specularIntensity = Math.pow(NdotH, specExp) * specFactor;

  const linearAlbedo = [
    Math.pow(albedo[0] / 255.0, 2.2),
    Math.pow(albedo[1] / 255.0, 2.2),
    Math.pow(albedo[2] / 255.0, 2.2),
  ];

  // 3. 根据金属度混合颜色
  return [
    (linearAlbedo[0] * (1.0 - metallic) + specularIntensity) * NdotL,
    (linearAlbedo[1] * (1.0 - metallic) + specularIntensity) * NdotL,
    (linearAlbedo[2] * (1.0 - metallic) + specularIntensity) * NdotL,
  ];
}
