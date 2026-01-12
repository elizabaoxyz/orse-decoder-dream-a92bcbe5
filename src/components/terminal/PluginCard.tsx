import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  compact?: boolean;
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
  compact = false,
}: PluginCardProps) => {
  const { t } = useTranslation();
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

  // Compact version for sidebar
  if (compact) {
    return (
      <>
        <div
          className="group relative border border-border bg-card/50 p-2.5 cursor-pointer rounded-xl transition-all duration-200 hover:border-primary/50 hover:bg-card/80"
          onClick={() => setIsOpen(true)}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div 
                className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"
                style={{ animation: 'pulse 3s ease-in-out infinite' }}
              />
              <h3 className="text-foreground font-medium text-xs truncate group-hover:text-primary transition-colors">{title}</h3>
            </div>
            <span className="text-[8px] text-muted-foreground shrink-0">{toolCount} {t('tools')}</span>
          </div>
        </div>

        {/* Modal - rendered via Portal to ensure it appears on top */}
        {isOpen && createPortal(
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <div 
              className="bg-card border-2 border-primary shadow-2xl shadow-primary/40 w-[90%] max-w-lg rounded-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{
                animation: "modal-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <h3 className="text-foreground font-bold text-xl">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {version} • {toolCount} {t('tools')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {enabled && (
                    <span className="text-xs text-primary border border-primary/30 px-3 py-1 bg-primary/10 rounded-full font-medium">
                      {t('enabled')}
                    </span>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted/50 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                {endpoint && (
                  <div className="space-y-2">
                    <h4 className="text-foreground font-medium text-xs uppercase tracking-wide">{t('mcpEndpoint')}</h4>
                    <code className="block text-xs text-primary bg-muted/30 p-3 border border-border rounded-lg break-all">{endpoint}</code>
                  </div>
                )}
                {endpoint && (
                  <div className="space-y-2">
                    <h4 className="text-foreground font-medium text-xs uppercase tracking-wide">{t('configuration')}</h4>
                    <pre className="text-xs text-foreground/80 bg-muted/30 p-3 border border-border rounded-lg overflow-x-auto">{JSON.stringify(configJson, null, 2)}</pre>
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="text-foreground font-medium text-xs uppercase tracking-wide">{t('availableTools')} ({toolCount})</h4>
                  <div className="flex flex-wrap gap-2">
                    {tools.map((tool) => (
                      <span key={tool} className="text-xs text-foreground/80 bg-muted/50 px-2.5 py-1 border border-border rounded-lg">{tool}</span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/70 italic pt-2 border-t border-border/50">{pricing}</p>
              </div>
            </div>
            <style>{`
              @keyframes modal-bounce {
                0% { opacity: 0; transform: scale(0.5) translateY(20px); }
                50% { transform: scale(1.02) translateY(-5px); }
                70% { transform: scale(0.98) translateY(2px); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}</style>
          </div>,
          document.body
        )}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      {/* Main Card - Lab Equipment Style */}
      <div
        className="group relative border border-border bg-card/50 p-3 space-y-2 cursor-pointer rounded-2xl transition-all duration-300 hover:border-primary/70 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/20 overflow-hidden"
        onClick={() => setIsOpen(true)}
      >
        {/* Subtle scan line effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary)) 2px, hsl(var(--primary)) 3px)',
            animation: 'scanMove 8s linear infinite'
          }}
        />
        
        {/* Corner indicator light */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <div 
            className="w-1.5 h-1.5 rounded-full bg-primary/80"
            style={{ animation: 'blink 2s ease-in-out infinite' }}
          />
        </div>
        
        {/* Header */}
        <div className="relative flex items-center justify-between gap-2 pr-4">
          <h3 className="text-foreground font-medium text-sm truncate group-hover:text-primary transition-colors">{title}</h3>
          {enabled && (
            <span className="text-[9px] text-primary border border-primary/30 px-1.5 py-0.5 bg-primary/10 rounded shrink-0 group-hover:bg-primary/20 transition-all">
              {t('on')}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="relative text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Tools Preview */}
        <div className="relative flex flex-wrap gap-1">
          {displayTools.map((tool, i) => (
            <span
              key={tool}
              className="text-[9px] text-foreground/70 bg-muted/40 px-1.5 py-0.5 rounded border border-border/50 transition-all duration-200 group-hover:border-primary/30"
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

        {/* Footer with status indicators */}
        <div className="relative flex items-center justify-between text-[9px] text-muted-foreground/70 pt-1 border-t border-border/30">
          <span className="flex items-center gap-1.5">
            <span 
              className="w-1 h-1 rounded-full bg-green-500/70"
              style={{ animation: 'pulse 3s ease-in-out infinite' }}
            />
            {version}
          </span>
          <span className="font-mono opacity-70">{toolCount} {t('tools')}</span>
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
                  {version} • {toolCount} {t('tools')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {enabled && (
                  <span className="text-xs text-primary border border-primary/30 px-2 py-0.5 bg-primary/10">
                    {t('enabled')}
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
                    {t('mcpEndpoint')}
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
                    {t('configuration')}
                  </h4>
                  <pre className="text-xs text-foreground/80 bg-muted/30 p-3 border border-border overflow-x-auto">
                    {JSON.stringify(configJson, null, 2)}
                  </pre>
                </div>
              )}

              {/* Available Tools */}
              <div className="space-y-2">
                <h4 className="text-foreground font-medium text-xs uppercase tracking-wide">
                  {t('availableTools')} ({toolCount})
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
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes scanMove {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </>
  );
};

export default PluginCard;
