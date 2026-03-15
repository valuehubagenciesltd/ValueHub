
import React, { useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { Link, useLocation } = ReactRouterDOM as any;

const Privacy: React.FC = () => {
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

        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-6">By using Valuehub you agree to this policy. We may update it from time to time; continued use after changes means you accept the updated policy.</p>

        <div className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <h2 className="text-xl font-black text-slate-800 mb-3">Table of Contents</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {[1,2,3,4,5,6,7,8,9,10,11,12,13,14].map((n) => (
              <a key={n} href={`#section-${n}`} onClick={(e) => scrollTo(e, `section-${n}`)} className="text-emerald-600 hover:text-emerald-700 font-medium">
                {n}. {['Information We Collect','How We Use It','Financial Data & Withdrawals','Data Retention','Security','Sharing & Third Parties','Cookies & Technical Data','Your Rights','Children\'s Privacy','International & Backup','Breach & Incidents','Dispute & Law','Policy Updates','Contact & Acknowledgment'][n-1]}
              </a>
            ))}
          </div>
        </div>

        <div className="mb-10 bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
          <h2 className="text-xl font-black text-emerald-800 mb-2">Executive Summary</h2>
          <p className="text-slate-700 leading-relaxed">
            This Privacy Policy explains how Valuehub collects, uses, stores, and protects your personal information. We use data to operate the platform, process earnings and withdrawals, prevent fraud, comply with law, and improve our services. We do not sell your personal data to third-party advertisers. We may update this policy; your continued use constitutes acceptance. For questions, contact us at contact@valuehub.dev (see Section 14).
          </p>
        </div>

        <div className="prose prose-emerald max-w-none text-slate-600 space-y-8 font-medium leading-relaxed">
          <section id="section-1" className="bg-slate-50 p-6 rounded-2xl border border-slate-200 scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">1. Information We Collect</h2>
            <p className="mb-4">We collect information necessary to run your account, process payments, enforce rules, and comply with applicable law.</p>
            <h3 className="text-lg font-bold text-slate-700 mb-2">1.1 Account & Identity</h3>
            <ul className="list-disc ml-6 space-y-1 mb-4">
              <li><b>Username, email, and display name</b> as provided during registration or later in settings.</li>
              <li><b>Phone number</b> (M-Pesa number) for receiving payouts and for account recovery where applicable.</li>
              <li><b>Profile and referral data</b> such as invite code and referral links you use.</li>
            </ul>
            <h3 className="text-lg font-bold text-slate-700 mb-2">1.2 Financial & Transaction Data</h3>
            <ul className="list-disc ml-6 space-y-1 mb-4">
              <li><b>Earnings, bonuses, and balance</b> — full record of all credits and debits on your account.</li>
              <li><b>Withdrawal requests and history</b> — amounts, timestamps, status, and any notes used for admin verification.</li>
              <li><b>Payment provider details</b> — M-Pesa and any other payment identifiers used to send or receive funds.</li>
            </ul>
            <h3 className="text-lg font-bold text-slate-700 mb-2">1.3 Technical & Usage Data</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li><b>Device and browser information</b> — IP address, device type, operating system, and browser type to ensure security and compatibility.</li>
              <li><b>Logs and timestamps</b> — when you log in, request withdrawals, or perform key actions, to enforce limits (e.g. 2 withdrawals per day, 3-hour interval) and detect abuse.</li>
              <li><b>General location data</b> — country or region where necessary for compliance or fraud prevention.</li>
            </ul>
          </section>

          <section id="section-2" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">2. How We Use Your Information</h2>
            <p className="mb-4">We use your data for the following purposes:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><b>Account and services:</b> To create and maintain your account, show your balance and history, and process withdrawal requests (including applicable fees and minimums as shown in the app).</li>
              <li><b>Verification and security:</b> To verify your identity where needed for payouts, to enforce withdrawal limits and cooling periods, and to detect and prevent fraud, abuse, and money laundering.</li>
              <li><b>Legal and regulatory:</b> To comply with applicable law, respond to lawful requests from authorities, and maintain records as required (e.g. tax, financial regulations).</li>
              <li><b>Improvement and analytics:</b> To improve the platform, fix issues, and perform analytics using aggregated or anonymized data. We do not sell your personal data to third-party advertisers.</li>
              <li><b>Communications:</b> To send you service-related messages (e.g. withdrawal status) and, where you have opted in, marketing or promotional messages. You can opt out at any time.</li>
            </ul>
          </section>

          <section id="section-3" className="bg-blue-50 p-6 rounded-2xl border border-blue-200 scroll-mt-24">
            <h2 className="text-2xl font-black text-blue-800 mb-4 uppercase tracking-wide">3. Financial Data & Withdrawals</h2>
            <p className="mb-4">We keep a full record of your earnings, withdrawals, and any fees. This is visible to you in your account and to our admin team for verification and processing payouts. Withdrawal rules — including minimum amount, fees, and frequency limits — are as displayed in the app and may be changed by Valuehub at any time. M-Pesa and other payment providers have their own terms and privacy policies; we are not responsible for their practices.</p>
            <p className="text-sm text-blue-900">We may share financial and identity data with payment processors and with regulators or law enforcement when required by law.</p>
          </section>

          <section id="section-4" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">4. Data Retention</h2>
            <p className="mb-4">We retain your information for as long as your account is active and as required by law (e.g. tax and financial records often require several years). After account closure, we may retain data for legal, regulatory, or legitimate business reasons, including dispute resolution and audit. Anonymized or aggregated data may be retained and used indefinitely for analytics and improvement. We are not obliged to retain or provide copies of data beyond the periods required by law or our internal policies.</p>
          </section>

          <section id="section-5" className="bg-slate-50 p-6 rounded-2xl border border-slate-200 scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">5. Security</h2>
            <p className="mb-4">We use technical and organizational measures (including encryption, access controls, and secure infrastructure) to protect your data. No system is completely secure; we are not liable for unauthorized access, loss, or misuse of data arising from circumstances beyond our reasonable control, including third-party or user conduct. You are responsible for keeping your login credentials and device secure.</p>
          </section>

          <section id="section-6" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">6. Sharing & Third Parties</h2>
            <p className="mb-4">We share data only as described below:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><b>Service providers:</b> With hosting, payment, and other providers necessary to operate the platform, under agreements that require appropriate security and compliance with applicable law.</li>
              <li><b>Legal and safety:</b> When required by law, court order, or government request, or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.</li>
              <li><b>Business transfers:</b> In connection with a merger, sale of assets, or restructuring, subject to the same privacy commitments where practicable.</li>
            </ul>
            <p className="mt-4">We do not sell your personal data to third-party advertisers. We are not responsible for the privacy practices of third parties once data has been shared in line with this policy.</p>
          </section>

          <section id="section-7" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">7. Cookies & Technical Data</h2>
            <p className="mb-4">We and our service providers may use cookies, local storage, and similar technologies to maintain your session, remember preferences, and analyze how the platform is used. This helps us secure the service and improve it. You can control cookies through your browser settings; disabling them may affect some features. We may also collect technical data such as IP address, device type, and log data as described in Section 1.3.</p>
          </section>

          <section id="section-8" className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 scroll-mt-24">
            <h2 className="text-2xl font-black text-emerald-800 mb-4 uppercase tracking-wide">8. Your Rights</h2>
            <p className="mb-4">You can update your payment phone and other profile information in Settings (subject to re-verification where we require it). You may request access to, correction of, or deletion of your personal data, or object to certain processing, where required by applicable law (e.g. under the Data Protection Act 2019 in Kenya). We will respond within the timeframe required by law. We may require proof of identity and may refuse or charge a reasonable fee for manifestly unfounded or repetitive requests where permitted. To exercise your rights, contact us at contact@valuehub.dev (Section 14). You also have the right to lodge a complaint with the Office of the Data Protection Commissioner (ODPC) in Kenya if you believe your rights have been violated.</p>
          </section>

          <section id="section-9" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">9. Children&apos;s Privacy</h2>
            <p className="mb-4">Valuehub is not intended for users under 18. We do not knowingly collect personal data from anyone under 18. If we learn that we have collected data from a minor, we will take steps to delete it. If you believe a minor has provided us data, please contact us.</p>
          </section>

          <section id="section-10" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">10. International Transfers & Backup</h2>
            <p className="mb-4">Your data may be stored or processed in Kenya or in other countries where our service providers operate. We ensure appropriate safeguards (e.g. contracts, compliance with applicable law) when transferring data. Backups and infrastructure may involve cross-border transfer; by using the platform you consent to such transfer as described in this policy.</p>
          </section>

          <section id="section-11" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">11. Data Breaches & Incidents</h2>
            <p className="mb-4">In the event of a data breach that affects your personal data, we will take steps to contain the incident and will notify the Office of the Data Protection Commissioner and affected users as required by applicable law. Beyond our obligations under law, Valuehub shall not be liable for unauthorized access, loss, or misuse of data arising from circumstances beyond our reasonable control.</p>
          </section>

          <section id="section-12" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">12. Dispute Resolution & Governing Law</h2>
            <p className="mb-4">Any dispute arising from this Privacy Policy or our handling of your data shall be governed by the laws of the Republic of Kenya. You agree to the exclusive jurisdiction of the courts of Nairobi, Kenya. You may contact us at contact@valuehub.dev (Section 14) before pursuing any legal action. Where permitted, we may elect to resolve disputes by binding arbitration in Nairobi.</p>
          </section>

          <section id="section-13" className="p-6 border border-slate-200 rounded-2xl scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">13. Changes to This Policy</h2>
            <p className="mb-4">Valuehub may update this Privacy Policy at any time to reflect changes in law, our practices, or business needs. We will notify you of material changes via the app, email, or SMS where reasonable. Your continued use of the platform after the effective date of any change constitutes your acceptance of the updated policy. If you do not agree, you must stop using the service. We are not obliged to retain or supply previous versions of this policy indefinitely.</p>
          </section>

          <section id="section-14" className="bg-slate-50 p-6 rounded-2xl border border-slate-200 scroll-mt-24">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-wide">14. Contact & Acknowledgment</h2>
            <p className="mb-4">For privacy questions, data requests, or complaints, contact:</p>
            <ul className="list-disc ml-6 space-y-1 mb-4">
              <li><b>Contact:</b> contact@valuehub.dev (support, data requests, and legal enquiries; or use in-app support)</li>
            </ul>
            <p className="mb-4">By using Valuehub, you acknowledge that you have read and understood this Privacy Policy, consent to the collection, use, and sharing of your data as described (including for business, analytics, and security purposes), and agree that we may update this policy and that your continued use constitutes acceptance. You confirm that you are at least 18 years old where required. Valuehub is not responsible for the privacy practices of M-Pesa or other third-party services.</p>
            <div className="pt-4 border-t border-slate-200 text-sm text-slate-500">
              Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · Valuehub
            </div>
          </section>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          © Valuehub. All rights reserved. This Privacy Policy is part of your agreement with Valuehub.
        </div>
      </div>
    </div>
  );
};

export default Privacy;
