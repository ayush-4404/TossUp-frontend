import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import CountdownTimer from "./CountdownTimer";
import TeamLogo from "./TeamLogo";
import type { Match } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  match: Match;
  groupId?: string;
  className?: string;
  actionMode?: "bet" | "schedule";
  onViewGroupBets?: () => void;
  isViewGroupBetsActive?: boolean;
}

const MatchCard = ({
  match,
  groupId,
  className,
  actionMode = "bet",
  onViewGroupBets,
  isViewGroupBetsActive = false,
}: MatchCardProps) => {
  const navigate = useNavigate();

  const handleBet = () => {
    if (actionMode !== "bet") {
      return;
    }

    const path = groupId ? `/match/${match.id}?group=${groupId}` : `/match/${match.id}`;
    navigate(path);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "glass-card rounded-xl p-4 w-[84vw] min-w-[260px] max-w-[320px] md:w-auto md:min-w-[340px] md:max-w-none",
        className
      )}
    >
      <div className="text-xs text-muted-foreground mb-3 text-center">{match.venue}</div>

      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Team A */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <TeamLogo logo={match.teamA.logo} name={match.teamA.name} shortName={match.teamA.shortName} className="h-12 w-12" />
          <span className="font-display font-bold text-sm text-foreground">{match.teamA.shortName}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-muted-foreground tracking-widest">VS</span>
        </div>

        {/* Team B */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <TeamLogo logo={match.teamB.logo} name={match.teamB.name} shortName={match.teamB.shortName} className="h-12 w-12" />
          <span className="font-display font-bold text-sm text-foreground">{match.teamB.shortName}</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <CountdownTimer targetTime={match.startTime} />
        {actionMode === "bet" ? (
          <div className="w-full space-y-2">
            <Button
              onClick={handleBet}
              className="w-full gradient-primary text-primary-foreground font-display font-bold tracking-wide hover:opacity-90 transition-opacity"
              size="sm"
            >
              Place Bet
            </Button>
            {onViewGroupBets ? (
              <Button
                variant={isViewGroupBetsActive ? "default" : "outline"}
                className="w-full"
                size="sm"
                onClick={onViewGroupBets}
              >
                View Group Bets
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="w-full rounded-md border border-border/50 bg-muted/30 py-2 text-center text-xs font-semibold tracking-wide text-muted-foreground">
            Schedule Only
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MatchCard;
