import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import LeaderboardTable from "@/components/LeaderboardTable";
import { mockLeaderboard } from "@/lib/mockData";

const Leaderboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-bold text-3xl text-foreground mb-6 text-center">🏆 Global Leaderboard</h1>
          <LeaderboardTable entries={mockLeaderboard} />
        </motion.div>
      </main>
    </div>
  );
};

export default Leaderboard;
