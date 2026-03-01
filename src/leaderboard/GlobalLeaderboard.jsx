import { useMemo, useState, useEffect } from 'react';
import { getRankFromElo } from '../utils/rankUtils';
import './Leaderboard.css';

import { supabase } from '../utils/supabase';

export default function GlobalLeaderboard({ userElo, userName = 'Me' }) {
    const [globalUsers, setGlobalUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGlobalRankings = async () => {
            setLoading(false);
            const { data, error } = await supabase
                .from('profiles')
                .select('email, name, elo')
                .order('elo', { ascending: false })
                .limit(50);

            if (!error && data) {
                // Filter out the current user if they are in the list to avoid duplication
                // since we add them manually with the latest local elo
                // (Though in a real app, you'd just use the DB record)
                setGlobalUsers(data);
            }
            setLoading(false);
        };

        fetchGlobalRankings();
    }, []);

    const leaderboardData = useMemo(() => {
        // Create a copy of the list and ensure current user is accounted for with local state
        let updatedList = [...globalUsers];

        // Find if current user is already in the list (fetched from DB)
        const userIndex = updatedList.findIndex(u => u.name === userName);

        if (userIndex !== -1) {
            // Update their Elo to the local real-time state
            updatedList[userIndex] = { ...updatedList[userIndex], elo: userElo, isCurrentUser: true };
        } else {
            // Add them manually if not in the top 50 yet
            updatedList.push({ name: userName, elo: userElo, isCurrentUser: true, email: 'local_current' });
        }

        return updatedList.sort((a, b) => b.elo - a.elo);
    }, [globalUsers, userName, userElo]);

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
                            <span className="item-rank-num">#{index + 1}</span>
                            <span className="item-name" title={user.name}>{user.name}</span>
                            <span className="item-elo">{user.elo}</span>
                            <span className={`item-rank rank-${rankName.split(' ')[0].toLowerCase()}`}>
                                {rankName}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
