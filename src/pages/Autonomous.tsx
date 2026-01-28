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
      title: "状态已刷新",
      description: "代理状态已更新"
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
            title: newStatus === "running" ? "代理已启动" : "代理已暂停",
            description: newStatus === "running" ? "自主交易代理正在运行" : "自主交易代理已暂停"
          });
        }
      } else {
        // Demo mode
        setAgentStatus(prev => ({ ...prev, status: newStatus }));
        toast({
          title: newStatus === "running" ? "代理已启动" : "代理已暂停",
          description: "演示模式 - 未连接到实际代理"
        });
      }
    } catch (error) {
      toast({
        title: "操作失败",
        description: "无法连接到代理服务",
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
      case "running": return "运行中";
      case "paused": return "已暂停";
      case "error": return "错误";
      default: return "已停止";
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
            <h1 className="text-lg font-semibold">自主交易代理</h1>
          </div>
          <div className="flex-1" />
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            刷新
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
                <p className="font-medium text-yellow-500">演示模式</p>
                <p className="text-sm text-muted-foreground">
                  未配置 VITE_POLYMARKET_AGENT_API 环境变量，显示模拟数据
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
              代理状态
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
                <p className="text-sm text-muted-foreground">运行时间</p>
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
                    暂停代理
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    启动代理
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
                <span className="text-sm">余额</span>
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
                <span className="text-sm">今日盈亏</span>
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
                <span className="text-sm">持仓数量</span>
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
                <span className="text-sm">总交易数</span>
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
              交易配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">自动交易</p>
                <p className="text-sm text-muted-foreground">允许代理自动执行交易</p>
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
                  <p className="text-sm font-medium">最大仓位大小</p>
                  <span className="text-sm text-muted-foreground">${config.maxPositionSize}</span>
                </div>
                <Progress value={config.maxPositionSize / 10} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">每日限额</p>
                  <span className="text-sm text-muted-foreground">${config.dailyLimit}</span>
                </div>
                <Progress value={config.dailyLimit / 20} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">风险容忍度</p>
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
              最近活动
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
                      <p className="font-medium">最后交易</p>
                      <p className="text-sm text-muted-foreground">{agentStatus.lastTrade}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>暂无交易记录</p>
                  <p className="text-sm">启动代理开始自动交易</p>
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
              <p className="font-medium">安全提示</p>
              <p className="text-sm text-muted-foreground">
                自主交易代理使用独立的有限钱包，通过 HSM 安全签名。私钥永远不会暴露在环境变量中。
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
