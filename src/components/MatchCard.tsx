import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import CountdownTimer from "./CountdownTimer";
import type { Match } from "@/lib/types";

interface MatchCardProps {
  match: Match;
  groupId?: string;
}

const MatchCard = ({ match, groupId }: MatchCardProps) => {
  const navigate = useNavigate();

  const handleBet = () => {
    const path = groupId ? `/match/${match.id}?group=${groupId}` : `/match/${match.id}`;
    navigate(path);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="glass-card rounded-xl p-4 min-w-[300px] md:min-w-[340px]"
    >
      <div className="text-xs text-muted-foreground mb-3 text-center">{match.venue}</div>

      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Team A */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-3xl">{match.teamA.logo}</span>
          <span className="font-display font-bold text-sm text-foreground">{match.teamA.shortName}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-muted-foreground tracking-widest">VS</span>
        </div>

        {/* Team B */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-3xl">{match.teamB.logo}</span>
          <span className="font-display font-bold text-sm text-foreground">{match.teamB.shortName}</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <CountdownTimer targetTime={match.startTime} />
        <Button
          onClick={handleBet}
          className="w-full gradient-primary text-primary-foreground font-display font-bold tracking-wide hover:opacity-90 transition-opacity"
          size="sm"
        >
          Place Bet
        </Button>
      </div>
    </motion.div>
  );
};

export default MatchCard;
