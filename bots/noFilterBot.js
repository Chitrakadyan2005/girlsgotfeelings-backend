const { randomPick } = require("./baseBot");

module.exports = function noFilterBot(message) {
  const replies = [
    "Say it. This is a judgment-free space.",
    "Let it out — you don’t need to sugarcoat here.",
    "That sounds like a lot to carry.",
    "You don’t have to be ‘nice’ in this room.",
    "Your anger makes sense.",
  ];

  return randomPick(replies);
};
