
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM as any;

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-emerald-600 hover:text-emerald-500 font-bold flex items-center">
            <i className="fas fa-arrow-left mr-2"></i> Back to Home
          </Link>
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Terms and Conditions</h1>
        <div className="prose prose-emerald text-slate-600 space-y-6 font-medium leading-relaxed">
          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h2 className="text-xl font-black text-slate-800 mb-3 uppercase tracking-wide">1. Platform Membership</h2>
            <p>Welcome to Valuehub. By creating an account and paying the activation fee, you agree to comply with and be bound by the following terms and conditions. The platform is designed for registered users who wish to participate in our referral and task-based earning ecosystem.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-black text-slate-800 mb-3 uppercase tracking-wide">2. Membership Fee</h2>
            <p>To access the Valuehub platform and referral system, a <b>one-time non-refundable activation fee</b> of Ksh 250 is required. This fee covers platform maintenance, server costs, and secure account initialization. This fee cannot be refunded under any circumstances once the account has been activated.</p>
          </section>

          <section className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
            <h2 className="text-xl font-black text-emerald-800 mb-3 uppercase tracking-wide">3. Withdrawal Policy</h2>
            <p>Valuehub implements a secure and fair payout policy to ensure platform stability:</p>
            <ul className="list-disc ml-6 space-y-2 mt-3 text-slate-700">
              <li><b>Minimum Payout:</b> The minimum amount required for a withdrawal request is Ksh 50.</li>
              <li><b>Daily Frequency:</b> Members are allowed a maximum of <b>two (2) withdrawal requests</b> per 24-hour cycle.</li>
              <li><b>Time Interval:</b> There must be a minimum gap of <b>three (3) hours</b> between consecutive withdrawal requests.</li>
              <li><b>Processing Time:</b> Payouts are manually verified and typically processed via M-Pesa within 24-48 hours.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-800 mb-3 uppercase tracking-wide">4. Referral System & Integrity</h2>
            <p>Valuehub operates a multi-level reward system. Fraudulent activities, including but not limited to creating self-referral accounts, using bots, or attempting to bypass platform security, will result in immediate permanent suspension without a refund of the activation fee.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-800 mb-3 uppercase tracking-wide">5. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at our sole discretion for conduct that we believe violates these Terms, is harmful to other users, or compromises the business interests of Valuehub.</p>
          </section>

          <div className="pt-8 border-t border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
