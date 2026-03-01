
// ─── Prompt template ────────────────────────────────────────────────────────
function buildPrompt(events, currentDate, maxSpendable) {
    const eventsJSON = JSON.stringify(events, null, 2);

    return `You are a deterministic financial allocation engine. Follow the algorithm exactly.

INPUTS:
Max spendable: $${maxSpendable}
Current date: ${currentDate}
Only consider events from today through end of month.
Events JSON:
${eventsJSON}

GOAL:
Return a realistic integer budget for each event WITHOUT exceeding the spendable limit.

STRICT CONSTRAINTS:
1. The SUM of all predicted budgets MUST NOT exceed $${maxSpendable}.
2. If naive realistic estimates exceed the limit, proportionally scale them down.
3. Events like work meetings, study time, gym, home activities are low-cost unless context strongly implies spending.
4. Social, dining, entertainment, travel, or shopping events should cost more.
5. Assume there is daily spending for essentials (food, transport) that is not tied to specific events and should be accounted for in the overall budget.
6. Costs should reflect typical Canada spending patterns unless event details suggest otherwise (e.g. a "Birthday Dinner" likely costs more than a "Team Meeting").
7. Budget values must be integers.
8. Do NOT invent new events.
9. Every input event must have exactly one output object.
10. Do not exceed the spending limit under any circumstances.

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

