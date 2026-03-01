import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import FriendsLeaderboard from './FriendsLeaderboard';
import GlobalLeaderboard from './GlobalLeaderboard';
import './Leaderboard.css';

export default function LeaderboardContainer({ userElo, userName, userEmail }) {
    const [selectedLeaderboard, setSelectedLeaderboard] = useState('global');
    const [memberships, setMemberships] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userEmail) return;

        const fetchMemberships = async () => {
            setLoading(true);
            try {
                // Fetch the user's profile ID first
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('email', userEmail)
                    .single();

                if (profile) {
                    // Fetch memberships along with leaderboard names
                    const { data: mems, error } = await supabase
                        .from('memberships')
                        .select(`
                            leaderboard_id,
                            leaderboards (
                                id,
                                name
                            )
                        `)
                        .eq('user_id', profile.id);

                    if (!error && mems) {
                        setMemberships(mems.map(m => m.leaderboards));
                    }
                }
            } catch (err) {
                console.error('Error fetching memberships:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMemberships();
    }, [userEmail]);

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
                    {memberships.map((lb) => (
                        lb.name !== 'Global' && (
                            <option key={lb.id} value={lb.id}>{lb.name} Leaderboard</option>
                        )
                    ))}
                    {/* Fallback friends option if no memberships yet */}
                    {memberships.length === 0 && <option value="friends">Friends Leaderboard (Mock)</option>}
                </select>
            </div>

            <div className="leaderboard-content" key={selectedLeaderboard}>
                {selectedLeaderboard === 'global' ? (
                    <GlobalLeaderboard userElo={userElo} userName={userName} />
                ) : selectedLeaderboard === 'friends' ? (
                    <FriendsLeaderboard userElo={userElo} userName={userName} />
                ) : (
                    <FriendsLeaderboard
                        userElo={userElo}
                        userName={userName}
                        leaderboardId={selectedLeaderboard}
                    />
                )}
            </div>
        </div>
    );
}
