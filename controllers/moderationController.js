const { moderateText } = require("../moderation/moderationRules");
const {
  isSuspended,
  addWarning,
  suspendUser,
  resetUser,
  MAX_WARNINGS,
} = require("../moderation/userModerationStore");

async function moderateContent(req, res) {
  const userId = req.user?.id;
  const { text } = req.body;

  if (!userId || !text) {
    return res.status(400).json({
      allowed: false,
      action: "invalid",
      message: "Invalid moderation request",
    });
  }
console.log("Moderation user:", req.user);
  if (await isSuspended(userId)) {
    return res.status(403).json({
      allowed: false,
      action: "suspended",
      message: "Account is temporarily suspended due to abusive behavior",
    });
  }

  const result = moderateText(text);

  if (result.severity === 2) {
    await suspendUser(userId);

    return res.status(403).json({
      allowed: false,
      action: "suspended",
      severity: "severe",
      message:
        "Severe abusive content detected. Your account has been suspended.",
    });
  }

  if (result.severity === 1) {
    const warningResult = addWarning(userId);

    if (warningResult.reachedLimit) {
      await suspendUser(userId);

      return res.status(403).json({
        allowed: false,
        action: "suspended",
        severity: "repeated_harassment",
        message:
          "Too many warnings. Your account has been suspended temporarily.",
      });
    }

    return res.status(200).json({
      allowed: false,
      action: "warning",
      severity: "harassment",
      warningsUsed: warningResult.warningsUsed,
      warningsLeft: warningResult.warningsLeft,
      message: `Warning ${warningResult.warningsUsed}/${MAX_WARNINGS}: Please keep conversations respectful.`,
    });
  }

  await resetUser(userId);

  return res.status(200).json({
    allowed: true,
    action: "allowed",
  });
}

module.exports = { moderateContent };
