import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, Coins, Users, PlusCircle, Flag } from "lucide-react";
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
import type { BetHistoryEntry, CoinTransfer, LeaderboardEntry } from "@/lib/types";

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { groups, loadGroups, getLeaderboard } = useGroupStore();
  const {
    matches,
    bets,
    loadMatches,
    createManualMatch,
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
  const [manualTeamA, setManualTeamA] = useState("");
  const [manualTeamB, setManualTeamB] = useState("");
  const [manualStartTime, setManualStartTime] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (groups.length === 0) {
      loadGroups().catch(() => undefined);
    }
    if (matches.length === 0) {
      loadMatches().catch(() => undefined);
    }
  }, [groups.length, matches.length, loadGroups, loadMatches]);

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
    if (!selectedMatchId && betHistoryMatches.length > 0) {
      setSelectedMatchId(betHistoryMatches[0].id);
      return;
    }

    if (!selectedMatchId && groupMatches.length > 0) {
      setSelectedMatchId(groupMatches[0].id);
      return;
    }

    if (!selectedMatchId && allGroupMatches.length > 0) {
      setSelectedMatchId(allGroupMatches[0].id);
    }
  }, [betHistoryMatches, groupMatches, allGroupMatches, selectedMatchId]);

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

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8 text-center text-muted-foreground">Group not found.</div>
      </div>
    );
  }

  const copyCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    toast({ title: "Copied!" });
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
      toast({ title: "Result declared", description: `${winner} marked as winner.` });
    } catch {
      toast({ title: "Failed", description: "Could not declare result.", variant: "destructive" });
    } finally {
      setDeclaringResult(false);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">{group.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Coins className="h-4 w-4 text-secondary" />{group.betPrice} coins/match</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4 text-accent" />{group.members.length} members</span>
              </div>
            </div>
            <Button onClick={copyCode} variant="outline" className="border-border/50 gap-2">
              <span className="font-mono text-sm">{group.inviteCode}</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="matches" className="space-y-4">
          <TabsList className="bg-muted/50 border border-border/50">
            <TabsTrigger value="matches" className="font-display font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Matches</TabsTrigger>
            <TabsTrigger value="bet-history" className="font-display font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Bet History</TabsTrigger>
            <TabsTrigger value="members" className="font-display font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Members</TabsTrigger>
            <TabsTrigger value="leaderboard" className="font-display font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="space-y-4">
            {isOwner ? (
              <div className="flex justify-end">
                <Button onClick={() => setAddManualOpen(true)} className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Add Manual Match
                </Button>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupMatches.map((match) => (
                <div key={match.id} className="space-y-2">
                  <MatchCard match={match} groupId={group.id} />
                  <Button
                    variant={selectedMatchId === match.id ? "default" : "outline"}
                    className="w-full"
                    onClick={() => navigate(`/match/${match.id}?group=${group.id}`)}
                  >
                    View Group Bets
                  </Button>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-xl p-4 space-y-4">
              <h3 className="font-display font-bold text-lg text-foreground">
                Bets for Selected Match
              </h3>

              {isOwner && selectedMatch?.isManual && selectedMatch.status !== "completed" ? (
                <div className="rounded-lg border border-border/50 p-3 bg-muted/20 space-y-2">
                  <p className="text-sm text-muted-foreground">Declare result for this manual match</p>
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
                  variant={selectedMatchId === match.id ? "default" : "outline"}
                  onClick={() => setSelectedMatchId(match.id)}
                >
                  {match.teamA.shortName} vs {match.teamB.shortName}
                </Button>
              ))}
            </div>

            <div className="glass-card rounded-xl p-4 space-y-2">
              <h4 className="font-display font-bold text-base text-foreground">Match Result Summary</h4>

              {!selectedMatchId || !selectedMatch ? (
                <p className="text-sm text-muted-foreground">Select a match to view summary.</p>
              ) : selectedMatch.status !== "completed" ? (
                <p className="text-sm text-muted-foreground">Result not declared yet for this match.</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Winner: <span className="font-semibold text-foreground">{selectedMatch.winner || "Not available"}</span>
                  </p>

                  {netTransfers.length === 0 ? (
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
                        {netTransfers.map((row, index) => (
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

            <div className="glass-card rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Time</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Previous Pick</TableHead>
                    <TableHead>New Pick</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(selectedMatchId ? betHistoryByMatch[selectedMatchId] || [] : []).map((row, index) => (
                    <TableRow key={row.id || `${row.userId}-${row.createdAt}-${index}`} className="border-border/30 hover:bg-muted/30">
                      <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{row.userName}</TableCell>
                      <TableCell className="capitalize">{row.action}</TableCell>
                      <TableCell>{row.previousTeamSelected || "-"}</TableCell>
                      <TableCell>{row.newTeamSelected}</TableCell>
                      <TableCell className="text-right">{row.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {selectedMatchId && (betHistoryByMatch[selectedMatchId] || []).length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">No bet history yet for this match.</p>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="members">
            <div className="glass-card rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Player</TableHead>
                    <TableHead className="text-right text-muted-foreground">Coins</TableHead>
                    <TableHead className="text-right text-muted-foreground">Wins</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.members.map((m) => (
                    <TableRow key={m.userId} className="border-border/30 hover:bg-muted/30">
                      <TableCell className="font-medium text-foreground">{m.name}</TableCell>
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
      </main>
    </div>
  );
};

export default GroupDetail;
