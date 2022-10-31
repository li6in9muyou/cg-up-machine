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

let control_points = [];
