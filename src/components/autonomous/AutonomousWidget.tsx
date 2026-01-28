import { useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Brain, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "https://polymarket-agent-production.up.railway.app";

interface AIDecision {
  shouldTrade: boolean;
  action: "BUY" | "SELL" | "HOLD";
  market?: string;
  reasoning: string;
  confidence: number;
}

const AutonomousWidget = () => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiDecision, setAiDecision] = useState<AIDecision | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskLevel: "moderate", maxOrderSize: 25 })
      });
      
      const result = await response.json();
      
      if (result.success && result.data?.aiDecision) {
        setAiDecision(result.data.aiDecision);
        toast({
          title: "Analysis Complete",
          description: `AI Decision: ${result.data.aiDecision.action}`
        });
      } else {
        throw new Error(result.error || "Analysis failed");
      }
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "BUY": return "text-green-500 bg-green-500/20 border-green-500/30";
      case "SELL": return "text-red-500 bg-red-500/20 border-red-500/30";
      default: return "text-yellow-500 bg-yellow-500/20 border-yellow-500/30";
    }
  };

  return (
    <div className="terminal-panel relative">
      <div className="terminal-header flex items-center gap-2">
        <Bot className="h-3 w-3" />
        AI Trading
      </div>
      <div className="p-3 space-y-3">
        {aiDecision ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge className={`text-xs ${getActionColor(aiDecision.action)}`}>
                {aiDecision.action === "BUY" && <TrendingUp className="h-3 w-3 mr-1" />}
                {aiDecision.action === "SELL" && <TrendingDown className="h-3 w-3 mr-1" />}
                {aiDecision.action}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {(aiDecision.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {aiDecision.reasoning}
            </p>
          </div>
        ) : (
          <div className="text-center py-2">
            <Bot className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No analysis yet</p>
          </div>
        )}
        
        <Button 
          size="sm" 
          className="w-full" 
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          <Brain className={`h-4 w-4 mr-2 ${isAnalyzing ? "animate-pulse" : ""}`} />
          {isAnalyzing ? "Analyzing..." : "Analyze"}
        </Button>
        
        <Link to="/autonomous" className="block">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            <ExternalLink className="h-3 w-3 mr-2" />
            Full Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default AutonomousWidget;
