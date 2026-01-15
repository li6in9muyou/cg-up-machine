const colorPicker = document.getElementById("setColor");
let drawColor = colorPicker.value;
colorPicker.addEventListener("change", (ev) => {
  drawColor = ev.target.value;
});
const colorMap = new Map();
