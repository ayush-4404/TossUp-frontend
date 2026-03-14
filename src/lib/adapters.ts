import type { Group, GroupMember, LeaderboardEntry, Match, Team, User } from "@/lib/types";

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
