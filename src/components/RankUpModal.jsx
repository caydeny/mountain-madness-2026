import React, { useEffect, useState } from 'react';
import './RankUpModal.css';

export default function RankUpModal({ rank, onClose }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`rank-up-overlay ${isVisible ? 'visible' : ''}`} onClick={onClose}>
            <div className="rank-up-modal" onClick={e => e.stopPropagation()}>
                <div className="celebration-particles">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className={`particle particle-${i}`} />
                    ))}
                </div>

                <div className="modal-content">
                    <div className="trophy-icon">🏆</div>
                    <h1 className="congrats-text">CONGRATULATIONS!</h1>
                    <p className="sub-text">You've reached a new milestone</p>

                    <div className="rank-badge-container">
                        <div className={`rank-badge rank-${rank.toLowerCase()}`}>
                            {rank}
                        </div>
                    </div>

                    <h2 className="rank-announcement">
                        YOU RANKED UP TO <span className="rank-highlight">{rank.toUpperCase()}</span>!
                    </h2>

                    <button className="claim-reward-btn" onClick={onClose}>
                        CONTINUE YOUR JOURNEY
                    </button>
                </div>
            </div>
        </div>
    );
}
