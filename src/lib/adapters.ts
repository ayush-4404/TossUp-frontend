import type {
  Bet,
  BetHistoryEntry,
  CoinTransfer,
  Group,
  GroupMember,
  LeaderboardEntry,
  Match,
  PublicUserProfile,
  Team,
  User,
} from "@/lib/types";

const getLevelFromBetCount = (count: number) =>
  count < 1 ? 1 : count < 5 ? 2 : count < 10 ? 3 : Math.floor((count - 10) / 10) + 4;

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

const IPL_TEAM_MAP: Record<string, { shortName: string; color: string; logo: string }> = {
  "chennai super kings":   { shortName: "CSK",  color: "#FDB913", logo: "https://en.wikipedia.org/wiki/Special:FilePath/Chennai_Super_Kings_Logo.svg" },
  "mumbai indians":        { shortName: "MI",   color: "#004BA0", logo: "https://en.wikipedia.org/wiki/Special:FilePath/Mumbai_Indians_Logo.svg" },
  "royal challengers bengaluru": { shortName: "RCB",  color: "#EC1C24", logo: "https://en.wikipedia.org/wiki/Special:FilePath/Royal_Challengers_Bengaluru_Logo.svg" },
  "kolkata knight riders": { shortName: "KKR",  color: "#3A225D", logo: "https://en.wikipedia.org/wiki/Special:FilePath/Kolkata_Knight_Riders_Logo.svg" },
  "delhi capitals":        { shortName: "DC",   color: "#17479E", logo: "https://en.wikipedia.org/wiki/Special:FilePath/Delhi_Capitals.svg" },
  "punjab kings":          { shortName: "PBKS", color: "#DB1F26", logo: "https://en.wikipedia.org/wiki/Special:FilePath/Punjab_Kings_Logo.svg" },
  "rajasthan royals":      { shortName: "RR",   color: "#EA1A85", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg/1920px-This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg.png" },
  "sunrisers hyderabad":   { shortName: "SRH",  color: "#F7A722", logo: "https://en.wikipedia.org/wiki/Special:FilePath/Sunrisers_Hyderabad_Logo.svg" },
  "gujarat titans":        { shortName: "GT",   color: "#1D3461", logo: "https://en.wikipedia.org/wiki/Special:FilePath/Gujarat_Titans_Logo.svg" },
  "lucknow super giants":  { shortName: "LSG",  color: "#A4262C", logo: "https://en.wikipedia.org/wiki/Special:FilePath/Lucknow_Super_Giants_Logo.svg" },
};

const resolveIplTeam = (teamName: string) => {
  const key = teamName.toLowerCase().trim();
  if (IPL_TEAM_MAP[key]) return IPL_TEAM_MAP[key];
  const entry = Object.entries(IPL_TEAM_MAP).find(
    ([k]) => key.includes(k) || k.includes(key)
  );
  return entry ? entry[1] : null;
};

export const mapTeam = (teamName: string): Team => {
  const resolved = resolveIplTeam(teamName);
  return {
    id: teamName,
    name: teamName,
    shortName: resolved?.shortName || shortName(teamName),
    color: resolved?.color || "#1f2937",
    logo: resolved?.logo || "🏏",
  };
};

export const mapUser = (apiUser: any): User => {
  const totalBets = Number(apiUser.totalBets || 0);

  const fallbackLevel =
    totalBets < 1 ? 1 : totalBets < 5 ? 2 : totalBets < 10 ? 3 : Math.floor((totalBets - 10) / 10) + 4;
  const level = Number(apiUser.level || fallbackLevel);

  const fallbackLevelStart =
    level <= 1 ? 0 : level === 2 ? 1 : level === 3 ? 5 : (level - 3) * 10;
  const levelStart = Number(apiUser.levelStart ?? fallbackLevelStart);
  const fallbackNextLevelTarget = level <= 1 ? 1 : level === 2 ? 5 : level === 3 ? 10 : levelStart + 10;
  const nextLevelTarget = Number(apiUser.nextLevelTarget ?? fallbackNextLevelTarget);
  const currentLevelSpan = Math.max(nextLevelTarget - levelStart, 1);
  const fallbackProgress = Math.round(
    (Math.min(Math.max(totalBets - levelStart, 0), currentLevelSpan) / currentLevelSpan) * 100
  );

  return {
    id: apiUser._id,
    name: apiUser.name,
    email: apiUser.email,
    avatar: apiUser.profileImageUrl || undefined,
    favoriteIplTeam: apiUser.favoriteIplTeam || undefined,
    favoriteIplTeamLogo: apiUser.favoriteIplTeamLogo || undefined,
    coins: Number(apiUser.coins || 0),
    totalGroups: Number(apiUser.totalGroups || 0),
    totalBets,
    level,
    levelStart,
    nextLevelTarget,
    betsToNextLevel: Number(apiUser.betsToNextLevel ?? Math.max(nextLevelTarget - totalBets, 0)),
    levelProgressPercent: Number(apiUser.levelProgressPercent ?? fallbackProgress),
    wins: Number(apiUser.wins || 0),
    losses: Number(apiUser.losses || 0),
  };
};

export const mapGroupMember = (member: any): GroupMember => ({
  const totalBets = Number(member.totalBets || 0);

  userId: member._id || member.userId,
  name: member.name,
  avatar: member.profileImageUrl || member.avatar || undefined,
  coins: Number(member.coins || 0),
  level: Number(member.level || getLevelFromBetCount(totalBets)),
  totalBets,
  wins: Number(member.wins || 0),
  losses: Number(member.losses || 0),
});

export const mapPublicUserProfile = (apiUser: any): PublicUserProfile => ({
  id: apiUser._id,
  name: apiUser.name,
  avatar: apiUser.profileImageUrl || undefined,
  favoriteIplTeam: apiUser.favoriteIplTeam || undefined,
  favoriteIplTeamLogo: apiUser.favoriteIplTeamLogo || undefined,
  coins: Number(apiUser.coins || 0),
  totalGroups: Number(apiUser.totalGroups || 0),
  totalBets: Number(apiUser.totalBets || 0),
  level: Number(apiUser.level || 1),
  levelStart: Number(apiUser.levelStart || 0),
  nextLevelTarget: Number(apiUser.nextLevelTarget || 1),
  betsToNextLevel: Number(apiUser.betsToNextLevel || 0),
  levelProgressPercent: Number(apiUser.levelProgressPercent || 0),
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
  isManual: Boolean(apiMatch.isManual),
  groupId: apiMatch.groupId || null,
});

export const mapLeaderboard = (rows: any[]): LeaderboardEntry[] => {
  return rows.map((row, index) => ({
    rank: index + 1,
    userId: row.userId,
    name: row.name,
    avatar: row.avatar,
    coins: Number(row.coins || 0),
    netCoins: Number(row.netCoins || 0),
    wins: Number(row.wins || 0),
    losses: Number(row.losses || 0),
  }));
};

export const mapBet = (apiBet: any): Bet => ({
  id: apiBet._id,
  groupId: typeof apiBet.groupId === "string" ? apiBet.groupId : apiBet.groupId?._id,
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
