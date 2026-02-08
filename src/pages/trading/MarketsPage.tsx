import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, TrendingUp, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchGammaMarkets, parseJsonField, type GammaMarket } from "@/lib/elizabao-api";

const LIMIT = 20;

export default function MarketsPage() {
  const navigate = useNavigate();
  const [markets, setMarkets] = useState<GammaMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadMarkets = useCallback(
    async (reset = false) => {
      const currentOffset = reset ? 0 : offset;
      reset ? setLoading(true) : setLoadingMore(true);
      setError(null);

      try {
        const data = await fetchGammaMarkets({
          limit: LIMIT,
          offset: currentOffset,
          active: true,
          closed: false,
          ...(search ? { _q: search } : {}),
        });

        if (reset) {
          setMarkets(data);
          setOffset(LIMIT);
        } else {
          setMarkets((prev) => [...prev, ...data]);
          setOffset(currentOffset + LIMIT);
        }
        setHasMore(data.length === LIMIT);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load markets");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [offset, search]
  );

  useEffect(() => {
    loadMarkets(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Markets</h1>
          <p className="text-sm text-muted-foreground">
            Browse active Polymarket prediction markets
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm">
          {error}
          <Button
            variant="outline"
            size="sm"
            className="ml-3"
            onClick={() => loadMarkets(true)}
          >
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No markets found{search ? ` for "${search}"` : ""}.
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {markets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                onSelect={() =>
                  navigate(`/app/trade?market=${market.conditionId || market.id}`)
                }
              />
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => loadMarkets(false)}
                disabled={loadingMore}
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MarketCard({
  market,
  onSelect,
}: {
  market: GammaMarket;
  onSelect: () => void;
}) {
  const outcomes = parseJsonField<string>(market.outcomes);
  const prices = parseJsonField<number>(market.outcomePrices);
  const tokenIds = parseJsonField<string>(market.clobTokenIds);

  const volume = market.volume24hr
    ? `$${market.volume24hr.toLocaleString()}`
    : market.volume
      ? `$${parseFloat(market.volume).toLocaleString()}`
      : "—";

  return (
    <div
      className="border border-border rounded-lg p-4 hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer group"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
            {market.question}
          </h3>

          <div className="flex flex-wrap gap-2 mt-2">
            {outcomes.map((outcome, i) => {
              const price = prices[i];
              const pct = price ? (Number(price) * 100).toFixed(1) : "—";
              return (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs font-mono"
                >
                  {outcome}: {pct}%
                </Badge>
              );
            })}
          </div>

          {tokenIds.length > 0 && (
            <div className="text-[10px] text-muted-foreground/60 font-mono mt-1 truncate">
              Token: {tokenIds[0]?.slice(0, 20)}...
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            {volume}
          </div>
          {market.endDate && (
            <span className="text-[10px] text-muted-foreground">
              Ends: {new Date(market.endDate).toLocaleDateString()}
            </span>
          )}
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary/60 mt-1" />
        </div>
      </div>
    </div>
  );
}
