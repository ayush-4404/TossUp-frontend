import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { useGroupStore } from "@/store/groupStore";
import { hideGlobalLoadingMessage, showGlobalLoadingMessage } from "@/store/loadingStore";
import { toast } from "@/hooks/use-toast";

const CreateGroup = () => {
  const [name, setName] = useState("");
  const [betPrice, setBetPrice] = useState("");
  const [createdGroup, setCreatedGroup] = useState<{ name: string; inviteCode: string } | null>(null);
  const createGroup = useGroupStore((s) => s.createGroup);
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !betPrice) {
      toast({ title: "Error", description: "Fill all fields.", variant: "destructive" });
      return;
    }

    const loaderMessageId = showGlobalLoadingMessage("Creating group...");
    let group = null;
    try {
      group = await createGroup(name, parseInt(betPrice, 10));
    } catch {
      group = null;
    } finally {
      hideGlobalLoadingMessage(loaderMessageId);
    }

    if (!group) {
      toast({ title: "Error", description: "Unable to create group.", variant: "destructive" });
      return;
    }
    setCreatedGroup({ name: group.name, inviteCode: group.inviteCode });
    toast({ title: "Group Created!", description: `Invite code: ${group.inviteCode}` });
  };

  const copyCode = () => {
    if (createdGroup) {
      navigator.clipboard.writeText(createdGroup.inviteCode);
      toast({ title: "Copied!" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-8">
          <h1 className="font-display font-bold text-2xl text-foreground mb-6 text-center">Create Group</h1>

          {!createdGroup ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Group Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter group name" className="bg-muted/50 border-border/50 text-foreground" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Bet Price (coins per match)</label>
                <Input type="number" value={betPrice} onChange={(e) => setBetPrice(e.target.value)} placeholder="100" className="bg-muted/50 border-border/50 text-foreground" />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground font-display font-bold h-12">
                Create Group
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="font-display font-bold text-xl text-foreground">{createdGroup.name}</h2>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Invite Code</p>
                <p className="font-mono text-2xl font-bold text-primary">{createdGroup.inviteCode}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={copyCode} variant="outline" className="flex-1 border-border/50">
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
                <Button variant="outline" className="flex-1 border-border/50" disabled>
                  <Share2 className="h-4 w-4 mr-1" /> Share
                </Button>
              </div>
              <Button onClick={() => navigate("/dashboard")} className="w-full gradient-secondary text-secondary-foreground font-display font-bold">
                Go to Dashboard
              </Button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default CreateGroup;
