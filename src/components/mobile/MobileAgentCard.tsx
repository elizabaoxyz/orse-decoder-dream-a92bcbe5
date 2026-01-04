import FoxMascot from "../terminal/FoxMascot";
import { ExternalLink, Wifi, WifiOff } from "lucide-react";

interface MobileAgentCardProps {
  isConnected: boolean;
}

const MobileAgentCard = ({ isConnected }: MobileAgentCardProps) => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <a
          href="https://www.elizacloud.ai/dashboard/chat?characterId=6328b8c7-3add-4fef-a0c5-9f74adacdb43"
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:opacity-80 transition-opacity w-20 h-20"
        >
          <FoxMascot />
        </a>
        <div className="flex-1 space-y-2">
          <h2 className="text-lg font-bold text-foreground">AI16ZDoram</h2>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-3 h-3 text-green-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-400" />
            )}
            <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-muted/30 border border-border/50">
          <span className="text-muted-foreground">PLUGINS:</span>
          <span className="text-foreground ml-1">Polymarket</span>
        </div>
        <div className="p-2 bg-muted/30 border border-border/50">
          <span className="text-muted-foreground">FREQ:</span>
          <span className="text-foreground ml-1">145.8MHZ</span>
        </div>
      </div>

      <a
        href="https://www.elizacloud.ai/dashboard/chat?characterId=6328b8c7-3add-4fef-a0c5-9f74adacdb43"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full p-3 bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 transition-colors text-sm font-bold"
      >
        <ExternalLink className="w-4 h-4" />
        CHAT WITH AGENT
      </a>
    </div>
  );
};

export default MobileAgentCard;