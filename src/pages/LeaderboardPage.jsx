import { useState } from 'react'
import RankDisplay from '../rank/RankDisplay'
import LeaderboardContainer from '../leaderboard/LeaderboardContainer'

export default function LeaderboardPage() {
    const [elo, setElo] = useState(0)

    return (
        <div className="rankings-page-wrapper">
            <h1 className="rankings-page-title">Rankings</h1>
            <div className="rankings-grid">
                <div className="rankings-left-panel">
                    <RankDisplay elo={elo} setElo={setElo} />
                </div>
                <div className="rankings-right-panel">
                    <LeaderboardContainer userElo={elo} />
                </div>
            </div>
        </div>
    )
}
