const { randomPick } = require("./baseBot");

module.exports = function secondShiftBot(message) {
  const replies = [
    "That sounds exhausting. You’re not imagining it.",
    "A lot of invisible work goes unnoticed. You’re allowed to feel tired.",
    "You’re doing more than your share — and that matters.",
    "Want to talk about what your day actually looks like?",
    "You don’t owe productivity to anyone all the time.",
  ];

  return randomPick(replies);
};