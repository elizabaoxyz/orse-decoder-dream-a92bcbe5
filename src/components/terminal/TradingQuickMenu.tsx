import { useTranslation } from "react-i18next";
import { Wallet, ShoppingCart, TrendingDown, Gift, ListOrdered, XCircle, BarChart3, Search, BookOpen, DollarSign } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TradingQuickMenuProps {
  onCommand: (cmd: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
}

const TradingQuickMenu = ({ onCommand, isOpen, onOpenChange, trigger }: TradingQuickMenuProps) => {
  const { t } = useTranslation();

  const handleCommand = (cmd: string) => {
    onCommand(cmd);
    onOpenChange(false);
  };

  const tradingCommands = [
    { icon: Wallet, label: t('checkWallet'), command: "/wallet", color: "text-green-500" },
    { icon: ShoppingCart, label: t('buyOrder'), command: "/buy", color: "text-emerald-500" },
    { icon: TrendingDown, label: t('sellOrder'), command: "/sell", color: "text-red-500" },
    { icon: ListOrdered, label: t('viewOrders'), command: "/orders", color: "text-blue-500" },
    { icon: XCircle, label: t('cancelOrder'), command: "/cancel", color: "text-orange-500" },
    { icon: Gift, label: t('redeemWinnings'), command: "/redeem", color: "text-purple-500" },
  ];

  const marketCommands = [
    { icon: Search, label: t('searchMarkets'), command: "/market", color: "text-primary" },
    { icon: BarChart3, label: t('explainMarket'), command: "/explain", color: "text-primary" },
    { icon: BookOpen, label: t('viewOrderBook'), command: "/orderbook", color: "text-primary" },
    { icon: DollarSign, label: t('checkPrice'), command: "/price", color: "text-primary" },
  ];

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="start" 
        className="w-80 p-0 bg-popover/95 backdrop-blur-sm border-border shadow-xl"
      >
        <div className="p-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            {t('tradingCommands')}
          </h3>
        </div>
        
        {/* Trading Commands Grid */}
        <div className="p-2">
          <div className="grid grid-cols-2 gap-1">
            {tradingCommands.map((item) => (
              <button
                key={item.command}
                onClick={() => handleCommand(item.command)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors text-left group"
              >
                <item.icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                <div className="flex flex-col">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground">{item.command}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            {t('marketAnalysis')}
          </h3>
          <div className="grid grid-cols-2 gap-1">
            {marketCommands.map((item) => (
              <button
                key={item.command}
                onClick={() => handleCommand(item.command)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-left group"
              >
                <item.icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                <div className="flex flex-col">
                  <span className="text-xs">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground">{item.command}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="p-2 bg-muted/30 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            {t('tradingTip')}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TradingQuickMenu;
