import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Coins, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { Group } from "@/lib/types";

interface GroupCardProps {
  group: Group;
}

const GroupCard = ({ group }: GroupCardProps) => {
  const navigate = useNavigate();

  const copyCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    toast({ title: "Copied!", description: "Invite code copied to clipboard." });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="glass-card rounded-xl p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-display font-bold text-lg text-foreground">{group.name}</h3>
        <button onClick={copyCode} className="text-muted-foreground hover:text-foreground transition-colors">
          <Copy className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1">
          <Coins className="h-4 w-4 text-secondary" />
          <span>{group.betPrice} / match</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-accent" />
          <span>{group.members.length} members</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
          {group.inviteCode}
        </span>
        <Button
          onClick={() => navigate(`/groups/${group.id}`)}
          variant="outline"
          size="sm"
          className="font-display font-bold border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
        >
          Open Group
        </Button>
      </div>
    </motion.div>
  );
};

export default GroupCard;
