import FriendsLeaderboard from './FriendsLeaderboard';
import GlobalLeaderboard from './GlobalLeaderboard';
import './Leaderboard.css';

export default function LeaderboardContainer({ userElo, userName }) {
    return (
        <div className="leaderboard-container">
            <div className="leaderboard-grid">
                <GlobalLeaderboard userElo={userElo} userName={userName} />
                <FriendsLeaderboard userElo={userElo} userName={userName} />
            </div>
        </div>
    );
}
