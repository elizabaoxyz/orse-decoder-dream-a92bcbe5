import { NavLink, Outlet } from "react-router-dom";
import { useTrading } from "@/contexts/ElizaConfigProvider";
import { BarChart3, ShoppingCart, Wallet, Trophy, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/app/markets", label: "Markets", icon: BarChart3 },
  { to: "/app/trade", label: "Trade", icon: ShoppingCart },
  { to: "/app/wallet", label: "Wallet", icon: Wallet },
  { to: "/app/builder", label: "Builder Stats", icon: Trophy },
];

export default function TradingLayout() {
  const { isAuthenticated, login, logout, userAddress } = useTrading();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Nav */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-primary">ElizaBAO</span>
            <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded">
              Builder
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {isAuthenticated && userAddress && (
              <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </span>
            )}
            {isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={logout} className="gap-2">
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </Button>
            ) : (
              <Button size="sm" onClick={login} className="gap-2">
                <LogIn className="w-3.5 h-3.5" />
                Login
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t border-border px-2 py-1 flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 text-xs whitespace-nowrap rounded-md ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground"
                }`
              }
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
