import { useState } from 'react'
import './App.css'
import RankDisplay from './rank/RankDisplay'
import LeaderboardContainer from './leaderboard/LeaderboardContainer'

function App() {
  const [elo, setElo] = useState(0);

  return (
    <div className="app-container">
      <div className="left-panel">
        <RankDisplay elo={elo} setElo={setElo} />
      </div>
      <div className="right-panel">
        <LeaderboardContainer userElo={elo} />
      </div>
    </div>
  )
}

export default App
