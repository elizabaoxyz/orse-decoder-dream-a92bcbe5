import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Bot, 
  ArrowLeft,
  Scan,
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  Pause,
  Play,
  Power,
  PowerOff,
  Zap,
  Wallet,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Radio,
  CircleDot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Direct API call to HTTPS backend
const API_BASE = 'https://polymarket.elizabao.xyz';

const callApi = async (endpoint: string, body?: object, method: 'POST' | 'GET' = 'POST') => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: method === 'POST' && body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || 'Request failed');
  }
  
  return response.json();
};

interface AIDecision {
  shouldTrade: boolean;
  action: "BUY" | "SELL" | "HOLD";
  market?: { question: string; id?: string };
  price?: number;
  size?: number;
  reasoning: string;
  confidence: number;
}

interface Opportunity {
  id: string;
  question: string;
  yesPrice?: number;
  volume24h?: number;
  liquidity?: number;
  score: number;
}

interface AutonomyStatus {
  enabled: boolean;
  running: boolean;
  totalScans: number;
  totalTrades: number;
  autoTradeEnabled?: boolean;
  lastDecision?: {
    action: string;
    market?: { question?: string };
    timestamp?: string;
    confidence?: number;
  };
}

interface WalletInfo {
  address: string;
  balance: number;
  network: string;
  ready: boolean;
}

interface TradeHistoryItem {
  id?: string;
  timestamp: string;
  action: string;
  market?: { question?: string; id?: string } | null;
  price?: number;
  size?: number;
  status?: string;
  shouldTrade?: boolean;
  reasoning?: string;
  confidence?: number;
  scanNumber?: number;
  tradeResult?: { success: boolean; reason?: string; simulated?: boolean };
}

interface ActivityLog {
  timestamp: Date;
  type: "scan" | "analyze" | "error" | "auto" | "wallet";
  message: string;
}

// Animated pulse ring component
const PulseRing = ({ active, color = "primary" }: { active: boolean; color?: string }) => (
  <div className="relative">
    <div className={cn(
      "h-3 w-3 rounded-full transition-all duration-300",
      active 
        ? color === "primary" ? "bg-primary" : color === "green" ? "bg-green-500" : "bg-yellow-500"
        : "bg-muted-foreground/30"
    )} />
    {active && (
      <>
        <div className={cn(
          "absolute inset-0 rounded-full animate-ping opacity-75",
          color === "primary" ? "bg-primary" : color === "green" ? "bg-green-500" : "bg-yellow-500"
        )} />
        <div className={cn(
          "absolute -inset-1 rounded-full animate-pulse opacity-30",
          color === "primary" ? "bg-primary" : color === "green" ? "bg-green-500" : "bg-yellow-500"
        )} />
      </>
    )}
  </div>
);

// Status badge component with proper styling (no ref issues)
const StatusBadge = ({ 
  children, 
  variant = "default",
  className 
}: { 
  children: React.ReactNode; 
  variant?: "default" | "success" | "warning" | "danger" | "muted";
  className?: string;
}) => {
  const variants = {
    default: "bg-primary/20 text-primary border-primary/30",
    success: "bg-green-500/20 text-green-400 border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    danger: "bg-red-500/20 text-red-400 border-red-500/30",
    muted: "bg-muted text-muted-foreground border-border"
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

// Glowing card component
const GlowCard = ({ 
  children, 
  className,
  glowColor = "primary",
  active = false 
}: { 
  children: React.ReactNode; 
  className?: string;
  glowColor?: "primary" | "green" | "red";
  active?: boolean;
}) => (
  <div className={cn(
    "relative rounded-xl border bg-card overflow-hidden transition-all duration-500",
    active && glowColor === "primary" && "border-primary/50 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]",
    active && glowColor === "green" && "border-green-500/50 shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]",
    active && glowColor === "red" && "border-red-500/50 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]",
    !active && "border-border",
    className
  )}>
    {/* Animated gradient border */}
    {active && (
      <div className="absolute inset-0 opacity-20">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r animate-pulse",
          glowColor === "primary" && "from-primary/0 via-primary/20 to-primary/0",
          glowColor === "green" && "from-green-500/0 via-green-500/20 to-green-500/0",
          glowColor === "red" && "from-red-500/0 via-red-500/20 to-red-500/0"
        )} />
      </div>
    )}
    <div className="relative">{children}</div>
  </div>
);

