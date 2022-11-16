// [TO-DO] Complete the implementation of the following class and the vertex shader below.
class CurveDrawer {
  constructor() {
    this.prog = InitShaderProgram(curvesVS, curvesFS);

    // [TO-DO] Other initializations should be done here.
    // [TO-DO] This is a good place to get the locations of attributes and uniform variables.
    const uu = (name) => gl.getUniformLocation(this.prog, name);
    this.u_locs = [uu("p0"), uu("p1"), uu("p2"), uu("p3")];
    this.mvp = uu("mvp");

    // Initialize the attribute buffer
    this.steps = 100;
    const tv = [];
    for (let i = 0; i < this.steps; ++i) {
      tv.push(i / (this.steps - 1));
    }
    this.tv = tv;

    // [TO-DO] This is where you can create and set the contents of the vertex buffer object
    // for the vertex attribute we need.
    this.tPos = gl.getAttribLocation(this.prog, "t");
    this.buffer = gl.createBuffer();

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  setViewport(width, height) {
    // [TO-DO] This is where we should set the transformation matrix.
    // [TO-DO] Do not forget to bind the program before you set a uniform variable value.
    const trans = [
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
    gl.useProgram(this.prog); // Bind the program
    gl.uniformMatrix4fv(this.mvp, false, trans);
  }

  updatePoints(pt) {
    // [TO-DO] The control points have changed, we must update corresponding uniform variables.
    // [TO-DO] Do not forget to bind the program before you set a uniform variable value.
    // [TO-DO] We can access the x and y coordinates of the i^th control points using
    // let x = pt[i].getAttribute("cx");
    // let y = pt[i].getAttribute("cy");
    const control_points = pt.map((p) => [
      p.getAttribute("cx"),
      p.getAttribute("cy"),
    ]);
    gl.useProgram(this.prog);
    this.u_locs.map((loc, idx) => {
      gl.uniform2fv(loc, control_points[idx]);
    });
  }

  draw() {
    // [TO-DO] This is where we give the command to draw the curve.
    // [TO-DO] Do not forget to bind the program and set the vertex attribute.
    // Draw the line segments
    gl.useProgram(this.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.tv), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.tPos);
    gl.vertexAttribPointer(this.tPos, 1, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINE_STRIP, 0, this.steps);
  }
}

// Vertex Shader
let curvesVS = `
	attribute float t;
	uniform mat4 mvp;
	uniform vec2 p0;
	uniform vec2 p1;
	uniform vec2 p2;
	uniform vec2 p3;
	void main()
	{
		// [TO-DO] Replace the following with the proper vertex shader code
		float a0 = (1.0-t) * (1.0-t) * (1.0-t);
		float a1 = 3.0 * (1.0-t) * (1.0-t) * t;
		float a2 = 3.0 * (1.0-t) * t * t;
		float a3 = t * t * t;
		gl_Position = mvp * vec4(a0*p0 + a1*p1 + a2*p2 + a3*p3 ,0,1);
	}
`;

// Fragment Shader
let curvesFS = `
	precision mediump float;
	void main()
	{
		gl_FragColor = vec4(1,0,0,1);
	}
`;
