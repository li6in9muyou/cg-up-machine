function generateUVSphere(segments) {
  const vertices_model_space = [];
  const element_attributes = [];
  const elements_nested = [];
  const radius = 1.5;

  for (let lat = 0; lat <= segments; lat++) {
    const theta = (lat * Math.PI) / segments;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= segments; lon++) {
      const phi = (lon * 2 * Math.PI) / segments;
      const x = radius * sinTheta * Math.cos(phi);
      const y = radius * cosTheta;
      const z = radius * sinTheta * Math.sin(phi);

      vertices_model_space.push([x, y, z]);
    }
  }

  for (let lat = 0; lat < segments; lat++) {
    const materialIndex = lat < segments / 2 ? 0 : 1;

    for (let lon = 0; lon < segments; lon++) {
      const first = lat * (segments + 1) + lon;
      const second = first + segments + 1;

      const tris = [
        [first, second, first + 1],
        [second, second + 1, first + 1],
      ];

      for (const tri of tris) {
        elements_nested.push(tri);

        const v0 = vertices_model_space[tri[0]];
        const v1 = vertices_model_space[tri[1]];
        const v2 = vertices_model_space[tri[2]];

        const cx = (v0[0] + v1[0] + v2[0]) / 3;
        const cy = (v0[1] + v1[1] + v2[1]) / 3;
        const cz = (v0[2] + v1[2] + v2[2]) / 3;
        const mag = Math.sqrt(cx * cx + cy * cy + cz * cz);

        element_attributes.push([
          0,
          0,
          0,
          cx / mag,
          cy / mag,
          cz / mag,
          materialIndex,
        ]);
      }
    }
  }

  return {
    vertices_model_space,
    element_attributes,
    elements: elements_nested.flat(), // 按照立方体定义，打平为一维数组
  };
}
