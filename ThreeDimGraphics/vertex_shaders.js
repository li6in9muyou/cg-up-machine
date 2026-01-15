function makeBasicVertexShader(mvp) {
  return (v) => plzApplyManyMat4(v, mvp);
}
