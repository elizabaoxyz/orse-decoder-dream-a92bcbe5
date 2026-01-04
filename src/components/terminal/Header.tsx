const Header = () => {
  return (
    <header className="border-b border-border bg-card px-2 md:px-4 py-2 flex flex-col md:flex-row items-start md:items-center justify-between text-xs uppercase tracking-widest gap-2 md:gap-0">
      <div className="flex items-center gap-2">
        <span className="text-primary text-glow">DORAMOS_TERMINAL</span>
        <span className="text-muted-foreground hidden sm:inline">//</span>
        <span className="text-muted-foreground hidden sm:inline text-[10px] md:text-xs">LIVE DATA FROM POLYMARKET API</span>
      </div>
      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
        <a
          href="https://twitter.com/ai16zdoram"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors text-[10px] md:text-xs"
        >
          TWITTER
        </a>
        <a
          href="https://polymarket.com/?via=ai16zdoram"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors text-[10px] md:text-xs"
        >
          POLYMARKET
        </a>
        <a
          href="https://github.com/elizaos-plugins/plugin-polymarket"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors text-[10px] md:text-xs"
        >
          GITHUB
        </a>
      </div>
    </header>
  );
};

export default Header;
