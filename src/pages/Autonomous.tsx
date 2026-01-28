import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Bot, 
  ArrowLeft,
  Scan,
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  Play,
  Square,
  Wallet,
  ExternalLink,
  Copy,
  RefreshCw,
  Shield,
  Radio,
  Zap,
  Clock,
  Search,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Minus,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ============================================
// Configuration
// ============================================
const API_BASE = 'https://polymarket.elizabao.xyz';
const WALLET_ADDRESS = '0xb05cA5145C37eb051B33Cb571607570f2CB74002';
const POLL_INTERVAL = 10000; // 10 seconds

// ============================================
// API Helper
// ============================================
const callApi = async (endpoint: string, body?: object, method: 'POST' | 'GET' = 'POST') => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' && body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || 'Request failed');
  }
  
  return response.json();
};

// ============================================
// Types
// ============================================
interface AgentStatus {
  llm: string;
  wallet: string;
  clobConfigured: boolean;
  autoTradeEnabled: boolean;
  autonomy: {
    enabled: boolean;
    running: boolean;
    intervalMs: number;
  };
  totalScans: number;
  totalTrades: number;
}

interface AutonomyStatus {
  enabled: boolean;
  running: boolean;
  intervalMs: number;
  autoTradeEnabled: boolean;
  totalScans: number;
  totalTrades: number;
  lastDecision?: {
    action: string;
    market?: { question?: string; id?: string; yesPrice?: number };
    timestamp?: string;
    confidence?: number;
    reasoning?: string;
  };
}

interface TradeHistoryItem {
  timestamp: string;
  action: string;
  market?: { question?: string; id?: string };
  confidence?: number;
  reasoning?: string;
  tradeResult?: { success: boolean; reason?: string; error?: string };
}

interface Opportunity {
  id: string;
  question: string;
  yesPrice?: number;
  volume24h?: number;
  liquidity?: number;
  score: number;
  slug?: string;
}

interface AnalysisResult {
  action: string;
  market?: { question?: string; id?: string };
  confidence?: number;
  reasoning?: string;
}

interface WalletBalance {
  address: string;
  pol: { balance: string; symbol: string };
  usdc: { balance: string; symbol: string };
}

// ============================================
// Components
// ============================================

// Status indicator with pulse animation
const StatusDot = ({ active, color = "green" }: { active: boolean; color?: "green" | "red" | "yellow" | "gray" }) => {
  const colors = {
    green: "bg-green-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    gray: "bg-gray-500"
  };
  
  return (
    <span className="relative flex h-3 w-3">
      {active && (
        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", colors[color])} />
      )}
      <span className={cn("relative inline-flex rounded-full h-3 w-3", colors[color])} />
    </span>
  );
};

// Badge component
const Badge = ({ 
  children, 
  variant = "default",
  size = "sm"
}: { 
  children: React.ReactNode; 
  variant?: "default" | "success" | "warning" | "danger" | "muted";
  size?: "sm" | "md";
}) => {
  const variants = {
    default: "bg-primary/20 text-primary border-primary/30",
    success: "bg-green-500/20 text-green-400 border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    danger: "bg-red-500/20 text-red-400 border-red-500/30",
    muted: "bg-muted text-muted-foreground border-border"
  };
  
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm"
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 font-medium rounded-full border",
      variants[variant],
      sizes[size]
    )}>
      {children}
    </span>
  );
};

// Glass card with optional glow
const GlassCard = ({ 
  children, 
  className,
  glow = false,
  glowColor = "primary"
}: { 
  children: React.ReactNode; 
  className?: string;
  glow?: boolean;
  glowColor?: "primary" | "green" | "red";
}) => {
  const glowStyles = {
    primary: "shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)] border-primary/40",
    green: "shadow-[0_0_40px_-10px_rgba(34,197,94,0.4)] border-green-500/40",
    red: "shadow-[0_0_40px_-10px_rgba(239,68,68,0.4)] border-red-500/40"
  };

  return (
    <div className={cn(
      "rounded-2xl border bg-card/80 backdrop-blur-xl transition-all duration-500",
      glow ? glowStyles[glowColor] : "border-border",
      className
    )}>
      {children}
    </div>
  );
};

