export async function askAdvisor(chatHistory, userContext) {
    const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messages: chatHistory,
            contextData: userContext
        }),
    });

    if (!res.ok) {
        let errMessage = 'Unknown error';
        try {
            const errData = await res.json();
            errMessage = errData.error || errMessage;
        } catch { }
        throw new Error(`Advisor API error: ${errMessage}`);
    }

    const data = await res.json();
    return data.text;
}
