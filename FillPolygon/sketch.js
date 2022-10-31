const cW = 400;
const cH = 400;

const pDim = 4;
const bgColor = 0;

const colorPicker = document.getElementById("setColor");
let drawColor = colorPicker.value;
colorPicker.addEventListener("change", (ev) => {
  drawColor = ev.target.value;
});
const colorMap = new Map();

const rect_control_points = [
  [200, 20],
  [20, 200],
  [200, 390],
  [350, 200],
  [150, 200],
  [299, 100],
];

function setup() {
  let c = createCanvas(cW, cH);
  c.mouseClicked(() => {
    rect_control_points.push([mouseX, mouseY]);
  });
}

function draw() {
  background(bgColor);

  setPixel(0, 0, "red");
  setPixel(cW - pDim, cH - pDim, "green");
  setPixel(0, cH - pDim, "blue");
  setPixel(cW - pDim, 0, "yellow");

  drawLineLoop(rect_control_points);
}
