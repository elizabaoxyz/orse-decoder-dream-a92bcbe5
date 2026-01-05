import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, DollarSign, MousePointer, ArrowLeft, CreditCard, BarChart3, Target, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoDark from "@/assets/logo-dark.png";
import mascotAvatar from "@/assets/mascot-avatar.png";
import dashboardPreview from "@/assets/dashboard-preview.png";
import AsciiMouseEffect from "@/components/terminal/AsciiMouseEffect";

const AffiliateApply = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [showImageModal, setShowImageModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    website: "",
    solanaWallet: "",
    promotionPlan: "",
    comments: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  return (
    <div className={`min-h-screen bg-background text-foreground p-4 md:p-8 ${step === 1 ? 'scanlines noise' : ''}`}>
      {/* Fixed Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/affiliate")}
              className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-200 group"
            >
              <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/10 transition-all duration-200">
                <ArrowLeft className="w-4 h-4 group-hover:text-primary transition-colors" />
              </div>
            </button>
            <img src={logoDark} alt="DoramOS" className="h-8 md:h-10 hover-scale" />
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
                  <Label htmlFor="solanaWallet" className="text-sm mb-2 block group-focus-within:text-primary transition-colors">
                    Holder Wallet (Solana) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="solanaWallet"
                    required
                    placeholder="Enter your Solana wallet address holding $ai16zdoram"
                    value={formData.solanaWallet}
                    onChange={(e) => setFormData({ ...formData, solanaWallet: e.target.value })}
                    className="bg-background border-border focus:border-primary transition-colors duration-300 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">We'll verify if you're holding $ai16zdoram tokens</p>
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
                <h1 className="text-2xl font-bold mb-4">Finish your <span className="text-primary text-glow">application</span></h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Your application to Polymarket has been saved, but you still need to create your DoramOS Partners account to complete your application.
                </p>
                <p className="text-muted-foreground text-sm mt-3">
                  Once you create your account, your application will be submitted to Polymarket and you'll hear back from them at{" "}
                  <span className="text-foreground font-medium">{formData.email || "your email"}</span>
                </p>
                
                {/* Dashboard Preview - isolated from scanlines/noise effects */}
                <div 
                  className="mt-6 rounded-2xl overflow-hidden border border-border shadow-lg relative isolate cursor-pointer hover:scale-[1.02] transition-transform duration-300" 
                  style={{ isolation: 'isolate' }}
                  onClick={() => setShowImageModal(true)}
                >
                  <div className="absolute inset-0 bg-white z-0 rounded-2xl"></div>
                  <img 
                    src={dashboardPreview} 
                    alt="DoramOS Partners Dashboard Preview" 
                    className="w-full h-auto relative z-10 rounded-2xl"
                    style={{ filter: 'none', mixBlendMode: 'normal' }}
                  />
                  {/* DoramOS text overlay */}
                  <span className="absolute top-1.5 left-2 z-20 text-black font-bold" style={{ fontSize: '8px' }}>
                    DoramOS
                  </span>
                </div>

                {/* Image Modal */}
                {showImageModal && (
                  <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
                    onClick={() => setShowImageModal(false)}
                  >
                    <div className="relative max-w-4xl max-h-[90vh] m-4">
                      <button
                        onClick={() => setShowImageModal(false)}
                        className="absolute -top-10 right-0 text-white hover:text-primary transition-colors"
                      >
                        <X className="w-8 h-8" />
                      </button>
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <img 
                          src={dashboardPreview} 
                          alt="DoramOS Partners Dashboard Preview" 
                          className="max-w-full max-h-[85vh] rounded-xl shadow-2xl animate-scale-in"
                        />
                        {/* DoramOS text overlay in modal */}
                        <span className="absolute top-2 left-3 z-20 text-black font-bold text-xs">
                          DoramOS
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-2 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="bg-background border border-border p-4 hover:border-primary/50 transition-colors duration-300">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">Join other programs</h3>
                  <p className="text-xs text-muted-foreground">Our expanding marketplace is full of high-quality programs. We guarantee their quality.</p>
                </div>
                
                <div className="bg-background border border-border p-4 hover:border-primary/50 transition-colors duration-300">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">Get paid how you want</h3>
                  <p className="text-xs text-muted-foreground">Connect your bank account, PayPal, or other payout choices. Get paid in any country.</p>
                </div>
                
                <div className="bg-background border border-border p-4 hover:border-primary/50 transition-colors duration-300">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                    <BarChart3 className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">Full analytics</h3>
                  <p className="text-xs text-muted-foreground">View how your efforts are doing and how much you've earned with our program analytics.</p>
                </div>
                
                <div className="bg-background border border-border p-4 hover:border-primary/50 transition-colors duration-300">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">Track everything</h3>
                  <p className="text-xs text-muted-foreground">DoramOS gives you the power to track every click, lead, and conversion. Knowledge is power.</p>
                </div>
              </div>

              <div className="text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-foreground font-medium mb-1">Application Under Review</p>
                  <p className="text-xs text-muted-foreground">Please allow 48-72 hours for our team to review your application.</p>
                </div>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="rounded-full transition-all duration-200 hover:-translate-y-0.5"
                >
                  Back to DoramOS
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
