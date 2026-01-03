import { Button } from "@/components/ui/button";

const MainTerminal = () => {
  const navLinks = [
    { label: "EXECUTE_SLY_LOGIC", primary: true, icon: "⬡" },
    { label: "PLAYGROUND", primary: false },
    { label: "MISSIONS", primary: false },
  ];

  const secondaryLinks = [
    { label: "TRAINING" },
  ];

  const tertiaryLinks = [
    { label: "NETWORK" },
    { label: "LEADERBOARD" },
    { label: "ARCHIVE" },
    { label: "BOUNTIES" },
  ];

  const quaternaryLinks = [
    { label: "LOGS" },
  ];

  return (
    <main className="flex-1 flex flex-col overflow-y-auto">
      {/* Terminal Primary */}
      <div className="terminal-panel flex-1">
        <div className="terminal-header">DORAMOS_TERMINAL_PRIMARY</div>
        
        <div className="p-8 lg:p-12 space-y-8">
          {/* Main Title */}
          <div>
            <h1 className="text-6xl lg:text-7xl font-bold text-foreground tracking-tight glitch">
              DoramOS<span className="text-primary">_</span>
            </h1>
            <div className="w-24 h-1 bg-primary mt-2 pulse-glow" />
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm max-w-xl leading-relaxed uppercase tracking-wide">
            Vulpine intelligence localized within a shifting dithered core. 
            DoramOS adapts its geometric topology to bypass centralized spectral filtering.
          </p>

          {/* Navigation Buttons */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              {navLinks.map((link) => (
                <Button
                  key={link.label}
                  variant={link.primary ? "terminal-primary" : "terminal"}
                  size="default"
                >
                  {link.icon && <span className="mr-1">{link.icon}</span>}
                  {link.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {secondaryLinks.map((link) => (
                <Button key={link.label} variant="terminal" size="default">
                  {link.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {tertiaryLinks.map((link) => (
                <Button key={link.label} variant="terminal" size="default">
                  {link.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {quaternaryLinks.map((link) => (
                <Button key={link.label} variant="terminal" size="default">
                  {link.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Bottom Status */}
          <div className="pt-8 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">AGENT_ID:</span>
              <span className="text-foreground">DORAMOS-00</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">UPLINK:</span>
              <span className="text-primary">STABLE_100%</span>
            </div>
          </div>

          {/* Command Input */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-primary">&gt;&gt;</span>
            <span className="cursor-blink">ENTER_COMMAND...</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MainTerminal;
