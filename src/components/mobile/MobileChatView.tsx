import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Menu, X, Mic, MicOff, Volume2, VolumeX, ImageIcon, Video, 
  Loader2, Send, Clock, BarChart3, Wallet, ChevronRight
} from "lucide-react";
import agentAvatarBase from "@/assets/agent-avatar.jpg";
import { cacheBust } from "@/lib/utils";
import WhaleStatsPanel from "@/components/whale/WhaleStatsPanel";
import polymarketIcon from "@/assets/polymarket-icon.jpg";

const agentAvatar = cacheBust(agentAvatarBase);

// Twitter/X icon component
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Polymarket icon component
const PolymarketIcon = () => (
  <img src={polymarketIcon} alt="Polymarket" className="w-7 h-7 rounded" />
);

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

const MobileChatView = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState<"analytics" | "wallets">("analytics");
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Text-to-Speech function
  const speakText = async (text: string) => {
    if (!isTTSEnabled || !text) return;
    
    setIsSpeaking(true);
    try {
      const { data, error } = await supabase.functions.invoke("elizaos-tts", {
        body: { text },
      });

      if (error || data?.error) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        speechSynthesis.speak(utterance);
        return;
      }

      if (data?.audioBase64) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0))],
          { type: data.contentType || 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) audioRef.current.pause();
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsSpeaking(false);
        audioRef.current.play();
      } else if (data?.audioUrl) {
        if (audioRef.current) audioRef.current.pause();
        audioRef.current = new Audio(data.audioUrl);
        audioRef.current.onended = () => setIsSpeaking(false);
        audioRef.current.play();
      }
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
    }
  };

  // Generate image
  const generateImage = async (prompt: string) => {
    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("elizaos-image", {
        body: { prompt },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Image generation failed");
        return null;
      }
      return data?.imageUrl;
    } catch (error) {
      toast.error("Image generation failed");
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
        toast.error(data?.error || "Video generation failed");
        return null;
      }
      return data?.videoUrl;
    } catch (error) {
      toast.error("Video generation failed");
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
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
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
            toast.error("Voice recognition failed");
            return;
          }
          if (data?.text) {
            setInput(data.text);
            toast.success("Voice recognized!");
          }
        } catch (error) {
          toast.error("Voice recognition failed");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording...");
    } catch (error) {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const timestamp = new Date();
    setInput("");
    setIsLoading(true);

    // Image command
    const imageMatch = userMessage.match(/^\/image\s+(.+)/i);
    if (imageMatch) {
      const prompt = imageMatch[1];
      setMessages(prev => [...prev, { role: "user", content: userMessage, timestamp }]);
      const imageUrl = await generateImage(prompt);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: imageUrl ? `Generated image for: "${prompt}"` : "Failed to generate image.",
        imageUrl: imageUrl || undefined,
        timestamp: new Date()
      }]);
      setIsLoading(false);
      return;
    }

    // Video command
    const videoMatch = userMessage.match(/^\/video\s+(.+)/i);
    if (videoMatch) {
      const prompt = videoMatch[1];
      setMessages(prev => [...prev, { role: "user", content: userMessage, timestamp }]);
      toast.info("Video generation may take 30-60 seconds...");
      const videoUrl = await generateVideo(prompt);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: videoUrl ? `Generated video for: "${prompt}"` : "Failed to generate video.",
        videoUrl: videoUrl || undefined,
        timestamp: new Date()
      }]);
      setIsLoading(false);
      return;
    }

    // Regular chat
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage, timestamp }];
    setMessages(newMessages);

    try {
      const { data, error } = await supabase.functions.invoke("elizaos-chat", {
        body: { message: userMessage, sessionId },
      });

      if (error || data?.error) {
        toast.error(data?.error || "Failed to get response");
        return;
      }

      const assistantReply = data.reply;
      setMessages([...newMessages, { role: "assistant", content: assistantReply, timestamp: new Date() }]);
      
      if (isTTSEnabled) speakText(assistantReply);
    } catch (error) {
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
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-sm border-b border-border safe-area-top">
        {/* Left - Menu Button */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 -ml-2 text-foreground hover:bg-muted/50 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Center - Agent Info */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <img 
              src={agentAvatar} 
              alt="ElizaBAO" 
              className="w-9 h-9 rounded-full border-2 border-primary/50"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-foreground">ElizaBAO</h1>
            <p className="text-[10px] text-primary">Online</p>
          </div>
        </div>

        {/* Right - Social Icons */}
        <div className="flex items-center gap-1">
          <a
            href="https://x.com/elizabaoxyz"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <TwitterIcon />
          </a>
          <a
            href="https://polymarket.com?via=elizabao"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <PolymarketIcon />
          </a>
        </div>
      </header>

      {/* Chat Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
              <img src={agentAvatar} alt="ElizaBAO" className="w-16 h-16 rounded-full" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Hey! I'm ElizaBAO</p>
              <p className="text-sm text-muted-foreground mt-1">Ask me anything about prediction markets</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <button 
                onClick={() => setInput("What are the trending markets?")}
                className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-full border border-primary/20"
              >
                Trending markets
              </button>
              <button 
                onClick={() => setInput("Show me whale activity")}
                className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-full border border-primary/20"
              >
                Whale activity
              </button>
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className="shrink-0">
              {msg.role === "assistant" ? (
                <img src={agentAvatar} alt="ElizaBAO" className="w-8 h-8 rounded-full border border-primary/30" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                  U
                </div>
              )}
            </div>
            
            <div className={`flex flex-col max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div 
                className={`rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-br-sm" 
                    : "bg-muted/50 text-foreground rounded-bl-sm border border-border/50"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
              
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Generated" className="mt-2 max-w-full rounded-xl border border-border/50" />
              )}
              {msg.videoUrl && (
                <video src={msg.videoUrl} controls className="mt-2 max-w-full rounded-xl border border-border/50" />
              )}
              
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                <Clock className="w-2.5 h-2.5" />
                <span>{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3">
            <img src={agentAvatar} alt="ElizaBAO" className="w-8 h-8 rounded-full border border-primary/30" />
            <div className="bg-muted/50 rounded-2xl rounded-bl-sm px-4 py-3 border border-border/50">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {isGeneratingVideo ? "Generating video..." : isGeneratingImage ? "Generating image..." : "Thinking..."}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 pb-8 mb-2 bg-card/80 backdrop-blur-sm border-t border-border safe-area-bottom">
        {/* Quick Actions */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setInput("/image ")}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-primary/10 text-primary rounded-full border border-primary/20"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Image
          </button>
          <button
            onClick={() => setInput("/video ")}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-primary/10 text-primary rounded-full border border-primary/20"
          >
            <Video className="w-3.5 h-3.5" />
            Video
          </button>
          <button
            onClick={() => setIsTTSEnabled(!isTTSEnabled)}
            className={`ml-auto p-1.5 rounded-full transition-all ${
              isTTSEnabled ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
            }`}
          >
            {isTTSEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Input Row */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleRecording}
            disabled={isLoading}
            className={`p-3 rounded-full transition-all ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            } disabled:opacity-30`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <div className="flex-1 flex items-center bg-muted/30 rounded-full border border-border/50 px-4 py-2 focus-within:border-primary/50">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder:text-muted-foreground/50"
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 transition-all"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Slide-out Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-card border-r border-border flex flex-col animate-slide-in-left safe-area-top safe-area-bottom">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-lg">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveMenuTab("analytics")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeMenuTab === "analytics" 
                    ? "text-primary border-b-2 border-primary" 
                    : "text-muted-foreground"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <button
                onClick={() => setActiveMenuTab("wallets")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeMenuTab === "wallets" 
                    ? "text-primary border-b-2 border-primary" 
                    : "text-muted-foreground"
                }`}
              >
                <Wallet className="w-4 h-4" />
                Wallets
              </button>
            </div>

            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {activeMenuTab === "analytics" && (
                <WhaleStatsPanel showStatsOnly={true} />
              )}
              {activeMenuTab === "wallets" && (
                <WhaleStatsPanel showStatsOnly={false} showWalletsOnly={true} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileChatView;
