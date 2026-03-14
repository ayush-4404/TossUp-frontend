import type {
  Bet,
  BetHistoryEntry,
  CoinTransfer,
  Group,
  GroupMember,
  LeaderboardEntry,
  Match,
  Team,
  User,
} from "@/lib/types";

const shortName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "TEAM";
  }
  return parts
    .slice(0, 3)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

export const mapTeam = (teamName: string): Team => ({
  id: teamName,
  name: teamName,
  shortName: shortName(teamName),
  color: "#1f2937",
  logo: "🏏",
});

export const mapUser = (apiUser: any): User => ({
  id: apiUser._id,
  name: apiUser.name,
  email: apiUser.email,
  avatar: apiUser.profileImageUrl || undefined,
  coins: Number(apiUser.coins || 0),
  wins: Number(apiUser.wins || 0),
  losses: Number(apiUser.losses || 0),
});

export const mapGroupMember = (member: any): GroupMember => ({
  userId: member._id || member.userId,
  name: member.name,
  avatar: member.profileImageUrl || member.avatar || undefined,
  coins: Number(member.coins || 0),
  wins: Number(member.wins || 0),
  losses: Number(member.losses || 0),
});

export const mapGroup = (apiGroup: any): Group => ({
  id: apiGroup._id,
  name: apiGroup.name,
  betPrice: Number(apiGroup.betPrice || 0),
  inviteCode: apiGroup.inviteCode,
  createdBy:
    typeof apiGroup.creatorId === "string"
      ? apiGroup.creatorId
      : apiGroup.creatorId?._id || "",
  members: Array.isArray(apiGroup.members) ? apiGroup.members.map(mapGroupMember) : [],
});

export const mapMatch = (apiMatch: any): Match => ({
  id: apiMatch._id,
  teamA: mapTeam(apiMatch.teamA),
  teamB: mapTeam(apiMatch.teamB),
  startTime: apiMatch.startTime,
  venue: apiMatch.venue || "TBD",
  status: apiMatch.status,
  winner: apiMatch.winner || undefined,
});

export const mapLeaderboard = (rows: any[]): LeaderboardEntry[] => {
  return rows.map((row, index) => ({
    rank: index + 1,
    userId: row.userId,
    name: row.name,
    avatar: row.avatar,
    coins: Number(row.coins || 0),
    wins: Number(row.wins || 0),
    losses: Number(row.losses || 0),
  }));
};

export const mapBet = (apiBet: any): Bet => ({
  id: apiBet._id,
  groupId: apiBet.groupId,
  matchId: typeof apiBet.matchId === "string" ? apiBet.matchId : apiBet.matchId?._id,
  userId: typeof apiBet.userId === "string" ? apiBet.userId : apiBet.userId?._id,
  userName: typeof apiBet.userId === "string" ? undefined : apiBet.userId?.name,
  teamId: apiBet.teamSelected,
  amount: Number(apiBet.amount || 0),
  status: apiBet.settled ? "won" : "pending",
  createdAt: apiBet.createdAt,
});

export const mapCoinTransfer = (apiTransfer: any): CoinTransfer => ({
  id: apiTransfer._id,
  groupId: apiTransfer.groupId,
  matchId: apiTransfer.matchId,
  fromUserId:
    typeof apiTransfer.fromUserId === "string" ? apiTransfer.fromUserId : apiTransfer.fromUserId?._id,
  fromUserName:
    typeof apiTransfer.fromUserId === "string"
      ? "Unknown"
      : apiTransfer.fromUserId?.name || "Unknown",
  toUserId: typeof apiTransfer.toUserId === "string" ? apiTransfer.toUserId : apiTransfer.toUserId?._id,
  toUserName:
    typeof apiTransfer.toUserId === "string" ? "Unknown" : apiTransfer.toUserId?.name || "Unknown",
  amount: Number(apiTransfer.amount || 0),
  createdAt: apiTransfer.createdAt,
});

export const mapBetHistoryEntry = (apiRow: any): BetHistoryEntry => ({
  id: apiRow._id,
  groupId: apiRow.groupId,
  matchId: apiRow.matchId,
  userId: typeof apiRow.userId === "string" ? apiRow.userId : apiRow.userId?._id,
  userName: typeof apiRow.userId === "string" ? "Unknown" : apiRow.userId?.name || "Unknown",
  action: apiRow.action,
  previousTeamSelected: apiRow.previousTeamSelected,
  newTeamSelected: apiRow.newTeamSelected,
  amount: Number(apiRow.amount || 0),
  createdAt: apiRow.createdAt,
});
