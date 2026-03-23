import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import MatchCard from "@/components/MatchCard";
import GroupCard from "@/components/GroupCard";
import { useMatchStore } from "@/store/matchStore";
import { useGroupStore } from "@/store/groupStore";

const Dashboard = () => {
  const { matches, loadMatches } = useMatchStore();
  const { groups, loadGroups } = useGroupStore();

  useEffect(() => {
    loadMatches({ includeManual: false }).catch(() => undefined);
    loadGroups().catch(() => undefined);
  }, [loadMatches, loadGroups]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-6 space-y-8">
        {/* Upcoming Matches */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-foreground">Upcoming Matches</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {matches
              .filter((m) => m.status === "upcoming")
              .map((match) => (
                <MatchCard key={match.id} match={match} actionMode="schedule" />
              ))}
          </div>
        </motion.section>

        {/* Your Groups */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-foreground">👥 Your Groups</h2>
            <div className="flex gap-2">
              <Link to="/groups/join">
                <Button variant="outline" size="sm" className="border-border/50 text-foreground">
                  <UserPlus className="h-4 w-4 mr-1" /> Join
                </Button>
              </Link>
              <Link to="/groups/create">
                <Button size="sm" className="gradient-primary text-primary-foreground">
                  <Plus className="h-4 w-4 mr-1" /> Create
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
            {groups.length === 0 && (
              <div className="glass-card rounded-xl p-8 text-center col-span-full">
                <p className="text-muted-foreground">No groups yet. Create or join one!</p>
              </div>
            )}
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default Dashboard;
