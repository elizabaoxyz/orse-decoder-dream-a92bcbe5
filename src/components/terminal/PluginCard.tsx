interface PluginCardProps {
  title: string;
  version: string;
  toolCount: number;
  description: string;
  tools: string[];
  pricing: string;
  enabled?: boolean;
}

const PluginCard = ({
  title,
  version,
  toolCount,
  description,
  tools,
  pricing,
  enabled = true,
}: PluginCardProps) => {
  const displayTools = tools.slice(0, 3);
  const remainingTools = tools.length - 3;

  return (
    <div className="border border-border bg-card/50 p-4 space-y-3 hover:border-primary/50 transition-colors">
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
  );
};

export default PluginCard;