const cW = 400;
const cH = 400;

const pDim = 4;
const bgColor = 0;
const nLines = cH / pDim;
const screenH = nLines;
const screenW = cW / pDim;

const colorPicker = document.getElementById("setColor");
let drawColor = colorPicker.value;
colorPicker.addEventListener("change", (ev) => {
  drawColor = ev.target.value;
});
const colorMap = new Map();

let vertices_client_space = [];
