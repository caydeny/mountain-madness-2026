import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import CalendarPage from './pages/CalendarPage'
import LeaderboardPage from './pages/LeaderboardPage'

function App() {
  const [accessToken, setAccessToken] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  return (
    <Router>
      <div className="app-main-wrapper">
        <Navbar onLoginSuccess={setAccessToken} isLoggedIn={!!accessToken} />
        <Routes>
          <Route
            path="/"
            element={
              <CalendarPage
                accessToken={accessToken}
                setAccessToken={setAccessToken}
                events={events}
                setEvents={setEvents}
                loading={loading}
                setLoading={setLoading}
              />
            }
          />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
