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
const FAKE_SPENDING = [35, 0, 20, 120, 35, 200, 0, 40, 0, 50, 65, 75, 150, 75, 88, 98, 35, 45, 60, 0, 0, 0, 52, 34, 68, 56, 67, 12, 3, 40, 5];

export default function CalendarPage({
    accessToken, setAccessToken, events, setEvents, loading, setLoading,
    userName, userGoal, setUserGoal, userGoogleId, userElo, setUserElo,
    currentDate, setCurrentDate, currentIndex, setCurrentIndex, currentStreak, setCurrentStreak, streakMap, setStreakMap
}) {
    const [budgetMap, setBudgetMap] = useState({});  // { eventId → { price, reasoning } }
    const [predicting, setPredicting] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Load budgets and streaks from Supabase on mount
    useEffect(() => {
        if (!userGoogleId) return;
        const fetchData = async () => {
            try {
                // Fetch budgets
                const { data: budgetData, error: budgetError } = await supabase
                    .from('events')
                    .select('event_id, predicted_budget, reasoning')
                    .eq('google_id', userGoogleId);

                if (budgetError) throw budgetError;
                if (budgetData) {
                    const map = {};
                    budgetData.forEach((b) => {
                        map[b.event_id] = {
                            price: b.predicted_budget,
                            reasoning: b.reasoning
                        };
                    });
                    setBudgetMap(map);
                }

                // Fetch streaks
                const { data: streakData, error: streakError } = await supabase
                    .from('streaks')
                    .select('event_date, streak_number')
                    .eq('google_id', userGoogleId);

                if (streakError) throw streakError;
                if (streakData && streakData.length > 0) {
                    const sMap = {};
                    let maxStreak = 0;
                    streakData.forEach((s) => {
                        sMap[s.event_date] = s.streak_number;
                        // Naive way to resume the current streak based on the highest loaded number,
                        // assuming streaks are continuous.
                        if (s.streak_number > maxStreak) {
                            maxStreak = s.streak_number;
                        }
                    });
                    setStreakMap(sMap);
                    // For simulation purposes, we might want to manually sync currentStreak, 
                    // though simulation uses currentIndex and FAKE_SPENDING linearly. 
                    setCurrentStreak(maxStreak);
                }

            } catch (err) {
                console.error('Error fetching data from Supabase:', err);
            }
        };
        fetchData();
    }, [userGoogleId]);

    // 1️⃣ Fetch events from Google Calendar
    useEffect(() => {
        if (!accessToken) return

        const fetchEvents = async () => {
            setLoading(true)
            try {
                // 1. Fetch user's calendar list
                const listResp = await fetch(
                    'https://www.googleapis.com/calendar/v3/users/me/calendarList',
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                const listData = await listResp.json();

                if (!listData.items) {
                    setLoading(false);
                    return;
                }

                // 2. Fetch events from all calendars
                const allFetchedEvents = [];
                const promises = listData.items.map(async (cal) => {
                    try {
                        const evResp = await fetch(
                            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?orderBy=startTime&singleEvents=true&maxResults=250`,
                            { headers: { Authorization: `Bearer ${accessToken}` } }
                        );
                        if (!evResp.ok) return; // Skip failed calendars gracefully

                        const evData = await evResp.json();
                        if (evData.items) {
                            const calendarEvents = parseRawEvents(evData.items);
                            const formatted = calendarEvents.map((ce) => ({
                                id: ce.id,
                                title: ce.title,
                                start: new Date(ce.startTime),
                                end: new Date(ce.endTime),
                                allDay: ce.isAllDay,
                                price: 0,
                                reasoning: "",
                                color: cal.backgroundColor, // Inject the calendar's color
                                _raw: ce,
                            }));
                            allFetchedEvents.push(...formatted);
                        }
                    } catch (err) {
                        console.error(`Error fetching calendar ${cal.id}:`, err);
                    }
                });

                await Promise.all(promises);
                setEvents(allFetchedEvents);

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

    // 2.5️⃣ Handle Calendar Sync (add/remove)
    const handleSync = async () => {
        if (!accessToken || !userGoogleId || events.length === 0) return;
        setSyncing(true);

        try {
            // Re-fetch latest events from all Google Calendars
            const listResp = await fetch(
                'https://www.googleapis.com/calendar/v3/users/me/calendarList',
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const listData = await listResp.json();

            if (!listData.items) {
                setSyncing(false);
                return;
            }

            const allFetchedLiveEvents = [];
            const promises = listData.items.map(async (cal) => {
                try {
                    const evResp = await fetch(
                        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?orderBy=startTime&singleEvents=true&maxResults=250`,
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    );
                    if (!evResp.ok) return;

                    const evData = await evResp.json();
                    if (evData.items) {
                        const calendarEvents = parseRawEvents(evData.items);
                        const formatted = calendarEvents.map((ce) => ({
                            id: ce.id,
                            title: ce.title,
                            start: new Date(ce.startTime),
                            end: new Date(ce.endTime),
                            allDay: ce.isAllDay,
                            price: 0,
                            reasoning: "",
                            color: cal.backgroundColor,
                            _raw: ce,
                        }));
                        allFetchedLiveEvents.push(...formatted);
                    }
                } catch (err) {
                    console.error(`Error fetching calendar ${cal.id}:`, err);
                }
            });

            await Promise.all(promises);
            setEvents(allFetchedLiveEvents); // Update UI

            // 1. Detect Deleted Events: items in budgetMap NOT in live Calendar Events
            const liveEventIds = new Set(allFetchedLiveEvents.map(e => e.id));
            const deletedEventIds = Object.keys(budgetMap).filter(id => !liveEventIds.has(id));

            if (deletedEventIds.length > 0) {
                console.log('Sending delete to Supabase for:', deletedEventIds);
                const { error: deleteError } = await supabase
                    .from('events')
                    .delete()
                    .in('event_id', deletedEventIds);

                if (deleteError) {
                    console.error("Error deleting old events:", deleteError);
                } else {
                    const newMap = { ...budgetMap };
                    deletedEventIds.forEach(id => delete newMap[id]);
                    setBudgetMap(newMap);
                }
            }

            // 2. Detect New Future Events: items in live Calendar NOT in budgetMap
            const now = new Date();
            const newEvents = allFetchedLiveEvents.filter(
                (e) => e._raw && e.start >= now && budgetMap[e.id] === undefined
            );

            if (newEvents.length > 0) {
                console.log('Sending new events to Gemini for budget prediction…', newEvents);
                const promptEvents = newEvents.map((e) => e._raw.toPromptJSON());

                // Keep UI predictable by reusing logic in Predict
                const newBudgets = await predictBudgets(promptEvents, currentDate, MONTHLY_INCOME, SAVINGS_GOAL);

                const inserts = newBudgets.map(b => ({
                    google_id: userGoogleId,
                    name: userName,
                    event_id: b.eventId,
                    title: b.title,
                    predicted_budget: b.predictedBudget,
                    reasoning: b.reasoning
                }));

                const { error: insertError } = await supabase.from('events').insert(inserts);
                if (insertError) {
                    console.error('Error saving new sync budgets to Supabase:', insertError);
                } else {
                    const map = { ...budgetMap };
                    // Because step 1 might have altered the map, we operate on the freshest version via functional state updating
                    setBudgetMap(prev => {
                        const nextMap = { ...prev };
                        newBudgets.forEach((b) => {
                            nextMap[b.eventId] = {
                                price: b.predictedBudget,
                                reasoning: b.reasoning
                            };
                        });
                        return nextMap;
                    });
                }
            } else if (deletedEventIds.length === 0) {
                console.log("Sync complete. Calendar was already up-to-date.");
            }

        } catch (error) {
            console.error('Error syncing calendar:', error);
            alert('Failed to sync calendar fully.');
        } finally {
            setSyncing(false);
        }
    };

    // 3️⃣ Merge budget predictions into events
    const enrichedEvents = events.map((e) => ({
        ...e,
        price: budgetMap[e.id]?.price ?? e.price ?? 0,
        reasoning: budgetMap[e.id]?.reasoning ?? e.reasoning ?? "",
    }));



    // 4️⃣ Handle Next Day simulation
    const handleNextDay = async () => {
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

            // Sync successfully maintained streak to Supabase
            if (userGoogleId) {
                supabase.from('streaks').insert([{
                    google_id: userGoogleId,
                    event_date: targetFormat,
                    streak_number: newStreak
                }]).then(({ error }) => {
                    if (error) console.error("Error saving streak to DB:", error);
                });
            }

            // Calculate positive Elo change
            if (spent === 0) {
                if (totalForDay === 0) {
                    eloChange = 15;
                } else {
                    eloChange = 25;
                }
            } else if (totalForDay > 0) {
                eloChange = Math.round(((totalForDay - spent) / totalForDay) * 100);
            }
        } else {
            newStreak = 0;
            // Record failure locally
            setStreakMap(prev => ({
                ...prev,
                [targetFormat]: newStreak // 0 represents a broken streak
            }));

            // Save broken streak to Supabase
            if (userGoogleId) {
                supabase.from('streaks').insert([{
                    google_id: userGoogleId,
                    event_date: targetFormat,
                    streak_number: newStreak
                }]).then(({ error }) => {
                    if (error) console.error("Error saving failure streak to DB:", error);
                });
            }

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
                            onClick={handleSync}
                            disabled={syncing || predicting}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: (syncing || predicting) ? '#e5e7eb' : '#3b82f6',
                                color: (syncing || predicting) ? '#9ca3af' : 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '700',
                                cursor: (syncing || predicting) ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {syncing ? "Syncing..." : "Sync Calendar"}
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