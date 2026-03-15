
import React, { useState } from 'react';
// Fix: Use namespace import to bypass environment-specific type resolution issues with named exports
import * as ReactRouterDOM from 'react-router-dom';
const { Link, useNavigate } = ReactRouterDOM as any;
import * as fbFirestore from 'firebase/firestore';
const { doc, updateDoc } = fbFirestore as any;
import { auth, db, signInWithEmailAndPassword } from '../../firebase';
import { APP_NAME } from '../../constants';
import { useToast } from '../../context/ToastContext';

const Login: React.FC = () => {
  const toast = useToast();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getFriendlyError = (code: string) => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Incorrect email or password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      default:
        return 'Sign in failed. Please check your details and try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCredential.user?.uid;

      if (uid) {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          lastLoginAt: Date.now()
        });
      }

      toast.success('Welcome back to Valuehub!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
      <div className="max-w-5xl w-full grid lg:grid-cols-2 glass rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-900/10 animate-slide-up">
        
        {/* Left Side: Branding / Visual */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-emerald-600 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-12">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-lg">
                <i className="fas fa-chart-line text-lg"></i>
              </div>
              <span className="text-2xl font-black tracking-tighter uppercase">{APP_NAME}</span>
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Start earning with <br /> every click.
            </h1>
            <p className="text-emerald-50 text-lg opacity-90 max-w-sm">
              The premium destination for multi-level rewards, surveys, and passive income.
            </p>
          </div>
          
          <div className="relative z-10">
            <div className="flex -space-x-3 mb-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-emerald-600 bg-emerald-100 flex items-center justify-center text-emerald-800 text-xs font-bold">
                  <i className="fas fa-user"></i>
                </div>
              ))}
              <div className="h-10 px-4 rounded-full border-2 border-emerald-600 bg-emerald-700 flex items-center text-xs font-bold">
                +1,200 active members
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-64 h-64 bg-teal-400 rounded-full blur-3xl opacity-30"></div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 lg:p-16 flex flex-col justify-center bg-white">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500 font-medium">Please enter your details to continue.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="group">
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 transition-all group-focus-within:text-emerald-600">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <i className="fas fa-envelope"></i>
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder-slate-400"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="group">
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-sm font-bold text-slate-700 transition-all group-focus-within:text-emerald-600">Password</label>
                <Link to="/forgot-password" size="sm" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">Forgot password?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <i className="fas fa-key"></i>
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder-slate-400"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 hover:shadow-emerald-300 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Log in to Account</span>
                  <i className="fas fa-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-500 font-medium">
              New to Valuehub?{' '}
              <Link to="/signup" className="text-emerald-600 font-black hover:text-emerald-700 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
