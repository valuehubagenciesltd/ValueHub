
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import * as fbFirestore from 'firebase/firestore';
const { collection, onSnapshot, query, where, doc, updateDoc, arrayUnion } = fbFirestore as any;
import { User, Transaction, WithdrawalRequest, Announcement } from '../../types';
import { MIN_WITHDRAWAL, WITHDRAWAL_TRANSACTION_FEE, WITHDRAWAL_MAINTENANCE_FEE, REFERRAL_BONUS_L1, REFERRAL_BONUS_L2 } from '../../constants';
import { useToast } from '../../context/ToastContext';

interface DashboardProps {
  user: User;
  transactions: Transaction[];
  withdrawalRequests: WithdrawalRequest[];
  onWithdraw: (amount: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, transactions, withdrawalRequests, onWithdraw }) => {
  const toast = useToast();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(MIN_WITHDRAWAL);
  const [isCopying, setIsCopying] = useState(false);
  const withdrawModalRef = useRef<HTMLDivElement>(null);
  const [isAnnouncementExpanded, setIsAnnouncementExpanded] = useState(false);

  // Announcement State
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    // Removed orderBy to avoid the requirement for a composite index
    const annQuery = query(collection(db, 'announcements'), where('active', '==', true));
    const unsubscribe = onSnapshot(annQuery, (snapshot) => {
      const anns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      
      // Sort client-side by timestamp descending
      anns.sort((a, b) => b.timestamp - a.timestamp);
      
      // Find the first announcement that the user hasn't dismissed yet
      const undismissed = anns.find(ann => !user.dismissedAnnouncements?.includes(ann.id));
      setActiveAnnouncement(undismissed || null);
    });

    return () => unsubscribe();
  }, [user.dismissedAnnouncements]);

  const handleDismissAnnouncement = async () => {
    if (!activeAnnouncement) return;
    try {
      await updateDoc(doc(db, 'users', user.id), {
        dismissedAnnouncements: arrayUnion(activeAnnouncement.id)
      });
      setActiveAnnouncement(null);
      setIsAnnouncementExpanded(false);
    } catch (err) {
      console.error("Dismissal failed", err);
    }
  };

  const referralLink = `${window.location.origin}/#/signup?ref=${encodeURIComponent(user.username || user.username_lowercase || '')}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopying(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setIsCopying(false), 2000);
  };

  const handleWithdrawClick = () => {
    if (user.balance < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is Ksh ${MIN_WITHDRAWAL}`);
      return;
    }
    setIsWithdrawModalOpen(true);
  };

  // When modal opens, scroll it into view (e.g. on mobile after scrolling down to tap Withdraw)
  useEffect(() => {
    if (!isWithdrawModalOpen) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const t = setTimeout(() => {
      withdrawModalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    return () => clearTimeout(t);
  }, [isWithdrawModalOpen]);

  const confirmWithdraw = async () => {
    if (withdrawAmount > user.balance) {
      toast.error('Insufficient balance.');
      return;
    }
    if (withdrawAmount < MIN_WITHDRAWAL) {
      toast.error(`Minimum is Ksh ${MIN_WITHDRAWAL}`);
      return;
    }
    
    try {
      await onWithdraw(withdrawAmount);
      toast.success('Withdrawal request submitted! Admin will review it shortly.');
      setIsWithdrawModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request.');
    }
  };

  const activeRequests = withdrawalRequests.filter(r => r.status === 'PENDING' || r.status === 'PROCESSING');

  // Hide transaction cost and maintenance entries from user's ledger
  const userVisibleTransactions = transactions.filter(tx => !tx.hideFromAdminLedger);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up">
      
      {/* Announcement Banner (Admin Briefing) - Replaces the Modal */}
      {activeAnnouncement && (
        <div className={`mb-8 p-6 rounded-[2rem] border transition-all duration-300 relative overflow-hidden ${
          activeAnnouncement.type === 'INFO' ? 'bg-emerald-50/80 border-emerald-100 text-emerald-900' :
          activeAnnouncement.type === 'WARNING' ? 'bg-amber-50/80 border-amber-100 text-amber-900' :
          'bg-red-50/80 border-red-100 text-red-900'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
              activeAnnouncement.type === 'INFO' ? 'bg-emerald-600 text-white' :
              activeAnnouncement.type === 'WARNING' ? 'bg-amber-500 text-white' :
              'bg-red-600 text-white'
            }`}>
              <i className={`fas ${activeAnnouncement.type === 'INFO' ? 'fa-bullhorn' : 'fa-triangle-exclamation'}`}></i>
            </div>
            <div className="flex-grow pr-8">
              <h3 className="font-black text-sm uppercase tracking-widest mb-1 opacity-80">Admin Briefing</h3>
              <h4 className="text-lg font-black tracking-tight mb-2">{activeAnnouncement.title}</h4>
              <p className={`text-sm font-medium leading-relaxed opacity-90 transition-all ${isAnnouncementExpanded ? '' : 'line-clamp-3'}`}>
                {activeAnnouncement.message}
              </p>
              
              <div className="mt-4 flex flex-wrap items-center gap-4">
                {activeAnnouncement.message.length > 150 && (
                  <button 
                    onClick={() => setIsAnnouncementExpanded(!isAnnouncementExpanded)}
                    className="text-xs font-black uppercase tracking-widest flex items-center hover:opacity-70 transition-opacity"
                  >
                    {isAnnouncementExpanded ? (
                      <><i className="fas fa-chevron-up mr-2"></i> Show Less</>
                    ) : (
                      <><i className="fas fa-chevron-down mr-2"></i> Read More</>
                    )}
                  </button>
                )}
                <button 
                  onClick={handleDismissAnnouncement}
                  className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all ${
                    activeAnnouncement.type === 'INFO' ? 'bg-emerald-600/10 border-emerald-200 hover:bg-emerald-600 hover:text-white' :
                    activeAnnouncement.type === 'WARNING' ? 'bg-amber-500/10 border-amber-200 hover:bg-amber-500 hover:text-white' :
                    'bg-red-600/10 border-red-200 hover:bg-red-600 hover:text-white'
                  }`}
                >
                  Clear Briefing
                </button>
              </div>
            </div>
            
            {/* Visual background icon decoration */}
            <div className="absolute -right-4 -top-4 opacity-5 text-8xl pointer-events-none">
              <i className={`fas ${activeAnnouncement.type === 'INFO' ? 'fa-bullhorn' : 'fa-triangle-exclamation'}`}></i>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Hello, {user.username}! 👋</h1>
        <p className="text-slate-500 font-medium">Welcome to your dashboard.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-emerald-200 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm font-medium">Available Balance</span>
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <i className="fas fa-wallet"></i>
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">Ksh {user.balance.toLocaleString()}</div>
          </div>
          <button 
            onClick={handleWithdrawClick}
            className="mt-6 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-100 active:scale-95"
          >
            Withdraw Now
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">Total Earnings</span>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <i className="fas fa-chart-bar"></i>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">Ksh {user.totalEarnings.toLocaleString()}</div>
          <div className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lifetime platform earnings</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">Total Withdrawn</span>
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
              <i className="fas fa-money-bill-transfer"></i>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">Ksh {user.totalWithdrawn.toLocaleString()}</div>
          <div className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total processed payouts</div>
        </div>
      </div>

      {activeRequests.length > 0 && (
        <div className="mb-8 space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Payout Progress</h3>
          {activeRequests.map(req => (
            <div key={req.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${req.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                  <i className={`fas ${req.status === 'PENDING' ? 'fa-clock' : 'fa-spinner fa-spin'}`}></i>
                </div>
                <div>
                  <div className="font-black text-slate-900 tracking-tight">Withdrawal Request: Ksh {req.amount}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Status: <span className={req.status === 'PENDING' ? 'text-amber-500' : 'text-blue-500'}>{req.status}</span>
                  </div>
                </div>
              </div>
              <div className="text-slate-400 text-xs font-medium italic">
                Admin is reviewing your request. Payments are typically processed within 24 hours.
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-blue-800 p-8 rounded-3xl shadow-xl shadow-emerald-200/50 text-white mb-8 overflow-hidden relative group">
        <div className="relative z-10">
          <div className="inline-flex items-center px-3 py-1 bg-amber-400/20 rounded-full border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-4">
            <i className="fas fa-star mr-1.5"></i> High Payout referral program
          </div>
          <h2 className="text-2xl font-black mb-2 tracking-tight">Expand Your Network</h2>
          <p className="text-emerald-50/80 text-sm mb-8 max-w-md font-medium leading-relaxed">
            Invite friends to Valuehub. Earn <span className="text-amber-300 font-black">{REFERRAL_BONUS_L1} Ksh</span> for direct referrals and <span className="text-blue-300 font-black">{REFERRAL_BONUS_L2} Ksh</span> for indirect activations.
          </p>
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex-grow border border-white/20 font-mono text-xs flex items-center">
              <span className="opacity-90 select-all leading-relaxed break-all">{referralLink}</span>
            </div>
            <button 
              onClick={handleCopyLink}
              className={`px-8 py-4 rounded-2xl font-black transition-all whitespace-nowrap shadow-xl flex items-center justify-center ${
                isCopying ? 'bg-white text-emerald-900 scale-95' : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20 active:scale-95'
              }`}
            >
              {isCopying ? <><i className="fas fa-check mr-2"></i>Link Copied</> : <><i className="fas fa-copy mr-2"></i>Copy Link</>}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Financial Ledger</h3>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Immutable Records</div>
        </div>
        <div className="overflow-x-auto">
          {userVisibleTransactions.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-6 py-4">Event Details</th>
                  <th className="px-6 py-4">Impact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {userVisibleTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 uppercase tracking-tight">{tx.description}</div>
                      <div className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter flex items-center">
                         <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                           tx.type === 'EARNING' ? 'bg-emerald-400' :
                           tx.type === 'WITHDRAWAL' ? 'bg-amber-400' :
                           tx.type === 'REFERRAL_BONUS' ? 'bg-blue-400' :
                           'bg-slate-400'
                         }`}></span>
                         {tx.type} • ID: {tx.id.substring(0,6)}
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-black ${tx.amount > 0 ? 'text-emerald-600' : tx.amount < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {tx.amount === 0 ? '--' : (tx.amount > 0 ? `+${tx.amount}` : tx.amount)} <span className="text-[10px]">KSH</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                        tx.amount > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 
                        tx.amount < 0 ? 'bg-red-50 text-red-800 border border-red-100' :
                        'bg-blue-50 text-blue-800 border border-blue-100'
                      }`}>
                        {tx.amount > 0 ? 'Inflow' : tx.amount < 0 ? 'Deduction' : 'Verified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400 font-medium text-xs">
                      {new Date(tx.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <i className="fas fa-receipt text-2xl"></i>
              </div>
              <p className="text-slate-400 font-bold text-sm">No activity recorded in your ledger yet.</p>
            </div>
          )}
        </div>
      </div>

      {isWithdrawModalOpen && (
        <div 
          ref={withdrawModalRef}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md transition-opacity"
          onClick={() => setIsWithdrawModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200/80"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header strip */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 pt-8 pb-10 text-white">
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white/90 transition-colors"
                aria-label="Close"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <i className="fas fa-wallet text-2xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Withdraw to M-Pesa</h3>
                  <p className="text-emerald-100 text-sm font-medium mt-0.5">Min Ksh {MIN_WITHDRAWAL} • You receive amount minus fees</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Destination */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <i className="fas fa-mobile-screen"></i>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payout to</p>
                  <p className="font-black text-slate-900 truncate">{user.phoneNumber}</p>
                  <p className="text-xs text-slate-500 font-medium">Via M-Pesa after Admin approval</p>
                </div>
              </div>

              {/* Amount input */}
              <div className="mb-6">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Amount (Ksh)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">Ksh</span>
                  <input
                    type="number"
                    min={MIN_WITHDRAWAL}
                    max={user.balance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-black text-2xl text-slate-900 outline-none transition-all"
                  />
                </div>
                {/* Quick amounts */}
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => setWithdrawAmount(MIN_WITHDRAWAL)} className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black transition-colors">
                    Min
                  </button>
                  <button type="button" onClick={() => setWithdrawAmount(Math.max(MIN_WITHDRAWAL, Math.floor(user.balance / 2)))} className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black transition-colors">
                    Half
                  </button>
                  <button type="button" onClick={() => setWithdrawAmount(user.balance)} className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black transition-colors">
                    Max
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-semibold">Balance</span>
                  <span className="font-black text-slate-900">Ksh {user.balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-semibold">Fee (Ksh {WITHDRAWAL_TRANSACTION_FEE + WITHDRAWAL_MAINTENANCE_FEE})</span>
                  <span className="font-bold text-slate-600">− Ksh {WITHDRAWAL_TRANSACTION_FEE + WITHDRAWAL_MAINTENANCE_FEE}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-700 font-black">You receive</span>
                  <span className="font-black text-emerald-600 text-lg">Ksh {Math.max(0, withdrawAmount - WITHDRAWAL_TRANSACTION_FEE - WITHDRAWAL_MAINTENANCE_FEE).toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmWithdraw}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/30 transition-all active:scale-[0.98]"
                >
                  Submit withdrawal request
                </button>
                <button
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="w-full py-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-black hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
