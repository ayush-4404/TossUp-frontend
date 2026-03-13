import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import CountdownTimer from "@/components/CountdownTimer";
import ConfirmBetModal from "@/components/ConfirmBetModal";
import { useMatchStore } from "@/store/matchStore";
import { useGroupStore } from "@/store/groupStore";
import { useUserStore } from "@/store/userStore";
import { toast } from "@/hooks/use-toast";
import type { Team } from "@/lib/types";

const MatchBetting = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get("group") || "";

  const { matches, loadMatches, placeBet } = useMatchStore();
  const { groups, loadGroups } = useGroupStore();
  const { updateCoins } = useUserStore();

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bettingClosed, setBettingClosed] = useState(false);

  useEffect(() => {
    if (matches.length === 0) loadMatches();
    if (groups.length === 0) loadGroups();
  }, [matches.length, groups.length, loadMatches, loadGroups]);

  const match = matches.find((m) => m.id === id);
  const group = groups.find((g) => g.id === groupId);
  const betAmount = group?.betPrice || 100;

  // Check if betting is closed (< 15 min)
  useEffect(() => {
    if (!match) return;
    const check = () => {
      const diff = new Date(match.startTime).getTime() - Date.now();
      setBettingClosed(diff < 15 * 60 * 1000);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [match]);

  const handleConfirm = async () => {
    if (!selectedTeam || !match) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    placeBet(match.id, groupId, selectedTeam.id, betAmount);
    updateCoins(-betAmount);
    setLoading(false);
    setShowConfirm(false);
    toast({ title: "Bet Placed! 🎉", description: `You bet ${betAmount} coins on ${selectedTeam.shortName}` });
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
              <span className="text-6xl">{match.teamA.logo}</span>
              <span className="font-display font-bold text-xl text-foreground">{match.teamA.shortName}</span>
              <span className="text-xs text-muted-foreground">{match.teamA.name}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="font-display font-bold text-2xl text-muted-foreground">VS</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-6xl">{match.teamB.logo}</span>
              <span className="font-display font-bold text-xl text-foreground">{match.teamB.shortName}</span>
              <span className="text-xs text-muted-foreground">{match.teamB.name}</span>
            </div>
          </div>

          <CountdownTimer targetTime={match.startTime} className="justify-center" />
        </motion.div>

        {/* Betting Section */}
        {bettingClosed ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-secondary mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-foreground mb-2">Betting Closed</h2>
            <p className="text-muted-foreground">Betting closes 15 minutes before match start.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
            <h2 className="font-display font-bold text-xl text-foreground text-center">Place Your Bet</h2>
            <p className="text-center text-muted-foreground text-sm">Bet Amount: <span className="text-secondary font-bold">{betAmount} coins</span></p>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setSelectedTeam(match.teamA)}
                variant="outline"
                className={`h-32 flex flex-col gap-2 rounded-xl border-2 transition-all ${
                  selectedTeam?.id === match.teamA.id
                    ? "border-primary bg-primary/10 glow-primary"
                    : "border-border/50 hover:border-primary/50"
                }`}
              >
                <span className="text-4xl">{match.teamA.logo}</span>
                <span className="font-display font-bold text-foreground">{match.teamA.shortName}</span>
              </Button>

              <Button
                onClick={() => setSelectedTeam(match.teamB)}
                variant="outline"
                className={`h-32 flex flex-col gap-2 rounded-xl border-2 transition-all ${
                  selectedTeam?.id === match.teamB.id
                    ? "border-secondary bg-secondary/10 glow-secondary"
                    : "border-border/50 hover:border-secondary/50"
                }`}
              >
                <span className="text-4xl">{match.teamB.logo}</span>
                <span className="font-display font-bold text-foreground">{match.teamB.shortName}</span>
              </Button>
            </div>

            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!selectedTeam}
              className="w-full gradient-primary text-primary-foreground font-display font-bold h-14 text-lg"
            >
              Confirm Bet
            </Button>
          </motion.div>
        )}

        <ConfirmBetModal
          open={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
          team={selectedTeam}
          amount={betAmount}
          loading={loading}
        />
      </main>
    </div>
  );
};

export default MatchBetting;
