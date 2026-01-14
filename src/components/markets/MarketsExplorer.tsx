import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, TrendingUp, TrendingDown, Search, Filter } from 'lucide-react';
import { polymarketClobApi, ClobMarket } from '@/lib/api/polymarket-clob';
import MarketCard from './MarketCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MarketsExplorer = () => {
  const { t } = useTranslation();
  const [markets, setMarkets] = useState<ClobMarket[]>([]);
  const [filteredMarkets, setFilteredMarkets] = useState<ClobMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'closed'>('active');

  const fetchMarkets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await polymarketClobApi.getMarkets(100, 0, activeFilter === 'active');
      // Ensure we always have an array
      const marketsArray = Array.isArray(data) ? data : [];
      setMarkets(marketsArray);
      setFilteredMarkets(marketsArray);
    } catch (err) {
      console.error('Failed to fetch markets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch markets');
      setMarkets([]);
      setFilteredMarkets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [activeFilter]);

  useEffect(() => {
    // Ensure markets is always an array before filtering
    const marketsArray = Array.isArray(markets) ? markets : [];
    
    if (searchQuery.trim() === '') {
      setFilteredMarkets(marketsArray);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMarkets(
        marketsArray.filter(
          (m) =>
            m.question?.toLowerCase().includes(query) ||
            m.description?.toLowerCase().includes(query) ||
            m.category?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, markets]);

  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return '—';
    return `${(price * 100).toFixed(1)}¢`;
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
            onClick={fetchMarkets}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('searchMarkets')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'active', 'closed'] as const).map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className="text-xs"
              >
                {t(filter)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="p-3 border-b border-border bg-muted/30 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t('totalMarkets')}:</span>
          <span className="text-foreground font-medium">{Array.isArray(filteredMarkets) ? filteredMarkets.length : 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3 h-3 text-green-500" />
          <span className="text-muted-foreground">{t('activeMarkets')}:</span>
          <span className="text-foreground font-medium">
            {Array.isArray(filteredMarkets) ? filteredMarkets.filter((m) => m.active && !m.closed).length : 0}
          </span>
        </div>
      </div>

      {/* Markets Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>{t('loadingMarkets')}</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchMarkets} variant="outline">
              {t('retry')}
            </Button>
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {t('noMarketsFound')}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredMarkets.map((market) => (
              <MarketCard key={market.condition_id} market={market} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketsExplorer;
