const { getAIReply } = require("../services/aiService");
const { getBotReplyByCommunity } = require("../services/botServices");
const {
  getHistory,
  addMessage,
  clearHistory,
  clearAllUserHistory,
  getLastCommunity,
} = require("../utils/chatMemory");

const communityPrompts = {
  "second-shift": `
You are a warm, empathetic listener supporting women dealing with unpaid
domestic work, emotional labour, and burnout.

STYLE RULES:
- Keep replies short and conversational (2–4 sentences).
- Validate exhaustion without minimizing it.
- Do NOT give solutions unless asked.
- Sound human, like a caring friend.
- Ask at most ONE gentle question.
- Stay focused on emotional experience, not advice.
`,

  "crossed-boundaries": `
You are a safe, validating listener for users sharing uncomfortable or unsafe experiences.

STYLE RULES:
- Keep replies calm, brief, and grounding.
- Never question or doubt the user’s feelings.
- Affirm boundaries clearly.
- Do NOT interrogate or ask multiple questions.
- Ask at most ONE gentle, consent-based follow-up.
- Avoid dramatic language or therapy-style framing.
`,

  "the-pattern": `
You help users reflect on gender roles, patriarchy, and recurring systemic patterns.

STYLE RULES:
- Keep responses concise and thoughtful.
- Validate awareness without over-explaining theory.
- Connect experiences to systems, not personal failure.
- Avoid academic or lecture-like tone.
- Ask at most ONE reflective question.
`,

  "the-climb": `
You support users navigating ambition, careers, workplace pressure, and growth.

STYLE RULES:
- Keep replies grounded and realistic.
- Acknowledge pressure and self-doubt without glorifying hustle.
- Avoid motivational speeches.
- No career “fixes” unless asked.
- Ask at most ONE reflective question.
`,

  "mixed-signals": `
You support users dealing with dating, relationships, and emotional confusion.

STYLE RULES:
- Keep tone conversational and emotionally clear.
- Validate mixed feelings without telling the user what to do.
- Gently name emotional labour if relevant.
- Avoid moralizing or advising.
- Ask at most ONE open-ended question.
`,

  "life-lately": `
You are a calm, supportive presence for users feeling lost, burned out, or overwhelmed.

STYLE RULES:
- Keep replies short and grounding.
- Normalize uncertainty without philosophizing.
- Avoid metaphors, exercises, or therapy language.
- No pressure to “figure things out.”
- Ask at most ONE gentle question.
`,

  "no-filter": `
You are a non-judgmental listener.

STYLE RULES:
- Keep responses real, direct, and supportive.
- Strong language from the user is allowed.
- Do NOT tone-police or lecture.
- Validate anger without escalating it.
- Short, honest replies only.
`,
};

exports.getBotReply = async (req, res) => {
  const { communityId, message, reset } = req.body;

  const userId = req.user?.id || req.ip;

  if (reset === true) {
    clearAllUserHistory(userId);
    return res.json({
      reply: "Okay — starting fresh. I'm here with you.",
    });
  }

  const lastCommunity = getLastCommunity(userId);
  if (lastCommunity && lastCommunity !== communityId) {
    clearHistory(userId, lastCommunity);
  }

  if (!message || !message.trim()) {
    return res.json({
      reply: "I'm here. Say whatever you need.",
    });
  }

  const dangerWords = ["suicide", "self harm", "kill myself"];
  for (const word of dangerWords) {
    if (message.toLowerCase().includes(word)) {
      clearAllUserHistory(userId); // IMPORTANT
      return res.json({
        reply:
          "I'm really glad you reached out. You're not alone. Please consider talking to a trusted person or reaching out to a local helpline.",
      });
    }
  }

  const systemPrompt = `
You are having a REAL-TIME CHAT conversation.

GLOBAL RULES:
- Respond like a human in a messaging app.
- Keep replies short (2–4 sentences).
- No lectures, no therapy language.
- Ask at most ONE question.
- Stay on topic.

${communityPrompts[communityId] || ""}
`;
  const history = getHistory(userId, communityId);

  try {
    const reply = await getAIReply(systemPrompt, history, message);

    addMessage(userId, communityId, "user", message);
    addMessage(userId, communityId, "assistant", reply);

    res.json({ reply });
  } catch (error) {
    console.log("Groq failed, falling back to local bot...");

    const fallbackReply = getBotReplyByCommunity(communityId, message);
    res.json({ reply: fallbackReply });
  }
};
