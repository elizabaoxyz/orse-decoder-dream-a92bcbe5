import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  DollarSign, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  Clock
} from 'lucide-react';
import { polymarketBuilderApi, BuilderTrade, BuilderStats, HealthCheckResponse } from '@/lib/api/polymarket-builder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const BuilderDashboard = () => {
  const { t } = useTranslation();
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [stats, setStats] = useState<BuilderStats | null>(null);
  const [trades, setTrades] = useState<BuilderTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [healthData, tradesData] = await Promise.all([
        polymarketBuilderApi.healthCheck(),
        polymarketBuilderApi.getBuilderTrades({ limit: 50 })
      ]);

      setHealth(healthData);
      setTrades(tradesData.trades || []);

      // Calculate stats from trades if we have any
      if (tradesData.trades && tradesData.trades.length > 0) {
        const uniqueMarkets = new Set(tradesData.trades.map(t => t.market));
        const uniqueUsers = new Set(tradesData.trades.map(t => t.owner));
        let totalVolume = 0;
        let totalFees = 0;
        
        for (const trade of tradesData.trades) {
          totalVolume += parseFloat(trade.sizeUsdc || '0');
          totalFees += parseFloat(trade.feeUsdc || '0');
        }

        setStats({
          totalTrades: tradesData.trades.length,
          totalVolumeUsdc: totalVolume.toFixed(2),
          totalFeesUsdc: totalFees.toFixed(2),
          uniqueMarkets: uniqueMarkets.size,
          uniqueUsers: uniqueUsers.size
        });
      } else {
        setStats({
          totalTrades: 0,
          totalVolumeUsdc: '0.00',
          totalFeesUsdc: '0.00',
          uniqueMarkets: 0,
          uniqueUsers: 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch builder data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatUsd = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Builder Dashboard
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Polymarket CLOB Builder API Integration
            </p>
          </div>
          <div className="flex items-center gap-2">
            {health && (
              <Badge variant={health.connected ? 'default' : 'destructive'} className="gap-1">
                {health.connected ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {health.connected ? 'Connected' : 'Disconnected'}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <XCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-destructive font-medium mb-2">Connection Error</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">{error}</p>
            <Button onClick={fetchData} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Connection Status Card */}
            {health && (
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    API Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Endpoint</p>
                      <p className="font-mono text-xs truncate">{health.endpoint}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Chain ID</p>
                      <p className="font-medium">{health.chainId} (Polygon)</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Builder API</p>
                      <Badge variant={health.builderApiConfigured ? 'default' : 'secondary'}>
                        {health.builderApiConfigured ? 'Configured' : 'Not Configured'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge variant={health.connected ? 'default' : 'destructive'}>
                        {health.connected ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="bg-card/50 border-border">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Activity className="w-3 h-3" />
                      Total Trades
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalTrades}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <DollarSign className="w-3 h-3" />
                      Volume (USDC)
                    </div>
                    <p className="text-2xl font-bold text-foreground">{formatUsd(stats.totalVolumeUsdc)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <TrendingUp className="w-3 h-3" />
                      Fees Earned
                    </div>
                    <p className="text-2xl font-bold text-green-500">{formatUsd(stats.totalFeesUsdc)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Activity className="w-3 h-3" />
                      Markets
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats.uniqueMarkets}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Users className="w-3 h-3" />
                      Users
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats.uniqueUsers}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Trades */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Recent Builder Trades</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : trades.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No trades yet</p>
                    <p className="text-xs mt-1">Trades attributed to your builder will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {trades.slice(0, 20).map((trade) => (
                      <div 
                        key={trade.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={trade.side === 'BUY' ? 'default' : 'secondary'}>
                            {trade.side}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                              {trade.outcome}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {trade.matchTime ? format(new Date(trade.matchTime), 'MMM d, HH:mm') : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">${parseFloat(trade.sizeUsdc || '0').toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">@ {trade.price}</p>
                        </div>
                        {trade.transactionHash && (
                          <a
                            href={`https://polygonscan.com/tx/${trade.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default BuilderDashboard;
