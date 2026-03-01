
// ─── Prompt template ────────────────────────────────────────────────────────
function buildPrompt(events, income, savingsGoal) {
    const eventsJSON = JSON.stringify(events, null, 2);

    return `You are a smart personal-finance assistant.

The user earns $${income} per month and wants to save $${savingsGoal} per month.
Below is a JSON array of their upcoming calendar events.

EVENTS:
${eventsJSON}

TASK:
For every event, predict a realistic dollar budget the user should allocate.
Consider the event title, location, and time of day. Social/dining events cost more
than work meetings. All-day events may be free or expensive depending on context.
The total of all budgets must leave room for the savings goal.

Return ONLY a valid JSON array, no markdown, no explanation. Each element must have:
{ "eventId": "...", "title": "...", "predictedBudget": <number>, "reasoning": "..." }`;
}

// ─── API call ───────────────────────────────────────────────────────────────
export async function predictBudgets(calendarEvents, income, savingsGoal) {
    // calendarEvents should already be .toPromptJSON() objects
    const prompt = buildPrompt(calendarEvents, income, savingsGoal);

    const res = await fetch('/api/predict-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: calendarEvents, income, savingsGoal, prompt }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.error || 'Budget prediction failed');
    }

    return data.budgets; // Array of { eventId, title, predictedBudget, reasoning }
}

