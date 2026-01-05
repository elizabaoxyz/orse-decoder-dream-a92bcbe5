import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logoDark from "@/assets/logo-dark.png";
import mascotAvatar from "@/assets/mascot-avatar.png";
import AsciiMouseEffect from "@/components/terminal/AsciiMouseEffect";

const Privacy = () => {
  const navigate = useNavigate();
  const lastUpdated = "January 1, 2026";

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 scanlines noise">
      {/* Fixed Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
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
            <p className="text-muted-foreground text-sm mb-2">Legal</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Privacy <span className="text-primary text-glow">Policy</span>
            </h1>
            <p className="text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none space-y-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                At DoramOS, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our platform and services. 
                Please read this privacy policy carefully. By using DoramOS, you consent to the data 
                practices described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may collect information about you in various ways, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Personal data you provide when registering or using our services (name, email, etc.)</li>
                <li>Usage data and analytics about how you interact with our platform</li>
                <li>Device information including IP address, browser type, and operating system</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Information from third-party services you connect to DoramOS</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Monitor and analyze usage patterns and trends</li>
                <li>Detect, prevent, and address technical issues and fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell your personal information. We may share your information with third parties 
                only in the following circumstances: with your consent, to comply with legal obligations, 
                to protect our rights, with service providers who assist in our operations, or in 
                connection with a business transfer or merger.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your 
                personal information against unauthorized access, alteration, disclosure, or destruction. 
                However, no method of transmission over the Internet is 100% secure, and we cannot 
                guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Depending on your location, you may have certain rights regarding your personal data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify or update inaccurate personal data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our platform and 
                hold certain information. You can instruct your browser to refuse all cookies or to 
                indicate when a cookie is being sent. However, if you do not accept cookies, you may 
                not be able to use some portions of our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us through our official channels.
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

export default Privacy;
