var lineDrawer;
var curveDrawer;

// Called once to initialize
function InitWebGL() {
  // Initialize the WebGL canvas
  const canvas = document.getElementById("canvas");
  canvas.oncontextmenu = function () {
    return false;
  };
  gl = canvas.getContext("webgl", { antialias: false, depth: false }); // Initialize the GL context
  if (!gl) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  // Initialize settings
  gl.clearColor(1.0, 1.0, 1.0, 0.0);
  gl.lineWidth(1.0);

  // Initialize the programs and buffers for drawing
  lineDrawer = new LineDrawer();
  curveDrawer = new CurveDrawer();

  // Set the viewport size
  UpdateCanvasSize();
}

// Called every time the window size is changed.
function UpdateCanvasSize() {
  const canvas = document.getElementById("canvas");
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = pixelRatio * cW;
  canvas.height = pixelRatio * cH;
  const width = canvas.width / pixelRatio;
  const height = canvas.height / pixelRatio;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Update the projection matrices using the new viewport size
  lineDrawer.setViewport(width, height);
  curveDrawer.setViewport(width, height);
}

// Called when the control points are modified
function UpdatePoints() {
  // Update the control point data
  lineDrawer.updatePoints(pt);
  curveDrawer.updatePoints(pt);
}

// This is the main function that handled WebGL drawing
function DrawScene() {
  // Clear the screen. There is no need to clear the depth buffer, since it does not exist.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw the curve and then the line segments that connect the control points.
  curveDrawer.draw();
  lineDrawer.draw();
}

// This is a helper function for compiling the given vertex and fragment shader source code into a program.
function InitShaderProgram(vsSource, fsSource) {
  const vs = CompileShader(gl.VERTEX_SHADER, vsSource);
  const fs = CompileShader(gl.FRAGMENT_SHADER, fsSource);

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    alert(
      "Unable to initialize the shader program: " + gl.getProgramInfoLog(prog)
    );
    return null;
  }
  return prog;
}

// This is a helper function for compiling a shader, called by InitShaderProgram().
function CompileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      "An error occurred compiling shader:\n" + gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
