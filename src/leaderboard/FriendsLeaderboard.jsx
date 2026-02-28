import { useMemo } from 'react';
import { getRankFromElo } from '../utils/rankUtils';
import './Leaderboard.css';

const MOCK_FRIENDS = [
    { id: 'f1', name: 'John', elo: 450 },
    { id: 'f2', name: 'Andrew', elo: 820 },
    { id: 'f3', name: 'Nick', elo: 210 },
    { id: 'f4', name: 'Cayden', elo: 950 },
];

export default function FriendsLeaderboard({ userElo }) {
    const leaderboardData = useMemo(() => {
        // Add "Me" to the list
        const combined = [
            ...MOCK_FRIENDS,
            { id: 'me', name: 'Me', elo: userElo, isCurrentUser: true }
        ];

        // Sort descending by Elo
        return combined.sort((a, b) => b.elo - a.elo);
    }, [userElo]);

    return (
        <div className="leaderboard-panel friends-leaderboard">
            <h3 className="panel-title">Friends Leaderboard</h3>

            <div className="leaderboard-list">
                {leaderboardData.map((user, index) => {
                    const rankName = getRankFromElo(user.elo);
                    return (
                        <div
                            key={user.id}
                            className={`leaderboard-item ${user.isCurrentUser ? 'current-user-item' : ''}`}
                        >
                            <div className="item-left">
                                <span className="item-rank-num">#{index + 1}</span>
                                <span className="item-name">{user.name}</span>
                            </div>
                            <div className="item-right">
                                <span className="item-elo">{user.elo}</span>
                                <span className={`item-rank rank-${rankName.toLowerCase()}`}>
                                    {rankName}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
