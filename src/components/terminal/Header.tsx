import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Twitter/X icon component
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Polymarket icon
const PolymarketIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" stroke="currentColor" fill="none"/>
  </svg>
);

const languages = [
  { code: 'en', name: 'EN', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'vi', name: 'VI', flag: '🇻🇳' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
];

const Header = () => {
  const { user, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm px-3 md:px-4 py-2 flex items-center justify-between text-xs uppercase tracking-widest">
      {/* Left - Logo */}
      <span className="text-primary text-glow text-[10px] md:text-xs font-bold">ELIZABAO</span>

      {/* Right - Theme & Language | Social | Auth */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 md:p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
          title={theme === 'dark' ? t('light') : t('dark')}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger className="p-1.5 md:p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[10px]">{currentLang.flag}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border min-w-[140px]">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`cursor-pointer ${i18n.language === lang.code ? 'bg-primary/10 text-primary' : ''}`}
              >
                <span className="mr-2">{lang.flag}</span>
                <span>{lang.name}</span>
                {i18n.language === lang.code && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="w-px h-4 bg-border/50 mx-0.5" />

        {/* Social Links */}
        <a
          href="https://x.com/elizabaoxyz"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
          title="Twitter"
        >
          <TwitterIcon />
        </a>
        <a
          href="https://polymarket.com?via=elizabao"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
          title={t('polymarket')}
        >
          <PolymarketIcon />
        </a>

        {/* Auth Section */}
        {user ? (
          <>
            <Link
              to="/settings"
              className="px-2 md:px-3 py-1 text-[9px] md:text-[10px] text-muted-foreground hover:text-primary transition-colors"
            >
              {t('settings')}
            </Link>
            <button
              onClick={() => signOut()}
              className="px-2 md:px-3 py-1 text-[9px] md:text-[10px] bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded transition-colors"
            >
              {t('signOut')}
            </button>
          </>
        ) : (
          <Link
            to="/auth"
            className="px-3 md:px-4 py-1.5 text-[9px] md:text-[10px] bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors font-medium"
          >
            {t('signIn')}
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
