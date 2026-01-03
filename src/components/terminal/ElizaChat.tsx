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
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      <div className="terminal-header">DORAMOS_AGENT_INTERFACE</div>
      
      <div className="p-4 space-y-4">
        {/* Chat Messages */}
        <div className="h-48 overflow-y-auto space-y-3 font-mono text-xs scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          {messages.length === 0 && (
            <div className="text-muted-foreground animate-pulse">
              &gt; AWAITING_INPUT...
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className="space-y-1">
              <div className={`flex items-start gap-2 ${msg.role === "user" ? "text-primary" : "text-foreground"}`}>
                <span className="shrink-0">
                  {msg.role === "user" ? "[USER]:" : "[DORAMOS]:"}
                </span>
                <span className="whitespace-pre-wrap break-words">{msg.content}</span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="text-muted-foreground animate-pulse">
              <span className="text-primary">[DORAMOS]:</span> PROCESSING_QUERY
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
