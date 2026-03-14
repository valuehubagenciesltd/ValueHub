
import React, { useState } from 'react';
// Fix: Use namespace import to bypass environment-specific type resolution issues with named exports
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM as any;
import { getFunctions, httpsCallable } from '../../firebase';
import { APP_NAME } from '../../constants';
import { useToast } from '../../context/ToastContext';

type Step = 'email' | 'code' | 'success';

const ForgotPassword: React.FC = () => {
  const toast = useToast();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const getFriendlyError = (codeOrMessage: string) => {
    switch (codeOrMessage) {
      case 'not-found': return "We couldn't find an account with that email address.";
      case 'invalid-argument': return 'Please check your input and try again.';
      case 'resource-exhausted': return 'Please wait a few minutes before requesting another code.';
      case 'failed-precondition': return 'Code has expired. Please request a new one.';
      default: return codeOrMessage || 'Something went wrong. Please try again later.';
    }
  };

  const requestCode = httpsCallable(getFunctions(), 'requestPasswordResetCode');
  const verifyAndSetPassword = httpsCallable(getFunctions(), 'verifyResetCodeAndSetPassword');

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await requestCode({ email: email.trim().toLowerCase() }) as { data?: { success?: boolean; error?: string } };
      if (result.data?.success) {
        setStep('code');
        toast.success('A 6-digit code was sent to your email.');
      } else {
        toast.error(getFriendlyError(result.data?.error || 'not-found'));
      }
    } catch (err: any) {
      console.error('Request code error:', err);
      const msg = err?.message || err?.code || 'Request failed';
      toast.error(getFriendlyError(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await verifyAndSetPassword({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword,
      });
      setStep('success');
      toast.success('Password updated. You can sign in now.');
    } catch (err: any) {
      console.error('Verify error:', err);
      const msg = err?.message || err?.code || 'Update failed';
      toast.error(getFriendlyError(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
      <div className="max-w-5xl w-full grid lg:grid-cols-2 glass rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-900/10 animate-slide-up">
        
        {/* Left Side: Visual */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-emerald-600 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-12">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-lg">
                <i className="fas fa-chart-line"></i>
              </div>
              <span className="text-2xl font-black tracking-tighter uppercase">{APP_NAME}</span>
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Recover your <br /> access.
            </h1>
            <p className="text-emerald-50 text-lg opacity-90 max-w-sm">
              Don't worry, it happens to the best of us. We'll send you a 6-digit code to reset your password.
            </p>
          </div>
          
          <div className="relative z-10">
            <div className="p-6 bg-emerald-700/50 rounded-2xl border border-emerald-500/30 backdrop-blur-md">
              <div className="flex items-center space-x-3 text-emerald-200 mb-2">
                <i className="fas fa-shield-halved"></i>
                <span className="text-xs font-bold uppercase tracking-widest">Secure Recovery</span>
              </div>
              <p className="text-sm opacity-80">Enter the 6-digit code we send to your email, then set a new password.</p>
            </div>
          </div>

          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-64 h-64 bg-teal-400 rounded-full blur-3xl opacity-30"></div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 lg:p-16 flex flex-col justify-center bg-white/40">
          {step === 'email' && (
            <div className="animate-slide-up">
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Password Reset</h2>
                <p className="text-slate-500 font-medium">Enter your registered email. We'll send a 6-digit code.</p>
              </div>

              <form className="space-y-6" onSubmit={handleRequestCode}>
                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 transition-all group-focus-within:text-emerald-600">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                      <i className="fas fa-envelope"></i>
                    </div>
                    <input
                      type="email"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder-slate-400"
                      placeholder="name@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Send 6-digit code</span>
                      <i className="fas fa-paper-plane"></i>
                    </>
                  )}
                </button>

                <div className="text-center pt-4">
                  <Link to="/login" className="text-emerald-600 font-black hover:text-emerald-700 transition-colors flex items-center justify-center space-x-2">
                    <i className="fas fa-arrow-left text-xs"></i>
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </form>
            </div>
          )}

          {step === 'code' && (
            <div className="animate-slide-up">
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Enter code & new password</h2>
                <p className="text-slate-500 font-medium">We sent a 6-digit code to <strong className="text-slate-900">{email}</strong>. Enter it below and choose a new password.</p>
              </div>

              <form className="space-y-6" onSubmit={handleVerifyAndSetPassword}>
                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 transition-all group-focus-within:text-emerald-600">6-digit code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                      <i className="fas fa-key"></i>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder-slate-400 tracking-[0.5em] text-center text-xl"
                      placeholder="000000"
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">New password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full px-4 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder-slate-400"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Confirm new password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full px-4 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder-slate-400"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Reset password</span>
                      <i className="fas fa-check"></i>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-slate-500 text-sm font-medium hover:text-slate-700"
                  >
                    Use a different email
                  </button>
                  <Link to="/login" className="text-emerald-600 font-black hover:text-emerald-700 text-sm">
                    Back to Sign In
                  </Link>
                </div>
              </form>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center animate-slide-up">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 scale-110 shadow-lg shadow-emerald-100 text-emerald-600">
                <i className="fas fa-check-circle text-4xl"></i>
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Password updated</h2>
              <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">
                Your password has been changed. You can now sign in with your new password.
              </p>
              <Link to="/login" className="inline-flex items-center justify-center py-4 px-8 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-95 shadow-xl">
                Return to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
