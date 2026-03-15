import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import CountdownTimer from "@/components/CountdownTimer";
import TeamLogo from "@/components/TeamLogo";
import { useMatchStore } from "@/store/matchStore";
import { useGroupStore } from "@/store/groupStore";
import { useUserStore } from "@/store/userStore";
import { toast } from "@/hooks/use-toast";
import type { Team } from "@/lib/types";

const MatchBetting = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get("group") || "";

  const { matches, bets, loadMatches, placeBet, loadGroupMatchBets } = useMatchStore();
  const { groups, loadGroups } = useGroupStore();
  const { user } = useUserStore();

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [bettingClosed, setBettingClosed] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(0);

  useEffect(() => {
    if (matches.length === 0) {
      loadMatches().catch(() => undefined);
    }
    if (groups.length === 0) {
      loadGroups().catch(() => undefined);
    }
  }, [matches.length, groups.length, loadMatches, loadGroups]);

  const match = matches.find((m) => m.id === id);
  const group = groups.find((g) => g.id === groupId);
  const betAmount = group?.betPrice || 100;
  const matchBets = useMemo(
    () => bets.filter((bet) => bet.groupId === groupId && bet.matchId === id),
    [bets, groupId, id]
  );
  const myExistingBet = useMemo(
    () => matchBets.find((bet) => bet.userId === user?.id),
    [matchBets, user?.id]
  );

  // Check if betting is closed (< 15 min)
  useEffect(() => {
    if (!match) return;
    const check = () => {
      const diff = new Date(match.startTime).getTime() - Date.now();
      setBettingClosed(diff < 15 * 60 * 1000);
      setRemainingMinutes(Math.max(0, Math.floor(diff / 60000)));
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [match]);

  useEffect(() => {
    if (!groupId || !id) {
      return;
    }
    loadGroupMatchBets(groupId, id).catch(() => undefined);
  }, [groupId, id, loadGroupMatchBets]);

  useEffect(() => {
    if (!myExistingBet || !match) {
      return;
    }

    setSelectedTeam(myExistingBet.teamId === match.teamA.name ? match.teamA : match.teamB);
  }, [myExistingBet, match]);

  const totalVotes = matchBets.length;
  const teamAVotes = matchBets.filter((bet) => bet.teamId === match?.teamA.name).length;
  const teamBVotes = matchBets.filter((bet) => bet.teamId === match?.teamB.name).length;

  const handleConfirm = async () => {
    if (!selectedTeam || !match) return;

    if (!groupId) {
      toast({
        title: "Select a group",
        description: "Open betting from a group match card to place your vote.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await placeBet(match.id, groupId, selectedTeam.name, betAmount);
      await loadGroupMatchBets(groupId, match.id);
      toast({
        title: myExistingBet ? "Vote changed" : "Vote submitted",
        description: `You selected ${selectedTeam.shortName} for ${betAmount} coins.`,
      });
    } catch {
      toast({ title: "Error", description: "Failed to place bet.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8 text-center text-muted-foreground">Match not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-2xl mx-auto">
        {/* Match Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-8 text-center mb-6">
          <p className="text-xs text-muted-foreground mb-4">{match.venue}</p>

          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="flex flex-col items-center gap-2">
              <TeamLogo logo={match.teamA.logo} name={match.teamA.name} shortName={match.teamA.shortName} className="h-20 w-20" />
              <span className="font-display font-bold text-xl text-foreground">{match.teamA.shortName}</span>
              <span className="text-xs text-muted-foreground">{match.teamA.name}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="font-display font-bold text-2xl text-muted-foreground">VS</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <TeamLogo logo={match.teamB.logo} name={match.teamB.name} shortName={match.teamB.shortName} className="h-20 w-20" />
              <span className="font-display font-bold text-xl text-foreground">{match.teamB.shortName}</span>
              <span className="text-xs text-muted-foreground">{match.teamB.name}</span>
            </div>
          </div>

          <CountdownTimer targetTime={match.startTime} className="justify-center" />
        </motion.div>

        {/* Poll-style Betting Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-xl text-foreground">Who will win?</h2>
                <p className="text-sm text-muted-foreground">
                  Bet Amount: <span className="text-secondary font-bold">{betAmount} coins</span>
                </p>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {remainingMinutes} min left
              </div>
            </div>

            {[match.teamA, match.teamB].map((team, index) => {
              const votes = index === 0 ? teamAVotes : teamBVotes;
              const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
              const isSelected = selectedTeam?.id === team.id;

              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => {
                    if (!bettingClosed) {
                      setSelectedTeam(team);
                    }
                  }}
                  disabled={bettingClosed}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border/60 bg-background/70 hover:border-primary/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-primary" : "border-muted-foreground/50"}`}>
                        {isSelected ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
                      </div>
                      <TeamLogo logo={team.logo} name={team.name} shortName={team.shortName} className="h-10 w-10" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{team.name}</p>
                        <p className="text-xs text-muted-foreground">{votes} vote{votes === 1 ? "" : "s"}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground">{pct}%</span>
                  </div>

                  <div className="mt-2 h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className={`h-full transition-all ${isSelected ? "bg-primary" : "bg-muted-foreground/40"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}

            {myExistingBet ? (
              <p className="text-xs text-muted-foreground">
                Your current vote: <span className="font-semibold text-foreground">{myExistingBet.teamId}</span>. You can change it until 15 minutes before kickoff.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">You have not voted yet in this group for this match.</p>
            )}
          </div>

          {bettingClosed ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
              <p className="text-sm font-medium text-foreground">Betting is closed.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Final poll is visible. Selections cannot be changed now.
              </p>
            </div>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={!selectedTeam || loading || !groupId || myExistingBet?.teamId === selectedTeam?.name}
              className="w-full gradient-primary text-primary-foreground font-display font-bold h-14 text-lg"
            >
              {loading
                ? "Saving..."
                : myExistingBet
                  ? myExistingBet.teamId === selectedTeam?.name
                    ? "Already Selected"
                    : "Change Vote"
                  : "Submit Vote"}
            </Button>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default MatchBetting;
