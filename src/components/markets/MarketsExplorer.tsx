import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, TrendingUp, Search, X, Filter } from 'lucide-react';
import MarketCard from './MarketCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const VPS_BASE_URL = 'https://polymarket.elizabao.xyz';

interface VPSMarket {
  id: string;
  condition_id?: string;
  question: string;
  description?: string;
  category?: string;
  slug?: string;
  market_slug?: string;
  active?: boolean;
  closed?: boolean;
  end_date_iso?: string;
  tokens?: Array<{
    token_id: string;
    outcome: string;
    price: number;
    winner?: boolean;
  }>;
  minimum_order_size?: string;
  accepting_orders?: boolean;
  image?: string;
  icon?: string;
  volume?: number;
  liquidity?: number;
  tag_id?: string;
}

interface Category {
  id: string;
  label: string;
  slug: string;
}

const CATEGORIES: Category[] = [
  { id: 'all', label: 'All', slug: '' },
  { id: 'politics', label: 'Politics', slug: 'politics' },
  { id: 'crypto', label: 'Crypto', slug: 'crypto' },
  { id: 'sports', label: 'Sports', slug: 'sports' },
  { id: 'pop-culture', label: 'Pop Culture', slug: 'pop-culture' },
  { id: 'business', label: 'Business', slug: 'business' },
  { id: 'science', label: 'Science', slug: 'science' },
];

const MarketsExplorer = () => {
  const { t } = useTranslation();
  const [markets, setMarkets] = useState<VPSMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [hideRestricted, setHideRestricted] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 50;

  const fetchMarkets = useCallback(async (resetOffset = true) => {
    setLoading(true);
    setError(null);
    
    if (resetOffset) {
      setOffset(0);
      setMarkets([]);
    }

    try {
      let url: string;
      const currentOffset = resetOffset ? 0 : offset;

      if (searchQuery.trim()) {
        // Use search endpoint
        const page = Math.floor(currentOffset / LIMIT) + 1;
        url = `${VPS_BASE_URL}/api/markets/search?q=${encodeURIComponent(searchQuery)}&limit=${LIMIT}&page=${page}`;
      } else if (activeCategory !== 'all') {
        // Use category filter
        url = `${VPS_BASE_URL}/api/markets?tag_id=${activeCategory}&active=true&closed=${showClosed}&limit=${LIMIT}&offset=${currentOffset}`;
        if (hideRestricted) {
          url += '&restricted=false';
        }
      } else {
        // All active markets
        url = `${VPS_BASE_URL}/api/markets?active=true&closed=${showClosed}&limit=${LIMIT}&offset=${currentOffset}`;
        if (hideRestricted) {
          url += '&restricted=false';
        }
      }

      console.log('Fetching markets from:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('VPS Markets response:', data);

      // Handle different response formats
      let marketsData: VPSMarket[] = [];
      if (Array.isArray(data)) {
        marketsData = data;
      } else if (data.markets && Array.isArray(data.markets)) {
        marketsData = data.markets;
      } else if (data.data && Array.isArray(data.data)) {
        marketsData = data.data;
      }

      // Map VPS format to our format if needed
      marketsData = marketsData.map(m => ({
        ...m,
        condition_id: m.condition_id || m.id,
        market_slug: m.market_slug || m.slug,
      }));

      setHasMore(marketsData.length === LIMIT);

      if (resetOffset) {
        setMarkets(marketsData);
      } else {
        setMarkets(prev => [...prev, ...marketsData]);
      }
    } catch (err) {
      console.error('Failed to fetch markets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch markets');
      if (resetOffset) {
        setMarkets([]);
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeCategory, hideRestricted, showClosed, offset]);

  // Initial fetch and when filters change
  useEffect(() => {
    fetchMarkets(true);
  }, [activeCategory, hideRestricted, showClosed]);

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
    if (searchQuery !== undefined) {
      fetchMarkets(true);
    }
  }, [searchQuery]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setOffset(prev => prev + LIMIT);
      fetchMarkets(false);
    }
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
            onClick={() => fetchMarkets(true)}
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
            {CATEGORIES.map((cat) => (
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
              id="hide-restricted"
              checked={hideRestricted}
              onCheckedChange={setHideRestricted}
            />
            <Label htmlFor="hide-restricted" className="text-xs text-muted-foreground cursor-pointer">
              Hide restricted
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-closed"
              checked={showClosed}
              onCheckedChange={setShowClosed}
            />
            <Label htmlFor="show-closed" className="text-xs text-muted-foreground cursor-pointer">
              Show closed
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
            <Button onClick={() => fetchMarkets(true)} variant="outline">
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
                <MarketCard key={market.condition_id || market.id} market={market as any} />
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
