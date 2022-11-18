vertices_client_space = [
  [120, 20],
  [20, 380],
  [380, 380],
  [320, 20],
];

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

function drawBezierCurve(control_points, color) {
  for (let i = 0; i < 3; i++) {
    const from = control_points[i];
    const to = control_points[i + 1];
    lineDDA(from[0], from[1], to[0], to[1], "#888800");
  }
}
