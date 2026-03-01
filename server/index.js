import express from "express";
import cors from "cors";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// ─── Existing OpenRouter LLM endpoint ────────────────────────────────────────
app.post("/api/llm", async (req, res) => {
  try {
    const { prompt, model } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-OpenRouter-Title": "Mountain Madness"
      },
      body: JSON.stringify({
        model: model || "openrouter/free",
        messages: [
          { role: "system", content: "Be concise." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: data });
    }

    const text = data?.choices?.[0]?.message?.content || "";
    return res.json({ text });

  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

// ─── Budget prediction via Gemini ────────────────────────────────────────────
app.post("/api/predict-budget", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not set in .env" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Strip markdown fences if Gemini wraps the JSON
    const cleaned = rawText
      .replace(/```json\n?/gi, "")
      .replace(/```\n?/g, "")
      .trim();

    let budgets;
    try {
      budgets = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({
        error: "Gemini returned invalid JSON",
        raw: rawText,
      });
    }

    return res.json({ budgets });

  } catch (e) {
    console.error("predict-budget error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

// ─── RBC Advisor Chatbot via Gemini ──────────────────────────────────────────
app.post("/api/advisor", async (req, res) => {
  try {
    const { messages, contextData } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing or invalid messages array" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not set in .env" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Format context Data
    const stringifiedContext = JSON.stringify(contextData || {}, null, 2);

    const systemPrompt = `You are the "RBC Advisor", a highly helpful and concise financial saving assistant.
Below is the user's specific context containing their savings goals, ongoing streaks, and calendar events with budgets.

USER CONTEXT:
${stringifiedContext}

STRICT INSTRUCTIONS:
1. You may ONLY give saving tips based ON the user's provided calendar history, events, and saving patterns above.
2. You can look into future events listed and provide budgeting advice for them.
3. If the user asks about ANYTHING ELSE (e.g., cooking, coding, history, general queries not related to their budget or calendar), you MUST respond exactly with: "I don't have any info on that."
4. Be encouraging but firm on budget limits.`;

    // Convert existing messages to Gemini format
    // Exclude the very last message since that's what we generateContent on
    const history = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      {
        role: "model",
        parts: [{ text: "Understood. I am the RBC Advisor. I will only answer questions regarding the user's budget and calendar, and I will strictly reply 'I don't have any info on that.' to anything else." }]
      }
    ];

    // Map UI messages to Gemini roles (user -> user, ai -> model)
    const userMessages = messages.map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Start chat with history
    const allButLast = userMessages.slice(0, -1);
    const lastUserMessage = userMessages[userMessages.length - 1].parts[0].text;

    const chat = model.startChat({
      history: [...history, ...allButLast],
    });

    const result = await chat.sendMessage(lastUserMessage);
    const responseText = result.response.text();

    return res.json({ text: responseText });

  } catch (e) {
    console.error("advisor error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

app.listen(8787, () =>
  console.log("Backend running on http://localhost:8787")
);