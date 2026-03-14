
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM as any;

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-emerald-600 hover:text-emerald-500 font-bold flex items-center">
            <i className="fas fa-arrow-left mr-2"></i> Back to Home
          </Link>
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Privacy Policy</h1>
        <div className="prose prose-emerald text-slate-600 space-y-6 font-medium leading-relaxed">
          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h2 className="text-xl font-black text-slate-800 mb-3 uppercase tracking-wide">1. Information We Collect</h2>
            <p>We collect essential personal information required to maintain your account and process earnings:</p>
            <ul className="list-disc ml-6 space-y-2 mt-2">
              <li><b>Identity Data:</b> Username and Email Address.</li>
              <li><b>Payment Data:</b> M-Pesa registered phone number for payouts.</li>
              <li><b>Transaction Metadata:</b> Timestamps and frequencies of your withdrawals to enforce platform safety policies (e.g., the 3-hour interval rule).</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-black text-slate-800 mb-3 uppercase tracking-wide">2. Use of Information</h2>
            <p>Your data is used exclusively to facilitate rewards, verify membership status, and process secure withdrawals. We use internal tracking to ensure adherence to our withdrawal frequency limits (2 per day) and to prevent system abuse.</p>
          </section>

          <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h2 className="text-xl font-black text-blue-800 mb-3 uppercase tracking-wide">3. Financial Transparency</h2>
            <p>Valuehub maintains an immutable ledger of all earnings and withdrawals associated with your account. This data is only accessible to you and our internal auditing team (Admin) to ensure accurate and timely payouts.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-800 mb-3 uppercase tracking-wide">4. Data Retention & Security</h2>
            <p>We implement advanced encryption and secure Firestore database protocols to protect your information. We do not sell or lease your personal data to third-party advertisers. Information is retained as long as your account is active to provide consistent earning history.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-800 mb-3 uppercase tracking-wide">5. Your Rights</h2>
            <p>You have the right to update your payment phone number through the secure Settings panel (subject to re-authentication) and to request an export of your earning history at any time through our support tickets.</p>
          </section>

          <div className="pt-8 border-t border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
