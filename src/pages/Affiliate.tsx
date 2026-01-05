import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { DollarSign, MousePointer, BarChart3, CreditCard, Link2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoDark from "@/assets/logo-dark.png";

const Affiliate = () => {
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState([10]);

  const earnings = referrals[0] * 10;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      {/* Fixed Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <img src={logoDark} alt="DoramOS" className="h-8 md:h-10" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto bg-card border border-border rounded-lg overflow-hidden relative mt-16">
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
              onClick={() => navigate("/affiliate/apply")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 px-8 py-3 rounded-full shadow-md transition-all duration-200 hover:-translate-y-0.5"
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
