import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Layers,
  DollarSign
} from 'lucide-react';
import { polymarketBuilderApi } from '@/lib/api/polymarket-builder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderBookEntry {
  price: string;
  size: string;
}

interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread?: number;
  market?: string;
  asset_id?: string;
  hash?: string;
  timestamp?: string;
}

interface OrderBookViewProps {
  tokenId: string;
  tokenName?: string;
  marketQuestion?: string;
}

const OrderBookView = ({ tokenId, tokenName, marketQuestion }: OrderBookViewProps) => {
  const { t } = useTranslation();
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [lastPrice, setLastPrice] = useState<string | null>(null);
  const [tickSize, setTickSize] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!tokenId) return;
    
    setLoading(true);
    try {
      const [bookData, priceData, tickData] = await Promise.all([
        polymarketBuilderApi.getOrderBook(tokenId),
        polymarketBuilderApi.getLastTradePrice(tokenId).catch(() => null),
        polymarketBuilderApi.getTickSize(tokenId).catch(() => null),
      ]);
      
      setOrderBook(bookData as OrderBook);
      setLastPrice(priceData);
      setTickSize(tickData);
    } catch (err) {
      console.error('Failed to fetch order book:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tokenId]);

  const calculateSpread = () => {
    if (!orderBook?.bids?.length || !orderBook?.asks?.length) return null;
    const bestBid = parseFloat(orderBook.bids[0].price);
    const bestAsk = parseFloat(orderBook.asks[0].price);
    return ((bestAsk - bestBid) * 100).toFixed(2);
  };

  const getTotalVolume = (orders: OrderBookEntry[]) => {
    return orders.reduce((acc, order) => acc + parseFloat(order.size), 0);
  };

  if (!tokenId) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select a market to view order book</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="font-medium text-foreground">Order Book</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        {marketQuestion && (
          <p className="text-xs text-muted-foreground line-clamp-2">{marketQuestion}</p>
        )}
        {tokenName && (
          <Badge variant="outline" className="mt-2">{tokenName}</Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 p-4 border-b border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Last Price</p>
          <p className="font-mono text-sm font-medium text-foreground">
            {lastPrice ? `${(parseFloat(lastPrice) * 100).toFixed(1)}¢` : '-'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Spread</p>
          <p className="font-mono text-sm font-medium text-foreground">
            {calculateSpread() ? `${calculateSpread()}¢` : '-'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Tick Size</p>
          <p className="font-mono text-sm font-medium text-foreground">
            {tickSize || '-'}
          </p>
        </div>
      </div>

      {/* Order Book */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !orderBook ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No order book data</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Asks (Sells) - Show in reverse order */}
            <Card className="bg-card/50 border-border">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-medium flex items-center gap-1 text-red-500">
                  <TrendingDown className="w-3 h-3" />
                  Asks (Sells)
                  <span className="ml-auto font-mono">
                    {orderBook.asks?.length || 0} orders
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-3 text-xs text-muted-foreground px-3 py-1 border-b border-border">
                  <span>Price</span>
                  <span className="text-right">Size</span>
                  <span className="text-right">Total</span>
                </div>
                {orderBook.asks?.slice(0, 10).reverse().map((ask, idx) => {
                  const total = orderBook.asks!
                    .slice(0, orderBook.asks!.length - idx)
                    .reduce((acc, o) => acc + parseFloat(o.size), 0);
                  return (
                    <div 
                      key={`ask-${idx}`} 
                      className="grid grid-cols-3 text-xs px-3 py-1.5 hover:bg-muted/50 relative"
                    >
                      <div 
                        className="absolute inset-y-0 right-0 bg-red-500/10"
                        style={{ width: `${(parseFloat(ask.size) / getTotalVolume(orderBook.asks!)) * 100}%` }}
                      />
                      <span className="font-mono text-red-500 relative z-10">
                        {(parseFloat(ask.price) * 100).toFixed(1)}¢
                      </span>
                      <span className="font-mono text-right relative z-10">
                        {parseFloat(ask.size).toLocaleString()}
                      </span>
                      <span className="font-mono text-right text-muted-foreground relative z-10">
                        {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Bids (Buys) */}
            <Card className="bg-card/50 border-border">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-medium flex items-center gap-1 text-green-500">
                  <TrendingUp className="w-3 h-3" />
                  Bids (Buys)
                  <span className="ml-auto font-mono">
                    {orderBook.bids?.length || 0} orders
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-3 text-xs text-muted-foreground px-3 py-1 border-b border-border">
                  <span>Price</span>
                  <span className="text-right">Size</span>
                  <span className="text-right">Total</span>
                </div>
                {orderBook.bids?.slice(0, 10).map((bid, idx) => {
                  const total = orderBook.bids!
                    .slice(0, idx + 1)
                    .reduce((acc, o) => acc + parseFloat(o.size), 0);
                  return (
                    <div 
                      key={`bid-${idx}`} 
                      className="grid grid-cols-3 text-xs px-3 py-1.5 hover:bg-muted/50 relative"
                    >
                      <div 
                        className="absolute inset-y-0 right-0 bg-green-500/10"
                        style={{ width: `${(parseFloat(bid.size) / getTotalVolume(orderBook.bids!)) * 100}%` }}
                      />
                      <span className="font-mono text-green-500 relative z-10">
                        {(parseFloat(bid.price) * 100).toFixed(1)}¢
                      </span>
                      <span className="font-mono text-right relative z-10">
                        {parseFloat(bid.size).toLocaleString()}
                      </span>
                      <span className="font-mono text-right text-muted-foreground relative z-10">
                        {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default OrderBookView;
