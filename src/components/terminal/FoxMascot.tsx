import elizaMascot from "@/assets/eliza-mascot.png";

const FoxMascot = () => {
  return (
    <div className="flex justify-center">
      <div className="relative">
        {/* Outer glow ring - pulsing */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 blur-xl opacity-60 animate-pulse" />
        
        {/* Inner glow ring - rotating */}
        <div 
          className="absolute inset-2 rounded-full bg-gradient-to-r from-cyan-300 to-blue-400 blur-lg opacity-50"
          style={{
            animation: 'spin 4s linear infinite'
          }}
        />
        
        {/* Avatar container with border glow */}
        <div className="relative z-10 p-1 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
          <div className="rounded-full bg-background p-1">
            <img 
              src={elizaMascot} 
              alt="Eliza Mascot" 
              className="w-32 h-32 object-contain rounded-full"
            />
          </div>
        </div>
        
        {/* Sparkle effects */}
        <div className="absolute top-0 right-2 w-2 h-2 bg-cyan-300 rounded-full animate-ping opacity-75" />
        <div className="absolute bottom-4 left-0 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping opacity-75 animation-delay-300" />
        <div className="absolute top-8 -left-1 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-75 animation-delay-700" />
      </div>
    </div>
  );
};

export default FoxMascot;
