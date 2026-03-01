import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { askAdvisor } from '../services/advisorService';
import './ChatPage.css';

export default function ChatPage({ userGoogleId, userGoal, userName }) {
    const [messages, setMessages] = useState([
        {
            sender: 'advisor',
            text: `Hi ${userName || 'there'}! I am the RBC Advisor. I can analyze your calendar, budgets, and streaks to help you save money. What would you like to know?`
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [contextData, setContextData] = useState(null);
    const messagesEndRef = useRef(null);

    // Fetch context on load
    useEffect(() => {
        if (!userGoogleId) return;

        const loadContext = async () => {
            try {
                // Fetch events
                const { data: eventsData, error: eventsError } = await supabase
                    .from('events')
                    .select('title, predicted_budget, reasoning')
                    .eq('google_id', userGoogleId);

                if (eventsError) throw eventsError;

                // Fetch streaks
                const { data: streaksData, error: streaksError } = await supabase
                    .from('streaks')
                    .select('event_date, streak_number')
                    .eq('google_id', userGoogleId)
                    .order('event_date', { ascending: false });

                if (streaksError) throw streaksError;

                let currentStreak = 0;
                if (streaksData && streaksData.length > 0) {
                    currentStreak = streaksData[0].streak_number;
                }

                setContextData({
                    goal: userGoal || { name: "None", total_cost: 0 },
                    currentStreak: currentStreak,
                    events: eventsData || []
                });

            } catch (err) {
                console.error("Error loading advisor context:", err);
            }
        };

        loadContext();
    }, [userGoogleId, userGoal]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || !contextData) return;

        const userMsg = input.trim();
        setInput('');

        const newHistory = [...messages, { sender: 'user', text: userMsg }];
        setMessages(newHistory);
        setLoading(true);

        try {
            const aiResponse = await askAdvisor(newHistory, contextData);
            setMessages([...newHistory, { sender: 'advisor', text: aiResponse }]);
        } catch (err) {
            console.error(err);
            setMessages([...newHistory, { sender: 'advisor', text: "Sorry, I ran into an error trying to process that." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="chat-content">
            <header className="page-header">
                <div>
                    <h1>RBC Advisor</h1>
                    <p>Your personal assistant for your budgeting calendar.</p>
                </div>
            </header>

            <div className="chat-container">
                <div className="messages-area">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message-bubble ${msg.sender}`}>
                            <div className="message-content">{msg.text}</div>
                        </div>
                    ))}
                    {loading && (
                        <div className="message-bubble advisor typing">
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-area" onSubmit={handleSend}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={!userGoogleId ? "Please connect your calendar first." : !contextData ? "Loading your data..." : "Ask me about your budget..."}
                        disabled={loading || !contextData}
                        className="chat-input"
                    />
                    <button type="submit" className="chat-send-btn" disabled={loading || !contextData || !input.trim()}>
                        Send
                    </button>
                </form>
            </div>
        </main>
    );
}
