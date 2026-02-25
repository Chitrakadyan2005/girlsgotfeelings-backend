const { randomPick } = require("./baseBot");

module.exports = function patternBot(message) {
  const replies = [
    "You’re noticing patterns most people are taught to ignore.",
    "Once you see it, it’s hard to unsee — you’re not alone in that.",
    "A lot of this is systemic, not personal failure.",
    "What pattern keeps repeating for you?",
    "It’s okay to question things you were told were ‘normal’.",
  ];

  return randomPick(replies);
};