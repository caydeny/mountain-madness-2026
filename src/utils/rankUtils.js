export const RANKS = [
    "Iron Intern",
    "Bronze Budgeter",
    "Silver Saver",
    "Gold Guardian",
    "Platinum Planner",
    "Emerald Earner",
    "Diamond Depositor",
    "Ruby Rainmaker",
    "Sapphire Stasher",
    "Crystal Cashlord"
];

/**
 * Calculates a Rank based on an Elo score.
 * Each 100 Elo points equals 1 rank starting at Iron (0-99).
 * Maximum rank is Challenger (900+).
 */
export function getRankFromElo(elo) {
    const rankIndex = Math.min(Math.floor(elo / 100), RANKS.length - 1);
    return RANKS[rankIndex];
}
