import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  ExternalLink,
  BarChart3,
  Clock
} from 'lucide-react';
import { polymarketBuilderApi } from '@/lib/api/polymarket-builder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Market {
  condition_id: string;
  question: string;
  description?: string;
  tokens: Array<{
    token_id: string;
    outcome: string;
    price?: number;
  }>;
  end_date_iso?: string;
  active?: boolean;
  closed?: boolean;
  accepting_orders?: boolean;
  minimum_order_size?: string;
  minimum_tick_size?: string;
}

interface MarketBrowserProps {
  onSelectMarket?: (market: Market) => void;
}

const MarketBrowser = ({ onSelectMarket }: MarketBrowserProps) => {
  const { t } = useTranslation();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const data = await polymarketBuilderApi.getMarkets(50, 0);
      setMarkets(data as Market[]);
    } catch (err) {
      console.error('Failed to fetch markets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  const filteredMarkets = markets.filter(market =>
    market.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    market.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectMarket = (market: Market) => {
    setSelectedMarket(market);
    onSelectMarket?.(market);
  };

  const getPrice = (tokens: Market['tokens'], outcome: string): number => {
    const token = tokens?.find(t => t.outcome?.toLowerCase() === outcome.toLowerCase());
    return token?.price ?? 0;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No end date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchMarkets}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BarChart3 className="w-3 h-3" />
          <span>{filteredMarkets.length} active markets</span>
        </div>
      </div>

      {/* Markets List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMarkets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No markets found</p>
            </div>
          ) : (
            filteredMarkets.map((market) => {
              const yesPrice = getPrice(market.tokens, 'Yes');
              const noPrice = getPrice(market.tokens, 'No');
              const isSelected = selectedMarket?.condition_id === market.condition_id;
              
              return (
                <Card 
                  key={market.condition_id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    isSelected ? 'border-primary bg-primary/5' : 'bg-card/50 border-border'
                  }`}
                  onClick={() => handleSelectMarket(market)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-2">
                          {market.question}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant={market.accepting_orders ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {market.accepting_orders ? 'Active' : 'Closed'}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDate(market.end_date_iso)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-sm font-mono text-green-500">
                            {(yesPrice * 100).toFixed(0)}¢
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 text-red-500" />
                          <span className="text-sm font-mono text-red-500">
                            {(noPrice * 100).toFixed(0)}¢
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Price Bar */}
                    <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden flex">
                      <div 
                        className="h-full bg-green-500 transition-all" 
                        style={{ width: `${yesPrice * 100}%` }}
                      />
                      <div 
                        className="h-full bg-red-500 transition-all" 
                        style={{ width: `${noPrice * 100}%` }}
                      />
                    </div>
                    
                    {isSelected && (
                      <a
                        href={`https://polymarket.com/event/${market.condition_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on Polymarket
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MarketBrowser;
