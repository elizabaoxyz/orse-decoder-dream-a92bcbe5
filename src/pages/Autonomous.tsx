import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
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
  Eye,
  Settings,
  DollarSign,
  Target,
  Save
} from "lucide-react";
import elizaAvatar from "@/assets/eliza-avatar.jpg";
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
const POLL_INTERVAL = 30000; // 30 seconds

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
  totalPnl?: number;
  openPositions?: number;
  openElonPositions?: number;
  maxElonPositions?: number;
  elonTradeSize?: number;
  regularTradeSize?: number;
  settings?: PositionSettings;
}

interface ElonPrediction {
  currentCount: number;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  elapsedHours: number;
  remainingHours: number;
}

interface AutonomyStatus {
  enabled: boolean;
  running: boolean;
  intervalMs: number;
  autoTradeEnabled: boolean;
  totalScans: number;
  totalTrades: number;
  totalPnl?: number;
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
  proxyWallet: string;
  pol: { balance: string };
  usdc: { balance: string };
}

interface OpenPosition {
  id: string;
  marketId: string;
  question: string;
  side: string;
  entryPrice: number;
  currentPrice?: number;
  size: number;
  amount: number;
  openedAt: string;
  status: string;
  category?: string;
  tpPrice?: number;
}

interface ClosedPosition {
  id: string;
  question: string;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  closeReason: string;
  closedAt: string;
  status: string;
}

interface PositionSettings {
  takeProfitPercent: number;
  stopLossPercent: number;
}

interface PositionsData {
  open: OpenPosition[];
  closed: ClosedPosition[];
  totalPnl: number;
  openElonPositions?: number;
  settings?: PositionSettings;
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
  const [activityLog, setActivityLog] = useState<{ id: string; time: Date; message: string; type: "info" | "buy" | "sell" | "hold" | "error" }[]>([]);
  
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
  
  // Positions state
  const [positionsData, setPositionsData] = useState<PositionsData | null>(null);
  const [isFetchingPositions, setIsFetchingPositions] = useState(false);
  
