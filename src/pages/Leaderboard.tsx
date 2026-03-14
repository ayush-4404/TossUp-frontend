import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import LeaderboardTable from "@/components/LeaderboardTable";
import { useGroupStore } from "@/store/groupStore";
import type { LeaderboardEntry } from "@/lib/types";

const Leaderboard = () => {
  const { groups, loadGroups, getLeaderboard } = useGroupStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadGroups().catch(() => undefined);
  }, [loadGroups]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (groups.length === 0) {
        setEntries([]);
        return;
      }

      try {
        const rows = await getLeaderboard(groups[0].id);
        setEntries(rows);
      } catch {
        setEntries([]);
      }
    };

    fetchLeaderboard();
  }, [groups, getLeaderboard]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-bold text-3xl text-foreground mb-6 text-center">🏆 Global Leaderboard</h1>
          <LeaderboardTable entries={entries} />
        </motion.div>
      </main>
    </div>
  );
};

export default Leaderboard;
