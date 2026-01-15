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
  Crown,
  Flame,
  Zap,
  Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnimatedNumber } from '@/hooks/useAnimatedCounter';
import BuilderDetailModal from './BuilderDetailModal';

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
  const [selectedBuilder, setSelectedBuilder] = useState<LeaderboardEntry | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleBuilderClick = (builder: LeaderboardEntry) => {
    setSelectedBuilder(builder);
    setModalOpen(true);
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
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
      
      const entries: LeaderboardEntry[] = (data || []).map((item: {
        rank?: number | string;
        builder?: string;
        name?: string;
        address?: string;
        volume?: number;
        totalVolume?: number;
        activeUsers?: number;
        users?: number;
        verified?: boolean;
        builderLogo?: string;
        logo?: string;
      }, index: number) => ({
        rank: parseInt(String(item.rank)) || index + 1,
        name: item.builder || item.name || `Builder ${index + 1}`,
        address: item.address || '',
        totalVolume: parseFloat(String(item.volume || item.totalVolume || 0)),
        activeUsers: item.activeUsers || item.users || 0,
        verified: item.verified || false,
        logo: item.builderLogo || item.logo
      }));
      
      setLeaderboard(entries);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timePeriod]);

  const formatVolume = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatUsers = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const maxVolume = leaderboard.length > 0 ? leaderboard[0].totalVolume : 1;
  const totalVolume = leaderboard.reduce((sum, b) => sum + b.totalVolume, 0);
  const totalUsers = leaderboard.reduce((sum, b) => sum + b.activeUsers, 0);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-yellow-500/20',
          border: 'border-yellow-500/50',
          glow: 'shadow-lg shadow-yellow-500/20',
          icon: <Crown className="w-6 h-6 text-yellow-400" />,
          badge: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black'
        };
      case 2:
        return {
          bg: 'bg-gradient-to-r from-gray-400/15 via-slate-400/10 to-gray-400/15',
          border: 'border-gray-400/40',
          glow: 'shadow-md shadow-gray-400/10',
          icon: <Medal className="w-5 h-5 text-gray-300" />,
          badge: 'bg-gradient-to-r from-gray-300 to-slate-400 text-black'
        };
      case 3:
        return {
          bg: 'bg-gradient-to-r from-amber-600/15 via-orange-600/10 to-amber-600/15',
          border: 'border-amber-600/40',
          glow: 'shadow-md shadow-amber-600/10',
          icon: <Medal className="w-5 h-5 text-amber-500" />,
          badge: 'bg-gradient-to-r from-amber-500 to-orange-600 text-black'
        };
      default:
        return {
          bg: 'bg-card/60 hover:bg-card/80',
          border: 'border-border/50',
          glow: '',
          icon: null,
          badge: 'bg-muted text-muted-foreground'
        };
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative p-4 md:p-6">
          {/* Header Row - Stack on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <Trophy className="w-5 h-5 md:w-6 md:h-6 text-black" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-foreground tracking-tight">
                  Builder Leaderboard
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 md:gap-2">
                  <Flame className="w-3 h-3 text-orange-500" />
                  Live from Polymarket
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
                <SelectTrigger className="w-[110px] md:w-[130px] h-8 md:h-9 text-xs md:text-sm bg-card/50 border-border/50">
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
                size="icon"
                onClick={fetchLeaderboard}
                disabled={loading}
                className="h-8 w-8 md:h-9 md:w-9 bg-card/50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Stats Cards - Scrollable on mobile */}
          <div className="flex gap-3 md:grid md:grid-cols-3 md:gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <div className="relative group flex-shrink-0 w-[140px] md:w-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl blur-xl group-hover:blur-2xl transition-all opacity-50" />
              <Card className="relative bg-card/80 backdrop-blur border-primary/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    </div>
                    <div>
                      <AnimatedNumber 
                        value={leaderboard.length} 
                        duration={1200}
                        className="text-lg md:text-2xl font-bold text-foreground block"
                      />
                      <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">{t('builders')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="relative group flex-shrink-0 w-[140px] md:w-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/10 rounded-xl blur-xl group-hover:blur-2xl transition-all opacity-50" />
              <Card className="relative bg-card/80 backdrop-blur border-green-500/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                    </div>
                    <div>
                      <AnimatedNumber 
                        value={totalVolume} 
                        duration={1800}
                        delay={200}
                        formatter={formatVolume}
                        className="text-lg md:text-2xl font-bold text-foreground block"
                      />
                      <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">{t('totalVolume')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="relative group flex-shrink-0 w-[140px] md:w-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/10 rounded-xl blur-xl group-hover:blur-2xl transition-all opacity-50" />
              <Card className="relative bg-card/80 backdrop-blur border-blue-500/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                    </div>
                    <div>
                      <AnimatedNumber 
                        value={totalUsers} 
                        duration={1500}
                        delay={400}
                        formatter={formatUsers}
                        className="text-lg md:text-2xl font-bold text-foreground block"
                      />
                      <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">{t('activeUsers')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <div className="p-3 md:p-4 space-y-2 md:space-y-3 pb-8">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-card/50 border border-border/50">
                <Skeleton className="w-8 h-8 md:w-10 md:h-10 rounded-full" />
                <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 md:h-5 w-24 md:w-32 mb-2" />
                  <Skeleton className="h-3 w-full max-w-[120px] md:max-w-[200px]" />
                </div>
                <Skeleton className="h-6 md:h-8 w-16 md:w-24" />
              </div>
            ))
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={fetchLeaderboard}>
                {t('tryAgain')}
              </Button>
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {leaderboard.length >= 3 && (
                <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
                  {/* 2nd Place */}
                  <div className="order-1 pt-4 md:pt-6">
                    <TopBuilderCard entry={leaderboard[1]} maxVolume={maxVolume} formatVolume={formatVolume} formatUsers={formatUsers} onClick={() => handleBuilderClick(leaderboard[1])} />
                  </div>
                  {/* 1st Place */}
                  <div className="order-2">
                    <TopBuilderCard entry={leaderboard[0]} maxVolume={maxVolume} formatVolume={formatVolume} formatUsers={formatUsers} isChampion onClick={() => handleBuilderClick(leaderboard[0])} />
                  </div>
                  {/* 3rd Place */}
                  <div className="order-3 pt-6 md:pt-8">
                    <TopBuilderCard entry={leaderboard[2]} maxVolume={maxVolume} formatVolume={formatVolume} formatUsers={formatUsers} onClick={() => handleBuilderClick(leaderboard[2])} />
                  </div>
                </div>
              )}

              {/* Rest of Leaderboard */}
              {leaderboard.slice(3).map((entry) => {
                const style = getRankStyle(entry.rank);
                const volumePercent = (entry.totalVolume / maxVolume) * 100;
                
                return (
                  <div 
                    key={entry.rank}
                    onClick={() => handleBuilderClick(entry)}
                    className={`relative flex items-center gap-2 md:gap-4 p-3 md:p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] cursor-pointer ${style.bg} ${style.border} ${style.glow}`}
                  >
                    {/* Rank */}
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm flex-shrink-0 ${style.badge}`}>
                      #{entry.rank}
                    </div>

                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-muted border-2 border-border">
                        {entry.logo ? (
                          <img 
                            src={entry.logo} 
                            alt={entry.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg md:text-xl font-bold text-primary bg-primary/10">
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {entry.verified && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-background">
                          <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 md:gap-2 mb-1">
                        <span className="font-semibold text-sm md:text-base text-foreground truncate">
                          {entry.name}
                        </span>
                      </div>
                      <div className="hidden sm:flex items-center gap-3">
                        <Progress value={volumePercent} className="h-1.5 flex-1 max-w-[150px]" />
                        <span className="text-xs text-muted-foreground">
                          {(volumePercent).toFixed(1)}%
                        </span>
                      </div>
                      {/* Mobile: Show volume inline */}
                      <div className="sm:hidden text-xs text-muted-foreground">
                        {formatVolume(entry.totalVolume)}
                      </div>
                    </div>

                    {/* Stats - Hidden on mobile, shown on larger */}
                    <div className="hidden sm:block text-right">
                      <AnimatedNumber 
                        value={entry.totalVolume} 
                        duration={1200}
                        delay={entry.rank * 50}
                        formatter={formatVolume}
                        className="text-base md:text-lg font-bold text-foreground block"
                      />
                      <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                        <Users className="w-3 h-3" />
                        <AnimatedNumber 
                          value={entry.activeUsers}
                          duration={1000}
                          delay={entry.rank * 50 + 100}
                          formatter={(v) => formatUsers(Math.round(v))}
                        /> users
                      </p>
                    </div>

                    {/* Mobile Stats - Compact */}
                    <div className="sm:hidden text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {formatUsers(entry.activeUsers)}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Footer Link */}
              <div className="pt-6 text-center">
                <a
                  href="https://builders.polymarket.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t('viewOfficialLeaderboard')}
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      <BuilderDetailModal
        builder={selectedBuilder}
        open={modalOpen}
        onOpenChange={setModalOpen}
        timePeriod={timePeriod}
      />
    </div>
  );
};

// Animated Progress Bar Component
const AnimatedProgress = ({ value, delay = 0 }: { value: number; delay?: number }) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return (
    <Progress 
      value={progress} 
      className="h-1 transition-all duration-1000 ease-out" 
    />
  );
};

// Top 3 Builder Card Component
const TopBuilderCard = ({ 
  entry, 
  maxVolume, 
  formatVolume, 
  formatUsers,
  isChampion = false,
  onClick
}: { 
  entry: LeaderboardEntry; 
  maxVolume: number;
  formatVolume: (v: number) => string;
  formatUsers: (v: number) => string;
  isChampion?: boolean;
  onClick?: () => void;
}) => {
  const volumePercent = (entry.totalVolume / maxVolume) * 100;
  
  const rankColors = {
    1: { 
      gradient: 'from-yellow-400 via-amber-500 to-yellow-600',
      bg: 'bg-gradient-to-b from-yellow-500/20 to-transparent',
      border: 'border-yellow-500/50',
      glow: 'shadow-xl shadow-yellow-500/30',
      text: 'text-yellow-400'
    },
    2: { 
      gradient: 'from-gray-300 via-slate-400 to-gray-500',
      bg: 'bg-gradient-to-b from-gray-400/20 to-transparent',
      border: 'border-gray-400/50',
      glow: 'shadow-lg shadow-gray-400/20',
      text: 'text-gray-300'
    },
    3: { 
      gradient: 'from-amber-500 via-orange-500 to-amber-700',
      bg: 'bg-gradient-to-b from-amber-500/20 to-transparent',
      border: 'border-amber-500/50',
      glow: 'shadow-lg shadow-amber-500/20',
      text: 'text-amber-500'
    }
  };
  
  const colors = rankColors[entry.rank as 1 | 2 | 3] || rankColors[3];

  return (
    <div 
      onClick={onClick}
      className={`relative rounded-xl md:rounded-2xl border p-2 md:p-4 text-center transition-all hover:scale-105 cursor-pointer ${colors.bg} ${colors.border} ${colors.glow}`}
    >
      {/* Crown for #1 */}
      {isChampion && (
        <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2">
          <Crown className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 drop-shadow-lg" />
        </div>
      )}

      {/* Rank Badge */}
      <div className={`inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-r ${colors.gradient} text-black font-bold text-xs md:text-sm mb-2 md:mb-3 ${isChampion ? 'mt-1 md:mt-2' : ''}`}>
        #{entry.rank}
      </div>

      {/* Avatar */}
      <div className="relative mx-auto mb-2 md:mb-3">
        <div className={`w-10 h-10 md:w-16 md:h-16 rounded-full overflow-hidden bg-muted border-2 ${colors.border} mx-auto`}>
          {entry.logo ? (
            <img 
              src={entry.logo} 
              alt={entry.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg md:text-2xl font-bold text-primary bg-primary/10">
              {entry.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {entry.verified && (
          <div className="absolute -bottom-1 right-1/2 translate-x-1/2 w-4 h-4 md:w-5 md:h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-background">
            <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="font-bold text-xs md:text-base text-foreground truncate mb-1">{entry.name}</h3>

      {/* Volume */}
      <AnimatedNumber 
        value={entry.totalVolume}
        duration={1500}
        delay={entry.rank * 100}
        formatter={formatVolume}
        className={`text-sm md:text-xl font-bold ${colors.text} block`}
      />

      {/* Users */}
      <p className="text-[10px] md:text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
        <Users className="w-2.5 h-2.5 md:w-3 md:h-3" />
        <AnimatedNumber 
          value={entry.activeUsers}
          duration={1200}
          delay={entry.rank * 100 + 100}
          formatter={(v) => formatUsers(Math.round(v))}
        />
      </p>

      {/* Volume Bar - Hidden on mobile */}
      <div className="hidden md:block mt-3">
        <AnimatedProgress value={volumePercent} delay={entry.rank * 100 + 200} />
      </div>
    </div>
  );
};

export default BuilderLeaderboard;
