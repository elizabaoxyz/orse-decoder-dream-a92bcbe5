import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logoDark from "@/assets/logo-dark.png";
import AsciiMouseEffect from "@/components/terminal/AsciiMouseEffect";

const Partners = () => {
  const navigate = useNavigate();
  const lastUpdated = "January 1, 2026";

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 scanlines noise">
      {/* Fixed Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <img 
            src={logoDark} 
            alt="DoramOS" 
            className="h-8 md:h-10 hover-scale cursor-pointer" 
            onClick={() => navigate("/")}
          />
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto bg-card border border-border rounded-lg overflow-hidden relative mt-16">
        <AsciiMouseEffect />

        <div className="px-6 md:px-12 py-12">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <p className="text-muted-foreground text-sm mb-2">Legal</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Partner <span className="text-primary text-glow">Terms</span>
            </h1>
            <p className="text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none space-y-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Agreement Overview</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Partner Terms ("Agreement") govern your participation in the DoramOS Partner Program. 
                By joining our program, you agree to be bound by these terms. This Agreement is between you 
                ("Partner," "you," or "your") and DoramOS ("we," "us," or "our").
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Program Enrollment</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To participate in the DoramOS Partner Program, you must:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Submit a complete and accurate application</li>
                <li>Be at least 18 years of age or the age of majority in your jurisdiction</li>
                <li>Have an active website, social media presence, or other qualifying platform</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not engage in any fraudulent or deceptive practices</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We reserve the right to accept or reject any application at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Commission Structure</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                As a DoramOS Partner, you may earn commissions as follows:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong className="text-foreground">Per Click:</strong> $0.01 for each valid click on your referral link</li>
                <li><strong className="text-foreground">Per Conversion:</strong> $10 for each referred user who makes their first qualifying deposit of at least $20</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Commission rates may be modified at any time with reasonable notice to partners.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Payment Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Payments are processed according to the following terms:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Minimum payout threshold: $100</li>
                <li>Payment processing: via Stripe to your linked bank account</li>
                <li>Commission approval: typically within 1-5 business days</li>
                <li>Automatic payment once threshold is reached and commissions are approved</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Partner Obligations</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                As a partner, you agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Promote DoramOS in an honest and ethical manner</li>
                <li>Not engage in spam, misleading advertising, or deceptive practices</li>
                <li>Not bid on DoramOS branded keywords in paid advertising</li>
                <li>Clearly disclose your affiliate relationship when required by law</li>
                <li>Not create fake accounts or generate fraudulent referrals</li>
                <li>Comply with all platform-specific rules where you promote</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Prohibited Activities</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The following activities are strictly prohibited:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Creating multiple accounts or self-referrals</li>
                <li>Using bots, scripts, or automated tools to generate clicks or signups</li>
                <li>Spamming affiliate links in comments on DoramOS or partner platforms</li>
                <li>Making false or misleading claims about DoramOS services</li>
                <li>Incentivizing signups through unauthorized means</li>
                <li>Violating any applicable laws or third-party terms of service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                DoramOS grants you a limited, non-exclusive, revocable license to use our approved 
                marketing materials and trademarks solely for the purpose of promoting our services 
                under this program. You may not modify our trademarks or use them in any way that 
                implies endorsement or partnership beyond the scope of this Agreement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                Either party may terminate this Agreement at any time for any reason. We may 
                immediately terminate your participation if you violate these terms or engage in 
                fraudulent activity. Upon termination, you must cease all use of DoramOS marketing 
                materials and affiliate links. Pending commissions may be forfeited if termination 
                is due to your breach of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                DoramOS shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages arising out of or related to this Agreement. Our total liability 
                shall not exceed the total commissions paid to you in the twelve months preceding 
                the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Modifications</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Partner Terms at any time. Changes will be 
                effective upon posting to our website. Your continued participation in the program 
                after changes are posted constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about the Partner Program or these terms, please contact us through our official channels.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
          <p className="mb-2">Powered by <span className="text-primary text-glow">DoramOS</span></p>
          <p>
            <a href="/legal/privacy" className="hover:text-foreground transition-colors duration-200">Privacy Policy</a>
            {" • "}
            <a href="/legal/partners" className="hover:text-foreground transition-colors duration-200">Partner Terms</a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Partners;
