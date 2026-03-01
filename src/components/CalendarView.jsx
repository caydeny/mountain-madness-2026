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

const STREAK_DATES = new Set([
    '2026-02-22',
    '2026-02-23',
    '2026-02-24',
    
])

const DEFAULT_DAY_TOTALS = {}

function defaultGetDayTotal(date) {
    const key = format(date, 'yyyy-MM-dd')
    return DEFAULT_DAY_TOTALS[key] ?? 0
}

export default function CalendarView({ 
    events, 
    getDayTotal = defaultGetDayTotal,
    goalName = "Monthly Savings Goal",
    currentAmount = 400,
    targetAmount = 1000
}) {
    const [prompt, setPrompt] = useState("");
    const [out, setOut] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [goal, setGoal] = useState(null);

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
            const total = getDayTotal(headerDate)
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
            </div>
        )

        const DateCellWrapper = ({ children, value }) => {
            const key = format(value, 'yyyy-MM-dd')
            const isStreak = STREAK_DATES.has(key)
            return (
                <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                    {children}
                    {isStreak && (
                        <div className="streak-flame-badge" title="🔥 Streak day!">
                            🔥
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
    }, [getDayTotal])

    return (
        <>
            <div style={{ padding: "0 2rem" }}>
                {goal && (
                    <GoalProgressBar
                        goalName={goal.name}
                        currentAmount={goal.currentAmount ?? 0}
                        targetAmount={goal.targetAmount}
                    />
                )}

                <GoalActions onGoalChange={setGoal} />
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