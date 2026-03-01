import { useState, useEffect, useRef } from 'react'
import CalendarView from '../components/CalendarView'
import { parseRawEvents } from '../services/eventModel'
import { predictBudgets } from '../services/budgetService'
import { supabase } from '../utils/supabase'
import { format, addDays, endOfMonth } from 'date-fns'

// ─── Hardcoded values (swap with user input later) ──────────────────────────
const currentDate = new Date().toISOString().split('T')[0]; // e.g. "2026-02-28"
const MONTHLY_INCOME = 5000;
const MANDATORY_COSTS = 2000; // rent, bills, etc. that are not tied to specific events
const SAVINGS_GOAL = 30;
const FAKE_SPENDING = [35, 0, 20, 120, 18, 100, 0, 40];

export default function CalendarPage({ accessToken, setAccessToken, events, setEvents, loading, setLoading, userName, userGoal, setUserGoal, userGoogleId, userElo, setUserElo }) {
    const [budgetMap, setBudgetMap] = useState({});  // { eventId → { price, reasoning } }
    const [predicting, setPredicting] = useState(false);

    // Streak simulation state
    const [currentDate, setCurrentDate] = useState(new Date('2026-02-28T00:00:00'));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [streakMap, setStreakMap] = useState({}); // { '2026-02-28': 1, ... }

    // Load budgets from Supabase on mount
    useEffect(() => {
        if (!userGoogleId) return;
        const fetchBudgets = async () => {
            try {
                const { data, error } = await supabase
                    .from('events')
                    .select('event_id, predicted_budget, reasoning')
                    .eq('google_id', userGoogleId);

                if (error) throw error;
                if (data) {
                    const map = {};
                    data.forEach((b) => {
                        map[b.event_id] = {
                            price: b.predicted_budget,
                            reasoning: b.reasoning
                        };
                    });
                    setBudgetMap(map);
                }
            } catch (err) {
                console.error('Error fetching budgets from Supabase:', err);
            }
        };
        fetchBudgets();
    }, [userGoogleId]);

    // 1️⃣ Fetch events from Google Calendar
    useEffect(() => {
        if (!accessToken) return

        const fetchEvents = async () => {
            setLoading(true)
            try {
                const response = await fetch(
                    'https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&maxResults=250',
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                )
                const data = await response.json()

                if (data.items) {
                    // Convert raw items → CalendarEvent model
                    const calendarEvents = parseRawEvents(data.items);

                    const formatedEvents = calendarEvents.map((ce) => ({
                        id: ce.id,
                        title: ce.title,
                        start: new Date(ce.startTime),
                        end: new Date(ce.endTime),
                        allDay: ce.isAllDay,
                        price: 0, // will be filled after prediction
                        reasoning: "", // will be filled after prediction
                        _raw: ce, // keep the CalendarEvent for the prompt
                    }))
                    setEvents(formatedEvents)
                }
            } catch (error) {
                console.error('Error fetching calendar events:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchEvents()
    }, [accessToken, setEvents, setLoading])

    // 2️⃣ Manually trigger budget prediction
    const handlePredict = async () => {
        if (events.length === 0 || !userGoogleId) return;
        setPredicting(true);

        try {
            // Find events that are NOT in budgetMap
            const unpredictedEvents = events.filter(e => e._raw && budgetMap[e.id] === undefined);

            if (unpredictedEvents.length === 0) {
                console.log('All events already have predicted budgets.');
                setPredicting(false);
                return;
            }

            const now = new Date();
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            const thisMonthEvents = unpredictedEvents.filter((e) => {
                const start = new Date(e.start);
                return start >= now && start <= endOfMonth;
            });
            const promptEvents = thisMonthEvents.map((e) => e._raw.toPromptJSON());

            console.log('Sending events to Gemini for budget prediction…');
            const newBudgets = await predictBudgets(promptEvents, currentDate, (MONTHLY_INCOME - MANDATORY_COSTS) * (SAVINGS_GOAL / 100));
            console.log('Gemini predicted budgets:', newBudgets);

            // Save to Supabase
            const inserts = newBudgets.map(b => ({
                google_id: userGoogleId,
                name: userName,
                event_id: b.eventId,
                title: b.title,
                predicted_budget: b.predictedBudget,
                reasoning: b.reasoning,
            }));

            const { error: insertError } = await supabase.from('events').insert(inserts);
            if (insertError) {
                console.error('Error saving budgets to Supabase:', insertError);
                throw insertError;
            }

            // Build lookup map
            const map = { ...budgetMap };
            newBudgets.forEach((b) => {
                map[b.eventId] = {
                    price: b.predictedBudget,
                    reasoning: b.reasoning
                };
            });
            setBudgetMap(map);
        } catch (err) {
            console.error('Budget prediction failed:', err);
            alert('Failed to predict budgets.');
        } finally {
            setPredicting(false);
        }
    };

    // 3️⃣ Merge budget predictions into events
    const enrichedEvents = events.map((e) => ({
        ...e,
        price: budgetMap[e.id]?.price ?? e.price ?? 0,
        reasoning: budgetMap[e.id]?.reasoning ?? e.reasoning ?? "",
    }));



    // 4️⃣ Handle Next Day simulation
    const handleNextDay = () => {
        if (currentIndex >= FAKE_SPENDING.length) {
            alert("No more fake data left!");
            return;
        }

        const targetFormat = format(currentDate, 'yyyy-MM-dd');

        // Calculate total predicted spending for the current day
        const totalForDay = enrichedEvents.reduce((sum, e) => {
            if (e.start && format(e.start, 'yyyy-MM-dd') === targetFormat) {
                return sum + (Number(e.price) || 0);
            }
            return sum;
        }, 0);

        const spent = FAKE_SPENDING[currentIndex];

        // Evaluate streak
        let newStreak = currentStreak;
        let eloChange = 0;

        if (spent <= totalForDay) {
            newStreak += 1;
            setStreakMap(prev => ({
                ...prev,
                [targetFormat]: newStreak
            }));

            // Calculate positive Elo change
            if (totalForDay > 0) {
                eloChange = Math.round(((totalForDay - spent) / totalForDay) * 100);
            }
        } else {
            newStreak = 0;
            // Intentional: we don't clear the previous map entries, 
            // just don't add a streak entry for days where they overspend.

            // Calculate negative Elo change
            if (totalForDay > 0) {
                eloChange = -Math.round(((spent - totalForDay) / totalForDay) * 100);
            } else {
                // If totalForDay is 0 but they spent something, penalize heavily
                eloChange = -50;
            }
        }

        if (setUserElo && userElo !== undefined && eloChange !== 0) {
            const finalElo = Math.max(0, userElo + eloChange);
            setUserElo(finalElo);
        }

        setCurrentStreak(newStreak);
        setCurrentDate(prev => addDays(prev, 1));
        setCurrentIndex(prev => prev + 1);
    };

    return (
        <main className="main-content">
            <header className="page-header" style={{ position: 'relative' }}>
                <div>
                    <h1>{userName && userName !== 'Me' ? `${userName}'s Calendar` : 'Your Calendar'}</h1>
                    <p>View your schedule clearly and efficiently.</p>
                </div>
                {events.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        right: '0',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        gap: '10px'
                    }}>
                        <button
                            onClick={handleNextDay}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#4bc0c0',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Next Day ({format(currentDate, 'MMM d')})
                        </button>
                        <button
                            onClick={handlePredict}
                            disabled={predicting}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: predicting ? '#e5e7eb' : '#fedf01',
                                color: predicting ? '#9ca3af' : '#111827',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '700',
                                cursor: predicting ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {predicting ? "Predicting..." : "Predict Budgets"}
                        </button>
                    </div>
                )}
            </header>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Syncing calendar events...</p>
                </div>
            ) : (
                <CalendarView
                    events={enrichedEvents}
                    isLoggedIn={!!accessToken}
                    userGoal={userGoal}
                    setUserGoal={setUserGoal}
                    userGoogleId={userGoogleId}
                    streakMap={streakMap}
                    monthlyIncome={MONTHLY_INCOME}
                    monthlyMandatorySpending={MANDATORY_COSTS}
                    monthlySavingGoal={(MONTHLY_INCOME - MANDATORY_COSTS) * (SAVINGS_GOAL / 100)}
                />
            )}
        </main>
    )
}