
// ─── Prompt template ────────────────────────────────────────────────────────
function buildPrompt(events, currentDate, income, savingsGoal) {
    const eventsJSON = JSON.stringify(events, null, 2);

    return `You are a deterministic financial allocation engine.

The user earns $${income} per month and wants to save $${savingsGoal} per month. Their maximum spendable budget for the month is $${income - savingsGoal}.
The current date is ${currentDate} and only read events from today onwards till the end of the month.

Below is a JSON array of their upcoming calendar events.

EVENTS:
${eventsJSON}

TASK:
For every event, predict a realistic dollar budget the user should allocate based on their maximum spending capacity.
STRICT CONSTRAINTS:
1. The SUM of all predicted budgets MUST NOT exceed $${income-savingsGoal}.
2. If naive realistic estimates exceed the limit, proportionally scale them down.
3. Events like work meetings, study time, gym, home activities are low-cost unless context strongly implies spending.
4. Social, dining, entertainment, travel, or shopping events should cost more.
5. Budget values must be integers.
6. Do NOT invent new events.
7. Every input event must have exactly one output object.
8. Do not exceed the spending limit under any circumstances.

ALLOCATION LOGIC:
- First estimate a realistic cost for each event.
- Then adjust proportionally so total ≤ $${maxSpendable}.
- Prioritize savings stability over event luxury.
- Avoid extreme allocations unless clearly justified.

Return ONLY a valid JSON array, no markdown, no explanation. Each element must have:
{ "eventId": "...", "title": "...", "predictedBudget": <number>, "reasoning": "..." }`;
}

// ─── API call ───────────────────────────────────────────────────────────────
export async function predictBudgets(calendarEvents, currentDate, income, savingsGoal) {
    // calendarEvents should already be .toPromptJSON() objects
    const prompt = buildPrompt(calendarEvents, currentDate, income, savingsGoal);

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

