import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { supabase } from './utils/supabase'
import './App.css'
import Navbar from './components/Navbar'
import CalendarPage from './pages/CalendarPage'
import LeaderboardPage from './pages/LeaderboardPage'
import RankUpModal from './components/RankUpModal'
import { getRankFromElo, RANKS } from './utils/rankUtils'

function App() {
  const [accessToken, setAccessToken] = useState(null)
  const [userEmail, setUserEmail] = useState(null)
  const [userName, setUserName] = useState('Me')
  const [userElo, setUserElo] = useState(0)
  const [userRank, setUserRank] = useState('iron')
  const [previousRank, setPreviousRank] = useState('iron')
  const [showRankUp, setShowRankUp] = useState(false)
  const [userGoal, setUserGoal] = useState(null)
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
          .select('*, previous_rank')
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
            setPreviousRank(newUser.previous_rank || newUser.rank)
          }
        } else if (data) {
          // User exists, use their data
          setUserElo(data.elo)
          setUserRank(data.rank)
          setPreviousRank(data.previous_rank || data.rank)

          // Optionally update name if it changed
          if (data.name !== firstName) {
            await supabase.from('profiles').update({ name: firstName }).eq('email', email)
          }
        }

        // Fetch active goal from 'goals' table using google_id (sub)
        const { data: goalData, error: goalError } = await supabase
          .from('goals')
          .select('*')
          .eq('google_id', sub)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!goalError && goalData) {
          setUserGoal(goalData)
        }
      } catch (error) {
        console.error('Error syncing user info:', error)
      }
    }

    syncUserWithSupabase()
  }, [accessToken])

  // Detect Rank Up
  useEffect(() => {
    if (!userElo) return;

    const currentRankName = getRankFromElo(userElo);
    const currentIndex = RANKS.findIndex(r => r.toLowerCase() === currentRankName.toLowerCase());
    const previousIndex = RANKS.findIndex(r => r.toLowerCase() === previousRank.toLowerCase());

    // If current rank index is higher than previous index, it's a rank up!
    if (currentIndex > previousIndex) {
      setShowRankUp(true);
      setPreviousRank(currentRankName);

      // Update Supabase immediately on rank change
      if (userEmail) {
        supabase.from('profiles').update({
          rank: currentRankName,
          previous_rank: currentRankName
        }).eq('email', userEmail).then();
      }
    } else if (currentIndex < previousIndex) {
      // If rank decreased, just update the state and DB quietly without celebration
      setPreviousRank(currentRankName);
      if (userEmail) {
        supabase.from('profiles').update({
          rank: currentRankName,
          previous_rank: currentRankName
        }).eq('email', userEmail).then();
      }
    }

    setUserRank(currentRankName);
  }, [userElo, previousRank, userEmail]);

  // Sync previous_rank on app close
  useEffect(() => {
    const handleUnload = () => {
      if (userEmail && userRank) {
        // Use navigator.sendBeacon or a synchronous-like update if possible, 
        // but since we update on every rank change above, this is mostly for safety.
        supabase.from('profiles').update({ previous_rank: userRank }).eq('email', userEmail).then();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [userEmail, userRank]);

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
                userGoal={userGoal}
                setUserGoal={setUserGoal}
                userGoogleId={userGoogleId}
                userElo={userElo}
                setUserElo={updateElo}
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
        {showRankUp && (
          <RankUpModal
            rank={userRank}
            onClose={() => setShowRankUp(false)}
          />
        )}
      </div>
    </Router>
  )
}

export default App
