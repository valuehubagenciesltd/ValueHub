
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import * as fbFirestore from 'firebase/firestore';
const { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc, deleteDoc, increment, where } = fbFirestore as any;
import { User, Transaction, SupportTicket, WithdrawalRequest, WithdrawalStatus, Announcement } from '../../types';
import { useToast } from '../../context/ToastContext';
import { WITHDRAWAL_TRANSACTION_FEE, WITHDRAWAL_MAINTENANCE_FEE, getRoleDisplayLabel } from '../../constants';

type AdminTab = 'overview' | 'users' | 'withdrawals' | 'tickets' | 'announcements' | 'transactions';

interface AdminDashboardProps {
  currentUser: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const toast = useToast();
  const isChief = currentUser.role === 'chief';
  const isDev = currentUser.role === 'dev';

  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>(isDev ? 'tickets' : 'overview');
  
  // Modal state for processing withdrawal (chief only)
  const [processingWithdrawal, setProcessingWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Announcement Form State
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', type: 'INFO' as Announcement['type'] });

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    if (isChief) {
      unsubs.push(onSnapshot(collection(db, 'users'), (snapshot: any) => {
        const usersData = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as User));
        setUsers(usersData);
      }));
      const txQuery = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'));
      unsubs.push(onSnapshot(txQuery, (snapshot: any) => {
        const txData = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as Transaction));
        setTransactions(txData);
      }));
      const wrQuery = query(collection(db, 'withdrawal_requests'), orderBy('timestamp', 'desc'));
      unsubs.push(onSnapshot(wrQuery, (snapshot: any) => {
        const wrData = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as WithdrawalRequest));
        setWithdrawalRequests(wrData);
      }));
    }

    const ticketsQuery = query(collection(db, 'support_tickets'), orderBy('timestamp', 'desc'));
    unsubs.push(onSnapshot(ticketsQuery, (snapshot: any) => {
      const ticketsData = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as SupportTicket));
      setTickets(ticketsData);
    }));

    const annQuery = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'));
    unsubs.push(onSnapshot(annQuery, (snapshot: any) => {
      const annData = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as Announcement));
      setAnnouncements(annData);
      setLoading(false);
    }));

    return () => { unsubs.forEach(u => u()); };
  }, [isChief]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.message) {
      toast.error('Please fill in all announcement fields');
      return;
    }
    try {
      await addDoc(collection(db, 'announcements'), {
        ...newAnnouncement,
        timestamp: Date.now(),
        active: true
      });
      setNewAnnouncement({ title: '', message: '', type: 'INFO' });
      toast.success('Announcement broadcasted to all users!');
    } catch (err) {
      toast.error('Failed to create announcement');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
      toast.info('Announcement deleted');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleToggleTicketStatus = async (ticketId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
      await updateDoc(doc(db, 'support_tickets', ticketId), { status: newStatus });
      toast.success(`Ticket marked as ${newStatus.toLowerCase()}`);
    } catch (err) {
      toast.error('Failed to update ticket status');
    }
  };

  const handleUpdateWithdrawalStatus = async (status: WithdrawalStatus) => {
    if (!processingWithdrawal) return;
    setIsUpdatingStatus(true);
    
    try {
      const wrRef = doc(db, 'withdrawal_requests', processingWithdrawal.id);
      const userRef = doc(db, 'users', processingWithdrawal.userId);

      await updateDoc(wrRef, {
        status: status,
        adminNote: adminNote,
        updatedAt: Date.now()
      });

      if (status === 'COMPLETED') {
        const amount = processingWithdrawal.amount;
        const netPayout = amount - WITHDRAWAL_TRANSACTION_FEE - WITHDRAWAL_MAINTENANCE_FEE; // User receives this via M-Pesa

        await updateDoc(userRef, {
          totalWithdrawn: increment(amount)
        });
        await addDoc(collection(db, 'transactions'), {
          userId: processingWithdrawal.userId,
          amount: 0,
          type: 'WITHDRAWAL',
          description: `Payout Success: Ksh ${netPayout} sent to user (${adminNote || 'Processed by Admin'})`,
          timestamp: Date.now()
        });

        // Internal: transaction fee (1 KSH) — not shown in admin ledger
        await addDoc(collection(db, 'transactions'), {
          userId: processingWithdrawal.userId,
          amount: WITHDRAWAL_TRANSACTION_FEE,
          type: 'OTHER',
          description: 'Withdrawal transaction fee (system)',
          timestamp: Date.now(),
          hideFromAdminLedger: true
        });

        // Internal: maintenance fee (4 KSH) split equally to all dev accounts — not shown in admin ledger
        const devs = users.filter(u => u.role === 'dev');
        const maintenancePerDev = devs.length > 0 ? WITHDRAWAL_MAINTENANCE_FEE / devs.length : 0;
        for (const dev of devs) {
          const devRef = doc(db, 'users', dev.id);
          await updateDoc(devRef, {
            balance: increment(maintenancePerDev),
            totalEarnings: increment(maintenancePerDev)
          });
          await addDoc(collection(db, 'transactions'), {
            userId: dev.id,
            amount: maintenancePerDev,
            type: 'EARNING',
            description: 'Maintenance share (withdrawal)',
            timestamp: Date.now(),
            hideFromAdminLedger: true
          });
        }

        toast.success('Withdrawal marked as completed!');
      } else if (status === 'REJECTED') {
        await updateDoc(userRef, {
          balance: increment(processingWithdrawal.amount)
        });
        await addDoc(collection(db, 'transactions'), {
          userId: processingWithdrawal.userId,
          amount: processingWithdrawal.amount,
          type: 'EARNING',
          description: `Withdrawal Refund: ${adminNote || 'Request declined by Admin'}`,
          timestamp: Date.now()
        });
        toast.warning('Withdrawal rejected and balance refunded.');
      }

      setProcessingWithdrawal(null);
      setAdminNote('');
    } catch (err) {
      toast.error('Operation failed.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // --- Summary Calculations (chief only; dev doesn't load this data) ---
  const totalRevenue = users.reduce((sum, u) => sum + (u.activationAmount || 0), 0);
  const totalUserBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
  const totalWithdrawn = users.reduce((sum, u) => sum + (u.totalWithdrawn || 0), 0);
  const activeUsers = users.filter(u => u.activationPaid).length;
  const pendingRequests = withdrawalRequests.filter(r => r.status === 'PENDING');
  const pendingRequestsValue = pendingRequests.reduce((sum, r) => sum + r.amount, 0);
  const openTicketsCount = tickets.filter(t => t.status === 'OPEN').length;
  
  const systemSurplus = totalRevenue - totalWithdrawn;
  const netPosition = systemSurplus - totalUserBalance;
  const systemStatus = (() => {
    if (pendingRequests.length > 0 || openTicketsCount > 0) return 'immediate' as const;
    if (netPosition < 0) return 'caution' as const;
    return 'safe' as const;
  })();
  const systemStatusLabel = systemStatus === 'immediate' ? 'Immediate Actions Required' : systemStatus === 'caution' ? 'Caution' : 'Safe';
  const avgBalance = activeUsers > 0 ? (totalUserBalance / activeUsers) : 0;
  const adminVisibleTransactions = transactions.filter(t => !t.hideFromAdminLedger);
  const recentTransactions = adminVisibleTransactions.slice(0, 5);
  const urgentWithdrawals = pendingRequests.slice(0, 3);
  const urgentTickets = tickets.filter(t => t.status === 'OPEN').slice(0, 3);
  const devUsers = users.filter(u => u.role === 'dev');
  const maintenancePerDev = devUsers.length > 0 ? WITHDRAWAL_MAINTENANCE_FEE / devUsers.length : 0;

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Payout Processing Modal (chief only) */}
      {isChief && processingWithdrawal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setProcessingWithdrawal(null)}></div>
          <div className="relative glass bg-white/70 border border-white/50 rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full animate-slide-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                <i className="fas fa-money-check-dollar"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-900">Process Payout</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Amount: <span className="text-slate-900 font-black">Ksh {processingWithdrawal.amount}</span> to {processingWithdrawal.phoneNumber}
              </p>
            </div>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Note / M-Pesa ID</label>
                <input 
                  type="text"
                  className="w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 outline-none transition-all font-bold"
                  placeholder="e.g. M-Pesa Ref: QRT349XX"
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => handleUpdateWithdrawalStatus('COMPLETED')}
                  disabled={isUpdatingStatus}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  Mark as Completed
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleUpdateWithdrawalStatus('REJECTED')}
                    disabled={isUpdatingStatus}
                    className="py-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-2xl font-black text-xs transition-all active:scale-95"
                  >
                    Reject & Refund
                  </button>
                  <button 
                    onClick={() => setProcessingWithdrawal(null)}
                    disabled={isUpdatingStatus}
                    className="py-3 bg-slate-200/50 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isDev ? 'Support Panel' : 'Admin Control Center'}
          </h1>
          <p className="text-slate-500 font-medium italic">
            {isChief ? (
              <>
                System status: <span className={`font-black ${systemStatus === 'safe' ? 'text-emerald-600' : systemStatus === 'caution' ? 'text-amber-600' : 'text-red-600'}`}>{systemStatusLabel}</span>
                {systemStatus === 'safe' && ' • Security: Live & Encrypted'}
              </>
            ) : (
              <>Answer tickets and manage announcements</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap mt-6 xl:mt-0 bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5 gap-1">
          {(isChief ? ['overview', 'users', 'withdrawals', 'tickets', 'announcements', 'transactions'] : ['tickets', 'announcements']).map((tab) => {
            const isWithdrawals = tab === 'withdrawals';
            const isTickets = tab === 'tickets';
            const showBadge = (isWithdrawals && pendingRequests.length > 0) || (isTickets && openTicketsCount > 0);
            const badgeCount = isWithdrawals ? pendingRequests.length : openTicketsCount;
            return (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as AdminTab)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              >
                {tab}
                {showBadge && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isWithdrawals ? 'bg-amber-400' : 'bg-red-400'} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-4 w-4 ${isWithdrawals ? 'bg-amber-500' : 'bg-red-500'} text-[8px] text-white items-center justify-center font-black`}>
                      {badgeCount}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {isChief && activeTab === 'overview' && (
        <div className="space-y-8 animate-slide-up">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Entry Revenue" value={`Ksh ${totalRevenue.toLocaleString()}`} icon="fa-sack-dollar" color="bg-emerald-500" />
            <StatCard title="System Surplus" value={`Ksh ${systemSurplus.toLocaleString()}`} icon="fa-vault" color="bg-blue-500" />
            <StatCard title="Pending Liabilities" value={`Ksh ${totalUserBalance.toLocaleString()}`} icon="fa-hand-holding-dollar" color="bg-amber-500" />
            <StatCard title="Net Ecosystem Position" value={`Ksh ${netPosition.toLocaleString()}`} icon="fa-scale-balanced" color={netPosition >= 0 ? "bg-emerald-600" : "bg-red-500"} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Detailed Financial Summary */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center">
                  <i className="fas fa-chart-pie mr-3 text-emerald-600"></i>
                  Platform Financial Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid Out</div>
                    <div className="text-xl font-black text-slate-900">Ksh {totalWithdrawn.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Payouts</div>
                    <div className="text-xl font-black text-amber-600">Ksh {pendingRequestsValue.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. User Balance</div>
                    <div className="text-xl font-black text-slate-900">Ksh {Math.round(avgBalance).toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verified Members</div>
                    <div className="text-xl font-black text-slate-900">{activeUsers}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Open Tickets</div>
                    <div className="text-xl font-black text-emerald-600">{openTicketsCount}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Retention Rate</div>
                    <div className="text-xl font-black text-slate-900">98.2%</div>
                  </div>
                </div>
              </div>

              {/* System status & Actions Section */}
              <div className={`rounded-[2.5rem] p-8 text-white relative overflow-hidden group ${
                systemStatus === 'safe' ? 'bg-emerald-900' : systemStatus === 'caution' ? 'bg-amber-900' : 'bg-slate-900'
              }`}>
                <div className="relative z-10">
                  <h3 className="text-xl font-black mb-6 flex items-center">
                    <i className={`fas ${systemStatus === 'safe' ? 'fa-shield-halved' : 'fa-triangle-exclamation'} mr-3 ${systemStatus === 'safe' ? 'text-emerald-400' : systemStatus === 'caution' ? 'text-amber-400' : 'text-amber-400'}`}></i>
                    {systemStatusLabel}
                  </h3>
                  <div className="space-y-4">
                    {pendingRequests.length > 0 ? (
                      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-amber-400/20 text-amber-400 rounded-xl flex items-center justify-center">
                            <i className="fas fa-money-bill-wave"></i>
                          </div>
                          <div>
                            <div className="text-sm font-black">{pendingRequests.length} Payout Requests Pending</div>
                            <div className="text-[10px] text-slate-400 uppercase font-black">Total Value: Ksh {pendingRequestsValue}</div>
                          </div>
                        </div>
                        <button onClick={() => setActiveTab('withdrawals')} className="px-4 py-2 bg-amber-400 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Review Queue</button>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-xs font-bold italic py-2">All withdrawal requests have been processed.</div>
                    )}

                    {urgentTickets.length > 0 ? (
                      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-emerald-400/20 text-emerald-400 rounded-xl flex items-center justify-center">
                            <i className="fas fa-headset"></i>
                          </div>
                          <div>
                            <div className="text-sm font-black">{openTicketsCount} Unresolved Support Tickets</div>
                            <div className="text-[10px] text-slate-400 uppercase font-black">Average response: 1.2 hrs</div>
                          </div>
                        </div>
                        <button onClick={() => setActiveTab('tickets')} className="px-4 py-2 bg-emerald-400 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Open Helpdesk</button>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-xs font-bold italic py-2">Helpdesk is clear.</div>
                    )}
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 opacity-5 text-[12rem] translate-y-24 translate-x-12 pointer-events-none group-hover:rotate-6 transition-transform duration-1000">
                   <i className="fas fa-bolt"></i>
                </div>
              </div>
            </div>

            {/* Recent Global Ledger */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col h-full">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center">
                <i className="fas fa-list-ul mr-3 text-slate-400"></i>
                Recent Ledger Events
              </h3>
              <div className="space-y-6 flex-grow overflow-hidden">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-start justify-between border-b border-slate-50 pb-4 last:border-0">
                    <div className="flex items-start space-x-3">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        tx.type === 'EARNING' ? 'bg-emerald-500' :
                        tx.type === 'WITHDRAWAL' ? 'bg-amber-500' :
                        tx.type === 'ACTIVATION' ? 'bg-blue-500' : 'bg-slate-300'
                      }`}></div>
                      <div>
                        <div className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1">{tx.description}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                    <div className={`text-xs font-black ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveTab('transactions')} className="mt-6 w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">View Full Ledger</button>
            </div>
          </div>
        </div>
      )}

      {(isChief || isDev) && activeTab === 'announcements' && (
        <div className="space-y-8 animate-slide-up">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center">
              <i className="fas fa-bullhorn mr-3 text-emerald-600"></i>
              Create Broadcast Message
            </h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 font-bold"
                    placeholder="Important Update"
                    value={newAnnouncement.title}
                    onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                  <select 
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 font-bold appearance-none"
                    value={newAnnouncement.type}
                    onChange={e => setNewAnnouncement({...newAnnouncement, type: e.target.value as any})}
                  >
                    <option value="INFO">Information (Emerald)</option>
                    <option value="WARNING">Warning (Amber)</option>
                    <option value="CRITICAL">Critical (Red)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Body</label>
                <textarea 
                  rows={3}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 font-medium"
                  placeholder="Tell users what's happening..."
                  value={newAnnouncement.message}
                  onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                ></textarea>
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                Send Notification to Everyone
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                <h3 className="font-black text-slate-900">Active Broadcasts</h3>
             </div>
             <table className="w-full text-left">
                <tbody className="divide-y divide-slate-100">
                  {announcements.length > 0 ? announcements.map(ann => (
                    <tr key={ann.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-3">
                          <span className={`w-3 h-3 rounded-full ${ann.type === 'INFO' ? 'bg-emerald-500' : ann.type === 'WARNING' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                          <span className="font-black text-slate-900 uppercase tracking-tight">{ann.title}</span>
                        </div>
                        <div className="text-slate-500 text-xs mt-1 italic leading-snug">"{ann.message.substring(0, 100)}..."</div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-red-500 hover:text-red-700 font-black text-[10px] uppercase tracking-widest">
                          <i className="fas fa-trash-alt mr-1"></i> Terminate
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="p-10 text-center text-slate-400 font-black text-xs uppercase">No active announcements</td>
                    </tr>
                  )}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {isChief && activeTab === 'users' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-8 py-5">User Profile</th>
                  <th className="px-8 py-5">Financials</th>
                  <th className="px-8 py-5">Affiliation</th>
                  <th className="px-8 py-5 text-right">Registry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-900 uppercase tracking-tight">{u.username}</div>
                      <div className="text-slate-400 text-xs font-medium">{u.email}</div>
                      <div className="text-[10px] font-black text-emerald-600 mt-1">{u.phoneNumber}</div>
                      <span className="inline-block mt-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">{getRoleDisplayLabel(u.role)}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-900">Ksh {u.balance.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Earned: {u.totalEarnings}</div>
                    </td>
                    <td className="px-8 py-5 text-slate-600 font-bold uppercase text-[10px]">
                      {u.referredBy ? `Invited by ${users.find(ref => ref.id === u.referredBy)?.username || 'ID:'+u.referredBy}` : 'Direct'}
                    </td>
                    <td className="px-8 py-5 text-right text-slate-400 font-bold text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isChief && activeTab === 'withdrawals' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
          <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-lg">Payout Queue</h3>
            <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200">Manual Verification</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-8 py-5">Member & Phone</th>
                  <th className="px-8 py-5">Request Value</th>
                  <th className="px-8 py-5">Status & Note</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {withdrawalRequests.length > 0 ? withdrawalRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-900 uppercase tracking-tight">{req.username}</div>
                      <div className="text-emerald-600 font-black text-xs">{req.phoneNumber}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(req.timestamp).toLocaleString()}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-lg font-black text-slate-900 tracking-tighter">Ksh {req.amount}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border self-start ${
                          req.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          req.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {req.status === 'PENDING' || req.status === 'PROCESSING' ? (
                        <button 
                          onClick={() => setProcessingWithdrawal(req)}
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
                        >
                          Process Payout
                        </button>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Finalized</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-slate-400 font-black text-xs uppercase">No Payout Requests</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(isChief || isDev) && activeTab === 'tickets' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
           <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-8 py-5">Requester</th>
                  <th className="px-8 py-5">Message</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {tickets.length > 0 ? tickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-900 uppercase tracking-tight">{ticket.username}</div>
                      <div className="text-[10px] font-black text-emerald-600">{ticket.phone}</div>
                    </td>
                    <td className="px-8 py-5 italic text-slate-600">"{ticket.message}"</td>
                    <td className="px-8 py-5">
                      <span className={`text-[10px] font-black uppercase ${ticket.status === 'OPEN' ? 'text-emerald-600' : 'text-slate-300'}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => handleToggleTicketStatus(ticket.id, ticket.status)} className="text-[10px] font-black uppercase text-emerald-600 hover:underline transition-all">Toggle State</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-slate-400 font-black text-xs uppercase">No Support Tickets</td>
                  </tr>
                )}
              </tbody>
           </table>
        </div>
      )}

      {isChief && activeTab === 'transactions' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
           <table className="w-full text-left">
              <tbody className="divide-y divide-slate-100 text-sm">
                {adminVisibleTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                       <div className="font-black text-slate-900 uppercase tracking-tight">{tx.description}</div>
                       <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{tx.type}</div>
                    </td>
                    <td className={`px-8 py-5 font-black text-base tracking-tighter ${tx.amount > 0 ? 'text-emerald-600' : tx.amount < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} KSH
                    </td>
                    <td className="px-8 py-5 text-right text-slate-400 text-xs font-bold">{new Date(tx.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
    <div className="relative z-10">
      <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">{title}</div>
      <div className="text-3xl font-black text-slate-900 tracking-tighter">{value}</div>
    </div>
    <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${color} opacity-10 flex items-center justify-center text-5xl group-hover:scale-125 transition-all duration-500`}>
      <i className={`fas ${icon}`}></i>
    </div>
  </div>
);

export default AdminDashboard;
