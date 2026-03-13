import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { useGroupStore } from "@/store/groupStore";
import { toast } from "@/hooks/use-toast";

const JoinGroup = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const joinGroup = useGroupStore((s) => s.joinGroup);
  const navigate = useNavigate();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast({ title: "Error", description: "Enter an invite code.", variant: "destructive" });
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const group = joinGroup(code.toUpperCase());
    setLoading(false);
    if (group) {
      toast({ title: "Joined!", description: `Welcome to ${group.name}` });
      navigate(`/groups/${group.id}`);
    } else {
      toast({ title: "Not Found", description: "Invalid invite code.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-8">
          <div className="text-center mb-6">
            <span className="text-4xl block mb-2">🤝</span>
            <h1 className="font-display font-bold text-2xl text-foreground">Join a Group</h1>
            <p className="text-muted-foreground text-sm mt-1">Enter the invite code to join</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter invite code"
              className="bg-muted/50 border-border/50 text-foreground text-center font-mono text-lg tracking-widest h-14 uppercase"
            />
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground font-display font-bold h-12">
              {loading ? "Joining..." : "Join Group"}
            </Button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default JoinGroup;
