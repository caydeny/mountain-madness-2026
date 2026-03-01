import { useState, useEffect } from 'react'
import CalendarView from '../components/CalendarView'

export default function CalendarPage({ accessToken, setAccessToken, events, setEvents, loading, setLoading, userName }) {
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
                    const formatedEvents = data.items.map((item) => {
                        const start = item.start.dateTime || item.start.date
                        const end = item.end.dateTime || item.end.date
                        return {
                            title: item.summary,
                            start: new Date(start),
                            end: new Date(end),
                            allDay: !item.start.dateTime, // If it only has `date`, it's allDay
                        }
                    })
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

    return (
        <main className="main-content">
            <header className="page-header">
                <h1>{userName && userName !== 'Me' ? `${userName}'s Calendar` : 'Your Calendar'}</h1>
                <p>View your schedule clearly and efficiently.</p>
            </header>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Syncing calendar events...</p>
                </div>
            ) : (
                <CalendarView events={events} />
            )}
        </main>
    )
}