// ============================================
// Main Component
// ============================================
export default function Autonomous() {
  const { toast } = useToast();
  
  // Agent & status state
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [autonomyStatus, setAutonomyStatus] = useState<AutonomyStatus | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  
  // Control state
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isEnablingTrade, setIsEnablingTrade] = useState(false);
  const [isDisablingTrade, setIsDisablingTrade] = useState(false);
  const [scanInterval, setScanInterval] = useState("60000");
  
  // Data state
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activityLog, setActivityLog] = useState<{ time: Date; message: string; type: "info" | "buy" | "sell" | "hold" | "error" }[]>([]);
  
  // Analysis state
  const [riskLevel, setRiskLevel] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Opportunity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  
  // Wallet balance state
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);

  // Add to activity log
  const addActivity = useCallback((message: string, type: "info" | "buy" | "sell" | "hold" | "error" = "info") => {
    setActivityLog(prev => [{ time: new Date(), message, type }, ...prev.slice(0, 99)]);
  }, []);

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Address copied to clipboard" });
  };

  // Truncate address
  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Format time
  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Format number
  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toFixed(0)}`;
  };

  // ============================================
  // API Calls
  // ============================================

  // Fetch agent status
  const fetchAgentStatus = useCallback(async () => {
    try {
      const result = await callApi('/api/status', undefined, 'GET');
      if (result.success && result.data) {
        setAgentStatus(result.data);
        setIsOnline(true);
      }
    } catch (error) {
      console.error('Failed to fetch agent status:', error);
      setIsOnline(false);
    }
  }, []);

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    try {
      const result = await callApi('/api/wallet', undefined, 'GET');
      if (result.success && result.data) {
        setWalletBalance(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    }
  }, []);

  // Fetch autonomy status
  const fetchAutonomyStatus = useCallback(async () => {
    try {
      const result = await callApi('/api/autonomy/status', undefined, 'GET');
      if (result.success && result.data) {
        const prev = autonomyStatus;
        setAutonomyStatus(result.data);
        
        // Add activity for new decisions
        if (result.data.lastDecision && 
            (!prev?.lastDecision || 
             prev.lastDecision.timestamp !== result.data.lastDecision.timestamp)) {
          const decision = result.data.lastDecision;
          const action = decision.action || 'HOLD';
          const market = decision.market?.question || 'No market';
          const confidence = decision.confidence ? `(${decision.confidence}%)` : '';
          const type = action === 'BUY' ? 'buy' : action === 'SELL' ? 'sell' : 'hold';
          addActivity(`${action} Signal - "${market}" ${confidence}`, type);
        }
      }
    } catch (error) {
      console.error('Failed to fetch autonomy status:', error);
    }
  }, [autonomyStatus, addActivity]);

  // Fetch trade history
  const fetchTradeHistory = useCallback(async () => {
    try {
      const result = await callApi('/api/history', undefined, 'GET');
      if (result.success && result.data) {
        const trades = Array.isArray(result.data) ? result.data : result.data.trades || [];
        setTradeHistory(trades);
      }
    } catch (error) {
      console.error('Failed to fetch trade history:', error);
    }
  }, []);

  // Start autonomy
  const handleStart = async () => {
    setIsStarting(true);
    try {
      const result = await callApi('/api/autonomy/start', { intervalMs: parseInt(scanInterval) });
      if (result.success) {
        addActivity('🚀 Autonomous scanning started', 'info');
        toast({ title: "Started", description: "AI scanning is now active" });
        fetchAutonomyStatus();
      }
    } catch (error) {
      addActivity(`❌ Failed to start: ${error}`, 'error');
      toast({ title: "Error", description: String(error), variant: "destructive" });
    } finally {
      setIsStarting(false);
    }
  };

  // Stop autonomy
  const handleStop = async () => {
    setIsStopping(true);
    try {
      const result = await callApi('/api/autonomy/stop', {});
      if (result.success) {
        addActivity('⏹️ Autonomous scanning stopped', 'info');
        toast({ title: "Stopped", description: "AI scanning has stopped" });
        fetchAutonomyStatus();
      }
    } catch (error) {
      addActivity(`❌ Failed to stop: ${error}`, 'error');
      toast({ title: "Error", description: String(error), variant: "destructive" });
    } finally {
      setIsStopping(false);
    }
  };

  // Enable trading
  const handleEnableTrading = async () => {
    setIsEnablingTrade(true);
    try {
      const result = await callApi('/api/trade/enable', {});
      if (result.success) {
        addActivity('⚡ LIVE TRADING ENABLED - Real funds at risk!', 'error');
        toast({ title: "⚠️ Trading Enabled", description: "Real trades will now execute" });
        fetchAutonomyStatus();
      }
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    } finally {
      setIsEnablingTrade(false);
    }
  };

  // Disable trading
  const handleDisableTrading = async () => {
    setIsDisablingTrade(true);
    try {
      const result = await callApi('/api/trade/disable', {});
      if (result.success) {
        addActivity('🛡️ Trading disabled - Safe mode', 'info');
        toast({ title: "Trading Disabled", description: "Scan-only mode active" });
        fetchAutonomyStatus();
      }
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    } finally {
      setIsDisablingTrade(false);
    }
  };

  // Scan markets
  const handleScan = async () => {
    setIsScanning(true);
    addActivity('🔍 Scanning markets...', 'info');
    try {
      const result = await callApi('/api/scan', { riskLevel });
      if (result.success && result.data?.opportunities) {
        setOpportunities(result.data.opportunities);
        addActivity(`📊 Found ${result.data.opportunities.length} opportunities`, 'info');
        toast({ title: "Scan Complete", description: `Found ${result.data.opportunities.length} opportunities` });
      }
    } catch (error) {
      addActivity(`❌ Scan failed: ${error}`, 'error');
      toast({ title: "Scan Failed", description: String(error), variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  };

  // Analyze markets
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    addActivity('🧠 Running AI analysis...', 'info');
    try {
      const result = await callApi('/api/analyze', { riskLevel });
      if (result.success && result.data) {
        const decision = result.data.aiDecision || result.data;
        setAnalysisResult(decision);
        const action = decision.action || 'HOLD';
        addActivity(`${action === 'BUY' ? '📈' : action === 'SELL' ? '📉' : '⏸️'} AI recommends: ${action}`, 
          action === 'BUY' ? 'buy' : action === 'SELL' ? 'sell' : 'hold');
        toast({ title: "Analysis Complete", description: `Recommendation: ${action}` });
      }
    } catch (error) {
      addActivity(`❌ Analysis failed: ${error}`, 'error');
      toast({ title: "Analysis Failed", description: String(error), variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Search markets
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await callApi('/api/search', { query: searchQuery });
      if (result.success && result.data) {
        setSearchResults(Array.isArray(result.data) ? result.data : result.data.markets || []);
        toast({ title: "Search Complete", description: `Found ${result.data.length || 0} markets` });
      }
    } catch (error) {
      toast({ title: "Search Failed", description: String(error), variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchAgentStatus();
    fetchAutonomyStatus();
    fetchTradeHistory();
    fetchWalletBalance();
    
    const interval = setInterval(() => {
      fetchAutonomyStatus();
      fetchTradeHistory();
      fetchWalletBalance();
    }, POLL_INTERVAL);
    
    return () => clearInterval(interval);
  }, [fetchAgentStatus, fetchAutonomyStatus, fetchTradeHistory, fetchWalletBalance]);

  // ============================================
  // Render
  // ============================================
  return (
    <div className="min-h-screen bg-background">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative p-2 rounded-xl bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
                <span className={cn(
                  "absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                  isOnline ? "bg-green-500" : "bg-gray-500"
                )} />
              </div>
              <div>
                <h1 className="text-lg font-bold">Autonomous Trading</h1>
                <p className="text-xs text-muted-foreground">Polymarket AI Agent</p>
              </div>
            </div>
          </div>
          
          {/* Header badges */}
          <div className="hidden sm:flex items-center gap-3">
            <Badge variant={isOnline ? "success" : "muted"}>
              <StatusDot active={isOnline} color={isOnline ? "green" : "gray"} />
              {isOnline ? "Online" : "Offline"}
            </Badge>
            <Badge variant="muted">
              <Brain className="h-3 w-3" />
              Claude Sonnet 4
            </Badge>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6 relative">
        
        {/* ============================================ */}
        {/* 1. Dashboard Header - Status Bar */}
        {/* ============================================ */}
        <GlassCard className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Status indicators */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <StatusDot active={isOnline} color={isOnline ? "green" : "gray"} />
                <span className="text-sm font-medium">{isOnline ? "Agent Online" : "Agent Offline"}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" />
                <code className="font-mono">{truncateAddress(WALLET_ADDRESS)}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(WALLET_ADDRESS)}>
                  <Copy className="h-3 w-3" />
                </Button>
                <a href={`https://polygonscan.com/address/${WALLET_ADDRESS}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              </div>
            </div>
            
            {/* Quick stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Scans:</span>
                <span className="font-bold text-primary">{autonomyStatus?.totalScans || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Trades:</span>
                <span className="font-bold text-primary">{autonomyStatus?.totalTrades || 0}</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ============================================ */}
        {/* Wallet Balance Card */}
        {/* ============================================ */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Wallet Balance</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-400">POL</span>
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {walletBalance ? parseFloat(walletBalance.pol.balance).toFixed(2) : '—'} POL
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ~${walletBalance ? (parseFloat(walletBalance.pol.balance) * 0.12).toFixed(0) : '—'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-400">USDC</span>
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {walletBalance ? parseFloat(walletBalance.usdc.balance).toFixed(2) : '—'} USDC
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ~${walletBalance ? parseFloat(walletBalance.usdc.balance).toFixed(0) : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ============================================ */}
        {/* 2. Autonomy Control Panel */}
        {/* ============================================ */}
        <GlassCard glow={autonomyStatus?.running} glowColor="primary">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              Autonomous Trading
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Control buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={handleStart}
                disabled={isStarting || autonomyStatus?.running}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Start
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleStop}
                disabled={isStopping || !autonomyStatus?.running}
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
              <Badge variant={autonomyStatus?.running ? "success" : "muted"} size="md">
                <StatusDot active={autonomyStatus?.running || false} color={autonomyStatus?.running ? "green" : "gray"} />
                {autonomyStatus?.running ? "Running" : "Stopped"}
              </Badge>
            </div>

            {/* Settings row */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Scan Interval:</span>
                <Select value={scanInterval} onValueChange={setScanInterval}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30000">30s</SelectItem>
                    <SelectItem value="60000">60s</SelectItem>
                    <SelectItem value="120000">2m</SelectItem>
                    <SelectItem value="300000">5m</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Auto-Trade:</span>
                <Badge variant={autonomyStatus?.autoTradeEnabled ? "danger" : "muted"} size="md">
                  {autonomyStatus?.autoTradeEnabled ? "ON 🔥" : "OFF 🔒"}
                </Badge>
                {!autonomyStatus?.autoTradeEnabled ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleEnableTrading}
                    disabled={isEnablingTrade}
                    className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Enable
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={handleDisableTrading}
                    disabled={isDisablingTrade}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Disable
                  </Button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <div className="text-2xl font-bold text-primary">{autonomyStatus?.totalScans || 0}</div>
                <div className="text-xs text-muted-foreground">Total Scans</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <div className="text-2xl font-bold text-primary">{autonomyStatus?.totalTrades || 0}</div>
                <div className="text-xs text-muted-foreground">Trade Signals</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {tradeHistory.filter(t => t.action === 'BUY').length}
                </div>
                <div className="text-xs text-muted-foreground">BUY Signals</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {tradeHistory.filter(t => t.action === 'HOLD').length}
                </div>
                <div className="text-xs text-muted-foreground">HOLD Signals</div>
              </div>
            </div>

            {/* Warning when trading enabled */}
            {autonomyStatus?.autoTradeEnabled && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">
                  <strong>LIVE MODE:</strong> Real trades will execute on Polygon with actual USDC funds!
                </p>
              </div>
            )}
          </CardContent>
        </GlassCard>

        {/* ============================================ */}
        {/* 3. Live Activity Feed + 4. Trade History */}
        {/* ============================================ */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Live Activity Feed */}
          <GlassCard>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-base">
                <Radio className="h-4 w-4 text-primary animate-pulse" />
                Live Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {activityLog.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Activity className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">No activity yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activityLog.map((log, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm py-2 border-b border-border/50 last:border-0">
                        <span className="text-xs text-muted-foreground shrink-0 w-16">
                          {formatTime(log.time)}
                        </span>
                        <span className={cn(
                          log.type === 'buy' && 'text-green-400',
                          log.type === 'sell' && 'text-red-400',
                          log.type === 'hold' && 'text-yellow-400',
                          log.type === 'error' && 'text-red-400',
                          log.type === 'info' && 'text-foreground'
                        )}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </GlassCard>

          {/* Trade History Table */}
          <GlassCard>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-base">
                <Clock className="h-4 w-4 text-primary" />
                Trade History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {tradeHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Clock className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">No trades yet</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Time</th>
                        <th className="pb-2 font-medium">Action</th>
                        <th className="pb-2 font-medium hidden sm:table-cell">Market</th>
                        <th className="pb-2 font-medium text-right">Conf.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradeHistory.slice(0, 10).map((trade, i) => (
                        <tr key={i} className="border-b border-border/30 last:border-0">
                          <td className="py-2 text-muted-foreground">
                            {trade.timestamp ? formatTime(trade.timestamp) : '-'}
                          </td>
                          <td className="py-2">
                            <Badge 
                              variant={trade.action === 'BUY' ? 'success' : trade.action === 'SELL' ? 'danger' : 'warning'}
                            >
                              {trade.action === 'BUY' && <TrendingUp className="h-3 w-3" />}
                              {trade.action === 'SELL' && <TrendingDown className="h-3 w-3" />}
                              {trade.action === 'HOLD' && <Minus className="h-3 w-3" />}
                              {trade.action}
                            </Badge>
                          </td>
                          <td className="py-2 hidden sm:table-cell max-w-[200px] truncate">
                            {trade.market?.question || '-'}
                          </td>
                          <td className="py-2 text-right font-medium">
                            {trade.confidence ? `${trade.confidence}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </ScrollArea>
            </CardContent>
          </GlassCard>
        </div>

        {/* ============================================ */}
        {/* 5. Market Opportunities Cards */}
        {/* ============================================ */}
        <GlassCard>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Top Opportunities
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleScan}
                disabled={isScanning}
                className="gap-2"
              >
                <RefreshCw className={cn("h-3 w-3", isScanning && "animate-spin")} />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {opportunities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Scan className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Click Refresh to scan for opportunities</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {opportunities.slice(0, 6).map((opp, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all">
                    <h4 className="font-medium text-sm mb-3 line-clamp-2">{opp.question}</h4>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>YES: <strong className="text-primary">
                        {opp.yesPrice ? `${(opp.yesPrice * 100).toFixed(1)}%` : 'N/A'}
                      </strong></span>
                      <span>Vol: {formatNumber(opp.volume24h)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="default">
                        Score: {opp.score?.toFixed(2) || 'N/A'}
                      </Badge>
                      <a 
                        href={`https://polymarket.com/event/${opp.slug || opp.id}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </GlassCard>

        {/* ============================================ */}
        {/* 6. Manual Analysis Section */}
        {/* ============================================ */}
        <GlassCard>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-base">
              <Brain className="h-4 w-4 text-primary" />
              Manual Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Risk Level:</span>
                <div className="flex gap-1">
                  {(['conservative', 'moderate', 'aggressive'] as const).map((level) => (
                    <Button
                      key={level}
                      size="sm"
                      variant={riskLevel === level ? 'default' : 'outline'}
                      onClick={() => setRiskLevel(level)}
                      className="capitalize"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="gap-2"
              >
                <Brain className={cn("h-4 w-4", isAnalyzing && "animate-pulse")} />
                {isAnalyzing ? 'Analyzing...' : 'Analyze Markets'}
              </Button>
            </div>

            {analysisResult && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={analysisResult.action === 'BUY' ? 'success' : analysisResult.action === 'SELL' ? 'danger' : 'warning'}
                    size="md"
                  >
                    {analysisResult.action === 'BUY' && <TrendingUp className="h-4 w-4" />}
                    {analysisResult.action === 'SELL' && <TrendingDown className="h-4 w-4" />}
                    {analysisResult.action === 'HOLD' && <Minus className="h-4 w-4" />}
                    Action: {analysisResult.action}
                  </Badge>
                  <span className="text-sm">
                    Confidence: <strong className="text-primary">{analysisResult.confidence || 0}%</strong>
                  </span>
                </div>
                {analysisResult.market?.question && (
                  <div>
                    <span className="text-xs text-muted-foreground">Market:</span>
                    <p className="font-medium">"{analysisResult.market.question}"</p>
                  </div>
                )}
                {analysisResult.reasoning && (
                  <div>
                    <span className="text-xs text-muted-foreground">Reasoning:</span>
                    <p className="text-sm text-muted-foreground">{analysisResult.reasoning}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </GlassCard>

        {/* ============================================ */}
        {/* 7. Search Markets */}
        {/* ============================================ */}
        <GlassCard>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-base">
              <Search className="h-4 w-4 text-primary" />
              Search Markets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search markets (e.g., trump, bitcoin)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching} className="gap-2">
                <Search className={cn("h-4 w-4", isSearching && "animate-pulse")} />
                Search
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.slice(0, 5).map((result, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{result.question}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>YES: {result.yesPrice ? `${(result.yesPrice * 100).toFixed(1)}%` : 'N/A'}</span>
                        <span>Vol: {formatNumber(result.volume24h)}</span>
                      </div>
                    </div>
                    <a 
                      href={`https://polymarket.com/event/${result.slug || result.id}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </GlassCard>

      </main>
    </div>
  );
}
