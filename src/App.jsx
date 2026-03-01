import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { supabase } from './utils/supabase'
import './App.css'
import Navbar from './components/Navbar'
import CalendarPage from './pages/CalendarPage'
import LeaderboardPage from './pages/LeaderboardPage'

function App() {
  const [accessToken, setAccessToken] = useState(null)
  const [userEmail, setUserEmail] = useState(null)
  const [userName, setUserName] = useState('Me')
  const [userElo, setUserElo] = useState(0)
  const [userRank, setUserRank] = useState('iron')
  const [userGoogleId, setUserGoogleId] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!accessToken) return

    const syncUserWithSupabase = async () => {
      try {
        // 1. Get user info from Google
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        const googleUser = await response.json()

        const firstName = googleUser.given_name || (googleUser.name ? googleUser.name.split(' ')[0] : 'Me')
        const email = googleUser.email
        const sub = googleUser.sub // Unique Google ID

        setUserName(firstName)
        setUserEmail(email)
        setUserGoogleId(sub)

        // Sync with Supabase profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single()

        if (error && error.code === 'PGRST116') {
          // User doesn't exist, create them
          const { data: newUser, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                email: email,
                name: firstName,
                elo: 0,
                rank: 'iron',
                google_id: sub
              }
            ])
            .select()
            .single()

          if (!createError && newUser) {
            setUserElo(newUser.elo)
            setUserRank(newUser.rank)
          }
        } else if (data) {
          // User exists, use their data
          setUserElo(data.elo)
          setUserRank(data.rank)

          // Optionally update name if it changed
          if (data.name !== firstName) {
            await supabase.from('profiles').update({ name: firstName }).eq('email', email)
          }
        }
      } catch (error) {
        console.error('Error syncing user info:', error)
      }
    }

    syncUserWithSupabase()
  }, [accessToken])

  const updateElo = async (newElo) => {
    setUserElo(newElo)
    if (!accessToken || !userEmail) return

    try {
      await supabase
        .from('profiles')
        .update({ elo: newElo })
        .eq('email', userEmail)
    } catch (error) {
      console.error('Error updating Elo in Supabase:', error)
    }
  }

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
                userGoogleId={userGoogleId}
              />
            }
          />
          <Route
            path="/leaderboard"
            element={
              <LeaderboardPage
                userName={userName}
                userEmail={userEmail}
                userElo={userElo}
                setUserElo={updateElo}
                userRank={userRank}
              />
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
