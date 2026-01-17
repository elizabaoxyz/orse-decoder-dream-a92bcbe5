import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mic, MicOff, ImageIcon, Video, Loader2, Send, Clock, Plus, X } from "lucide-react";
import agentAvatarBase from "@/assets/agent-avatar.jpg";
import { cacheBust } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const agentAvatar = cacheBust(agentAvatarBase);

interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  timestamp: Date;
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ElizaChat = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate image
  const generateImage = async (prompt: string) => {
    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("elizaos-image", {
        body: { prompt },
      });

      if (error || data?.error) {
        toast.error(data?.error || t('imageGenerationFailed'));
        return null;
      }

      return data?.imageUrl;
    } catch (error) {
      console.error("Image generation error:", error);
      toast.error(t('imageGenerationFailed'));
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Generate video
  const generateVideo = async (prompt: string) => {
    setIsGeneratingVideo(true);
    try {
      const { data, error } = await supabase.functions.invoke("elizaos-video", {
        body: { prompt },
      });

      if (error || data?.error) {
        toast.error(data?.error || t('videoGenerationFailed'));
        return null;
      }

      return data?.videoUrl;
    } catch (error) {
      console.error("Video generation error:", error);
      toast.error(t('videoGenerationFailed'));
      return null;
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        
        try {
          const { data, error } = await supabase.functions.invoke("elizaos-stt", {
            body: formData,
          });

          if (error || data?.error) {
            toast.error(t('voiceRecognitionFailed'));
            return;
          }

          if (data?.text) {
            setInput(data.text);
            toast.success(t('voiceRecognized'));
          }
        } catch (error) {
          console.error("STT error:", error);
          toast.error(t('voiceRecognitionFailed'));
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info(t('recording'));
    } catch (error) {
      console.error("Microphone error:", error);
      toast.error(t('microphoneAccessDenied'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Handle Polymarket commands
  const handlePolymarketCommand = async (command: string, args: string): Promise<string | null> => {
    try {
      let action = "";
      let params: Record<string, unknown> = {};

      switch (command) {
        case "/market":
        case "/search":
          action = "searchMarkets";
          params = { query: args, limit: 5 };
          break;
        case "/explain":
        case "/details":
          action = "getMarketDetails";
          params = { marketId: args };
          break;
        case "/orderbook":
        case "/book":
          action = "getOrderBookSummary";
          params = { tokenId: args };
          break;
        case "/price":
          action = "getBestPrice";
          params = { tokenId: args, side: "buy" };
          break;
        case "/spread":
          action = "getSpread";
          params = { tokenId: args };
          break;
        default:
          return null;
      }

      const { data, error } = await supabase.functions.invoke("polymarket-actions", {
        body: { action, params },
      });

      if (error || !data?.success) {
        return `❌ Error: ${data?.error || error?.message || "Unknown error"}`;
      }

      return data.formattedResponse || JSON.stringify(data.data, null, 2);
    } catch (error) {
      console.error("Polymarket command error:", error);
      return `❌ Failed to execute command: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const timestamp = new Date();
    setInput("");
    setIsLoading(true);

    // Check for image generation command
    const imageMatch = userMessage.match(/^\/image\s+(.+)/i);
    if (imageMatch) {
      const prompt = imageMatch[1];
      setMessages(prev => [...prev, { role: "user", content: userMessage, timestamp }]);
      
      const imageUrl = await generateImage(prompt);
      if (imageUrl) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: `${t('generatedImageFor')}: "${prompt}"`,
          imageUrl,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: t('failedToGenerate'),
          timestamp: new Date()
        }]);
      }
      setIsLoading(false);
      return;
    }

    // Check for video generation command
    const videoMatch = userMessage.match(/^\/video\s+(.+)/i);
    if (videoMatch) {
      const prompt = videoMatch[1];
      setMessages(prev => [...prev, { role: "user", content: userMessage, timestamp }]);
      
      toast.info(t('videoGenerationTime'));
      const videoUrl = await generateVideo(prompt);
      if (videoUrl) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: `${t('generatedVideoFor')}: "${prompt}"`,
          videoUrl,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: t('failedToGenerate'),
          timestamp: new Date()
        }]);
      }
      setIsLoading(false);
      return;
    }

    // Check for Polymarket commands
    const polymarketMatch = userMessage.match(/^(\/market|\/search|\/explain|\/details|\/orderbook|\/book|\/price|\/spread)\s*(.*)/i);
    if (polymarketMatch) {
      const command = polymarketMatch[1].toLowerCase();
      const args = polymarketMatch[2].trim();
      
      setMessages(prev => [...prev, { role: "user", content: userMessage, timestamp }]);
      
      const response = await handlePolymarketCommand(command, args);
      if (response) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: response,
          timestamp: new Date()
        }]);
        setIsLoading(false);
        return;
      }
    }

    // Regular chat message
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage, timestamp }];
    setMessages(newMessages);

    try {
      const { data, error } = await supabase.functions.invoke("elizaos-chat", {
        body: {
          message: userMessage,
          sessionId: sessionId,
        },
      });

      if (error) {
        console.error("ElizaOS chat error:", error);
        toast.error(t('failedToGetResponse'));
        return;
      }

      if (data?.error) {
        console.error("ElizaOS API error:", data);
        const msg = data?.status ? `${data.error} (${data.status})` : data.error;
        toast.error(msg);
        return;
      }

      const assistantReply = data.reply;
      setMessages([...newMessages, { role: "assistant", content: assistantReply, timestamp: new Date() }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(t('connectionFailed'));
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

  const insertCommand = (cmd: string) => {
    setInput(cmd + " ");
    setShowAttachMenu(false);
    inputRef.current?.focus();
  };

  return (
    <div className="terminal-panel flex-1 flex flex-col overflow-hidden min-h-0 rounded-2xl">
      {/* Header - Clean and minimal */}
      <div className="terminal-header px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={agentAvatar} 
              alt="ElizaBAO" 
              className="w-8 h-8 rounded-full border-2 border-primary/50"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-sm">ELIZABAO</span>
            <p className="text-[10px] text-muted-foreground uppercase">{t('poweredBy')}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col p-4 min-h-0 overflow-hidden">

        {/* Chat Messages - Flexible height */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto space-y-4 scrollbar-none pr-1 min-h-0 mb-4"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center space-y-3 py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <img src={agentAvatar} alt="ElizaBAO" className="w-12 h-12 rounded-full" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t('startConversation')}</p>
                <p className="text-xs mt-1">{t('askAbout')}</p>
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""} animate-fade-in`}
            >
              {/* Avatar */}
              <div className="shrink-0">
                {msg.role === "assistant" ? (
                  <img src={agentAvatar} alt="ElizaBAO" className="w-8 h-8 rounded-full border border-primary/30" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                    U
                  </div>
                )}
              </div>
              
              {/* Message Bubble */}
              <div className={`flex flex-col max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div 
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-br-sm" 
                      : "bg-muted/50 text-foreground rounded-bl-sm border border-border/50"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                
                {/* Media */}
                {msg.imageUrl && (
                  <div className="mt-2">
                    <img 
                      src={msg.imageUrl} 
                      alt="Generated" 
                      className="max-w-full max-h-52 rounded-xl border border-border/50 shadow-lg"
                    />
                  </div>
                )}
                {msg.videoUrl && (
                  <div className="mt-2">
                    <video 
                      src={msg.videoUrl} 
                      controls
                      className="max-w-full max-h-52 rounded-xl border border-border/50 shadow-lg"
                    />
                  </div>
                )}
                
                {/* Timestamp */}
                <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <img src={agentAvatar} alt="ElizaBAO" className="w-8 h-8 rounded-full border border-primary/30" />
              <div className="bg-muted/50 rounded-2xl rounded-bl-sm px-4 py-3 border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {isGeneratingVideo ? t('generatingVideo') : isGeneratingImage ? t('generatingImage') : t('thinking')}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - ChatGPT Style */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-muted/30 rounded-2xl border border-border/50 px-2 py-2 focus-within:border-primary/50 transition-colors">
            {/* Attachment Menu (Image/Video) */}
            <Popover open={showAttachMenu} onOpenChange={setShowAttachMenu}>
              <PopoverTrigger asChild>
                <button
                  disabled={isLoading}
                  className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-30"
                  title="Attach media"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                side="top" 
                align="start" 
                className="w-auto p-2 bg-popover border-border"
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => insertCommand("/image")}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span>{t('generateImage')}</span>
                  </button>
                  <button
                    onClick={() => insertCommand("/video")}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <Video className="w-4 h-4 text-primary" />
                    <span>{t('generateVideo')}</span>
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={() => insertCommand("/market")}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <span className="w-4 h-4 text-primary">🔍</span>
                    <span>{t('searchMarkets') || 'Search Markets'}</span>
                  </button>
                  <button
                    onClick={() => insertCommand("/explain")}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <span className="w-4 h-4 text-primary">📊</span>
                    <span>{t('explainMarket') || 'Explain Market'}</span>
                  </button>
                  <button
                    onClick={() => insertCommand("/orderbook")}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <span className="w-4 h-4 text-primary">📈</span>
                    <span>{t('viewOrderBook') || 'Order Book'}</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={t('messageElizaBAO')}
              className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder:text-muted-foreground/50 disabled:opacity-50"
              autoFocus
            />
            
            {/* Voice or Send button */}
            {input.trim() ? (
              <button
                onClick={sendMessage}
                disabled={isLoading}
                className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            ) : (
              <button
                onClick={toggleRecording}
                disabled={isLoading}
                className={`p-2 rounded-xl transition-all ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                } disabled:opacity-30`}
                title={isRecording ? "Stop recording" : "Voice input"}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElizaChat;
