class LineDrawer {
  constructor() {
    // Compile the shader program
    this.prog = InitShaderProgram(linesVS, linesFS);

    // Get the ids of the uniform variables in the shaders
    this.mvp = gl.getUniformLocation(this.prog, "mvp");

    // Get the ids of the vertex attributes in the shaders
    this.vertPos = gl.getAttribLocation(this.prog, "pos");

    // Create the vertex buffer object
    this.buffer = gl.createBuffer();
    // We are not filling the contents of the buffer here,
    // because we will put the control points into this buffer.
  }
  setViewport(width, height) {
    // Compute the orthographic projection matrix and send it to the shader
    var trans = [
      2 / width,
      0,
      0,
      0,
      0,
      -2 / height,
      0,
      0,
      0,
      0,
      1,
      0,
      -1,
      1,
      0,
      1,
    ];
    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.mvp, false, trans);
  }
  updatePoints(pt) {
    // The control points have changed, so we must update
    // the data in the in the vertex buffer
    var p = [];
    for (var i = 0; i < 4; ++i) {
      var x = pt[i].getAttribute("cx");
      var y = pt[i].getAttribute("cy");
      p.push(x);
      p.push(y);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(p), gl.STATIC_DRAW);
  }
  draw() {
    // Draw the line segments
    gl.useProgram(this.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.vertexAttribPointer(this.vertPos, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.vertPos);
    gl.drawArrays(gl.LINE_STRIP, 0, 4);
  }
}
// Vertex shader source code
var linesVS = `
	attribute vec2 pos;
	uniform mat4 mvp;
	void main()
	{
		gl_Position = mvp * vec4(pos,0,1);
	}
`;
// Fragment shader source code
var linesFS = `
	precision mediump float;
	void main()
	{
		gl_FragColor = vec4(0,0,1,1);
	}
`;
