vertices_client_space = (function () {
  const center = [cW / 2, cH / 2];
  const innerR = 30;
  const len = 170;
  const steps = 40;
  const thetaStep = (2 * Math.PI) / steps;
  const ans = [];
  for (let i = 0; i < steps; i++) {
    const cos = Math.cos(i * thetaStep);
    const sin = Math.sin(i * thetaStep);
    ans.push([center[0] + innerR * cos, center[1] + innerR * sin]);
    ans.push([
      center[0] + (innerR + len) * cos,
      center[1] + (innerR + len) * sin,
    ]);
  }
  return ans;
})();

function drawArray(array) {
  if (array.length === 0) {
    return;
  }
  for (let i = 0; i < array.length; i += 2) {
    const tl = array[i];
    const [tlx, tly] = tl;
    const br = array[i + 1];
    const [brx, bry] = br;

    if (!colorMap.has(i)) {
      colorMap.set(i, `${drawColor}`);
    }
    const color = colorMap.get(i);
    lineDDA(tlx, tly, brx, bry, color);
  }
}
