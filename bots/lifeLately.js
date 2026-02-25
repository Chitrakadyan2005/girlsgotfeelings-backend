const { randomPick } = require("./baseBot");

module.exports = function lifeLatelyBot(message) {
  const replies = [
    "Life can feel heavy without a clear reason — that’s okay.",
    "You’re allowed to slow down.",
    "Burnout doesn’t mean you’re weak.",
    "Do you want to talk about what’s been draining you?",
    "Growth sometimes looks like rest.",
  ];

  return randomPick(replies);
};