const blackAndWhite = ((colorOne, colorTwo) => (attributes) => {
  const x = int(attributes[0]);
  const y = int(attributes[1]);
  if ((Math.floor(y / 5) % 2 === 0) ^ (Math.floor(x / 5) % 2 === 0)) {
    return colorOne;
  } else {
    return colorTwo;
  }
})([255, 255, 255], [80, 80, 80]);
function splitCoordAttr(attributes) {
  return [attributes.slice(0, 3), attributes.slice(3)];
}
const interpolateVertexAttributes = (attributes) => {
  const [, rgb] = splitCoordAttr(attributes);
  return rgb;
};
const MSAA = (ctx) => (attributes) => {
  const [_x, _y, , ...clr] = attributes;
  const x = int(_x);
  const y = int(_y);
  const l = ctx.getFragmentAttribute(x - 1, y);
  const r = ctx.getFragmentAttribute(x + 1, y);
  const u = ctx.getFragmentAttribute(x, y - 1);
  const d = ctx.getFragmentAttribute(x, y + 1);
  const lu = ctx.getFragmentAttribute(x - 1, y - 1);
  const ru = ctx.getFragmentAttribute(x + 1, y - 1);
  const rd = ctx.getFragmentAttribute(x + 1, y + 1);
  const ld = ctx.getFragmentAttribute(x - 1, y + 1);

  let sample = 0;
  if (l) {
    clr[0] += l[3];
    clr[1] += l[4];
    clr[2] += l[5];
  }
  sample += 1;
  if (u) {
    clr[0] += u[3];
    clr[1] += u[4];
    clr[2] += u[5];
  }
  sample += 1;
  if (d) {
    clr[0] += d[3];
    clr[1] += d[4];
    clr[2] += d[5];
  }
  sample += 1;
  if (r) {
    clr[0] += r[3];
    clr[1] += r[4];
    clr[2] += r[5];
  }
  sample += 1;
  if (lu) {
    clr[0] += lu[3];
    clr[1] += lu[4];
    clr[2] += lu[5];
  }
  sample += 1;
  if (ru) {
    clr[0] += ru[3];
    clr[1] += ru[4];
    clr[2] += ru[5];
  }
  sample += 1;
  if (rd) {
    clr[0] += rd[3];
    clr[1] += rd[4];
    clr[2] += rd[5];
  }
  sample += 1;
  if (ld) {
    clr[0] += ld[3];
    clr[1] += ld[4];
    clr[2] += ld[5];
  }
  sample += 1;
  return clr.map((x) => x / sample);
};
