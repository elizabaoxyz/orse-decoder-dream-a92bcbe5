import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  ExternalLink,
  BarChart3,
  Clock,
  Filter,
  Trophy
} from 'lucide-react';
import { polymarketBuilderApi } from '@/lib/api/polymarket-builder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface MarketToken {
  token_id?: string;
  tokenId?: string;
  outcome: string;
  price?: number;
  winner?: boolean;
}

// Support both CLOB (snake_case) and Gamma (camelCase) API formats
interface Market {
  condition_id?: string;
  conditionId?: string;
  question?: string;
  description?: string;
  tokens?: MarketToken[];
  outcomePrices?: string; // Gamma API: "[\"0.998\",\"0.003\"]"
  outcomes?: string; // Gamma API: "[\"Yes\",\"No\"]"
  clobTokenIds?: string; // Gamma API
  end_date_iso?: string;
  endDateIso?: string;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
  accepting_orders?: boolean;
  acceptingOrders?: boolean;
  enable_order_book?: boolean;
  enableOrderBook?: boolean;
  minimum_order_size?: number;
  minimumOrderSize?: number;
  minimum_tick_size?: number;
  minimumTickSize?: number;
  market_slug?: string;
  slug?: string;
}

interface NormalizedMarket {
  id: string;
  question: string;
  description?: string;
  tokens: Array<{
    token_id: string;
    outcome: string;
    price: number;
    winner?: boolean;
  }>;
  endDate?: string;
  active: boolean;
  closed: boolean;
  acceptingOrders: boolean;
  enableOrderBook: boolean;
  minimumOrderSize?: number;
  minimumTickSize?: number;
  slug?: string;
}

interface MarketBrowserProps {
  onSelectMarket?: (market: NormalizedMarket) => void;
}

