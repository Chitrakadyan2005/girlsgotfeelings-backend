const hardAbusePatterns = [
  "go kill yourself",
  "i will kill you",
  "you should die",
  "rape",
  "terrorist",
  "kill you",
  "die bitch",
];

const softAbuseWords = [
  "ugly",
  "loser",
  "asshole",
  "bitch",
  "shit",
  "slut",
  "whore",
  "kutti",
  "kamini",
  "harami",
  "chutiya",
  "madarchod",
  "bhenchod",
  "randi",
];

const positiveIndicators = [
  "smart",
  "pretty",
  "beautiful",
  "genius",
  "amazing",
  "😂",
  "😄",
  "❤️",
];

/**
 * Normalize text so users can't bypass filters
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s😂😄❤️]/g, " ") // keep emojis
    .replace(/\s+/g, " ")
    .trim();
}

function containsPositiveContext(text) {
  return positiveIndicators.some(word => text.includes(word));
}

function wordMatch(text, word) {
  const regex = new RegExp(`\\b${word}\\b`, "i");
  return regex.test(text);
}

function moderateText(text) {
  if (!text || typeof text !== "string") {
    return { allowed: true, reason: "empty", severity: 0 };
  }

  const cleanText = normalizeText(text);

  for (let phrase of hardAbusePatterns) {
    if (cleanText.includes(phrase)) {
      return {
        allowed: false,
        reason: "severe_abuse",
        severity: 2,
      };
    }
  }

  for (let word of softAbuseWords) {
    if (wordMatch(cleanText, word)) {
      if (containsPositiveContext(cleanText)) {
        return {
          allowed: true,
          reason: "positive_context_override",
          severity: 0,
        };
      }

      return {
        allowed: false,
        reason: "harassment",
        severity: 1,
      };
    }
  }

  return {
    allowed: true,
    reason: "clean",
    severity: 0,
  };
}

module.exports = { moderateText };