import { MessageCircle, X, ExternalLink } from "lucide-react";
import { useState } from "react";
import agentAvatarBase from "@/assets/agent-avatar.jpg";
import { cacheBust } from "@/lib/utils";

const agentAvatar = cacheBust(agentAvatarBase);

const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? "bg-background/80 border border-border"
            : "bg-background/90 border border-primary/30"
        }`}
        style={{
          boxShadow: isOpen 
            ? 'none' 
            : '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2), 0 0 60px rgba(16, 185, 129, 0.1)'
        }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-foreground" />
        ) : (
          <div className="relative">
            <img
              src={agentAvatar}
              alt="Chat"
              className="w-10 h-10 rounded-full object-cover animate-pulse"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6)) drop-shadow(0 0 16px rgba(16, 185, 129, 0.4))'
              }}
            />
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-36 right-4 z-50 w-[calc(100%-2rem)] max-w-[320px] bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-primary/10 border-b border-border p-3 flex items-center gap-3">
            <div className="relative">
              <img
                src={agentAvatar}
                alt="ElizaBAO"
                className="w-10 h-10 rounded-full object-cover border-2 border-primary"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-foreground">ElizaBAO</h3>
              <p className="text-[10px] text-primary">ONLINE • ElizaOS Agent</p>
            </div>
          </div>

          {/* Chat Preview */}
          <div className="p-4 space-y-3 bg-background/50 min-h-[120px]">
            <div className="flex gap-2">
              <img
                src={agentAvatar}
                alt=""
                className="w-6 h-6 rounded-full object-cover shrink-0"
              />
              <div className="bg-muted/50 border border-border/50 rounded-lg p-2 text-xs text-foreground">
                👋 Hey! I'm ElizaBAO, your Polymarket whale tracking agent. Ask me anything about market trends!
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-3 border-t border-border space-y-2">
            <a
              href="https://www.elizacloud.ai/dashboard/chat?characterId=af4e609a-7ebc-4f59-8920-b5931a762102"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 p-3 bg-primary text-primary-foreground font-bold text-sm rounded-lg transition-colors hover:bg-primary/90"
            >
              <MessageCircle className="w-4 h-4" />
              START CHAT
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
            <p className="text-[9px] text-center text-muted-foreground">
              Opens ElizaOS Cloud Chat
            </p>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default FloatingChatButton;