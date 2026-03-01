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
        // Since we are fetching everything, we just use the data
        // But we mark which one is "Me" based on the name/email if we had it
        return globalUsers.map(user => ({
            ...user,
            id: user.email,
            isCurrentUser: user.name === userName // Simple check for now
        }));
    }, [globalUsers, userName]);

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