const MarketBrowser = ({ onSelectMarket }: MarketBrowserProps) => {
  const { t } = useTranslation();
  const [markets, setMarkets] = useState<NormalizedMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<NormalizedMarket | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Normalize market data from either API format
  const normalizeMarket = (market: Market): NormalizedMarket | null => {
    const id = market.conditionId || market.condition_id;
    const question = market.question;
    
    if (!id || !question) return null;

    // Parse tokens from Gamma API format
    let tokens: NormalizedMarket['tokens'] = [];
    
    if (market.tokens && Array.isArray(market.tokens)) {
      // CLOB API format
      tokens = market.tokens.map(t => ({
        token_id: t.token_id || t.tokenId || '',
        outcome: t.outcome,
        price: t.price ?? 0,
        winner: t.winner
      }));
    } else if (market.outcomePrices && market.outcomes && market.clobTokenIds) {
      // Gamma API format
      try {
        const prices = JSON.parse(market.outcomePrices) as string[];
        const outcomes = JSON.parse(market.outcomes) as string[];
        const tokenIds = JSON.parse(market.clobTokenIds) as string[];
        
        tokens = outcomes.map((outcome, i) => ({
          token_id: tokenIds[i] || '',
          outcome,
          price: parseFloat(prices[i] || '0'),
          winner: false
        }));
      } catch (e) {
        console.error('Failed to parse Gamma market data:', e);
      }
    }

    return {
      id,
      question,
      description: market.description,
      tokens,
      endDate: market.endDate || market.endDateIso || market.end_date_iso,
      active: market.active ?? false,
      closed: market.closed ?? false,
      acceptingOrders: market.acceptingOrders ?? market.accepting_orders ?? false,
      enableOrderBook: market.enableOrderBook ?? market.enable_order_book ?? false,
      minimumOrderSize: market.minimumOrderSize ?? market.minimum_order_size,
      minimumTickSize: market.minimumTickSize ?? market.minimum_tick_size,
      slug: market.slug || market.market_slug
    };
  };

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const data = await polymarketBuilderApi.getMarkets(100, 0);
      const rawMarkets = Array.isArray(data) ? data : (data as { data?: Market[] })?.data || [];
      
      // Normalize and filter valid markets
      const normalizedMarkets = rawMarkets
        .map((m: Market) => normalizeMarket(m))
        .filter((m): m is NormalizedMarket => m !== null && m.tokens.length > 0)
        .sort((a, b) => {
          // Active markets first
          if (a.acceptingOrders && !b.acceptingOrders) return -1;
          if (!a.acceptingOrders && b.acceptingOrders) return 1;
          return 0;
        });
      
      setMarkets(normalizedMarkets);
    } catch (err) {
      console.error('Failed to fetch markets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  const filteredMarkets = markets.filter(market => {
    const matchesSearch = !searchQuery || 
      market.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesActiveFilter = !showActiveOnly || market.acceptingOrders;
    
    return matchesSearch && matchesActiveFilter;
  });

  const handleSelectMarket = (market: NormalizedMarket) => {
    setSelectedMarket(market);
    onSelectMarket?.(market);
  };

  const getTopTwoTokens = (tokens: NormalizedMarket['tokens']) => {
    if (!tokens || tokens.length === 0) return { first: null, second: null };
    const sorted = [...tokens].sort((a, b) => b.price - a.price);
    return { first: sorted[0], second: sorted[1] || null };
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No end date';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Ends today';
    if (diffDays === 1) return 'Ends tomorrow';
    if (diffDays <= 7) return `${diffDays} days left`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const activeCount = markets.filter(m => m.acceptingOrders).length;

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
            variant={showActiveOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowActiveOnly(!showActiveOnly)}
            className="gap-1"
          >
            <Filter className="w-3 h-3" />
            Active
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchMarkets}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            {filteredMarkets.length} markets
          </span>
          <span className="flex items-center gap-1 text-green-500">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            {activeCount} accepting orders
          </span>
        </div>
      </div>

      {/* Markets List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <Card key={i} className="bg-card/50 border-border">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-3" />
                  <div className="flex gap-2 mb-3">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filteredMarkets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No markets found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredMarkets.slice(0, 50).map((market) => {
              const { first, second } = getTopTwoTokens(market.tokens);
              const isSelected = selectedMarket?.id === market.id;
              const hasWinner = market.tokens.some(t => t.winner);
              
              return (
                <Card 
                  key={market.id}
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
                          {hasWinner ? (
                            <Badge variant="secondary" className="text-xs gap-1 bg-amber-500/20 text-amber-500">
                              <Trophy className="w-3 h-3" />
                              Resolved
                            </Badge>
                          ) : market.acceptingOrders ? (
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Closed
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDate(market.endDate)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Token Prices */}
                      <div className="flex flex-col items-end gap-1 text-right">
                        {first && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                              {first.outcome}
                            </span>
                            <span className={`text-sm font-mono ${first.winner ? 'text-amber-500' : 'text-green-500'}`}>
                              {(first.price * 100).toFixed(0)}¢
                            </span>
                            {first.winner && <Trophy className="w-3 h-3 text-amber-500" />}
                          </div>
                        )}
                        {second && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                              {second.outcome}
                            </span>
                            <span className={`text-sm font-mono ${second.winner ? 'text-amber-500' : 'text-red-500'}`}>
                              {(second.price * 100).toFixed(0)}¢
                            </span>
                            {second.winner && <Trophy className="w-3 h-3 text-amber-500" />}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Price Bar */}
                    {first && second && (
                      <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden flex">
                        <div 
                          className={`h-full transition-all ${first.winner ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${first.price * 100}%` }}
                        />
                        <div 
                          className={`h-full transition-all ${second.winner ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${second.price * 100}%` }}
                        />
                      </div>
                    )}
                    
                    {isSelected && (
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          Min order: ${market.minimumOrderSize || 'N/A'} | Tick: {market.minimumTickSize || 'N/A'}
                        </div>
                        <a
                          href={`https://polymarket.com/event/${market.slug || market.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View on Polymarket
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
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
