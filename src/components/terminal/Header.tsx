const Header = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm px-3 md:px-4 py-2 flex items-center justify-between text-xs uppercase tracking-widest">
      <div className="flex items-center gap-2">
        <span className="text-primary text-glow text-[10px] md:text-xs">DORAMOS</span>
        <span className="text-muted-foreground hidden md:inline">//</span>
        <span className="text-muted-foreground hidden md:inline text-xs">LIVE DATA FROM POLYMARKET API</span>
      </div>
      <div className="flex items-center gap-1.5 md:gap-3">
        <a
          href="https://twitter.com/ai16zdoram"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border px-1.5 md:px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors text-[9px] md:text-xs"
        >
          X
        </a>
        <a
          href="https://polymarket.com/?via=ai16zdoram"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border px-1.5 md:px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors text-[9px] md:text-xs"
        >
          POLY
        </a>
        <a
          href="https://github.com/elizaos-plugins/plugin-polymarket"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border px-1.5 md:px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors text-[9px] md:text-xs"
        >
          GIT
        </a>
      </div>
    </header>
  );
};

export default Header;
