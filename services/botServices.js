const secondShiftBot = require("../bots/secondShiftBot");
const crossedBoundariesBot = require("../bots/crossedBoundariesBot");
const patternBot = require("../bots/patternBot");
const climbBot = require("../bots/climbBot");
const mixedSignalsBot = require("../bots/mixedSignalsBot");
const lifeLatelyBot = require("../bots/lifeLately");
const noFilterBot = require("../bots/noFilterBot");
const defaultBot = require("../bots/defaultBot");

function getBotReplyByCommunity(communityId, message) {
  switch (communityId) {
    case "second-shift":
      return secondShiftBot(message);

    case "crossed-boundaries":
      return crossedBoundariesBot(message);

    case "the-pattern":
      return patternBot(message);

    case "the-climb":
      return climbBot(message);

    case "mixed-signals":
      return mixedSignalsBot(message);

    case "life-lately":
      return lifeLatelyBot(message);

    case "no-filter":
      return noFilterBot(message);

    default:
      return defaultBot(message);
  }
}

module.exports = { getBotReplyByCommunity };
