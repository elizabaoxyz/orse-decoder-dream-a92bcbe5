import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import agentAvatarBase from "@/assets/agent-avatar.jpg";
import { cacheBust } from "@/lib/utils";
import AsciiMouseEffect from "@/components/terminal/AsciiMouseEffect";

const agentAvatar = cacheBust(agentAvatarBase);

const Transparency = () => {
  const navigate = useNavigate();

  const recognitionLinks = [
    {
      title: "shawmakesmagic Post",
      description: "Public reference to Eliza Bao",
      url: "https://x.com/shawmakesmagic/status/1892115084383572318"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 scanlines noise">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span 
            className="text-primary text-glow text-lg md:text-xl font-bold cursor-pointer hover-scale" 
            onClick={() => navigate("/")}
          >
            ELIZABAO
          </span>
          <img 
            src={agentAvatar} 
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
            <p className="text-muted-foreground text-sm mb-2 uppercase tracking-widest">Transparency</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              History, Recognition & <span className="text-primary text-glow">Pivot</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A factual account of where this project has been, what it became, and what it is now.
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            
            {/* Origins */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-primary border-b border-border pb-2">Origins (2024–2025)</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Elizabao began as an experimental RWA-inspired project in 2024–2025. The initial vision 
                  combined real-world asset narratives with cultural branding concepts. These ambitions 
                  were not executed with sufficient continuity.
                </p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-primary border-b border-border pb-2">Acknowledgment of Gaps</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  We acknowledge the following shortcomings from the earlier phase:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Inconsistent updates and communication</li>
                  <li>Over-reliance on future milestones as indicators of progress</li>
                  <li>Narrative velocity exceeding delivery velocity</li>
                </ul>
                <p>
                  There was no intentional misrepresentation. However, responsibility for execution gaps 
                  is fully owned by the team. We do not shift blame to external factors.
                </p>
              </div>
            </section>

            {/* Recognition */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-primary border-b border-border pb-2">Recognition in Hong Kong (Early 2025)</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  In early 2025, Elizabao participated in Web3 side events in Hong Kong. During this period, 
                  the project received real, visible recognition:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Hosting and joining Web3 side events in Hong Kong</li>
                  <li>A public post by shawmakesmagic referencing Eliza Bao</li>
                  <li>A public acknowledgment by the founder of ElizaOS</li>
                  <li>A collaboration with DA AGE involving large-format digital displays</li>
                  <li>A sponsored three-week LED screen placement at Victoria Harbour</li>
                </ul>
                <p>
                  These moments were not used as proof of success. They were taken as encouragement 
                  that the project was seen and had presence in the ecosystem.
                </p>
              </div>

              {/* External Links */}
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                {recognitionLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-background border border-border p-4 hover:border-primary/50 transition-all duration-300 group block"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{link.title}</h3>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>
                    <p className="text-muted-foreground text-xs">{link.description}</p>
                  </a>
                ))}
              </div>
            </section>

            {/* Why the Name Remains */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-primary border-b border-border pb-2">Why the Name Remains</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  The recognition received in Hong Kong is one of the reasons the Elizabao name was not abandoned. 
                  This is not nostalgia. It is a commitment to continuity and accountability. Rebranding would 
                  have been easier. Staying means owning the full history.
                </p>
              </div>
            </section>

            {/* The 2026 Pivot */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-primary border-b border-border pb-2">The Pivot (2026)</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Elizabao is no longer positioned as an RWA, lifestyle, or cultural branding project. 
                  It has been restructured as a prediction intelligence initiative.
                </p>
                <p className="font-medium text-foreground">Current focus:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Operating as an official Polymarket affiliate</li>
                  <li>Building AI agents powered by ElizaOS</li>
                  <li>Focusing on real prediction markets, real user flows, and verifiable data</li>
                </ul>
                <p className="font-medium text-foreground mt-4">What has been removed:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>No future-dependent geographic narratives</li>
                  <li>No lifestyle branding</li>
                  <li>No grand ecosystem promises</li>
                </ul>
              </div>
            </section>


            {/* Closing */}
            <section className="bg-background border border-border p-6 mt-8">
              <p className="text-muted-foreground leading-relaxed text-center">
                This page exists because we believe transparency should replace persuasion. 
                We invite you to observe what exists today, rather than believe in future claims. 
                What you see is what there is.
              </p>
            </section>

          </div>
        </div>

        {/* Footer */}
        <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
          <p>
            <span 
              className="text-primary text-glow cursor-pointer hover:underline" 
              onClick={() => navigate("/")}
            >
              Return to Dashboard
            </span>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Transparency;
