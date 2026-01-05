import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, DollarSign, MousePointer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoDark from "@/assets/logo-dark.png";
import mascotAvatar from "@/assets/mascot-avatar.png";
import AsciiMouseEffect from "@/components/terminal/AsciiMouseEffect";

const AffiliateApply = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    website: "",
    promotionPlan: "",
    comments: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 scanlines noise">
      {/* Fixed Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoDark} alt="DoramOS" className="h-8 md:h-10 hover-scale" />
            <Button
              variant="ghost"
              onClick={() => navigate("/affiliate")}
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

      <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg overflow-hidden relative mt-16">
        <AsciiMouseEffect />

        <div className="px-6 py-8">
          {step === 1 ? (
            <>
              <div className="text-center mb-8 animate-fade-in">
                <p className="text-muted-foreground text-sm mb-2">Step 1 of 2</p>
                <h1 className="text-2xl font-bold mb-2">Apply to <span className="text-primary text-glow">Polymarket</span></h1>
                <p className="text-muted-foreground">
                  Submit your application to join the Polymarket affiliate program and start earning commissions for your referrals.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-2 bg-background border border-border px-3 py-2 text-sm hover:border-primary/50 transition-colors duration-300">
                  <MousePointer className="w-4 h-4 text-primary" />
                  <span>$0.01 per click</span>
                </div>
                <div className="flex items-center gap-2 bg-background border border-border px-3 py-2 text-sm hover:border-primary/50 transition-colors duration-300">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span>Earn $10 per first deposit</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="group">
                  <Label htmlFor="name" className="text-sm mb-2 block group-focus-within:text-primary transition-colors">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-background border-border focus:border-primary transition-colors duration-300"
                  />
                </div>

                <div className="group">
                  <Label htmlFor="email" className="text-sm mb-2 block group-focus-within:text-primary transition-colors">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-background border-border focus:border-primary transition-colors duration-300"
                  />
                </div>

                <div className="group">
                  <Label htmlFor="country" className="text-sm mb-2 block group-focus-within:text-primary transition-colors">
                    Country <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="country"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="bg-background border-border focus:border-primary transition-colors duration-300"
                  />
                </div>

                <div className="group">
                  <Label htmlFor="website" className="text-sm mb-2 block group-focus-within:text-primary transition-colors">
                    Website / Social media channel <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="website"
                    required
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="bg-background border-border focus:border-primary transition-colors duration-300"
                  />
                </div>

                <div className="group">
                  <Label htmlFor="promotion" className="text-sm mb-2 block group-focus-within:text-primary transition-colors">
                    How do you plan to promote Polymarket? <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="promotion"
                    required
                    value={formData.promotionPlan}
                    onChange={(e) => setFormData({ ...formData, promotionPlan: e.target.value })}
                    className="bg-background border-border min-h-[100px] focus:border-primary transition-colors duration-300"
                  />
                </div>

                <div className="group">
                  <Label htmlFor="comments" className="text-sm mb-2 block group-focus-within:text-primary transition-colors">
                    Any additional questions or comments?
                  </Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    className="bg-background border-border min-h-[80px] focus:border-primary transition-colors duration-300"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 rounded-full transition-all duration-200 hover:-translate-y-0.5"
                >
                  Submit Application
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8 animate-fade-in">
                <p className="text-muted-foreground text-sm mb-2">Step 2 of 2</p>
                <div className="w-16 h-16 bg-primary/20 border border-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Application <span className="text-primary text-glow">submitted</span></h1>
                <p className="text-muted-foreground">
                  Your application has been submitted for review. You'll receive an update at{" "}
                  <span className="text-foreground">{formData.email || "your email"}</span>
                </p>
              </div>

              <div className="text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <Button
                  onClick={() => navigate("/")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 rounded-full transition-all duration-200 hover:-translate-y-0.5"
                >
                  Continue to DoramOS Partner
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
          <p className="mb-2">Powered by <span className="text-primary text-glow">DoramOS</span></p>
          <p>
            <a href="/legal/partners" className="hover:text-foreground transition-colors duration-200">Partner Terms</a>
            {" • "}
            <a href="/legal/privacy" className="hover:text-foreground transition-colors duration-200">Privacy Policy</a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AffiliateApply;
