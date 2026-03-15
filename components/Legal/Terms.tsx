
import React, { useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { Link, useLocation } = ReactRouterDOM as any;

const Terms: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location]);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    window.history.pushState(null, '', `#${id}`);
  };

  const tocTitles = [
    'Platform Membership',
    'Membership & Activation Fee',
    'Withdrawal Policy',
    'Referral System & Integrity',
    'Acceptable Use',
    'Account Security',
    'Termination',
    'Changes to Terms & Fees',
    'Disclaimer of Warranties',
    'Limitation of Liability',
    'Indemnification',
    'Tax & Legal Compliance',
    'Dispute Resolution & Law',
    'Contact & Acknowledgment'
  ];

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-emerald-600 hover:text-emerald-500 font-bold flex items-center">
            <i className="fas fa-arrow-left mr-2"></i> Back to Home
          </Link>
        </div>

        <div className="mb-6 h-2 w-full flex rounded overflow-hidden">
          <div className="flex-1 bg-black"></div>
          <div className="flex-1 bg-red-600"></div>
          <div className="flex-1 bg-green-600"></div>
        </div>

        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Terms and Conditions</h1>
        <p className="text-slate-500 text-sm mb-6">By creating an account and using Valuehub you agree to these terms. We may update them from time to time; continued use after changes means you accept the updated terms.</p>

        <div className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <h2 className="text-xl font-black text-slate-800 mb-3">Table of Contents</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {tocTitles.map((title, i) => (
              <a key={i} href={`#section-${i + 1}`} onClick={(e) => scrollTo(e, `section-${i + 1}`)} className="text-emerald-600 hover:text-emerald-700 font-medium">
                {i + 1}. {title}
              </a>
            ))}
          </div>
        </div>

        <div className="mb-10 bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
          <h2 className="text-xl font-black text-emerald-800 mb-2">Executive Summary</h2>
          <p className="text-slate-700 leading-relaxed">
            These Terms and Conditions govern your use of the Valuehub platform. By registering and paying the activation fee, you agree to participate in our referral and task-based earning ecosystem under these rules. Key points: the activation fee is non-refundable; withdrawal minimums and fees apply as shown in the app and may change; you must not abuse the referral system or engage in fraud; we may suspend or terminate accounts at our discretion; the service is provided &quot;as is&quot; and our liability is limited. For full details and your rights and obligations, read the sections below. For questions, see Section 14.
          </p>
        </div>

        <div className="prose prose-emerald max-w-none text-slate-600 space-y-8 font-medium leading-relaxed">
          <section id="section-1" className="bg-slate-50 p-6 rounded-2xl border border-slate-200 scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">1. Platform Membership</h2>
            <p className="mb-4">Welcome to Valuehub. By creating an account and paying the activation fee, you agree to comply with and be bound by these Terms and Conditions. The platform is designed for registered users who wish to participate in our referral and task-based earning ecosystem.</p>
            <h3 className="text-lg font-bold text-slate-700 mb-2">1.1 Eligibility</h3>
            <p className="mb-4">You must be at least 18 years old and have the legal capacity to enter into a binding agreement. You must provide accurate and complete information when registering and keep your account details up to date. You may only hold one account unless we expressly permit otherwise.</p>
            <h3 className="text-lg font-bold text-slate-700 mb-2">1.2 Account Responsibility</h3>
            <p>You are responsible for all activity under your account. You must not share your login credentials or allow others to use your account. Notify us promptly if you suspect unauthorized access.</p>
          </section>

          <section id="section-2" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">2. Membership & Activation Fee</h2>
            <p className="mb-4">To access the Valuehub platform and referral system, a <b>one-time non-refundable activation fee</b> (amount as displayed at the time of registration) is required. This fee covers platform maintenance, server costs, and secure account initialization.</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>The activation fee <b>cannot be refunded</b> under any circumstances once the account has been activated, except where required by applicable law.</li>
              <li>Valuehub may change the activation fee at any time for new registrations; the fee applicable to you is the one displayed when you complete registration.</li>
              <li>Payment of the activation fee does not guarantee any minimum level of earnings or availability of specific features; the platform and its offerings may change as set out in these Terms.</li>
            </ul>
          </section>

          <section id="section-3" className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 scroll-mt-24">
            <h2 className="text-2xl font-black text-emerald-800 mb-4 uppercase tracking-wide">3. Withdrawal Policy</h2>
            <p className="mb-4">Valuehub implements a secure and fair payout policy to ensure platform stability. The following rules apply; they are also reflected in our Privacy Policy where they involve use of your data.</p>
            <h3 className="text-lg font-bold text-emerald-800 mb-2">3.1 Minimums &amp; Fees</h3>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li><b>Minimum Payout:</b> The minimum amount required for a withdrawal request is as displayed in the app (e.g. Ksh 380 or such higher amount as Valuehub may set from time to time).</li>
              <li><b>Fees:</b> Withdrawal transaction and maintenance fees apply as displayed at the time of request. Fees and minimums may be changed by Valuehub at any time; the rates in effect at the time of your request apply to that request.</li>
            </ul>
            <h3 className="text-lg font-bold text-emerald-800 mb-2">3.2 Frequency &amp; Timing</h3>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li><b>Daily Frequency:</b> Members are allowed a maximum of <b>two (2) withdrawal requests</b> per 24-hour cycle.</li>
              <li><b>Time Interval:</b> There must be a minimum gap of <b>three (3) hours</b> between consecutive withdrawal requests. Valuehub may change these limits at any time.</li>
            </ul>
            <h3 className="text-lg font-bold text-emerald-800 mb-2">3.3 Processing</h3>
            <p>Payouts are subject to manual verification. We aim to process requests in a reasonable time but do not guarantee any specific timeframe. Delays may occur due to volume, verification requirements, or third-party (e.g. M-Pesa) constraints. We are not responsible for delays or failures caused by payment providers or circumstances beyond our control.</p>
          </section>

          <section id="section-4" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">4. Referral System &amp; Integrity</h2>
            <p className="mb-4">Valuehub operates a multi-level reward system. You must use it fairly and in accordance with these Terms and any additional guidelines we publish.</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><b>Fraud:</b> Fraudulent activities, including but not limited to creating self-referral accounts, using bots, fake identities, or attempting to bypass platform security or limits, will result in immediate permanent suspension without a refund of the activation fee.</li>
              <li><b>Abuse:</b> We may suspend or terminate accounts that we reasonably believe are abusing the referral system, manipulating earnings, or harming other users or the platform.</li>
              <li><b>No guarantee:</b> We do not guarantee that referral or other rewards will remain available at current levels; we may modify reward structures, eligibility, or caps at any time.</li>
            </ul>
          </section>

          <section id="section-5" className="bg-slate-50 p-6 rounded-2xl border border-slate-200 scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">5. Acceptable Use</h2>
            <p className="mb-4">You agree to use the platform only for lawful purposes and in accordance with these Terms. You must not:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Use the platform in any way that violates applicable law or the rights of others.</li>
              <li>Attempt to gain unauthorized access to our systems, other accounts, or any data not intended for you.</li>
              <li>Transmit malware, spam, or any content that could harm the platform or its users.</li>
              <li>Interfere with or disrupt the platform, its infrastructure, or the experience of other users.</li>
              <li>Use automated means (e.g. bots, scrapers) except where we expressly permit.</li>
              <li>Impersonate Valuehub, our staff, or any other person or entity.</li>
            </ul>
            <p className="mt-4">Breach of acceptable use may result in suspension or termination of your account and, where appropriate, referral to authorities.</p>
          </section>

          <section id="section-6" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">6. Account Security</h2>
            <p className="mb-4">You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. You must notify us promptly of any unauthorized access or suspected security breach. We may require you to verify your identity or take additional security steps (e.g. re-verification of your payment number) where we reasonably consider it necessary for security or fraud prevention. We are not liable for losses arising from unauthorized use of your account due to your failure to keep credentials secure or to notify us in time.</p>
          </section>

          <section id="section-7" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">7. Termination</h2>
            <p className="mb-4">Valuehub reserves the right to suspend or terminate your account at any time, with or without cause or notice, at our sole discretion. Grounds include but are not limited to: violation of these Terms, fraud, abuse, harm to other users or the platform, or for any business, operational, or legal reason.</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Upon termination, you are not entitled to a refund of the activation fee or any unused balance unless required by applicable law.</li>
              <li>We may also modify, limit, or discontinue any feature or service at any time. If we discontinue a material part of the service, we will use reasonable efforts to notify you in advance where practicable.</li>
              <li>You may stop using the platform at any time. Closure of your account does not entitle you to a refund of fees already paid.</li>
            </ul>
          </section>

          <section id="section-8" className="bg-slate-50 p-6 rounded-2xl border border-slate-200 scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">8. Changes to Terms, Fees &amp; Policies</h2>
            <p className="mb-4">Valuehub may update these Terms, fees (including activation fee, withdrawal fees, and minimum withdrawal amounts), withdrawal limits, and other policies at any time. We will use reasonable means to notify you of material changes (e.g. in-app notice, email, or SMS). Your continued use of the platform after the effective date of changes constitutes acceptance. If you do not agree, you must stop using the service and may request account closure; no refund of the activation fee will be made. We recommend that you review these Terms and in-app policies periodically.</p>
          </section>

          <section id="section-9" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">9. Disclaimer of Warranties</h2>
            <p className="mb-4">The Valuehub platform and all services are provided <b>&quot;as is&quot;</b> and <b>&quot;as available&quot;</b> without warranties of any kind, express or implied. To the fullest extent permitted by law, we disclaim all warranties, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
            <p className="mb-4">We do not warrant that the service will be uninterrupted, error-free, or secure, or that payouts will be completed within any specific time frame. We are not responsible for delays or failures due to M-Pesa, networks, third-party providers, or circumstances beyond our control. No advice or information from Valuehub, whether oral or written, shall create any warranty not expressly stated in these Terms.</p>
          </section>

          <section id="section-10" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">10. Limitation of Liability</h2>
            <p className="mb-4">To the fullest extent permitted by applicable law, Valuehub, its owners, operators, affiliates, and their respective officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, revenue, data, goodwill, or other intangible losses, arising from or in connection with your use of the platform or these Terms.</p>
            <p className="mb-4">Our total liability for any claim related to the service or these Terms shall not exceed the amount you have paid to Valuehub in fees in the twelve (12) months preceding the claim, or Ksh 1,000, whichever is less. These limitations apply even if we have been advised of the possibility of such damages and whether the claim is based in contract, tort, negligence, strict liability, or otherwise. Some jurisdictions do not allow certain limitations; in such cases our liability will be limited to the maximum extent permitted by law.</p>
          </section>

          <section id="section-11" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">11. Indemnification</h2>
            <p className="mb-4">You agree to indemnify, defend, and hold harmless Valuehub, its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, losses, costs, liabilities, and expenses (including reasonable legal fees) arising from or related to: your use of the platform; your breach of these Terms; your violation of any law or third-party rights; or any dispute between you and another user or third party. We reserve the right to assume the exclusive defense and control of any matter subject to indemnification by you, at your expense.</p>
          </section>

          <section id="section-12" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">12. Tax &amp; Legal Compliance</h2>
            <p className="mb-4">You are solely responsible for declaring and paying any taxes due on your earnings from Valuehub in your jurisdiction. We may report information to the Kenya Revenue Authority or other authorities as required by law. Failure to comply with tax or other legal obligations is your responsibility and may result in account suspension or termination. We do not provide tax advice; you should consult your own advisor if needed.</p>
          </section>

          <section id="section-13" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">13. Dispute Resolution &amp; Governing Law</h2>
            <p className="mb-4">Any dispute arising from these Terms or your use of Valuehub shall be governed by the laws of the Republic of Kenya, without regard to its conflict of law principles. You agree that the courts of Nairobi, Kenya shall have exclusive jurisdiction over any such dispute.</p>
            <p className="mb-4">Where permitted, you agree to attempt good-faith resolution through our support channel (contact@valuehub.dev or in-app support) before pursuing legal action. Valuehub may elect to resolve certain disputes by binding arbitration in Nairobi under applicable Kenyan arbitration rules; in that case the arbitrator&apos;s decision shall be final and binding.</p>
          </section>

          <section id="section-14" className="bg-slate-50 p-6 rounded-2xl border border-slate-200 scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">14. Contact &amp; Acknowledgment</h2>
            <p className="mb-4">For questions about these Terms, contact us at:</p>
            <ul className="list-disc ml-6 space-y-1 mb-4">
              <li><b>Contact:</b> contact@valuehub.dev (or in-app support)</li>
            </ul>
            <p className="mb-4">By using Valuehub, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions and by our Privacy Policy. You confirm that you are at least 18 years old (or the age of majority in your jurisdiction), that you will comply with all applicable laws, and that the information you provide is accurate. You agree that we may update these Terms and that your continued use constitutes acceptance of the updated terms. If any provision of these Terms is held invalid or unenforceable, the remaining provisions will remain in effect. These Terms, together with the Privacy Policy and any other policies we reference, constitute the entire agreement between you and Valuehub regarding the platform.</p>
            <div className="pt-4 border-t border-slate-200 text-sm text-slate-500">
              Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · Valuehub
            </div>
          </section>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          © Valuehub. All rights reserved. These Terms and Conditions are part of your agreement with Valuehub.
        </div>
      </div>
    </div>
  );
};

export default Terms;
