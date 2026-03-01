import { getRankFromElo } from '../utils/rankUtils';
import './RankDisplay.css';

export default function RankDisplay({ elo, setElo }) {
  const currentRank = getRankFromElo(elo);

  return (
    <div className="rank-container">
      <div className="rank-board">
        <div className="stat-row">
          <span className="stat-label">Elo:</span>
          <span className="stat-value">{elo}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Rank:</span>
          <span className={`stat-value rank-${currentRank.toLowerCase()}`}>{currentRank}</span>
        </div>

        <div className="button-group">
          <button
            className="action-btn decrease-btn"
            onClick={() => setElo(Math.max(0, elo - 50))}
          >
            Decrease Elo
          </button>
          <button
            className="action-btn increase-btn"
            onClick={() => setElo(elo + 50)}
          >
            Increase Elo
          </button>
        </div>
      </div>
    </div>
  );
}
