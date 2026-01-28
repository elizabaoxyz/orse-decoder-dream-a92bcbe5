import { useState, useCallback } from "react";
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
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "https://polymarket-agent-production.up.railway.app";

interface AIDecision {
  shouldTrade: boolean;
  action: "BUY" | "SELL" | "HOLD";
  market?: { question: string; id?: string };
  price?: number;
  size?: number;
  reasoning: string;
  confidence: number; // 0-100
}

interface Opportunity {
  id: string;
  question: string;
  bestBid: number;
  bestAsk: number;
  spreadPercent: number;
  midpoint: number;
  score: number;
}

interface AgentStatus {
  initialized: boolean;
  openaiConfigured: boolean;
  walletConfigured: boolean;
  clobConfigured: boolean;
}

interface ActivityLog {
  timestamp: Date;
  type: "scan" | "analyze" | "error";
  message: string;
}

export default function Autonomous() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiDecision, setAiDecision] = useState<AIDecision | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  
  // Settings
  const [riskLevel, setRiskLevel] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [maxOrderSize, setMaxOrderSize] = useState(25);
  const [autoExecute, setAutoExecute] = useState(false);

  const addLog = useCallback((type: ActivityLog["type"], message: string) => {
    setActivityLog(prev => [
      { timestamp: new Date(), type, message },
      ...prev.slice(0, 49)
    ]);
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    addLog("scan", "Starting market scan...");
    
    try {
      const response = await fetch(`${API_BASE}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskLevel, maxOrderSize })
      });
      
      const result = await response.json();
      
      if (result.success && result.data?.opportunities) {
        setOpportunities(result.data.opportunities);
        addLog("scan", `Found ${result.data.opportunities.length} opportunities`);
        toast({
          title: "Scan Complete",
          description: `Found ${result.data.opportunities.length} market opportunities`
        });
      } else {
        throw new Error(result.error || "Scan failed");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addLog("error", `Scan failed: ${message}`);
      toast({
        title: "Scan Failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    addLog("analyze", "Running AI analysis...");
    
    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskLevel, maxOrderSize })
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        if (result.data.aiDecision) {
          setAiDecision(result.data.aiDecision);
        }
        if (result.data.topOpportunities) {
          setOpportunities(result.data.topOpportunities);
        }
        addLog("analyze", `AI recommends: ${result.data.aiDecision?.action || "HOLD"}`);
        toast({
          title: "Analysis Complete",
          description: `AI Decision: ${result.data.aiDecision?.action || "No action"}`
        });
      } else {
        throw new Error(result.error || "Analysis failed");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addLog("error", `Analysis failed: ${message}`);
      toast({
        title: "Analysis Failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "BUY": return "text-green-500 bg-green-500/10 border-green-500/30";
      case "SELL": return "text-red-500 bg-red-500/10 border-red-500/30";
      default: return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit", 
      second: "2-digit" 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">Autonomous AI Trading</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            size="lg" 
            variant="outline" 
            onClick={handleScan}
            disabled={isScanning}
            className="flex-1"
          >
            <Scan className={`h-5 w-5 mr-2 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Scanning..." : "Scan Markets"}
          </Button>
          <Button 
            size="lg" 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex-1"
          >
            <Brain className={`h-5 w-5 mr-2 ${isAnalyzing ? "animate-pulse" : ""}`} />
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* AI Decision Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Decision
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiDecision ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge className={`text-lg px-4 py-2 ${getActionColor(aiDecision.action)}`}>
                      {aiDecision.action === "BUY" && <TrendingUp className="h-4 w-4 mr-2" />}
                      {aiDecision.action === "SELL" && <TrendingDown className="h-4 w-4 mr-2" />}
                      {aiDecision.action}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="font-bold">{(aiDecision.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {aiDecision.shouldTrade ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                      <span>{aiDecision.shouldTrade ? "Trade Recommended" : "No Trade"}</span>
                    </div>
                  </div>
                  
                  {aiDecision.market && (
                    <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                      <div>
                        <span className="text-muted-foreground">Market: </span>
                        <span className="font-medium">{aiDecision.market.question}</span>
                      </div>
                      {aiDecision.price && (
                        <span className="text-sm">@ {(aiDecision.price * 100).toFixed(1)}¢</span>
                      )}
                    </div>
                  )}
                  
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-muted-foreground text-sm mb-1">Reasoning</p>
                    <p>{aiDecision.reasoning}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Bot className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p>Click "Analyze" to get AI trading recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Risk Level</label>
                <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as typeof riskLevel)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Max Order Size</label>
                  <span className="text-sm text-muted-foreground">${maxOrderSize}</span>
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

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-Execute</p>
                  <p className="text-xs text-muted-foreground">Execute trades automatically</p>
                </div>
                <Switch
                  checked={autoExecute}
                  onCheckedChange={setAutoExecute}
                />
              </div>
              {autoExecute && (
                <p className="text-xs text-yellow-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Caution: Trades will execute automatically
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Opportunities List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Opportunities
              {opportunities.length > 0 && (
                <Badge variant="secondary">{opportunities.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {opportunities.length > 0 ? (
              <div className="space-y-3">
                {opportunities.map((opp, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{opp.question}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>Bid: {(opp.bestBid * 100).toFixed(1)}¢</span>
                        <span>Ask: {(opp.bestAsk * 100).toFixed(1)}¢</span>
                        <span>Spread: {opp.spreadPercent.toFixed(2)}%</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-4">
                      Score: {opp.score.toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Scan className="h-12 w-12 mx-auto mb-3 opacity-30" />
                {activityLog.some(log => log.type === 'analyze') ? (
                  <p className="text-warning">No opportunities found in current market conditions. Try adjusting settings or scan again later.</p>
                ) : (
                  <p>No opportunities yet. Click "Scan Markets" to find opportunities.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              {activityLog.length > 0 ? (
                <div className="space-y-2">
                  {activityLog.map((log, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 text-sm p-2 rounded bg-muted/20"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-muted-foreground shrink-0">
                        {formatTime(log.timestamp)}
                      </span>
                      <span className={log.type === "error" ? "text-red-500" : ""}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No activity yet</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
