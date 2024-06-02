export function findScanlineMinMaxY(W, H, attributes) {
  const minY = attributes
    .map((attr) => attr[1])
    .reduce((min, y) => Math.min(min, y), Infinity);
  const maxY = attributes
    .map((attr) => attr[1])
    .reduce((max, y) => Math.max(max, y), -Infinity);
  return [minY, maxY];
}

export function scanline(W, H, attributes) {}

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
      for (const attribute of DdaInterpolation(
        ctx.getFragmentAttribute(leftEnd, y),
        ctx.getFragmentAttribute(rightEnd, y),
      )) {
        const x = Math.ceil(attribute[0]);
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
