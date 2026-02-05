import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, TrendingUp, Search, X } from 'lucide-react';
import MarketCard from './MarketCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { ClobMarket } from '@/lib/api/polymarket-clob';

interface GammaMarket {
  id: string;
  slug: string;
  title: string;
  question?: string;
  description?: string;
  outcomes?: string[];
  outcomePrices?: string[];
  conditionId?: string;
  active?: boolean;
  closed?: boolean;
  acceptingOrders?: boolean;
  endDate?: string;
  category?: string;
  image?: string;
  volume?: number;
  liquidity?: number;
}

interface MarketTag {
  id: string;
  label: string;
  slug: string;
}

// Common category tags from Polymarket
const CATEGORY_TAGS: MarketTag[] = [
  { id: 'all', label: 'All', slug: '' },
  { id: 'politics', label: 'Politics', slug: 'politics' },
  { id: 'crypto', label: 'Crypto', slug: 'crypto' },
  { id: 'sports', label: 'Sports', slug: 'sports' },
  { id: 'pop-culture', label: 'Pop Culture', slug: 'pop-culture' },
  { id: 'business', label: 'Business', slug: 'business' },
  { id: 'science', label: 'Science', slug: 'science' },
];

// Convert Gamma API response to ClobMarket format
const convertGammaToClob = (market: GammaMarket): ClobMarket => {
  const tokens =
    market.outcomes?.map((outcome, idx) => ({
      token_id: `${market.id}-${idx}`,
      outcome,
      price: market.outcomePrices?.[idx]
        ? parseFloat(market.outcomePrices[idx])
        : 0.5,
    })) || [];

  return {
    condition_id: market.conditionId || market.id,
    question: market.question || market.title,
    description: market.description,
    category: market.category,
    end_date_iso: market.endDate,
    market_slug: market.slug,
    active: market.active,
    closed: market.closed,
    accepting_orders: market.acceptingOrders,
    tokens,
    minimum_order_size: '1',
    minimum_tick_size: '0.01',
  };
};

const MarketsExplorer = () => {
  const { t } = useTranslation();
  const [markets, setMarkets] = useState<ClobMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showClosed, setShowClosed] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 50;

  const fetchMarkets = useCallback(
    async (opts?: { reset?: boolean; offset?: number }) => {
      const reset = opts?.reset ?? true;
      const currentOffset = reset ? 0 : (opts?.offset ?? offset);

      setLoading(true);
      setError(null);

      if (reset) {
        setOffset(0);
        setMarkets([]);
      }

      try {
        const params = {
          limit: LIMIT,
          offset: currentOffset,
          ...(showClosed
            ? {}
            : {
                active: true,
                closed: false,
              }),
          ...(activeCategory !== 'all' ? { tag_slug: activeCategory } : {}),
          ...(searchQuery.trim() ? { _q: searchQuery.trim() } : {}),
        };

        console.log('Fetching markets via backend function:', params);

        const { data, error: fnError } = await supabase.functions.invoke(
          'polymarket-clob',
          {
            body: {
              action: 'getGammaMarkets',
              params,
            },
          }
        );

        if (fnError) throw fnError;
        if (!data?.success) {
          throw new Error(data?.error || 'Failed to fetch markets');
        }

        const gammaMarkets: GammaMarket[] = Array.isArray(data.data)
          ? data.data
          : [];

        const marketsData = gammaMarkets.map(convertGammaToClob);

        setHasMore(marketsData.length === LIMIT);

        if (reset) {
          setMarkets(marketsData);
        } else {
          setMarkets((prev) => [...prev, ...marketsData]);
        }
      } catch (err) {
        console.error('Failed to fetch markets:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch markets');
        if (reset) {
          setMarkets([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, activeCategory, showClosed, offset]
  );

  // Initial fetch and when filters change
  useEffect(() => {
    fetchMarkets({ reset: true });
  }, [activeCategory, showClosed]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== searchInput) {
        setSearchQuery(searchInput);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch when search query changes
  useEffect(() => {
    fetchMarkets({ reset: true });
  }, [searchQuery]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    fetchMarkets({ reset: false, offset: nextOffset });
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {t('marketsExplorer')}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {t('marketsExplorerDesc')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMarkets({ reset: true })}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('searchMarkets')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-4">
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent p-0">
            {CATEGORY_TAGS.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="text-xs px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Switch
              id="show-closed"
              checked={showClosed}
              onCheckedChange={setShowClosed}
            />
            <Label htmlFor="show-closed" className="text-xs text-muted-foreground cursor-pointer">
              Show closed markets
            </Label>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="p-3 border-b border-border bg-muted/30 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t('totalMarkets')}:</span>
          <span className="text-foreground font-medium">{markets.length}</span>
        </div>
        {searchQuery && (
          <div className="flex items-center gap-2">
            <Search className="w-3 h-3 text-primary" />
            <span className="text-primary">"{searchQuery}"</span>
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-muted-foreground">Source:</span>
          <span className="text-foreground font-mono text-[10px]">gamma-api.polymarket.com</span>
        </div>
      </div>

      {/* Markets Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && markets.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>{t('loadingMarkets')}</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => fetchMarkets({ reset: true })} variant="outline">
              {t('retry')}
            </Button>
          </div>
        ) : markets.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {t('noMarketsFound')}
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {markets.map((market) => (
                <MarketCard key={market.condition_id} market={market} />
              ))}
            </div>
            
            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MarketsExplorer;
