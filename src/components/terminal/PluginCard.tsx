import { useState, useRef, useEffect } from "react";
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
  const cardRef = useRef<HTMLDivElement>(null);

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

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={cardRef} className="relative">
      {/* Main Card */}
      <div
        className="border border-border bg-card/50 p-4 space-y-3 hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-foreground font-medium">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {version} • {toolCount} tools
            </p>
          </div>
          {enabled && (
            <span className="text-xs text-primary border border-primary/30 px-2 py-0.5 bg-primary/10">
              Enabled
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>

        {/* Tools Preview */}
        <div className="flex flex-wrap gap-1.5">
          {displayTools.map((tool) => (
            <span
              key={tool}
              className="text-xs text-foreground/80 bg-muted/50 px-2 py-0.5 border border-border"
            >
              {tool}
            </span>
          ))}
          {remainingTools > 0 && (
            <span className="text-xs text-muted-foreground px-2 py-0.5">
              +{remainingTools} more
            </span>
          )}
        </div>

        {/* Pricing */}
        <p className="text-xs text-muted-foreground/70 italic">{pricing}</p>
      </div>

      {/* Popup Card */}
      {isOpen && (
        <div 
          className="absolute z-50 top-2 left-2 right-2 bg-card border border-primary shadow-lg shadow-primary/20 animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Popup Header */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div>
              <h3 className="text-foreground font-medium">{title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {version} • {toolCount} tools
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>

          {/* Popup Content */}
          <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>

            {/* MCP Endpoint */}
            {endpoint && (
              <div className="space-y-1.5">
                <h4 className="text-foreground font-medium text-xs uppercase tracking-wide">
                  MCP Endpoint
                </h4>
                <code className="block text-xs text-primary bg-muted/30 p-2 border border-border break-all">
                  {endpoint}
                </code>
              </div>
            )}

            {/* Configuration */}
            {endpoint && (
              <div className="space-y-1.5">
                <h4 className="text-foreground font-medium text-xs uppercase tracking-wide">
                  Configuration
                </h4>
                <pre className="text-xs text-foreground/80 bg-muted/30 p-2 border border-border overflow-x-auto">
                  {JSON.stringify(configJson, null, 2)}
                </pre>
              </div>
            )}

            {/* Available Tools */}
            <div className="space-y-1.5">
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
      )}
    </div>
  );
};

export default PluginCard;