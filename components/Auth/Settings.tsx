
import React, { useState } from 'react';
import { auth, db, getFunctions, httpsCallable } from '../../firebase';
import { useToast } from '../../context/ToastContext';
import * as fbAuth from 'firebase/auth';
const { 
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider
} = fbAuth as any;

import * as fbFirestore from 'firebase/firestore';
const { doc, updateDoc, addDoc, collection } = fbFirestore as any;
import { User } from '../../types';
import { getRoleDisplayLabel } from '../../constants';

interface SettingsProps {
  user: User;
}

const Settings: React.FC<SettingsProps> = ({ user }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'support'>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Re-authentication Modal State
  const [isReauthOpen, setIsReauthOpen] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [pendingPhone, setPendingPhone] = useState(user.phoneNumber);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Security Form States
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Support Form State
  const [supportForm, setSupportForm] = useState({
    category: 'Technical',
    message: ''
  });

  const handleReauthAndSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error('Session invalid');
      
      const credential = EmailAuthProvider.credential(currentUser.email, reauthPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      await updateDoc(doc(db, 'users', user.id), {
        phoneNumber: pendingPhone,
        lastProfileUpdate: Date.now(),
      });
      try {
        const sendNotification = httpsCallable(getFunctions(), 'sendActivityNotification');
        await sendNotification({
          type: 'phone_changed',
          email: user.email,
          phoneNumber: pendingPhone,
        });
      } catch (_err) {}
      toast.success('Phone number updated successfully! A confirmation has been sent to your email.');
      setIsReauthOpen(false);
      setIsEditingPhone(false);
      setReauthPassword('');
    } catch (err: any) {
      toast.error(err.code === 'auth/wrong-password' ? 'Incorrect password. Authorization failed.' : 'Failed to verify identity.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsUpdating(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error('Session invalid');
      const credential = EmailAuthProvider.credential(currentUser.email, passwordForm.oldPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwordForm.newPassword);
      await updateDoc(doc(db, 'users', user.id), { lastPasswordUpdate: Date.now() });
      try {
        const sendNotification = httpsCallable(getFunctions(), 'sendActivityNotification');
        await sendNotification({ type: 'password_changed', email: user.email });
      } catch (_err) {}
      toast.success('Password updated successfully!');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err: any) {
      toast.error(err.code === 'auth/wrong-password' ? 'Incorrect current password' : 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    if (user.lastSupportTicketAt && (now - user.lastSupportTicketAt < oneHour)) {
      const remaining = Math.ceil((oneHour - (now - user.lastSupportTicketAt)) / (60 * 1000));
      toast.warning(`Please wait ${remaining} minutes before sending another request.`);
      return;
    }
    if (supportForm.message.trim().length < 10) {
      toast.error('Message too short');
      return;
    }

    setIsUpdating(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        userId: user.id,
        username: user.username,
        email: user.email,
        phone: user.phoneNumber,
        category: supportForm.category,
        message: supportForm.message,
        timestamp: now,
        status: 'OPEN',
      });
      await updateDoc(doc(db, 'users', user.id), { lastSupportTicketAt: now });
      try {
        const sendNotification = httpsCallable(getFunctions(), 'sendActivityNotification');
        await sendNotification({
          type: 'support_submitted',
          email: user.email,
          category: supportForm.category,
        });
      } catch (_err) {}
      toast.success('Support ticket sent! Check your email for confirmation.');
      setSupportForm({ ...supportForm, message: '' });
    } catch (err) {
      toast.error('Failed to send ticket.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-slide-up relative">
      
      {/* Re-authentication Glassmorphism Overlay */}
      {isReauthOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-all"></div>
          <div className="relative glass bg-white/70 border border-white/50 rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full animate-slide-up">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl mb-4 shadow-xl shadow-emerald-200">
                <i className="fas fa-shield-check"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Verify Ownership</h3>
              <p className="text-slate-500 text-sm font-medium mt-2">
                Updating your payment phone is a sensitive action. Please enter your account password to continue.
              </p>
            </div>

            <form onSubmit={handleReauthAndSavePhone} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Password</label>
                <input 
                  type="password"
                  required
                  autoFocus
                  className="w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900"
                  placeholder="••••••••"
                  value={reauthPassword}
                  onChange={e => setReauthPassword(e.target.value)}
                />
              </div>

              <div className="flex flex-col space-y-3">
                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isUpdating ? 'Verifying...' : 'Authorize Update'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsReauthOpen(false)}
                  className="w-full py-4 bg-slate-200/50 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Header with Integrated Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
          <p className="text-slate-500 font-medium">Manage security and preferences.</p>
        </div>
        <div className="flex mt-6 md:mt-0 bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5 self-start">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            Profile
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            Security
          </button>
          <button 
            onClick={() => setActiveTab('support')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'support' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            Support
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {activeTab === 'profile' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 space-y-10 animate-slide-up">
            <div className="flex items-center space-x-6 pb-8 border-b border-slate-50">
              <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-4xl text-emerald-600 shadow-inner">
                <i className="fas fa-id-card"></i>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{user.username}</h3>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-emerald-700 text-[10px] font-black uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                    {getRoleDisplayLabel(user.role)}
                  </span>
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    Verified ID
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-100 transition-colors">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">System Email</span>
                <div className="font-black text-lg text-slate-900 break-all">{user.email}</div>
                <div className="mt-4 text-xs text-slate-400 font-medium italic flex items-center">
                  <i className="fas fa-lock mr-2"></i> Read-only access
                </div>
              </div>
              <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-100 transition-colors relative group">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Payment Phone (M-Pesa)</span>
                {isEditingPhone ? (
                  <div className="flex items-center space-x-2 animate-slide-up">
                    <input 
                      type="tel"
                      className="bg-white border border-emerald-200 rounded-xl px-4 py-2 font-black text-lg text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none w-full"
                      value={pendingPhone}
                      onChange={e => setPendingPhone(e.target.value)}
                    />
                    <button onClick={() => setIsReauthOpen(true)} className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100" title="Save Changes">
                      <i className="fas fa-check"></i>
                    </button>
                    <button onClick={() => { setIsEditingPhone(false); setPendingPhone(user.phoneNumber); }} className="bg-slate-200 text-slate-500 p-2 rounded-xl hover:bg-slate-300 transition-colors" title="Cancel">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="font-black text-lg text-slate-900">{user.phoneNumber}</div>
                    <button onClick={() => setIsEditingPhone(true)} className="text-emerald-600 hover:text-emerald-700 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                      <i className="fas fa-pen mr-1"></i> Edit
                    </button>
                  </div>
                )}
                <div className="mt-4 text-xs text-slate-400 font-medium italic flex items-center">
                  <i className="fas fa-money-bill-transfer mr-2"></i> Payout destination
                </div>
              </div>
            </div>

            <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-3xl flex items-start space-x-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                <i className="fas fa-circle-info"></i>
              </div>
              <p className="text-sm text-blue-700 font-medium leading-relaxed">
                Core account identifiers like <b>Username</b> and <b>Email</b> are locked to maintain network integrity. To request a change, please contact Admin support.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 space-y-8 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Access Security</h3>
                <p className="text-slate-500 text-sm font-medium">Update your account password regularly.</p>
              </div>
              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                <i className="fas fa-shield-halved"></i>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-2xl">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Current Password</label>
                <div className="relative">
                  <input 
                    type={showOld ? "text" : "password"} 
                    required 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all pr-12 font-medium"
                    placeholder="Enter current password to verify"
                    value={passwordForm.oldPassword}
                    onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                  />
                  <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors">
                    <i className={`fas ${showOld ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
                  <div className="relative">
                    <input 
                      type={showNew ? "text" : "password"} 
                      required 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all pr-12 font-medium"
                      placeholder="Min 6 characters"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors">
                      <i className={`fas ${showNew ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    required 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                    placeholder="Repeat new password"
                    value={passwordForm.confirmNewPassword}
                    onChange={e => setPasswordForm({...passwordForm, confirmNewPassword: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isUpdating}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isUpdating ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : null}
                <span>Update Access Key</span>
              </button>
            </form>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 space-y-8 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Premium Support</h3>
                <p className="text-slate-500 text-sm font-medium">Direct line to our technical assistants.</p>
              </div>
              <div className="flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>Staff Online</span>
              </div>
            </div>

            <form onSubmit={handleSupportSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5 opacity-60">
                  <label className="text-sm font-bold text-slate-700">Reply Contact (Verified)</label>
                  <input type="email" readOnly className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl cursor-not-allowed font-bold" value={user.email} />
                </div>
                <div className="space-y-1.5 opacity-60">
                  <label className="text-sm font-bold text-slate-700">Account Phone (Verified)</label>
                  <input type="tel" readOnly className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl cursor-not-allowed font-bold" value={user.phoneNumber} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Issue Category</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 font-bold transition-all appearance-none cursor-pointer"
                  value={supportForm.category}
                  onChange={e => setSupportForm({...supportForm, category: e.target.value})}
                >
                  <option>Technical</option>
                  <option>Billing</option>
                  <option>Account</option>
                  <option>Referral</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Describe your request</label>
                <textarea 
                  rows={5} 
                  required 
                  placeholder="Tell us more about how we can help..." 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 resize-none font-medium transition-all"
                  value={supportForm.message}
                  onChange={e => setSupportForm({...supportForm, message: e.target.value})}
                ></textarea>
              </div>

              <div className="flex flex-col items-center space-y-4 pt-4">
                <button 
                  type="submit" 
                  disabled={isUpdating} 
                  className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isUpdating ? 'Transmitting Ticket...' : 'Send Support Request'}
                </button>
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                  Hourly limit active: One ticket per session
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
