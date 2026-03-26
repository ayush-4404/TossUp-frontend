import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, IndianRupee, Users, PlusCircle, Flag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import MatchCard from "@/components/MatchCard";
import LeaderboardTable from "@/components/LeaderboardTable";
import { useGroupStore } from "@/store/groupStore";
import { useMatchStore } from "@/store/matchStore";
import { useUserStore } from "@/store/userStore";
import { toast } from "@/hooks/use-toast";
import type {
  BetHistoryEntry,
  CoinTransfer,
  GroupSettlementSummary,
  LeaderboardEntry,
  PublicUserProfile,
} from "@/lib/types";

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { groups, loadGroups, fetchGroupById, getLeaderboard, getSettlementSummary, getPublicUserProfile } =
    useGroupStore();
  const {
    matches,
    bets,
    loadMatches,
    createManualMatch,
    updateManualMatchBetAmount,
    declareManualMatchResult,
    loadGroupBets,
    loadGroupMatchTransfers,
    loadGroupMatchBetHistory,
  } = useMatchStore();
  const user = useUserStore((state) => state.user);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [transfersByMatch, setTransfersByMatch] = useState<Record<string, CoinTransfer[]>>({});
  const [betHistoryByMatch, setBetHistoryByMatch] = useState<Record<string, BetHistoryEntry[]>>({});
  const [addManualOpen, setAddManualOpen] = useState(false);
  const [declaringResult, setDeclaringResult] = useState(false);
  const [creatingManual, setCreatingManual] = useState(false);
  const [updatingManualBetAmount, setUpdatingManualBetAmount] = useState(false);
  const [manualTeamA, setManualTeamA] = useState("");
  const [manualTeamB, setManualTeamB] = useState("");
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualBetAmountInput, setManualBetAmountInput] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [settlementSummary, setSettlementSummary] = useState<GroupSettlementSummary | null>(null);
  const [historyMatchId, setHistoryMatchId] = useState<string | null>(null);
  const [memberProfileOpen, setMemberProfileOpen] = useState(false);
  const [memberProfileLoading, setMemberProfileLoading] = useState(false);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<PublicUserProfile | null>(null);
  const [selectionClearedByUser, setSelectionClearedByUser] = useState(false);
  const [isResolvingGroup, setIsResolvingGroup] = useState(true);
  const [groupMissing, setGroupMissing] = useState(false);

  useEffect(() => {
    if (groups.length === 0) {
      loadGroups().catch(() => undefined);
    }
    if (matches.length === 0) {
      loadMatches().catch(() => undefined);
    }
  }, [groups.length, matches.length, loadGroups, loadMatches]);

  useEffect(() => {
    let active = true;

    const resolveGroup = async () => {
      if (!id) {
        if (!active) {
          return;
        }
        setGroupMissing(true);
        setIsResolvingGroup(false);
        return;
      }

      const inStore = groups.some((g) => g.id === id);
      if (inStore) {
        if (!active) {
          return;
        }
        setGroupMissing(false);
        setIsResolvingGroup(false);
        return;
      }

      setIsResolvingGroup(true);
      try {
        const fetched = await fetchGroupById(id);
        if (!active) {
          return;
        }
        setGroupMissing(!fetched);
      } catch {
        if (!active) {
          return;
        }
        setGroupMissing(true);
      } finally {
        if (active) {
          setIsResolvingGroup(false);
        }
      }
    };

    resolveGroup();

    return () => {
      active = false;
    };
  }, [id, groups, fetchGroupById]);

  useEffect(() => {
    if (id) {
      loadGroupBets(id).catch(() => undefined);
    }
  }, [id, loadGroupBets]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!id) {
        setLeaderboard([]);
        return;
      }

      try {
        const rows = await getLeaderboard(id);
        setLeaderboard(rows);
      } catch {
        setLeaderboard([]);
      }
    };

    fetchLeaderboard();
  }, [id, getLeaderboard]);

  useEffect(() => {
    const fetchSettlementSummary = async () => {
      if (!id) {
        setSettlementSummary(null);
        return;
      }

      try {
        const summary = await getSettlementSummary(id);
        setSettlementSummary(summary);
      } catch {
        setSettlementSummary(null);
      }
    };

    fetchSettlementSummary();
  }, [id, getSettlementSummary]);

  const group = groups.find((g) => g.id === id);
  const isOwner = Boolean(group && user && group.createdBy === user.id);

  const allGroupMatches = useMemo(
    () =>
      matches.filter(
        (m) =>
          (!m.groupId || m.groupId === id)
      ),
    [matches, id]
  );

  const groupMatches = useMemo(
    () => allGroupMatches.filter((m) => m.status === "upcoming"),
    [allGroupMatches]
  );

  const groupBets = useMemo(
    () => bets.filter((bet) => bet.groupId === id),
    [bets, id]
  );

  const betHistoryMatches = useMemo(() => {
    const idsWithBets = new Set(groupBets.map((bet) => bet.matchId));
    return allGroupMatches.filter((match) => idsWithBets.has(match.id));
  }, [allGroupMatches, groupBets]);

  const selectedMatch = useMemo(
    () => allGroupMatches.find((m) => m.id === selectedMatchId) || null,
    [allGroupMatches, selectedMatchId]
  );

  useEffect(() => {
    if (!selectedMatch || !selectedMatch.isManual || !group) {
      setManualBetAmountInput("");
      return;
    }

    const nextAmount = selectedMatch.manualBetAmount ?? group.betPrice;
    setManualBetAmountInput(String(nextAmount));
  }, [group, selectedMatch]);

  const historyMatch = useMemo(
    () => allGroupMatches.find((m) => m.id === historyMatchId) || null,
    [allGroupMatches, historyMatchId]
  );

  useEffect(() => {
    if (selectionClearedByUser && !selectedMatchId) {
      return;
    }

    if (!selectedMatchId && groupMatches.length > 0) {
      setSelectedMatchId(groupMatches[0].id);
      return;
    }

    if (!selectedMatchId && betHistoryMatches.length > 0) {
      setSelectedMatchId(betHistoryMatches[0].id);
      return;
    }

    if (!selectedMatchId && allGroupMatches.length > 0) {
      setSelectedMatchId(allGroupMatches[0].id);
    }
  }, [betHistoryMatches, groupMatches, allGroupMatches, selectedMatchId, selectionClearedByUser]);

  useEffect(() => {
    const fetchTransfers = async () => {
      if (!id || !selectedMatchId) {
        return;
      }

      try {
        const rows = await loadGroupMatchTransfers(id, selectedMatchId);
        setTransfersByMatch((prev) => ({ ...prev, [selectedMatchId]: rows }));
      } catch {
        setTransfersByMatch((prev) => ({ ...prev, [selectedMatchId]: [] }));
      }
    };

    fetchTransfers();
  }, [id, selectedMatchId, loadGroupMatchTransfers]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!id || !selectedMatchId) {
        return;
      }

      try {
        const rows = await loadGroupMatchBetHistory(id, selectedMatchId);
        setBetHistoryByMatch((prev) => ({ ...prev, [selectedMatchId]: rows }));
      } catch {
        setBetHistoryByMatch((prev) => ({ ...prev, [selectedMatchId]: [] }));
      }
    };

    fetchHistory();
  }, [id, selectedMatchId, loadGroupMatchBetHistory]);

  const copyCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    toast({ title: "Copied!" });
  };

  const openMemberProfile = async (memberUserId: string) => {
    setMemberProfileOpen(true);
    setMemberProfileLoading(true);

    try {
      const profile = await getPublicUserProfile(memberUserId);
      setSelectedMemberProfile(profile);
    } catch {
      setSelectedMemberProfile(null);
      toast({
        title: "Failed",
        description: "Could not load member profile.",
        variant: "destructive",
      });
    } finally {
      setMemberProfileLoading(false);
    }
  };

  const handleCreateManualMatch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) {
      return;
    }

    if (!manualTeamA.trim() || !manualTeamB.trim() || !manualStartTime) {
      toast({ title: "Missing details", description: "Please fill all fields.", variant: "destructive" });
      return;
    }

    setCreatingManual(true);
    try {
      const created = await createManualMatch(id, manualTeamA.trim(), manualTeamB.trim(), new Date(manualStartTime).toISOString());
      if (!created) {
        throw new Error("Creation failed");
      }
      setAddManualOpen(false);
      setManualTeamA("");
      setManualTeamB("");
      setManualStartTime("");
      setSelectedMatchId(created.id);
      setSelectionClearedByUser(false);
      toast({ title: "Manual match added", description: "Group members can now place bets on it." });
    } catch {
      toast({ title: "Failed", description: "Could not create manual match.", variant: "destructive" });
    } finally {
      setCreatingManual(false);
    }
  };

  const handleDeclareResult = async (winner: string) => {
    if (!id || !selectedMatch) {
      return;
    }

    setDeclaringResult(true);
    try {
      const updated = await declareManualMatchResult(id, selectedMatch.id, winner);
      if (!updated) {
        throw new Error("Declare failed");
      }
      try {
        const rows = await loadGroupMatchTransfers(id, selectedMatch.id);
        setTransfersByMatch((prev) => ({ ...prev, [selectedMatch.id]: rows }));
      } catch {
        setTransfersByMatch((prev) => ({ ...prev, [selectedMatch.id]: [] }));
      }

      try {
        const rows = await loadGroupMatchBetHistory(id, selectedMatch.id);
        setBetHistoryByMatch((prev) => ({ ...prev, [selectedMatch.id]: rows }));
      } catch {
        setBetHistoryByMatch((prev) => ({ ...prev, [selectedMatch.id]: [] }));
      }

      try {
        const rows = await getLeaderboard(id);
        setLeaderboard(rows);
      } catch {
        setLeaderboard([]);
      }

      try {
        const summary = await getSettlementSummary(id);
        setSettlementSummary(summary);
      } catch {
        setSettlementSummary(null);
      }
      toast({ title: "Result declared", description: `${winner} marked as winner.` });
    } catch {
      toast({ title: "Failed", description: "Could not declare result.", variant: "destructive" });
    } finally {
      setDeclaringResult(false);
    }
  };

  const handleUpdateManualBetAmount = async () => {
    if (!id || !selectedMatch || !selectedMatch.isManual) {
      return;
    }

    const parsed = Number(manualBetAmountInput);
    if (!Number.isFinite(parsed) || parsed < 1) {
      toast({ title: "Invalid amount", description: "Enter a bet amount of at least 1.", variant: "destructive" });
      return;
    }

    setUpdatingManualBetAmount(true);
    try {
      const updated = await updateManualMatchBetAmount(id, selectedMatch.id, parsed);
      if (!updated) {
        throw new Error("Update failed");
      }
      await loadGroupMatchBets(id, selectedMatch.id);
      toast({ title: "Bet amount updated", description: `Manual match bet amount set to ${parsed} coins.` });
    } catch {
      toast({ title: "Failed", description: "Could not update manual match bet amount.", variant: "destructive" });
    } finally {
      setUpdatingManualBetAmount(false);
    }
  };

  const netTransfers = useMemo(() => {
    if (!selectedMatchId) {
      return [];
    }

    const rows = transfersByMatch[selectedMatchId] || [];
    const pairMap = new Map();

    for (const row of rows) {
      const key = `${row.fromUserId}->${row.toUserId}`;
      if (!pairMap.has(key)) {
        pairMap.set(key, {
          fromUserName: row.fromUserName,
          toUserName: row.toUserName,
          amount: 0,
        });
      }
      pairMap.get(key).amount += row.amount;
    }

    return Array.from(pairMap.values()).sort((a, b) => b.amount - a.amount);
  }, [selectedMatchId, transfersByMatch]);

  const historyNetTransfers = useMemo(() => {
    if (!historyMatchId) {
      return [];
    }

    const rows = transfersByMatch[historyMatchId] || [];
    const pairMap = new Map();

    for (const row of rows) {
      const key = `${row.fromUserId}->${row.toUserId}`;
      if (!pairMap.has(key)) {
        pairMap.set(key, {
          fromUserName: row.fromUserName,
          toUserName: row.toUserName,
          amount: 0,
        });
      }
      pairMap.get(key).amount += row.amount;
    }

    return Array.from(pairMap.values()).sort((a, b) => b.amount - a.amount);
  }, [historyMatchId, transfersByMatch]);

  const historyRows = useMemo(() => {
    if (!historyMatchId) {
      return [];
    }

    return [...(betHistoryByMatch[historyMatchId] || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [historyMatchId, betHistoryByMatch]);

  const historyPoll = useMemo(() => {
    if (!historyMatch) {
      return [];
    }

    const normalizeTeamName = (value?: string | null) => (value || "").trim().toLowerCase();
    const teamAName = historyMatch.teamA.name;
    const teamBName = historyMatch.teamB.name;
    const teamANormalized = normalizeTeamName(teamAName);
    const teamBNormalized = normalizeTeamName(teamBName);

    const latestPickByUser = new Map<string, BetHistoryEntry>();

    for (const row of historyRows) {
      const existing = latestPickByUser.get(row.userId);
      if (!existing || new Date(row.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
        latestPickByUser.set(row.userId, row);
      }
    }

    const teamAVoters: { userId: string; userName: string }[] = [];
    const teamBVoters: { userId: string; userName: string }[] = [];

    for (const row of latestPickByUser.values()) {
      const picked = normalizeTeamName(row.newTeamSelected);
      const voter = { userId: row.userId, userName: row.userName };

      if (picked === teamANormalized) {
        teamAVoters.push(voter);
      } else if (picked === teamBNormalized) {
        teamBVoters.push(voter);
      }
    }

    const totalVotes = teamAVoters.length + teamBVoters.length;

    return [
      {
        key: "team-a",
        label: teamAName,
        shortName: historyMatch.teamA.shortName,
        votes: teamAVoters.length,
        voters: teamAVoters,
        pct: totalVotes > 0 ? Math.round((teamAVoters.length / totalVotes) * 100) : 0,
      },
      {
        key: "team-b",
        label: teamBName,
        shortName: historyMatch.teamB.shortName,
        votes: teamBVoters.length,
        voters: teamBVoters,
        pct: totalVotes > 0 ? Math.round((teamBVoters.length / totalVotes) * 100) : 0,
      },
    ];
  }, [historyMatch, historyRows]);

  const mySettlement = useMemo(() => {
    if (!user || !settlementSummary) {
      return null;
    }

    return (
      settlementSummary.memberSummaries.find((member) => member.userId === user.id) || null
    );
  }, [settlementSummary, user]);

  if (isResolvingGroup) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8 text-center text-muted-foreground">Loading group...</div>
      </div>
    );
  }

  if (!group || groupMissing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8 text-center text-muted-foreground">Group not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-foreground break-words">{group.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><IndianRupee className="h-4 w-4 text-secondary" />{group.betPrice} coins/match</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4 text-accent" />{group.members.length} members</span>
              </div>
            </div>
            <Button onClick={copyCode} variant="outline" className="border-border/50 gap-2 w-full sm:w-auto">
              <span className="font-mono text-sm">{group.inviteCode}</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="matches" className="space-y-4">
          <div className="overflow-x-auto pb-1">
            <TabsList className="bg-muted/50 border border-border/50 w-max min-w-full">
              <TabsTrigger value="matches" className="font-display font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Matches</TabsTrigger>
              <TabsTrigger value="bet-history" className="font-display font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Bet History</TabsTrigger>
              <TabsTrigger value="members" className="font-display font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Members</TabsTrigger>
              <TabsTrigger value="leaderboard" className="font-display font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Leaderboard</TabsTrigger>
              <TabsTrigger value="settlement" className="font-display font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Settlement</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="matches" className="space-y-4">
            {isOwner ? (
              <div className="flex justify-stretch sm:justify-end">
                <Button onClick={() => setAddManualOpen(true)} className="gap-2 w-full sm:w-auto">
                  <PlusCircle className="h-4 w-4" />
                  Add Manual Match
                </Button>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  groupId={group.id}
                  className="w-full min-w-0 max-w-none md:w-auto md:min-w-[340px]"
                  isViewGroupBetsActive={selectedMatchId === match.id}
                  onViewGroupBets={() => {
                    setSelectedMatchId(match.id);
                    setSelectionClearedByUser(false);
                    navigate(`/match/${match.id}?group=${group.id}`);
                  }}
                />
              ))}
            </div>

            <div className="glass-card rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display font-bold text-lg text-foreground">
                  Bets for Selected Match
                </h3>
                {selectedMatchId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedMatchId(null);
                      setSelectionClearedByUser(true);
                    }}
                  >
                    Unselect
                  </Button>
                ) : null}
              </div>

              {isOwner && selectedMatch?.isManual && selectedMatch.status !== "completed" ? (
                <div className="rounded-lg border border-border/50 p-3 bg-muted/20 space-y-2">
                  <p className="text-sm text-muted-foreground">Declare result for this manual match</p>
                  <div className="rounded-md border border-border/50 p-3 bg-background/40 space-y-2">
                    <p className="text-xs text-muted-foreground">Manual match bet amount (coins)</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={manualBetAmountInput}
                        onChange={(event) => setManualBetAmountInput(event.target.value)}
                        className="sm:max-w-[180px]"
                        placeholder="Enter amount"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleUpdateManualBetAmount}
                        disabled={
                          updatingManualBetAmount ||
                          new Date(selectedMatch.startTime).getTime() - 15 * 60 * 1000 <= Date.now()
                        }
                      >
                        {updatingManualBetAmount ? "Updating..." : "Update Amount"}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Once updated, all existing open bets for this manual match use the new amount.
                    </p>
                  </div>
                  {new Date(selectedMatch.startTime).getTime() > Date.now() ? (
                    <p className="text-xs text-muted-foreground">
                      Result can be declared only after match start time.
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={declaringResult || new Date(selectedMatch.startTime).getTime() > Date.now()}
                      onClick={() => handleDeclareResult(selectedMatch.teamA.name)}
                      className="gap-2"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      {selectedMatch.teamA.shortName} won
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={declaringResult || new Date(selectedMatch.startTime).getTime() > Date.now()}
                      onClick={() => handleDeclareResult(selectedMatch.teamB.name)}
                      className="gap-2"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      {selectedMatch.teamB.shortName} won
                    </Button>
                  </div>
                </div>
              ) : null}

              {selectedMatchId ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead>Member</TableHead>
                        <TableHead>Team Picked</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Placed At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bets
                        .filter((bet) => bet.matchId === selectedMatchId)
                        .map((bet, index) => (
                          <TableRow key={bet.id || `${bet.userId}-${bet.matchId}-${index}`} className="border-border/30 hover:bg-muted/30">
                            <TableCell>{bet.userName || bet.userId}</TableCell>
                            <TableCell>{bet.teamId}</TableCell>
                            <TableCell className="text-right">{bet.amount}</TableCell>
                            <TableCell className="text-right">
                              {new Date(bet.createdAt).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>

                  <div className="space-y-2">
                    <h4 className="font-display font-bold text-base text-foreground">
                      Coin Transfer Calculation (After Result)
                    </h4>

                    {(transfersByMatch[selectedMatchId] || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No transfer rows yet. Transfers appear after match settlement.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border/50 hover:bg-transparent">
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(transfersByMatch[selectedMatchId] || []).map((row, index) => (
                            <TableRow key={row.id || `${row.fromUserId}-${row.toUserId}-${row.createdAt}-${index}`} className="border-border/30 hover:bg-muted/30">
                              <TableCell>{row.fromUserName}</TableCell>
                              <TableCell>{row.toUserName}</TableCell>
                              <TableCell className="text-right">{row.amount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-display font-bold text-base text-foreground">
                      Net Coin Settlement (Who Pays Whom)
                    </h4>

                    {netTransfers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Net settlement will appear after transfers are generated for this match.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border/50 hover:bg-transparent">
                            <TableHead>Payer</TableHead>
                            <TableHead>Receiver</TableHead>
                            <TableHead className="text-right">Net Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {netTransfers.map((row, index) => (
                            <TableRow key={`${row.fromUserName}-${row.toUserName}-${index}`} className="border-border/30 hover:bg-muted/30">
                              <TableCell>{row.fromUserName}</TableCell>
                              <TableCell>{row.toUserName}</TableCell>
                              <TableCell className="text-right">{row.amount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No matches available to inspect bets.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bet-history" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(betHistoryMatches.length > 0 ? betHistoryMatches : allGroupMatches).map((match) => (
                <Button
                  key={`history-${match.id}`}
                  size="sm"
                  variant={historyMatchId === match.id ? "default" : "outline"}
                  onClick={() => {
                    setHistoryMatchId(match.id);
                    setSelectedMatchId(match.id);
                    setSelectionClearedByUser(false);
                  }}
                >
                  {match.teamA.shortName} vs {match.teamB.shortName}
                </Button>
              ))}
            </div>

            <div className="glass-card rounded-xl p-4 space-y-2">
              <h4 className="font-display font-bold text-base text-foreground">Match Result Summary</h4>

              {!historyMatchId || !historyMatch ? (
                <p className="text-sm text-muted-foreground">Select a match to view summary.</p>
              ) : historyMatch.status !== "completed" ? (
                <p className="text-sm text-muted-foreground">Result not declared yet for this match.</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Winner: <span className="font-semibold text-foreground">{historyMatch.winner || "Not available"}</span>
                  </p>

                  {historyNetTransfers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No coin transfers were generated for this result.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead className="text-right">Transferred Coins</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyNetTransfers.map((row, index) => (
                          <TableRow key={`history-summary-${row.fromUserName}-${row.toUserName}-${index}`} className="border-border/30 hover:bg-muted/30">
                            <TableCell>{row.fromUserName}</TableCell>
                            <TableCell>{row.toUserName}</TableCell>
                            <TableCell className="text-right">{row.amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              )}
            </div>

            <div className="glass-card rounded-xl p-4 space-y-4">
              <h4 className="font-display font-bold text-base text-foreground">Poll Snapshot</h4>

              {!historyMatchId || !historyMatch ? (
                <p className="text-sm text-muted-foreground">Select a match to view poll history.</p>
              ) : historyRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bet history yet for this match.</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {historyPoll.map((option) => (
                      <div key={option.key} className="rounded-xl border border-border/60 bg-background/60 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.votes} vote{option.votes === 1 ? "" : "s"}</p>
                          </div>
                          <span className="text-sm font-bold text-foreground">{option.pct}%</span>
                        </div>

                        <div className="mt-2 h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${option.pct}%` }} />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {option.voters.length === 0 ? (
                            <span className="text-[11px] text-muted-foreground">No votes yet</span>
                          ) : (
                            option.voters.map((voter) => {
                              const initials = voter.userName
                                .split(/\s+/)
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0]?.toUpperCase() || "")
                                .join("") || "U";

                              return (
                                <span
                                  key={`${option.key}-${voter.userId}`}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[11px] text-foreground"
                                >
                                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[9px] font-semibold text-primary">
                                    {initials}
                                  </span>
                                  <span className="max-w-[120px] truncate">{voter.userName}</span>
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-display font-bold text-sm text-foreground">Bet Activity</h5>
                    <div className="space-y-2">
                      {historyRows.map((row, index) => (
                        <div
                          key={row.id || `${row.userId}-${row.createdAt}-${index}`}
                          className="rounded-lg border border-border/50 bg-muted/20 p-3"
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <p className="text-sm font-medium text-foreground">{row.userName}</p>
                            <p className="text-[11px] text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 capitalize">
                            {row.action} pick: <span className="text-foreground">{row.newTeamSelected}</span>
                            {row.previousTeamSelected ? (
                              <>
                                {" "}(was <span className="text-foreground">{row.previousTeamSelected}</span>)
                              </>
                            ) : null}
                          </p>
                          <p className="text-xs text-secondary mt-1">Stake: {row.amount} coins</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="members">
            <div className="glass-card rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Player</TableHead>
                    <TableHead className="text-right text-muted-foreground">Level</TableHead>
                    <TableHead className="text-right text-muted-foreground">Coins</TableHead>
                    <TableHead className="text-right text-muted-foreground">Wins</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.members.map((m) => (
                    <TableRow
                      key={m.userId}
                      className="border-border/30 hover:bg-muted/30 cursor-pointer"
                      onClick={() => openMemberProfile(m.userId)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {m.avatar ? (
                            <img
                              src={m.avatar}
                              alt={m.name}
                              className="h-9 w-9 rounded-full object-cover border border-border/60"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full border border-border/60 bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                              {m.name
                                .split(/\s+/)
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0]?.toUpperCase() || "")
                                .join("") || "U"}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">{m.name}</p>
                            <p className="text-[11px] text-muted-foreground">{m.totalBets} bets</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-foreground font-semibold">L{m.level}</TableCell>
                      <TableCell className="text-right text-secondary font-bold">{m.coins.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-success font-medium">{m.wins}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <LeaderboardTable entries={leaderboard} />
          </TabsContent>

          <TabsContent value="settlement" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                <p className="text-xs text-muted-foreground">Your Incoming</p>
                <p className="text-xl font-bold text-success">{mySettlement?.incoming ?? 0}</p>
              </div>
              <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                <p className="text-xs text-muted-foreground">Your Outgoing</p>
                <p className="text-xl font-bold text-destructive">{mySettlement?.outgoing ?? 0}</p>
              </div>
              <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                <p className="text-xs text-muted-foreground">Your Net</p>
                <p
                  className={`text-xl font-bold ${
                    (mySettlement?.net ?? 0) > 0
                      ? "text-success"
                      : (mySettlement?.net ?? 0) < 0
                        ? "text-destructive"
                        : "text-foreground"
                  }`}
                >
                  {mySettlement?.net ?? 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                <p className="text-xs text-muted-foreground">Transfer Rows</p>
                <p className="text-xl font-bold text-foreground">{settlementSummary?.totals.transferCount ?? 0}</p>
              </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Member</TableHead>
                    <TableHead className="text-right">Incoming</TableHead>
                    <TableHead className="text-right">Outgoing</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(settlementSummary?.memberSummaries || []).map((member) => (
                    <TableRow key={member.userId} className="border-border/30 hover:bg-muted/30">
                      <TableCell>{member.name}</TableCell>
                      <TableCell className="text-right text-success">{member.incoming}</TableCell>
                      <TableCell className="text-right text-destructive">{member.outgoing}</TableCell>
                      <TableCell className={`text-right font-semibold ${member.net > 0 ? "text-success" : member.net < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {member.net}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {(settlementSummary?.memberSummaries || []).length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">No settlement data yet for this group.</p>
              ) : null}
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border/50">
                <h4 className="font-display font-bold text-base text-foreground">Who Pays Whom</h4>
                <p className="text-xs text-muted-foreground mt-1">Minimal payment instructions based on net balances.</p>
              </div>

              {(settlementSummary?.paymentInstructions || []).length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">All members are settled. No payments pending.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead>Payer</TableHead>
                      <TableHead>Receiver</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(settlementSummary?.paymentInstructions || []).map((row, index) => (
                      <TableRow key={`${row.fromUserId}-${row.toUserId}-${index}`} className="border-border/30 hover:bg-muted/30">
                        <TableCell>{row.fromUserName}</TableCell>
                        <TableCell>{row.toUserName}</TableCell>
                        <TableCell className="text-right font-semibold">{row.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={addManualOpen} onOpenChange={setAddManualOpen}>
          <DialogContent className="glass-card border-border/50 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Manual Match</DialogTitle>
              <DialogDescription>
                Only group owner can add and settle manual matches.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateManualMatch} className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Team A</label>
                <Input
                  value={manualTeamA}
                  onChange={(event) => setManualTeamA(event.target.value)}
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Team B</label>
                <Input
                  value={manualTeamB}
                  onChange={(event) => setManualTeamB(event.target.value)}
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Start Time</label>
                <Input
                  type="datetime-local"
                  value={manualStartTime}
                  onChange={(event) => setManualStartTime(event.target.value)}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddManualOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creatingManual}>
                  {creatingManual ? "Adding..." : "Add Match"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={memberProfileOpen}
          onOpenChange={(open) => {
            setMemberProfileOpen(open);
            if (!open) {
              setSelectedMemberProfile(null);
            }
          }}
        >
          <DialogContent className="glass-card border-border/50 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Member Profile</DialogTitle>
              <DialogDescription>Detailed profile within your shared groups.</DialogDescription>
            </DialogHeader>

            {memberProfileLoading ? (
              <p className="text-sm text-muted-foreground">Loading profile...</p>
            ) : !selectedMemberProfile ? (
              <p className="text-sm text-muted-foreground">Profile unavailable.</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 p-4">
                  <div className="flex items-center gap-3">
                    {selectedMemberProfile.avatar ? (
                      <img
                        src={selectedMemberProfile.avatar}
                        alt={selectedMemberProfile.name}
                        className="h-16 w-16 rounded-full object-cover border border-border/60 shadow-[0_0_0_3px_hsl(var(--background)/0.5)]"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full border border-border/60 bg-primary/10 text-primary font-bold flex items-center justify-center">
                        {selectedMemberProfile.name
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase() || "")
                          .join("") || "U"}
                      </div>
                    )}
                    <div>
                      <p className="font-display font-bold text-lg text-foreground">{selectedMemberProfile.name}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Member Snapshot</p>
                    </div>
                    <span className="ml-auto rounded-full border border-primary/30 bg-background/50 px-2.5 py-1 text-xs font-semibold text-foreground">
                      Level {selectedMemberProfile.level}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-border/50 p-3 bg-muted/20 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    <span>Level Progress</span>
                    <span>{Math.round(Math.max(0, Math.min(100, selectedMemberProfile.levelProgressPercent)))}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-background/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-secondary transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, selectedMemberProfile.levelProgressPercent))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{selectedMemberProfile.levelStart} bets</span>
                    <span>{selectedMemberProfile.nextLevelTarget} bets</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Coins</p>
                    <p className="text-base font-bold text-foreground">{selectedMemberProfile.coins.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Groups</p>
                    <p className="text-base font-bold text-foreground">{selectedMemberProfile.totalGroups}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Total Bets</p>
                    <p className="text-base font-bold text-foreground">{selectedMemberProfile.totalBets}</p>
                  </div>
                </div>

                {selectedMemberProfile.favoriteIplTeam ? (
                  <div className="rounded-lg border border-border/50 p-3 bg-muted/20 flex items-center gap-2">
                    {selectedMemberProfile.favoriteIplTeamLogo ? (
                      <img
                        src={selectedMemberProfile.favoriteIplTeamLogo}
                        alt={selectedMemberProfile.favoriteIplTeam}
                        className="h-5 w-5 object-contain"
                      />
                    ) : null}
                    <p className="text-sm text-muted-foreground">
                      Favorite IPL Team: <span className="text-foreground font-medium">{selectedMemberProfile.favoriteIplTeam}</span>
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default GroupDetail;
