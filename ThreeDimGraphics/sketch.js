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

// 物理光照相关常量
const lightDirection = normalize([-1, -1, -1]); // 平行光方向
const lightColor = [255, 255, 255]; // 光源颜色
const ambientIntensity = 0.05; // 环境光强度（物理渲染中通常较小）

// 材质定义 - 每个面不同的物理材质属性 [albedo, roughness, metallic]
const materials = [
  // Near (白色非金属，低粗糙度)
  [[255, 255, 255], 0.1, 0.0],
  // Bottom (蓝色非金属，中等粗糙度)
  [[0, 0, 255], 0.4, 0.0],
  // Far (青色非金属，高粗糙度)
  [[0, 255, 255], 0.8, 0.0],
  // Left (品红金属，中等粗糙度)
  [[255, 0, 255], 0.3, 0.9],
  // Right (黄色金属，低粗糙度)
  [[255, 255, 0], 0.1, 1.0],
  // Top (绿色非金属，中等粗糙度)
  [[0, 255, 0], 0.5, 0.0],
];

// 向量归一化函数
function normalize(v) {
  const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (length === 0) return [0, 0, 0];
  return [v[0] / length, v[1] / length, v[2] / length];
}

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
  normal = normalize(normal);
  lightDir = normalize(lightDir);
  viewDir = normalize(viewDir);
  halfDir = normalize(halfDir);

  // 1. 计算夹角点积，并使用微小值截断以防止掠射角下的分母爆炸
  const NdotL = Math.max(dot(normal, lightDir), 0.0001);
  const NdotV = Math.max(dot(normal, viewDir), 0.0001);
  const VdotH = Math.max(dot(viewDir, halfDir), 0.0);

  // 2. 基础反射率 F0 (金属度插值)
  const F0 = [
    0.04 * (1.0 - metallic) + albedo[0] * metallic,
    0.04 * (1.0 - metallic) + albedo[1] * metallic,
    0.04 * (1.0 - metallic) + albedo[2] * metallic,
  ];

  // 3. 计算 D, G, F 三项中间体
  const F = fresnelSchlick(VdotH, F0); // F 是向量 [r, g, b]
  const G = geometrySmith(normal, lightDir, viewDir, roughness); // G 是标量
  const D = distributionGGX(normal, halfDir, roughness); // D 是标量

  // 4. 计算镜面反射 Specular (Cook-Torrance)
  // 分母公式: 4 * (N·L) * (N·V)
  const denominator = 4.0 * NdotV * NdotL;
  const specular = [
    (D * G * F[0]) / denominator,
    (D * G * F[1]) / denominator,
    (D * G * F[2]) / denominator,
  ];

  // 5. 能量守恒：计算漫反射系数 kD
  // 镜面反射比例 kS 即为菲涅尔项 F
  const kS = F;
  const kD = [
    (1.0 - kS[0]) * (1.0 - metallic),
    (1.0 - kS[1]) * (1.0 - metallic),
    (1.0 - kS[2]) * (1.0 - metallic),
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
function calculatePhysicallyBasedLighting(normal, material, vertexPosition) {
  // 获取材质属性
  const [albedo, roughness, metallic] = material;

  // 归一化输入
  const norm = normalize(normal);
  const lightDir = normalize(lightDirection);
  // 假设观察者在屏幕前方 (模拟相机视角)
  const viewDir = normalize([0, 0, -1]);
  const halfDir = normalize([
    lightDir[0] + viewDir[0],
    lightDir[1] + viewDir[1],
    lightDir[2] + viewDir[2],
  ]);

  // 将RGB值从[0,255]转换到[0,1]
  const linearAlbedo = [
    (albedo[0] / 255.0) ** 2.2,
    (albedo[1] / 255.0) ** 2.2,
    (albedo[2] / 255.0) ** 2.2,
  ];

  // 计算Cook-Torrance BRDF
  // const brdfResult = cookTorranceBRDF(
  // const brdfResult = brdf3(
  const brdfResult = brdf2(
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
  const result = [
    Math.min(255, Math.max(0, Math.round(255 * mapped[0] ** (1.0 / 2.2)))),
    Math.min(255, Math.max(0, Math.round(255 * mapped[1] ** (1.0 / 2.2)))),
    Math.min(255, Math.max(0, Math.round(255 * mapped[2] ** (1.0 / 2.2)))),
  ];

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
  0.012500000000000063, -0.022499999999999985, 25, 113, 1.1800000000000002,
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

// 法线计算函数 - 通过三角形顶点计算面法线
function calculateNormal(v1, v2, v3) {
  const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
  const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
  const normal = cross(edge1, edge2);
  return normalize(normal);
}

// 物理光照片元着色器
const physicalLightingFragShader = (function () {
  // 缓存顶点数据用于法线计算
  let cachedVertices = null;
  let cachedElements = null;

  return function setupPhysicalLightingShader(vertices, elements) {
    cachedVertices = vertices;
    cachedElements = elements;

    return function (attributes) {
      // 提取坐标和面索引信息
      const [x, y, z, r, g, b] = attributes;

      // 确定当前像素属于哪个面，从而获取对应材质
      let faceIndex = -1;
      // 通过查找最接近的颜色匹配来确定面
      for (let i = 0; i < element_attributes.length; i += 6) {
        // 检查该面的第一个顶点颜色是否匹配
        if (
          Math.abs(element_attributes[i][0] - r) < 5 &&
          Math.abs(element_attributes[i][1] - g) < 5 &&
          Math.abs(element_attributes[i][2] - b) < 5
        ) {
          faceIndex = Math.floor(i / 6); // 每个面有6个顶点属性（每个三角形的3个顶点×2个三角形）
          break;
        }
      }

      // 如果没找到对应的面，则使用默认颜色
      if (faceIndex === -1 || faceIndex >= materials.length) {
        return [r, g, b];
      }

      // 获取当前面的三个顶点以计算法线
      if (cachedElements && cachedVertices) {
        // 获取构成这个像素所在三角形的三个顶点
        // 我们需要找到包含当前像素的三角形
        // 由于我们不知道具体是哪个三角形，我们使用面法线
        const elementOffset = faceIndex * 6; // 每个面对应6个元素索引（两个三角形）

        // 获取构成这个面的两个三角形的顶点
        const tri1Idx1 = cachedElements[elementOffset];
        const tri1Idx2 = cachedElements[elementOffset + 1];
        const tri1Idx3 = cachedElements[elementOffset + 2];

        // 计算面法线（这里简单使用第一个三角形的法线）
        const v1 = cachedVertices[tri1Idx1];
        const v2 = cachedVertices[tri1Idx2];
        const v3 = cachedVertices[tri1Idx3];

        // const normal = calculateNormal(v1, v2, v3);
        const normal = calculateNormal(v3, v2, v1);
        return oneToRgb(normal);

        // 获取材质
        const material = materials[faceIndex];

        // 计算物理光照
        const litColor = calculatePhysicallyBasedLighting(normal, material, [
          x,
          y,
          z,
        ]);

        return litColor;
      }

      // 如果无法计算光照，则返回原始颜色
      return [r, g, b];
    };
  };
})();

// 更新drawArray函数以使用物理光照着色器
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
  const gpuCtx = new GpuCtx(screenW, screenH);

  // 设置物理光照着色器
  const mvMatrix = plzMany(model_world, world_view);
  const vertices_view_space = vertices_model_space.map(
    makeBasicVertexShader(mvMatrix),
  );
  const shader = physicalLightingFragShader(vertices_view_space, elements);

  drawTriangles(
    gpuCtx,
    vertices_screen_space,
    elements,
    element_attributes,
    shader,
  );
}

// 极简验证模型 2
function brdf2(normal, lightDir, _, _, albedo) {
  const NdotL = Math.max(dot(normalize(normal), normalize(lightDir)), 0.0);
  const linearAlbedo = [
    Math.pow(albedo[0] / 255.0, 2.2),
    Math.pow(albedo[1] / 255.0, 2.2),
    Math.pow(albedo[2] / 255.0, 2.2),
  ];
  // 简单的 Lambertian 漫反射
  return [
    linearAlbedo[0] * NdotL,
    linearAlbedo[1] * NdotL,
    linearAlbedo[2] * NdotL,
  ];
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
