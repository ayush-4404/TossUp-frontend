import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import GroupCard from "@/components/GroupCard";
import { useGroupStore } from "@/store/groupStore";

const Groups = () => {
  const { groups, loadGroups } = useGroupStore();

  useEffect(() => {
    if (groups.length === 0) loadGroups();
  }, [groups.length, loadGroups]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display font-bold text-3xl text-foreground">Your Groups</h1>
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
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Groups;
