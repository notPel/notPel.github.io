function getCatFact() {
  return fetch("https://catfact.ninja/fact").then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  });
}

function displayCatFact() {
  const factNode = document.querySelector("#fact");
  getCatFact().then((catData) => {
    factNode.textContent = catData.fact;
  });
}

window.onload = () => {
  const catButton = document.querySelector("#cat-button");
  catButton.addEventListener("click", displayCatFact);

  displayCatFact();
};
