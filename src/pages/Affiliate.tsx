import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { DollarSign, MousePointer, BarChart3, CreditCard, Link2, Search, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import logoDark from "@/assets/logo-dark.png";
import mascotAvatar from "@/assets/mascot-avatar.png";
import AsciiMouseEffect from "@/components/terminal/AsciiMouseEffect";

const Affiliate = () => {
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState([10]);

  const earnings = referrals[0] * 10;

  return (
    <div className="min-h-screen bg-background text-foreground p-3 md:p-8 scanlines noise">
      {/* Fixed Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-200 group md:hidden"
            >
              <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/10 transition-all duration-200">
                <ArrowLeft className="w-4 h-4 group-hover:text-primary transition-colors" />
              </div>
            </button>
            <img src={logoDark} alt="ElizaBAO" className="h-7 md:h-10 hover-scale" />
          </div>
          <img 
            src={mascotAvatar} 
            alt="Mascot" 
            className="h-9 w-9 md:h-12 md:w-12 rounded-full cursor-pointer hover:scale-110 transition-transform duration-200" 
            onClick={() => navigate("/")}
          />
        </div>
      </header>

      <div className="max-w-5xl mx-auto bg-card border border-border rounded-lg overflow-hidden relative mt-14 md:mt-16">
        {/* Hero Section */}
        <section className="border-b border-border relative">
          <AsciiMouseEffect />
          <div className="px-4 md:px-6 py-10 md:py-16 text-center relative z-10">
            <p className="text-muted-foreground text-xs md:text-sm uppercase tracking-widest mb-3 md:mb-4 animate-fade-in">
              Affiliate Program
            </p>
            <h1 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Partner with <span className="text-primary text-glow animate-pulse">Polymarket</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto animate-fade-in px-2" style={{ animationDelay: '0.2s' }}>
              Share Polymarket with your audience, and earn $10 when users you refer make their first deposit.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-6 mb-6 md:mb-8 animate-fade-in px-2" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-center gap-2 bg-background border border-border px-3 md:px-4 py-2 md:py-3 hover:border-primary/50 transition-colors duration-300">
                <MousePointer className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <span className="text-foreground font-medium text-sm md:text-base">$0.01 per click</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-background border border-border px-3 md:px-4 py-2 md:py-3 hover:border-primary/50 transition-colors duration-300">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <span className="text-foreground font-medium text-sm md:text-base">Earn $10 per first deposit</span>
              </div>
            </div>

            <Button
              onClick={() => navigate("/affiliate/apply")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 px-6 md:px-8 py-2.5 md:py-3 rounded-full shadow-md transition-all duration-200 hover:-translate-y-0.5 animate-fade-in text-sm md:text-base"
              style={{ animationDelay: '0.4s' }}
            >
              Apply Today
            </Button>
          </div>
        </section>

        {/* Partner FAQs */}
        <section className="border-b border-border">
          <div className="px-4 md:px-6 py-10 md:py-16">
            <h2 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 text-center">Partner FAQs</h2>
            <div className="space-y-3 md:space-y-4 text-muted-foreground max-w-3xl mx-auto text-sm md:text-base">
              <p className="hover:text-foreground transition-colors duration-300">
                Payments are made via Stripe. Sign up for a free Stripe account if you don't already have one, and you can link your bank account for direct deposits.
              </p>
              <p className="hover:text-foreground transition-colors duration-300">
                We're proud to offer our partners NO LIMITS on affiliate commission/income. That being said, we do verify each new affiliate user & deposits to verify they are legitimate, and attempting to game the system by generating fake users or via other means will be detected & result in a permanent suspension from the program.
              </p>
              <p className="hover:text-foreground transition-colors duration-300">
                Payments are automatically processed as soon as they are approved & you surpass $100 in earnings. Affiliate commissions are typically approved within 1 business day but can take up to 5 business days if we suspect fraudulent activity.
              </p>
              <p className="hover:text-foreground transition-colors duration-300">
                A 'sale' for the purposes of this program is defined as a user's first deposit to their Polymarket account.
              </p>
              <p className="hover:text-foreground transition-colors duration-300">
                Unlike with sportsbooks, Polymarket traders are betting against one another — that means no vig, no house, and most importantly: no trading fees. Unlike sportsbooks, there are no limits on Polymarket, and we don't ban users for winning too much.
              </p>
            </div>
          </div>
        </section>

        {/* Earnings Calculator */}
        <section className="border-b border-border">
          <div className="px-4 md:px-6 py-10 md:py-16">
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-center">Earnings calculator</h2>
            <p className="text-muted-foreground text-center mb-6 md:mb-8 text-sm md:text-base px-2">
              See how much you could earn by referring customers to our program.
            </p>

            <div className="bg-background border border-border p-5 md:p-8 max-w-md mx-auto hover:border-primary/50 transition-all duration-300">
              <div className="mb-5 md:mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground text-sm md:text-base">Customer referrals</span>
                  <span className="text-primary font-bold text-lg md:text-xl">{referrals[0]}</span>
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

              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                Earn $10 when your referral makes their first deposit
              </p>

              <div className="bg-card border border-border p-3 md:p-4 text-center">
                <p className="text-muted-foreground text-xs md:text-sm">You can earn</p>
                <p className="text-2xl md:text-3xl font-bold text-primary text-glow animate-pulse">${earnings}</p>
                <p className="text-muted-foreground text-xs md:text-sm">every month</p>
              </div>
            </div>
          </div>
        </section>

        {/* Terms & Conditions Accordion */}
        <section className="border-b border-border">
          <div className="px-4 md:px-6 py-10 md:py-16">
            <h2 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 text-center">Terms & Conditions</h2>
            <Accordion type="single" collapsible className="space-y-2 max-w-3xl mx-auto">
              <AccordionItem value="limit" className="border border-border bg-background px-3 md:px-4">
                <AccordionTrigger className="text-left text-sm md:text-base py-3 md:py-4">
                  Is there a limit to how many people I can refer?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  No, this affiliate program is uncapped. That being said, all referrals are verified & attempts to game the system (i.e. signing up for multiple accounts, violations of our site&apos;s Terms & Conditions, etc.) will result in immediate dismissal from the program.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="minimum" className="border border-border bg-background px-3 md:px-4">
                <AccordionTrigger className="text-left text-sm md:text-base py-3 md:py-4">
                  Is there a minimum deposit size?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  Yes, users must deposit at least $20 on their first deposit to be credited for this program.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="advertise" className="border border-border bg-background px-3 md:px-4">
                <AccordionTrigger className="text-left text-sm md:text-base py-3 md:py-4">
                  Can I advertise my affiliate link on Polymarket?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  We welcome you to share your affiliate link on 3rd party platforms like YouTube, 𝕏, TikTok, & more. Advertising/spamming your affiliate link via comments on Polymarket is prohibited & doing so may result in your immediate dismissal from the program.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="existing" className="border border-border bg-background px-3 md:px-4">
                <AccordionTrigger className="text-left text-sm md:text-base py-3 md:py-4">
                  Do I get credit for referring existing users?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  No, only new, first-time user deposits are credited for the purposes of this program. If you notice a referral being marked as a &quot;duplicate&quot; it likely means that &quot;referral&quot; was actually an existing user & mistakenly attributed by ElizaBAO.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cancelled" className="border border-border bg-background px-3 md:px-4">
                <AccordionTrigger className="text-left text-sm md:text-base py-3 md:py-4">
                  Why are my referrals being marked as cancelled?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  Per our terms, users must deposit at least $20 on their first deposit to be credited for this program.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>


        {/* Features Section */}
        <section className="border-b border-border">
          <div className="px-4 md:px-6 py-10 md:py-16">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <div className="bg-background border border-border p-4 md:p-6 hover:border-primary/50 transition-all duration-300 group">
                <Link2 className="w-6 h-6 md:w-8 md:h-8 text-primary mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="font-bold mb-1 md:mb-2 text-sm md:text-base">Join other programs</h3>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Our expanding marketplace is full of high-quality programs.
                </p>
              </div>

              <div className="bg-background border border-border p-4 md:p-6 hover:border-primary/50 transition-all duration-300 group">
                <CreditCard className="w-6 h-6 md:w-8 md:h-8 text-primary mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="font-bold mb-1 md:mb-2 text-sm md:text-base">Get paid how you want</h3>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Connect your bank account, PayPal, or other payout choices.
                </p>
              </div>

              <div className="bg-background border border-border p-4 md:p-6 hover:border-primary/50 transition-all duration-300 group">
                <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-primary mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="font-bold mb-1 md:mb-2 text-sm md:text-base">Full analytics</h3>
                <p className="text-muted-foreground text-xs md:text-sm">
                  View how your efforts are doing and how much you've earned.
                </p>
              </div>

              <div className="bg-background border border-border p-4 md:p-6 hover:border-primary/50 transition-all duration-300 group">
                <Search className="w-6 h-6 md:w-8 md:h-8 text-primary mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="font-bold mb-1 md:mb-2 text-sm md:text-base">Track everything</h3>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Track every click, lead, and conversion. Knowledge is power.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 md:py-8 text-center text-xs md:text-sm text-muted-foreground">
          <p className="mb-2">Powered by <span className="text-primary text-glow">ElizaBAO</span></p>
          <p>
            <Link to="/legal/partners" className="hover:text-foreground transition-colors duration-200">Partner Terms</Link>
            {" • "}
            <Link to="/legal/privacy" className="hover:text-foreground transition-colors duration-200">Privacy Policy</Link>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Affiliate;
