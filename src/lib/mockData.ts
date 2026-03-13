import type { User, Match, Group, Team, LeaderboardEntry } from "./types";

const teams: Team[] = [
  { id: "csk", name: "Chennai Super Kings", shortName: "CSK", color: "#FFCC00", logo: "🦁" },
  { id: "mi", name: "Mumbai Indians", shortName: "MI", color: "#004BA0", logo: "🏏" },
  { id: "rcb", name: "Royal Challengers Bengaluru", shortName: "RCB", color: "#EC1C24", logo: "👑" },
  { id: "kkr", name: "Kolkata Knight Riders", shortName: "KKR", color: "#3A225D", logo: "⚔️" },
  { id: "dc", name: "Delhi Capitals", shortName: "DC", color: "#004C93", logo: "🏛️" },
  { id: "srh", name: "Sunrisers Hyderabad", shortName: "SRH", color: "#FF822A", logo: "☀️" },
  { id: "rr", name: "Rajasthan Royals", shortName: "RR", color: "#EA1A85", logo: "👸" },
  { id: "pbks", name: "Punjab Kings", shortName: "PBKS", color: "#ED1B24", logo: "🦁" },
  { id: "gt", name: "Gujarat Titans", shortName: "GT", color: "#1C1C1C", logo: "⚡" },
  { id: "lsg", name: "Lucknow Super Giants", shortName: "LSG", color: "#ACE5F3", logo: "🦸" },
];

const now = new Date();
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();

export const mockMatches: Match[] = [
  { id: "m1", teamA: teams[0], teamB: teams[1], startTime: hoursFromNow(2), venue: "Wankhede Stadium, Mumbai", status: "upcoming" },
  { id: "m2", teamA: teams[2], teamB: teams[3], startTime: hoursFromNow(26), venue: "M. Chinnaswamy Stadium, Bengaluru", status: "upcoming" },
  { id: "m3", teamA: teams[4], teamB: teams[5], startTime: hoursFromNow(50), venue: "Arun Jaitley Stadium, Delhi", status: "upcoming" },
  { id: "m4", teamA: teams[6], teamB: teams[7], startTime: hoursFromNow(74), venue: "Sawai Mansingh Stadium, Jaipur", status: "upcoming" },
  { id: "m5", teamA: teams[8], teamB: teams[9], startTime: hoursFromNow(98), venue: "Narendra Modi Stadium, Ahmedabad", status: "upcoming" },
  { id: "m6", teamA: teams[0], teamB: teams[2], startTime: hoursFromNow(122), venue: "MA Chidambaram Stadium, Chennai", status: "upcoming" },
];

export const mockUser: User = {
  id: "u1",
  name: "Virat Fan",
  email: "virat@tossup.com",
  coins: 5000,
  wins: 12,
  losses: 5,
};

export const mockGroups: Group[] = [
  {
    id: "g1",
    name: "IPL Legends",
    betPrice: 100,
    inviteCode: "IPL2025",
    createdBy: "u1",
    members: [
      { userId: "u1", name: "Virat Fan", coins: 5000, wins: 12, losses: 5 },
      { userId: "u2", name: "Dhoni Lover", coins: 4200, wins: 10, losses: 7 },
      { userId: "u3", name: "Rohit Bro", coins: 3800, wins: 9, losses: 8 },
      { userId: "u4", name: "ABD Stan", coins: 6100, wins: 15, losses: 3 },
      { userId: "u5", name: "Cricket Nerd", coins: 2900, wins: 7, losses: 10 },
    ],
  },
  {
    id: "g2",
    name: "Office League",
    betPrice: 50,
    inviteCode: "OFFICE50",
    createdBy: "u1",
    members: [
      { userId: "u1", name: "Virat Fan", coins: 5000, wins: 12, losses: 5 },
      { userId: "u6", name: "Boss Man", coins: 3500, wins: 8, losses: 9 },
      { userId: "u7", name: "Intern King", coins: 7200, wins: 18, losses: 2 },
    ],
  },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: "u7", name: "Intern King", coins: 7200, wins: 18, losses: 2 },
  { rank: 2, userId: "u4", name: "ABD Stan", coins: 6100, wins: 15, losses: 3 },
  { rank: 3, userId: "u1", name: "Virat Fan", coins: 5000, wins: 12, losses: 5 },
  { rank: 4, userId: "u2", name: "Dhoni Lover", coins: 4200, wins: 10, losses: 7 },
  { rank: 5, userId: "u3", name: "Rohit Bro", coins: 3800, wins: 9, losses: 8 },
];

export { teams };
