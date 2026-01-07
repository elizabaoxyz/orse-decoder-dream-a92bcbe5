import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

import mascotAvatar from "@/assets/mascot-avatar.png";
import AsciiMouseEffect from "@/components/terminal/AsciiMouseEffect";

const About = () => {
  const navigate = useNavigate();

  const mediaLinks = [
    {
      title: "8 DAYS / TODAY",
      description: "Third-gen bao maker opens cafe",
      url: "https://www.todayonline.com/8days/third-gen-bao-maker-opens-cafe-serving-shiok-chilli-crab-and-nasi-lemak-mantou-burgers-2142816"
    },
    {
      title: "EatBook.sg",
      description: "House of Bao Review",
      url: "https://eatbook.sg/house-of-bao/"
    },
    {
      title: "Sethlui.com",
      description: "House of Bao Queenstown",
      url: "https://sethlui.com/house-of-bao-queenstown-singapore-feb-2023/"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 scanlines noise">
      {/* Fixed Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span 
              className="text-primary text-glow text-lg md:text-xl font-bold cursor-pointer hover-scale" 
              onClick={() => navigate("/")}
            >
              ELIZABAO
            </span>
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <img 
            src={mascotAvatar} 
            alt="Mascot" 
            className="h-10 w-10 md:h-12 md:w-12 rounded-full cursor-pointer hover:scale-110 transition-transform duration-200" 
            onClick={() => navigate("/")}
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto bg-card border border-border rounded-lg overflow-hidden relative mt-16">
        <AsciiMouseEffect />

        <div className="px-6 md:px-12 py-12">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <p className="text-muted-foreground text-sm mb-2 uppercase tracking-widest">Our Story</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              About <span className="text-primary text-glow">ElizaBAO</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A family-owned business for three generations, dating back to the 1970s.
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            
            {/* Introduction */}
            <section className="text-center">
              <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto text-lg">
                What started as a traditional bao factory in Malaysia has evolved into a modern brand 
                bridging heritage craftsmanship with innovative experiences.
              </p>
            </section>

            {/* Timeline */}
            <section>
              <h2 className="text-2xl font-bold mb-8 text-center text-primary">Our Journey</h2>
              <div className="space-y-6">
                
                {/* 1970s */}
                <div className="flex gap-4 md:gap-6 items-start group">
                  <div className="shrink-0 w-20 md:w-24 text-right">
                    <span className="text-primary font-bold text-lg">1970s</span>
                    <p className="text-xs text-muted-foreground">🇲🇾 Malaysia</p>
                  </div>
                  <div className="w-px bg-border group-hover:bg-primary transition-colors self-stretch" />
                  <div className="flex-1 bg-background border border-border p-4 md:p-6 hover:border-primary/50 transition-colors">
                    <h3 className="font-bold mb-2">Family Bao Factory Established</h3>
                    <p className="text-muted-foreground text-sm">
                      Serving traditional hand-made mantous to the local community.
                    </p>
                  </div>
                </div>

                {/* 2023 */}
                <div className="flex gap-4 md:gap-6 items-start group">
                  <div className="shrink-0 w-20 md:w-24 text-right">
                    <span className="text-primary font-bold text-lg">2023</span>
                    <p className="text-xs text-muted-foreground">🇸🇬 Singapore</p>
                  </div>
                  <div className="w-px bg-border group-hover:bg-primary transition-colors self-stretch" />
                  <div className="flex-1 bg-background border border-border p-4 md:p-6 hover:border-primary/50 transition-colors">
                    <h3 className="font-bold mb-2">House of Bao Cafe Launched</h3>
                    <p className="text-muted-foreground text-sm">
                      Featuring modern bao-centric dishes. Gained recognition from local media before strategic closure.
                    </p>
                  </div>
                </div>

                {/* 2024-2026 */}
                <div className="flex gap-4 md:gap-6 items-start group">
                  <div className="shrink-0 w-20 md:w-24 text-right">
                    <span className="text-primary font-bold text-lg">2024-2026</span>
                    <p className="text-xs text-muted-foreground">🇬🇧 London</p>
                  </div>
                  <div className="w-px bg-border group-hover:bg-primary transition-colors self-stretch" />
                  <div className="flex-1 bg-background border border-border p-4 md:p-6 hover:border-primary/50 transition-colors">
                    <h3 className="font-bold mb-2">UK Company Established</h3>
                    <p className="text-muted-foreground text-sm">
                      Preparing to launch transparency-focused store in Q2 2026, combining physical retail with virtual experiences.
                    </p>
                  </div>
                </div>

              </div>
            </section>

            {/* Media Coverage */}
            <section>
              <h2 className="text-2xl font-bold mb-2 text-center text-primary">Singapore Media Coverage</h2>
              <p className="text-center text-muted-foreground mb-8 text-sm">Featured in major Singapore publications in 2023</p>
              
              <div className="grid md:grid-cols-3 gap-4">
                {mediaLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-background border border-border p-5 hover:border-primary/50 transition-all duration-300 group block"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{link.title}</h3>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>
                    <p className="text-muted-foreground text-xs">{link.description}</p>
                  </a>
                ))}
              </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
          <p>Powered by <span className="text-primary text-glow">ElizaBAO</span></p>
        </footer>
      </div>
    </div>
  );
};

export default About;
