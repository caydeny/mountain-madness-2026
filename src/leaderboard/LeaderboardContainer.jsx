import FriendsLeaderboard from './FriendsLeaderboard';
import GlobalLeaderboard from './GlobalLeaderboard';
import './Leaderboard.css';

export default function LeaderboardContainer({ userElo }) {
    return (
        <div className="leaderboard-container">
            <div className="leaderboard-grid">
                <GlobalLeaderboard userElo={userElo} />
                <FriendsLeaderboard userElo={userElo} />
            </div>
        </div>
    );
}
