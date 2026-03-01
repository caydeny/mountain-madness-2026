import { useState } from 'react'
import RankDisplay from '../rank/RankDisplay'
import LeaderboardContainer from '../leaderboard/LeaderboardContainer'
import { RANKS } from '../utils/rankUtils'

export default function LeaderboardPage({ userName, userEmail, userElo, setUserElo, userRank }) {
    const [showInfoModal, setShowInfoModal] = useState(false);

    if (!userEmail) {
        return (
            <div className="rankings-page-wrapper">
                <h1 className="rankings-page-title">Rankings</h1>
                <div className="login-prompt-container">
                    <div className="login-prompt-card">
                        <span className="prompt-icon">🔒</span>
                        <h2>Rankings are available to members</h2>
                        <p>Please connect your account to view your ranking and the leaderboards.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="rankings-page-wrapper">
            <div className="rankings-header">
                <h1 className="rankings-page-title">Rankings</h1>
                <button className="info-icon-btn" onClick={() => setShowInfoModal(true)} title="More Info">
                    i
                </button>
            </div>

            <div className="rankings-grid">
                <div className="rankings-left-panel">
                    <RankDisplay elo={userElo} setElo={setUserElo} />
                </div>
                <div className="rankings-right-panel">
                    <LeaderboardContainer userElo={userElo} userName={userName} userEmail={userEmail} />
                </div>
            </div>

            {/* Ranked Info Modal */}
            {showInfoModal && (
                <div className="create-modal-overlay" onClick={() => setShowInfoModal(false)}>
                    <div className="create-modal-content info-modal-custom" onClick={e => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setShowInfoModal(false)}>×</button>
                        <h2 className="modal-title">Ranked</h2>

                        <div className="info-modal-body">
                            <div className="info-ranks-list">
                                {[...RANKS].reverse().map(r => (
                                    <div key={r} className={`info-rank-item rank-${r.toLowerCase()}`}>
                                        {r}
                                    </div>
                                ))}
                            </div>
                            <div className="info-description">
                                <p>Welcome to Ranked: Save money daily to increase your elo points and climb the ranks. Compete in leaderboards both globally and with your friends, unlock new achievements and grind to Crystal Cashlord! Go Saver!</p>
                            </div>
                        </div>

                        <button className="create-leaderboard-btn info-ok-btn" onClick={() => setShowInfoModal(false)}>Ok</button>
                    </div>
                </div>
            )}
        </div>
    )
}
