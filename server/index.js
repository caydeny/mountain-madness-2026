import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

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

app.listen(8787, () =>
  console.log("Backend running on http://localhost:8787")
);