  // Settings state
  const [takeProfitPercent, setTakeProfitPercent] = useState(20);
  const [stopLossPercent, setStopLossPercent] = useState(15);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Elon Prediction state
  const [elonPrediction, setElonPrediction] = useState<ElonPrediction | null>(null);
  const addActivity = useCallback((message: string, type: "info" | "buy" | "sell" | "hold" | "error" = "info", uniqueKey?: string) => {
    const id = uniqueKey || `${Date.now()}-${message}`;
    setActivityLog(prev => {
      // Check if this entry already exists
      if (prev.some(entry => entry.id === id)) {
        return prev;
      }
      // Add new entry and limit to 20 unique entries
      return [{ id, time: new Date(), message, type }, ...prev].slice(0, 20);
    });
  }, []);

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Address copied to clipboard" });
  };

  // Truncate address - with null check
  const truncateAddress = (addr?: string) => {
    if (!addr) return '—';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

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

  // Fetch positions
  const fetchPositions = useCallback(async () => {
    setIsFetchingPositions(true);
    try {
      const result = await callApi('/api/positions', undefined, 'GET');
      if (result.success && result.data) {
        setPositionsData(result.data);
        // Update settings from API response
        if (result.data.settings) {
          setTakeProfitPercent(result.data.settings.takeProfitPercent);
          setStopLossPercent(result.data.settings.stopLossPercent);
        }
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    } finally {
      setIsFetchingPositions(false);
    }
  }, []);

  // Fetch Elon prediction
  const fetchElonPrediction = useCallback(async () => {
    try {
      const result = await callApi('/api/elon-prediction', undefined, 'GET');
      if (result.success && result.data) {
        setElonPrediction(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch elon prediction:', error);
    }
  }, []);

  // Save position settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const result = await callApi('/api/positions/settings', {
        takeProfitPercent,
        stopLossPercent
      });
      if (result.success) {
        toast({ title: "Settings Saved", description: "Take profit and stop loss updated" });
        addActivity(`⚙️ Settings updated: TP ${takeProfitPercent}% / SL ${stopLossPercent}%`, 'info');
        fetchPositions();
      }
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Fetch autonomy status
  const fetchAutonomyStatus = useCallback(async () => {
    try {
      const result = await callApi('/api/autonomy/status', undefined, 'GET');
      if (result.success && result.data) {
        setAutonomyStatus(result.data);
        
        // Add activity for new decisions with unique key (timestamp + market id)
        if (result.data.lastDecision) {
          const decision = result.data.lastDecision;
          const action = decision.action || 'HOLD';
          const market = decision.market?.question || 'No market';
          const marketId = decision.market?.id || 'unknown';
          const timestamp = decision.timestamp || new Date().toISOString();
          const confidence = decision.confidence ? `(${decision.confidence}%)` : '';
          const type = action === 'BUY' ? 'buy' : action === 'SELL' ? 'sell' : 'hold';
          // Use timestamp + marketId as unique key to prevent duplicates
          const uniqueKey = `${timestamp}-${marketId}`;
          addActivity(`${action} Signal - "${market}" ${confidence}`, type, uniqueKey);
        }
      }
    } catch (error) {
      console.error('Failed to fetch autonomy status:', error);
    }
  }, [addActivity]);

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
    fetchPositions();
    fetchElonPrediction();
    
    const interval = setInterval(() => {
      fetchAgentStatus();
      fetchAutonomyStatus();
      fetchTradeHistory();
      fetchWalletBalance();
      fetchPositions();
      fetchElonPrediction();
    }, POLL_INTERVAL);
    
    return () => clearInterval(interval);
  }, [fetchAgentStatus, fetchAutonomyStatus, fetchTradeHistory, fetchWalletBalance, fetchPositions, fetchElonPrediction]);

  // Get category badge color
  const getCategoryBadge = (category?: string) => {
    const categoryMap: Record<string, { variant: "default" | "success" | "warning" | "danger" | "muted"; label: string }> = {
      elon: { variant: "warning", label: "🐦 Elon" },
      crypto: { variant: "default", label: "₿ Crypto" },
      politics: { variant: "muted", label: "🏛️ Politics" },
      sports: { variant: "success", label: "⚽ Sports" },
    };
    return categoryMap[category || ''] || { variant: "muted" as const, label: category || 'Other' };
  };

  // Format hours to readable time
  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d ${Math.round(hours % 24)}h`;
  };

  // Calculate PnL for open positions
  const calculateOpenPnl = (position: OpenPosition) => {
    const currentPrice = position.currentPrice ?? position.entryPrice;
    const pnl = (currentPrice - position.entryPrice) * position.size;
    const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
    return { pnl, pnlPercent };
  };

  // Format currency
  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}$${Math.abs(value).toFixed(2)}`;
  };

  // Format percent
  const formatPercent = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
  };

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
              <div className="relative">
                <img src={elizaAvatar} alt="Eliza" className="h-10 w-10 rounded-xl object-cover" />
                <span className={cn(
                  "absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                  isOnline ? "bg-green-500" : "bg-gray-500"
                )} />
              </div>
              <div>
                <h1 className="text-lg font-bold">ElizaBAO Autonomy</h1>
                <p className="text-xs text-muted-foreground">Powered by ElizaOS - Polymarket Agent</p>
              </div>
            </div>
          </div>
          
          {/* Header badges */}
          <div className="hidden sm:flex items-center gap-3">
            <Badge variant={isOnline ? "success" : "muted"}>
              <StatusDot active={isOnline} color={isOnline ? "green" : "gray"} />
              {isOnline ? "Online" : "Offline"}
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
              {walletBalance && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  <code className="font-mono">{truncateAddress(walletBalance.proxyWallet)}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(walletBalance.proxyWallet)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <a href={`https://polygonscan.com/address/${walletBalance.proxyWallet}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              )}
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
        {/* Wallet & Trading Balance Card */}
        {/* ============================================ */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Trading Wallet</h3>
            </div>
            <Badge variant="muted">Polymarket Proxy</Badge>
          </div>
          
          {/* Wallet Addresses */}
          {walletBalance && (
            <div className="mb-4 p-3 rounded-xl bg-muted/30 border border-border/50 space-y-3">
              {/* Trading Wallet (Proxy) - Main */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary">Trading Wallet:</span>
                  <span className="text-xs text-green-400">(holds funds)</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                    {walletBalance.proxyWallet}
                  </code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(walletBalance.proxyWallet)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <a href={`https://polygonscan.com/address/${walletBalance.proxyWallet}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              </div>
              
              {/* Signer Address */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Signer (EOA):</span>
                  <span className="text-xs text-muted-foreground">(controls proxy)</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-muted-foreground">{truncateAddress(walletBalance.address)}</code>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(walletBalance.address)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Balance Display */}
          <div className="grid sm:grid-cols-3 gap-4">
            {/* Positions Value - Main Trading Balance */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    ${positionsData?.open ? positionsData.open.reduce((sum, p) => sum + p.amount, 0).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    In Polymarket Positions
                  </p>
                </div>
              </div>
            </div>
            
            {/* On-chain POL */}
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-400">POL</span>
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {walletBalance ? parseFloat(walletBalance.pol.balance).toFixed(4) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    On-chain (gas)
                  </p>
                </div>
              </div>
            </div>
            
            {/* On-chain USDC */}
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-400">USDC</span>
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {walletBalance ? parseFloat(walletBalance.usdc.balance).toFixed(2) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    On-chain (not in Poly)
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Info note */}
          <p className="mt-3 text-xs text-muted-foreground text-center">
            💡 Trading funds are held inside Polymarket's system. On-chain balances show funds not yet deposited.
          </p>
        </GlassCard>

        {/* ============================================ */}
        {/* 2. Autonomy Control Panel */}
        {/* ============================================ */}
        <GlassCard glow={autonomyStatus?.running} glowColor="primary">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <img src={elizaAvatar} alt="Eliza" className="h-10 w-10 rounded-xl object-cover" />
              ElizaBAO Autonomy
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
        {/* Bot Status + Trade Settings Row */}
        {/* ============================================ */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Total PnL Display */}
          <GlassCard glow={positionsData && positionsData.totalPnl !== 0} glowColor={positionsData && positionsData.totalPnl >= 0 ? "green" : "red"}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-base">
                <DollarSign className="h-4 w-4 text-primary" />
                Total PnL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-4xl font-bold mb-4",
                positionsData && positionsData.totalPnl >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {positionsData ? formatCurrency(positionsData.totalPnl) : '$0.00'}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-muted-foreground text-xs">Open Positions</p>
                  <p className="font-bold text-primary">{agentStatus?.openPositions || positionsData?.open.length || 0}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-muted-foreground text-xs">Total Trades</p>
                  <p className="font-bold text-primary">{agentStatus?.totalTrades || autonomyStatus?.totalTrades || 0}</p>
                </div>
              </div>
            </CardContent>
          </GlassCard>

          {/* Trade Settings Card */}
          <GlassCard>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-base">
                <Settings className="h-4 w-4 text-primary" />
                Trade Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-muted-foreground text-xs">Elon Trade Size</p>
                  <p className="font-bold text-yellow-400">${agentStatus?.elonTradeSize || 20}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-muted-foreground text-xs">Regular Trade Size</p>
                  <p className="font-bold text-primary">${agentStatus?.regularTradeSize || 1}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-muted-foreground text-xs">Max Elon Positions</p>
                  <p className="font-bold">{positionsData?.openElonPositions || 0}/{agentStatus?.maxElonPositions || 3}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-muted-foreground text-xs">TP / SL</p>
                  <p className="font-bold">
                    <span className="text-green-400">+{takeProfitPercent}%</span>
                    {' / '}
                    <span className="text-red-400">-{stopLossPercent}%</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </GlassCard>

          {/* Elon Tweet Prediction Card */}
          <GlassCard glow={!!elonPrediction} glowColor="primary">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-base">
                <span className="text-lg">🐦</span>
                Elon Tweet Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!elonPrediction ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Loading prediction...
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Count</span>
                    <span className="text-2xl font-bold text-yellow-400">{elonPrediction.currentCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Predicted Total</span>
                    <span className="text-xl font-bold text-primary">{elonPrediction.predicted}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Range</span>
                    <span className="text-foreground">{elonPrediction.lowerBound} - {elonPrediction.upperBound}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <Badge variant={elonPrediction.confidence >= 0.7 ? "success" : elonPrediction.confidence >= 0.5 ? "warning" : "muted"}>
                      {(elonPrediction.confidence * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Time Remaining</span>
                    <span className="text-foreground font-medium">{formatHours(elonPrediction.remainingHours)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </GlassCard>
        </div>

        {/* ============================================ */}
        {/* Trading Settings Panel (Editable) */}
        {/* ============================================ */}
        <GlassCard>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-base">
              <Settings className="h-4 w-4 text-primary" />
              Risk Management Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Target className="h-3 w-3 text-green-400" />
                  Take Profit
                </label>
                <Select value={takeProfitPercent.toString()} onValueChange={(v) => setTakeProfitPercent(parseInt(v))}>
                  <SelectTrigger className="border-green-500/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">+10%</SelectItem>
                    <SelectItem value="15">+15%</SelectItem>
                    <SelectItem value="20">+20%</SelectItem>
                    <SelectItem value="25">+25%</SelectItem>
                    <SelectItem value="30">+30%</SelectItem>
                    <SelectItem value="50">+50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="h-3 w-3 text-red-400" />
                  Stop Loss
                </label>
                <Select value={stopLossPercent.toString()} onValueChange={(v) => setStopLossPercent(parseInt(v))}>
                  <SelectTrigger className="border-red-500/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">-5%</SelectItem>
                    <SelectItem value="10">-10%</SelectItem>
                    <SelectItem value="15">-15%</SelectItem>
                    <SelectItem value="20">-20%</SelectItem>
                    <SelectItem value="25">-25%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-end">
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={isSavingSettings}
                  className="w-full gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSavingSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </CardContent>
        </GlassCard>

        {/* ============================================ */}
        {/* Open Positions Card */}
        {/* ============================================ */}
        <GlassCard>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-base">
                <TrendingUp className="h-4 w-4 text-green-400" />
                Open Positions ({positionsData?.open.length || 0})
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchPositions}
                disabled={isFetchingPositions}
                className="gap-2"
              >
                <RefreshCw className={cn("h-3 w-3", isFetchingPositions && "animate-spin")} />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!positionsData?.open.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No open positions</p>
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="space-y-3 pr-4">
                  {positionsData.open.map((position) => {
                    const { pnl, pnlPercent } = calculateOpenPnl(position);
                    const isProfit = pnl >= 0;
                    const categoryInfo = getCategoryBadge(position.category);
                    return (
                      <div key={position.id} className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h4 className="font-medium text-sm line-clamp-2 flex-1">{position.question}</h4>
                          <Badge variant={categoryInfo.variant}>{categoryInfo.label}</Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Entry</p>
                            <p className="font-medium">${position.entryPrice.toFixed(3)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Current</p>
                            <p className="font-medium">${(position.currentPrice ?? position.entryPrice).toFixed(3)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Size</p>
                            <p className="font-medium">{position.size.toFixed(2)} shares</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">TP Price</p>
                            <p className="font-medium text-green-400">${(position.tpPrice || position.entryPrice * 1.2).toFixed(3)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">PnL</p>
                            <p className={cn("font-bold", isProfit ? "text-green-400" : "text-red-400")}>
                              {formatPercent(pnlPercent)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-end">
                          <a 
                            href={`https://polymarket.com/event/${position.marketId}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            View on Polymarket <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </GlassCard>

        {/* ============================================ */}
        {/* Closed Positions / Trade History Table */}
        {/* ============================================ */}
        <GlassCard>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-base">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Closed Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!positionsData?.closed.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No closed positions</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Market</th>
                      <th className="pb-2 font-medium text-right">Entry</th>
                      <th className="pb-2 font-medium text-right">Exit</th>
                      <th className="pb-2 font-medium text-right">PnL</th>
                      <th className="pb-2 font-medium hidden sm:table-cell">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positionsData.closed.map((position) => {
                      const isProfit = position.pnl >= 0;
                      return (
                        <tr key={position.id} className="border-b border-border/30 last:border-0">
                          <td className="py-2 max-w-[200px] truncate">
                            {position.question}
                          </td>
                          <td className="py-2 text-right text-muted-foreground">
                            ${position.entryPrice.toFixed(2)}
                          </td>
                          <td className="py-2 text-right text-muted-foreground">
                            ${position.exitPrice.toFixed(2)}
                          </td>
                          <td className={cn(
                            "py-2 text-right font-bold",
                            isProfit ? "text-green-400" : "text-red-400"
                          )}>
                            {formatCurrency(position.pnl)}
                          </td>
                          <td className="py-2 hidden sm:table-cell">
                            <Badge variant={isProfit ? "success" : "danger"}>
                              {position.closeReason}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </CardContent>
        </GlassCard>
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
