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

app.listen(8787, () =>
  console.log("Backend running on http://localhost:8787")
);