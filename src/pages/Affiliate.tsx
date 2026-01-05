import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Check, DollarSign, MousePointer, BarChart3, CreditCard, Link2, Search } from "lucide-react";

const Affiliate = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [referrals, setReferrals] = useState([10]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    website: "",
    promotionPlan: "",
    comments: "",
  });

  const earnings = referrals[0] * 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-5xl mx-auto bg-card border border-border rounded-lg overflow-hidden">
        {/* Hero Section */}
        <section className="border-b border-border">
          <div className="px-6 py-16 text-center">
            <p className="text-muted-foreground text-sm uppercase tracking-widest mb-4">
              Affiliate Program
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Partner with <span className="text-primary text-glow">Polymarket</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Share Polymarket with your audience, and earn $10 when users you refer make their first deposit.
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 bg-background border border-border px-4 py-3">
                <MousePointer className="w-5 h-5 text-primary" />
                <span className="text-foreground font-medium">$0.01 per click</span>
              </div>
              <div className="flex items-center gap-2 bg-background border border-border px-4 py-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-foreground font-medium">Earn $10 per first deposit</span>
              </div>
            </div>

            <Button
              onClick={() => document.getElementById('apply-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3"
            >
              Apply Today
            </Button>
          </div>
        </section>

        {/* Partner FAQs */}
        <section className="border-b border-border">
          <div className="px-6 py-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Partner FAQs</h2>
            <div className="space-y-4 text-muted-foreground max-w-3xl mx-auto">
              <p>
                Payments are made via Stripe. Sign up for a free Stripe account if you don't already have one, and you can link your bank account for direct deposits.
              </p>
              <p>
                We're proud to offer our partners NO LIMITS on affiliate commission/income. That being said, we do verify each new affiliate user & deposits to verify they are legitimate, and attempting to game the system by generating fake users or via other means will be detected & result in a permanent suspension from the program.
              </p>
              <p>
                Payments are automatically processed as soon as they are approved & you surpass $100 in earnings. Affiliate commissions are typically approved within 1 business day but can take up to 5 business days if we suspect fraudulent activity.
              </p>
              <p>
                A 'sale' for the purposes of this program is defined as a user's first deposit to their Polymarket account.
              </p>
              <p>
                Unlike with sportsbooks, Polymarket traders are betting against one another — that means no vig, no house, and most importantly: no trading fees. Unlike sportsbooks, there are no limits on Polymarket, and we don't ban users for winning too much.
              </p>
            </div>
          </div>
        </section>

        {/* Earnings Calculator */}
        <section className="border-b border-border">
          <div className="px-6 py-16">
            <h2 className="text-2xl font-bold mb-2 text-center">Earnings calculator</h2>
            <p className="text-muted-foreground text-center mb-8">
              See how much you could earn by referring customers to our program.
            </p>

            <div className="bg-background border border-border p-8 max-w-md mx-auto">
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Customer referrals</span>
                  <span className="text-primary font-bold text-xl">{referrals[0]}</span>
                </div>
                <Slider
                  value={referrals}
                  onValueChange={setReferrals}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Earn $10 when your referral makes their first deposit
              </p>

              <div className="bg-card border border-border p-4 text-center">
                <p className="text-muted-foreground text-sm">You can earn</p>
                <p className="text-3xl font-bold text-primary text-glow">${earnings}</p>
                <p className="text-muted-foreground text-sm">every month</p>
              </div>
            </div>
          </div>
        </section>

        {/* Terms & Conditions Accordion */}
        <section className="border-b border-border">
          <div className="px-6 py-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Terms & Conditions</h2>
            <Accordion type="single" collapsible className="space-y-2 max-w-3xl mx-auto">
              <AccordionItem value="limit" className="border border-border bg-background px-4">
                <AccordionTrigger className="text-left">
                  Is there a limit to how many people I can refer?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No, this affiliate program is uncapped. That being said, all referrals are verified & attempts to game the system (i.e. signing up for multiple accounts, violations of our site's Terms & Conditions, etc.) will result in immediate dismissal from the program.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="minimum" className="border border-border bg-background px-4">
                <AccordionTrigger className="text-left">
                  Is there a minimum deposit size?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes, users must deposit at least $20 on their first deposit to be credited for this program.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="advertise" className="border border-border bg-background px-4">
                <AccordionTrigger className="text-left">
                  Can I advertise my affiliate link on Polymarket?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We welcome you to share your affiliate link on 3rd party platforms like YouTube, 𝕏, TikTok, & more. Advertising/spamming your affiliate link via comments on Polymarket is prohibited & doing so may result in your immediate dismissal from the program.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="existing" className="border border-border bg-background px-4">
                <AccordionTrigger className="text-left">
                  Do I get credit for referring existing users?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No, only new, first-time user deposits are credited for the purposes of this program. If you notice a referral being marked as a "duplicate" it likely means that "referral" was actually an existing user & mistakenly attributed by DoramOS.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cancelled" className="border border-border bg-background px-4">
                <AccordionTrigger className="text-left">
                  Why are my referrals being marked as cancelled?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Per our terms, users must deposit at least $20 on their first deposit to be credited for this program.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Application Section */}
        <section id="apply-section" className="border-b border-border">
          <div className="px-6 py-16">
            {step === 1 ? (
              <>
                <div className="text-center mb-8">
                  <p className="text-muted-foreground text-sm mb-2">Step 1 of 2</p>
                  <h2 className="text-2xl font-bold mb-2">Apply to Polymarket</h2>
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

                <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
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
                  <h2 className="text-2xl font-bold mb-2">Application submitted</h2>
                  <p className="text-muted-foreground">
                    Your application has been submitted for review. You'll receive an update at{" "}
                    <span className="text-foreground">{formData.email || "your email"}</span>
                  </p>
                </div>

                <div className="text-center">
                  <Button
                    onClick={() => window.location.href = "/"}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Continue to DoramOS Partner
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="border-b border-border">
          <div className="px-6 py-16">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-background border border-border p-6">
                <Link2 className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-bold mb-2">Join other programs</h3>
                <p className="text-muted-foreground text-sm">
                  Our expanding marketplace is full of high-quality programs. We guarantee their quality.
                </p>
              </div>

              <div className="bg-background border border-border p-6">
                <CreditCard className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-bold mb-2">Get paid how you want</h3>
                <p className="text-muted-foreground text-sm">
                  Connect your bank account, PayPal, or other payout choices. Get paid in any country.
                </p>
              </div>

              <div className="bg-background border border-border p-6">
                <BarChart3 className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-bold mb-2">Full analytics</h3>
                <p className="text-muted-foreground text-sm">
                  View how your efforts are doing and how much you've earned with our program analytics.
                </p>
              </div>

              <div className="bg-background border border-border p-6">
                <Search className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-bold mb-2">Track everything</h3>
                <p className="text-muted-foreground text-sm">
                  Dub gives you the power to track every click, lead, and conversion. Knowledge is power.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-sm text-muted-foreground">
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

export default Affiliate;
