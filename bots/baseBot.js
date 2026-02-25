function normalize(text = "") {
  return text.toLowerCase().trim();
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
  normalize,
  randomPick,
};