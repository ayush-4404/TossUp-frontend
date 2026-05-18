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

export interface MatchResultRefreshSummary {
  syncedMatchCount: number;
  refreshedMatchCount: number;
  completedMatchCount: number;
  settlementCount: number;
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

export interface CustomBetAnswer {
  id: string;
  customBetId: string;
  groupId: string;
  userId: string;
  userName: string;
  optionSelected: string;
  amount: number;
  settled: boolean;
  isWinner: boolean | null;
  payout: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomBetTransfer {
  id: string;
  groupId: string;
  customBetId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  createdAt: string;
}

export interface CustomBet {
  id: string;
  groupId: string;
  createdBy: string;
  createdByName: string;
  question: string;
  options: string[];
  betAmount: number;
  status: "open" | "settled";
  correctOption?: string;
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
  answers: CustomBetAnswer[];
  transfers: CustomBetTransfer[];
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

export interface GroupSettlementBreakdown {
  totals: {
    totalIncoming: number;
    totalOutgoing: number;
    transferCount: number;
    membersWithBalance: number;
  };
  memberSummaries: GroupSettlementMember[];
  paymentInstructions: GroupPaymentInstruction[];
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
  customBetSummary?: GroupSettlementBreakdown;
}

export interface ReportUser {
  id: string;
  name: string;
  email: string;
}

export interface ReportTransfer {
  id: string;
  fromUser: ReportUser;
  toUser: ReportUser;
  amount: number;
  createdAt?: string | null;
}

export interface GroupTransactionReport {
  generatedAt: string;
  group: {
    id: string;
    name: string;
    inviteCode: string;
    betPrice: number;
    owner: ReportUser;
    members: ReportUser[];
  };
  generatedFor?: ReportUser;
  summary: {
    matchCount: number;
    customBetCount: number;
    matchTransferCount: number;
    customBetTransferCount: number;
    totalCoinsMoved: number;
  };
  matchSections: Array<{
    match: {
      id: string;
      teamA: string;
      teamB: string;
      startTime?: string | null;
      status: "upcoming" | "live" | "completed";
      winner?: string | null;
      isManual: boolean;
    };
    bets: Array<{
      id: string;
      user: ReportUser;
      teamSelected: string;
      amount: number;
      settled: boolean;
      createdAt?: string | null;
    }>;
    transfers: ReportTransfer[];
    totals: {
      betCount: number;
      transferCount: number;
      coinsMoved: number;
    };
  }>;
  customBetSections: Array<{
    id: string;
    question: string;
    options: string[];
    betAmount: number;
    status: "open" | "settled";
    correctOption?: string | null;
    createdBy: ReportUser;
    createdAt?: string | null;
    settledAt?: string | null;
    answers: Array<{
      id: string;
      user: ReportUser;
      optionSelected: string;
      amount: number;
      settled: boolean;
      isWinner: boolean | null;
      payout: number;
      createdAt?: string | null;
    }>;
    transfers: ReportTransfer[];
    totals: {
      answerCount: number;
      transferCount: number;
      coinsMoved: number;
    };
  }>;
}
