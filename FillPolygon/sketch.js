control_points = [
  [200, 20],
  [20, 200],
  [200, 390],
  [350, 200],
  [150, 200],
  [299, 100],
];

let fillerText = "";

function drawArray(array) {
  drawLineLoop(array);
}

const setText = document.getElementById("setText");
const previewText = document.getElementById("previewText");
const ctx = previewText.getContext("2d");

function renderFillerText() {
  console.log(1);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.font = `bold ${ctx.canvas.height * 1.2}px monospace`;
  ctx.fillStyle = "red";
  ctx.fillText(fillerText, 0, ctx.canvas.height - 5);
}

window.addEventListener("load", () => {
  fillerText = setText.value;
  renderFillerText();
});

setText.addEventListener("input", (ev) => {
  fillerText = ev.target.value;
  renderFillerText();
});
