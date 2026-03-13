export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  coins: number;
  wins: number;
  losses: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo: string;
}

export interface Match {
  id: string;
  teamA: Team;
  teamB: Team;
  startTime: string;
  venue: string;
  status: "upcoming" | "live" | "completed";
  winner?: string;
}

export interface Group {
  id: string;
  name: string;
  betPrice: number;
  members: GroupMember[];
  inviteCode: string;
  createdBy: string;
}

export interface GroupMember {
  userId: string;
  name: string;
  avatar?: string;
  coins: number;
  wins: number;
  losses: number;
}

export interface Bet {
  id: string;
  matchId: string;
  groupId: string;
  userId: string;
  teamId: string;
  amount: number;
  status: "pending" | "won" | "lost";
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  coins: number;
  wins: number;
  losses: number;
}
