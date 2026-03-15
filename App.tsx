
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { HashRouter, Routes, Route, Navigate, useNavigate } = ReactRouterDOM as any;
import { auth, db, onAuthStateChanged, signOut } from './firebase';
import * as fbFirestore from 'firebase/firestore';
const { doc, onSnapshot, updateDoc, collection, addDoc, increment, query, where } = fbFirestore as any;
import { User, Transaction, WithdrawalRequest } from './types';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/UI/ToastContainer';

// Components
import Header from './components/Header';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import Dashboard from './components/Dashboard/Dashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import Settings from './components/Auth/Settings';
import EarnHub from './components/Earn/EarnHub';
import PlaceholderFeature from './components/Features/PlaceholderFeature';
import Terms from './components/Legal/Terms';
import Privacy from './components/Legal/Privacy';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  
  const userUnsubscribeRef = useRef<(() => void) | null>(null);
  const txUnsubscribeRef = useRef<(() => void) | null>(null);
  const wrUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 6000);

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      clearTimeout(safetyTimeout);

      if (userUnsubscribeRef.current) userUnsubscribeRef.current();
      if (txUnsubscribeRef.current) txUnsubscribeRef.current();
      if (wrUnsubscribeRef.current) wrUnsubscribeRef.current();

      if (fbUser) {
        try {
          // Listen to User Data
          const userDocRef = doc(db, 'users', fbUser.uid);
          userUnsubscribeRef.current = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setCurrentUser({ id: fbUser.uid, ...docSnap.data() } as User);
            }
          });

          // Listen to User Transactions
          const txRef = collection(db, 'transactions');
          const txQuery = query(txRef, where('userId', '==', fbUser.uid));
          txUnsubscribeRef.current = onSnapshot(txQuery, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
            setTransactions(txs.sort((a, b) => b.timestamp - a.timestamp));
          });

          // Listen to User Withdrawal Requests
          const wrRef = collection(db, 'withdrawal_requests');
          const wrQuery = query(wrRef, where('userId', '==', fbUser.uid));
          wrUnsubscribeRef.current = onSnapshot(wrQuery, (snapshot) => {
            const wrs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest));
            setWithdrawalRequests(wrs.sort((a, b) => b.timestamp - a.timestamp));
          });

        } catch (error) {
          console.error("Error setting up listeners:", error);
        }
      } else {
        setCurrentUser(null);
        setTransactions([]);
        setWithdrawalRequests([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (userUnsubscribeRef.current) userUnsubscribeRef.current();
      if (txUnsubscribeRef.current) txUnsubscribeRef.current();
      if (wrUnsubscribeRef.current) wrUnsubscribeRef.current();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const handleLogout = async () => {
    if (userUnsubscribeRef.current) userUnsubscribeRef.current();
    if (txUnsubscribeRef.current) txUnsubscribeRef.current();
    if (wrUnsubscribeRef.current) wrUnsubscribeRef.current();
    await signOut(auth);
    navigate('/login', { replace: true });
  };

  const handleWithdraw = async (amount: number) => {
    if (!currentUser) return;
    
    const now = Date.now();
    const threeHours = 3 * 60 * 60 * 1000;
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    // 1. Check Frequency (Max 2 per day)
    const todayRequests = withdrawalRequests.filter(r => r.timestamp >= startOfToday);
    if (todayRequests.length >= 2) {
      throw new Error("Withdrawal Limit Reached: You can only request up to 2 withdrawals per day.");
    }

    // 2. Check Interval (Min 3 hours)
    // Note: withdrawalRequests is already sorted descending [0] is latest
    const latestRequest = withdrawalRequests[0];
    if (latestRequest && (now - latestRequest.timestamp < threeHours)) {
      const remaining = Math.ceil((threeHours - (now - latestRequest.timestamp)) / (60 * 1000));
      throw new Error(`Time Constraint: Please wait another ${remaining} minutes before requesting again.`);
    }
    
    try {
      // 3. Deduct from balance immediately to "lock" the funds
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        balance: increment(-amount)
      });

      // 4. Create the manual request
      await addDoc(collection(db, 'withdrawal_requests'), {
        userId: currentUser.id,
        username: currentUser.username,
        phoneNumber: currentUser.phoneNumber,
        amount: amount,
        status: 'PENDING',
        timestamp: now
      });

      // 5. Add a pending transaction for ledger visibility
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.id,
        amount: -amount,
        type: 'WITHDRAWAL',
        description: `Withdrawal request for Ksh ${amount} (Pending Review)`,
        timestamp: now
      });

    } catch (error) {
      console.error("Withdrawal request error:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="mt-6 text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">
          Connecting to Valuehub
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {currentUser && <Header onLogout={handleLogout} user={currentUser} />}
      
      <main className={`flex-grow ${currentUser ? 'pb-24 md:pb-0' : ''}`}>
        <Routes>
              <Route path="/login" element={currentUser ? <Navigate to="/dashboard" /> : <Login />} />
              <Route path="/signup" element={currentUser ? <Navigate to="/dashboard" /> : <Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              
              <Route 
                path="/dashboard" 
                element={
                  currentUser ? (
                    <Dashboard 
                      user={currentUser} 
                      transactions={transactions}
                      withdrawalRequests={withdrawalRequests}
                      onWithdraw={handleWithdraw}
                    />
                  ) : <Navigate to="/login" />
                } 
              />

              <Route path="/earn" element={currentUser ? <EarnHub /> : <Navigate to="/login" />} />
              <Route path="/settings" element={currentUser ? <Settings user={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/admin" element={(currentUser?.role === 'chief' || currentUser?.role === 'dev') ? <AdminDashboard currentUser={currentUser} /> : <Navigate to="/dashboard" />} />

              <Route path="/spinning" element={<PlaceholderFeature title="Spin & Win" variant="spin" />} />
              <Route path="/survey" element={<PlaceholderFeature title="Paid Surveys" variant="surveys" />} />
              <Route path="/writing" element={<PlaceholderFeature title="Article Writing" variant="writing" />} />
              <Route path="/youtube" element={
                <PlaceholderFeature
                  title="YouTube Rewards"
                  variant="youtube"
                  youtubeVideos={[
                    { title: 'Valuehub – How to earn', url: 'https://youtu.be/MBxjPb8hRws?si=gKxUD0W3qGOmsy8f' },
                    { title: 'Getting started guide', url: 'https://youtu.be/y90R_2je0kk?si=RNhG758LYy-Zo7Kw' },
                    { title: 'Tips and tricks', url: 'https://youtu.be/ICU-j1pItlA?si=mirlbFvLTiigY5S7' }
                  ]}
                />
              } />

              <Route path="/chat" element={<PlaceholderFeature title="Chat with Lonely People" variant="chat" />} />

              <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} />} />
        </Routes>
      </main>

      <footer className={`bg-white border-t border-slate-200 py-6 text-center text-slate-500 text-sm ${currentUser ? 'hidden md:block' : ''}`}>
        <p>© 2026 Valuehub. All rights reserved.</p>
        <p className="mt-1">
          Powered by{' '}
          <a href="https://cosnametech.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Cosname Technologies
          </a>
        </p>
      </footer>
      <ToastContainer />
    </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <HashRouter>
      <AppContent />
    </HashRouter>
  </ToastProvider>
);

export default App;
