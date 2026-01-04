import { useEffect, useState } from "react";

const Header = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <header className="border-b border-border bg-card px-4 py-2 flex items-center justify-between text-xs uppercase tracking-widest">
      <div className="flex items-center gap-2">
        <span className="text-primary text-glow">DORAMOS_TERMINAL</span>
        <span className="text-muted-foreground">//</span>
        <span className="text-muted-foreground">MARKET_INTEL</span>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-foreground font-medium tabular-nums">
          {formatTime(time)}
        </span>
        <a
          href="https://twitter.com/ai16zdoram"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        >
          TWITTER
        </a>
      </div>
    </header>
  );
};

export default Header;
