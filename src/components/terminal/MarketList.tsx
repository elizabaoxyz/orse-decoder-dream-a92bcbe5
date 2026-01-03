import { useState, useEffect } from "react";
import { polymarketApi, MarketSnapshot } from "@/lib/api/polymarket";
import { TrendingUp, TrendingDown, RefreshCw, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

const MarketList = () => {
  const [markets, setMarkets] = useState<MarketSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchMarkets = async () => {
    setIsLoading(true);
    const data = await polymarketApi.getMarketSnapshots(15);
    
    // Deduplicate by market_id, keeping the most recent snapshot
    const marketMap = new Map<string, MarketSnapshot>();
    for (const market of data) {
      if (!marketMap.has(market.market_id) || 
          new Date(market.recorded_at) > new Date(marketMap.get(market.market_id)!.recorded_at)) {
        marketMap.set(market.market_id, market);
      }
    }
    
    setMarkets(Array.from(marketMap.values()));
    setIsLoading(false);
  };

  const syncData = async () => {
    setIsSyncing(true);
    await polymarketApi.syncData();
    await fetchMarkets();
    setIsSyncing(false);
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  const formatPrice = (price: number) => {
    return `${(price * 100).toFixed(1)}%`;
  };

  const formatVolume = (volume: number | null) => {
    if (!volume) return "$0";
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  return (
    <div className="terminal-panel h-full flex flex-col">
      <div className="terminal-header flex items-center justify-between">
        <span>POLYMARKET_LIVE_MARKETS</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={syncData}
          disabled={isSyncing}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          SYNC
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-xs py-8">
            LOADING_MARKETS...
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs py-8">
            <p>NO_MARKETS_FOUND</p>
            <Button
              variant="terminal"
              size="sm"
              onClick={syncData}
              className="mt-4"
            >
              SYNC_DATA
            </Button>
          </div>
        ) : (
          markets.map((market) => (
            <div
              key={market.id}
              className="border border-border/50 bg-card/30 p-3 space-y-2 hover:border-primary/50 transition-colors"
            >
              <div className="text-xs text-foreground leading-tight line-clamp-2">
                {market.title}
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-green-500 font-mono">
                      YES {formatPrice(market.yes_price)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-red-500" />
                    <span className="text-red-500 font-mono">
                      NO {formatPrice(market.no_price)}
                    </span>
                  </div>
                </div>
                
                {market.volume_24h && market.volume_24h > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="w-3 h-3" />
                    <span className="font-mono">{formatVolume(market.volume_24h)}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MarketList;

