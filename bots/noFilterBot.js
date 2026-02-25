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

module.exports = (message) => {
  const msg = message.toLowerCase();

  if (msg.includes("angry") || msg.includes("furious")) {
    return "Let it out. You don’t have to censor yourself here.";
  }

  if (msg.includes("tired") || msg.includes("done")) {
    return "Sounds exhausting. Say whatever you need — this space can take it.";
  }

  if (msg.includes("hate")) {
    return "That’s heavy. You’re not wrong for feeling this way.";
  }

  return "I’m here. Go on.";
};