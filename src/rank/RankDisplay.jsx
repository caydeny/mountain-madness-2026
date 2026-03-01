import { getRankFromElo } from '../utils/rankUtils';
import './RankDisplay.css';

export default function RankDisplay({ elo, setElo }) {
  const currentRank = getRankFromElo(elo);

  const achievements = [
    { title: "Highest Rank", description: `Highest rank and elo reached: ${currentRank} (${elo})` },
    { title: "Super Saver", description: "Save a total of $100000 (Current saved: $0)" },
    { title: "Highest Streak", description: "Your highest streak so far (0)" },
    { title: "Streaker", description: "Hold a ten day streak (Best: 0)" },
    { title: "Super Streaker", description: "Hold a 100 day streak (Best: 0)" },
    { title: "Budget Boss", description: "Stay under budget for an entire month (0/1)" },
    { title: "Event Planner", description: "Schedule 50 events in your calendar (0/50)" },
    { title: "Early Bird", description: "Sync your calendar before 8 AM (0/1)" }
  ];

  return (
    <div className="rank-container">
      <div className="rank-board">
        <div className="stat-row">
          <span className="stat-label">Elo:</span>
          <span className="stat-value">{elo}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Rank:</span>
          <span className={`stat-value rank-${currentRank.split(' ')[0].toLowerCase()}`}>{currentRank}</span>
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

        <div className="achievements-section">
          <h3 className="achievements-title">Achievements</h3>
          <div className="medals-grid">
            {achievements.map((ach, i) => (
              <div key={i} className="medal-placeholder">
                <div className="medal-tooltip">
                  <strong>{ach.title}</strong>
                  <p>{ach.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
