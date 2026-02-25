const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function getAIReply(systemPrompt, history, userMessage) {
  
  const safeHistory = (history || []).filter(
    (m) =>
      m &&
      typeof m === "object" &&
      typeof m.role === "string" &&
      typeof m.content === "string"
  );

  const messages = [
    { role: "system", content: systemPrompt },
    ...safeHistory,
    { role: "user", content: userMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages,
    temperature: 0.7,
    max_tokens: 90,
  });

  return completion.choices[0].message.content;
}

module.exports = { getAIReply };