import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Trophy, 
  Medal, 
  TrendingUp, 
  Users, 
  DollarSign,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LeaderboardEntry {
  rank: number;
  name: string;
  address: string;
  totalVolume: number;
  activeUsers: number;
  verified: boolean;
  logo?: string;
}

type TimePeriod = 'DAY' | 'WEEK' | 'MONTH' | 'ALL';

const BuilderLeaderboard = () => {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('WEEK');

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch from Polymarket Data API
      const url = new URL('https://data-api.polymarket.com/v1/builders/leaderboard');
      url.searchParams.set('timePeriod', timePeriod);
      url.searchParams.set('limit', '20');
      
      const response = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform data to our format
      const entries: LeaderboardEntry[] = (data || []).map((item: {
        rank?: number;
        name?: string;
        address?: string;
        totalVolume?: number;
        volume?: number;
        activeUsers?: number;
        users?: number;
        verified?: boolean;
        logo?: string;
      }, index: number) => ({
        rank: item.rank || index + 1,
        name: item.name || `Builder ${index + 1}`,
        address: item.address || '',
        totalVolume: parseFloat(String(item.totalVolume || item.volume || 0)),
        activeUsers: item.activeUsers || item.users || 0,
        verified: item.verified || false,
        logo: item.logo
      }));
      
      setLeaderboard(entries);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      // Set mock data for demo
      setLeaderboard(getMockLeaderboard());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timePeriod]);

  const getMockLeaderboard = (): LeaderboardEntry[] => {
    return [
      { rank: 1, name: 'Polymarket Pro', address: '0x1234...abcd', totalVolume: 15420000, activeUsers: 8432, verified: true },
      { rank: 2, name: 'TradeBot Alpha', address: '0x5678...efgh', totalVolume: 12300000, activeUsers: 6521, verified: true },
      { rank: 3, name: 'Market Maker X', address: '0x9abc...ijkl', totalVolume: 9870000, activeUsers: 4312, verified: true },
      { rank: 4, name: 'Prediction Pro', address: '0xdef0...mnop', totalVolume: 7650000, activeUsers: 3245, verified: false },
      { rank: 5, name: 'Alpha Builder', address: '0x1357...qrst', totalVolume: 5430000, activeUsers: 2156, verified: false },
    ];
  };

  const formatVolume = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatUsers = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 2:
        return 'bg-gray-500/10 border-gray-500/30';
      case 3:
        return 'bg-amber-600/10 border-amber-600/30';
      default:
        return 'bg-muted/30 border-border';
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <div>
            <h2 className="font-semibold text-foreground">{t('leaderboard')}</h2>
            <p className="text-xs text-muted-foreground">{t('topBuilders')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAY">{t('today')}</SelectItem>
              <SelectItem value="WEEK">{t('thisWeek')}</SelectItem>
              <SelectItem value="MONTH">{t('thisMonth')}</SelectItem>
              <SelectItem value="ALL">{t('allTime')}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeaderboard}
            disabled={loading}
            className="gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="bg-card/50 border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive mb-2">{error}</p>
            <Button variant="outline" onClick={fetchLeaderboard}>
              {t('tryAgain')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card className="bg-card/50 border-border">
                <CardContent className="p-3 text-center">
                  <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{leaderboard.length}</p>
                  <p className="text-xs text-muted-foreground">{t('builders')}</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border">
                <CardContent className="p-3 text-center">
                  <DollarSign className="w-4 h-4 mx-auto mb-1 text-green-500" />
                  <p className="text-lg font-bold">
                    {formatVolume(leaderboard.reduce((sum, b) => sum + b.totalVolume, 0))}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('totalVolume')}</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border">
                <CardContent className="p-3 text-center">
                  <TrendingUp className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  <p className="text-lg font-bold">
                    {formatUsers(leaderboard.reduce((sum, b) => sum + b.activeUsers, 0))}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('activeUsers')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Leaderboard List */}
            {leaderboard.map((entry) => (
              <Card 
                key={entry.rank}
                className={`border transition-colors hover:bg-muted/50 ${getRankBg(entry.rank)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-background/50">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    {/* Builder Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">
                          {entry.name}
                        </span>
                        {entry.verified && (
                          <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {entry.address}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground">
                        {formatVolume(entry.totalVolume)}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                        <Users className="w-3 h-3" />
                        {formatUsers(entry.activeUsers)} {t('users')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Link to Official Leaderboard */}
            <div className="pt-4 text-center">
              <a
                href="https://builders.polymarket.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                {t('viewOfficialLeaderboard')}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuilderLeaderboard;
