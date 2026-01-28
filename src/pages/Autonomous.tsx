import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bot, 
  Activity, 
  Wallet, 
  TrendingUp, 
  Play, 
  Pause, 
  RefreshCw,
  Settings,
  ArrowLeft,
  Zap,
  Shield,
  Clock,
  DollarSign,
  Target,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const AGENT_API = import.meta.env.VITE_POLYMARKET_AGENT_API || "";

interface AgentStatus {
  status: "running" | "paused" | "stopped" | "error";
  uptime?: string;
  lastTrade?: string;
  totalTrades?: number;
  dailyPnL?: number;
  balance?: number;
  activePositions?: number;
  riskLevel?: "low" | "medium" | "high";
}

interface AgentConfig {
  autoTrade: boolean;
  maxPositionSize: number;
  dailyLimit: number;
  riskTolerance: number;
}

export default function Autonomous() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    status: "stopped",
    uptime: "0h 0m",
    lastTrade: "N/A",
    totalTrades: 0,
    dailyPnL: 0,
    balance: 0,
    activePositions: 0,
    riskLevel: "low"
  });
  const [config, setConfig] = useState<AgentConfig>({
    autoTrade: false,
    maxPositionSize: 100,
    dailyLimit: 500,
    riskTolerance: 50
  });

  const fetchAgentStatus = async () => {
    if (!AGENT_API) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${AGENT_API}/status`);
      if (response.ok) {
        const data = await response.json();
        setAgentStatus({
          status: data.status || "stopped",
          uptime: data.uptime || "0h 0m",
          lastTrade: data.lastTrade || "N/A",
          totalTrades: data.totalTrades || 0,
          dailyPnL: data.dailyPnL || 0,
          balance: data.balance || 0,
          activePositions: data.activePositions || 0,
          riskLevel: data.riskLevel || "low"
        });
      }
    } catch (error) {
      console.error("Failed to fetch agent status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAgentStatus();
    setRefreshing(false);
    toast({
      title: "Status Refreshed",
      description: "Agent status has been updated"
    });
  };

  const toggleAgent = async () => {
    const newStatus = agentStatus.status === "running" ? "paused" : "running";
    
    try {
      if (AGENT_API) {
        const response = await fetch(`${AGENT_API}/control`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: newStatus === "running" ? "start" : "pause" })
        });
        
        if (response.ok) {
          setAgentStatus(prev => ({ ...prev, status: newStatus }));
          toast({
            title: newStatus === "running" ? "Agent Started" : "Agent Paused",
            description: newStatus === "running" ? "Autonomous trading agent is now running" : "Autonomous trading agent has been paused"
          });
        }
      } else {
        // Demo mode
        setAgentStatus(prev => ({ ...prev, status: newStatus }));
        toast({
          title: newStatus === "running" ? "Agent Started" : "Agent Paused",
          description: "Demo mode - Not connected to actual agent"
        });
      }
    } catch (error) {
      toast({
        title: "Operation Failed",
        description: "Unable to connect to agent service",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchAgentStatus();
    const interval = setInterval(fetchAgentStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-green-500";
      case "paused": return "bg-yellow-500";
      case "error": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "running": return "Running";
      case "paused": return "Paused";
      case "error": return "Error";
      default: return "Stopped";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      default: return "text-green-500";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">Autonomous Trading Agent</h1>
          </div>
          <div className="flex-1" />
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Connection Status */}
        {!AGENT_API && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium text-yellow-500">Demo Mode</p>
                <p className="text-sm text-muted-foreground">
                  VITE_POLYMARKET_AGENT_API not configured. Showing simulated data.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Overview */}
        <Card className="relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1 ${getStatusColor(agentStatus.status)}`} />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Agent Status
            </CardTitle>
            <Badge 
              variant="outline" 
              className={`${getStatusColor(agentStatus.status)} bg-opacity-20`}
            >
              <span className={`w-2 h-2 rounded-full ${getStatusColor(agentStatus.status)} mr-2`} />
              {getStatusText(agentStatus.status)}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">{agentStatus.uptime}</p>
              </div>
              <Button
                size="lg"
                variant={agentStatus.status === "running" ? "destructive" : "default"}
                onClick={toggleAgent}
                className="gap-2"
              >
                {agentStatus.status === "running" ? (
                  <>
                    <Pause className="h-5 w-5" />
                    Pause Agent
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Start Agent
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Wallet className="h-4 w-4" />
                <span className="text-sm">Balance</span>
              </div>
              <p className="text-2xl font-bold">
                ${agentStatus.balance?.toLocaleString() || "0"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Daily P&L</span>
              </div>
              <p className={`text-2xl font-bold ${(agentStatus.dailyPnL || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                {(agentStatus.dailyPnL || 0) >= 0 ? "+" : ""}${agentStatus.dailyPnL?.toFixed(2) || "0.00"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Target className="h-4 w-4" />
                <span className="text-sm">Positions</span>
              </div>
              <p className="text-2xl font-bold">
                {agentStatus.activePositions || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm">Total Trades</span>
              </div>
              <p className="text-2xl font-bold">
                {agentStatus.totalTrades || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Trading Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Auto Trading</p>
                <p className="text-sm text-muted-foreground">Allow agent to execute trades automatically</p>
              </div>
              <Switch
                checked={config.autoTrade}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoTrade: checked }))}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Max Position Size</p>
                  <span className="text-sm text-muted-foreground">${config.maxPositionSize}</span>
                </div>
                <Progress value={config.maxPositionSize / 10} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Daily Limit</p>
                  <span className="text-sm text-muted-foreground">${config.dailyLimit}</span>
                </div>
                <Progress value={config.dailyLimit / 20} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Risk Tolerance</p>
                  <span className={`text-sm ${getRiskColor(agentStatus.riskLevel || "low")}`}>
                    {config.riskTolerance}%
                  </span>
                </div>
                <Progress value={config.riskTolerance} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agentStatus.lastTrade !== "N/A" ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/20">
                      <DollarSign className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">Last Trade</p>
                      <p className="text-sm text-muted-foreground">{agentStatus.lastTrade}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No trade history yet</p>
                  <p className="text-sm">Start the agent to begin autonomous trading</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 py-4">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Security Notice</p>
              <p className="text-sm text-muted-foreground">
                The autonomous trading agent uses a dedicated limited wallet with HSM-based signing. Private keys are never exposed in environment variables.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}