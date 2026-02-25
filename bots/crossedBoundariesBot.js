const { randomPick } = require("./baseBot");

module.exports = function crossedBoundariesBot(message) {
  const replies = [
    "What you’re describing matters. Your comfort is important.",
    "If something felt wrong, that feeling is valid.",
    "You don’t need a ‘big reason’ to set boundaries.",
    "Do you want to talk about what crossed the line for you?",
    "You deserve to feel safe — emotionally and physically.",
  ];

  return randomPick(replies);
};