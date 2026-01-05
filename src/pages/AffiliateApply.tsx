import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, DollarSign, MousePointer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoDark from "@/assets/logo-dark.png";

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
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg overflow-hidden relative">
        {/* Sticky Header with Logo */}
        <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
          <img src={logoDark} alt="DoramOS" className="h-8 md:h-10" />
          <Button
            variant="ghost"
            onClick={() => navigate("/affiliate")}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </header>

        <div className="px-6 py-8">
          {step === 1 ? (
            <>
              <div className="text-center mb-8">
                <p className="text-muted-foreground text-sm mb-2">Step 1 of 2</p>
                <h1 className="text-2xl font-bold mb-2">Apply to Polymarket</h1>
                <p className="text-muted-foreground">
                  Submit your application to join the Polymarket affiliate program and start earning commissions for your referrals.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <div className="flex items-center gap-2 bg-background border border-border px-3 py-2 text-sm">
                  <MousePointer className="w-4 h-4 text-primary" />
                  <span>$0.01 per click</span>
                </div>
                <div className="flex items-center gap-2 bg-background border border-border px-3 py-2 text-sm">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span>Earn $10 per first deposit</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-sm mb-2 block">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm mb-2 block">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="country" className="text-sm mb-2 block">
                    Country <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="country"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="website" className="text-sm mb-2 block">
                    Website / Social media channel <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="website"
                    required
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="promotion" className="text-sm mb-2 block">
                    How do you plan to promote Polymarket? <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="promotion"
                    required
                    value={formData.promotionPlan}
                    onChange={(e) => setFormData({ ...formData, promotionPlan: e.target.value })}
                    className="bg-background border-border min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="comments" className="text-sm mb-2 block">
                    Any additional questions or comments?
                  </Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    className="bg-background border-border min-h-[80px]"
                  />
                </div>

                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Submit Application
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <p className="text-muted-foreground text-sm mb-2">Step 2 of 2</p>
                <div className="w-16 h-16 bg-primary/20 border border-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Application submitted</h1>
                <p className="text-muted-foreground">
                  Your application has been submitted for review. You'll receive an update at{" "}
                  <span className="text-foreground">{formData.email || "your email"}</span>
                </p>
              </div>

              <div className="text-center">
                <Button
                  onClick={() => navigate("/")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Continue to DoramOS Partner
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
          <p className="mb-2">Powered by <span className="text-primary">DoramOS</span></p>
          <p>
            <a href="#" className="hover:text-foreground">Terms of Service</a>
            {" • "}
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AffiliateApply;
