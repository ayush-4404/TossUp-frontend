import { Trophy, Medal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LeaderboardEntry } from "@/lib/types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  compact?: boolean;
}

const getMedalColor = (rank: number) => {
  if (rank === 1) return "text-gold";
  if (rank === 2) return "text-silver";
  if (rank === 3) return "text-bronze";
  return "text-muted-foreground";
};

const LeaderboardTable = ({ entries, compact = false }: LeaderboardTableProps) => {
  const displayEntries = compact ? entries.slice(0, 5) : entries;
  const formatSigned = (value: number) => {
    const rounded = Math.round(value * 100) / 100;
    if (rounded > 0) {
      return `+${rounded.toLocaleString()}`;
    }
    return rounded.toLocaleString();
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="w-12 text-muted-foreground">Rank</TableHead>
            <TableHead className="text-muted-foreground">Player</TableHead>
            <TableHead className="text-right text-muted-foreground">Net Coins</TableHead>
            {!compact && (
              <>
                <TableHead className="text-right text-muted-foreground">Wins</TableHead>
                <TableHead className="text-right text-muted-foreground">Losses</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayEntries.map((entry) => (
            <TableRow key={entry.userId} className="border-border/30 hover:bg-muted/30">
              <TableCell>
                {entry.rank <= 3 ? (
                  <Medal className={`h-5 w-5 ${getMedalColor(entry.rank)}`} />
                ) : (
                  <span className="text-muted-foreground font-mono text-sm pl-0.5">{entry.rank}</span>
                )}
              </TableCell>
              <TableCell className="font-medium text-foreground">{entry.name}</TableCell>
              <TableCell className="text-right">
                <span className={`font-bold ${entry.netCoins >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatSigned(entry.netCoins)}
                </span>
              </TableCell>
              {!compact && (
                <>
                  <TableCell className="text-right text-success font-medium">{entry.wins}</TableCell>
                  <TableCell className="text-right text-destructive font-medium">{entry.losses}</TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeaderboardTable;
