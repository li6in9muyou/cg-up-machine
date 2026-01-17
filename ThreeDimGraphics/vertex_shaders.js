function makeBasicVertexShader(mvp) {
  return (v) => plzApplyManyMat4(v, mvp);
}
function makeNormalTransShader(mrs) {
  return (attr) => {
    const [r, g, b, x, y, z, ...rest] = attr;
    return [r, g, b, ...Normalize(plzApplyManyMat4([x, y, z], mrs)), ...rest];
  };
}
