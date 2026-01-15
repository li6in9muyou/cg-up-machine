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
