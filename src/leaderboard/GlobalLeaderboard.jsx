import { useMemo, useState, useEffect } from 'react';
import { getRankFromElo } from '../utils/rankUtils';
import './Leaderboard.css';

// Pre-generate some random global users so they don't change on every render
const generateRandomGlobalUsers = () => {
    const users = [
        { id: 'g1', name: 'Faker' },
        { id: 'g2', name: 'Chovy' },
        { id: 'g3', name: 'ShowMaker' },
        { id: 'g4', name: 'Rookie' },
        { id: 'g5', name: 'Doinb' },
    ];

    return users.map(u => ({
        ...u,
        elo: Math.floor(Math.random() * 1000) // Random Elo from 0 to 999
    }));
};

export default function GlobalLeaderboard({ userElo, userName = 'Me' }) {
    const [globalUsers, setGlobalUsers] = useState([]);

    useEffect(() => {
        setGlobalUsers(generateRandomGlobalUsers());
    }, []);

    const leaderboardData = useMemo(() => {
        // Add current user to the list
        const combined = [
            ...globalUsers,
            { id: 'me', name: userName, elo: userElo, isCurrentUser: true }
        ];

        // Sort descending by Elo
        return combined.sort((a, b) => b.elo - a.elo);
    }, [userElo, globalUsers, userName]);

    return (
        <div className="leaderboard-panel global-leaderboard">
            <h3 className="panel-title">Global Leaderboard</h3>

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
