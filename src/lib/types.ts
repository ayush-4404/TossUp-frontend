export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  favoriteIplTeam?: string;
  favoriteIplTeamLogo?: string;
  coins: number;
  totalGroups: number;
  totalBets: number;
  level: number;
  levelStart: number;
  nextLevelTarget: number;
  betsToNextLevel: number;
  levelProgressPercent: number;
  wins: number;
  losses: number;
}

export interface IplTeam {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo: string;
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
  isManual?: boolean;
  groupId?: string | null;
  manualBetAmount?: number | null;
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
  level: number;
  totalBets: number;
  wins: number;
  losses: number;
}

export interface PublicUserProfile {
  id: string;
  name: string;
  avatar?: string;
  favoriteIplTeam?: string;
  favoriteIplTeamLogo?: string;
  coins: number;
  totalGroups: number;
  totalBets: number;
  level: number;
  levelStart: number;
  nextLevelTarget: number;
  betsToNextLevel: number;
  levelProgressPercent: number;
}

export interface Bet {
  id: string;
  matchId: string;
  groupId: string;
  userId: string;
  userName?: string;
  teamId: string;
  amount: number;
  status: "pending" | "won" | "lost";
  createdAt: string;
}

export interface CoinTransfer {
  id: string;
  groupId: string;
  matchId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  createdAt: string;
}

export interface BetHistoryEntry {
  id: string;
  groupId: string;
  matchId: string;
  userId: string;
  userName: string;
  action: "placed" | "updated";
  previousTeamSelected?: string | null;
  newTeamSelected: string;
  amount: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  coins: number;
  netCoins: number;
  wins: number;
  losses: number;
}

export interface GroupSettlementMember {
  userId: string;
  name: string;
  email: string;
  incoming: number;
  outgoing: number;
  net: number;
  direction: "pay" | "receive" | "settled";
}

export interface GroupPaymentInstruction {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

export interface GroupSettlementSummary {
  groupId: string;
  groupName: string;
  totals: {
    totalIncoming: number;
    totalOutgoing: number;
    transferCount: number;
    membersWithBalance: number;
  };
  memberSummaries: GroupSettlementMember[];
  paymentInstructions: GroupPaymentInstruction[];
}
