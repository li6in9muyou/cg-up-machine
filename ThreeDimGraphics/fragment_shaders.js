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