export default function Autonomous() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiDecision, setAiDecision] = useState<AIDecision | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  
  // Wallet state
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [showWalletAddress, setShowWalletAddress] = useState(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  
  // Autonomy controls
  const [autonomyStatus, setAutonomyStatus] = useState<AutonomyStatus | null>(null);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  const [isTogglingAutonomy, setIsTogglingAutonomy] = useState(false);
  const [isTogglingTrading, setIsTogglingTrading] = useState(false);
  const [tradingEnabled, setTradingEnabled] = useState(false);
  
  // Settings
  const [riskLevel, setRiskLevel] = useState<"conservative" | "moderate" | "aggressive">("aggressive");
  const [maxOrderSize, setMaxOrderSize] = useState(25);
  
  // Auto-refresh settings
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [nextRefreshIn, setNextRefreshIn] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((type: ActivityLog["type"], message: string) => {
    setActivityLog(prev => [
      { timestamp: new Date(), type, message },
      ...prev.slice(0, 49)
    ]);
  }, []);

  // Fetch wallet info
  const fetchWalletInfo = useCallback(async () => {
    setIsLoadingWallet(true);
    try {
      const result = await callApi('/api/wallet', undefined, 'GET');
      if (result.success && result.data) {
        setWalletInfo({
          address: result.data.address || result.data.proxyWallet || 'Not configured',
          balance: result.data.usdcBalance || result.data.balance || 0,
          network: result.data.network || 'Polygon',
          ready: result.data.ready !== false && (result.data.usdcBalance || 0) > 0
        });
        addLog("wallet", `Wallet loaded: ${(result.data.usdcBalance || 0).toFixed(2)} USDC`);
      }
    } catch (error) {
      console.error('Failed to fetch wallet info:', error);
      // Set demo wallet info for display purposes
      setWalletInfo({
        address: '0x...configure on VPS',
        balance: 0,
        network: 'Polygon',
        ready: false
      });
    } finally {
      setIsLoadingWallet(false);
    }
  }, [addLog]);

  // Fetch autonomy status
  const fetchAutonomyStatus = useCallback(async () => {
    try {
      const result = await callApi('/api/autonomy/status', undefined, 'GET');
      if (result.success && result.data) {
        setAutonomyStatus(result.data);
        setTradingEnabled(result.data.autoTradeEnabled || false);
      }
    } catch (error) {
      console.error('Failed to fetch autonomy status:', error);
    }
  }, []);

  // Fetch trade history
  const fetchTradeHistory = useCallback(async () => {
    try {
      const result = await callApi('/api/history', undefined, 'GET');
      if (result.success && result.data) {
        setTradeHistory(Array.isArray(result.data) ? result.data : result.data.trades || []);
      }
    } catch (error) {
      console.error('Failed to fetch trade history:', error);
    }
  }, []);

  // Start autonomy
  const handleStartAutonomy = useCallback(async () => {
    setIsTogglingAutonomy(true);
    addLog("auto", "🚀 Starting autonomous scanning...");
    try {
      const result = await callApi('/api/autonomy/start', { riskLevel, maxOrderSize });
      if (result.success) {
        addLog("auto", "✅ Autonomous scanning started");
        toast({ title: "Scanning Started", description: "AI is now scanning markets autonomously" });
        fetchAutonomyStatus();
      } else {
        throw new Error(result.error || "Failed to start");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addLog("error", `❌ Failed to start: ${message}`);
      toast({ title: "Start Failed", description: message, variant: "destructive" });
    } finally {
      setIsTogglingAutonomy(false);
    }
  }, [addLog, riskLevel, maxOrderSize, toast, fetchAutonomyStatus]);

  // Stop autonomy
  const handleStopAutonomy = useCallback(async () => {
    setIsTogglingAutonomy(true);
    addLog("auto", "⏹️ Stopping autonomous scanning...");
    try {
      const result = await callApi('/api/autonomy/stop', {});
      if (result.success) {
        addLog("auto", "✅ Autonomous scanning stopped");
        toast({ title: "Scanning Stopped", description: "AI scanning has been stopped" });
        fetchAutonomyStatus();
      } else {
        throw new Error(result.error || "Failed to stop");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addLog("error", `❌ Failed to stop: ${message}`);
      toast({ title: "Stop Failed", description: message, variant: "destructive" });
    } finally {
      setIsTogglingAutonomy(false);
    }
  }, [addLog, toast, fetchAutonomyStatus]);

  // Enable real trading
  const handleEnableTrading = useCallback(async () => {
    setIsTogglingTrading(true);
    addLog("auto", "⚡ Enabling real trading...");
    try {
      const result = await callApi('/api/trade/enable', {});
      if (result.success) {
        setTradingEnabled(true);
        addLog("auto", "🔴 LIVE TRADING ENABLED - Real funds at risk!");
        toast({ 
          title: "⚠️ Live Trading Enabled", 
          description: "Real trades will now execute on the blockchain",
        });
        fetchAutonomyStatus();
      } else {
        throw new Error(result.error || "Failed to enable");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addLog("error", `❌ Failed to enable trading: ${message}`);
      toast({ title: "Enable Failed", description: message, variant: "destructive" });
    } finally {
      setIsTogglingTrading(false);
    }
  }, [addLog, toast, fetchAutonomyStatus]);

  // Disable real trading
  const handleDisableTrading = useCallback(async () => {
    setIsTogglingTrading(true);
    addLog("auto", "🛑 Disabling real trading...");
    try {
      const result = await callApi('/api/trade/disable', {});
      if (result.success) {
        setTradingEnabled(false);
        addLog("auto", "✅ Real trading DISABLED - Safe mode");
        toast({ 
          title: "Trading Disabled", 
          description: "No real trades will execute (scan only)",
        });
        fetchAutonomyStatus();
      } else {
        throw new Error(result.error || "Failed to disable");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addLog("error", `❌ Failed to disable trading: ${message}`);
      toast({ title: "Disable Failed", description: message, variant: "destructive" });
    } finally {
      setIsTogglingTrading(false);
    }
  }, [addLog, toast, fetchAutonomyStatus]);

  // Initial fetch
  useEffect(() => {
    fetchAutonomyStatus();
    fetchTradeHistory();
    fetchWalletInfo();
    const interval = setInterval(() => {
      fetchAutonomyStatus();
      fetchTradeHistory();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchAutonomyStatus, fetchTradeHistory, fetchWalletInfo]);

  const handleScan = useCallback(async (isAuto = false) => {
    setIsScanning(true);
    addLog(isAuto ? "auto" : "scan", isAuto ? "🔄 Auto-scanning markets..." : "🔍 Starting market scan...");
    
    try {
      const result = await callApi('/api/scan', { 
        riskLevel, 
        maxOrderSize,
        minSpread: 0.1,
        maxSpread: 50
      });
      
      if (result.success && result.data?.opportunities) {
        setOpportunities(result.data.opportunities);
        addLog(isAuto ? "auto" : "scan", `📊 Found ${result.data.opportunities.length} opportunities`);
        if (!isAuto) {
          toast({
            title: "Scan Complete",
            description: `Found ${result.data.opportunities.length} market opportunities`
          });
        }
      } else {
        throw new Error(result.error || "Scan failed");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addLog("error", `❌ Scan failed: ${message}`);
      if (!isAuto) {
        toast({
          title: "Scan Failed",
          description: message,
          variant: "destructive"
        });
      }
    } finally {
      setIsScanning(false);
    }
  }, [addLog, riskLevel, maxOrderSize, toast]);

  const handleAnalyze = useCallback(async (isAuto = false) => {
    setIsAnalyzing(true);
    addLog(isAuto ? "auto" : "analyze", isAuto ? "🤖 Auto AI analysis..." : "🧠 Running AI analysis...");
    
    try {
      const result = await callApi('/api/analyze', { 
        riskLevel, 
        maxOrderSize,
        minSpread: 0.1,
        maxSpread: 50
      });
      
      if (result.success && result.data) {
        if (result.data.aiDecision) {
          setAiDecision(result.data.aiDecision);
        }
        if (result.data.topOpportunities) {
          setOpportunities(result.data.topOpportunities);
        }
        const action = result.data.aiDecision?.action || "HOLD";
        const emoji = action === "BUY" ? "📈" : action === "SELL" ? "📉" : "⏸️";
        addLog(isAuto ? "auto" : "analyze", `${emoji} AI recommends: ${action}`);
        if (!isAuto) {
          toast({
            title: "Analysis Complete",
            description: `AI Decision: ${action}`
          });
        }
      } else {
        throw new Error(result.error || "Analysis failed");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addLog("error", `❌ Analysis failed: ${message}`);
      if (!isAuto) {
        toast({
          title: "Analysis Failed",
          description: message,
          variant: "destructive"
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [addLog, riskLevel, maxOrderSize, toast]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      setNextRefreshIn(refreshInterval);
      
      countdownRef.current = setInterval(() => {
        setNextRefreshIn(prev => {
          if (prev <= 1) return refreshInterval;
          return prev - 1;
        });
      }, 1000);
      
      handleAnalyze(true);
      
      intervalRef.current = setInterval(() => {
        handleAnalyze(true);
      }, refreshInterval * 1000);
      
      addLog("auto", `⏱️ Auto-refresh enabled (every ${refreshInterval}s)`);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setNextRefreshIn(0);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefresh, refreshInterval, handleAnalyze, addLog]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit", 
      second: "2-digit" 
    });
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 15) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Animated background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-primary/5 via-transparent to-transparent animate-pulse" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial from-primary/3 via-transparent to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className="h-8 w-8 text-primary" />
                {autonomyStatus?.running && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Autonomous AI</h1>
                <p className="text-xs text-muted-foreground">Polymarket Trading Agent</p>
              </div>
            </div>
          </div>
          
          {/* Quick status in header */}
          <div className="hidden md:flex items-center gap-4">
            <StatusBadge variant={autonomyStatus?.running ? "success" : "muted"}>
              <Radio className="h-3 w-3" />
              {autonomyStatus?.running ? "Scanning" : "Idle"}
            </StatusBadge>
            <StatusBadge variant={tradingEnabled ? "danger" : "muted"}>
              <Zap className="h-3 w-3" />
              {tradingEnabled ? "LIVE" : "Safe Mode"}
            </StatusBadge>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6 relative">
        {/* Hero Section - Main Controls */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Autonomy Control Card */}
          <GlowCard active={autonomyStatus?.running} glowColor="primary">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Scan className="h-5 w-5 text-primary" />
                  </div>
                  <span>Market Scanner</span>
                </div>
                <PulseRing active={autonomyStatus?.running || false} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {autonomyStatus?.running ? "Active" : "Inactive"}
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span><strong className="text-foreground">{autonomyStatus?.totalScans || 0}</strong> scans</span>
                    <span><strong className="text-foreground">{autonomyStatus?.totalTrades || 0}</strong> trades</span>
                  </div>
                </div>
                {autonomyStatus?.lastDecision && (
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground mb-1">Last Decision</div>
                    <StatusBadge 
                      variant={
                        autonomyStatus.lastDecision.action === "BUY" ? "success" : 
                        autonomyStatus.lastDecision.action === "SELL" ? "danger" : "warning"
                      }
                    >
                      {autonomyStatus.lastDecision.action === "BUY" && <TrendingUp className="h-3 w-3" />}
                      {autonomyStatus.lastDecision.action === "SELL" && <TrendingDown className="h-3 w-3" />}
                      {autonomyStatus.lastDecision.action}
                    </StatusBadge>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="lg"
                  onClick={handleStartAutonomy}
                  disabled={isTogglingAutonomy || autonomyStatus?.running}
                  className="h-14"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Scanning
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleStopAutonomy}
                  disabled={isTogglingAutonomy || !autonomyStatus?.running}
                  className="h-14"
                >
                  <Pause className="h-5 w-5 mr-2" />
                  Stop
                </Button>
              </div>
            </CardContent>
          </GlowCard>

          {/* Trading Control Card */}
          <GlowCard active={tradingEnabled} glowColor={tradingEnabled ? "red" : "primary"}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    tradingEnabled ? "bg-red-500/20" : "bg-muted"
                  )}>
                    <Zap className={cn("h-5 w-5", tradingEnabled ? "text-red-400" : "text-muted-foreground")} />
                  </div>
                  <span>Live Trading</span>
                </div>
                <PulseRing active={tradingEnabled} color={tradingEnabled ? "green" : "primary"} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={cn(
                "p-4 rounded-lg border transition-all",
                tradingEnabled 
                  ? "bg-red-500/10 border-red-500/30" 
                  : "bg-muted/30 border-border"
              )}>
                <div className="flex items-center gap-3 mb-2">
                  <Shield className={cn("h-5 w-5", tradingEnabled ? "text-red-400" : "text-green-400")} />
                  <span className="font-semibold">
                    {tradingEnabled ? "⚠️ LIVE MODE" : "🛡️ Safe Mode"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {tradingEnabled 
                    ? "Real trades will execute on Polygon with actual USDC funds" 
                    : "AI will scan and recommend trades without executing"}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="lg"
                  variant={tradingEnabled ? "outline" : "default"}
                  onClick={handleEnableTrading}
                  disabled={isTogglingTrading || tradingEnabled}
                  className={cn("h-14", !tradingEnabled && "bg-primary hover:bg-primary/90")}
                >
                  <Power className="h-5 w-5 mr-2" />
                  Enable
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleDisableTrading}
                  disabled={isTogglingTrading || !tradingEnabled}
                  className="h-14"
                >
                  <PowerOff className="h-5 w-5 mr-2" />
                  Disable
                </Button>
              </div>
            </CardContent>
          </GlowCard>
        </div>

        {/* Dev Wallet Card */}
        <GlowCard active={walletInfo?.ready}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <span>Trading Wallet</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchWalletInfo}
                  disabled={isLoadingWallet}
                >
                  <RefreshCw className={cn("h-4 w-4", isLoadingWallet && "animate-spin")} />
                </Button>
                <StatusBadge variant={walletInfo?.ready ? "success" : "warning"}>
                  {walletInfo?.ready ? "Ready" : "Not Ready"}
                </StatusBadge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Balance */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="text-xs text-muted-foreground mb-1">Available Balance</div>
                <div className="text-3xl font-bold text-primary">
                  ${walletInfo?.balance?.toFixed(2) || "0.00"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">USDC on {walletInfo?.network || "Polygon"}</div>
              </div>
              
              {/* Wallet Address */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border md:col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Wallet Address (VPS Backend)</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-sm bg-background/50 px-3 py-2 rounded border border-border">
                    {showWalletAddress 
                      ? walletInfo?.address || "Not configured" 
                      : truncateAddress(walletInfo?.address || "Not configured")}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowWalletAddress(!showWalletAddress)}
                  >
                    {showWalletAddress ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  {walletInfo?.address && walletInfo.address.startsWith("0x") && (
                    <a 
                      href={`https://polygonscan.com/address/${walletInfo.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This wallet is managed by the VPS backend. Fund with USDC + MATIC for gas.
                </p>
              </div>
            </div>
          </CardContent>
        </GlowCard>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => handleScan(false)}
            disabled={isScanning}
            className="h-14"
          >
            <Scan className={cn("h-5 w-5 mr-2", isScanning && "animate-spin")} />
            {isScanning ? "Scanning..." : "Scan Markets"}
          </Button>
          <Button 
            size="lg" 
            onClick={() => handleAnalyze(false)}
            disabled={isAnalyzing}
            className="h-14"
          >
            <Brain className={cn("h-5 w-5 mr-2", isAnalyzing && "animate-pulse")} />
            {isAnalyzing ? "Analyzing..." : "AI Analyze"}
          </Button>
          <Button
            size="lg"
            variant={autoRefresh ? "destructive" : "secondary"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="h-14"
          >
            {autoRefresh ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Stop ({nextRefreshIn}s)
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Auto Scan
              </>
            )}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* AI Decision Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                AI Decision
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiDecision ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <StatusBadge 
                      variant={
                        aiDecision.action === "BUY" ? "success" : 
                        aiDecision.action === "SELL" ? "danger" : "warning"
                      }
                      className="text-lg px-4 py-2"
                    >
                      {aiDecision.action === "BUY" && <TrendingUp className="h-4 w-4" />}
                      {aiDecision.action === "SELL" && <TrendingDown className="h-4 w-4" />}
                      {aiDecision.action}
                    </StatusBadge>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="font-bold text-lg">
                        {aiDecision.confidence > 1 
                          ? aiDecision.confidence.toFixed(0) 
                          : (aiDecision.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <StatusBadge variant={aiDecision.shouldTrade ? "success" : "warning"}>
                      {aiDecision.shouldTrade ? (
                        <><CheckCircle className="h-3 w-3" /> Recommended</>
                      ) : (
                        <><AlertCircle className="h-3 w-3" /> Hold</>
                      )}
                    </StatusBadge>
                  </div>
                  
                  {aiDecision.market && (
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground">Target Market</span>
                          <p className="font-medium">{aiDecision.market.question}</p>
                        </div>
                        {aiDecision.price !== undefined && (
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground">Price</span>
                            <p className="font-bold text-primary">
                              {(aiDecision.price * 100).toFixed(1)}¢
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4 rounded-lg bg-muted/20 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">AI Reasoning</span>
                    </div>
                    <p className="text-sm leading-relaxed">{aiDecision.reasoning}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="relative inline-block">
                    <Bot className="h-20 w-20 text-muted-foreground/20" />
                    <Sparkles className="h-6 w-6 text-primary/50 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <p className="text-muted-foreground mt-4">Click "AI Analyze" to get trading recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Settings className="h-5 w-5" />
                </div>
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Risk Level</label>
                <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as typeof riskLevel)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    <SelectItem value="conservative">🛡️ Conservative</SelectItem>
                    <SelectItem value="moderate">⚖️ Moderate</SelectItem>
                    <SelectItem value="aggressive">🔥 Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Max Order Size</label>
                  <span className="text-sm font-mono text-primary">${maxOrderSize}</span>
                </div>
                <Slider
                  value={[maxOrderSize]}
                  onValueChange={([v]) => setMaxOrderSize(v)}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Auto Scan Interval</label>
                  <span className="text-sm font-mono text-primary">{refreshInterval}s</span>
                </div>
                <Slider
                  value={[refreshInterval]}
                  onValueChange={([v]) => setRefreshInterval(v)}
                  min={10}
                  max={120}
                  step={5}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Opportunities List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              Top Opportunities
              {opportunities.length > 0 && (
                <StatusBadge variant="default">{opportunities.length}</StatusBadge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {opportunities.length > 0 ? (
              <div className="space-y-3">
                {opportunities.slice(0, 5).map((opp, idx) => (
                  <div 
                    key={opp.id || idx} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border hover:bg-muted/40 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover:text-primary transition-colors">
                        {opp.question}
                      </p>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        {opp.yesPrice !== undefined && (
                          <span>Price: <strong className="text-foreground">{(opp.yesPrice * 100).toFixed(1)}¢</strong></span>
                        )}
                        {opp.volume24h !== undefined && (
                          <span>Vol: <strong className="text-foreground">${(opp.volume24h / 1000).toFixed(0)}K</strong></span>
                        )}
                        {opp.liquidity !== undefined && (
                          <span>Liq: <strong className="text-foreground">${(opp.liquidity / 1000).toFixed(0)}K</strong></span>
                        )}
                      </div>
                    </div>
                    <StatusBadge variant="default" className="ml-4">
                      Score: {opp.score?.toFixed(2) ?? 'N/A'}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Scan className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground">No opportunities yet. Click "Scan Markets" to find opportunities.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trade History & Activity Log */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Trade History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Activity className="h-5 w-5" />
                </div>
                Trade History
                {tradeHistory.length > 0 && (
                  <StatusBadge variant="muted">{tradeHistory.length}</StatusBadge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {tradeHistory.length > 0 ? (
                  <div className="space-y-2 pr-4">
                    {tradeHistory.map((trade, idx) => (
                      <div 
                        key={trade.id || idx} 
                        className="p-3 rounded-lg bg-muted/20 border border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <StatusBadge 
                            variant={
                              trade.action === 'BUY' ? 'success' : 
                              trade.action === 'SELL' ? 'danger' : 'warning'
                            }
                          >
                            {trade.action}
                          </StatusBadge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(trade.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm truncate">
                          {trade.market?.question || trade.reasoning?.substring(0, 50) || 'N/A'}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {trade.confidence !== undefined && (
                            <span>Confidence: {trade.confidence > 1 ? trade.confidence.toFixed(0) : (trade.confidence * 100).toFixed(0)}%</span>
                          )}
                          {trade.tradeResult && (
                            <StatusBadge variant={trade.tradeResult.success ? "success" : "warning"} className="text-[10px]">
                              {trade.tradeResult.simulated ? "Simulated" : trade.tradeResult.success ? "Executed" : "Failed"}
                            </StatusBadge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CircleDot className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No trades yet</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Clock className="h-5 w-5" />
                </div>
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {activityLog.length > 0 ? (
                  <div className="space-y-1 pr-4">
                    {activityLog.map((log, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "flex items-start gap-3 text-sm p-2 rounded transition-colors",
                          log.type === "error" && "bg-red-500/10",
                          log.type === "auto" && "bg-primary/5"
                        )}
                      >
                        <span className="text-xs text-muted-foreground shrink-0 font-mono">
                          {formatTime(log.timestamp)}
                        </span>
                        <span className={cn(
                          log.type === "error" && "text-red-400"
                        )}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No activity yet</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
