import React, { useState } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import enUS from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './CalendarView.css'

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
    const [view, setView] = useState(Views.MONTH)
    const [date, setDate] = useState(new Date())

    return (
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
    )
}
