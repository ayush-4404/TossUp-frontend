import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLoadingStore } from "@/store/loadingStore";

const GlobalLoadingOverlay = () => {
  const pendingRequests = useLoadingStore((state) => state.pendingRequests);
  const messages = useLoadingStore((state) => state.messages);
  const [showInlineLoader, setShowInlineLoader] = useState(false);
  const hasBlockingMessage = messages.length > 0;

  useEffect(() => {
    if (hasBlockingMessage) {
      setShowInlineLoader(false);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;

    if (pendingRequests > 0) {
      // Delay avoids flashing the loader for very quick API calls.
      timer = setTimeout(() => setShowInlineLoader(true), 220);
    } else {
      setShowInlineLoader(false);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [pendingRequests, hasBlockingMessage]);

  if (!hasBlockingMessage && !showInlineLoader) {
    return null;
  }

  const activeMessage = messages[messages.length - 1]?.text || "Loading...";

  if (!hasBlockingMessage) {
    return (
      <div className="fixed inset-x-0 top-0 z-[85] pointer-events-none">
        <div className="h-1 bg-primary/15 overflow-hidden">
          <div className="h-full w-1/3 bg-primary loading-indicator" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/70 backdrop-blur-sm px-6">
      <div className="glass-card rounded-2xl px-6 py-5 text-center min-w-[220px]">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 font-display text-lg text-foreground">{activeMessage}</p>
      </div>
    </div>
  );
};

export default GlobalLoadingOverlay;
