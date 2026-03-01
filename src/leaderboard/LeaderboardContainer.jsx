import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import FriendsLeaderboard from './FriendsLeaderboard';
import GlobalLeaderboard from './GlobalLeaderboard';
import './Leaderboard.css';

export default function LeaderboardContainer({ userElo, userName, userEmail }) {
    const [selectedLeaderboard, setSelectedLeaderboard] = useState('global');
    const [memberships, setMemberships] = useState([]);
    const [loading, setLoading] = useState(true);

    // Create Leaderboard Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [leaderboardName, setLeaderboardName] = useState('');
    const [copied, setCopied] = useState(false);
    const mockJoinLink = `https://mountainmadness.app/join/lb-${Math.random().toString(36).substring(2, 8)}`;

    useEffect(() => {
        if (!userEmail) return;

        const fetchMemberships = async () => {
            setLoading(true);
            try {
                // Fetch the user's profile first using email
                const { data: profile, error: pError } = await supabase
                    .from('profiles')
                    .select('email') // User said they have email, name, elo, rank, google_id
                    .eq('email', userEmail)
                    .single();

                if (profile) {
                    // Try to fetch memberships. This will fail if user hasn't created the table yet.
                    const { data: mems, error } = await supabase
                        .from('memberships')
                        .select(`
                            leaderboard_id,
                            leaderboards (id, name)
                        `)
                        .eq('user_email', profile.email); // Assume relational link via email if id is missing

                    if (!error && mems) {
                        setMemberships(mems.map(m => m.leaderboards));
                    }
                }
            } catch (err) {
                console.warn('Membership fetch skipped (Table might not exist yet):', err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMemberships();
    }, [userEmail]);

    return (
        <div className="leaderboard-container">
            <button
                className="create-leaderboard-btn"
                onClick={() => setShowCreateModal(true)}
            >
                Create Leaderboard
            </button>

            <div className="leaderboard-selector-container">
                <label htmlFor="leaderboard-select" className="selector-label">View Leaderboards:</label>
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

            {/* Create Leaderboard Modal */}
            {showCreateModal && (
                <div className="create-modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="create-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="modal-close-btn"
                            onClick={() => setShowCreateModal(false)}
                        >
                            ×
                        </button>
                        <h2 className="modal-title">Share this link to compete with your friends!</h2>

                        <div className="modal-input-group">
                            <label>Leaderboard Name</label>
                            <input
                                type="text"
                                placeholder="Enter a name for your leaderboard..."
                                value={leaderboardName}
                                onChange={(e) => setLeaderboardName(e.target.value)}
                                className="modal-text-input"
                            />
                        </div>

                        <div className="modal-input-group">
                            <label>Invite Link</label>
                            <div className="modal-copy-row">
                                <input
                                    type="text"
                                    readOnly
                                    value={mockJoinLink}
                                    className="modal-text-input link-input"
                                />
                                <button
                                    className="modal-copy-btn"
                                    onClick={() => {
                                        navigator.clipboard.writeText(mockJoinLink);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
