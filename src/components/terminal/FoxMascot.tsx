import agentAvatar from "@/assets/agent-avatar.jpg";

const FoxMascot = () => {
  return (
    <div className="flex justify-center">
      <div className="relative group">
        {/* Outer glow ring - pulsing with terminal green */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-emerald-400 to-primary blur-xl opacity-50 animate-pulse" />
        
        {/* Inner glow ring - rotating emerald */}
        <div 
          className="absolute inset-2 rounded-full bg-gradient-to-r from-primary to-emerald-300 blur-lg opacity-40"
          style={{
            animation: 'spin 6s linear infinite'
          }}
        />
        
        {/* Subtle ambient glow */}
        <div className="absolute -inset-4 rounded-full bg-primary/20 blur-2xl opacity-30 pulse-glow" />
        
        {/* Avatar container with gradient border */}
        <div className="relative z-10 p-[2px] rounded-full bg-gradient-to-br from-primary via-emerald-400 to-primary">
          <div className="rounded-full bg-background p-1">
            <img 
              src={agentAvatar} 
              alt="Agent Avatar" 
              className="w-32 h-32 object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>
        
        {/* Sparkle effects with terminal green colors */}
        <div className="absolute top-0 right-2 w-2 h-2 bg-primary rounded-full animate-ping opacity-75" />
        <div 
          className="absolute bottom-4 left-0 w-1.5 h-1.5 bg-emerald-300 rounded-full animate-ping opacity-75"
          style={{ animationDelay: '0.3s' }}
        />
        <div 
          className="absolute top-8 -left-1 w-1 h-1 bg-emerald-400 rounded-full animate-ping opacity-75"
          style={{ animationDelay: '0.7s' }}
        />
      </div>
    </div>
  );
};

export default FoxMascot;
