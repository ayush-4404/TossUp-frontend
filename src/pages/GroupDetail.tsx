import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, Coins, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import MatchCard from "@/components/MatchCard";
import LeaderboardTable from "@/components/LeaderboardTable";
import { useGroupStore } from "@/store/groupStore";
import { useMatchStore } from "@/store/matchStore";
import { toast } from "@/hooks/use-toast";
import type { BetHistoryEntry, CoinTransfer, LeaderboardEntry } from "@/lib/types";

const GroupDetail = () => {
  const { id } = useParams();
  const { groups, loadGroups } = useGroupStore();
  const {
    matches,
    bets,
    loadMatches,
    loadGroupBets,
    loadGroupMatchTransfers,
    loadGroupMatchBetHistory,
  } = useMatchStore();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [transfersByMatch, setTransfersByMatch] = useState<Record<string, CoinTransfer[]>>({});
  const [betHistoryByMatch, setBetHistoryByMatch] = useState<Record<string, BetHistoryEntry[]>>({});

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

  const groupMatches = useMemo(() => matches.filter((m) => m.status === "upcoming"), [matches]);

  useEffect(() => {
    if (!selectedMatchId && groupMatches.length > 0) {
      setSelectedMatchId(groupMatches[0].id);
    }
  }, [groupMatches, selectedMatchId]);

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

  const group = groups.find((g) => g.id === id);

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8 text-center text-muted-foreground">Group not found.</div>
      </div>
    );
  }

  const leaderboard: LeaderboardEntry[] = [...group.members]
    .sort((a, b) => b.coins - a.coins)
    .map((m, i) => ({ rank: i + 1, userId: m.userId, name: m.name, coins: m.coins, wins: m.wins, losses: m.losses }));

  const copyCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    toast({ title: "Copied!" });
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupMatches.map((match) => (
                <div key={match.id} className="space-y-2">
                  <MatchCard match={match} groupId={group.id} />
                  <Button
                    variant={selectedMatchId === match.id ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setSelectedMatchId(match.id)}
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
                        .map((bet) => (
                          <TableRow key={bet.id} className="border-border/30 hover:bg-muted/30">
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
                          {(transfersByMatch[selectedMatchId] || []).map((row) => (
                            <TableRow key={row.id} className="border-border/30 hover:bg-muted/30">
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
              {groupMatches.map((match) => (
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
                  {(selectedMatchId ? betHistoryByMatch[selectedMatchId] || [] : []).map((row) => (
                    <TableRow key={row.id} className="border-border/30 hover:bg-muted/30">
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
      </main>
    </div>
  );
};

export default GroupDetail;
