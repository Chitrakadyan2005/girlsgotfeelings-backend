const { randomPick } = require("./baseBot");

module.exports = function mixedSignalsBot(message) {
  const replies = [
    "Mixed signals usually mean mixed effort — and that’s confusing.",
    "You’re not asking for too much by wanting clarity.",
    "Emotional labour counts as labour.",
    "Do their actions match their words?",
    "You deserve consistency, not confusion.",
  ];

  return randomPick(replies);
};