import { useState } from 'react'
import RankDisplay from '../rank/RankDisplay'
import LeaderboardContainer from '../leaderboard/LeaderboardContainer'

export default function LeaderboardPage({ userName, userEmail, userElo, setUserElo, userRank }) {
    return (
        <div className="rankings-page-wrapper">
            <h1 className="rankings-page-title">Rankings</h1>
            <div className="rankings-grid">
                <div className="rankings-left-panel">
                    <RankDisplay elo={userElo} setElo={setUserElo} />
                </div>
                <div className="rankings-right-panel">
                    <LeaderboardContainer userElo={userElo} userName={userName} userEmail={userEmail} />
                </div>
            </div>
        </div>
    )
}
