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

// Replace with real data later, e.g:
//   getDayTotal={(date) => apiData[format(date, 'yyyy-MM-dd')]?.total ?? 0}
const DEFAULT_DAY_TOTALS = {
    // 'yyyy-MM-dd': dollar_amount
}

function defaultGetDayTotal(date) {
    const key = format(date, 'yyyy-MM-dd')
    return DEFAULT_DAY_TOTALS[key] ?? 0
}
// ─────────────────────────────────────────────────────────────────────────────

export default function CalendarView({ events, getDayTotal = defaultGetDayTotal }) {
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

        return {
            week: { header: DayTotalHeader, event: EventComponent },
            day: { header: DayTotalHeader, event: EventComponent },
            month: { event: EventComponent },
        }
    }, [getDayTotal])

    return (
        <>
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