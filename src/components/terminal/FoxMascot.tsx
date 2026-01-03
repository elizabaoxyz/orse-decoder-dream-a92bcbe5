import elizaMascot from "@/assets/eliza-mascot.png";

const FoxMascot = () => {
  return (
    <div className="flex justify-center">
      <img 
        src={elizaMascot} 
        alt="Eliza Mascot" 
        className="w-32 h-32 object-contain"
      />
    </div>
  );
};

export default FoxMascot;
