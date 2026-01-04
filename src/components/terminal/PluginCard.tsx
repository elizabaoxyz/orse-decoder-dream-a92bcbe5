import { useState } from "react";
import { X } from "lucide-react";

export interface PluginCardProps {
  title: string;
  version: string;
  toolCount: number;
  description: string;
  tools: string[];
  pricing: string;
  enabled?: boolean;
  endpoint?: string;
  serverKey?: string;
  serverType?: string;
}

const PluginCard = ({
  title,
  version,
  toolCount,
  description,
  tools,
  pricing,
  enabled = true,
  endpoint,
  serverKey,
  serverType = "sse",
}: PluginCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const displayTools = tools.slice(0, 3);
  const remainingTools = tools.length - 3;

  const configJson = {
    servers: {
      [serverKey || "server"]: {
        type: serverType,
        url: endpoint?.replace("https://www.elizacloud.ai", "") || "",
      },
    },
  };

  return (
    <>
      {/* Main Card - Compact with more info */}
      <div
        className="border border-border bg-card/50 p-3 space-y-2 hover:border-primary/50 transition-all cursor-pointer rounded-lg hover:bg-card/80"
        onClick={() => setIsOpen(true)}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-foreground font-medium text-sm truncate">{title}</h3>
          {enabled && (
            <span className="text-[9px] text-primary border border-primary/30 px-1.5 py-0.5 bg-primary/10 rounded shrink-0">
              ON
            </span>
          )}
        </div>

        {/* Description - truncated */}
        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Tools Preview */}
        <div className="flex flex-wrap gap-1">
          {displayTools.map((tool) => (
            <span
              key={tool}
              className="text-[9px] text-foreground/70 bg-muted/40 px-1.5 py-0.5 rounded border border-border/50"
            >
              {tool}
            </span>
          ))}
          {remainingTools > 0 && (
            <span className="text-[9px] text-muted-foreground px-1">
              +{remainingTools}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[9px] text-muted-foreground/70 pt-1 border-t border-border/30">
          <span>{version}</span>
          <span>{toolCount} tools</span>
        </div>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Card */}
          <div 
            className="bg-card border border-primary shadow-2xl shadow-primary/30 w-[90%] max-w-md animate-bounce-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-foreground font-medium text-lg">{title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {version} • {toolCount} tools
                </p>
              </div>
              <div className="flex items-center gap-2">
                {enabled && (
                  <span className="text-xs text-primary border border-primary/30 px-2 py-0.5 bg-primary/10">
                    Enabled
                  </span>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted/50"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>

              {/* MCP Endpoint */}
              {endpoint && (
                <div className="space-y-2">
                  <h4 className="text-foreground font-medium text-xs uppercase tracking-wide">
                    MCP Endpoint
                  </h4>
                  <code className="block text-xs text-primary bg-muted/30 p-3 border border-border break-all">
                    {endpoint}
                  </code>
                </div>
              )}

              {/* Configuration */}
              {endpoint && (
                <div className="space-y-2">
                  <h4 className="text-foreground font-medium text-xs uppercase tracking-wide">
                    Configuration
                  </h4>
                  <pre className="text-xs text-foreground/80 bg-muted/30 p-3 border border-border overflow-x-auto">
                    {JSON.stringify(configJson, null, 2)}
                  </pre>
                </div>
              )}

              {/* Available Tools */}
              <div className="space-y-2">
                <h4 className="text-foreground font-medium text-xs uppercase tracking-wide">
                  Available Tools ({toolCount})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {tools.map((tool) => (
                    <span
                      key={tool}
                      className="text-xs text-foreground/80 bg-muted/50 px-2 py-0.5 border border-border"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <p className="text-xs text-muted-foreground/70 italic">{pricing}</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default PluginCard;