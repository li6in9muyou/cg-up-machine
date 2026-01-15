vertices_client_space = [
  [216, 230.39999771118164],
  [217, 232.39999771118164],
  [228, 232.39999771118164],
  [224, 233.39999771118164],
  [238, 232.39999771118164],
  [234, 233.39999771118164],
  [222, 236.39999771118164],
  [225, 238.39999771118164],
  [207, 226.39999771118164],
  [209, 227.39999771118164],
  [216, 234.39999771118164],
  [214, 235.39999771118164],
  [242, 232.39999771118164],
  [245, 232.39999771118164],
  [202, 217.39999771118164],
  [202, 221.39999771118164],
  [210, 232.39999771118164],
  [212, 233.39999771118164],
  [214, 236.39999771118164],
  [216, 237.39999771118164],
  [228, 241.39999771118164],
  [225, 240.39999771118164],
  [234, 237.39999771118164],
  [230, 238.39999771118164],
  [208.51785278320312, 225.1428565979004],
  [209.51785278320312, 223.1428565979004],
  [244.51785278320312, 233.1428565979004],
  [244.51785278320312, 231.1428565979004],
  [248.51785278320312, 232.1428565979004],
  [248.51785278320312, 230.1428565979004],
  [229, 217],
  [258, 210],
  [10, 2000],
  [20, 305],
];

for (let i = 0; i < vertices_client_space.length - 4; i++) {
  colorMap.set(i, "#002200");
}

function drawArray(array) {
  if (array.length === 0) {
    return;
  }
  for (let i = 0; i < array.length; i += 2) {
    const tl = array[i];
    const br = array[i + 1];
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
