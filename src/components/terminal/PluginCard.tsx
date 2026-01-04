import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
    <Dialog>
      <DialogTrigger asChild>
        <div className="border border-border bg-card/50 p-4 space-y-3 hover:border-primary/50 transition-colors cursor-pointer">
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

          {/* Tools */}
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
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center justify-between">
            <span>{title}</span>
            {enabled && (
              <span className="text-xs text-primary border border-primary/30 px-2 py-0.5 bg-primary/10 font-normal">
                Enabled
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-sm">
          {/* Description */}
          <p className="text-muted-foreground">{description}</p>

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
      </DialogContent>
    </Dialog>
  );
};

export default PluginCard;