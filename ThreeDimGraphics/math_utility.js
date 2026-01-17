function oneToRgb(vector) {
  // 1. 先进行 Gamma 逆压缩 [0, 1] -> [0, 1]
  // 2. 再映射到 0-255
  return [
    Math.min(255, Math.max(0, vector[0]) ** (1 / 2.2) * 255.0),
    Math.min(255, Math.max(0, vector[1]) ** (1 / 2.2) * 255.0),
    Math.min(255, Math.max(0, vector[2]) ** (1 / 2.2) * 255.0),
  ];
}

function normToRgb(vector) {
  return [
    Math.min(255, Math.abs(vector[0]) * 255.0),
    Math.min(255, Math.abs(vector[1]) * 255.0),
    Math.min(255, Math.abs(vector[2]) * 255.0),
  ];
}

function rgbToOne(vector) {
  // 这个函数逻辑基本没问题，[0, 255] -> [0, 1]
  return [
    (vector[0] / 255.0) ** 2.2,
    (vector[1] / 255.0) ** 2.2,
    (vector[2] / 255.0) ** 2.2,
  ];
}

function Normalize(v) {
  const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (length === 0) return [0, 0, 0];
  return [v[0] / length, v[1] / length, v[2] / length];
}

function Cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function Times(a, v3) {
  return [a * v3[0], a * v3[1], a * v3[2]];
}

function Dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function Sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function plzApplyManyMat4(vec3, ...trans) {
  const e = multiplyManyMatrices(...trans);
  const [x, y, z] = vec3;

  const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
  const tx = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
  const ty = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
  const tz = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
  return [tx, ty, tz];
}

function multiplyTwoMatrices(A, B) {
  const C = [];
  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      let v = 0;
      for (let k = 0; k < 4; ++k) {
        v += A[j + 4 * k] * B[k + 4 * i];
      }
      C.push(v);
    }
  }
  return C;
}

const plzMany = multiplyManyMatrices;
const plzIdentity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function multiplyManyMatrices(...mtx) {
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  return mtx.reduce((prev, curr) => multiplyTwoMatrices(curr, prev), identity);
}

function plzTranslate(x, y, z) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
}

function plzScale(x, y, z) {
  return [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
}

function Radians(angle) {
  return (angle / 180) * Math.PI;
}

function plzRotateX(angle) {
  const r = Radians(angle);
  return [
    1,
    0,
    0,
    0,
    0,
    Math.cos(r),
    Math.sin(r),
    0,
    0,
    -Math.sin(r),
    Math.cos(r),
    0,
    0,
    0,
    0,
    1,
  ];
}

function plzRotateY(angle) {
  const r = Radians(angle);
  return [
    Math.cos(r),
    0,
    -Math.sin(r),
    0,
    0,
    1,
    0,
    0,
    Math.sin(r),
    0,
    Math.cos(r),
    0,
    0,
    0,
    0,
    1,
  ];
}

function plzRotateZ(angle) {
  const r = Radians(angle);
  return [
    Math.cos(r),
    Math.sin(r),
    0,
    0,
    -Math.sin(r),
    Math.cos(r),
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
  ];
}
