import { useEffect, useState } from "react";
import { Twitter } from "lucide-react";

const Header = () => {
  const [time, setTime] = useState(new Date());
  const [statusBlink, setStatusBlink] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const blinker = setInterval(() => setStatusBlink((b) => !b), 500);
    return () => {
      clearInterval(timer);
      clearInterval(blinker);
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
        <span className="text-primary text-glow">DORAM_TERMINAL</span>
        <span className="text-muted-foreground">//</span>
        <span className="text-muted-foreground">MARKET_INTEL</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">[</span>
          <span className="text-foreground">STATUS:</span>
          <span className={`text-primary ${statusBlink ? "opacity-100" : "opacity-60"}`}>
            DORAMING
          </span>
          <span className="text-muted-foreground">]</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">[</span>
          <span className="text-foreground">DITHER:</span>
          <span className="text-primary">ACTIVE</span>
          <span className="text-muted-foreground">]</span>
        </div>
        <span className="text-foreground font-medium tabular-nums">
          {formatTime(time)}
        </span>
        <a
          href="https://twitter.com/ai16zdoram"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Twitter size={16} />
        </a>
      </div>
    </header>
  );
};

export default Header;
