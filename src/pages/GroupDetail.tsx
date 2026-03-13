import { useEffect } from "react";
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
import type { LeaderboardEntry } from "@/lib/types";

const GroupDetail = () => {
  const { id } = useParams();
  const { groups, loadGroups } = useGroupStore();
  const { matches, loadMatches } = useMatchStore();

  useEffect(() => {
    if (groups.length === 0) loadGroups();
    if (matches.length === 0) loadMatches();
  }, [groups.length, matches.length, loadGroups, loadMatches]);

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
            <TabsTrigger value="members" className="font-display font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Members</TabsTrigger>
            <TabsTrigger value="leaderboard" className="font-display font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.filter((m) => m.status === "upcoming").map((match) => (
                <MatchCard key={match.id} match={match} groupId={group.id} />
              ))}
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
