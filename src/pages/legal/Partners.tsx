import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logoDark from "@/assets/logo-dark.png";
import mascotAvatar from "@/assets/mascot-avatar.png";
import AsciiMouseEffect from "@/components/terminal/AsciiMouseEffect";

const Partners = () => {
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
              alt="ElizaBAO" 
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
              Partner <span className="text-primary text-glow">Terms</span>
            </h1>
            <p className="text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none space-y-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-primary">1. Platform Access and Usage</h2>
              
              <div className="space-y-6">
                <div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    ElizaBAO&apos;s Platform is intended to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>enable Partners to join and participate in Partner Programs, and to earn rewards for their eligible contributions</li>
                    <li>allow Partners to search, view, learn and participate in Partner Programs</li>
                  </ul>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  By using the Platform, you grant ElizaBAO the right to access, collect, store, disclose, process, transmit, 
                  and use any data, information, records, or files you provide through the Platform —or that others provide 
                  in connection with your participation— for the sole purpose of operating, maintaining, and improving the Platform.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  ElizaBAO may, at its sole discretion and without prior notice, suspend or terminate your access to the Platform 
                  if you fail to comply with this Agreement or engage in conduct that ElizaBAO determines may harm the Platform, 
                  other users, or ElizaBAO&apos;s reputation.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  In all matters relating to this Agreement, you and ElizaBAO are independent contractors, and nothing will be 
                  construed to create any association, partnership, joint venture, or relationship of agency or employment 
                  between you and ElizaBAO.
                </p>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">Account Registration</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    All users must create partner accounts and accept ElizaBAO&apos;s Terms of Service to access the ElizaBAO Platform. 
                    You&apos;re responsible for ensuring that your Permitted Users (if applicable) comply with the Terms of Service. 
                    If you are registering on ElizaBAO Platform as a business entity, you represent that you have the authority 
                    to bind the entity to this Agreement.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Upon acceptance of the terms of this Agreement, and in order to access the Platform, you must create an account 
                    with a unique username and password for use by yourself and if applicable, any authorized personnel acting on 
                    your behalf (&quot;Permitted Users&quot;). You must keep Your User ID confidential and secure. Do not disclose or share 
                    your User ID. You are responsible for all acts, omissions and content carried out under your User ID and ElizaBAO 
                    will consider all acts, omissions and content on the Platform under your User ID as authorized by you. If you 
                    suspect that a User ID has been compromised, you must notify ElizaBAO immediately.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">Single Account Policy</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Creating multiple partner accounts on ElizaBAO is strictly prohibited and constitutes a violation of our Partner 
                    Terms of Service. Each individual or business entity is limited to one partner account. Any attempt to create 
                    additional accounts using different email addresses, identities, or other means to circumvent this restriction 
                    will result in immediate account suspension or termination. If you need to modify your account details or transfer 
                    account ownership, please contact our support team instead of creating a new account.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">Partner Obligations</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You represent and warrant that you will use the Platform only in accordance with all applicable laws, rules, 
                    and regulations, including but not limited to privacy and data protection laws, and refrain from misrepresentation 
                    of any information uploaded or provided, impersonation of another individual or entity, or engaging in fraudulent 
                    behavior or misconduct.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You agree to collaborate with each Client only through methods approved or specified by that Client in the 
                    Affiliate Program Agreement or a similar agreement. Your interactions with Clients must also comply with this 
                    Agreement, and you will not use Client data in any way that infringes the intellectual property rights of a 
                    third party or violates any applicable law, rule, or regulation.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You further represent and warrant that you have full power and authority to enter into and perform your 
                    obligations under this Agreement, and that in carrying out this Agreement and using the Platform, you will 
                    comply with all applicable laws and have the right to transmit your data through or to our Platform.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-2">ElizaBAO will not be responsible or liable for:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>any defects, issues, or failures of products or software not provided by ElizaBAO</li>
                    <li>glitches, defects, problems associated with or caused by a failure of the internet</li>
                    <li>any losses, disputes, or expenses arising from your engagement with third parties (including Clients)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-primary">2. Partner Programs</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">Partner Programs</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The Platform allows Partners to discover and participate in Partner Programs offered by Clients. 
                    The Platform may also display details about Partner Programs, such as program descriptions, payment terms, 
                    commission schedules, and other applicable terms and conditions. If you choose to participate in a Partner Program, 
                    you will communicate directly with the Client offering it through the Platform and may be required to enter into 
                    a separate agreement governing that program (such as Affiliate Program Agreement), or another similarly titled 
                    arrangement agreed upon with the Client. ElizaBAO is not a party to any Affiliate Program Agreement or related 
                    agreement and shall have no liability, responsibility, or obligation relating to any such agreement.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">Third Party Links</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    The Platform may provide links to third party websites. ElizaBAO does not endorse the information contained on 
                    those websites or guarantee their quality, accuracy, reliability, completeness, currency, timeliness, non-infringement, 
                    merchantability or fitness for any purpose. The content in any linked website is provided for your convenience but 
                    is not under ElizaBAO&apos;s control. If you access any such website, you do so entirely at your own risk.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    ElizaBAO does not warrant or accept any liability or obligation to you with respect to third party software and services. 
                    This Agreement does not absolve you of any duty or obligations imposed under any such third-party agreements. 
                    You may request a copy of any agreement with a third-party from them.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">Commissions</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Through Partner Programs, you may earn commissions (&quot;Commissions&quot;) from such Clients. When a Client pays ElizaBAO 
                    Commission amounts due under its Partner Program for remittance to you, ElizaBAO will notify you through the Platform 
                    that the payment may be deposited via the Payment Provider (as described and defined below).
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    To be eligible to receive Commission payments, you must maintain an active account on the Platform and set up a valid 
                    payout method. This requires creating a Stripe Express account and completing all necessary identity and other applicable 
                    verifications. If Stripe Express is not available in your country, you may instead use a PayPal account to receive commissions.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Commissions are payable only after the applicable Client has paid ElizaBAO in full for the corresponding transaction. 
                    The Partner Dashboard will indicate the status of your payouts:
                  </p>
                  <ul className="list-none text-muted-foreground space-y-3 ml-4">
                    <li><strong className="text-foreground">Pending:</strong> When you start earning commissions from a Partner Program, they&apos;ll be accrued under a payout entry. If the Partner Program has a minimum payout amount set, your payout amount will need to reach the threshold to become eligible for payment.</li>
                    <li><strong className="text-foreground">Processing:</strong> When a Partner Program initiates a payout to you, the payout will be updated to a &quot;processing&quot; state until the payment settles on ElizaBAO. This process can take up to 5 business days.</li>
                    <li><strong className="text-foreground">Processed:</strong> Once the program&apos;s payout has settled on ElizaBAO, the payout will be updated to a &quot;processed&quot; state. If the payout amount is above your minimum withdrawal balance, the funds will be automatically paid out to your connected bank account.</li>
                    <li><strong className="text-foreground">Sent:</strong> When your payout is on its way to your connected bank account, it will be updated to a &quot;sent&quot; state. Depending on your bank location, this can take anywhere from 1 to 14 business days (you will see the estimated arrival date in the notification email from ElizaBAO).</li>
                    <li><strong className="text-foreground">Completed:</strong> When the payout is completed and the funds are deposited into your bank account.</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-4 mb-2">You agree and acknowledge that:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>ElizaBAO has no obligation to pay any Commission, and is not responsible for any Commission amounts until payment has been received in full from the responsible Client;</li>
                    <li>Commission payments will be deposited into your account via Stripe Express (or via PayPal only if Stripe Express is unavailable in your country);</li>
                    <li>ElizaBAO is not liable for any delays, inaccuracies, or errors in Commission payments;</li>
                    <li>For any Clients you engage with through the Platform, all related Commission payments must be processed through ElizaBAO. Receiving payments directly from such Clients, while their program is active on the Platform, is a violation of these Terms of Service.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">Taxes</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Each party is responsible for paying their own taxes, including sales, use, value added, or any other national, 
                    state, or local taxes on net income, capital, gross receipts or payments, and is responsible for complying with 
                    any required tax documentation or obligations. This also applies to customs duties and other similar fees. 
                    With respect to Commission payments earned and received by the Partner, the Partner agrees that it is solely 
                    responsible for any taxes, levies, customs duties or similar governmental assessments of any nature imposed 
                    or in force in the relevant jurisdiction of tax residency or incorporation.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">Payment Processing</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    The Platform facilitates certain payments between Clients and Partners under Affiliate Program Agreements. 
                    Payment processing services are provided by third-party payment providers, including Stripe Express (Stripe, Inc.) 
                    and PayPal (PayPal Holdings, Inc.) (collectively, &quot;Payment Providers&quot;). All payments to Partners will be processed 
                    through Payment Providers, which require that you enter a separate agreement with the Payment Provider(s). 
                    ElizaBAO is not a party to any such agreement and shall have no liability, responsibility or obligation under such agreement. 
                    You will be solely responsible for any fees charged by any Payment Provider (the &quot;Transaction Costs&quot;).
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    ElizaBAO is not responsible for any incorrect, delayed, or failed payments resulting from outdated or inaccurate account information.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-primary">3. Suspension and Termination</h2>
              
              <div className="space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  This Agreement begins on the date you accept its terms (the &quot;Effective Date&quot;) and will remain in effect until 
                  it is modified, replaced, or terminated. Either party may terminate this Agreement at any time by providing 
                  the other party with thirty (30) days&apos; written notice.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Upon termination of this Agreement, effective as of the termination date, you must immediately cease all use 
                  of the Platform and return any materials provided by ElizaBAO (if applicable). Both parties must also destroy 
                  any confidential information received from the other, except as required to be retained under applicable law.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  If you breach this Agreement, ElizaBAO may, at its sole discretion and without notice, temporarily or permanently 
                  suspend your access to the Platform. You may terminate your account by providing ElizaBAO with thirty (30) days&apos; 
                  written notice. Termination of your account will result in the immediate loss of access to the Platform, and 
                  ElizaBAO may delete any information stored in your account. Termination does not limit ElizaBAO&apos;s other rights 
                  or remedies available under this Agreement or applicable law.
                </p>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">Termination by a Client</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You acknowledge that a Client may terminate its relationship with you for any reason by providing written notice 
                    (including by email) in accordance with the Affiliate Program Agreement or other terms previously agreed between 
                    you and that Client.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    ElizaBAO has no obligation to confirm or acknowledge any such notice of termination between a Client and a Partner, 
                    and will not be liable for any unpaid amounts or other obligations that remain unfulfilled by the Client.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-primary">4. Platform Ownership</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                ElizaBAO owns all right, title, and interest in the Platform, including all information, materials, and content 
                provided by ElizaBAO in connection with the Platform or contained within it, as well as any updates, adaptations, 
                translations, customizations, derivative works, and all associated intellectual property rights. Your use of the 
                Platform does not grant you any ownership or other rights in the Platform, except for the limited rights expressly 
                provided in this Agreement.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                ElizaBAO may compile and derive aggregated, anonymized data from users of the Platform, including indicators, 
                performance metrics, and usage patterns. Usage data is not Partner data, is not personal data, and cannot be 
                used to identify you or any other individual. Usage Data cannot be re-identified and will be considered the 
                property of ElizaBAO.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-primary">5. Privacy</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To operate the Platform, ElizaBAO collects, uses, stores, and shares certain information as described in our{" "}
                <a href="/legal/privacy" className="text-primary hover:underline">ElizaBAO Privacy Policy</a>, 
                which is incorporated into this Agreement by reference.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In using the Platform, each party agrees to comply with all applicable laws, including all applicable privacy 
                and data protection laws. Each party assures that it has obtained all necessary rights, authorizations, consents, 
                and permissions for any information, materials, or content entered into the Platform, including any information 
                relating to identifiable individuals.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                If you have collected personal data from another site and are sharing it on the Platform, you represent that 
                you have disclosed that fact in a publicly facing and appropriate privacy policy.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-primary">6. Confidentiality</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                &quot;Confidential Information&quot; means any information disclosed by one party to the other in connection with this 
                Agreement that is designated as proprietary or confidential by the disclosing party, or should reasonably be 
                understood to be proprietary or confidential given its nature and the circumstances of disclosure.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">Each party agrees to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                <li>use the other party&apos;s Confidential Information solely for the purpose of fulfilling its obligations under this Agreement;</li>
                <li>protect the other party&apos;s Confidential Information with at least the same degree of care it uses to protect its own confidential information of similar importance;</li>
                <li>not disclose the other party&apos;s Confidential Information to any third party except to its employees, contractors, or professional advisors who have a legitimate need to know the information and who are bound by confidentiality obligations at least as protective as those in this Agreement.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The obligations do not apply to any information that the receiving party can demonstrate has becomes publicly known 
                through no wrongful act or omission of the receiving party; is rightfully received from a third party without restriction 
                on disclosure; is independently developed by the receiving party without use of or reference to the disclosing party&apos;s 
                Confidential Information.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The receiving party may disclose Confidential Information if required by law, regulation, or court order, provided that 
                it (where legally permissible) gives prompt written notice to the disclosing party to allow the disclosing party to seek 
                a protective order or other remedy. Upon termination of this Agreement, each party will, at the disclosing party&apos;s request, 
                return or destroy all Confidential Information in its possession, subject to any retention required by applicable law.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-primary">7. Disclaimers</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The ElizaBAO Platform is provided &quot;as is&quot; and &quot;as available.&quot; To the fullest extent permitted by applicable law, 
                and except as expressly stated in this Agreement, ElizaBAO makes no warranties, representations, or conditions of any kind, 
                whether express, implied, statutory, or otherwise, including any implied warranties of merchantability, fitness for a 
                particular purpose, or non-infringement. Except as expressly stated in this Agreement, ElizaBAO does not warrant that 
                the Platform will be uninterrupted or error-free.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Platform is made available to various independent entities, including Partners and Clients. These entities are not 
                partners, agents, or employees of ElizaBAO. ElizaBAO is not responsible or liable for the acts, omissions, representations, 
                warranties, breaches, or negligence of any such entity, nor for any Partner Program, Affiliate Program Agreement, or 
                other offerings provided by them.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                In no event will ElizaBAO or its officers, directors, affiliates, partners, employees, shareholders, or agents be liable 
                for any damages of any kind (including lost profits, loss of data, personal injury, fines, fees, penalties, or other liabilities), 
                arising from or related to your use of, or inability to use, the Platform, any Partner Program, or any Affiliate Program Agreement. 
                In no event, regardless of the form or theory of action, will the total aggregate liability of ElizaBAO or its officers, directors, 
                affiliates, partners, employees, shareholders, agents, successors, or assigns in connection with your use of the Platform for 
                any purpose exceed five hundred U.S. dollars ($500).
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-primary">8. Changes to this Agreement</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may revise this Agreement from time to time and will post the updated version with a &quot;last updated&quot; date on our 
                website or partner dashboard. Your continued use of the Platform after any changes take effect constitutes your 
                acceptance of the updated terms.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                ElizaBAO may also update, modify, or change any aspect of the ElizaBAO Platform (including, without limitation, its features, 
                functionality, content, or appearance) at any time, without prior notice.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                In the event of a conflict, a signed exhibit, attachment, or addendum prevails over these Agreement terms to the extent of such conflict.
              </p>
            </section>

            {/* Glossary */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-primary">Glossary of Terms</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-foreground font-bold">Term</th>
                      <th className="text-left py-3 px-4 text-foreground font-bold">Definition</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50 hover:bg-background/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">Affiliate Program Agreement</td>
                      <td className="py-3 px-4">A separate agreement between a Partner and a Client that sets forth the terms, conditions, and requirements applicable to the Partner&apos;s participation in that Client&apos;s Partner Program.</td>
                    </tr>
                    <tr className="border-b border-border/50 hover:bg-background/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">Client</td>
                      <td className="py-3 px-4">The owners, operators, leaders, or authorized representatives of Partner Programs.</td>
                    </tr>
                    <tr className="border-b border-border/50 hover:bg-background/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">Commissions</td>
                      <td className="py-3 px-4">Payments earned by Partners in connection with their participation in a Partner Program.</td>
                    </tr>
                    <tr className="border-b border-border/50 hover:bg-background/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">ElizaBAO</td>
                      <td className="py-3 px-4">Refers to ElizaBAO Technologies, also known as elizabao.xyz.</td>
                    </tr>
                    <tr className="border-b border-border/50 hover:bg-background/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">Partner</td>
                      <td className="py-3 px-4">An individual, consultant, or entity that promotes, refers, resells, or otherwise helps expand the reach or revenue of a Client&apos;s Partner Program.</td>
                    </tr>
                    <tr className="border-b border-border/50 hover:bg-background/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">Partner Dashboard</td>
                      <td className="py-3 px-4">The online interface provided by ElizaBAO through which Partners can view Partner Program information, track performance, and monitor payout statuses.</td>
                    </tr>
                    <tr className="border-b border-border/50 hover:bg-background/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">Partner Program</td>
                      <td className="py-3 px-4">A marketing, referral, reseller, or similar program offered by a Client through the Platform that allows Partners to earn Commissions or other rewards.</td>
                    </tr>
                    <tr className="border-b border-border/50 hover:bg-background/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">Payment Providers</td>
                      <td className="py-3 px-4">Third-party payment processors, such as Stripe Express (Stripe, Inc.) and PayPal (PayPal Holdings, Inc.), that process Commission payments to Partners.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Contact */}
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
          <p className="mb-2">Powered by <span className="text-primary text-glow">ElizaBAO</span></p>
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
