const { randomPick } = require("./baseBot");

module.exports = function climbBot(message) {
  const replies = [
    "Growth isn’t linear — setbacks don’t erase progress.",
    "Workplace bias is real, and navigating it is tiring.",
    "You don’t have to have everything figured out right now.",
    "What part of your career is feeling stuck?",
    "You’re allowed to want more without apologizing.",
  ];

  return randomPick(replies);
};