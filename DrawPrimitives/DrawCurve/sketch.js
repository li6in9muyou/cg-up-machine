vertices_client_space = [
  [109, 57],
  [17, 79],
  [2, 224],
  [96, 275],
  [108.44886779785156, 56.28693389892578],
  [192, 49],
  [221, 116],
  [201, 151],
  [92.34820556640625, 268.1428565979004],
  [228, 295],
  [221, 191],
  [186, 170],
  [186, 76],
  [257, 39],
  [366, 54],
  [314, 125],
  [189.34820556640625, 252.1428565979004],
  [236, 285],
  [294, 280],
  [321, 245],
  [314, 251],
  [319, 260],
  [342, 220],
  [321, 201],
  [257.34820556640625, 199.1428565979004],
  [237, 196],
  [223.34820556640625, 170.1428565979004],
  [245, 126],
  [238, 132],
  [397, 102],
  [333, 192],
  [321, 206],
  [197.34820556640625, 148.1428565979004],
  [188, 169],
  [128, 180],
  [126.34820556640625, 127.14285659790039],
  [121.34820556640625, 129.1428565979004],
  [117, 156],
  [115.34820556640625, 179.1428565979004],
  [125, 200],
  [124, 200],
  [133.34820556640625, 172.1428565979004],
  [173.34820556640625, 168.1428565979004],
  [189.34820556640625, 172.1428565979004],
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
  for (const controlPoint of control_points) {
    setPixel(...controlPoint, "#ffff00");
  }
  if (control_points.length < 4) {
    return;
  }
  for (let i = 0; i < 3; i++) {
    const from = control_points[i];
    const to = control_points[i + 1];
    lineDDA(from[0], from[1], to[0], to[1], "#ffff0022");
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
      Add(Prod(a0, p0), Prod(a1, p1), Prod(a2, p2), Prod(a3, p3)).map(int),
    );
  }
  drawLineStripWithColor(points, color);
}

let draggedPointIndex = -1;

function mousePressed(event) {
  if (event.button !== 2) return;

  let minDiff = Infinity;
  let targetIndex = -1;
  const threshold = 50;

  for (let i = 0; i < vertices_client_space.length; i++) {
    const [vx, vy] = vertices_client_space[i];
    const dx = mouseX - vx;
    const dy = mouseY - vy;
    const distSq = dx * dx + dy * dy;

    if (distSq < minDiff) {
      minDiff = distSq;
      targetIndex = i;
    }
  }

  if (minDiff < threshold * threshold) {
    draggedPointIndex = targetIndex;
  }
}

function mouseDragged() {
  if (draggedPointIndex !== -1 && mouseIsPressed && mouseButton === RIGHT) {
    vertices_client_space[draggedPointIndex] = [int(mouseX), int(mouseY)];
  }
}

function mouseReleased(event) {
  if (event.button === 2) {
    draggedPointIndex = -1;
  }
}
