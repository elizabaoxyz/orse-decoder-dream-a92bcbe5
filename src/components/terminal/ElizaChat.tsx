import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mic, MicOff, Volume2, VolumeX, ImageIcon, Video, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  videoUrl?: string;
}

const ElizaChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
        console.error("TTS error:", error || data?.error);
        // Fallback to browser TTS
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
        
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsSpeaking(false);
        audioRef.current.play();
      } else if (data?.audioUrl) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
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
      console.error("Image generation error:", error);
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
      console.error("Video generation error:", error);
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
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // Send to STT
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
          console.error("STT error:", error);
          toast.error("Voice recognition failed");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording... Click again to stop");
    } catch (error) {
      console.error("Microphone error:", error);
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
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Check for image generation command
    const imageMatch = userMessage.match(/^\/image\s+(.+)/i);
    if (imageMatch) {
      const prompt = imageMatch[1];
      setMessages(prev => [...prev, { role: "user", content: userMessage }]);
      
      const imageUrl = await generateImage(prompt);
      if (imageUrl) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: `Generated image for: "${prompt}"`,
          imageUrl 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "Failed to generate image. Please try again." 
        }]);
      }
      setIsLoading(false);
      return;
    }

    // Check for video generation command
    const videoMatch = userMessage.match(/^\/video\s+(.+)/i);
    if (videoMatch) {
      const prompt = videoMatch[1];
      setMessages(prev => [...prev, { role: "user", content: userMessage }]);
      
      toast.info("Video generation may take 30-60 seconds...");
      const videoUrl = await generateVideo(prompt);
      if (videoUrl) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: `Generated video for: "${prompt}"`,
          videoUrl 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "Failed to generate video. Please try again." 
        }]);
      }
      setIsLoading(false);
      return;
    }

    // Regular chat message
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

      const assistantReply = data.reply;
      setMessages([...newMessages, { role: "assistant", content: assistantReply }]);
      
      // Speak the response if TTS is enabled
      if (isTTSEnabled) {
        speakText(assistantReply);
      }
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

  const getLoadingText = () => {
    if (isGeneratingVideo) return " GENERATING_VIDEO (this may take a minute)";
    if (isGeneratingImage) return " GENERATING_IMAGE";
    return " PROCESSING_QUERY";
  };

  return (
    <div className="terminal-panel mt-4">
      <div className="terminal-header flex items-center justify-between">
        <span>meet ElizaBAO</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTTSEnabled(!isTTSEnabled)}
            className={`p-1 rounded transition-colors ${
              isTTSEnabled ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            title={isTTSEnabled ? "Disable voice" : "Enable voice"}
          >
            {isTTSEnabled ? (
              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Agent Introduction */}
        <div className="border border-border/30 rounded-lg p-3 bg-card/30 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-mono text-primary">ONLINE</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            ElizaBAO is an AI agent powered by <span className="text-primary">ElizaOS</span>. 
            Use <span className="text-primary">/image [prompt]</span> or <span className="text-primary">/video [prompt]</span> to generate media.
          </p>
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">Crypto Prices</span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">Polymarket</span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">Weather</span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> Image
            </span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded flex items-center gap-1">
              <Video className="w-3 h-3" /> Video
            </span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded flex items-center gap-1">
              <Volume2 className="w-3 h-3" /> Voice
            </span>
          </div>
        </div>

        {/* Chat Messages */}
        <div 
          ref={messagesContainerRef}
          className="h-48 overflow-y-auto space-y-3 font-mono text-xs scrollbar-none"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className="space-y-1">
              <div className={`flex items-start gap-2 ${msg.role === "user" ? "text-primary" : "text-foreground"}`}>
                <span className="shrink-0">
                  {msg.role === "user" ? "[USER]:" : "[ELIZABAO]:"}
                </span>
                <span className="whitespace-pre-wrap break-words">{msg.content}</span>
              </div>
              {msg.imageUrl && (
                <div className="ml-12 mt-2">
                  <img 
                    src={msg.imageUrl} 
                    alt="Generated" 
                    className="max-w-full max-h-48 rounded border border-border/50"
                  />
                </div>
              )}
              {msg.videoUrl && (
                <div className="ml-12 mt-2">
                  <video 
                    src={msg.videoUrl} 
                    controls
                    className="max-w-full max-h-48 rounded border border-border/50"
                  />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="text-muted-foreground animate-pulse">
              <span className="text-primary">[ELIZABAO]:</span> 
              {getLoadingText()}
              <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-border/30 pt-4">
          <span className="text-primary font-mono text-sm">&gt;&gt;</span>
          
          {/* Voice input button */}
          <button
            onClick={toggleRecording}
            disabled={isLoading}
            className={`p-1.5 rounded transition-colors ${
              isRecording 
                ? 'bg-red-500/20 text-red-500 animate-pulse' 
                : 'text-muted-foreground hover:text-primary'
            } disabled:opacity-30`}
            title={isRecording ? "Stop recording" : "Voice input"}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="/image or /video [prompt]..."
            className="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-sm placeholder:text-muted-foreground/50 disabled:opacity-50"
            autoFocus
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="text-primary hover:text-primary/80 font-mono text-xs uppercase tracking-wider disabled:opacity-30 transition-colors flex items-center gap-1"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            [SEND]
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElizaChat;
