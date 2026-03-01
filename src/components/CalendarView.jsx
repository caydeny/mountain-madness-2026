import React, { useState } from 'react'
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

export default function CalendarView({ events }) {
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
                />
            </div>
        </>
    )
}
