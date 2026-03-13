import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Team } from "@/lib/types";

interface ConfirmBetModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  team: Team | null;
  amount: number;
  loading?: boolean;
}

const ConfirmBetModal = ({ open, onClose, onConfirm, team, amount, loading }: ConfirmBetModalProps) => {
  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card border-border/50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">Confirm Your Bet</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <span className="text-5xl">{team.logo}</span>
          <span className="font-display font-bold text-lg text-foreground">{team.name}</span>
          <div className="bg-muted rounded-lg px-6 py-3 text-center">
            <span className="text-sm text-muted-foreground">Bet Amount</span>
            <div className="text-2xl font-bold text-secondary">{amount} coins</div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="border-border/50">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="gradient-primary text-primary-foreground font-display font-bold"
          >
            {loading ? "Placing..." : "Confirm Bet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmBetModal;
