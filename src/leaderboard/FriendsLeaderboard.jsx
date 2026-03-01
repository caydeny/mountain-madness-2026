import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { getRankFromElo } from '../utils/rankUtils';
import './Leaderboard.css';

const MOCK_FRIENDS = [
    { id: 'f1', name: 'John', elo: 450 },
    { id: 'f2', name: 'Andrew', elo: 820 },
    { id: 'f3', name: 'Nick', elo: 210 },
    { id: 'f4', name: 'Cayden', elo: 950 },
];

export default function FriendsLeaderboard({ userElo, userName = 'Me', leaderboardId }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!leaderboardId || leaderboardId === 'friends') {
            setMembers(MOCK_FRIENDS);
            return;
        }

        const fetchMembers = async () => {
            setLoading(true);
            try {
                // Fetch all profiles belonging to this leaderboard
                const { data, error } = await supabase
                    .from('memberships')
                    .select('profiles (email, name, elo)')
                    .eq('leaderboard_id', leaderboardId);

                if (!error && data) {
                    setMembers(data.map(m => m.profiles));
                }
            } catch (err) {
                console.error('Error fetching group members:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, [leaderboardId]);

    const leaderboardData = useMemo(() => {
        // Start with the members fetched from DB or mock
        let combined = [...members];

        // Ensure current user is in there with latest local Elo
        const meIndex = combined.findIndex(u => u.name === userName);
        if (meIndex !== -1) {
            combined[meIndex] = { ...combined[meIndex], elo: userElo, isCurrentUser: true };
        } else {
            combined.push({ name: userName, elo: userElo, isCurrentUser: true, email: 'me_local' });
        }

        return combined.map(user => ({
            ...user,
            id: user.email || user.id || Math.random().toString(),
            isCurrentUser: user.name === userName
        })).sort((a, b) => b.elo - a.elo);
    }, [members, userName, userElo]);

    return (
        <div className="leaderboard-panel friends-leaderboard">
            <h3 className="panel-title">
                {leaderboardId === 'friends' ? 'Friends (Mock)' : 'Group'} Rankings
            </h3>

            <div className="leaderboard-list">
                {loading ? (
                    <div className="loading-item">Fetching members...</div>
                ) : leaderboardData.map((user, index) => {
                    const rankName = getRankFromElo(user.elo);
                    return (
                        <div
                            key={user.id}
                            className={`leaderboard-item ${user.isCurrentUser ? 'current-user-item' : ''}`}
                        >
                            <span className="item-rank-num">#{index + 1}</span>
                            <span className="item-name" title={user.name}>{user.name}</span>
                            <span className="item-elo">{user.elo}</span>
                            <span className={`item-rank rank-${rankName.toLowerCase()}`}>
                                {rankName}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
