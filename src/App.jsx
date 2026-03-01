import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import CalendarPage from './pages/CalendarPage'
import LeaderboardPage from './pages/LeaderboardPage'

function App() {
  const [accessToken, setAccessToken] = useState(null)
  const [userName, setUserName] = useState('Me')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!accessToken) return

    const fetchUserInfo = async () => {
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        const data = await response.json()
        if (data.given_name) {
          setUserName(data.given_name)
        } else if (data.name) {
          setUserName(data.name.split(' ')[0]) // Use first name if full name is provided
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
      }
    }

    fetchUserInfo()
  }, [accessToken])

  return (
    <Router>
      <div className="app-main-wrapper">
        <Navbar
          onLoginSuccess={setAccessToken}
          isLoggedIn={!!accessToken}
          userName={userName}
        />
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
                userName={userName}
              />
            }
          />
          <Route path="/leaderboard" element={<LeaderboardPage userName={userName} />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
