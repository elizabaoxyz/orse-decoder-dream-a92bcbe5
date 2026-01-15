import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ExternalLink,
  CheckCircle2,
  Users,
  DollarSign,
  Calendar,
  Wallet,
  Copy,
  Check,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { AnimatedNumber } from '@/hooks/useAnimatedCounter';

interface BuilderEntry {
  rank: number;
  name: string;
  address: string;
  totalVolume: number;
  activeUsers: number;
  verified: boolean;
  logo?: string;
}

interface BuilderDetailModalProps {
  builder: BuilderEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timePeriod: string;
}

interface PeriodData {
  period: string;
  label: string;
  volume: number;
  users: number;
  rank: number;
  found: boolean;
}

const BuilderDetailModal = ({ builder, open, onOpenChange, timePeriod }: BuilderDetailModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [periodData, setPeriodData] = useState<PeriodData[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && builder) {
      fetchBuilderDetails();
    }
  }, [open, builder]);

  const fetchBuilderDetails = async () => {
    if (!builder) return;
    
    setLoading(true);
    try {
      // Fetch real data from all time periods
      const periods = [
        { key: 'DAY', label: 'Today' },
        { key: 'WEEK', label: 'This Week' },
        { key: 'MONTH', label: 'This Month' },
        { key: 'ALL', label: 'All Time' },
      ];

      const responses = await Promise.all(
        periods.map(async (period) => {
          try {
            const res = await fetch(
              `https://data-api.polymarket.com/v1/builders/leaderboard?timePeriod=${period.key}&limit=100`
            );
            if (!res.ok) throw new Error('Failed to fetch');
            return { period: period.key, label: period.label, data: await res.json() };
          } catch {
            return { period: period.key, label: period.label, data: [] };
          }
        })
      );

      // Find this builder in each period's data
      const findBuilder = (data: any[]) => 
        data?.find((b: any) => 
          (b.builder || b.name) === builder.name || 
          (b.address && builder.address && b.address.toLowerCase() === builder.address.toLowerCase())
        );

      const results: PeriodData[] = responses.map(({ period, label, data }) => {
        const found = findBuilder(data);
        return {
          period,
          label,
          volume: found ? parseFloat(String(found.volume || found.totalVolume || 0)) : 0,
          users: found ? (found.activeUsers || found.users || 0) : 0,
          rank: found ? (parseInt(String(found.rank)) || 0) : 0,
          found: !!found,
        };
      });

      setPeriodData(results);
    } catch (error) {
      console.error('Failed to fetch builder details:', error);
      setPeriodData([]);
    } finally {
      setLoading(false);
    }
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

  const copyAddress = () => {
    if (builder?.address) {
      navigator.clipboard.writeText(builder.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-amber-500';
    if (rank === 2) return 'from-gray-300 to-slate-400';
    if (rank === 3) return 'from-amber-500 to-orange-600';
    return 'from-primary to-primary/80';
  };

  const getPeriodColor = (period: string) => {
    switch (period) {
      case 'DAY': return 'from-blue-500/10 to-cyan-500/5 border-blue-500/20';
      case 'WEEK': return 'from-green-500/10 to-emerald-500/5 border-green-500/20';
      case 'MONTH': return 'from-purple-500/10 to-violet-500/5 border-purple-500/20';
      case 'ALL': return 'from-amber-500/10 to-orange-500/5 border-amber-500/20';
      default: return 'from-muted/50 to-muted/30 border-border';
    }
  };

  const getPeriodIconColor = (period: string) => {
    switch (period) {
      case 'DAY': return 'text-blue-500 bg-blue-500/10';
      case 'WEEK': return 'text-green-500 bg-green-500/10';
      case 'MONTH': return 'text-purple-500 bg-purple-500/10';
      case 'ALL': return 'text-amber-500 bg-amber-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  if (!builder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto scrollbar-hide bg-card border-border p-4 md:p-6">
        <DialogHeader className="pb-3 md:pb-4 border-b border-border">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-muted border-2 border-border">
                {builder.logo ? (
                  <img 
                    src={builder.logo} 
                    alt={builder.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl md:text-2xl font-bold text-primary bg-primary/10">
                    {builder.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {builder.verified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-background">
                  <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <DialogTitle className="text-base md:text-xl font-bold truncate">{builder.name}</DialogTitle>
                <Badge 
                  className={`bg-gradient-to-r ${getRankColor(builder.rank)} text-black font-bold text-xs`}
                >
                  #{builder.rank}
                </Badge>
                {builder.verified && (
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs hidden sm:inline-flex">
                    Verified
                  </Badge>
                )}
              </div>
              
              {builder.address && (
                <button 
                  onClick={copyAddress}
                  className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground hover:text-foreground mt-1 transition-colors"
                >
                  <Wallet className="w-3 h-3" />
                  <span className="font-mono">{builder.address.slice(0, 6)}...{builder.address.slice(-4)}</span>
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>

            <a
              href={`https://polymarket.com/profile/${builder.address || builder.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-primary" />
            </a>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-6">
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {/* Data Source Badge */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live data from Polymarket API
            </div>

            {/* Period Cards - Real Data Only */}
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              {periodData.map((data, index) => (
                <div 
                  key={data.period}
                  className={`p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br border ${getPeriodColor(data.period)} ${!data.found ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                    <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center ${getPeriodIconColor(data.period)}`}>
                      {data.period === 'DAY' && <Clock className="w-3 h-3 md:w-4 md:h-4" />}
                      {data.period === 'WEEK' && <Calendar className="w-3 h-3 md:w-4 md:h-4" />}
                      {data.period === 'MONTH' && <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />}
                      {data.period === 'ALL' && <DollarSign className="w-3 h-3 md:w-4 md:h-4" />}
                    </div>
                    <span className="text-xs md:text-sm font-medium text-foreground">{data.label}</span>
                    {data.found && data.rank > 0 && (
                      <Badge variant="outline" className="ml-auto text-[10px] md:text-xs px-1.5 py-0">
                        #{data.rank}
                      </Badge>
                    )}
                  </div>
                  
                  {data.found ? (
                    <div className="space-y-1 md:space-y-2">
                      <div>
                        <AnimatedNumber 
                          value={data.volume}
                          duration={1200}
                          delay={index * 100}
                          formatter={formatVolume}
                          className="text-base md:text-xl font-bold text-foreground block"
                        />
                        <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          Volume
                        </p>
                      </div>
                      <div>
                        <AnimatedNumber 
                          value={data.users}
                          duration={1000}
                          delay={index * 100 + 100}
                          formatter={formatUsers}
                          className="text-sm md:text-lg font-semibold text-foreground block"
                        />
                        <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          Active Users
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Not ranked
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Volume Comparison Bar */}
            {periodData.some(d => d.found) && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <h4 className="text-sm font-semibold mb-4">Volume Comparison</h4>
                <div className="space-y-3">
                  {periodData.filter(d => d.found && d.volume > 0).map((data) => {
                    const maxVolume = Math.max(...periodData.map(d => d.volume));
                    const percentage = (data.volume / maxVolume) * 100;
                    
                    return (
                      <div key={data.period} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">{data.label}</span>
                          <span className="text-muted-foreground font-mono">{formatVolume(data.volume)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out ${
                              data.period === 'DAY' ? 'bg-blue-500' :
                              data.period === 'WEEK' ? 'bg-green-500' :
                              data.period === 'MONTH' ? 'bg-purple-500' :
                              'bg-amber-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* External Link */}
            <div className="pt-2 text-center">
              <a
                href={`https://polymarket.com/profile/${builder.address || builder.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Full Profile on Polymarket
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BuilderDetailModal;
