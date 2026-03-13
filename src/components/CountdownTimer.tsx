import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetTime: string;
  className?: string;
}

const CountdownTimer = ({ targetTime, className = "" }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(targetTime).getTime() - Date.now();
      if (diff <= 0) {
        setIsExpired(true);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  if (isExpired) {
    return <span className={`text-destructive font-semibold ${className}`}>LIVE</span>;
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className={`flex items-center gap-1 font-mono text-sm ${className}`}>
      {timeLeft.days > 0 && (
        <span className="bg-muted px-1.5 py-0.5 rounded text-foreground font-bold">{timeLeft.days}d</span>
      )}
      <span className="bg-muted px-1.5 py-0.5 rounded text-foreground font-bold">{pad(timeLeft.hours)}</span>
      <span className="text-muted-foreground">:</span>
      <span className="bg-muted px-1.5 py-0.5 rounded text-foreground font-bold">{pad(timeLeft.minutes)}</span>
      <span className="text-muted-foreground">:</span>
      <span className="bg-muted px-1.5 py-0.5 rounded text-foreground font-bold">{pad(timeLeft.seconds)}</span>
    </div>
  );
};

export default CountdownTimer;
