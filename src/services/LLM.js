export async function askLLM(prompt) {
  const res = await fetch("/api/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "LLM request failed");
  }

  return data.text;
}