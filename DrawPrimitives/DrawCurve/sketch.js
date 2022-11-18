vertices_client_space = [
  [120, 20],
  [20, 380],
  [380, 380],
  [320, 20],
];

function Prod(t, v2) {
  return [v2[0] * t, v2[1] * t];
}

function Add(...v2) {
  let x = 0;
  let y = 0;
  for (const v of v2) {
    x += v[0];
    y += v[1];
  }
  return [x, y];
}

function drawArray(array) {
  if (array.length === 0) {
    return;
  }
  for (let i = 0; i < array.length; i += 4) {
    let color = colorMap.get(i);
    if (color === undefined) {
      colorMap.set(i, `${drawColor}`);
      color = drawColor;
    }
    drawBezierCurve(array.slice(i, i + 4), color);
  }
}

const steps = 20;

function drawBezierCurve(control_points, color) {
  for (let i = 0; i < 3; i++) {
    const from = control_points[i];
    const to = control_points[i + 1];
    lineDDA(from[0], from[1], to[0], to[1], "#888800");
  }
  const [p0, p1, p2, p3] = control_points;
  const points = [];
  for (let i = 0; i < 1 + steps; i++) {
    const t = i / steps;
    const a0 = (1 - t) * (1 - t) * (1 - t);
    const a1 = 3 * (1 - t) * (1 - t) * t;
    const a2 = 3 * (1 - t) * t * t;
    const a3 = t * t * t;
    points.push(
      Add(Prod(a0, p0), Prod(a1, p1), Prod(a2, p2), Prod(a3, p3)).map(int)
    );
  }
  drawLineStrip(points);
}
