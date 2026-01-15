vertices_client_space = [
  [107, 10],
  [391, 282],
  [9, 297],
  [89, 389],
  [390, 388],
  [364, 350],
  [348, 388],
  [106, 297],
  [366, 296],
  [389.5178527832031, 332.1428565979004],
  [8.517852783203125, 8.14285659790039],
  [89, 129],
  [10.517852783203125, 147.1428565979004],
  [88.51785278320312, 281.1428565979004],
];

colorMap.set(0, "#f00");
colorMap.set(2, "#00f");
colorMap.set(4, "#ff0");
for (let i = 6; i < vertices_client_space.length; i += 1) {
  colorMap.set(i, "#fff");
}

function drawArray(array) {
  if (array.length === 0) {
    return;
  }
  for (let i = 0; i < array.length; i += 2) {
    const [a, b] = array[i];
    const [c, d] = array[i + 1];
    const tl = [Math.min(a, c), Math.min(b, d)];
    const br = [Math.max(a, c), Math.max(b, d)];
    const [tlx, tly] = tl;
    const [brx, bry] = br;

    if (!colorMap.has(i)) {
      colorMap.set(i, `${drawColor}`);
    }
    const color = colorMap.get(i);
    lineDDA(tlx, tly, tlx, bry + 1, color);
    lineDDA(tlx, tly, brx, tly + 1, color);
    lineDDA(brx, bry, tlx, bry, color);
    lineDDA(brx, bry, brx, tly - 1, color);
  }
}
