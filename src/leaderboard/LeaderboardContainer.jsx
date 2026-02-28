import FriendsLeaderboard from './FriendsLeaderboard';
import GlobalLeaderboard from './GlobalLeaderboard';
import './Leaderboard.css';

export default function LeaderboardContainer({ userElo }) {
    return (
        <div className="leaderboard-container">
            <h2 className="leaderboard-title">Rankings</h2>
            <div className="leaderboard-grid">
                <FriendsLeaderboard userElo={userElo} />
                <GlobalLeaderboard userElo={userElo} />
            </div>
        </div>
    );
}
