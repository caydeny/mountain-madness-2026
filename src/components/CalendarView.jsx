import React, { useState, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import enUS from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './CalendarView.css'

import { askLLM } from "../services/LLM";
import GoalProgressBar from "./GoalProgressBar";
import GoalActions from "./GoalActions";

const locales = {
    'en-US': enUS,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

const STREAK_DATES = [
    '2026-02-22',
    '2026-02-23',
    '2026-02-24',
]

const STREAK_MAP = STREAK_DATES.reduce((acc, date, index) => {
    acc[date] = index + 1
    return acc
}, {})



export default function CalendarView({
    events,
    isLoggedIn = false,
    userGoal,
    setUserGoal,
    userGoogleId
}) {
    const [prompt, setPrompt] = useState("");
    const [out, setOut] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const run = async () => {
        setLoading(true);
        setErr("");
        setOut("");
        try {
            const result = await askLLM(prompt);
            setOut(result);
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    };

    const [view, setView] = useState(Views.MONTH)
    const [date, setDate] = useState(new Date())

    const components = useMemo(() => {
        const DayTotalHeader = ({ date: headerDate }) => {
            const dayNum = format(headerDate, 'd')
            const dayName = format(headerDate, 'EEE')
            const targetFormat = format(headerDate, 'yyyy-MM-dd')

            const total = events.reduce((sum, e) => {
                if (e.start && format(e.start, 'yyyy-MM-dd') === targetFormat) {
                    return sum + (Number(e.price) || 0)
                }
                return sum
            }, 0)

            return (
                <div className="rbc-week-header">
                    <div className="rbc-week-header-date">
                        <span className="rbc-week-header-daynum">{dayNum}</span>
                        <span className="rbc-week-header-dayname">{dayName}</span>
                    </div>
                    <div className="rbc-week-header-total">
                        Total: ${total.toLocaleString()}
                    </div>
                </div>
            )
        }

        const EventComponent = ({ event }) => (
            <div className="rbc-custom-event">
                <span className="rbc-custom-event-title">{event.title}</span>
                <span className="rbc-event-price-badge">
                    ${event.price != null ? Number(event.price).toLocaleString() : '0'}
                </span>
                {event.reasoning && (
                    <div className="rbc-event-tooltip">
                        {event.reasoning}
                    </div>
                )}
            </div>
        )

        const DateCellWrapper = ({ children, value }) => {
            const key = format(value, 'yyyy-MM-dd')
            const streakCount = STREAK_MAP[key]
            return (
                <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                    {children}
                    {isLoggedIn && streakCount != null && (
                        <div className="streak-badge" title={`🔥 ${streakCount} day streak!`}>
                            🔥 {streakCount}
                        </div>
                    )}
                </div>
            )
        }

        return {
            week: { header: DayTotalHeader, event: EventComponent },
            day: { header: DayTotalHeader, event: EventComponent },
            month: { event: EventComponent, dateCellWrapper: DateCellWrapper },
        }
    }, [events, isLoggedIn])

    return (
        <>
            <div style={{ padding: "0 2rem" }}>
                {userGoal && userGoal.status === true && (
                    <GoalProgressBar
                        goalName={userGoal.name}
                        currentAmount={userGoal.value ?? 0}
                        targetAmount={userGoal.total_cost}
                    />
                )}

                <GoalActions
                    onGoalChange={setUserGoal}
                    goal={userGoal}
                    userGoogleId={userGoogleId}
                />
            </div>

            <div className="calendar-container">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 'calc(100vh - 120px)' }}
                    className="premium-calendar"
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                    components={components}
                />
            </div>
        </>
    )
}