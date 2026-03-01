import { useState } from 'react'
import './App.css'
import RankDisplay from './rank/RankDisplay'
import LeaderboardContainer from './leaderboard/LeaderboardContainer'
import Navbar from './components/Navbar'

function App() {
  const [elo, setElo] = useState(0);

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <h1 className="page-title">Rankings</h1>
        <div className="app-container">
          <div className="left-panel">
            <RankDisplay elo={elo} setElo={setElo} />
          </div>
          <div className="right-panel">
            <LeaderboardContainer userElo={elo} />
          </div>
        </div>
      </div>
    </>
  )
}

export default App
