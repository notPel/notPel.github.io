// Asked bing chat for this
function getRandomColor() {
  let randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return "#" + randomColor;
}

// Fires when button is clicked
function randomBodyBackgroundColor() {
  const body = document.querySelector("body");
  body.style.backgroundColor = getRandomColor();
}

function loadEventFunctions() {
  const button = document.querySelector("#that-button");
  button.addEventListener("click", randomBodyBackgroundColor);
  console.log("Function attached to button!");
}

window.onload = () => {
  loadEventFunctions();
};
