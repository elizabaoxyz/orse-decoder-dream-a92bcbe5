const Header = () => {
  return (
    <header className="border-b border-border bg-card px-4 py-2 flex items-center justify-between text-xs uppercase tracking-widest">
      <div className="flex items-center gap-2">
        <span className="text-primary text-glow">DORAMOS_TERMINAL</span>
        <span className="text-muted-foreground">//</span>
        <span className="text-muted-foreground">LIVE DATA FROM POLYMARKET API</span>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="https://twitter.com/ai16zdoram"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        >
          TWITTER
        </a>
        <a
          href="https://polymarket.com/?via=ai16zdoram"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        >
          POLYMARKET
        </a>
        <a
          href="https://github.com/elizaos-plugins/plugin-polymarket"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        >
          GITHUB
        </a>
      </div>
    </header>
  );
};

export default Header;
