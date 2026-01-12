import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm px-3 md:px-4 py-2 flex items-center justify-between text-xs uppercase tracking-widest">
      <div className="flex items-center gap-2">
        <span className="text-primary text-glow text-[10px] md:text-xs">ELIZABAO</span>
      </div>
      <div className="flex items-center gap-1.5 md:gap-3">
        <a
          href="https://polymarket.com?via=elizabao"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border px-1.5 md:px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors text-[9px] md:text-xs"
        >
          POLYMARKET
        </a>
        <a
          href="https://x.com/elizabaoxyz"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border px-1.5 md:px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors text-[9px] md:text-xs"
        >
          TWITTER
        </a>
        {user ? (
          <>
            <Link
              to="/settings"
              className="border border-border px-1.5 md:px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors text-[9px] md:text-xs"
            >
              SETTINGS
            </Link>
            <button
              onClick={() => signOut()}
              className="border border-primary px-1.5 md:px-2 py-0.5 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-[9px] md:text-xs"
            >
              SIGN OUT
            </button>
          </>
        ) : (
          <Link
            to="/auth"
            className="border border-primary px-1.5 md:px-2 py-0.5 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-[9px] md:text-xs"
          >
            SIGN IN
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
