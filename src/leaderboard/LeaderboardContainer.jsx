import React, { useState } from 'react';
import FriendsLeaderboard from './FriendsLeaderboard';
import GlobalLeaderboard from './GlobalLeaderboard';
import './Leaderboard.css';

export default function LeaderboardContainer({ userElo, userName }) {
    const [selectedLeaderboard, setSelectedLeaderboard] = useState('global');

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-selector-container">
                <label htmlFor="leaderboard-select" className="selector-label">View Rankings:</label>
                <select
                    id="leaderboard-select"
                    className="leaderboard-select"
                    value={selectedLeaderboard}
                    onChange={(e) => setSelectedLeaderboard(e.target.value)}
                >
                    <option value="global">Global Leaderboard</option>
                    <option value="friends">Friends Leaderboard</option>
                </select>
            </div>

            <div className="leaderboard-content">
                {selectedLeaderboard === 'global' ? (
                    <GlobalLeaderboard userElo={userElo} userName={userName} />
                ) : (
                    <FriendsLeaderboard userElo={userElo} userName={userName} />
                )}
            </div>
        </div>
    );
}
