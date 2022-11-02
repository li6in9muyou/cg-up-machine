control_points = [
  [199, 199],
  [199, 380],
  [199, 199],
  [199, 250],
];

function drawArray(array) {
  if (array.length === 0) {
    return;
  }
  for (let i = 0; i < array.length; i += 2) {
    const tl = array[i];

    let br = array[i + 1];
    if (br === undefined) {
      br = [mouseX, mouseY];
    }

    let color = colorMap.get(i);
    if (color === undefined) {
      colorMap.set(i, `${drawColor}`);
      color = drawColor;
    }
    drawCircle(tl, br, color);
  }
}

function drawCircle(center, pass, color) {
  const [cx, cy] = center;
  const [px, py] = pass;
  setPixel(...center, "red");
  const radius = Math.sqrt((py - cy) * (py - cy) + (cx - px) * (cx - px));
  let prev_x = cx + radius;
  let prev_y = cy;
  const steps = radius > 20 ? 100 : 40;
  const step_theta = (2 * Math.PI) / steps;
  for (let i = 0; i < steps; i++) {
    const theta = i * step_theta;
    const next_x = cx + radius * Math.cos(theta);
    const next_y = cy + radius * Math.sin(theta);
    lineDDA(prev_x, prev_y, next_x, next_y, color);
    prev_x = next_x;
    prev_y = next_y;
  }
  lineDDA(prev_x, prev_y, cx + radius, cy, color);
}
