import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ElizaChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    // Scroll only within the chat container, not the whole page
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    try {
      const { data, error } = await supabase.functions.invoke("elizaos-chat", {
        body: {
          message: userMessage,
          conversationHistory: messages,
        },
      });

      if (error) {
        console.error("ElizaOS chat error:", error);
        toast.error("Failed to get response");
        return;
      }

       if (data?.error) {
         console.error("ElizaOS API error:", data);
         const msg = data?.status ? `${data.error} (${data.status})` : data.error;
         toast.error(msg);
         return;
       }

      // Add assistant response
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Connection failed");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="terminal-panel mt-4">
      <div className="terminal-header">meet ElizaBAO</div>
      
      <div className="p-4 space-y-4">
        {/* Agent Introduction */}
        <div className="border border-border/30 rounded-lg p-3 bg-card/30 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-mono text-primary">ONLINE</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            ElizaBAO is an AI agent powered by <span className="text-primary">ElizaOS</span>. 
            Ask about crypto prices, prediction markets, weather, time zones, or anything else. 
            Connected to real-time data via MCP plugins.
          </p>
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">Crypto Prices</span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">Polymarket</span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">Time & Timezone</span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">Weather Data</span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">ElizaOS Platform</span>
          </div>
        </div>

        {/* Chat Messages */}
        <div 
          ref={messagesContainerRef}
          className="h-48 overflow-y-auto space-y-3 font-mono text-xs scrollbar-none"
        >
          {messages.length === 0 && (
            <div className="text-muted-foreground animate-pulse">
              &gt; AWAITING_INPUT...
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className="space-y-1">
              <div className={`flex items-start gap-2 ${msg.role === "user" ? "text-primary" : "text-foreground"}`}>
                <span className="shrink-0">
                  {msg.role === "user" ? "[USER]:" : "[ELIZABAO]:"}
                </span>
                <span className="whitespace-pre-wrap break-words">{msg.content}</span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="text-muted-foreground animate-pulse">
              <span className="text-primary">[ELIZABAO]:</span> PROCESSING_QUERY
              <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-border/30 pt-4">
          <span className="text-primary font-mono text-sm">&gt;&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="ENTER_QUERY..."
            className="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-sm placeholder:text-muted-foreground/50 disabled:opacity-50"
            autoFocus
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="text-primary hover:text-primary/80 font-mono text-xs uppercase tracking-wider disabled:opacity-30 transition-colors"
          >
            [SEND]
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElizaChat;
