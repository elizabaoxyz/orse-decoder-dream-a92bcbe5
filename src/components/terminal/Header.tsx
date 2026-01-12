import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: 'en', name: 'EN', flag: '🇺🇸' },
  { code: 'zh', name: '中', flag: '🇨🇳' },
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
      <div className="flex items-center gap-2">
        <span className="text-primary text-glow text-[10px] md:text-xs">ELIZABAO</span>
      </div>
      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="border border-border px-1.5 md:px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors text-[9px] md:text-xs flex items-center gap-1"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
        </button>

        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger className="border border-border px-1.5 md:px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors text-[9px] md:text-xs flex items-center gap-1">
            <span>{currentLang.flag}</span>
            <span className="hidden md:inline">{currentLang.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border min-w-[120px]">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`cursor-pointer ${i18n.language === lang.code ? 'bg-primary/10 text-primary' : ''}`}
              >
                <span className="mr-2">{lang.flag}</span>
                <span>{lang.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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
          {t('twitter')}
        </a>
        {user ? (
          <>
            <Link
              to="/settings"
              className="border border-border px-1.5 md:px-2 py-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors text-[9px] md:text-xs"
            >
              {t('settings')}
            </Link>
            <button
              onClick={() => signOut()}
              className="border border-primary px-1.5 md:px-2 py-0.5 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-[9px] md:text-xs"
            >
              {t('signOut')}
            </button>
          </>
        ) : (
          <Link
            to="/auth"
            className="border border-primary px-1.5 md:px-2 py-0.5 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-[9px] md:text-xs"
          >
            {t('signIn')}
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
